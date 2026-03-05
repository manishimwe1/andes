import axios from "axios";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAccountBalance, getNewTransactions } from "@/lib/bsc/utils";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function getBnbPriceInUsdt() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
    );
    return response.data.binancecoin.usd;
  } catch (error) {
    console.error("Failed to fetch BNB price:", error);
    return 600; // fallback price
  }
}

export async function GET(req: Request) {
  try {
    console.log("🔐 [BSC] Checking authentication...");

    const session = await getServerSession(authOptions);

    if (!session?.user?.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await convex.query(api.user.getUserByContact, {
      contact: session.user.contact,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const depositAddress = user.depositAddresses?.bep20;
    console.log("depositAddress", depositAddress);

// ADD THIS:
console.log("RAW address from DB:", JSON.stringify(depositAddress));
console.log("Address length:", depositAddress?.length);
console.log("Expected length: 42");

    if (!depositAddress) {
      return NextResponse.json(
        {
          error: "No deposit address found",
          message: "Please generate a deposit address first",
        },
        { status: 404 }
      );
    }

    console.log("📍 [BSC] Checking deposits for address:", depositAddress);

    const checkStartedAt = Date.now();

    const bnbPrice = await getBnbPriceInUsdt();
    console.log(`💱 [BSC] Current BNB Price: $${bnbPrice}`);

    const balance = await getAccountBalance(depositAddress);
    console.log(
      `💰 [BSC] Wallet Balance — BNB: ${balance.bnb}, USDT: ${balance.usdt}, USDC: ${balance.usdc}`
    );

    const bnbAsUsdt = balance.bnb * bnbPrice;
    const totalWalletUsdt = balance.usdt + balance.usdc + bnbAsUsdt;
    console.log(
      `💰 [BSC] Combined Balance: $${totalWalletUsdt.toFixed(4)} ` +
        `(BNB: ${balance.bnb} → $${bnbAsUsdt.toFixed(4)}, USDT: ${balance.usdt}, USDC: ${balance.usdc})`
    );

    const lastCheck = user.lastDepositCheck || 0;
    const alreadyCredited = user.balance || 0;

    const newTransactions = await getNewTransactions(depositAddress, lastCheck);
    console.log(
      `📊 [BSC] Found ${newTransactions.length} new transactions since ${new Date(lastCheck).toISOString()}`
    );

    const deposits = [];

    for (const tx of newTransactions) {
      if (tx.to.toLowerCase() !== depositAddress.toLowerCase()) continue;

      if (!tx.confirmed) {
        console.log(`⏳ [BSC] Skipping unconfirmed tx: ${tx.txHash}`);
        continue;
      }

      // Convert to USDT value
      const txAmountUsdt =
        tx.type === "BNB"
          ? Number(tx.amount) * bnbPrice
          : Number(tx.amount); // USDT and USDC are already in USD

      try {
        // 1. Record the deposit entry (idempotent via hash check inside recordDeposit)
        const depositId = await convex.mutation(api.deposit.recordDeposit, {
          userId: user._id,
          network: "bep20",
          amount: txAmountUsdt,
          walletAddress: depositAddress,
          transactionHash: tx.txHash,
        });

        // 2. Mark the individual tx as completed
        await convex.mutation(api.deposit.updateDepositStatus, {
          transactionHash: tx.txHash,
          status: "completed",
        });

        deposits.push({
          id: depositId,
          txHash: tx.txHash,
          amount: txAmountUsdt,
          originalAmount: tx.amount,
          type: tx.type,
          timestamp: tx.timestamp,
        });

        console.log(
          `✅ [BSC] Recorded tx entry: $${txAmountUsdt.toFixed(4)} (${tx.amount} ${tx.type}) — hash: ${tx.txHash}`
        );
      } catch (error) {
        console.error(
          `❌ [BSC] Error recording deposit for tx ${tx.txHash}:`,
          error
        );
      }
    }

    // Always advance lastCheck to when THIS poll started
    await convex.mutation(api.deposit.updateLastDepositCheck, {
      userId: user._id,
      timestamp: checkStartedAt,
    });
    console.log(
      `🕐 [BSC] lastCheck advanced to ${new Date(checkStartedAt).toISOString()}`
    );

    return NextResponse.json({
      address: depositAddress,
      balance: {
        bnb: balance.bnb,
        usdt: balance.usdt,
        usdc: balance.usdc,
        bnbAsUsdt,
        totalUsdt: totalWalletUsdt,
      },
      newDeposits: deposits,
      totalNewDeposits: deposits.length,
    });
  } catch (error: any) {
    console.error("❌ [BSC] Error checking deposits:", error);

    return NextResponse.json(
      {
        error: "Failed to check deposits",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
