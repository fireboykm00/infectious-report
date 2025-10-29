import { ProtectedRoute } from '@/components/ProtectedRoute'
import Admin from '@/pages/Admin'

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Admin />
    </ProtectedRoute>
  )
}
