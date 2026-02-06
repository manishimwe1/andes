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

  const user = useQuery(api.user.getUserByContact, { contact: session?.user?.contact || '' });
  console.log({session ,user});
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

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
            <li><Link href="/run" className="text-gray-700 font-medium hover:text-emerald-600 transition">Equipment</Link></li>
            <li><Link href="/transactions" className="text-gray-700 font-medium hover:text-emerald-600 transition">Finance</Link></li>
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

            <Link href="/run" className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
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
              <h3 className="text-3xl font-bold text-gray-900">Your Equipment</h3>
              <Link href="/run" className="px-6 py-2 bg-white border-2 border-emerald-500 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition">
                + Add Equipment
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {grade:'A0', price:20, profit:2, status: 'Delivery in progress', statusColor: 'text-orange-600', detail: 'Expected daily income: 2.00'},
                {grade:'A1', price:20, profit:2, status: 'Not delivered yet', statusColor: 'text-gray-600', detail: 'Expected daily income: 2.00'}
              ].map((d, idx) => (
                <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">{d.grade}</h4>
                        <p className={`text-sm font-semibold ${d.statusColor}`}>{d.status}</p>
                      </div>
                      <div className="text-5xl">
                        <Image src="/scooter.png" alt="Scooter" width={120} height={120} />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">{d.detail}</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <span className="text-gray-600 font-medium">Device Price</span>
                        <span className="text-xl font-bold text-gray-900">${d.price}.00</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <span className="text-gray-600 font-medium">Daily Profit</span>
                        <span className="text-xl font-bold text-emerald-600">${d.profit}.00</span>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transition">
                      Manage Device
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="text-4xl">ℹ️</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">No Equipment Yet?</h4>
                  <p className="text-gray-700 mb-4">Start with an A1 equipment package for just $20 and begin earning $2 daily.</p>
                  <Link href="/joining-process" className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                    View Packages
                  </Link>
                </div>
              </div>
            </div>
          </div>

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
              <li><Link href="/run" className="hover:text-cyan-400 transition">Equipment</Link></li>
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