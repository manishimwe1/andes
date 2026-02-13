'use client';

import React, { useState } from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  action: string;
  title: string;
  description: string;
  warning?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmActionModal({
  isOpen,
  action,
  title,
  description,
  warning,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmActionModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const requiredText = `confirm ${action}`;

  if (!isOpen) return null;

  const isConfirmed = confirmText.toLowerCase() === requiredText.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Warning Icon */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 inline-block">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">{description}</p>
          {warning && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 font-semibold">{warning}</p>
            </div>
          )}
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type <span className="text-red-600 font-bold">"{requiredText}"</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type: ${requiredText}`}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-center font-mono"
            disabled={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed || isLoading}
            className={`px-4 py-2 font-semibold rounded-lg transition ${
              isConfirmed
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {isLoading ? '⏳ Processing...' : 'Confirm'}
          </button>
        </div>

        {/* Info Message */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> This action is being logged for security and audit purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
