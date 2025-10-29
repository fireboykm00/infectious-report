import { ProtectedRoute } from '@/components/ProtectedRoute'
import ReportCase from '@/pages/ReportCase'

export default function ReportPage() {
  return (
    <ProtectedRoute allowedRoles={['reporter', 'district_officer', 'national_officer', 'admin']}>
      <ReportCase />
    </ProtectedRoute>
  )
}
