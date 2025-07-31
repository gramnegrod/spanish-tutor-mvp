import { NextResponse } from 'next/server'
import { adaptationsService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'

export async function GET(_request: Request) {
  try {
    const supabase = await createClient()
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const adaptations = await adaptationsService.getByUserId(supabase, user.id)
    return NextResponse.json({ adaptations })
  } catch (error) {
    console.error('Error fetching adaptations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adaptations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { common_errors, mastered_concepts, struggle_areas } = body

    const adaptations = await adaptationsService.upsert(supabase, {
      user_id: user.id,
      common_errors: common_errors || [],
      mastered_concepts: mastered_concepts || [],
      struggle_areas: struggle_areas || []
    })

    return NextResponse.json({ adaptations })
  } catch (error) {
    console.error('Error updating adaptations:', error)
    return NextResponse.json(
      { error: 'Failed to update adaptations' },
      { status: 500 }
    )
  }
}