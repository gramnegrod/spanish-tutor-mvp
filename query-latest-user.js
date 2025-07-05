#!/usr/bin/env node

// Quick script to query latest user data from Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Use service role key for admin access (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function queryLatestData() {
  console.log('🔍 ADMIN: Querying SpanishTutor database with service role access...\n')
  
  try {
    // Query all users from auth
    console.log('👥 === USER ACCOUNTS ===')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Auth users query error:', authError.message)
    } else {
      console.log(`Found ${authUsers.users?.length || 0} total users:`)
      authUsers.users?.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`)
      })
      
      // Find gramnegrod@gmail.com specifically
      const targetUser = authUsers.users?.find(u => u.email === 'gramnegrod@gmail.com')
      if (targetUser) {
        console.log(`\n🎯 Target user found: ${targetUser.email} (ID: ${targetUser.id})`)
        
        // Query their specific data
        await queryUserData(targetUser.id, targetUser.email)
      } else {
        console.log('\n❌ gramnegrod@gmail.com not found in users')
      }
    }
    
    // Check all conversations in database
    console.log('\n📝 === ALL CONVERSATIONS ===')
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (convError) {
      console.log('❌ Conversations query error:', convError.message)
    } else {
      console.log(`Total conversations: ${allConversations?.length || 0}`)
      allConversations?.slice(0, 5).forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.title} - User: ${conv.user_id} - Duration: ${conv.duration}s - ${conv.created_at}`)
      })
    }
    
    // Check all progress records
    console.log('\n📊 === ALL PROGRESS ===')
    const { data: allProgress, error: progError } = await supabase
      .from('progress')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (progError) {
      console.log('❌ Progress query error:', progError.message)
    } else {
      console.log(`Total progress records: ${allProgress?.length || 0}`)
      allProgress?.forEach((prog, index) => {
        console.log(`${index + 1}. User: ${prog.user_id} - Conversations: ${prog.conversations_completed} - Minutes: ${prog.total_minutes_practiced}`)
      })
    }
    
    // Check newer table structure
    console.log('\n🆕 === ENHANCED TABLES ===')
    
    const { data: learnerProfiles, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
    
    if (profileError && profileError.code !== 'PGRST101') { // PGRST101 = table doesn't exist
      console.log('❌ Learner profiles query error:', profileError.message)
    } else if (learnerProfiles) {
      console.log(`Learner profiles: ${learnerProfiles.length}`)
    } else {
      console.log('Learner profiles table not found (expected)')
    }

    const { data: userProgress, error: userProgError } = await supabase
      .from('user_progress')
      .select('*')
    
    if (userProgError && userProgError.code !== 'PGRST101') {
      console.log('❌ User progress query error:', userProgError.message)
    } else if (userProgress) {
      console.log(`User progress records: ${userProgress.length}`)
    } else {
      console.log('User progress table not found (expected)')
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error.message)
  }
}

async function queryUserData(userId, email) {
  console.log(`\n🔍 === DATA FOR ${email} ===`)
  
  try {
    // Get user's conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (convError) {
      console.log('❌ User conversations error:', convError.message)
    } else {
      console.log(`\n💬 Conversations (${conversations?.length || 0}):`)
      conversations?.forEach((conv, index) => {
        console.log(`${index + 1}. "${conv.title}" - ${conv.persona} - ${conv.duration}s`)
        console.log(`   Created: ${conv.created_at}`)
        console.log(`   Transcript length: ${Array.isArray(conv.transcript) ? conv.transcript.length : 'Invalid'} exchanges`)
        if (conv.analysis) {
          console.log(`   Has analysis: ✅`)
        }
        console.log('')
      })
    }
    
    // Get user's progress
    const { data: progress, error: progError } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
    
    if (progError) {
      console.log('❌ User progress error:', progError.message)
    } else if (progress && progress.length > 0) {
      const prog = progress[0]
      console.log(`📈 Progress:`)
      console.log(`   Conversations completed: ${prog.conversations_completed}`)
      console.log(`   Total minutes practiced: ${prog.total_minutes_practiced}`)
      console.log(`   Pronunciation: ${prog.pronunciation}/100`)
      console.log(`   Grammar: ${prog.grammar}/100`) 
      console.log(`   Fluency: ${prog.fluency}/100`)
      console.log(`   Cultural knowledge: ${prog.cultural_knowledge}/100`)
      console.log(`   Vocabulary words: ${Array.isArray(prog.vocabulary) ? prog.vocabulary.length : 0}`)
    } else {
      console.log('📈 No progress record found')
    }
    
    // Get user adaptations
    const { data: adaptations, error: adaptError } = await supabase
      .from('user_adaptations')
      .select('*')
      .eq('user_id', userId)
    
    if (adaptError) {
      console.log('❌ User adaptations error:', adaptError.message)
    } else if (adaptations && adaptations.length > 0) {
      const adapt = adaptations[0]
      console.log(`\n⚙️ Adaptations:`)
      console.log(`   Speaking pace: ${adapt.speaking_pace_preference}`)
      console.log(`   Visual aids: ${adapt.needs_visual_aids}`)
      console.log(`   Common errors: ${adapt.common_errors?.length || 0}`)
      console.log(`   Mastered concepts: ${adapt.mastered_concepts?.length || 0}`)
      console.log(`   Struggle areas: ${adapt.struggle_areas?.length || 0}`)
      
      // Show detailed struggle areas and common errors
      if (adapt.common_errors && adapt.common_errors.length > 0) {
        console.log(`\n❌ Common Errors:`)
        adapt.common_errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      }
      
      if (adapt.struggle_areas && adapt.struggle_areas.length > 0) {
        console.log(`\n😓 Struggle Areas:`)
        adapt.struggle_areas.forEach((area, index) => {
          console.log(`   ${index + 1}. ${area}`)
        })
      }
      
      if (adapt.mastered_concepts && adapt.mastered_concepts.length > 0) {
        console.log(`\n✅ Mastered Concepts (first 20):`)
        adapt.mastered_concepts.slice(0, 20).forEach((concept, index) => {
          console.log(`   ${index + 1}. ${concept}`)
        })
        if (adapt.mastered_concepts.length > 20) {
          console.log(`   ... and ${adapt.mastered_concepts.length - 20} more`)
        }
      }
    } else {
      console.log('⚙️ No adaptations record found')
    }
    
    // Also check progress vocabulary for struggling words
    if (progress && progress.length > 0) {
      const prog = progress[0]
      if (Array.isArray(prog.vocabulary) && prog.vocabulary.length > 0) {
        console.log(`\n📚 Vocabulary Sample (first 20 words):`)
        prog.vocabulary.slice(0, 20).forEach((word, index) => {
          console.log(`   ${index + 1}. ${word}`)
        })
        if (prog.vocabulary.length > 20) {
          console.log(`   ... and ${prog.vocabulary.length - 20} more words`)
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error querying data for ${email}:`, error.message)
  }
}

queryLatestData()