import pandas as pd
import json
import urllib.request
import os

SUPABASE_URL = "https://tptnowejgljcojjpisvc.supabase.co"
SUPABASE_KEY = "sb_publishable_24LQedmil4rxGU3Ex3PL0w_P1zsoEdD"

def fetch_vitals():
    url = f"{SUPABASE_URL}/rest/v1/vitals_logs?select=spo2,temp"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def process_and_save(data):
    if not data:
        print("No data fetched from Supabase.")
        return

    processed_data = []
    for row in data:
        spo2 = row.get("spo2")
        temp = row.get("temp")
        
        if spo2 is None or temp is None:
            continue
            
        # Generate label based on documented thresholds
        label = 1 if spo2 < 90 or temp > 101 else 0
        # Default missed to 0 for new data
        missed = 0
        
        processed_data.append([spo2, temp, missed, label])

    df = pd.DataFrame(processed_data, columns=["spo2", "temp", "missed", "label"])
    
    # Load existing data if it exists to append
    if os.path.exists("data.csv"):
        existing_df = pd.read_csv("data.csv")
        # Combine and drop duplicates if necessary, or just append
        df = pd.concat([existing_df, df]).drop_duplicates().reset_index(drop=True)
    
    df.to_csv("data.csv", index=False)
    print(f"Updated data.csv with {len(processed_data)} new records from Supabase. Total records: {len(df)}")

if __name__ == "__main__":
    vitals = fetch_vitals()
    process_and_save(vitals)
