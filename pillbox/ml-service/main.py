from fastapi import FastAPI
import joblib

app = FastAPI()

model = joblib.load("model.pkl")
anomaly_model = joblib.load("anomaly.pkl")

@app.get("/")
def home():
    return {"message": "ML service running"}

@app.post("/predict")
def predict(data: dict):
    spo2 = data["spo2"]
    temp = data["temp"]
    missed = data["missed"]

    # Rolling feature simplification for single-row prediction:
    # Use current values as approximations for small window averages
    features = [[spo2, temp, spo2, temp, missed]]

    risk_pred = model.predict(features)[0]
    anomaly_pred = anomaly_model.predict(features)[0]

    return {
        "risk": "high" if risk_pred == 1 else "low",
        "anomaly": True if anomaly_pred == -1 else False
    }
