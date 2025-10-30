import { ProtectedRoute } from '@/components/ProtectedRoute'
import Analytics from '@/pages/Analytics'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['district_officer', 'national_officer', 'admin']}>
      <Analytics />
    </ProtectedRoute>
  )
}
