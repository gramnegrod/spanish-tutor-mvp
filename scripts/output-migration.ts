#!/usr/bin/env tsx
/**
 * Output migration SQL for manual execution
 */
import fs from 'fs'
import path from 'path'

const migrationPath = path.join(__dirname, 'migrations', 'add-module-system.sql')
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

console.log('📋 Module System Migration SQL:')
console.log('================================')
console.log('\nCopy and paste the following SQL into your Supabase dashboard:')
console.log('https://supabase.com/dashboard/project/rmdahccxvijcyouwrhvr/sql/new')
console.log('\n================================')
console.log(migrationSql)
console.log('================================\n')