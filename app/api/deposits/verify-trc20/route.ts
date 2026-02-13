import { NextRequest, NextResponse } from "next/server";
import {
  getTRC20USDTBalance,
  validateTRC20Transfer,
  getTRC20Transfers,
} from "@/lib/tronApi";
import { getDepositAddress } from "@/lib/depositAddresses";

/**
 * POST /api/deposits/verify-trc20
 * Verifies a TRC20 USDT deposit to the platform wallet
 * Body: { walletAddress, transactionHash?, depositAmount }
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, transactionHash, depositAmount } = await req.json();

    if (!walletAddress || !depositAmount) {
      return NextResponse.json(
        { error: "Missing walletAddress or depositAmount" },
        { status: 400 }
      );
    }

    // Get platform wallet from configuration
    const platformDepositInfo = getDepositAddress("trc20");
    const PLATFORM_WALLET = platformDepositInfo.address;

    // If transaction hash provided, validate that specific transaction
    if (transactionHash) {
      const isValid = await validateTRC20Transfer(
        PLATFORM_WALLET,
        walletAddress,
        depositAmount.toString(),
        transactionHash
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Transaction validation failed", verified: false },
          { status: 400 }
        );
      }

      return NextResponse.json({
        verified: true,
        message: "Deposit verified successfully",
        transactionHash,
        amount: depositAmount,
      });
    }

    // Otherwise, fetch recent transfers to platform wallet from the user's wallet
    const transfers = await getTRC20Transfers(PLATFORM_WALLET);
    const relevantTransfer = transfers.find(
      (t) =>
        t.from === walletAddress &&
        parseFloat(t.amount) >= depositAmount * 1e6 // USDT has 6 decimals
    );

    if (!relevantTransfer) {
      return NextResponse.json(
        {
          error: "No matching deposit found",
          verified: false,
          tip: `Ensure you sent USDT to the correct platform wallet address: ${PLATFORM_WALLET}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verified: true,
      message: "Deposit found and verified",
      transactionHash: relevantTransfer.transactionHash,
      amount: depositAmount,
      timestamp: relevantTransfer.timestamp,
    });
  } catch (error) {
    console.error("TRC20 deposit verification error:", error);
    return NextResponse.json(
      { error: "Verification failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
