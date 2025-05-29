import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIAnalyticsService } from '@/lib/openai-analytics'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: session.user.id 
      },
      include: {
        user: true
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Analyze conversation
    const analyticsService = new OpenAIAnalyticsService(
      process.env.OPENAI_API_KEY!
    )

    const analysis = await analyticsService.analyzeConversation(
      JSON.stringify(conversation.transcript),
      conversation.user.level
    )

    const keyLearnings = await analyticsService.getKeyLearnings(
      JSON.stringify(conversation.transcript)
    )

    // Update conversation with analysis
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        analysis: {
          ...analysis,
          keyLearnings
        }
      }
    })

    // Update user progress
    const progress = await prisma.progress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        pronunciation: analysis.progress_indicators.fluency_improvement,
        fluency: analysis.progress_indicators.fluency_improvement,
        culturalKnowledge: analysis.progress_indicators.cultural_understanding,
        vocabulary: []
      },
      update: {
        pronunciation: {
          increment: Math.round(analysis.progress_indicators.fluency_improvement / 10)
        },
        fluency: {
          increment: Math.round(analysis.progress_indicators.fluency_improvement / 10)
        },
        culturalKnowledge: {
          increment: Math.round(analysis.progress_indicators.cultural_understanding / 10)
        }
      }
    })

    return NextResponse.json({
      analysis: updatedConversation.analysis,
      progress
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    )
  }
}