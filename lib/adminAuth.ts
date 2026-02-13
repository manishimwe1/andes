import { Session } from 'next-auth';
import { verifyAdminCredentials } from './adminCredentials';

// List of authorized admin email addresses
const AUTHORIZED_ADMINS = [
  'admin@andes.com',
  'superadmin@andes.com',
  // Add your admin emails here
];

/**
 * Verify if a user has admin access
 * Can be verified by either email OR username/secretKey combo
 * @param session - NextAuth session or credentials object
 * @returns boolean - true if user is authorized admin
 */
export function isAuthorizedAdmin(session: Session | null | { username?: string; secretKey?: string }): boolean {
  // Check by session email
  if (session && 'user' in session && session.user?.email) {
    return AUTHORIZED_ADMINS.includes(session.user.email.toLowerCase());
  }
  
  // Check by credentials
  if (session && 'username' in session && 'secretKey' in session) {
    const credentials = session as { username?: string; secretKey?: string };
    return verifyAdminCredentials(credentials.username || '', credentials.secretKey || '') !== null;
  }
  
  return false;
}

/**
 * Get admin access level
 * @param session - NextAuth session
 * @returns 'full' | 'limited' | 'none'
 */
export function getAdminLevel(session: Session | null): 'full' | 'limited' | 'none' {
  if (!session?.user?.email) return 'none';
  
  const email = session.user.email.toLowerCase();
  
  // Superadmin has full access
  if (email === 'superadmin@andes.com') return 'full';
  
  // Other admins have limited access
  if (AUTHORIZED_ADMINS.includes(email)) return 'limited';
  
  return 'none';
}

/**
 * Check if admin can perform specific action
 * @param adminLevel - Admin access level
 * @param action - Action to perform (delete_user, edit_commission, etc)
 * @returns boolean - true if admin can perform action
 */
export function canPerformAction(
  adminLevel: 'full' | 'limited' | 'none',
  action: string
): boolean {
  if (adminLevel === 'full') return true;
  
  // Limited admins cannot perform destructive actions
  const destructiveActions = ['delete_user', 'reset_system', 'edit_commission_critical'];
  
  if (adminLevel === 'limited' && destructiveActions.includes(action)) {
    return false;
  }
  
  return adminLevel !== 'none';
}

/**
 * Require admin confirmation for sensitive actions
 */
export const SENSITIVE_ACTIONS = [
  'delete_user',
  'delete_transaction',
  'edit_commission',
  'enable_maintenance_mode',
  'reset_system',
  'modify_settings',
  'approve_large_withdrawal',
];

/**
 * Check if action requires additional verification
 */
export function requiresConfirmation(action: string): boolean {
  return SENSITIVE_ACTIONS.includes(action);
}
