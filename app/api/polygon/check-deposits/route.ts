import axios from "axios";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAccountBalance, getNewTransactions } from "@/lib/polygon/utils";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function getMaticPriceInUsdt() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd"
    );
    return response.data["matic-network"].usd;
  } catch (error) {
    console.error("Failed to fetch MATIC price:", error);
    return 1.0; // fallback price
  }
}

export async function GET(req: Request) {
  try {
    console.log("🔐 [Polygon] Checking authentication...");

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

    const depositAddress = user.depositAddresses?.polygon;

    if (!depositAddress) {
      return NextResponse.json(
        {
          error: "No deposit address found",
          message: "Please generate a deposit address first",
        },
        { status: 404 }
      );
    }

    console.log("📍 [Polygon] Checking deposits for address:", depositAddress);

    const checkStartedAt = Date.now();

    const maticPrice = await getMaticPriceInUsdt();
    console.log(`💱 [Polygon] Current MATIC Price: $${maticPrice}`);

    const balance = await getAccountBalance(depositAddress);
    console.log(
      `💰 [Polygon] Wallet Balance — MATIC: ${balance.polygon}, USDT: ${balance.usdt}, USDC: ${balance.usdc}`
    );

    const maticAsUsdt = balance.polygon * maticPrice;
    const totalWalletUsdt = balance.usdt + balance.usdc + maticAsUsdt;
    console.log(
      `💰 [Polygon] Combined Balance: $${totalWalletUsdt.toFixed(4)} ` +
        `(MATIC: ${balance.polygon} → $${maticAsUsdt.toFixed(4)}, USDT: ${balance.usdt}, USDC: ${balance.usdc})`
    );

    const lastCheck = user.lastDepositCheck || 0;
    const alreadyCredited = user.balance || 0;

    const newTransactions = await getNewTransactions(depositAddress, lastCheck);
    console.log(
      `📊 [Polygon] Found ${newTransactions.length} new transactions since ${new Date(lastCheck).toISOString()}`
    );

    const deposits = [];

    for (const tx of newTransactions) {
      if (tx.to.toLowerCase() !== depositAddress.toLowerCase()) continue;

      if (!tx.confirmed) {
        console.log(`⏳ [Polygon] Skipping unconfirmed tx: ${tx.txHash}`);
        continue;
      }

      // Convert to USDT value
      const txAmountUsdt =
        tx.type === "POLYGON"
          ? Number(tx.amount) * maticPrice
          : Number(tx.amount); // USDT and USDC are already in USD

      try {
        // 1. Record the deposit entry
        const depositId = await convex.mutation(api.deposit.recordDeposit, {
          userId: user._id,
          network: "polygon",
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
        `✅ [Polygon] Recorded tx entry: $${txAmountUsdt.toFixed(4)} (${tx.amount} ${tx.type}) — hash: ${tx.txHash}`
      );
    }

    // Always advance lastCheck to when THIS poll started
    await convex.mutation(api.deposit.updateLastDepositCheck, {
      userId: user._id,
      timestamp: checkStartedAt,
    });

    return NextResponse.json({
      address: depositAddress,
      balance: {
        polygon: balance.polygon,
        usdt: balance.usdt,
        usdc: balance.usdc,
        maticAsUsdt,
        totalUsdt: totalWalletUsdt,
      },
      newDeposits: deposits,
      totalNewDeposits: deposits.length,
    });
  } catch (error: any) {
    console.error("❌ [Polygon] Error checking deposits:", error);

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
