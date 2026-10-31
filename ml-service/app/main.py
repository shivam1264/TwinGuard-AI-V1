"""
==============================================================================
TwinGuard AI - Neural Bottleneck Forecaster Microservice
FastAPI Microservice for Real-Time Egress Crowd Dynamics & Bottleneck Prediction
==============================================================================
"""

import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from app.schemas import EgressPredictionRequest, EgressPredictionResponse
from app.predictor import predictor_instance

# Configure console encoding for Windows
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

app = FastAPI(
    title="TwinGuard AI - Neural Bottleneck Forecaster API",
    description="Microservice providing real-time physics-grounded machine learning inference for evacuation crowd bottlenecks and stampede risk.",
    version="1.0.0"
)

# Enable CORS for React/Vite development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "TwinGuard AI - Neural Bottleneck Forecaster",
        "status": "operational",
        "docs_url": "/docs",
        "health_url": "/api/ml/health"
    }

@app.get("/api/ml/health")
def health_check():
    return {
        "status": "online",
        "model_loaded": predictor_instance.is_loaded,
        "model_version": "1.0.0",
        "algorithm": predictor_instance.metrics.get("algorithm", "Random Forest Regressor (R² = 0.945)"),
        "metrics": predictor_instance.metrics.get("metrics", {})
    }

@app.get("/api/ml/metrics")
def get_metrics():
    if not predictor_instance.metrics:
        raise HTTPException(status_code=404, detail="Metrics summary not available")
    return predictor_instance.metrics

@app.post("/api/ml/predict", response_model=EgressPredictionResponse)
def predict_egress_bottleneck(request: EgressPredictionRequest):
    try:
        result = predictor_instance.predict(request.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")

@app.post("/api/ml/sensitivity")
def get_sensitivity_curve(request: EgressPredictionRequest):
    try:
        curve = predictor_instance.generate_sensitivity_curve(request.model_dump())
        return {
            "status": "success",
            "sensitivity_curve": curve
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sensitivity calculation failed: {str(e)}")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

