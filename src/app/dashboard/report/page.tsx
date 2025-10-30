'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CaseReportForm } from '@/components/forms/CaseReportForm'
import { useRouter } from 'next/navigation'

export default function ReportPage() {
  const router = useRouter();

  const handleSuccess = (caseId: string) => {
    // Redirect to case details or dashboard
    router.push(`/dashboard?success=case_reported&id=${caseId}`);
  };

  return (
    <ProtectedRoute allowedRoles={['reporter', 'district_officer', 'national_officer', 'admin']}>
      <div className="container mx-auto p-4 md:p-6">
        <CaseReportForm onSuccess={handleSuccess} />
      </div>
    </ProtectedRoute>
  )
}
