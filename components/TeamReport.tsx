"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "next-auth/react";
import AddTeamMemberModal from "./AddTeamMemberModal";

export default function TeamReport() {
  const { data: session } = useSession();
  const userId = (session as any)?.user?.id;
  const report = useQuery(api.team.getTeamReport, userId ? { userId } : "skip");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<"A" | "B" | "C">("A");

  if (!userId) return null;
  if (!report) return <div className="mt-6 p-4 bg-white rounded-2xl">Loading team report...</div>;

  const totalDeposits = report.levels.A.depositSum + report.levels.B.depositSum + report.levels.C.depositSum;

  const handleAddMember = async (email: string, level: "A" | "B" | "C") => {
    console.log(`Adding ${email} to Team ${level}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const openAddModal = (level: "A" | "B" | "C") => {
    setSelectedLevel(level);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Top Stats Card */}
      <div className="bg-white rounded-2xl p-4">
        {/* First Row - Main Stats */}
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{report.totalMembers}</div>
            <div className="text-xs text-gray-600 mt-1">Team size</div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">USD{totalDeposits.toFixed(4)}</div>
            <div className="text-xs text-gray-600 mt-1">Team recharge</div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">USD{report.totalCommission.toFixed(4)}</div>
            <div className="text-xs text-gray-600 mt-1">Team withdrawal</div>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-3"></div>

        {/* Second Row - Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-gray-900">{report.levels.A.count}</div>
            <div className="text-xs text-gray-600 mt-1">New team</div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{report.levels.B.depositSum.toFixed(4)}</div>
            <div className="text-xs text-gray-600 mt-1">First recharge<br/>number</div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{report.levels.C.depositSum.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">First withdrawal<br/>number</div>
          </div>
        </div>
      </div>

      {/* Team Sections */}
      <div className="space-y-2">
        {(["A","B","C"] as const).map((level, idx) => {
          const info = report.levels[level];
          const colors = [
            "from-green-400 to-teal-500",
            "from-teal-500 to-blue-500", 
            "from-blue-500 to-blue-600"
          ];
          
          return (
            <div key={level} className={`bg-gradient-to-r ${colors[idx]} rounded-2xl p-4 flex items-center justify-between text-white relative overflow-hidden`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'}}></div>
              </div>

              {/* Left Side - Team Info */}
              <div className="flex-1 relative z-10">
                <div className="text-sm font-semibold flex items-center gap-1">⭐ Team {level}</div>
                <div className="text-4xl font-bold mt-2">{info.count}</div>
                <div className="text-sm opacity-90 mt-1">Team size</div>
              </div>

              {/* Divider */}
              <div className="w-px h-16 bg-white/30 mx-3"></div>

              {/* Right Side - Commission */}
              <div className="flex flex-col items-center justify-center gap-2 relative z-10">
                <div className="text-center">
                  <div className="text-3xl font-bold">{(info.rate*100).toFixed(0)}%</div>
                  <div className="text-xs opacity-90 mt-1">Team benefits</div>
                </div>
                <button
                  onClick={() => openAddModal(level)}
                  className="w-8 h-8 bg-white/40 hover:bg-white/60 rounded-full flex items-center justify-center text-white text-lg font-bold transition mt-2"
                  title={`Add member to Team ${level}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AddTeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddMember}
      />
    </div>
  );
}
