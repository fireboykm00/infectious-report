import { ProtectedRoute } from '@/components/ProtectedRoute'
import Notifications from '@/pages/Notifications'

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  )
}
