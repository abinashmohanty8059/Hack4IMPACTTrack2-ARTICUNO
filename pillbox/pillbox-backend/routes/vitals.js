import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * @route POST /vitals
 * @desc Add new vitals for a patient
 */
router.post("/", async (req, res, next) => {
  try {
    const { patient_id, spo2, temp } = req.body;

    if (!patient_id || spo2 === undefined || temp === undefined) {
      return res.status(400).json({ error: "Missing patient_id, spo2, or temp" });
    }

    const { data, error } = await supabase
      .from("vitals_logs")
      .insert({
        patient_id,
        spo2,
        temp
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
