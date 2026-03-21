import cron from "node-cron";
import { supabase } from "./supabase.js";

export const startScheduler = () => {
  /**
   * TASK 1: Main Medication Trigger (Every Minute)
   */
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const minutePrecision = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

    console.log(`[${new Date().toISOString()}] ⏰ Checking schedules for: ${currentTime}`);

    try {
      const { data: schedules, error: schedError } = await supabase
        .from("medication_schedule")
        .select(`
          *,
          patients (id, name, device_id)
        `)
        .eq("enabled", true)
        .eq("time", currentTime);

      if (schedError) {
        console.error("Error fetching schedules:", schedError);
        return;
      }

      if (!schedules || schedules.length === 0) return;

      for (const sched of schedules) {
        // 🔥 PRODUCTION-LEVEL THINKING: Duplicate Check
        const { data: existing, error: existError } = await supabase
          .from("medication_logs")
          .select("id")
          .eq("patient_id", sched.patient_id)
          .gte("scheduled_time", `${minutePrecision}:00Z`)
          .lte("scheduled_time", `${minutePrecision}:59Z`);

        if (existError) {
          console.error("Error checking existing logs:", existError);
          continue;
        }

        if (existing && existing.length > 0) {
          console.log(`Log already exists for ${sched.patients?.name} at ${currentTime}. Skipping.`);
          continue;
        }

        console.log(`Triggering medication for: ${sched.patients?.name || sched.patient_id}`);

        const { error: logError } = await supabase.from("medication_logs").insert({
          patient_id: sched.patient_id,
          scheduled_time: now.toISOString(),
          status: "pending",
        });

        if (logError) console.error(`Error inserting log:`, logError);
      }
    } catch (err) {
      console.error("Scheduler unexpected error:", err);
    }
  });

  /**
   * TASK 2: Missed Dose Logic (Every 5 Minutes)
   * If status is "pending" and scheduled_time is older than 10 mins, mark as "missed"
   */
  cron.schedule("*/5 * * * *", async () => {
    console.log(`[${new Date().toISOString()}] 🔎 Checking for missed doses...`);
    
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("medication_logs")
      .update({ status: "missed" })
      .eq("status", "pending")
      .lt("scheduled_time", tenMinsAgo)
      .select();

    if (error) {
      console.error("Error updating missed doses:", error);
    } else if (data && data.length > 0) {
      console.log(`✅ Marked ${data.length} doses as MISSED.`);
    }
  });
};
