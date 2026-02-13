import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { isAuthorizedAdmin, canPerformAction, getAdminLevel } from '@/lib/adminAuth';

/**
 * Middleware to verify admin access on API routes
 */
export async function verifyAdminAccess(
  action?: string
): Promise<{ authorized: boolean; adminId?: string; adminEmail?: string; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { authorized: false, error: 'Not authenticated' };
  }

  if (!isAuthorizedAdmin(session)) {
    return { authorized: false, error: 'User is not an authorized admin' };
  }

  const adminLevel = getAdminLevel(session);

  if (action && !canPerformAction(adminLevel, action)) {
    return { authorized: false, error: `Admin does not have permission to ${action}` };
  }

  return {
    authorized: true,
    adminId: session.user.id || 'unknown',
    adminEmail: session.user.email,
  };
}

/**
 * Rate limiting for admin actions
 */
const actionLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  adminEmail: string,
  action: string,
  maxAttempts: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${adminEmail}:${action}`;
  const now = Date.now();

  const limit = actionLimits.get(key);

  if (!limit || now > limit.resetTime) {
    actionLimits.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
  }

  limit.count++;

  if (limit.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: limit.resetTime };
  }

  return { allowed: true, remaining: maxAttempts - limit.count, resetTime: limit.resetTime };
}

/**
 * Validate action confirmation token
 */
export function generateConfirmationToken(data: Record<string, any>): string {
  // In production, use a proper JWT library
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function verifyConfirmationToken(token: string): Record<string, any> | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Detect suspicious activity
 */
export interface SuspiciousActivity {
  type: 'unusual_time' | 'unusual_location' | 'rapid_actions' | 'failed_attempts';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export function detectSuspiciousActivity(
  adminEmail: string,
  action: string,
  ipAddress?: string
): SuspiciousActivity[] {
  const suspicious: SuspiciousActivity[] = [];

  // Check for rapid consecutive actions
  const key = `${adminEmail}:rapid`;
  const limit = actionLimits.get(key);
  const now = Date.now();

  if (limit && now - limit.resetTime < 5000) {
    if (limit.count > 5) {
      suspicious.push({
        type: 'rapid_actions',
        severity: 'high',
        message: 'Unusual number of actions in short time period',
      });
    }
  }

  // Check for destructive actions outside normal hours
  const hour = new Date().getHours();
  if ((hour < 6 || hour > 22) && ['delete_user', 'reset_system'].includes(action)) {
    suspicious.push({
      type: 'unusual_time',
      severity: 'medium',
      message: 'Sensitive action attempted outside normal business hours',
    });
  }

  return suspicious;
}
