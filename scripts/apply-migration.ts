#!/usr/bin/env tsx
/**
 * Apply module system migration using Supabase client
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Applying module system migration...')
  
  // Read migration file
  const migrationPath = path.join(__dirname, 'migrations', 'add-module-system.sql')
  const migrationSql = fs.readFileSync(migrationPath, 'utf8')

  // Split SQL statements by semicolon (simple approach)
  // Filter out empty statements and comments
  const statements = migrationSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (const statement of statements) {
    if (!statement.trim()) continue
    
    try {
      // Execute each statement
      const { error } = await supabase.rpc('exec', {
        sql: statement + ';'
      }).single()

      if (error) {
        // Try direct approach for DDL statements
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement + ';' })
        })

        if (!response.ok) {
          console.error(`❌ Failed to execute statement:`, statement.substring(0, 50) + '...')
          errorCount++
        } else {
          successCount++
        }
      } else {
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error executing statement:`, err)
      errorCount++
    }
  }

  console.log(`\n📊 Migration Results:`)
  console.log(`✅ Successful statements: ${successCount}`)
  console.log(`❌ Failed statements: ${errorCount}`)

  // Verify table creation
  const { data: tables, error: tableError } = await supabase
    .from('module_progress')
    .select('*')
    .limit(1)

  if (!tableError) {
    console.log('\n✅ Successfully created module_progress table!')
  } else if (tableError.message.includes('does not exist')) {
    console.log('\n❌ Table creation failed. Please run migration manually in Supabase dashboard.')
  }
}

applyMigration().catch(console.error)