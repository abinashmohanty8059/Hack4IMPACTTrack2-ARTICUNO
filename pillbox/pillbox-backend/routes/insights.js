import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

const ML_SERVICE_URL = "http://127.0.0.1:8000/predict";

/**
 * @route GET /insights/:patient_id
 * @desc Get risk analysis and vitals for a patient
 */
router.get("/:patient_id", async (req, res, next) => {
  try {
    const { patient_id } = req.params;

    // 1. Fetch patient name
    const { data: patient, error: pError } = await supabase
      .from("patients")
      .select("name")
      .eq("id", patient_id)
      .single();

    if (pError || !patient) return res.status(404).json({ error: "Patient not found" });

    // 2. Fetch latest vitals
    const { data: vitals, error: vError } = await supabase
      .from("vitals_logs")
      .select("*")
      .eq("patient_id", patient_id)
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (vError) throw vError;

    const latestVital = vitals?.[0] || { spo2: 98, temp: 98.6 };

    // 3. Count missed doses
    const { data: logs, error: lError } = await supabase
      .from("medication_logs")
      .select("status")
      .eq("patient_id", patient_id)
      .eq("status", "missed");

    if (lError) throw lError;
    const missedDoses = logs.length;

    // 4. Call ML Service
    let mlResult = { risk: "unknown", anomaly: false };
    try {
      const mlResponse = await fetch(ML_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spo2: latestVital.spo2,
          temp: latestVital.temp,
          missed: missedDoses > 0 ? 1 : 0
        })
      });
      mlResult = await mlResponse.json();
    } catch (error) {
      console.error("ML Service error:", error.message);
    }

    // 5. Generate summary (simple logic for now)
    let summary = "Patient is stable.";
    if (mlResult.risk === "high") summary = "High risk detected. Check vitals immediately.";
    if (mlResult.anomaly) summary += " Anomaly detected in vitals data.";

    // Final response
    res.json({
      patient: patient.name,
      patient_id,
      risk: mlResult.risk,
      anomaly: mlResult.anomaly,
      spo2: latestVital.spo2,
      temp: latestVital.temp,
      missed_doses: missedDoses,
      summary
    });
  } catch (error) {
    next(error);
  }
});

export default router;
