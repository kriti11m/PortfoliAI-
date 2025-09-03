#!/bin/bash

# Start ngrok tunnel for PortfoliAI webhook
# This will expose your local server on port 8081 to the internet

echo "🚀 Starting ngrok tunnel for PortfoliAI webhook..."
echo "📡 This will expose localhost:8081 to the internet"
echo "🔗 Use the HTTPS URL for your Twilio webhook configuration"
echo ""

./ngrok http 8081
