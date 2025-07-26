#!/usr/bin/env tsx
/**
 * Check if module system migration has been applied
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkMigration() {
  console.log('🔍 Checking if module_progress table exists...')
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .limit(1)

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ Table module_progress does not exist - migration needed')
        console.log('\nTo apply the migration manually:')
        console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/rmdahccxvijcyouwrhvr/sql/new')
        console.log('2. Copy the contents of scripts/migrations/add-module-system.sql')
        console.log('3. Paste and run in the SQL editor')
      } else {
        console.error('❌ Error checking table:', error.message)
      }
    } else {
      console.log('✅ Table module_progress exists!')
      console.log(`Found ${data?.length || 0} records`)
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

checkMigration()