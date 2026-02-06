"use client";

import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string, level: "A" | "B" | "C") => Promise<void>;
};

export default function AddTeamMemberModal({ isOpen, onClose, onAdd }: Props) {
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<"A" | "B" | "C">("A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      await onAdd(email, level);
      setSuccess(true);
      setEmail("");
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[90vw] shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Team Member</h2>

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
            ✓ Member added successfully!
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Team Level Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Team Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["A", "B", "C"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-2 px-3 rounded-lg font-semibold transition ${
                    level === lvl
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Team {lvl}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {level === "A" && "Direct referral - 18% commission"}
              {level === "B" && "Secondary team - 3% commission"}
              {level === "C" && "Tertiary team - 2% commission"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
