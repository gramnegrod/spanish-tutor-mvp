#!/bin/bash

# Cloud-Only Supabase Setup for Spanish Tutor MVP
# This script connects directly to your Supabase cloud project

set -e

echo "☁️  Setting up Cloud-Only Supabase for Spanish Tutor MVP..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies (including Supabase CLI)
echo "📦 Installing dependencies..."
npm install

# Link to your existing Supabase project
echo "🔗 Linking to your Supabase project..."
npx supabase link --project-ref rmdahccxvijcyouwrhvr

# Push our migrations to your cloud database
echo "📊 Setting up database tables in Supabase cloud..."
npx supabase db push

# Generate TypeScript types from your cloud database
echo "⚡ Generating TypeScript types from cloud database..."
mkdir -p src/types
npx supabase gen types typescript --project-id rmdahccxvijcyouwrhvr > src/types/supabase.ts

echo ""
echo "✅ Cloud-only Supabase setup complete!"
echo ""
echo "🎯 What was created:"
echo "   • Database tables in your Supabase cloud project"
echo "   • Row Level Security policies"
echo "   • TypeScript types generated"
echo "   • Everything connected to: https://rmdahccxvijcyouwrhvr.supabase.co"
echo ""
echo "🚀 Your app is now ready to use Supabase!"