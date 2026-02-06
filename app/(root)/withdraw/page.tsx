"use client";

import { useUser } from '@clerk/nextjs';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function WithdrawalPage() {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, user } = useUser();
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState<string | null>('ERC20-USDT');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');

  const authLoading = (!clerkLoaded && status === 'loading') || (clerkLoaded === false && status === 'loading');

  const signedIn = clerkSignedIn || (status === 'authenticated' && !!session?.user);

  if (authLoading) {
    return (
      <main className="font-montserrat text-gray-800 overflow-x-hidden bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center p-8 bg-white rounded-2xl shadow-lg">
          <div>Checking authentication...</div>
        </div>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="font-montserrat text-gray-800 overflow-x-hidden bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Sign in to Withdraw Funds</h2>
        </div>
      </main>
    );
  }

  const methods = [
    'ERC20-USDT',
    'ERC20-USDC',
    'BEP20-USDT',
    'BEP20-USDC',
    'TRC20-USDT',
    'POL-USDT',
    'POL-USDC',
  ];

  return (
    <main className="font-montserrat text-gray-800 overflow-x-hidden bg-white min-h-screen py-16">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6">Withdrawal</h1>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Select withdrawal method</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setSelected(m)}
                type="button"
                className={`px-3 py-2 rounded-lg border text-sm text-gray-800 text-center hover:bg-gray-100 transition-colors ${
                  selected === m ? 'bg-cyan-50 border-cyan-400' : 'bg-transparent border-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            placeholder="Please enter the withdrawal amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full mb-4 px-4 py-3 border rounded-lg bg-gray-50"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">Payment password</label>
          <input
            type="password"
            placeholder="Please enter the payment password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-4 py-3 border rounded-lg bg-gray-50"
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Selected: <span className="font-medium">{selected}</span></div>
            <button className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:opacity-95">Submit</button>
          </div>

          {/* Mobile collapsible selector similar to screenshot */}
          <details className="mt-6 md:hidden">
            <summary className="flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg cursor-pointer">
              <span>Select withdrawal method</span>
              <span className="text-xl">▾</span>
            </summary>
            <div className="p-4 grid grid-cols-2 gap-3">
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelected(m)}
                  type="button"
                  className={`px-3 py-2 rounded-lg border text-sm text-gray-800 text-center hover:bg-gray-100 transition-colors ${
                    selected === m ? 'bg-cyan-50 border-cyan-400' : 'bg-transparent border-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
