import express from "express";
import { z } from "zod";
import { supabase } from "../supabase.js";

const router = express.Router();

const ML_SERVICE_URL = "http://127.0.0.1:8000/predict";

async function getMLRisk(spo2, temp, missed) {
  try {
    const response = await fetch(ML_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spo2, temp, missed })
    });
    const result = await response.json();
    return result.risk;
  } catch (error) {
    console.error("ML Service unreachable:", error.message);
    return null; // Fallback
  }
}

// Zod Schemas
const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  device_id: z.string().min(1, "Device ID is required"),
});

/**
 * @route GET /patients/status
 * @desc Get summary status for all patients (for Dashboard)
 */
router.get("/status", async (req, res, next) => {
  try {
    const { data: patients, error: pError } = await supabase
      .from("patients")
      .select(`
        id,
        name,
        medication_logs (
          status,
          scheduled_time
        )
      `);

    if (pError) throw pError;

    const statusReport = await Promise.all(patients.map(async (p) => {
      // Sort logs by time desc
      const sortedLogs = p.medication_logs.sort((a, b) => 
        new Date(b.scheduled_time) - new Date(a.scheduled_time)
      );
      
      const lastLog = sortedLogs[0];
      const pendingCount = p.medication_logs.filter(l => l.status === 'pending').length;
      const missedCount = p.medication_logs.filter(l => l.status === 'missed').length;

      // Get latest vitals (fallback to normal values if none exist)
      const latestSpo2 = lastLog?.spo2 || 98;
      const latestTemp = lastLog?.temp || 98.6;
      const missedBit = missedCount > 0 ? 1 : 0;

      // Use ML service for risk
      let risk = "low";
      const mlRisk = await getMLRisk(latestSpo2, latestTemp, missedBit);
      
      if (mlRisk) {
        risk = mlRisk;
      } else {
        // Fallback logic
        if (missedCount > 0) risk = "medium";
        if (missedCount > 3) risk = "high";
      }

      return {
        id: p.id,
        name: p.name,
        status: lastLog ? lastLog.status : "no_logs",
        last_taken: lastLog?.status === 'dispensed' ? lastLog.scheduled_time : null,
        pending_doses: pendingCount,
        missed_doses: missedCount,
        risk
      };
    }));

    res.json(statusReport);
  } catch (error) {
    next(error);
  }
});

// GET /patients — List all patients
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /patients — Create a new patient
router.post("/", async (req, res, next) => {
  try {
    const validated = patientSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.errors });
    }

    const { name, device_id } = validated.data;

    const { data, error } = await supabase
      .from("patients")
      .insert({ name, device_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// GET /patients/:id — Get patient details
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Patient not found" });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /patients/:id — Update patient info
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, device_id } = req.body;

    const { data, error } = await supabase
      .from("patients")
      .update({ name, device_id })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /patients/:id — Remove a patient
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: "Patient deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
