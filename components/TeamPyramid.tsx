"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "next-auth/react";

export default function TeamPyramid() {
  const { data: session } = useSession();
  const userId = (session as any)?.user?.id;
  const report = useQuery(api.team.getTeamReport, userId ? { userId } : "skip");
  const userName = session?.user?.name?.split(" ")[0] || "You";

  if (!userId) return null;
  if (!report) return null;

  return (
    <div className="mt-6 bg-gradient-to-b from-white to-gray-50 rounded-2xl p-8">
      <h3 className="text-lg font-bold text-gray-900 mb-8 text-center">Your Team Pyramid</h3>
      
      <div className="flex flex-col items-center space-y-0">
        {/* YOU - Top */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-8 py-4 text-center shadow-lg">
            <div className="font-bold text-lg">{userName}</div>
            <div className="text-xs opacity-90 mt-1">(YOU)</div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="text-3xl text-gray-400 font-light mb-4">↓</div>

        {/* Team A - Level 1 */}
        <div className="w-full max-w-xs mb-4">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl px-6 py-6 text-center shadow-lg border-2 border-green-300">
            <div className="text-3xl font-bold">{report.levels.A.count}</div>
            <div className="text-sm font-semibold mt-2">TEAM A</div>
            <div className="text-xs opacity-90 mt-2">(Your Direct Referrals)</div>
            <div className="text-sm font-bold mt-2">18% Commission</div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="text-3xl text-gray-400 font-light mb-4">↓</div>

        {/* Team B - Level 2 */}
        <div className="w-full max-w-md mb-4">
          <div className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-2xl px-6 py-6 text-center shadow-lg border-2 border-teal-300">
            <div className="text-3xl font-bold">{report.levels.B.count}</div>
            <div className="text-sm font-semibold mt-2">TEAM B</div>
            <div className="text-xs opacity-90 mt-2">(Their Referrals)</div>
            <div className="text-sm font-bold mt-2">3% Commission</div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="text-3xl text-gray-400 font-light mb-4">↓</div>

        {/* Team C - Level 3 */}
        <div className="w-full max-w-lg">
          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-2xl px-6 py-6 text-center shadow-lg border-2 border-blue-300">
            <div className="text-3xl font-bold">{report.levels.C.count}</div>
            <div className="text-sm font-semibold mt-2">TEAM C</div>
            <div className="text-xs opacity-90 mt-2">(Their Referrals)</div>
            <div className="text-sm font-bold mt-2">2% Commission</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-gray-100 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <div className="text-lg font-bold text-gray-900">{report.totalMembers}</div>
            <div className="text-xs text-gray-600 mt-1">Total Members</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">USD${(report.levels.A.depositSum + report.levels.B.depositSum + report.levels.C.depositSum).toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">Team Deposits</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">USD${report.totalCommission.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">Total Earnings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
