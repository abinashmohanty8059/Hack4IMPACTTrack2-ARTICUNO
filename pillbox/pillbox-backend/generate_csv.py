import csv
import random
from datetime import datetime, timedelta

patient_id = "a9ceb0e4-2eb9-4f37-93d2-a259d0d987b4"
num_rows = 100
output_file = "c:/Users/KIIT/OneDrive/Desktop/pillbox/pillbox-backend/vitals_sample_data.csv"

# Generate data
data = []
current_time = datetime.now()

for i in range(num_rows):
    # Simulate realistic vitals
    # Normal spo2: 95-100, slightly risky: 90-94, critical: <90
    # Normal temp: 97-99, fever: >100
    
    # Introduce some variation and occasional high/low values
    if random.random() < 0.1: # 10% chance of abnormal
        spo2 = round(random.uniform(85.0, 94.0), 1)
        temp = round(random.uniform(99.5, 104.0), 1)
    else:
        spo2 = round(random.uniform(95.0, 100.0), 1)
        temp = round(random.uniform(97.0, 99.4), 1)
    
    recorded_at = (current_time - timedelta(hours=i)).strftime("%Y-%m-%d %H:%M:%S")
    
    data.append([patient_id, spo2, temp, recorded_at])

# Write to CSV
with open(output_file, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["patient_id", "spo2", "temp", "recorded_at"])
    writer.writerows(data)

print(f"Generated {num_rows} rows of sample data in {output_file}")
