import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * @route GET /device/check
 * @desc Device checks if it should dispense medication
 */
router.get("/check", async (req, res, next) => {
  try {
    const { device_id } = req.query;

    if (!device_id) {
      return res.status(400).json({ error: "device_id is required" });
    }

    // Find patient by device_id
    const { data: patient, error: pError } = await supabase
      .from("patients")
      .select("id")
      .eq("device_id", device_id)
      .single();

    if (pError || !patient) {
      return res.json({ dispense: false, message: "Device not registered or patient not found" });
    }

    // Check for pending logs for this patient (Earliest first)
    const { data: logs, error: lError } = await supabase
      .from("medication_logs")
      .select("id, scheduled_time")
      .eq("patient_id", patient.id)
      .eq("status", "pending")
      .order("scheduled_time", { ascending: true })
      .limit(1);

    if (lError) throw lError;

    if (logs && logs.length > 0) {
      return res.json({
        dispense: true,
        log_id: logs[0].id
      });
    }

    res.json({ dispense: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /device/confirm
 * @desc Device confirms dispensing
 */
router.post("/confirm", async (req, res, next) => {
  try {
    const { log_id, spo2, temp } = req.body;

    if (!log_id) {
      return res.status(400).json({ error: "log_id is required" });
    }

    const { error } = await supabase
      .from("medication_logs")
      .update({ 
        status: "dispensed",
        spo2: spo2 || null,
        temp: temp || null
      })
      .eq("id", log_id);

    if (error) throw error;

    res.json({ success: true, message: "Medication marked as dispensed with vitals" });
  } catch (error) {
    next(error);
  }
});

export default router;
