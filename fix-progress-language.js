const { createClient } = require('@supabase/supabase-js')

// Get these from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

async function fixProgressTable() {
  console.log('Fixing progress table...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // This won't work with regular client, but let's try
  const { data, error } = await supabase.rpc('query', {
    query: `ALTER TABLE progress ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';`
  })
  
  if (error) {
    console.error('Direct query failed:', error.message)
    console.log('\nPlease run this SQL in Supabase dashboard:')
    console.log("ALTER TABLE progress ADD COLUMN language VARCHAR(10) DEFAULT 'es';")
    return
  }
  
  console.log('✅ Language column added successfully!')
}

// Check if we can at least read the table
async function checkTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Cannot read progress table:', error)
  } else {
    console.log('Current progress table columns:', Object.keys(data[0] || {}))
  }
}

checkTable()
// fixProgressTable() // Uncomment if you have service role key