import { ProtectedRoute } from '@/components/ProtectedRoute'
import Lab from '@/pages/Lab'

export default function LabPage() {
  return (
    <ProtectedRoute allowedRoles={['lab_tech', 'admin']}>
      <Lab />
    </ProtectedRoute>
  )
}
