/**
 * Role-Based Access Control (RBAC) Utilities
 * Centralized permission management for the IDSR platform
 */

export type UserRole = 'reporter' | 'lab_tech' | 'district_officer' | 'national_officer' | 'admin';

export type Resource = 
  | 'cases'
  | 'lab_results'
  | 'analytics'
  | 'outbreaks'
  | 'contacts'
  | 'notifications'
  | 'users'
  | 'facilities'
  | 'admin_settings';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve';

/**
 * Permission matrix defining what each role can do
 * Format: { role: { resource: [actions] } }
 */
export const PERMISSIONS: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  reporter: {
    cases: ['create', 'read', 'update'],
    notifications: ['read'],
    facilities: ['read'],
  },
  lab_tech: {
    cases: ['read'],
    lab_results: ['create', 'read', 'update'],
    notifications: ['read'],
    facilities: ['read'],
  },
  district_officer: {
    cases: ['create', 'read', 'update', 'export'],
    lab_results: ['read', 'export'],
    analytics: ['read', 'export'],
    outbreaks: ['create', 'read', 'update'],
    contacts: ['create', 'read', 'update'],
    notifications: ['create', 'read'],
    facilities: ['read'],
    users: ['read'],
  },
  national_officer: {
    cases: ['create', 'read', 'update', 'delete', 'export', 'approve'],
    lab_results: ['read', 'update', 'export', 'approve'],
    analytics: ['read', 'export'],
    outbreaks: ['create', 'read', 'update', 'delete', 'approve'],
    contacts: ['create', 'read', 'update', 'delete'],
    notifications: ['create', 'read', 'update'],
    facilities: ['read', 'update'],
    users: ['read', 'update'],
  },
  admin: {
    cases: ['create', 'read', 'update', 'delete', 'export', 'approve'],
    lab_results: ['create', 'read', 'update', 'delete', 'export', 'approve'],
    analytics: ['read', 'export'],
    outbreaks: ['create', 'read', 'update', 'delete', 'approve'],
    contacts: ['create', 'read', 'update', 'delete'],
    notifications: ['create', 'read', 'update', 'delete'],
    facilities: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    admin_settings: ['create', 'read', 'update', 'delete'],
  },
};

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  userRole: UserRole | null | undefined,
  resource: Resource,
  action: Action
): boolean {
  if (!userRole) return false;
  
  const rolePermissions = PERMISSIONS[userRole];
  const resourcePermissions = rolePermissions?.[resource];
  
  return resourcePermissions?.includes(action) ?? false;
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole | null | undefined,
  permissions: Array<{ resource: Resource; action: Action }>
): boolean {
  return permissions.some(({ resource, action }) => 
    hasPermission(userRole, resource, action)
  );
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(
  userRole: UserRole | null | undefined,
  permissions: Array<{ resource: Resource; action: Action }>
): boolean {
  return permissions.every(({ resource, action }) => 
    hasPermission(userRole, resource, action)
  );
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Partial<Record<Resource, Action[]>> {
  return PERMISSIONS[role] || {};
}

/**
 * Check if user role is allowed to access a route
 */
export function canAccessRoute(userRole: UserRole | null | undefined, route: string): boolean {
  if (!userRole) return false;
  
  const routePermissions: Record<string, Resource> = {
    '/dashboard': 'cases',
    '/dashboard/report': 'cases',
    '/dashboard/lab': 'lab_results',
    '/dashboard/analytics': 'analytics',
    '/dashboard/outbreaks': 'outbreaks',
    '/dashboard/notifications': 'notifications',
    '/dashboard/profile': 'cases', // Everyone with cases access can view profile
    '/dashboard/admin': 'admin_settings',
  };
  
  const resource = routePermissions[route];
  if (!resource) return true; // Allow access to unprotected routes
  
  return hasPermission(userRole, resource, 'read');
}

/**
 * Facility-level data filtering
 * District officers see only their district, reporters see only their facility
 */
export function getDataScope(
  userRole: UserRole,
  facilityId?: string | null,
  districtId?: string | null
): {
  scope: 'global' | 'district' | 'facility';
  facilityId?: string;
  districtId?: string;
} {
  switch (userRole) {
    case 'admin':
    case 'national_officer':
      return { scope: 'global' };
    
    case 'district_officer':
      return { scope: 'district', districtId: districtId || undefined };
    
    case 'reporter':
    case 'lab_tech':
      return { scope: 'facility', facilityId: facilityId || undefined };
    
    default:
      return { scope: 'facility', facilityId: facilityId || undefined };
  }
}

/**
 * Validate if user can perform action on specific resource instance
 * Takes into account data ownership and hierarchy
 */
export function canAccessResource(
  userRole: UserRole,
  action: Action,
  resource: Resource,
  resourceData?: {
    facilityId?: string;
    districtId?: string;
    ownerId?: string;
  },
  userData?: {
    userId: string;
    facilityId?: string | null;
    districtId?: string | null;
  }
): boolean {
  // First check if role has permission for this action
  if (!hasPermission(userRole, resource, action)) {
    return false;
  }
  
  // If no resource data provided, allow (for list views)
  if (!resourceData || !userData) {
    return true;
  }
  
  // Admin and national officers have global access
  if (userRole === 'admin' || userRole === 'national_officer') {
    return true;
  }
  
  // District officers can access their district's data
  if (userRole === 'district_officer') {
    return resourceData.districtId === userData.districtId;
  }
  
  // Reporters and lab techs can only access their facility's data
  if (userRole === 'reporter' || userRole === 'lab_tech') {
    return resourceData.facilityId === userData.facilityId;
  }
  
  return false;
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    reporter: 'Health Reporter',
    lab_tech: 'Laboratory Technician',
    district_officer: 'District Officer',
    national_officer: 'National Officer',
    admin: 'System Administrator',
  };
  
  return roleNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    reporter: 'Can report disease cases from health facilities',
    lab_tech: 'Can upload and manage laboratory test results',
    district_officer: 'Can view and manage district-level data and outbreaks',
    national_officer: 'Can view and manage national-level surveillance data',
    admin: 'Full system access including user and configuration management',
  };
  
  return descriptions[role] || '';
}
