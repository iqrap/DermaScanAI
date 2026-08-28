"""
DermaScanAI Model Service - Entry Point
This file is a simple launcher that delegates to app.py.
Use: python main.py or uvicorn app:app --host 0.0.0.0 --port 8000
"""
from app import app  # noqa: F401 - re-export for uvicorn compatibility

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
