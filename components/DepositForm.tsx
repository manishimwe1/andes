"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import QRCode from 'qrcode';
import { useSearchParams } from 'next/navigation';
import { getDepositAddress, formatAddressForDisplay, getAvailableNetworks } from '@/lib/depositAddresses';

// Type for user ID
type UserId = any;

// Client-side function to generate deterministic user address using simple hash
function generateUserAddress(userId: string, network: string): string {
  if (!userId) return '';
  
  try {
    // Simple hash function that works in browsers (no crypto module needed)
    const str = userId + ':' + network + ':deposit';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex string
    let hex = Math.abs(hash).toString(16);
    while (hex.length < 8) hex = '0' + hex;
    
    // Extend the hex string by repeating and mixing
    let extendedHex = '';
    for (let i = 0; i < 40; i++) {
      extendedHex += hex.charAt(i % hex.length);
    }
    
    if (network === 'trc20') {
      // Tron address: T + 33 alphanumeric chars
      return 'T' + extendedHex.substring(0, 33).toUpperCase();
    } else {
      // Ethereum-compatible: 0x + 40 hex chars
      return '0x' + extendedHex.substring(0, 40);
    }
  } catch (e) {
    // Fallback
    const chars = 'ABCDEF0123456789';
    let result = network === 'trc20' ? 'T' : '0x';
    for (let i = 0; i < (network === 'trc20' ? 33 : 40); i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

const MIN_DEPOSIT = {
  polygon: 1,
  erc20: 10,
  trc20: 50,
  bep20: 1,
};

export default function DepositForm() {
  const { data: session, status } = useSession();
  const { user: clerkUser } = useUser();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [depositVerified, setDepositVerified] = useState(false);
  const [userDepositAddress, setUserDepositAddress] = useState<string>('');

  const searchParams = useSearchParams();
  const createDepositMutation = useMutation(api.transaction.createDeposit);
  const updateTxStatusMutation = useMutation(api.transaction.updateTransactionStatus);

  const [formData, setFormData] = useState({
    amount: searchParams?.get('amount') ? parseFloat(searchParams.get('amount') as string) || '' : '',
    network: (searchParams?.get('network') as keyof typeof MIN_DEPOSIT) || 'polygon',
    walletAddress: '',
    transactionHash: '',
  });

  const copyDepositAddress = async () => {
    try {
      // Copy user's generated address
      if (!userDepositAddress) throw new Error('No address generated');
      await navigator.clipboard.writeText(userDepositAddress);
      setSuccess('✓ Deposit address copied to clipboard');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e: any) {
      setError('Failed to copy address');
      setTimeout(() => setError(''), 2500);
    }
  };

  const handleVerifyTRC20Deposit = async () => {
    if (formData.network !== 'trc20') {
      setError('TRC20 verification is only for Tron network');
      return;
    }

    const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount;
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }

    if (amount < MIN_DEPOSIT['trc20']) {
      setError(`Minimum TRC20 deposit is ${MIN_DEPOSIT['trc20']} USDT`);
      return;
    }

    setVerifying(true);
    setError('');
    setSuccess('');

    try {
      // Call verification API
      const response = await fetch('/api/deposits/verify-trc20', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: formData.walletAddress,
          transactionHash: formData.transactionHash || undefined,
          depositAmount: amount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      const data = await response.json();

      if (!data.verified) {
        setError(data.tip || 'Deposit could not be verified');
        setVerifying(false);
        return;
      }

      // Create deposit transaction record in Convex
      const txId = await createDepositMutation({
        userId: currentUserId as any,
        amount: amount,
        network: 'trc20',
        walletAddress: formData.walletAddress,
      });

      // Update status to completed since we verified it on-chain
      await updateTxStatusMutation({
        transactionId: txId,
        status: 'completed',
        transactionHash: data.transactionHash,
      });

      setSuccess(
        `✓ Deposit verified! ${amount} USDT has been credited to your account.`
      );
      setDepositVerified(true);
      setFormData({ amount: '', network: 'polygon', walletAddress: '', transactionHash: '' });
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const [qrDataUrl, setQrDataUrl] = useState('');
  const getOrAssignAddress = useMutation(api.user.getOrAssignUserAddress as any);

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

  // Request or assign a per-user deposit address from the server
  useEffect(() => {
    let mounted = true;
    async function fetchAddress() {
      if (!currentUserId) {
        setUserDepositAddress('');
        return;
      }

      try {
        const addr = await getOrAssignAddress({ userId: currentUserId, network: formData.network });
        if (mounted) setUserDepositAddress(addr || '');
      } catch (e) {
        // Fallback to platform address if action fails
        try {
          const platform = getDepositAddress(formData.network as any);
          if (mounted) setUserDepositAddress(platform?.address || '');
        } catch (_) {
          if (mounted) setUserDepositAddress('');
        }
      }
    }

    fetchAddress();
    return () => { mounted = false; };
  }, [currentUserId, formData.network]);

  // Generate QR code for user's unique address
  React.useEffect(() => {
    const addr = userDepositAddress || '';
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
  }, [userDepositAddress]);

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

              {/* For TRC20: Wallet Address & Transaction Hash inputs */}
              {formData.network === 'trc20' && (
                <div className="mb-6 space-y-4 bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Your Tron Wallet Address
                    </label>
                    <input
                      type="text"
                      placeholder="T... (your Tron wallet address)"
                      value={formData.walletAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Transaction Hash (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Paste the txID from your transfer (optional)"
                      value={formData.transactionHash}
                      onChange={(e) => setFormData(prev => ({ ...prev, transactionHash: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyTRC20Deposit}
                    disabled={verifying || !formData.amount || !formData.walletAddress}
                    className="w-full px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {verifying ? 'Verifying on Blockchain...' : '✓ Verify & Confirm Deposit'}
                  </button>
                </div>
              )}

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
        <div className="mb-6 text-center bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Send {(() => getDepositAddress(formData.network as any)?.token)?.() || 'USDT'} to this address</h3>
          
          {qrDataUrl ? (
            <div className="mx-auto w-56 h-56 bg-white rounded-lg p-3 shadow-inner flex items-center justify-center mb-6">
              <img src={qrDataUrl} alt="Deposit QR code" className="w-48 h-48" />
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <div className="px-4 py-3 bg-white rounded-lg border border-gray-300 text-sm font-mono select-all break-all max-w-2xl shadow-sm">
              {userDepositAddress || 'Generating your unique address...'}
            </div>

            <button
              type="button"
              onClick={copyDepositAddress}
              aria-label="Copy deposit address"
              disabled={!userDepositAddress}
              className="w-12 h-12 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-md hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📋
            </button>
          </div>

          <p className="text-sm text-green-700 mt-3 font-semibold">{success || ''}</p>
          <p className="text-sm text-red-600 mt-1 font-semibold">{error || ''}</p>

          {/* Network Info Card */}
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Network:</span>
              <span className="text-gray-900 font-bold">{(() => getDepositAddress(formData.network as any)?.network)?.()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Minimum Deposit:</span>
              <span className="text-cyan-600 font-bold">{(() => getDepositAddress(formData.network as any)?.minDeposit)?.() || MIN_DEPOSIT[formData.network]} USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Network Fee:</span>
              <span className="text-gray-900 font-bold">{(() => getDepositAddress(formData.network as any)?.networkFee)?.()}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>📝 Your Deposit Address:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>This is <strong>your unique deposit address</strong> for {formData.network.toUpperCase()} network</li>
              <li>Copy the address above and send USDT from your wallet</li>
              <li>Wait for blockchain confirmation</li>
              <li>Your deposit will be automatically credited</li>
            </ol>
          </div>
        </div>

        {/* Deposit Confirmation Section */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-bold text-green-900 mb-2">✓ How Deposits Are Processed</h4>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Deposits are monitored in real-time on the blockchain</li>
            <li>Once confirmed, funds appear in your account instantly</li>
            <li>You can check your transaction status in the history below</li>
            <li>No confirmation email needed - blockchain confirms it</li>
          </ul>
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
