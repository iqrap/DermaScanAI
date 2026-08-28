# ============================================
# FASTAPI BACKEND FOR SKIN DISEASE DETECTION
# WITH SKIN VALIDATOR MODEL
# ============================================
import os
import io
import json
import logging
import time
from contextlib import asynccontextmanager

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# ============================================
# LOGGING CONFIGURATION
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION
# ============================================
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
MODEL_VERSION = "2.0.0"
CONFIDENCE_THRESHOLD = 40.0  # Minimum confidence to consider a valid prediction
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB max upload

# Disease class names (7 diseases as per dataset)
DISEASE_CLASSES = [
    "Acne",            # Index 0
    "Benign Tumors",   # Index 1
    "Eczema (EC)",     # Index 2
    "Lichen",          # Index 3
    "No Disease",      # Index 4
    "Scabies (SC)",    # Index 5
    "Vitiligo",        # Index 6
]

# Skin validator class names
VALIDATOR_CLASSES = ["Non-Skin Image", "Skin Image"]

logger.info(f"Disease classes: {DISEASE_CLASSES}")
logger.info(f"Validator classes: {VALIDATOR_CLASSES}")

# ============================================
# MODEL LOADING
# ============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DISEASE_MODEL_PATH = os.path.join(BASE_DIR, "model", "Final_Disease_Datasets.h5")
VALIDATOR_MODEL_PATH = os.path.join(BASE_DIR, "model", "skin_validator_model.h5")


# Workaround for Keras version mismatch (quantization_config error)
class CustomDense(tf.keras.layers.Dense):
    def __init__(self, *args, **kwargs):
        kwargs.pop("quantization_config", None)
        super().__init__(*args, **kwargs)


def custom_input_layer(**kwargs):
    if "shape" not in kwargs and "batch_input_shape" not in kwargs and "batch_shape" not in kwargs:
        kwargs["shape"] = (224, 224, 3)
    if "batch_input_shape" in kwargs and "shape" in kwargs:
        del kwargs["batch_input_shape"]
    return tf.keras.layers.InputLayer(**kwargs)


CUSTOM_OBJECTS = {
    "InputLayer": custom_input_layer,
    "Dense": CustomDense,
}


def load_model_safe(model_path: str, model_name: str):
    """Load a Keras model with error handling."""
    try:
        model = tf.keras.models.load_model(
            model_path, custom_objects=CUSTOM_OBJECTS, compile=False
        )
        # Warmup prediction to initialize TF graph
        dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
        model.predict(dummy, verbose=0)
        logger.info(f"{model_name} loaded and warmed up from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Failed to load {model_name}: {e}")
        return None


# Global model references (loaded at startup)
disease_model = None
validator_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, clean up on shutdown."""
    global disease_model, validator_model
    logger.info("Loading models on startup...")
    disease_model = load_model_safe(DISEASE_MODEL_PATH, "Disease model")
    validator_model = load_model_safe(VALIDATOR_MODEL_PATH, "Validator model")
    yield
    logger.info("Shutting down model service.")


# ============================================
# FASTAPI APP
# ============================================
app = FastAPI(
    title="DermaScanAI Skin Disease Detection API",
    description="Detect skin diseases from images with skin validation",
    version=MODEL_VERSION,
    lifespan=lifespan,
)

# CORS - restrict origins via environment variable
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ============================================
# IMAGE PREPROCESSING (224x224 for MobileNet)
# ============================================
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Preprocess image for MobileNet: resize to 224x224, normalize to [-1, 1]."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32)
    # MobileNet preprocessing: map [0, 255] to [-1, 1]
    img_array = (img_array / 127.5) - 1.0
    return np.expand_dims(img_array, axis=0)


def validate_image_upload(file: UploadFile):
    """Validate uploaded image file."""
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/bmp"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_IMAGE_TYPE",
                    "message": f"Invalid image type: {file.content_type}. Use JPEG, PNG, or BMP.",
                }
            },
        )


def interpret_validator_output(validator_output: np.ndarray):
    """Interpret validator model output (handles both sigmoid and softmax)."""
    if validator_output.shape[-1] == 1:
        # Sigmoid binary classification
        skin_prob = float(validator_output[0][0])
        is_skin = skin_prob >= 0.5
        confidence = skin_prob * 100 if is_skin else (1 - skin_prob) * 100
        prediction = "Skin Image" if is_skin else "Non-Skin Image"
        probabilities = {
            "Non-Skin": round((1 - skin_prob) * 100, 2),
            "Skin": round(skin_prob * 100, 2),
        }
    else:
        # Softmax classification
        predictions = validator_output[0]
        predicted_idx = int(np.argmax(predictions))
        confidence = float(predictions[predicted_idx]) * 100
        is_skin = predicted_idx == 1
        prediction = VALIDATOR_CLASSES[predicted_idx]
        probabilities = {
            "Non-Skin": round(float(predictions[0] * 100), 2),
            "Skin": round(float(predictions[1] * 100), 2),
        }
    return is_skin, confidence, prediction, probabilities


# ============================================
# HEALTH CHECK ENDPOINTS
# ============================================
@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": MODEL_VERSION,
        "disease_model_loaded": disease_model is not None,
        "validator_model_loaded": validator_model is not None,
        "disease_classes": len(DISEASE_CLASSES),
        "disease_class_names": DISEASE_CLASSES,
        "validator_classes": VALIDATOR_CLASSES,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "uptime_seconds": round(time.time() - app.state.start_time, 2)
        if hasattr(app.state, "start_time")
        else None,
    }


@app.get("/api/v1/model-info")
async def model_info():
    return {
        "version": MODEL_VERSION,
        "disease_model": "Final_Disease_Datasets.h5",
        "validator_model": "skin_validator_model.h5",
        "disease_classes": DISEASE_CLASSES,
        "input_size": "224x224",
        "preprocessing": "MobileNet ([-1, 1] normalization)",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }


# Record startup time
@app.on_event("startup")
async def record_startup():
    app.state.start_time = time.time()


# ============================================
# VALIDATE SKIN ONLY ENDPOINT
# ============================================
@app.post("/validate-skin")
@app.post("/api/v1/validate-skin")
async def validate_skin(file: UploadFile = File(...)):
    """Check if the uploaded image is a skin image or not."""
    validate_image_upload(file)

    if validator_model is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "MODEL_UNAVAILABLE",
                    "message": "Validator model is not loaded. Service is starting up.",
                }
            },
        )

    try:
        image_bytes = await file.read()
        if len(image_bytes) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail={"error": {"code": "IMAGE_TOO_LARGE", "message": "Image exceeds 10MB limit."}})

        logger.info(f"Validating image: {file.filename} ({len(image_bytes)} bytes)")
        img_array = preprocess_image(image_bytes)
        validator_output = validator_model.predict(img_array, verbose=0)
        is_skin, confidence, prediction, probabilities = interpret_validator_output(validator_output)

        logger.info(f"Validation result: {prediction} ({confidence:.2f}%)")
        return {
            "isSkinImage": is_skin,
            "confidence": round(confidence, 2),
            "prediction": prediction,
            "all_probabilities": probabilities,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "VALIDATION_ERROR", "message": str(e)}},
        )


# ============================================
# PREDICTION ENDPOINT (WITH SKIN VALIDATION)
# ============================================
@app.post("/predict")
@app.post("/api/v1/predict")
async def predict(file: UploadFile = File(...)):
    """Predict skin disease from uploaded image (with automatic skin validation)."""
    validate_image_upload(file)

    if disease_model is None:
        raise HTTPException(
            status_code=503,
            detail={"error": {"code": "MODEL_UNAVAILABLE", "message": "Disease model is not loaded."}},
        )
    if validator_model is None:
        raise HTTPException(
            status_code=503,
            detail={"error": {"code": "MODEL_UNAVAILABLE", "message": "Validator model is not loaded."}},
        )

    try:
        image_bytes = await file.read()
        if len(image_bytes) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail={"error": {"code": "IMAGE_TOO_LARGE", "message": "Image exceeds 10MB limit."}})

        logger.info(f"Predict request: {file.filename} ({len(image_bytes)} bytes)")
        img_array = preprocess_image(image_bytes)

        # Step 1: Validate if it's a skin image
        validator_output = validator_model.predict(img_array, verbose=0)
        is_skin, validator_confidence, validator_class, _ = interpret_validator_output(validator_output)
        logger.info(f"Validation: {validator_class} ({validator_confidence:.2f}%)")

        if not is_skin:
            return {
                "isSkinImage": False,
                "validatorConfidence": round(validator_confidence, 2),
                "message": "This doesn't appear to be a skin image. Please upload a clear photo of skin.",
                "diseaseName": None,
                "diseaseConfidence": 0,
                "success": True,
            }

        # Step 2: Predict disease
        disease_pred = disease_model.predict(img_array, verbose=0)[0]
        disease_idx = int(np.argmax(disease_pred))
        disease_confidence = float(disease_pred[disease_idx]) * 100
        disease_name = DISEASE_CLASSES[disease_idx]

        logger.info(f"Disease prediction: {disease_name} ({disease_confidence:.2f}%)")

        # Low confidence warning
        low_confidence = disease_confidence < CONFIDENCE_THRESHOLD

        # Top 3 predictions
        top3_indices = np.argsort(disease_pred)[-3:][::-1]
        top3_predictions = [
            {"disease": DISEASE_CLASSES[i], "confidence": round(float(disease_pred[i] * 100), 2)}
            for i in top3_indices
        ]

        return {
            "isSkinImage": True,
            "validatorConfidence": round(validator_confidence, 2),
            "diseaseName": disease_name,
            "diseaseConfidence": round(disease_confidence, 2),
            "confidence": round(disease_confidence, 2),
            "message": f"Skin detected! Diagnosis: {disease_name} ({disease_confidence:.2f}% confidence)",
            "top3Predictions": top3_predictions,
            "allProbabilities": {
                DISEASE_CLASSES[i]: round(float(disease_pred[i] * 100), 2)
                for i in range(len(DISEASE_CLASSES))
            },
            "lowConfidence": low_confidence,
            "lowConfidenceMessage": "The model is not very confident in this prediction. Please consult a dermatologist for confirmation."
            if low_confidence
            else None,
            "success": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "PREDICTION_ERROR", "message": str(e)}},
        )


# ============================================
# BATCH PREDICTION (ZIP FILE UPLOAD)
# ============================================
@app.post("/predict_zip")
@app.post("/api/v1/predict_zip")
async def predict_zip(file: UploadFile = File(...)):
    """Predict for multiple images in ZIP file with validation."""
    import tempfile
    import zipfile

    if disease_model is None or validator_model is None:
        raise HTTPException(
            status_code=503,
            detail={"error": {"code": "MODEL_UNAVAILABLE", "message": "Models not loaded."}},
        )

    try:
        zip_bytes = await file.read()

        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = os.path.join(temp_dir, "upload.zip")
            with open(zip_path, "wb") as f:
                f.write(zip_bytes)

            extract_dir = os.path.join(temp_dir, "extracted")
            with zipfile.ZipFile(zip_path, "r") as zf:
                zf.extractall(extract_dir)

            results = []
            image_extensions = {".jpg", ".jpeg", ".png", ".bmp"}
            skin_count = 0
            non_skin_count = 0

            for root, _dirs, files in os.walk(extract_dir):
                for filename in files:
                    if any(filename.lower().endswith(ext) for ext in image_extensions):
                        img_path = os.path.join(root, filename)
                        with open(img_path, "rb") as img_file:
                            img_bytes = img_file.read()
                            img_array = preprocess_image(img_bytes)

                            validator_output = validator_model.predict(img_array, verbose=0)
                            is_skin, _, _, _ = interpret_validator_output(validator_output)

                            if not is_skin:
                                non_skin_count += 1
                                results.append({
                                    "filename": filename,
                                    "isSkinImage": False,
                                    "message": "Not a skin image",
                                })
                                continue

                            skin_count += 1
                            disease_pred = disease_model.predict(img_array, verbose=0)[0]
                            disease_idx = int(np.argmax(disease_pred))
                            disease_confidence = float(disease_pred[disease_idx]) * 100

                            results.append({
                                "filename": filename,
                                "isSkinImage": True,
                                "diseaseName": DISEASE_CLASSES[disease_idx],
                                "confidence": round(disease_confidence, 2),
                                "lowConfidence": disease_confidence < CONFIDENCE_THRESHOLD,
                            })

            return {
                "success": True,
                "total": len(results),
                "skinImages": skin_count,
                "nonSkinImages": non_skin_count,
                "results": results,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "BATCH_ERROR", "message": str(e)}},
        )


# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    import uvicorn

    logger.info("=" * 60)
    logger.info("SKIN DISEASE API SERVER WITH VALIDATOR")
    logger.info("=" * 60)
    logger.info(f"Local URL: http://localhost:8000")
    logger.info(f"Health Check: http://localhost:8000/health")
    logger.info(f"Model Info: GET http://localhost:8000/api/v1/model-info")
    logger.info(f"Validate Only: POST http://localhost:8000/validate-skin")
    logger.info(f"Predict: POST http://localhost:8000/predict")
    logger.info(f"Batch Predict: POST http://localhost:8000/predict_zip")
    logger.info("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
