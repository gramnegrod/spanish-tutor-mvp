#!/usr/bin/env node

/**
 * Environment Setup Helper for Spanish Tutor MVP
 * This script helps you set up your .env.local file with Supabase credentials
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Setting up environment variables...');

try {
  // Get Supabase status
  const statusOutput = execSync('npx supabase status', { encoding: 'utf8' });
  
  // Parse the output to extract URLs and keys
  const lines = statusOutput.split('\n');
  let apiUrl = '';
  let anonKey = '';
  let serviceRoleKey = '';
  
  lines.forEach(line => {
    if (line.includes('API URL')) {
      apiUrl = line.split('│')[2]?.trim() || '';
    }
    if (line.includes('anon key')) {
      anonKey = line.split('│')[2]?.trim() || '';
    }
    if (line.includes('service_role key')) {
      serviceRoleKey = line.split('│')[2]?.trim() || '';
    }
  });
  
  // Create .env.local content
  const envContent = `# Supabase Configuration (Local Development)
NEXT_PUBLIC_SUPABASE_URL=${apiUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Add your production Supabase credentials here when ready:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
`;

  // Write to .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env.local file created successfully!');
  console.log('');
  console.log('📝 Your local Supabase credentials:');
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   Anon Key: ${anonKey.substring(0, 20)}...`);
  console.log('');
  console.log('⚠️  Don\'t forget to add your OpenAI API key to .env.local');
  console.log('');
  
} catch (error) {
  console.error('❌ Error setting up environment:', error.message);
  console.log('');
  console.log('💡 Make sure Supabase is running with: npx supabase start');
  process.exit(1);
}