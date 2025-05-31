import { NextResponse } from 'next/server'
import { conversationService, dbHelpers } from '@/lib/supabase-db'

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get conversations for the authenticated user
    const conversations = await conversationService.getByUserId(user.id)

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { title, persona, transcript, duration } = body

    if (!title || !transcript) {
      return NextResponse.json(
        { error: 'title and transcript are required' },
        { status: 400 }
      )
    }

    // Create conversation in Supabase
    const conversation = await conversationService.create({
      user_id: user.id,
      title,
      persona: persona || 'Taco Vendor',
      transcript,
      duration: duration || 0
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}