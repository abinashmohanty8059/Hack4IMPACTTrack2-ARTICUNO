import express from "express";
import { z } from "zod";
import { supabase } from "../supabase.js";

const router = express.Router();

// Zod Schemas
const scheduleSchema = z.object({
  patient_id: z.string().uuid("Invalid patient_id"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  slot: z.enum(['morning', 'afternoon', 'night']),
  enabled: z.boolean().optional(),
});

const updateScheduleSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  slot: z.enum(['morning', 'afternoon', 'night']).optional(),
  enabled: z.boolean().optional(),
});

// GET /schedules — List schedules (optionally filtered by patient)
router.get("/", async (req, res, next) => {
  try {
    const { patient_id } = req.query;
    let query = supabase.from("medication_schedule").select("*, patients(name)");

    if (patient_id) {
      query = query.eq("patient_id", patient_id);
    }

    const { data, error } = await query.order("time", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /schedules — Create a new schedule
router.post("/", async (req, res, next) => {
  try {
    const validated = scheduleSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.errors });
    }

    const { patient_id, time, slot, enabled } = validated.data;

    const { data, error } = await supabase
      .from("medication_schedule")
      .insert({ patient_id, time, slot, enabled: enabled !== undefined ? enabled : true })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /schedules/:id — Update schedule
router.put("/:id", async (req, res, next) => {
  try {
    const validated = updateScheduleSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.errors });
    }

    const { id } = req.params;
    const updateData = validated.data;

    const { data, error } = await supabase
      .from("medication_schedule")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /schedules/:id — Remove a schedule
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("medication_schedule")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
