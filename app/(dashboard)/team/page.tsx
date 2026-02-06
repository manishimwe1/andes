"use client"
import React from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import TeamReport from '@/components/TeamReport'
import TeamPyramid from '@/components/TeamPyramid'
import InviteCard from '@/components/InviteCard'

const TeamPage = () => {
  const { data: session } = useSession()

  return (
    <div className="font-montserrat text-gray-800 overflow-hidden bg-gradient-to-br from-green-400 to-blue-500 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md h-full min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-cyan-400 pt-4 px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/profile" className="text-2xl text-white hover:opacity-80">←</Link>
            <div className="text-center font-semibold text-gray-800 text-lg">Team report</div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 py-6 pb-28">
          {/* Invite Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Invite New Members</h3>
            <InviteCard userId={(session as any)?.user?.id ?? undefined} code={(session as any)?.user?.invitationCode ?? '2896064'} />
          </div>

          {/* Team Pyramid */}
          <TeamPyramid />

          {/* Team Report */}
          <TeamReport />
        </div>

        {/* Bottom Nav */}
        <nav className="fixed bottom-4 left-0 right-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-md flex items-center justify-between px-6 pointer-events-auto">
            <Link href="/dashboard" className="flex-1 text-center text-white/90 bg-white/20 rounded-full py-2 text-sm">Home</Link>
            <div className="-mt-6">
              <Link href="/joining-process" className="inline-flex items-center justify-center w-16 h-16 bg-white text-cyan-700 rounded-full shadow-lg font-bold ring-4 ring-white">●</Link>
            </div>
            <Link href="/transactions" className="flex-1 text-center text-white/90 bg-white/20 rounded-full py-2 text-sm">Transactions</Link>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default TeamPage


