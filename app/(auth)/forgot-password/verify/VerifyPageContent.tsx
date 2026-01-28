"use client";

import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // console.log(searchParams.get("phoneNumber"));

  const [Virify, setVirify] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingChangePassword, setLoadingChangePassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const checkUserByPhone = useAction(api.user.checkUserByContact);
  const updateUserInDb = useAction(api.user.updateUserInDb);

  if (!searchParams.get("phoneNumber")) {
    redirect("/forgot-password");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
    if (!Virify) return toast.error("Please enter the verification code.");
    setLoading(true);
    setError("");
    const result = await checkUserByPhone({
      contact: searchParams.get("phoneNumber") as string,
    });
    if (!result.found || !result.user) {
      setError(result.error || "No account found with that phone number.");
      setLoading(false);
      return;
    }
    if (Virify !== result.user.resetToken) {
      setError("Verification code is incorrect.");
      setLoading(false);
      return;
    } else {
      router.push(
        `/reset-password?token=${result.user.resetToken}&phoneNumber=${encodeURIComponent(result.user.contact)}`,
      );
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen min-w-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 px-4 ">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-indigo-900 text-center">
          Verify your Account
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="verify"
              className="block text-sm font-medium text-indigo-900 mb-1"
            >
              Verification Code
            </label>
            <input
              id="verify"
              type="text"
              className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900"
              value={Virify}
              onChange={(e) => setVirify(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors disabled:opacity-60 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="text-center pt-4">
          <a
            href="/login"
            className="text-indigo-700 underline text-sm hover:text-indigo-900 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    </section>
  );
}