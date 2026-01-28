"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateVerificationCode } from "@/lib/utils";
import { useRouter } from "next/navigation";
import crypto from "crypto";
import { Loader } from "lucide-react";

export function generateSecureToken(length = 48) {
  return crypto.randomBytes(length).toString("hex");
}

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [usingPhone, setUsingPhone] = useState(false);
  const [checkOTP, setCheckOTP] = useState(false);
  const [OTP, setOTP] = useState<number>();
  const checkUserByEmail = useAction(api.user.checkUserByEmail);
  const updateUserInDb = useAction(api.user.updateUserInDb);
  const checkUserByPhone = useAction(api.user.checkUserByContact);

  const router = useRouter();

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!OTP || String(OTP).length !== 4) {
      setError("Please enter a valid 4-digit OTP.");
      return;
    }
    // Add OTP verification logic here
    toast.success("OTP verified successfully! (Placeholder)", {
      richColors: true,
    });
    setSubmitted(true);
    setLoading(false);
  };

  const validateInput = () => {
    if (usingPhone) {
      if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
        setError("Please enter a valid 10-digit phone number.");
        return false;
      }
    } else {
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitted(false);
    setLoading(true);

    if (!validateInput()) {
      setLoading(false);
      return;
    }

    try {
      if (usingPhone) {
        const result = await checkUserByPhone({ contact: phoneNumber });
        if (!result.found || !result.user) {
          setError(result.error || "No account found with that phone number.");
          setLoading(false);
          return;
        }

        const resetToken = generateVerificationCode(4);
        const resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour from now

        await updateUserInDb({
          userId: result.user._id,
          resetToken,
          resetTokenExpiry,
        });

        const to = `+25${phoneNumber}`;
        const message = `Your CVC verification code is: ${resetToken}.\n\nDo not share this code with anyone.`;

        const res = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, message }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Verification code sent successfully to your phone!", {
            richColors: true,
          });
          setPhoneNumber("");
          setCheckOTP(true);
          setSubmitted(true);
          setLoading(false);
          router.push(`/forgot-password/verify?phoneNumber=${phoneNumber}`);
        } else {
          setPhoneNumber("");
          setSubmitted(false);
          setLoading(false);
          toast.error(data.error || "Failed to send verification code.", {
            richColors: true,
          });
        }
      } else {
        const result = await checkUserByEmail({ email });
        if (!result.found || !result.user) {
          setError(result.error || "No account found with that email.");
          setLoading(false);
          return;
        }
        const resetToken = generateSecureToken();
        const resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour from now

        await updateUserInDb({
          userId: result.user._id,
          resetToken,
          resetTokenExpiry,
        });

        const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(result.user.email)}`;

        const message = `Hello ${result.user.fullname},\n\nWe received a request to reset your password for your account. Click the link below to set a new password:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.\n\nThank you,\nThe Support Team`;

        const res = await fetch("/api/sendEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: result.user.fullname,
            message,
            userId: result.user?._id,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(
            "Password reset link sent successfully to your email!",
            { richColors: true },
          );
        } else {
          toast.error(data.error || "Failed to send password reset link.", {
            richColors: true,
          });
          setLoading(false);
          setSubmitted(false);
          setEmail("");
          setPhoneNumber("");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen bg-[url('/images/bgimage.jpeg')] bg-cover bg-center bg-no-repeat px-4 w-full">
      <div className="bg-[url('/images/office.jpg')] absolute bg-cover bg-center bg-no-repeat h-full w-full opacity-40" />
      <div className="h-full w-full bg-indigo-900/10 rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-10 z-50 absolute" />
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6 z-50">
        <h2 className="text-2xl font-bold text-indigo-900 text-center">
          Forgot your password?
        </h2>
        <p className="text-gray-600 text-center text-sm mb-4">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
        <form
          onSubmit={checkOTP ? handleVerify : handleSubmit}
          className="space-y-4"
        >
          {!usingPhone ? (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-indigo-900 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || submitted}
                placeholder="you@example.com"
                required
              />
            </div>
          ) : checkOTP ? (
            <div>
              <label
                htmlFor="OTPnumber"
                className="block text-sm font-medium text-indigo-900 mb-1"
              >
                Verification code
              </label>
              <input
                id="OTPnumber"
                type="number"
                className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900"
                value={OTP}
                onChange={(e) => setOTP(Number(e.target.value))}
                disabled={loading || submitted}
                required
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-indigo-900 mb-1"
              >
                Phone number
              </label>
              <input
                id="phoneNumber"
                type="phoneNumber"
                autoComplete="phoneNumber"
                className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading || submitted}
                placeholder="0782222213"
                required
              />
            </div>
          )}
          {error && (
            <div className="text-red-500 text-xs text-center">{error}</div>
          )}
          {checkOTP ? (
            <Button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors disabled:opacity-60 cursor-pointer"
              disabled={loading || submitted}
            >
              Verify
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors disabled:opacity-60 cursor-pointer"
              disabled={loading || submitted}
            >
              {loading ? (
                <div className="flex items-center gap-1 justify-center">
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                <span>Send Reset Link</span>
              )}
            </Button>
          )}
        </form>
        <div
          className="text-sm text-gray-600 text-center cursor-pointer hover:underline"
          onClick={() => setUsingPhone(!usingPhone)}
        >
          use {usingPhone ? "email" : "phone number"} instead
        </div>
        {submitted && (
          <div className="text-green-600 text-center text-sm mt-2">
            If an account with that email exists, a reset link has been sent.
          </div>
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
};

export default ForgotPasswordPage;
