"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import QRCode from 'qrcode';
import { useSearchParams } from 'next/navigation';

const MIN_DEPOSIT = {
  polygon: 1,
  erc20: 10,
  trc20: 50,
  bep20: 1,
};

const DEPOSIT_ADDRESSES: Record<string, string> = {
  polygon: '0xPolygonDepositAddressExample000000000000',
  erc20: '0xERC20DepositAddressExample00000000000000',
  trc20: 'TTRC20DepositAddressExample000000000000000',
  bep20: '0xBEP20DepositAddressExample00000000000000',
};

export default function DepositForm() {
  const { data: session, status } = useSession();
  const { user: clerkUser } = useUser();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    amount: searchParams?.get('amount') ? parseFloat(searchParams.get('amount') as string) || '' : '',
    network: (searchParams?.get('network') as keyof typeof MIN_DEPOSIT) || 'polygon',
  });

  const copyDepositAddress = async () => {
    try {
      const addr = DEPOSIT_ADDRESSES[formData.network] || '';
      await navigator.clipboard.writeText(addr);
      setSuccess('Deposit address copied to clipboard');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e: any) {
      setError('Failed to copy address');
      setTimeout(() => setError(''), 2500);
    }
  };

  const [qrDataUrl, setQrDataUrl] = useState('');

  // Generate QR code for the platform deposit address
  React.useEffect(() => {
    const addr = DEPOSIT_ADDRESSES[formData.network] || '';
    if (!addr) {
      setQrDataUrl('');
      return;
    }
    let mounted = true;
    QRCode.toDataURL(addr, { margin: 2, width: 240 })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch(() => setQrDataUrl(''));
    return () => { mounted = false };
  }, [formData.network]);

  // Determine contact and userId from either next-auth session or Clerk user
  const contact = (session as any)?.user?.contact || (clerkUser as any)?.emailAddresses?.[0]?.emailAddress || (clerkUser as any)?.primaryEmailAddress?.emailAddress || (session as any)?.user?.email || '';
  const currentUserId = (session as any)?.user?.id || (clerkUser as any)?.id || '';

  // Fetch user balance and recent transactions
  const user = useQuery(api.user.getUserByContact, {
    contact,
  });

  const recentTxns = useQuery(api.transaction.getTransactionHistory, {
    userId: currentUserId,
  });

  // Track previous transactions to detect status changes
  const prevTxnsRef = useRef<any[] | null>(null);
  const [highlighted, setHighlighted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const prev = prevTxnsRef.current;
    if (prev && recentTxns) {
      const prevMap: Record<string, string> = {};
      prev.forEach((t: any) => { prevMap[t._id] = t.status; });
      recentTxns.forEach((t: any) => {
        if (prevMap[t._id] === 'pending' && t.status === 'completed') {
          setHighlighted((s) => ({ ...s, [t._id]: true }));
          setTimeout(() => setHighlighted((s) => ({ ...s, [t._id]: false })), 5000);
        }
      });
    }
    prevTxnsRef.current = recentTxns || null;
  }, [recentTxns]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    }));
    setError('');
  };

  // This form is informational only — users send funds externally to the platform address.

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Deposit Funds</h2>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Amount (USDT)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter deposit amount"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Minimum: {MIN_DEPOSIT[formData.network]} USDT
          </p>
        </div>

              {/* Network Selection as pill buttons (matches screenshot) */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Select Deposit Network</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'trc20', label: 'Tron•TRC20 [USDT/TRX]' },
                    { key: 'bep20', label: 'BNB•BEP20 [USDT/USDC]' },
                    { key: 'erc20', label: 'Ethereum•ERC20 [USDT/USDC]' },
                    { key: 'polygon', label: 'Polygon•ERC20 [USDT/USDC]' },
                  ].map((n) => (
                    <button
                      key={n.key}
                      type="button"
                      onClick={() => setFormData((s) => ({ ...s, network: n.key as any }))}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border transition ${formData.network === n.key ? 'bg-white border-cyan-400 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

        {/* Platform Deposit Address / QR (screenshot-style) */}
        <div className="mb-6 text-center">
          {qrDataUrl ? (
            <div className="mx-auto w-56 h-56 bg-white rounded-lg p-3 shadow-inner flex items-center justify-center">
              <img src={qrDataUrl} alt="Deposit QR code" className="w-48 h-48" />
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm font-medium select-all break-words max-w-md truncate">
              {(() => {
                const addr = DEPOSIT_ADDRESSES[formData.network] || '';
                if (!addr) return '';
                const front = addr.slice(0, 6);
                const back = addr.slice(-6);
                return `${front}...${back}`;
              })()}
            </div>

            <button
              type="button"
              onClick={copyDepositAddress}
              aria-label="Copy deposit address"
              className="w-12 h-12 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-md hover:opacity-95"
            >
              Copy
            </button>
          </div>

          <p className="text-sm text-cyan-700 mt-3">{success || ''}</p>
          <p className="text-sm text-red-600 mt-1">{error || ''}</p>

          <p className="text-sm text-gray-700 mt-4 text-left max-w-xl mx-auto">1. The minimum deposit amount is <strong className="text-cyan-600">{MIN_DEPOSIT[formData.network]} USDT</strong>. If the deposit amount is lower than the minimum, the deposit will not be credited.</p>
        </div>

        {/* Wallet Address: automatically determined from your most recent transaction */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">Your wallet address will be auto-detected from your most recent deposit transaction. If none exists, you'll be prompted to add one in your profile.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Current Balance */}
        {user && typeof user.balance === 'number' && (
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{user.balance} USDT</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Deposits */}
        {recentTxns && recentTxns.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-3">Recent Deposits</h4>
            <ul className="space-y-3">
              {recentTxns
                .filter((t: any) => t.type === 'deposit')
                .slice(0, 5)
                .map((t: any) => (
                  <li key={t._id} className={`p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between ${highlighted[t._id] ? 'animate-pulse ring-2 ring-green-200' : ''}`}>
                    <div>
                      <div className="text-sm text-gray-600">{t.network.toUpperCase()}</div>
                      <div className="font-semibold text-gray-900">{t.amount} USDT</div>
                      <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm ${t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {t.status}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* No submit: this page is receive-only — send funds to the platform address above. */}

        {/* Information Box */}
        <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-gray-900 font-semibold mb-3">Deposit Information:</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✓ Fast deposit processing</li>
            <li>✓ Funds will be credited to your account instantly</li>
            <li>✓ Select the network that matches your wallet</li>
            <li>✓ Polygon & BEP20: Minimum 1 USDT</li>
            <li>✓ ERC20: Minimum 10 USDT</li>
            <li>✓ TRC20: Minimum 50 USDT</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
