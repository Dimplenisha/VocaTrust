from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import os
import numpy as np
import librosa
import tensorflow as tf
import tempfile
import cv2
import base64
import io
import matplotlib.pyplot as plt


# Create FastAPI app
app = FastAPI(
    title="VocaTrust API"
)


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Get the current backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# Model path
MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "VocaTrust_Multilingual_Fixed.keras"
)


# Load VocaTrust model
print("Loading VocaTrust model...")

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)

print("VocaTrust model loaded successfully!")


# Score-CAM feature extractor
feature_extractor = tf.keras.Model(
    inputs=model.inputs,
    outputs=model.get_layer("conv2d_2").output
)

print("Score-CAM feature extractor ready!")


# Audio settings
TARGET_SR = 16000
TARGET_DURATION = 3
TARGET_LENGTH = TARGET_SR * TARGET_DURATION


# Extract features exactly like the training pipeline
def extract_features(file_path):

    try:

        # Load audio as mono at 16 kHz
        y, sr = librosa.load(
            file_path,
            sr=TARGET_SR,
            mono=True
        )

        # Trim or pad to exactly 3 seconds
        if len(y) > TARGET_LENGTH:

            y = y[:TARGET_LENGTH]

        else:

            y = librosa.util.fix_length(
                y,
                size=TARGET_LENGTH
            )

        # Extract 13 MFCC features
        mfcc = librosa.feature.mfcc(
            y=y,
            sr=sr,
            n_mfcc=13,
            n_fft=1024,
            hop_length=512
        )

        # Extract delta features
        delta = librosa.feature.delta(
            mfcc
        )

        # Extract delta-delta features
        delta2 = librosa.feature.delta(
            mfcc,
            order=2
        )

        # Combine:
        # 13 MFCC
        # 13 Delta
        # 13 Delta-Delta
        # Total = 39 features
        features = np.vstack(
            (
                mfcc,
                delta,
                delta2
            )
        )

        # Model expects exactly 100 frames
        max_len = 100

        if features.shape[1] < max_len:

            features = np.pad(
                features,
                (
                    (0, 0),
                    (0, max_len - features.shape[1])
                ),
                mode="constant"
            )

        else:

            features = features[:, :max_len]

        # Convert to float32
        features = features.astype(
            np.float32
        )

        return features

    except Exception as e:

        print(
            "Feature extraction error:",
            e
        )

        return None


# =========================
# SCORE-CAM
# =========================

def generate_score_cam(input_data):

    try:

        # Get feature maps from the selected convolution layer
        feature_maps = feature_extractor.predict(
            input_data,
            verbose=0
        )

        feature_maps_single = feature_maps[0]

        # Original prediction
        original_prediction = float(
            model.predict(
                input_data,
                verbose=0
            )[0][0]
        )

        # Determine target class
        if original_prediction >= 0.5:

            target_class = "REAL"

        else:

            target_class = "FAKE"

        weights = []

        # Calculate Score-CAM weight for each feature map
        for i in range(
            feature_maps_single.shape[-1]
        ):

            fmap = feature_maps_single[:, :, i]

            # Normalize activation map
            fmap = fmap - np.min(fmap)

            max_value = np.max(fmap)

            if max_value > 0:

                fmap = fmap / max_value

            # Resize activation map to 39 x 100
            mask = cv2.resize(
                fmap,
                (100, 39)
            )

            # Add channel dimension
            mask = np.expand_dims(
                mask,
                axis=-1
            )

            # Apply mask to original input
            masked_sample = (
                input_data[0] * mask
            )

            masked_sample = np.expand_dims(
                masked_sample,
                axis=0
            )

            # Predict masked sample
            masked_prediction = float(
                model.predict(
                    masked_sample,
                    verbose=0
                )[0][0]
            )

            # Use probability of predicted class
            if target_class == "REAL":

                score = masked_prediction

            else:

                score = 1.0 - masked_prediction

            weights.append(
                score
            )

        weights = np.array(
            weights,
            dtype=np.float32
        )

        # Create heatmap
        heatmap = np.zeros(
            feature_maps_single.shape[:2],
            dtype=np.float32
        )

        for i in range(
            feature_maps_single.shape[-1]
        ):

            heatmap += (
                weights[i]
                * feature_maps_single[:, :, i]
            )

        # Normalize heatmap
        heatmap = np.maximum(
            heatmap,
            0
        )

        if np.max(heatmap) > 0:

            heatmap = (
                heatmap
                / np.max(heatmap)
            )

        # Resize to original 39 x 100 feature dimensions
        heatmap_resized = cv2.resize(
            heatmap,
            (100, 39)
        )

        # Normalize again
        if np.max(heatmap_resized) > 0:

            heatmap_resized = (
                heatmap_resized
                / np.max(heatmap_resized)
            )

        # =========================
        # HEATMAP STATISTICS
        # =========================

        peak_attention = float(
            np.max(heatmap_resized)
        )

        mean_attention = float(
            np.mean(heatmap_resized)
        )

        std_attention = float(
            np.std(heatmap_resized)
        )

        # Most important location
        max_index = np.unravel_index(
            np.argmax(heatmap_resized),
            heatmap_resized.shape
        )

        important_feature = int(
            max_index[0]
        )

        important_frame = int(
            max_index[1]
        )

        # =========================
        # FEATURE CONTRIBUTIONS
        # =========================

        mfcc_importance = float(
            np.mean(
                heatmap_resized[0:13, :]
            )
        )

        delta_importance = float(
            np.mean(
                heatmap_resized[13:26, :]
            )
        )

        delta2_importance = float(
            np.mean(
                heatmap_resized[26:39, :]
            )
        )

        total_importance = (
            mfcc_importance
            + delta_importance
            + delta2_importance
        )

        if total_importance > 0:

            mfcc_contribution = (
                mfcc_importance
                / total_importance
                * 100
            )

            delta_contribution = (
                delta_importance
                / total_importance
                * 100
            )

            delta2_contribution = (
                delta2_importance
                / total_importance
                * 100
            )

        else:

            mfcc_contribution = 0
            delta_contribution = 0
            delta2_contribution = 0

        # =========================
        # IMPORTANT TIME REGION
        # =========================

        frame_importance = np.mean(
            heatmap_resized,
            axis=0
        )

        top_frames = np.argsort(
            frame_importance
        )[-3:]

        top_frames = np.sort(
            top_frames
        )

        important_frame_start = int(
            top_frames[0]
        )

        important_frame_end = int(
            top_frames[-1]
        )

        # Determine dominant feature group
        contributions = {
            "MFCC": mfcc_contribution,
            "Delta": delta_contribution,
            "Delta-Delta": delta2_contribution
        }

        dominant_feature = max(
            contributions,
            key=contributions.get
        )

        # =========================
        # CREATE VISUALIZATION
        # =========================

        fig, ax = plt.subplots(
            figsize=(10, 4)
        )

        image = ax.imshow(
            heatmap_resized,
            aspect="auto",
            origin="lower",
            cmap="jet"
        )

        ax.set_xlabel(
            "Time Frames"
        )

        ax.set_ylabel(
            "Acoustic Features"
        )

        ax.set_title(
            "Score-CAM Explanation"
        )

        ax.set_yticks(
            [6, 19, 32]
        )

        ax.set_yticklabels(
            [
                "MFCC",
                "Delta",
                "Delta-Delta"
            ]
        )

        fig.colorbar(
            image,
            ax=ax,
            label="Importance"
        )

        plt.tight_layout()

        # Convert image to Base64
        image_buffer = io.BytesIO()

        plt.savefig(
            image_buffer,
            format="png",
            dpi=150,
            bbox_inches="tight"
        )

        plt.close(fig)

        image_buffer.seek(0)

        heatmap_base64 = base64.b64encode(
            image_buffer.read()
        ).decode("utf-8")

        return {
            "heatmap_image": (
                "data:image/png;base64,"
                + heatmap_base64
            ),

            "peak_attention": round(
                peak_attention,
                6
            ),

            "mean_attention": round(
                mean_attention,
                6
            ),

            "std_attention": round(
                std_attention,
                6
            ),

            "important_feature": (
                important_feature
            ),

            "important_frame": (
                important_frame
            ),

            "important_frame_start": (
                important_frame_start
            ),

            "important_frame_end": (
                important_frame_end
            ),

            "mfcc_contribution": round(
                mfcc_contribution,
                2
            ),

            "delta_contribution": round(
                delta_contribution,
                2
            ),

            "delta_delta_contribution": round(
                delta2_contribution,
                2
            ),

            "dominant_feature": (
                dominant_feature
            ),

            "target_class": target_class
        }

    except Exception as e:

        print(
            "Score-CAM error:",
            e
        )

        return {
            "error": str(e)
        }


# =========================
# HOME ENDPOINT
# =========================

@app.get("/")
def home():

    return {
        "message": "VocaTrust Backend is Running"
    }


# =========================
# PREDICT ENDPOINT
# =========================

@app.post("/predict")
async def predict_audio(
    file: UploadFile = File(...)
):

    # Temporary upload folder
    UPLOAD_FOLDER = tempfile.gettempdir()

    # File path
    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    # Save uploaded audio
    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(
            await file.read()
        )

    # Extract audio features
    features = extract_features(
        file_path
    )

    # Check feature extraction
    if features is None:

        return {
            "error": "Could not process audio file"
        }

    # Add batch dimension
    features = np.expand_dims(
        features,
        axis=0
    )

    # Add channel dimension
    features = np.expand_dims(
        features,
        axis=-1
    )

    print(
        "Model input shape:",
        features.shape
    )

    # Make prediction
    prediction = model.predict(
        features
    )[0][0]

    # Convert prediction to Python float
    prediction = float(
        prediction
    )

    # Determine result
    if prediction >= 0.5:

        result = "REAL"

        confidence = prediction * 100

    else:

        result = "FAKE"

        confidence = (
            1 - prediction
        ) * 100


    # =========================
    # GENERATE SCORE-CAM
    # =========================

    score_cam_result = generate_score_cam(
        features
    )

    print(
        "Score-CAM result:",
        score_cam_result
    )


    # Voice Integrity Score = probability that the voice is REAL
    voice_integrity_score = prediction * 100


    # Risk level
    if voice_integrity_score >= 80:

        risk_level = "Genuine"

    elif voice_integrity_score >= 50:

        risk_level = "Suspicious"

    else:

        risk_level = "High Risk"


    # =========================
    # RETURN COMPLETE RESULT
    # =========================

    return {

        "filename": file.filename,

        "prediction": result,

        "confidence": round(
            float(confidence),
            2
        ),

        "voice_integrity_score": round(
            float(voice_integrity_score),
            2
        ),

        "risk_level": risk_level,

        "raw_score": round(
            prediction,
            4
        ),

        "score_cam": score_cam_result
    }