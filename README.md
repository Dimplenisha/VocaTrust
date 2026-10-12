 VocaTrust: Machine Learning-Based Voice Integrity Assessment

VocaTrust is a machine learning-based project designed to assess the integrity of audio recordings and distinguish between genuine and potentially AI-generated or manipulated voices.

The system uses a trained deep learning model to analyze audio signals and predict whether a voice sample is **REAL** or **FAKE**. It also provides a voice integrity score and risk classification to help users interpret the prediction.

The project includes a web-based interface, a Python backend, a trained TensorFlow/Keras model, and Google Colab notebooks for model development, evaluation, and explainability experiments.

Objectives and Key Features

- Voice Classification: Predicts whether an audio sample is REAL or FAKE.
- Voice Integrity Score: Provides a score from 0 to 100 to help interpret the model's prediction.
- Risk Classification: Categorizes predictions as Genuine, Suspicious, or High Risk.
- Audio Preprocessing: Converts audio to mono, resamples it to 16 kHz, and processes a 3-second segment.
- Deep Learning Model: Uses a trained CNN-based model to analyze audio features.
- Explainable AI: Uses Score-CAM visualizations to help explain the model's predictions.
- Web Interface: Provides a browser-based interface for submitting audio and viewing results.
- Model Evaluation: Includes evaluation notebooks and experiments conducted using Google Colab.

- ## Technology Stack

| Technology | Purpose |
|
| Python | Main programming language |
| TensorFlow / Keras | Deep learning model development and inference |
| FastAPI | Backend API for processing audio and returning predictions |
| Librosa | Audio loading and preprocessing |
| NumPy | Numerical operations and feature handling |
| Matplotlib | Visualization and analysis |
| OpenCV | Image processing support |
| Scikit-learn | Machine learning utilities and evaluation |
| Pandas | Dataset and tabular data handling |
| HTML, CSS, JavaScript | Frontend web interface |
| Google Colab / Jupyter Notebook | Model training, evaluation, and experimentation |

## Project Structure

VocaTrust/
├── backend/
│   ├── model/
│   │   └── VocaTrust_Multilingual_Fixed.keras
│   ├── main.py
│   ├── fix_model.py
│   └── test_model.py
├── data/
│   └── y_test (1).npy
├── evaluation/
│   └── multilingual_evaluation.ipynb
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── requirements.txt
├── command.txt
└── README.md


The repository also includes Google Colab notebooks for model development, multilingual analysis, noise robustness, and explainable AI experiments.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Dimplenisha/VocaTrust.git
cd VocaTrust
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

### 3. Activate the Virtual Environment

For Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** TensorFlow and other dependencies may require compatible Python versions and system configurations.

## Running the Application

### 1. Start the Backend Server

From the project's root directory, run:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The FastAPI backend should be available at:

`http://127.0.0.1:8000`

You can access the interactive API documentation at:

`http://127.0.0.1:8000/docs`

### 2. Open the Frontend

Open `frontend/index.html` in your browser, or use the Live Server extension in Visual Studio Code.

### 3. Analyze an Audio Sample

1. Open the VocaTrust web interface.
2. Upload an audio sample in a supported format.
3. Submit the audio for analysis.
4. Review the predicted voice classification, integrity score, risk category, and available explanation visualization.

5. ## Understanding the Results

VocaTrust provides the following outputs:

- **Predicted Classification:** REAL or FAKE, based on the model's prediction.
- **Voice Integrity Score:** A percentage derived from the model's predicted probability of a real voice.
- **Risk Category:**
  - **Genuine:** Integrity score of 80% or above.
  - **Suspicious:** Integrity score from 50% to below 80%.
  - **High Risk:** Integrity score below 50%.
- **Explainability Visualization:** A Score-CAM visualization intended to help users understand which parts of the model's feature representation contributed to a prediction.

## Limitations and Responsible Use

- VocaTrust is an academic machine learning project and should not be treated as a definitive forensic authentication system.
- Predictions depend on the model, training data, audio quality, and recording conditions.
- An integrity score is a model-generated estimate, not a guarantee that a voice is genuine or fake.
- Score-CAM visualizations provide an interpretation aid and do not prove why a prediction is correct.
- Do not use the system's output as the sole basis for financial, legal, identity-verification, or other high-stakes decisions.

## Future Enhancements

- Expand support for additional languages and diverse speakers.
- Improve robustness to background noise and different recording conditions.
- Evaluate performance on more diverse and independent datasets.
- Improve real-time audio analysis and explainability.

## Acknowledgement

This project was developed as an academic exploration of deep learning, audio processing, voice integrity assessment, and explainable artificial intelligence.
