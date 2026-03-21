import express from "express";
import { z } from "zod";
import { supabase } from "../supabase.js";

const router = express.Router();

const logQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'dispensed', 'missed']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

/**
 * @route GET /logs
 * @desc Fetch medication logs with filters (patient_id, status, date)
 */
router.get("/", async (req, res, next) => {
  try {
    const validated = logQuerySchema.safeParse(req.query);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.errors });
    }

    const { patient_id, status, start_date, end_date } = validated.data;
    
    let query = supabase
      .from("medication_logs")
      .select("*, patients(name)");

    if (patient_id) {
      query = query.eq("patient_id", patient_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (start_date) {
      query = query.gte("scheduled_time", start_date);
    }

    if (end_date) {
      query = query.lte("scheduled_time", end_date);
    }

    const { data, error } = await query.order("scheduled_time", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
