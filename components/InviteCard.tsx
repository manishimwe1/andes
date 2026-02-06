import React, { useState } from 'react';

type Props = {
  userId?: string;
  code: string;
};

export default function InviteCard({ userId, code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-3 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">{userId ? userId.charAt(0) : 'U'}</div>
      <div className="flex-1">
        <div className="text-xs opacity-90">{userId ?? '—'}</div>
        <div className="text-sm font-semibold mt-1">Invitation code: <span className="font-bold">{code}</span></div>
      </div>
      <button onClick={handleCopy} className="bg-white text-blue-600 rounded px-3 py-1 text-sm font-medium">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
