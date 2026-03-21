-- Create vitals_logs table
CREATE TABLE IF NOT EXISTS vitals_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  spo2 float,
  temp float,
  recorded_at timestamp with time zone DEFAULT now()
);

-- Index for faster queries by patient_id
CREATE INDEX IF NOT EXISTS idx_vitals_logs_patient_id ON vitals_logs(patient_id);
