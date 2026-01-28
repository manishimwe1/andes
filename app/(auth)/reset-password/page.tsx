"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const phoneNumber = searchParams.get("phoneNumber");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!token || (!email && !phoneNumber)) {
    return (
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 px-4  w-screen">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-indigo-900 text-center">
            Invalid or expired reset link
          </h2>
          <p className="text-gray-600 text-center text-sm mb-4">
            The password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <div className="text-center pt-4">
            <a
              href="/forgot-password"
              className="text-indigo-700 underline text-sm hover:text-indigo-900 transition-colors"
            >
              Request new reset link
            </a>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      // Call your backend API to verify token and update password
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phoneNumber, token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Invalid or expired reset link.");
        toast.error("Token expired");
        router.push("/forgot-password");
        return;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen min-w-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 px-4 ">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-indigo-900 text-center">
          Reset your password
        </h2>
        <p className="text-gray-600 text-center text-sm mb-4">
          Enter your new password for{" "}
          <span className="font-medium text-indigo-700">
            {email || phoneNumber}
          </span>
        </p>
        {success ? (
          <div className="text-green-600 text-center text-sm mt-2">
            Password reset successful! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-indigo-900 mb-1"
              >
                New Password
              </label>
              <div className="relative w-full rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                />
                <div className="h-fit w-full">
                  {showPassword ? (
                    <EyeOff
                      className="absolute top-1/2 -translate-y-1/2 right-2 cursor-pointer text-indigo-500 transition-all duration-1000 ease-in-out"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <Eye
                      className="absolute top-1/2 -translate-y-1/2 right-2 cursor-pointer text-indigo-500"
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-indigo-900 mb-1"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={8}
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
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </section>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
