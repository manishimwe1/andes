/**
 * EXAMPLES: How to Use Security Features
 * 
 * This file shows practical examples of using the security features
 * in your admin panel components and pages.
 */

// ============================================================================
// 1. CHECKING ADMIN ACCESS IN COMPONENTS
// ============================================================================

import { useSession } from 'next-auth/react';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export function AdminOnlyComponent() {
  const { data: session } = useSession();
  
  // Check if current user is an authorized admin
  const isAdmin = isAuthorizedAdmin(session);
  
  if (!isAdmin) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Content Here</div>;
}

// ============================================================================
// 2. USING CONFIRMATION MODAL FOR SENSITIVE ACTIONS
// ============================================================================

import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { useState } from 'react';

export function DeleteUserComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      // Make API call to delete user
      const response = await fetch('/api/admin/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete_user',
          data: {
            resource: 'user',
            resourceId: 'user-123',
            changes: { status: 'deleted' }
          }
        })
      });

      const result = await response.json();
      console.log('User deleted:', result);
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Delete User
      </button>

      <ConfirmActionModal
        isOpen={showConfirm}
        action="delete_user"
        title="Delete User?"
        description="This action cannot be undone."
        warning="All user data and transactions will be permanently deleted."
        onConfirm={handleDeleteUser}
        onCancel={() => setShowConfirm(false)}
        isLoading={isLoading}
      />
    </>
  );
}

// ============================================================================
// 3. LOGGING ADMIN ACTIONS (Server-side)
// ============================================================================

import { logAdminAction } from '@/lib/auditLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function updateAdminSettings(newSettings: any) {
  const session = await getServerSession(authOptions);

  try {
    // Update the settings
    const updatedSettings = {
      ...newSettings,
      updatedAt: new Date(),
    };

    // Log the action
    await logAdminAction({
      timestamp: new Date(),
      adminId: session?.user?.id || 'unknown',
      adminEmail: session?.user?.email || 'unknown',
      action: 'modify_settings',
      resource: 'system_settings',
      resourceId: 'settings-global',
      changes: {
        before: { /* old values */ },
        after: newSettings,
      },
      status: 'success',
    });

    return updatedSettings;
  } catch (error) {
    // Log failure
    await logAdminAction({
      timestamp: new Date(),
      adminId: session?.user?.id || 'unknown',
      adminEmail: session?.user?.email || 'unknown',
      action: 'modify_settings',
      resource: 'system_settings',
      status: 'failed',
      reason: (error as Error).message,
    });

    throw error;
  }
}

// ============================================================================
// 4. API ENDPOINT USING ADMIN MIDDLEWARE
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, checkRateLimit } from '@/lib/adminMiddleware';

export async function POST(request: NextRequest) {
  // Verify admin access and check permissions
  const access = await verifyAdminAccess('approve_withdrawal');

  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: 403 }
    );
  }

  // Check rate limit
  const rateLimit = checkRateLimit(
    access.adminEmail!,
    'approve_withdrawal',
    5  // Max 5 withdrawals per minute
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Get request body
  const { withdrawalId } = await request.json();

  // Process withdrawal approval
  // ...

  // Log the action
  await logAdminAction({
    timestamp: new Date(),
    adminId: access.adminId!,
    adminEmail: access.adminEmail!,
    action: 'approve_withdrawal',
    resource: 'withdrawal',
    resourceId: withdrawalId,
    status: 'success',
  });

  return NextResponse.json({
    success: true,
    message: 'Withdrawal approved'
  });
}

// ============================================================================
// 5. SERVER-SIDE AUTHORIZATION CHECK
// ============================================================================

import { redirect } from 'next/navigation';
import { getAdminLevel, canPerformAction } from '@/lib/adminAuth';

// This would be in a server component or API route
export async function protectedAdminFunction() {
  const session = await getServerSession(authOptions);
  const adminLevel = getAdminLevel(session);

  // Check if user can perform critical action
  if (!canPerformAction(adminLevel, 'edit_commission_critical')) {
    // Log unauthorized attempt
    await logAdminAction({
      timestamp: new Date(),
      adminId: session?.user?.id || 'unknown',
      adminEmail: session?.user?.email || 'unknown',
      action: 'edit_commission_critical',
      resource: 'commission',
      status: 'failed',
      reason: 'Insufficient admin privileges',
    });

    throw new Error('Not authorized for this action');
  }

  // Perform the critical action
  // ...
}

// ============================================================================
// 6. DISPLAYING SECURITY STATUS IN COMPONENTS
// ============================================================================

import { AdminSecurityStatus } from '@/components/AdminSecurityStatus';

export function AdminDashboardPage() {
  return (
    <div>
      {/* Show security status at top of page */}
      <AdminSecurityStatus />

      {/* Rest of admin content */}
      <div className="mt-12">
        {/* Admin features */}
      </div>
    </div>
  );
}

// ============================================================================
// 7. DETECTED SUSPICIOUS ACTIVITY
// ============================================================================

import { detectSuspiciousActivity } from '@/lib/adminMiddleware';

export async function checkForSuspiciousActivity(
  adminEmail: string,
  action: string
) {
  const suspiciousActivities = detectSuspiciousActivity(
    adminEmail,
    action,
    '192.168.1.1'
  );

  if (suspiciousActivities.length > 0) {
    console.warn('Suspicious activity detected:');
    suspiciousActivities.forEach(activity => {
      console.warn(`- [${activity.severity}] ${activity.message}`);

      if (activity.severity === 'high') {
        // Send alert email
        // notify_security_team(activity);
      }
    });
  }

  return suspiciousActivities;
}

// ============================================================================
// 8. ADDING NEW ADMIN (In lib/adminAuth.ts)
// ============================================================================

/**
 * To add a new admin user:
 * 
 * 1. Open: lib/adminAuth.ts
 * 2. Find: AUTHORIZED_ADMINS array
 * 3. Add: 'newemail@andes.com'
 * 4. Redeploy application
 * 
 * Example:
 */

// const AUTHORIZED_ADMINS = [
//   'admin@andes.com',
//   'superadmin@andes.com',
//   'newemail@andes.com', // NEW ADMIN ADDED HERE
// ];

// ============================================================================
// 9. CUSTOM PERMISSION CHECK
// ============================================================================

import { Session } from 'next-auth';

export function hasPermission(
  session: Session,
  permission: 'view_users' | 'delete_users' | 'edit_commission' | 'modify_settings'
): boolean {
  const adminLevel = getAdminLevel(session);

  const permissions = {
    'full': ['view_users', 'delete_users', 'edit_commission', 'modify_settings'],
    'limited': ['view_users', 'edit_commission'],
    'none': [] as string[],
  };

  return (permissions[adminLevel as keyof typeof permissions] || []).includes(
    permission
  );
}

// Usage:
// if (hasPermission(session, 'delete_users')) {
//   // Show delete button
// }

// ============================================================================
// 10. ERROR HANDLING WITH SECURITY LOGGING
// ============================================================================

export async function safeAdminOperation(
  operationName: string,
  operation: () => Promise<void>,
  session: Session | null
) {
  try {
    await operation();

    await logAdminAction({
      timestamp: new Date(),
      adminId: session?.user?.id || 'unknown',
      adminEmail: session?.user?.email || 'unknown',
      action: operationName,
      resource: 'unknown',
      status: 'success',
    });
  } catch (error) {
    await logAdminAction({
      timestamp: new Date(),
      adminId: session?.user?.id || 'unknown',
      adminEmail: session?.user?.email || 'unknown',
      action: operationName,
      resource: 'unknown',
      status: 'failed',
      reason: (error as Error).message,
    });

    throw error;
  }
}

// ============================================================================
// Usage: Import and use these functions in your components and API routes
// ============================================================================
