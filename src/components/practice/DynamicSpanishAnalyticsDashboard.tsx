import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading component for Spanish Analytics Dashboard
const LoadingDashboard = () => (
  <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
    <Loader2 className="w-6 h-6 animate-spin mr-2" />
    <span>Loading analytics...</span>
  </div>
)

// Dynamically import the Spanish Analytics Dashboard
export const DynamicSpanishAnalyticsDashboard = dynamic(
  () => import('./SpanishAnalyticsDashboard').then(mod => mod.SpanishAnalyticsDashboard),
  {
    loading: () => <LoadingDashboard />,
    ssr: false // Disable SSR for client-side analytics
  }
)