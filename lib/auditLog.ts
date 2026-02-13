/**
 * Audit Log Entry Interface
 */
export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'warning';
  reason?: string;
}

/**
 * Log admin audit trail
 */
export async function logAdminAction(
  entry: AuditLogEntry
): Promise<void> {
  try {
    // In production, this would save to your database
    const auditLog = {
      ...entry,
      timestamp: new Date(),
    };

    console.log('[ADMIN AUDIT LOG]', auditLog);

    // Save to IndexedDB for client-side or to backend API
    // For now, we'll just log to console and can be extended to Convex
    await saveAuditToBackend(auditLog);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Save audit log to backend
 */
async function saveAuditToBackend(log: AuditLogEntry): Promise<void> {
  try {
    // This would call your Convex API endpoint
    // await fetch('/api/admin/audit-log', {
    //   method: 'POST',
    //   body: JSON.stringify(log),
    // });
  } catch (error) {
    console.error('Error saving audit log:', error);
  }
}

/**
 * Get IP address from request (for Node.js backend)
 */
export function getClientIp(request: Request | null): string {
  if (!request) return 'unknown';

  const forwarded = request.headers?.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0] : 'unknown';
}

/**
 * Generate audit log summary
 */
export function generateAuditSummary(logs: AuditLogEntry[]): {
  total: number;
  byAction: Record<string, number>;
  failures: number;
  warnings: number;
} {
  return {
    total: logs.length,
    byAction: logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    failures: logs.filter(l => l.status === 'failed').length,
    warnings: logs.filter(l => l.status === 'warning').length,
  };
}
