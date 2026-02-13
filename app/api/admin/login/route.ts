import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, ADMIN_CREDENTIALS } from '@/lib/adminCredentials';
import { logAdminAction } from '@/lib/auditLog';

/**
 * Admin login endpoint
 * Authenticates using username and secret key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, secretKey } = body;

    // Validate input: at minimum secretKey must be provided
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Secret key is required' },
        { status: 400 }
      );
    }

    // Verify credentials. Allow secret-key-only login: if username is missing,
    // attempt to match a single active admin by secretKey.
    let admin = null as any;
    if (username) {
      admin = verifyAdminCredentials(username, secretKey);
    } else {
      // Find active admin by secretKey
      admin = ADMIN_CREDENTIALS.find((cred) => cred.secretKey === secretKey && cred.active) || null;
    }

    if (!admin) {
      // Log failed attempt
      await logAdminAction({
        timestamp: new Date(),
        adminId: 'unknown',
        adminEmail: 'unknown',
        action: 'admin_login_failed',
        resource: 'authentication',
        status: 'failed',
        reason: `Failed login attempt for username: ${username}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log successful login
    await logAdminAction({
      timestamp: new Date(),
      adminId: username,
      adminEmail: admin.email,
      action: 'admin_login_success',
      resource: 'authentication',
      status: 'success',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // Return admin info and token
    const response = {
      success: true,
      admin: {
        username: admin.username,
        email: admin.email,
        role: admin.role,
        description: admin.description,
      },
      token: Buffer.from(
        JSON.stringify({
          username: admin.username,
          email: admin.email,
          role: admin.role,
          timestamp: Date.now(),
        })
      ).toString('base64'),
      message: `Welcome ${admin.description}!`,
    };

    // Set secure cookie with admin token
    const res = NextResponse.json(response);
    res.cookies.set('admin_token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return res;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
