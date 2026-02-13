# 🔐 Admin Portal Access - Username & Secret Key Login

## Quick Start

### Access Admin Panel with Credentials

**URL:** `http://localhost:3000/admin-login`

### Demo Credentials (for testing):

| Field | Value |
|-------|-------|
| **Username** | `superadmin` |
| **Secret Key** | `super-secret-key-123` |

---

## How to Add Your Own Admin Credentials

### Step 1: Open the Credentials File
Edit `lib/adminCredentials.ts`

### Step 2: Add Your Credentials
Find the `ADMIN_CREDENTIALS` array and add:

```typescript
{
  username: 'your-username',
  secretKey: 'your-secret-key',
  email: 'your-email@example.com',
  role: 'admin', // or 'superadmin'
  description: 'Your Admin Account',
  active: true,
}
```

### Example:
```typescript
export const ADMIN_CREDENTIALS: AdminCredential[] = [
  {
    username: 'superadmin',
    secretKey: 'super-secret-key-123',
    email: 'admin@andes.com',
    role: 'superadmin',
    description: 'Super Administrator',
    active: true,
  },
  {
    username: 'john-admin',
    secretKey: 'john-secret-xyz-789',
    email: 'john@andes.com',
    role: 'admin',
    description: 'John Administrator',
    active: true,
  },
];
```

### Step 3: Login
Go to `/admin-login` and use your credentials

---

## Admin Credential Types

### Superadmin
- **Full access** to all admin features
- Can delete users
- Can edit commissions
- Can reset system
- Can manage all settings

### Admin
- **Limited access**
- Cannot delete users
- Can view everything
- Can edit non-critical settings
- Cannot reset system

---

## Login Flow

1. **Visit** `http://localhost:3000/admin-login`
2. **Enter** username and secret key
3. **Click** "Admin Login"
4. **Redirected** to `/admin/dashboard`
5. **Full access** to admin panel with all security features

---

## Features

### ✅ Secure Authentication
- Username and secret key verification
- Failed login attempts logged
- Secure cookie storage (24-hour expiration)

### ✅ Activity Logging
- All login attempts recorded
- Success/failure tracked
- IP address logged
- Timestamp recorded

### ✅ Admin Panel Features
- Full dashboard access
- User management
- Transaction approvals
- Analytics & reports
- Settings configuration
- Activity logs review

### ✅ Security Features
- Rate limiting (10 actions/minute)
- Suspicious activity detection
- Audit trail for all actions
- Session expiration (24 hours)
- Secure token storage

---

## Multiple Admin Accounts

### Managing Multiple Admins

```typescript
export const ADMIN_CREDENTIALS: AdminCredential[] = [
  // Superadmin (full access)
  {
    username: 'superadmin',
    secretKey: 'super-secret-key-123',
    email: 'admin@andes.com',
    role: 'superadmin',
    description: 'Super Administrator',
    active: true,
  },
  
  // Admin 1 (limited access)
  {
    username: 'admin-1',
    secretKey: 'admin1-secret-key-456',
    email: 'admin1@andes.com',
    role: 'admin',
    description: 'Administrator 1',
    active: true,
  },
  
  // Admin 2 (limited access)
  {
    username: 'admin-2',
    secretKey: 'admin2-secret-key-789',
    email: 'admin2@andes.com',
    role: 'admin',
    description: 'Administrator 2',
    active: true,
  },
  
  // Disabled Admin (can be re-enabled)
  {
    username: 'old-admin',
    secretKey: 'old-secret-key-999',
    email: 'old@andes.com',
    role: 'admin',
    description: 'Old Administrator',
    active: false, // Disabled
  },
];
```

### Disable an Admin
Change `active: true` to `active: false`:

```typescript
{
  username: 'old-admin',
  secretKey: 'old-secret-key-999',
  email: 'old@andes.com',
  role: 'admin',
  description: 'Old Administrator',
  active: false, // ← Set to false to disable
}
```

---

## Best Practices

### ✅ DO:
- ✅ Use strong, complex secret keys
- ✅ Change demo credentials immediately
- ✅ Keep secret keys private
- ✅ Rotate credentials periodically
- ✅ Use different keys for different admins
- ✅ Log out after work
- ✅ Monitor login attempts in logs

### ❌ DON'T:
- ❌ Share credentials with others
- ❌ Use simple/weak secret keys
- ❌ Store credentials in code repos
- ❌ Use same key for multiple admins
- ❌ Leave admin sessions open
- ❌ Enable inactive admins
- ❌ Hardcode keys in frontend

---

## Generate Strong Secret Keys

Use these generators to create secure keys:

### Option 1: Random Alphanumeric
```
admin-key-a7k9m2x4q5w8e3r6t0p1
```

### Option 2: UUID-based
```
admin-550e8400-e29b-41d4-a716-446655440000
```

### Option 3: Hash-based
```
admin-hash-3e2c5f7b9a1d4e6c8f0a2b3d5e7f9a1c
```

**Recommendation:** Use at least 20 characters with mix of letters, numbers, and hyphens.

---

## Logging & Monitoring

### View Login Attempts
Go to `/admin/logs` and filter by:
- **Type:** system
- **Action:** admin_login_success / admin_login_failed

### Check Failed Logins
- Time of attempt
- IP address attempted from
- Username used
- Reason for failure

### Activity Tracking
All admin actions logged with:
- Admin username
- Action performed
- Resources modified
- Timestamp
- IP address

---

## Session Management

### Session Duration
- **Expiration:** 24 hours
- **Auto-logout:** When browser closes (optional)
- **Renewal:** Automatic on page refresh

### Logout
Click "Logout" in admin panel sidebar to:
- Clear admin token
- Remove session
- Redirect to login page

### Session Security
- HttpOnly cookies (secure storage)
- Same-Site policy enforced
- HTTPS only in production
- Token encryption enabled

---

## Troubleshooting

### "Invalid Credentials"?
- ✅ Check username is spelled correctly
- ✅ Verify secret key is exact match
- ✅ Ensure admin is `active: true`
- ✅ Check for leading/trailing spaces

### "Access Denied" after login?
- ✅ Clear browser cache
- ✅ Verify admin token in localStorage
- ✅ Check browser console for errors
- ✅ Try logging in again

### Can't see admin panel?
- ✅ Confirm you're at `/admin/dashboard`
- ✅ Check if logged in (admin token set)
- ✅ Verify credentials in `lib/adminCredentials.ts`
- ✅ Check if admin is active

### Not seeing logs?
- ✅ Visit `/admin/logs` directly
- ✅ Check filters are not too restrictive
- ✅ Verify logs are being created
- ✅ Check backend console

---

## Next Steps

1. **Add Your Credentials**
   - Edit `lib/adminCredentials.ts`
   - Add your username and secret key
   - Set role (admin or superadmin)

2. **Login to Admin Panel**
   - Go to `/admin-login`
   - Enter your credentials
   - Start managing the platform

3. **Monitor Security**
   - Check `/admin/logs` regularly
   - Review login attempts
   - Monitor admin actions
   - Track suspicious activity

4. **Manage Other Admins** (if needed)
   - Add new admins to credentials list
   - Disable inactive admins
   - Rotate secrets periodically
   - Review access logs

---

## API Endpoint

### Admin Login API
```
POST /api/admin/login

Request:
{
  "username": "superadmin",
  "secretKey": "super-secret-key-123"
}

Response (Success):
{
  "success": true,
  "admin": {
    "username": "superadmin",
    "email": "admin@andes.com",
    "role": "superadmin",
    "description": "Super Administrator"
  },
  "token": "base64-encoded-token",
  "message": "Welcome Super Administrator!"
}

Response (Failure):
{
  "error": "Invalid credentials"
}
```

---

## Security Notes

- Credentials are stored locally in source code (for development)
- In production, migrate to database with hashing
- Never commit real credentials to git
- Use environment variables for production
- Implement token rotation for extra security
- Monitor all login attempts
- Use HTTPS only in production
- Consider 2FA for additional security

---

## Support

For issues:
- Check `/admin/logs` for activity history
- Review browser console for errors
- Verify credentials in `lib/adminCredentials.ts`
- Ensure network connectivity
- Contact admin system owner

🔐 Your admin panel is now accessible with secure credentials!
