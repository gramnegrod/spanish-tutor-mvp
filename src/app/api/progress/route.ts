import { NextResponse } from 'next/server'
import { progressService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'

export async function GET(_request: Request) {
  try {
    // Create server client with proper cookie handling
    const supabase = await createClient()
    
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get progress for the authenticated user
    const progress = await progressService.getByUserId(supabase, user.id)
    
    // Calculate streak (simplified for now)
    const streak = progress?.conversations_completed || 0

    // Determine level based on progress
    const totalScore = (progress?.pronunciation || 0) + (progress?.grammar || 0) + 
                      (progress?.fluency || 0) + (progress?.cultural_knowledge || 0)
    const level = totalScore < 100 ? 'beginner' : totalScore < 200 ? 'intermediate' : 'advanced'

    return NextResponse.json({
      progress: progress || {
        vocabulary: [],
        pronunciation: 0,
        grammar: 0,
        fluency: 0,
        cultural_knowledge: 0,
        total_minutes_practiced: 0,
        conversations_completed: 0
      },
      streak,
      level
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Create server client with proper cookie handling
    const supabase = await createClient()
    
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      vocabulary, 
      minutesPracticed, 
      pronunciationImprovement,
      grammarImprovement,
      fluencyImprovement,
      culturalImprovement
    } = body

    // Update progress using increment function
    const progress = await progressService.incrementStats(supabase, user.id, {
      minutes_practiced: minutesPracticed || 0,
      conversations_completed: 1,
      pronunciation_improvement: pronunciationImprovement || 0,
      grammar_improvement: grammarImprovement || 0,
      fluency_improvement: fluencyImprovement || 0,
      cultural_improvement: culturalImprovement || 0
    })

    // Add vocabulary if provided
    if (vocabulary && vocabulary.length > 0) {
      await progressService.addVocabulary(supabase, user.id, vocabulary)
    }

    // Calculate new streak
    const streak = progress.conversations_completed || 0

    return NextResponse.json({ 
      progress,
      streak
    })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}