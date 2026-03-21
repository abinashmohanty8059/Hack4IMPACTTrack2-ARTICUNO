import { supabase } from "./supabase.js";

async function getPatients() {
  const { data, error } = await supabase
    .from("patients")
    .select("id, name")
    .limit(5);

  if (error) {
    console.error("Error fetching patients:", error);
  } else {
    console.log("Patients:", JSON.stringify(data, null, 2));
  }
  process.exit();
}

getPatients();
