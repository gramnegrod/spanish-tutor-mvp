import ModuleSelectionDashboard from '@/components/modules/ModuleSelectionDashboard'

export const metadata = {
  title: 'Learning Modules - Spanish Tutor',
  description: 'Choose your Spanish learning path with our interactive modules',
}

export default function ModulesPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <ModuleSelectionDashboard />
      </div>
    </main>
  )
}