# TwinGuard AI - Neural Bottleneck Forecaster ML Microservice

Physics-grounded Machine Learning microservice for real-time crowd dynamics, door clogging arching detection, and evacuation stampede risk forecasting.

---

## 🔬 Core ML Capabilities
- **Stampede & Arching Probability**: Calibrated Random Forest Classifier ($R^2 \ge 0.94$).
- **Predicted Time-to-Failure**: Gradient Boosting Regressor forecasting the exact physical doorway jamming onset ($T_{\text{failure}}$ in seconds).
- **Explainable AI (XAI)**: Mean Decrease in Impurity (MDI) feature importance weights:
  - *Occupant Density (p/m²)*: 56.4%
  - *Doorway Clear Width (m)*: 26.9%
  - *Smoke Opacity (%)*: 8.3%
  - *Corridor Travel Distance (m)*: 4.5%
  - *Stairwell Inflow Load*: 1.7%
  - *Reaction Delay (s)*: 1.3%
  - *Impaired Mobility Ratio*: 0.9%

---

## 🚀 1-Click Startup

### Option 1: Double click `run_service.bat`
```bash
run_service.bat
```

### Option 2: Command Line
```bash
cd ml-service
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger Documentation:
[http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Retraining the Models
To generate 10,000 new SFPE Handbook & Helbing Social Force Model simulation records and retrain:
```bash
python data/generate_dataset.py
python models/train.py
```

