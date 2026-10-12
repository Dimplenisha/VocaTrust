import zipfile
import json
import os
import shutil

INPUT_MODEL = "model/VocaTrust_Multilingual_Final.keras"
OUTPUT_MODEL = "model/VocaTrust_Multilingual_Fixed.keras"

TEMP_DIR = "temp_keras_model"


def remove_quantization_config(data):

    if isinstance(data, dict):

        # Remove quantization_config
        if "quantization_config" in data:
            del data["quantization_config"]

        # Recursively check all values
        for value in data.values():
            remove_quantization_config(value)

    elif isinstance(data, list):

        for item in data:
            remove_quantization_config(item)


# Remove old temporary folder if it exists
if os.path.exists(TEMP_DIR):
    shutil.rmtree(TEMP_DIR)


# Extract .keras file
with zipfile.ZipFile(INPUT_MODEL, "r") as zip_ref:
    zip_ref.extractall(TEMP_DIR)


# Read config.json
config_path = os.path.join(TEMP_DIR, "config.json")

with open(config_path, "r", encoding="utf-8") as file:
    config = json.load(file)


# Remove incompatible quantization_config fields
remove_quantization_config(config)


# Save updated config
with open(config_path, "w", encoding="utf-8") as file:
    json.dump(config, file)


# Create fixed .keras model
with zipfile.ZipFile(
    OUTPUT_MODEL,
    "w",
    zipfile.ZIP_DEFLATED
) as zip_ref:

    for root, dirs, files in os.walk(TEMP_DIR):

        for file in files:

            file_path = os.path.join(root, file)

            archive_path = os.path.relpath(
                file_path,
                TEMP_DIR
            )

            zip_ref.write(file_path, archive_path)


# Clean up
shutil.rmtree(TEMP_DIR)

print("Model fixed successfully!")
print("New model:", OUTPUT_MODEL)