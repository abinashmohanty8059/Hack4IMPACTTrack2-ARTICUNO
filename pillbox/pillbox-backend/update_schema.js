import { supabase } from "./supabase.js";

async function addColumns() {
  console.log("Adding spo2 and temp columns to medication_logs...");
  // Note: Supabase JS client doesn't support ALTER TABLE directly easily via typical RPC unless a function exists.
  // I will try to perform a dummy insert to see if they exist or just rely on the fact that I might need to tell the user to add them if I can't.
  // Actually, I'll try to use a 'rpc' if available or just check columns again.
  
  const { data, error } = await supabase
    .from("medication_logs")
    .select("spo2, temp")
    .limit(1);

  if (error && error.code === 'PGRST204') {
    console.log("Columns 'spo2' and 'temp' likely missing. Please add them to 'medication_logs' table in Supabase SQL Editor:");
    console.log("ALTER TABLE medication_logs ADD COLUMN spo2 FLOAT, ADD COLUMN temp FLOAT;");
  } else if (error) {
    console.error("Error checking columns:", error);
  } else {
    console.log("Columns already exist.");
  }
  process.exit();
}

addColumns();
