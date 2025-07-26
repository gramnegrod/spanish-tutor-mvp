import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Loading component for Session Summary
const LoadingSummary = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <Card className="max-w-4xl mx-4">
      <CardContent className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Preparing session summary...</span>
        </div>
      </CardContent>
    </Card>
  </div>
)

// Dynamically import the Session Summary with Analysis
export const DynamicSessionSummaryWithAnalysis = dynamic(
  () => import('./SessionSummaryWithAnalysis').then(mod => mod.SessionSummaryWithAnalysis),
  {
    loading: () => <LoadingSummary />,
    ssr: false
  }
)