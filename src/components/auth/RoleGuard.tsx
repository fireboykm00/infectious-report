'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks'
import { hasPermission, canAccessRoute, type UserRole, type Resource, type Action } from '@/lib/rbac'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface RoleGuardProps {
  children: ReactNode
  resource?: Resource
  action?: Action
  route?: string
  fallback?: ReactNode
  allowedRoles?: UserRole[]
}

/**
 * RoleGuard Component
 * Conditionally renders children based on user permissions
 * 
 * Usage:
 * <RoleGuard resource="users" action="create">
 *   <Button>Add User</Button>
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  resource,
  action = 'read',
  route,
  fallback,
  allowedRoles,
}: RoleGuardProps) {
  const { user, loading } = useAuth()
  const { role: userRoleString } = useUserRole()
  const userRole = userRoleString as UserRole | undefined

  // Show loading state
  if (loading) {
    return null
  }

  // Not authenticated
  if (!user) {
    return fallback ? <>{fallback}</> : null
  }

  // Check role-based access
  let hasAccess = false

  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = userRole ? allowedRoles.includes(userRole) : false
  } else if (route) {
    hasAccess = canAccessRoute(userRole, route)
  } else if (resource) {
    hasAccess = hasPermission(userRole, resource, action)
  } else {
    // No restrictions specified, allow if authenticated
    hasAccess = true
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

/**
 * Unauthorized Component
 * Shows when user doesn't have permission
 */
export function Unauthorized() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Access Denied</p>
          <p className="text-sm">
            You don't have permission to access this resource.
            Please contact your administrator if you believe this is an error.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/**
 * Hook to check permissions
 */
export function usePermission(resource: Resource, action: Action) {
  const { user } = useAuth()
  const { role } = useUserRole()

  if (!user || !role) {
    return false
  }

  return hasPermission(role as UserRole, resource, action)
}

/**
 * Hook to get user role
 */
function useUserRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  
  useEffect(() => {
    if (!user) {
      setRole(null)
      return
    }
    
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setRole(data?.role || null))
  }, [user])
  
  return { role }
}
