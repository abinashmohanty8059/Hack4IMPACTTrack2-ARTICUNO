export const getMLPrediction = async ({ spo2, temp, missed }) => {
  try {
    const res = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spo2, temp, missed })
    });

    if (res.ok) return await res.json();
    throw new Error(`ML Service: ${res.status}`);
  } catch (err) {
    console.error("ML Prediction Error:", err.message);
    return { risk: "low", anomaly: false };
  }
};
