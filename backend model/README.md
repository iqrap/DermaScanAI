# DermaScanAI — Model Service

FastAPI service hosting the TensorFlow skin disease detection and skin validator models.

---

## Models

| Model | File | Purpose |
|---|---|---|
| Disease Classifier | `model/Final_Disease_Datasets.h5` | Detects 7 skin conditions |
| Skin Validator | `model/skin_validator_model.h5` | Validates that input is a skin image |

**Detectable conditions:** Acne, Benign Tumors, Lichen, No Disease, Vitiligo, Eczema, Scabies

---

## Stack

- **Python 3.10+**
- **FastAPI** with lifespan context manager
- **TensorFlow / Keras** — model inference
- **Pillow** — image processing
- **python-dotenv** — environment configuration
- **uvicorn** — ASGI server

---

## Environment Setup

```bash
cp .env.example .env   # if .env.example exists, or create manually
```

`.env` options:

```env
MODEL_API_PORT=8000
# Optional: restrict allowed origins in production
# ALLOWED_ORIGINS=http://192.168.x.x:3000,exp://192.168.x.x:8081
```

---

## Installation

```bash
# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

---

## Running

```bash
# Development
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Production
uvicorn app:app --host 0.0.0.0 --port 8000
```

---

## API Reference

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |
| GET | `/api/v1/health` | Versioned health check |
| GET | `/api/v1/model-info` | Model version and configuration |

### Prediction

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/predict` | `file: image` (multipart) | Predict skin disease |
| POST | `/validate-skin` | `file: image` (multipart) | Validate image is skin |
| POST | `/api/v1/predict` | `file: image` (multipart) | Versioned predict endpoint |
| POST | `/api/v1/validate-skin` | `file: image` (multipart) | Versioned validate endpoint |

### Predict Response

```json
{
  "diseaseName": "Acne",
  "diseaseConfidence": 87.5,
  "skinPercentage": 95.2,
  "validatorConfidence": 95.2,
  "message": "Acne detected with 87.50% confidence",
  "recommendation": "...",
  "action": "consult",
  "warning": null
}
```

Low confidence warning (< 40%):

```json
{
  "warning": "Low confidence prediction (32.10%). Results may not be reliable. Please consult a dermatologist."
}
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `CONFIDENCE_THRESHOLD` | `40.0` | Minimum confidence for valid prediction |
| `MAX_IMAGE_SIZE` | `10485760` (10 MB) | Maximum allowed upload size |
| `MODEL_VERSION` | `2.0.0` | Current model version string |

---

## Project Structure

```
app.py              Main FastAPI application
main.py             Entry point (re-exports app)
requirements.txt    Python dependencies
model/
  Final_Disease_Datasets.h5    Disease classifier weights
  skin_validator_model.h5      Skin validator weights
```
