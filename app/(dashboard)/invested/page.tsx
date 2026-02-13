'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type InvestedEntry = {
  level: string
  user: any
  depositSum: number
}

export default function InvestedPage() {
  const { data: session } = useSession()
  const contact = (session as any)?.user?.contact

  const [loading, setLoading] = useState(false)
  const [invested, setInvested] = useState<InvestedEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchInvested = async () => {
    if (!contact) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/team/check?contact=${encodeURIComponent(contact)}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setInvested(data.invested || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvested()
  }, [contact])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Invested Members</h1>
          <div className="flex gap-2">
            <button onClick={fetchInvested} className="px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
            <Link href="/dashboard" className="px-3 py-1 bg-white border rounded">Back</Link>
          </div>
        </div>

        {!contact && (
          <div className="p-4 bg-yellow-50 rounded">No contact available in session.</div>
        )}

        {error && <div className="p-3 bg-red-50 text-red-700 rounded mb-3">{error}</div>}

        {loading && <div className="p-3 bg-white rounded">Loading…</div>}

        {!loading && invested.length === 0 && (
          <div className="p-4 bg-white rounded">No invested members found.</div>
        )}

        <div className="space-y-3 mt-4">
          {invested.map((it, idx) => (
            <div key={idx} className="bg-white rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{it.user?.contact || it.user?.firstname || '—'}</div>
                <div className="text-xs text-gray-500">Level {it.level}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${(it.depositSum || 0).toFixed(2)}</div>
                <div className="text-xs text-gray-500">Deposited</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
