@echo off
echo ==============================================================================
echo TwinGuard AI - Starting Neural Bottleneck Forecaster ML Microservice
echo Port: 8000 | Docs: http://localhost:8000/docs
echo ==============================================================================
cd /d "%~dp0"
call "venv\Scripts\activate.bat"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

