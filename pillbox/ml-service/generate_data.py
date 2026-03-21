import pandas as pd
import random

data = []

for patient in range(50):
    spo2 = random.randint(94, 99)
    temp = 98.6

    for t in range(50):
        # simulate drift
        spo2 += random.randint(-2, 1)
        temp += random.uniform(-0.3, 0.5)
        
        # Keep vitals in realistic range
        spo2 = max(80, min(100, spo2))
        temp = max(95, min(105, temp))

        missed = random.choice([0, 1])

        # label based on thresholds
        label = 1 if spo2 < 90 or temp > 101 else 0

        data.append([spo2, temp, missed, label])

df = pd.DataFrame(data, columns=["spo2", "temp", "missed", "label"])
df.to_csv("data.csv", index=False)

print(f"Dataset generated! Total records: {len(df)}")
