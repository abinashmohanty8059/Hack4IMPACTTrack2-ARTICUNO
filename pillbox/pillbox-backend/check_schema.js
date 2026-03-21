import { supabase } from "./supabase.js";

async function checkSchema() {
  const { data, error } = await supabase
    .from("medication_logs")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Columns:", Object.keys(data[0] || {}));
  }
  process.exit();
}

checkSchema();
