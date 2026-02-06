"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useUser } from '@clerk/nextjs';
import QRCode from 'qrcode';

export default function DepositContent() {
  const { data: session, status } = useSession();
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, user } = useUser();
  const [selectedNetwork, setSelectedNetwork] = useState('BEP20');
  const [copied, setCopied] = useState(false);

  // Consider auth loading only when BOTH providers are still initializing.
  // This way if either provider reports an authenticated user we proceed.
  const authLoading = status === 'loading' && !clerkLoaded;

  const signedIn = clerkSignedIn || (status === 'authenticated' && !!session?.user);

  if (authLoading) {
    return (
      <main className="font-montserrat text-gray-800 overflow-x-hidden bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center p-8 bg-white rounded-2xl shadow-lg">
          <div>Loading authentication...</div>
        </div>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="font-montserrat text-gray-800 overflow-x-hidden bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Sign in to Deposit Funds</h2>
          <p className="text-gray-600 mb-6">You must be signed in to add funds to your ANDES account.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-in" className="px-6 py-2 bg-cyan-600 text-white rounded-md">Sign in</Link>
            <Link href="/register" className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md">Register</Link>
          </div>
        </div>
      </main>
    );
  }
  const networks = [
    { id: 'TRC20', label: 'Tron•TRC20 [USDT/TRX]' },
    { id: 'BEP20', label: 'BNB•BEP20 [USDT/USDC]' },
    { id: 'ERC20', label: 'Ethereum•ERC20 [USDT/USDC]' },
    { id: 'MATIC', label: 'Polygon•ERC20 [USDT/USDC]' },
  ];

  const depositAddress = 'TATMGTZSvXfGE5b1FzUSQiXvU9k2h3PqR7wYzA4LmN';
  const shortAddress = `${depositAddress.slice(0,10)}...${depositAddress.slice(-6)}`;
  const [qrSrc, setQrSrc] = useState('');

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(depositAddress, { errorCorrectionLevel: 'H' })
      .then((url) => {
        if (mounted) setQrSrc(url);
      })
      .catch(() => {
        if (mounted) setQrSrc('');
      });
    return () => { mounted = false; };
  }, [depositAddress, selectedNetwork]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  return (
    <main className="font-montserrat text-gray-800 bg-gradient-to-br from-green-300 via-cyan-200 to-white min-h-screen flex items-start justify-center pt-6 px-4">
      <div className="w-full max-w-md">
        <header className="mb-4">
          <div className="relative">
            <div className="absolute left-0 top-0">
              <Link href="/dashboard" className="text-white text-xl px-3">←</Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-green-400 to-cyan-400 rounded-full px-6 py-2 shadow-md">
                <h3 className="text-white font-semibold">USDT</h3>
              </div>
            </div>
            <div className="absolute right-0 top-0 px-3 py-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
                <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
                <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-blue-500 rounded-xl p-3 shadow-lg">
          <div className="p-3 space-y-3">
            {networks.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNetwork(n.id)}
                className={`w-full text-center px-4 py-3 rounded-md ${selectedNetwork === n.id ? 'bg-white text-gray-900' : 'bg-white/90 text-gray-800'} text-sm font-medium shadow-sm`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="bg-white rounded-xl p-4 shadow-2xl">
            <div className="w-56 h-56 bg-white rounded-lg flex items-center justify-center">
              <img src={qrSrc || '/garelly1.jfif'} alt="QR" className="w-48 h-48 object-cover" />
            </div>
            <div className="mt-4 relative flex items-center">
              <div className="text-sm text-gray-700 truncate pr-12">{shortAddress}</div>
              <button onClick={handleCopy} className="absolute right-0 top-0 -mt-1 w-12 h-12 flex items-center justify-center rounded-full border-2 border-cyan-500 text-cyan-600 bg-white shadow-lg">
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <div className="w-full mt-4 text-xs text-gray-700">
              <p className="leading-5">
                <span className="font-semibold text-cyan-700">1. The minimum deposit amount is 1 USDT.</span> If the deposit amount is lower than the minimum, the deposit will not be credited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
