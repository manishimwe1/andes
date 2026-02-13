"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import QRCode from 'qrcode';
import { getDepositAddress, formatAddressForDisplay } from '@/lib/depositAddresses';
import toast from 'react-hot-toast';

export default function DepositContent() {
  const { data: session, status } = useSession();
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, user } = useUser();
  
  // Call all hooks unconditionally at the top
  const [selectedNetwork, setSelectedNetwork] = useState('trc20');
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  
  // Test transfer state
  const [testTransferRecipient, setTestTransferRecipient] = useState('');
  const [testTransferAmount, setTestTransferAmount] = useState('0.01');
  const [testTransferLoading, setTestTransferLoading] = useState(false);
  const [testTransferResult, setTestTransferResult] = useState<any>(null);

  // Get userId for team report query
  const userId = (session as any)?.user?.id;
  const teamReport = useQuery(api.team.getTeamReport, userId ? { userId } : "skip");
  const userAddresses = useQuery(api.user.getUserAddresses, userId ? { userId } : "skip");
  const getOrAssignAddress = useAction(api.user.getOrAssignUserAddress);
  const userName = session?.user?.name?.split(" ")[0] || "You";

  // Consider auth loading only when BOTH providers are still initializing.
  // This way if either provider reports an authenticated user we proceed.
  const authLoading = status === 'loading' && !clerkLoaded;

  const signedIn = clerkSignedIn || (status === 'authenticated' && !!session?.user);

  // Define networks and other constants (keys match lib/depositAddresses)
  const networks = [
    { id: 'trc20', label: 'Tron•TRC20 [USDT/TRX]' },
    { id: 'bep20', label: 'BNB•BEP20 [USDT/USDC]' },
    { id: 'erc20', label: 'Ethereum•ERC20 [USDT/USDC]' },
    { id: 'polygon', label: 'Polygon•ERC20 [USDT/USDC]' },
  ];

  // Fetch or generate user's address for selected network
  useEffect(() => {
    if (!userId || !signedIn) return;
    
    const fetchAddress = async () => {
      try {
        setLoading(true);
        // Check if we already have this address stored
        if (userAddresses && userAddresses[selectedNetwork]) {
          setUserAddress(userAddresses[selectedNetwork]);
        } else {
          // Generate new address for this network
          const address = await getOrAssignAddress({ userId, network: selectedNetwork });
          setUserAddress(address);
        }
      } catch (error) {
        console.error("Failed to get/assign user address:", error);
        setUserAddress('');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [userId, selectedNetwork, signedIn, userAddresses, getOrAssignAddress]);

  const depositInfo = getDepositAddress(selectedNetwork as any) || { address: '', token: 'USDT', minDeposit: 0, network: '' };
  const shortAddress = formatAddressForDisplay(userAddress, 8);

  // useEffect for QR code generation
  useEffect(() => {
    let mounted = true;
    if (userAddress) {
      QRCode.toDataURL(userAddress, { errorCorrectionLevel: 'H' })
        .then((url) => {
          if (mounted) setQrSrc(url);
        })
        .catch(() => {
          if (mounted) setQrSrc('');
        });
    }
    return () => { mounted = false; };
  }, [userAddress, selectedNetwork]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handleTestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testTransferRecipient || !testTransferAmount) {
      toast.error('Please fill in recipient address and amount');
      return;
    }

    try {
      setTestTransferLoading(true);
      const response = await fetch('/api/test-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress: testTransferRecipient,
          amountEth: parseFloat(testTransferAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        toast.error(data.error || 'Transfer failed');
        setTestTransferResult(null);
        return;
      }

      setTestTransferResult(data);
      toast.success('Transfer initiated! Check Etherscan for details.');
      setTestTransferRecipient('');
      setTestTransferAmount('0.01');
    } catch (error) {
      toast.error('Transfer request failed');
      console.error('Test transfer error:', error);
    } finally {
      setTestTransferLoading(false);
    }
  };

  // Early returns after all hooks are called
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

  return (
    <main className="font-montserrat text-gray-800 bg-gradient-to-br from-green-300 via-cyan-200 to-white min-h-screen flex items-start justify-center pt-6 px-4 pb-28">
      <div className="w-full max-w-md space-y-6">
        {/* Team Pyramid Section */}
        {teamReport && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">Team Structure</h2>
            
            <div className="flex flex-col items-center space-y-3">
              {/* YOU - Top */}
              <div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-6 py-3 text-center shadow-lg min-w-32">
                  <div className="font-bold text-sm">{userName}</div>
                  <div className="text-xs opacity-90">(YOU)</div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="text-2xl text-gray-400 font-light">↓</div>

              {/* TEAM A - Level 1 */}
              <div className="w-full max-w-xs">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl px-6 py-4 text-center shadow-lg border-2 border-green-300">
                  <div className="text-2xl font-bold">{teamReport.levels.A.count}</div>
                  <div className="text-sm font-semibold mt-1">TEAM A</div>
                  <div className="text-xs opacity-90 mt-1">(Your Referrals)</div>
                  <div className="text-sm font-bold mt-2 bg-white/20 rounded px-2 py-1 inline-block">18% Commission</div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="text-2xl text-gray-400 font-light">↓</div>

              {/* TEAM B - Level 2 */}
              <div className="w-full max-w-sm">
                <div className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-2xl px-6 py-4 text-center shadow-lg border-2 border-teal-300">
                  <div className="text-2xl font-bold">{teamReport.levels.B.count}</div>
                  <div className="text-sm font-semibold mt-1">TEAM B</div>
                  <div className="text-xs opacity-90 mt-1">(Their Referrals)</div>
                  <div className="text-sm font-bold mt-2 bg-white/20 rounded px-2 py-1 inline-block">3% Commission</div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="text-2xl text-gray-400 font-light">↓</div>

              {/* TEAM C - Level 3 */}
              <div className="w-full max-w-md">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-2xl px-6 py-4 text-center shadow-lg border-2 border-blue-300">
                  <div className="text-2xl font-bold">{teamReport.levels.C.count}</div>
                  <div className="text-sm font-semibold mt-1">TEAM C</div>
                  <div className="text-xs opacity-90 mt-1">(Their Referrals)</div>
                  <div className="text-sm font-bold mt-2 bg-white/20 rounded px-2 py-1 inline-block">2% Commission</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Section Header */}
        <div>
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
        </div>

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
              {loading ? (
                <div className="text-gray-400 text-center">
                  <div className="text-2xl mb-2">⏳</div>
                  <div className="text-sm">Generating address...</div>
                </div>
              ) : (
                <img src={qrSrc || '/garelly1.jfif'} alt="QR" className="w-48 h-48 object-cover" />
              )}
            </div>
            <div className="mt-4 relative flex items-center">
              <div className="text-sm text-gray-700 truncate pr-12">
                {loading ? 'Generating...' : shortAddress || 'No address available'}
              </div>
              <button 
                onClick={handleCopy} 
                disabled={loading || !userAddress}
                className="absolute right-0 top-0 -mt-1 w-12 h-12 flex items-center justify-center rounded-full border-2 border-cyan-500 text-cyan-600 bg-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <div className="w-full mt-4 text-xs text-gray-700 space-y-2">
              <p className="leading-5 bg-blue-50 p-2 rounded border border-blue-200">
                <span className="font-semibold text-blue-700">💡 Your Personal Address:</span> This is your unique deposit address on {depositInfo.network}. Use this address to receive deposits.
              </p>
              <p className="leading-5">
                <span className="font-semibold text-cyan-700">1. The minimum deposit amount is {depositInfo.minDeposit} {depositInfo.token}.</span> If the deposit amount is lower than the minimum, the deposit will not be credited.
              </p>
              <p className="text-xs text-gray-600">Network: {depositInfo.network}</p>
            </div>
          </div>
        </div>

        {/* Ethereum Test Transfer Section */}
        {selectedNetwork === 'erc20' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🧪 Test Ethereum Transfer</h3>
            <p className="text-xs text-gray-600 mb-4">Send test ETH on Sepolia testnet (requires TESTNET_PRIVATE_KEY configured)</p>
            
            <form onSubmit={handleTestTransfer} className="space-y-3">
              <input
                type="text"
                placeholder="Recipient address (0x...)"
                value={testTransferRecipient}
                onChange={(e) => setTestTransferRecipient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="number"
                placeholder="Amount (ETH)"
                value={testTransferAmount}
                onChange={(e) => setTestTransferAmount(e.target.value)}
                min="0.001"
                step="0.001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                type="submit"
                disabled={testTransferLoading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testTransferLoading ? '⏳ Sending...' : '📤 Send Test ETH'}
              </button>
            </form>

            {testTransferResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-md">
                <p className="text-xs font-semibold text-green-700 mb-2">✅ Transfer Successful</p>
                <p className="text-xs text-gray-700 mb-1"><span className="font-semibold">Tx Hash:</span> {testTransferResult.transactionHash}</p>
                <p className="text-xs text-gray-700 mb-1"><span className="font-semibold">Amount:</span> {testTransferResult.message}</p>
                <a
                  href={testTransferResult.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline font-semibold mt-2 inline-block"
                >
                  View on Etherscan ↗
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
