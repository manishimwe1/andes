"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useSession } from 'next-auth/react';

const MIN_WITHDRAWAL = {
  polygon: 2,
  erc20: 20,
  trc20: 100,
  bep20: 2,
};

export default function WithdrawalForm() {
  const { user } = useUser();
  const { data: session } = useSession();
  const createWithdrawal = useMutation(api.transaction.createWithdrawal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    network: 'polygon' as keyof typeof MIN_WITHDRAWAL,
    walletAddress: '',
    transactionPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount;
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const minAmount = MIN_WITHDRAWAL[formData.network];
      if (amount < minAmount) {
        setError(
          `Minimum withdrawal for ${formData.network.toUpperCase()} is ${minAmount} USDT`
        );
        return;
      }

      if (!formData.walletAddress.trim()) {
        setError('Please enter wallet address');
        return;
      }

      if (!formData.transactionPassword.trim()) {
        setError('Please enter transaction password');
        return;
      }

      // Accept either Clerk user id or next-auth session (fallback to email)
      const currentUserId = user?.id ?? session?.user?.email;
      if (!currentUserId) {
        setError('User not authenticated');
        return;
      }

      // Create withdrawal
      const transactionId = await createWithdrawal({
        userId: currentUserId as any,
        amount: amount,
        network: formData.network,
        walletAddress: formData.walletAddress,
        transactionPassword: formData.transactionPassword,
      });

      setSuccess('Withdrawal request submitted successfully! Transaction ID: ' + transactionId);
      setFormData({
        amount: '',
        network: 'polygon',
        walletAddress: '',
        transactionPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Withdrawal Request</h2>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Amount (USDT)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter withdrawal amount"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Minimum: {MIN_WITHDRAWAL[formData.network]} USDT
          </p>
        </div>

        {/* Network Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Select Withdrawal Network
          </label>
          <select
            name="network"
            value={formData.network}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white cursor-pointer"
          >
            <option value="polygon">
              Polygon Network (Min: 2 USDT)
            </option>
            <option value="erc20">
              ERC20 Network (Min: 20 USDT)
            </option>
            <option value="trc20">
              TRC20 Network (Min: 100 USDT)
            </option>
            <option value="bep20">
              BEP20 Network (Min: 2 USDT)
            </option>
          </select>
        </div>

        {/* Wallet Address */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Wallet Address
          </label>
          <input
            type="text"
            name="walletAddress"
            value={formData.walletAddress}
            onChange={handleInputChange}
            placeholder="Enter your wallet address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Transaction Password */}
        <div className="mb-8">
          <label className="block text-gray-700 font-semibold mb-2">
            Transaction Password
          </label>
          <input
            type="password"
            name="transactionPassword"
            value={formData.transactionPassword}
            onChange={handleInputChange}
            placeholder="Please enter the payment password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-lg rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Submit Withdrawal'}
        </button>

        {/* Information Box */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-gray-900 font-semibold mb-3">Withdrawal Information:</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✓ Withdraw once a day, instant arrival, no handling fee</li>
            <li>✓ Select the correct network for your wallet address</li>
            <li>✓ Polygon & BEP20: Minimum 2 USDT</li>
            <li>✓ ERC20: Minimum 20 USDT</li>
            <li>✓ TRC20: Minimum 100 USDT</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
