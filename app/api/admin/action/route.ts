import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, checkRateLimit, detectSuspiciousActivity } from '@/lib/adminMiddleware';
import { logAdminAction } from '@/lib/auditLog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Verify admin access
    const accessCheck = await verifyAdminAccess(action);

    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: 403 }
      );
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(accessCheck.adminEmail!, action);
    if (!rateLimit.allowed) {
      // Log failed attempt
      await logAdminAction({
        timestamp: new Date(),
        adminId: accessCheck.adminId!,
        adminEmail: accessCheck.adminEmail!,
        action,
        resource: 'rate_limit',
        status: 'failed',
        reason: 'Rate limit exceeded',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });

      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Detect suspicious activity
    const suspicious = detectSuspiciousActivity(
      accessCheck.adminEmail!,
      action,
      request.headers.get('x-forwarded-for') || undefined
    );

    if (suspicious.some(s => s.severity === 'high')) {
      // Log suspicious activity
      await logAdminAction({
        timestamp: new Date(),
        adminId: accessCheck.adminId!,
        adminEmail: accessCheck.adminEmail!,
        action,
        resource: 'security',
        status: 'warning',
        reason: `Suspicious activity detected: ${suspicious.map(s => s.message).join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });
    }

    // Log successful action
    await logAdminAction({
      timestamp: new Date(),
      adminId: accessCheck.adminId!,
      adminEmail: accessCheck.adminEmail!,
      action,
      resource: data?.resource || 'unknown',
      resourceId: data?.resourceId,
      changes: data?.changes,
      status: 'success',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json(
      {
        success: true,
        message: `Action '${action}' completed successfully`,
        warnings: suspicious.filter(s => s.severity !== 'high'),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
