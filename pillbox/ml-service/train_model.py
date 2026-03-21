import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
import joblib

# Load data
df = pd.read_csv("data.csv")

# Add Rolling Features (Smart ML)
df["spo2_avg"] = df["spo2"].rolling(3).mean()
df["temp_avg"] = df["temp"].rolling(3).mean()

# Drop rows with NaN from rolling averages
df = df.dropna()

X = df[["spo2", "temp", "spo2_avg", "temp_avg", "missed"]]
y = df["label"]

# Train Risk Model (RandomForest)
model = RandomForestClassifier()
model.fit(X, y)
joblib.dump(model, "model.pkl")

# Train Anomaly Model (IsolationForest)
anomaly_model = IsolationForest(contamination=0.1) # Assume 10% anomalies
anomaly_model.fit(X)
joblib.dump(anomaly_model, "anomaly.pkl")

print("Models trained & saved!")
print(f"Features used: {list(X.columns)}")
