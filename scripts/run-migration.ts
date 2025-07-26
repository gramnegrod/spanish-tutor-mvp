#!/usr/bin/env ts-node
/**
 * Run module system migration using Supabase service role
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}

async function runMigration() {
  console.log('🚀 Running module system migration...')
  
  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Read migration file
  const migrationPath = path.join(__dirname, 'migrations', 'add-module-system.sql')
  const migrationSql = fs.readFileSync(migrationPath, 'utf8')

  try {
    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
    
    // Verify table creation
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'module_progress')

    if (!tableError && tables && tables.length > 0) {
      console.log('✅ Verified: module_progress table exists')
    } else {
      console.warn('⚠️  Could not verify table creation')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

// Run the migration
runMigration()