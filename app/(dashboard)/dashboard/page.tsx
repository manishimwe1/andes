'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TransactionHistory from '@/components/TransactionHistory';
import { api } from '@/convex/_generated/api';
import Image from 'next/image';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [depositModal, setDepositModal] = useState<{ open: boolean; required?: number; network?: string }>({ open: false });

  const user = useQuery(api.user.getUserByContact, { contact: session?.user?.contact || '' });
  console.log({session ,user});

  const grades = [
    { grade: 'A1', equipment: 20, daily: 2, monthly: 60, annual: 730 },
    { grade: 'A2', equipment: 100, daily: 6.6, monthly: 198, annual: 2409 },
    { grade: 'A3', equipment: 380, daily: 25, monthly: 750, annual: 9125 },
    { grade: 'B1', equipment: 780, daily: 52, monthly: 1560, annual: 18980 },
    { grade: 'B2', equipment: 1800, daily: 120, monthly: 3600, annual: 43800 },
    { grade: 'B3', equipment: 4800, daily: 320, monthly: 9600, annual: 116800 },
  ];

  const onRequestDeposit = (required: number, network: string) => {
    setDepositModal({ open: true, required, network });
  };

  const closeDepositModal = () => setDepositModal({ open: false });

  const goToDeposit = () => {
    if (!depositModal.required) return;
    const q = new URLSearchParams({ amount: String(depositModal.required), network: depositModal.network || 'polygon' });
    router.push('/deposit?' + q.toString());
    setDepositModal({ open: false });
  };
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  function DeviceCard({ item, userBalance, onRequestDeposit, isSignedIn }: { item: { grade: string; equipment: number; daily: number }, userBalance?: number, onRequestDeposit: (required: number, network: string) => void, isSignedIn: boolean }) {
    const storageKey = `andes_device_${item.grade}`;
    const [count, setCount] = useState<number>(1);
    const [deposit, setDeposit] = useState<number>(0);
    const [active, setActive] = useState<boolean>(false);

    useEffect(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setCount(parsed.count || 1);
          setDeposit(parsed.deposit || 0);
          setActive(!!parsed.active);
        }
      } catch (e) {}
    }, [storageKey]);

    useEffect(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ count, deposit, active }));
      } catch (e) {}
    }, [count, deposit, active, storageKey]);

    const required = item.equipment * count;
    const [network, setNetwork] = useState<string>('polygon');

    const handleStartTask = () => {
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }

      if (deposit >= required) return setActive(true);

      const balance = userBalance ?? 0;
      if (balance >= required) {
        setActive(true);
        return;
      }

      onRequestDeposit(required, network);
    };

    return (
      <div className="bg-gradient-to-br from-green-200 to-cyan-200 rounded-lg p-6 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
            <Image src="/scooter.png" alt="Scooter" width={64} height={64} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg">{item.grade} — Daily: {item.daily}</h4>
              <div className="text-sm text-gray-700">Daily profit of a single device: {item.daily}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white rounded p-3 text-center">
                <div className="text-sm text-gray-500">Device price</div>
                <div className="font-bold text-xl">{item.equipment}</div>
              </div>

              <div className="bg-white rounded p-3 text-center">
                <div className="text-sm text-gray-500">Number of devices</div>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="px-2 py-1 bg-gray-200 rounded">-</button>
                  <div className="font-semibold">{count}</div>
                  <button onClick={() => setCount((c) => c + 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm text-gray-600">Required deposit</div>
                <div className="font-bold">{required} USDT</div>
              </div>

              <div className="w-40">
                <input
                  type="number"
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border"
                  placeholder="Deposit"
                />
              </div>

              <div className="w-48">
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full px-3 py-2 rounded border bg-white"
                >
                  <option value="polygon">Polygon</option>
                  <option value="erc20">ERC20</option>
                  <option value="trc20">TRC20</option>
                  <option value="bep20">BEP20</option>
                </select>
              </div>

              <div>
                {!active ? (
                  <button
                    onClick={handleStartTask}
                    className={`px-4 py-2 rounded font-semibold ${deposit >= required ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    onClick={() => setActive(false)}
                    className="px-4 py-2 rounded bg-red-500 text-white font-semibold"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isMounted || status === 'loading' || user === undefined) {
    return <div className="text-center py-32">Loading...</div>;
  }

  if (!session || !user) {
    return (
      <main className="font-montserrat text-gray-800 overflow-x-hidden bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in to access your dashboard.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-8 py-3 bg-cyan-500 text-white font-semibold rounded-full hover:bg-cyan-600 transition-all"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="font-montserrat text-gray-800 overflow-x-hidden bg-gray-50 min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ANDES</h1>
              <p className="text-xs text-gray-600">Dashboard</p>
            </div>
          </div>

          <ul className="hidden lg:flex gap-8 items-center list-none">
            <li><Link href="/dashboard" className="text-gray-700 font-medium hover:text-emerald-600 transition">Dashboard</Link></li>
            <li><Link href="/equipment" className="text-gray-700 font-medium hover:text-emerald-600 transition">Equipment</Link></li>
            <li><Link href="/finances" className="text-gray-700 font-medium hover:text-emerald-600 transition">Finance</Link></li>
            <li><Link href="/team" className="text-gray-700 font-medium hover:text-emerald-600 transition">Team</Link></li>
            <li><Link href="/profile" className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition">Profile</Link></li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-2">Welcome, {session?.user?.name || session?.user?.firstName || 'User'}!</h2>
            <p className="text-xl text-gray-600">Manage your ANDES equipment and earnings</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border-l-4 border-emerald-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">Total Balance</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0.00</div>
              <p className="text-xs text-gray-500">USD</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border-l-4 border-teal-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">Active Equipment</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">0</div>
              <p className="text-xs text-gray-500">Devices running</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border-l-4 border-cyan-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">Today's Earnings</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0.00</div>
              <p className="text-xs text-gray-500">Daily income</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border-l-4 border-blue-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">Team Members</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">0</div>
              <p className="text-xs text-gray-500">Direct referrals</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="/deposit" className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-2">Deposit</h3>
              <p>Add funds to your account</p>
            </Link>

            <Link href="/equipment" className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-2xl font-bold mb-2">Equipment</h3>
              <p>Manage your devices</p>
            </Link>

            <Link href="/withdraw" className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-2xl font-bold mb-2">Withdraw</h3>
              <p>Cash out your earnings</p>
            </Link>
          </div>

          {/* Equipment Cards Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Available Tasks</h3>
              <Link href="/joining-process" className="px-6 py-2 bg-white border-2 border-emerald-500 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition">
                View All Packages
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {grades.map((item) => (
                <DeviceCard
                  key={item.grade}
                  item={item}
                  userBalance={user?.balance}
                  onRequestDeposit={onRequestDeposit}
                  isSignedIn={!!session?.user}
                />
              ))}
            </div>
          </div>

          {/* Deposit Modal */}
          {depositModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl p-8 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Insufficient Balance</h3>
                <p className="mb-4">You need <strong>{depositModal.required} USDT</strong> on <strong>{depositModal.network}</strong> to start. Would you like to deposit now?</p>
                <div className="flex gap-4 justify-end">
                  <button onClick={closeDepositModal} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                  <button onClick={goToDeposit} className="px-4 py-2 rounded bg-cyan-600 text-white">Go to Deposit</button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Recent Activity</h3>
            <TransactionHistory />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-8 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
          <div>
            <h4 className="font-bold text-lg mb-4">ANDES</h4>
            <p className="text-gray-400 text-sm">Global sharing economy platform</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Navigation</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition">Dashboard</Link></li>
              <li><Link href="/joining-process" className="hover:text-cyan-400 transition">Join</Link></li>
              <li><Link href="/equipment" className="hover:text-cyan-400 transition">Equipment</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Account</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/profile" className="hover:text-cyan-400 transition">Profile</Link></li>
              <li><Link href="/deposit" className="hover:text-cyan-400 transition">Deposit</Link></li>
              <li><Link href="/withdraw" className="hover:text-cyan-400 transition">Withdraw</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="https://t.me/andes" className="hover:text-cyan-400 transition">Telegram</a></li>
              <li><a href="https://youtube.com/andes" className="hover:text-cyan-400 transition">YouTube</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2026 ANDES. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}