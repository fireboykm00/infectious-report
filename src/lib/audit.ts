/**
 * Audit Logging Utilities
 * Track all important actions for security and compliance
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'read'
  | 'export'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject';

export type ResourceType =
  | 'case_report'
  | 'lab_result'
  | 'outbreak'
  | 'contact'
  | 'user'
  | 'facility'
  | 'notification'
  | 'alert_rule'
  | 'inventory';

export interface AuditLogEntry {
  user_id: string;
  action: string;
  target_type: string;
  target_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event to the database
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      action: entry.action.toUpperCase(),
      target_type: entry.target_type,
      target_id: entry.target_id,
      old_data: entry.old_data || null,
      new_data: entry.new_data || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log audit entry:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

/**
 * Log case report action
 */
export async function logCaseAction(
  userId: string,
  action: AuditAction,
  caseId: string,
  data?: Record<string, any>
): Promise<void> {
  await logAudit({
    user_id: userId,
    action,
    target_type: 'case_reports',
    target_id: caseId,
    new_data: data,
  });
}

/**
 * Log lab result action
 */
export async function logLabAction(
  userId: string,
  action: AuditAction,
  labResultId: string,
  data?: Record<string, any>
): Promise<void> {
  await logAudit({
    user_id: userId,
    action,
    target_type: 'lab_results',
    target_id: labResultId,
    new_data: data,
  });
}

/**
 * Log outbreak action
 */
export async function logOutbreakAction(
  userId: string,
  action: AuditAction,
  outbreakId: string,
  data?: Record<string, any>
): Promise<void> {
  await logAudit({
    user_id: userId,
    action,
    target_type: 'outbreaks',
    target_id: outbreakId,
    new_data: data,
  });
}

/**
 * Log user authentication
 */
export async function logAuth(
  userId: string,
  action: 'login' | 'logout',
  data?: Record<string, any>
): Promise<void> {
  await logAudit({
    user_id: userId,
    action,
    target_type: 'users',
    target_id: userId,
    new_data: data,
  });
}

/**
 * Log data export
 */
export async function logExport(
  userId: string,
  resourceType: ResourceType,
  data?: Record<string, any>
): Promise<void> {
  await logAudit({
    user_id: userId,
    action: 'export',
    target_type: resourceType,
    new_data: data,
  });
}

/**
 * Get audit trail for a specific resource
 */
export async function getAuditTrail(
  resourceType: string,
  resourceId: string,
  limit: number = 50
) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('target_type', resourceType)
    .eq('target_id', resourceId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch audit trail:', error);
    return [];
  }

  return data || [];
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(userId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch user activity:', error);
    return [];
  }

  return data || [];
}

/**
 * Get system-wide audit logs (admin only)
 */
export async function getSystemAuditLogs(
  filters?: {
    action?: string;
    targetType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  },
  limit: number = 100
) {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (filters?.action) {
    query = query.eq('action', filters.action.toUpperCase());
  }

  if (filters?.targetType) {
    query = query.eq('target_type', filters.targetType);
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.startDate) {
    query = query.gte('timestamp', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('timestamp', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch system audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Format audit log entry for display
 */
export function formatAuditEntry(entry: any): string {
  const action = entry.action.charAt(0).toUpperCase() + entry.action.slice(1).toLowerCase();
  const resource = entry.target_type.replace('_', ' ');
  
  return `${action} ${resource} ${entry.target_id ? `(ID: ${entry.target_id.substring(0, 8)}...)` : ''}`;
}

/**
 * Calculate audit statistics
 */
export async function getAuditStatistics(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, target_type')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate);

  if (error || !data) {
    return {
      totalActions: 0,
      actionBreakdown: {},
      resourceBreakdown: {},
    };
  }

  const actionBreakdown: Record<string, number> = {};
  const resourceBreakdown: Record<string, number> = {};

  data.forEach((entry) => {
    actionBreakdown[entry.action] = (actionBreakdown[entry.action] || 0) + 1;
    resourceBreakdown[entry.target_type] = 
      (resourceBreakdown[entry.target_type] || 0) + 1;
  });

  return {
    totalActions: data.length,
    actionBreakdown,
    resourceBreakdown,
  };
}
