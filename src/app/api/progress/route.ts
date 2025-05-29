import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progress = await prisma.progress.findUnique({
      where: { userId: session.user.id }
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        streak: true,
        lastPractice: true,
        level: true
      }
    })

    return NextResponse.json({
      progress,
      streak: user?.streak || 0,
      level: user?.level || 'TURISTA'
    })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vocabulary, minutesPracticed } = await request.json()

    // Update or create progress
    const currentProgress = await prisma.progress.findUnique({
      where: { userId: session.user.id }
    })
    
    const currentVocab = currentProgress ? JSON.parse(currentProgress.vocabulary) : []
    const newVocab = [...currentVocab, ...(vocabulary || [])]
    
    const progress = await prisma.progress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        vocabulary: JSON.stringify(vocabulary || []),
        totalMinutes: minutesPracticed || 0,
        wordsLearned: vocabulary?.length || 0
      },
      update: {
        vocabulary: JSON.stringify(newVocab),
        totalMinutes: {
          increment: minutesPracticed || 0
        },
        wordsLearned: {
          increment: vocabulary?.length || 0
        }
      }
    })

    // Update user's last practice and streak
    const lastPractice = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastPractice: true, streak: true }
    })

    const now = new Date()
    const lastPracticeDate = lastPractice?.lastPractice
    let newStreak = 1

    if (lastPracticeDate) {
      const daysSinceLastPractice = Math.floor(
        (now.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastPractice === 1) {
        newStreak = (lastPractice.streak || 0) + 1
      } else if (daysSinceLastPractice === 0) {
        newStreak = lastPractice.streak || 1
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastPractice: now,
        streak: newStreak
      }
    })

    return NextResponse.json({ progress, streak: newStreak })
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}