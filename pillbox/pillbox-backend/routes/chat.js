import express from "express";
import { supabase } from "../supabase.js";
import { getMLPrediction } from "../mlService.js";
import { getTrend } from "../utils/trend.js";
import { generateResponse } from "../llmService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { query } = req.body;

  try {
    console.time("1. Supabase Fetch");
    const { data: patients, error: pError } = await supabase.from("patients").select("*");
    const { data: vitals, error: vError } = await supabase.from("vitals_logs").select("*").order("recorded_at", { ascending: false });
    const { data: logs, error: lError } = await supabase.from("medication_logs").select("*").order("scheduled_time", { ascending: false });
    console.timeEnd("1. Supabase Fetch");

    if (pError || vError || lError) {
      throw new Error(`Supabase Fetch Failed: ${pError?.message || vError?.message || lError?.message}`);
    }

    console.time("2. Decision Layer (ML + Trend)");
    let structuredData = [];

    // Process all patients in parallel for speed
    const patientDataPromises = patients.map(async (p) => {
      const pv = vitals
        .filter(v => v.patient_id === p.id)
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
      
      const latestVitals = pv.slice(-3); // Get last 3 for trend
      const current = latestVitals[latestVitals.length - 1];
      
      const missedCount = logs.filter(
        l => l.patient_id === p.id && l.status === "missed"
      ).length;

      if (!current) return null;

      // Decision Maker: ML Service
      const ml = await getMLPrediction({
        spo2: current.spo2,
        temp: current.temp,
        missed: missedCount > 0 ? 1 : 0
      });

      // Insight Layer: Trend Detection
      const trend = getTrend(latestVitals);

      return {
        id: p.id,
        name: p.name,
        spo2: current.spo2,
        temp: current.temp,
        risk: ml.risk,
        anomaly: ml.anomaly,
        trend,
        missed: missedCount
      };
    });

    structuredData = (await Promise.all(patientDataPromises)).filter(Boolean);
    console.timeEnd("2. Decision Layer (ML + Trend)");

    // Expand Context: Include all patients for a complete clinical overview
    const optimizedContext = structuredData
      .sort((a, b) => {
        const score = (p) => (p.risk === "high" ? 3 : p.risk === "medium" ? 1 : 0) + (p.anomaly ? 2 : 0);
        return score(b) - score(a);
      })
      .map(p => `
Patient: ${p.name}
Risk: ${p.risk.toUpperCase()}
Anomaly: ${p.anomaly ? "YES" : "NO"}
Trend: ${p.trend}
Missed Doses: ${p.missed}
Current Vitals: ${p.spo2}% SpO2, ${p.temp}°F
`).join("\n---\n");

    const prompt = `
You are a hospital AI assistant summarizing patient data.

IMPORTANT:
- Risk assessment and Anomalies are already decided by our ML models.
- YOUR JOB is only to explain these findings clearly and provide a concise summary.
- DO NOT override the Risk levels provided in the data.
- If a patient has an anomaly or high risk, highlight it first.
- FORMATTING: Use plain text only. DO NOT use bolding (**), italics, or emojis. 
- STRUCTURE: Use multiple line breaks between sections and simple bullet points (-) for lists.

DATA FOR ANALYSIS (All Monitored Patients):
${optimizedContext}

QUESTION: ${query}
`;

    const result = await generateResponse(prompt);

    res.json({
      answer: result.text,
      provider: result.provider,
      data: structuredData // Power the frontend UI
    });

  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
