import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for MVP (would use database in production)
const conversations: any[] = []

export async function POST(request: NextRequest) {
  try {
    const { title, persona, transcript, duration, userId } = await request.json()

    // Create a mock conversation object
    const conversation = {
      id: crypto.randomUUID(),
      userId: userId || 'demo-user',
      title: title || 'Practice Conversation',
      persona: persona || 'TAQUERO',
      transcript,
      duration,
      createdAt: new Date().toISOString()
    }

    // Store in memory (in production, this would go to database)
    conversations.push(conversation)

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Conversation creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return recent conversations (in production, would query database)
    const recentConversations = conversations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return NextResponse.json({ conversations: recentConversations })
  } catch (error) {
    console.error('Conversations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}