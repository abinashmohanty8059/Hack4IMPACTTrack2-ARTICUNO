import os
from dotenv import load_dotenv
from flask import Flask, request
from twilio.rest import Client

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

ACCOUNT_SID = os.getenv("ACCOUNT_SID")
AUTH_TOKEN = os.getenv("AUTH_TOKEN")

client = Client(ACCOUNT_SID, AUTH_TOKEN)

TWILIO_NUMBER = os.getenv("TWILIO_NUMBER")
DRIVER_NUMBER = os.getenv("DRIVER_NUMBER")

@app.route("/sms", methods=["POST"])
def sms_reply():
    msg = request.form.get("Body")

    print("Received message:", msg)

    if msg and "100 " in msg:
        print("Triggering call to driver...")

        client.calls.create(
            to=DRIVER_NUMBER,
            from_=TWILIO_NUMBER,
            twiml="<Response><Say>Emergency alert. Please respond immediately.</Say></Response>"
        )

    return "OK"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)