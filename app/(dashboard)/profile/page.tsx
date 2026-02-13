"use client"
import React from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import InviteCard from '@/components/InviteCard'

const page = () => {
  const { data: session } = useSession()
  const name = session?.user?.name || session?.user?.firstName || "User"
  const email = session?.user?.email || "—"
  const phone = (session?.user as any)?.phone || session?.user?.contact || "—"

  return (
    <div className="font-montserrat text-gray-800 overflow-hidden bg-gradient-to-br from-green-400 to-cyan-300 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md h-full min-h-screen flex flex-col">
        <div className="bg-white/30 backdrop-blur-sm rounded-b-xl py-3 px-4 flex items-center justify-between mt-8 mx-4">
          <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">≡</button>
          <div className="text-center font-semibold">Language selection</div>
          <div className="flex gap-2">
            <a href="https://t.me/andes" className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">T</a>
            <a href="https://youtube.com/andes" className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">Y</a>
          </div>
        </div>

        <div className="flex-1 overflow-auto mt-6 px-4 pb-28">
          <div className="bg-white/80 rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="text-xl font-semibold text-gray-800">{name}</div>
            <div className="text-sm text-gray-600">{email}</div>
            <div className="text-sm text-gray-600">{phone}</div>
          </div>

          <InviteCard 
            userId={(session as any)?.user?.id ?? undefined} 
            code={(session as any)?.user?.invitationCode ?? 'N/A'}
            expiry={(session as any)?.user?.invitationExpiry ?? undefined}
          />

          <Link href="/team" className="mt-6 block bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-4 text-center font-semibold hover:opacity-90 transition">
            👥 View Team Report
          </Link>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-sm text-gray-700">Balance</div>
              <div className="text-lg font-bold text-gray-900">{(session as any)?.user?.balance ?? '0.00'}</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-sm text-gray-700">Devices</div>
              <div className="text-lg font-bold text-gray-900">{(session as any)?.user?.devices ?? 0}</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-sm text-gray-700">Referrals</div>
              <div className="text-lg font-bold text-gray-900">{(session as any)?.user?.referrals ?? 0}</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/profile/edit" className="block w-full text-center py-3 bg-white text-cyan-700 rounded-2xl font-semibold">Edit Profile</Link>
            <Link href="/deposit" className="block w-full text-center py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-semibold">Deposit</Link>
            <Link href="/withdraw" className="block w-full text-center py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-semibold">Withdraw</Link>
            <button onClick={() => signOut()} className="block w-full text-center py-3 bg-white/60 text-red-600 rounded-2xl font-semibold">Sign Out</button>
          </div>

          <div className="mt-6 bg-white/20 rounded-2xl p-4">
            <div className="text-sm text-gray-800 font-semibold mb-2">Account details</div>
            <div className="text-xs text-gray-700">Email: {email}</div>
            <div className="text-xs text-gray-700">Phone: {phone}</div>
          </div>

          <div className="h-32" />
        </div>

        <nav className="fixed bottom-4 left-0 right-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-md flex items-center justify-between px-6 pointer-events-auto">
            <Link href="/dashboard" className="flex-1 text-center text-white/90 bg-white/20 rounded-full py-2">Home</Link>
            <div className="-mt-6">
              <Link href="/joining-process" className="inline-flex items-center justify-center w-16 h-16 bg-white text-cyan-700 rounded-full shadow-lg font-bold ring-4 ring-white">●</Link>
            </div>
            <Link href="/transactions" className="flex-1 text-center text-white/90 bg-white/20 rounded-full py-2">Transactions</Link>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default page
