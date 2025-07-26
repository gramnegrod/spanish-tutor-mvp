import dynamic from 'next/dynamic'

// Dynamically import session modals - they're only shown conditionally
export const DynamicSessionModals = dynamic(
  () => import('./SessionModals').then(mod => mod.SessionModals),
  {
    ssr: false // These are interactive modals, no need for SSR
  }
)