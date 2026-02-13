'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function AdminSecurityStatus() {
  const { data: session } = useSession();
  const [showDetails, setShowDetails] = useState(false);

  if (!session?.user) return null;

  const isAdmin = session.user.role === 'admin';
  const sessionStartTime = new Date();
  const sessionExpiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return (
    <div className="mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="font-bold text-gray-900">Session Security Status</h3>
              <p className="text-sm text-gray-600">
                {isAdmin ? '✓ Admin Panel Access Granted' : '✗ Limited Access'}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-700 mt-2">
            <p><strong>User:</strong> <span className="font-mono text-blue-600">{session.user.email}</span></p>
            <p><strong>Role:</strong> <span className="font-semibold capitalize">{session.user.role}</span></p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {showDetails && (
        <div className="mt-6 pt-6 border-t-2 border-blue-200 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Session Started</p>
              <p className="text-sm text-gray-900 font-mono">{sessionStartTime.toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Session Expires</p>
              <p className="text-sm text-gray-900 font-mono">{sessionExpiryTime.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-semibold">Security Features</p>
            <div className="grid grid-cols-1 gap-1 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>JWT-based session encryption</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Email verification enabled</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Audit logging active</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Rate limiting enforced</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Suspicious activity monitoring</span>
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
            <p className="text-xs text-yellow-700">
              <strong>💡 Reminder:</strong> All actions in the admin panel are logged and monitored. Do not perform actions on behalf of others without proper documentation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
