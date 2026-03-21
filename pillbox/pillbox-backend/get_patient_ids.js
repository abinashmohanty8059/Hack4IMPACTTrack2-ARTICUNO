import { supabase } from "./supabase.js";

async function getPatients() {
  const { data, error } = await supabase
    .from("patients")
    .select("id")
    .limit(3);

  if (error) {
    console.error("Error fetching patients:", error);
  } else {
    console.log("Patient IDs:", data.map(p => p.id).join(", "));
  }
  process.exit();
}

getPatients();
