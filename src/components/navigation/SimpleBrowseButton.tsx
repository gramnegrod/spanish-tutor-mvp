'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function SimpleBrowseButton() {
  return (
    <div className="fixed top-4 left-4 z-50">
      <Link href="/practice-v2/select-npc">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 shadow-lg">
          🎭 Browse All Characters
        </Button>
      </Link>
    </div>
  )
}