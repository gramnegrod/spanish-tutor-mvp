#!/usr/bin/env tsx
/**
 * Run module system migration using service role key
 * This script uses the service role key which has admin permissions
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running module system migration with service role...')
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-module-system.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration as a single transaction
    const { data, error } = await supabase.rpc('query', {
      query: migrationSql
    })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Verify table creation
    const { data: tables, error: verifyError } = await supabase
      .from('module_progress')
      .select('count')
      .limit(1)
    
    if (!verifyError) {
      console.log('✅ Verified: module_progress table exists!')
    } else if (verifyError.code === '42P01') {
      console.error('❌ Table creation verification failed')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 Module system database setup complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err)
    process.exit(1)
  })