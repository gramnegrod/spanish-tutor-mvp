#!/bin/bash

# Supabase Setup Script for Spanish Tutor MVP
# This script automates the database setup process

set -e

echo "🚀 Setting up Supabase for Spanish Tutor MVP..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if not already installed
echo "📦 Installing dependencies..."
npm install

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Initialize Supabase if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase..."
    npx supabase init
else
    echo "✅ Supabase already initialized"
fi

# Start local Supabase (this will pull Docker images if needed)
echo "🐳 Starting local Supabase..."
npx supabase start

# Wait a moment for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Reset database with our migrations
echo "📊 Setting up database with migrations..."
npx supabase db reset

# Generate TypeScript types
echo "⚡ Generating TypeScript types..."
mkdir -p src/types
npx supabase gen types typescript --local > src/types/supabase.ts

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your local Supabase credentials to .env.local"
echo "2. Run 'npx supabase status' to see your local URLs"
echo "3. Link to your remote Supabase project: 'npx supabase link --project-ref YOUR_PROJECT_REF'"
echo "4. Push to production: 'npx supabase db push'"
echo ""
echo "🌐 Local URLs:"
npx supabase status