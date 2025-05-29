#!/bin/bash

echo "🌮 Starting Mexican Spanish Tutor Demo..."
echo ""
echo "This will start the app in demo mode - no database or API keys needed!"
echo ""

# Skip database setup for demo
export SKIP_ENV_VALIDATION=true

# Just run the dev server
npm run dev

echo ""
echo "✅ Demo is running at http://localhost:3000/demo"