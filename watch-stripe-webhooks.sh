#!/bin/bash

# Watch Stripe webhook events in real-time
echo "🔍 Watching Stripe webhook events..."
echo "Press Ctrl+C to stop"
echo ""
echo "Waiting for webhook events..."
echo ""

tail -f /tmp/stripe-webhook.log

