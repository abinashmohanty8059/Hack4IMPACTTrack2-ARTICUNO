Since the user already has an access token, they only need
to register the webhook URL with Meta.

Steps:
1. Run the backend: uvicorn main:app --reload --port 8000
2. Expose locally with ngrok: ngrok http 8000
3. Copy the ngrok HTTPS URL e.g. https://abc123.ngrok.io
4. Go to Meta Developer Dashboard:
     Your App → WhatsApp → Configuration → Webhook
5. Set:
     Callback URL: https://abc123.ngrok.io/webhook
     Verify Token: whatever you put in WA_VERIFY_TOKEN in .env
6. Click Verify and Save
7. Under Webhook Fields → subscribe to: messages
8. Test by sending a WhatsApp message to your business number
