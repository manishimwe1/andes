# Admin Panel Security Guide

## Overview
This admin panel includes multiple layers of security to protect your system and data.

## 1. Authorization & Authentication

### Admin Access Control
Only authorized admin emails can access the admin panel. Update the authorized admins list in [`lib/adminAuth.ts`](../lib/adminAuth.ts):

```typescript
const AUTHORIZED_ADMINS = [
  'admin@andes.com',
  'superadmin@andes.com',
  // Add your admin emails here
];
```

### Admin Levels
- **Superadmin** (`superadmin@andes.com`) - Full access to all functions
- **Admin** (other emails in list) - Limited access, cannot perform destructive actions

### Access Denied
If you see "Access Denied" when trying to access the admin panel:
1. Make sure you're signed in with an authorized admin email
2. Only emails in the `AUTHORIZED_ADMINS` list have access
3. The system will automatically check on login

## 2. Session Security

- Sessions expire after 30 days
- Sessions are JWT-based and cryptographically signed
- Each session includes user email verification
- Session data is not stored in cookies (secure)

## 3. Activity Logging (Audit Trail)

All admin actions are logged with:
- **Admin Email** - Who performed the action
- **Action Type** - What action was performed
- **Timestamp** - When it happened
- **IP Address** - Where the request came from
- **Status** - Success/Failed/Warning
- **Changes** - What data was modified

Access audit logs at: `/admin/logs`

## 4. Rate Limiting

Admin actions are rate-limited to prevent abuse:
- Maximum 10 actions per minute per admin
- Attempts to exceed limits are logged
- Violators are temporarily blocked

## 5. Sensitive Action Confirmation

Certain actions require additional confirmation:
- Delete user
- Delete transaction
- Edit commission rates
- Enable maintenance mode
- Reset system
- Modify critical settings
- Approve large withdrawals

These actions will prompt for confirmation before execution.

## 6. Suspicious Activity Detection

The system automatically detects:
- Rapid consecutive actions (>5 actions in <5 seconds)
- Sensitive actions outside business hours (6am-10pm)
- Unusual access patterns
- Failed access attempts

Suspicious activities are logged with severity levels.

## 7. API Security

All admin API endpoints:
- Require authentication via NextAuth session
- Verify admin authorization
- Check action permissions
- Enforce rate limiting
- Log all activities
- Validate input data

Admin API Routes:
- `POST /api/admin/action` - Perform admin actions
- `GET /api/admin/audit-log` - View activity logs (coming soon)
- `GET /api/admin/security-status` - Check security status (coming soon)

## 8. Best Practices

### DO:
- ✅ Use strong, unique passwords
- ✅ Check activity logs regularly
- ✅ Review suspicious activity alerts
- ✅ Log out after work
- ✅ Use your authorized email address
- ✅ Confirm sensitive actions carefully
- ✅ Share admin access sparingly

### DON'T:
- ❌ Share your admin credentials
- ❌ Leave sessions unattended
- ❌ Bypass confirmation prompts
- ❌ Click suspicious links
- ❌ Use admin panel on public WiFi (use VPN)
- ❌ Store passwords in plain text
- ❌ Give admin access to unauthorized people

## 9. Adding Additional Admins

To add a new admin:

1. Open [`lib/adminAuth.ts`](../lib/adminAuth.ts)
2. Add the email to `AUTHORIZED_ADMINS`:
   ```typescript
   const AUTHORIZED_ADMINS = [
     'admin@andes.com',
     'superadmin@andes.com',
     'newadmin@andes.com', // Add here
   ];
   ```
3. Redeploy the application
4. The user can now sign in with that email and access the admin panel

## 10. Disabling Admin Access

To revoke an admin's access:

1. Remove their email from `AUTHORIZED_ADMINS` in [`lib/adminAuth.ts`](../lib/adminAuth.ts)
2. Redeploy the application
3. They will be redirected to the dashboard on next access

## 11. Monitoring & Alerts

### Check Activity Logs
Visit `/admin/logs` to:
- View all admin actions
- Filter by type, level, admin
- Export activity reports
- Detect patterns of abuse

### Security Status
Monitor:
- Failed login attempts
- Rate limit violations
- Suspicious activities
- Access outside business hours

## 12. Incident Response

If suspicious activity is detected:

1. **STOP** - Don't perform any further admin actions
2. **REVIEW** - Check activity logs for unauthorized changes
3. **VERIFY** - Confirm with other admins about recent changes
4. **REPORT** - Document the incident with timestamps
5. **REMEDIATE** - Revert any unauthorized changes
6. **NOTIFY** - Alert superadmin immediately
7. **INVESTIGATE** - Review security logs for vulnerabilities

## 13. Future Enhancements

Coming soon:
- [ ] Two-factor authentication (2FA)
- [ ] Admin action approval workflows
- [ ] IP whitelisting
- [ ] Admin session activity tracking
- [ ] Email notifications for sensitive actions
- [ ] Automated backup verification
- [ ] Security audit reports

## Need Help?

For security concerns:
- Contact: `security@andes.com`
- Document the issue with timestamps
- Do not share sensitive information publicly
