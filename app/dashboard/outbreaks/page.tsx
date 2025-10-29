import { ProtectedRoute } from '@/components/ProtectedRoute'
import Outbreaks from '@/pages/Outbreaks'

export default function OutbreaksPage() {
  return (
    <ProtectedRoute allowedRoles={['district_officer', 'national_officer', 'admin']}>
      <Outbreaks />
    </ProtectedRoute>
  )
}
