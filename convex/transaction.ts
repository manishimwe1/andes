import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { compare } from "bcryptjs";

// Minimum withdrawal amounts per network
const MIN_WITHDRAWAL = {
  polygon: 2,
  erc20: 20,
  trc20: 100,
  bep20: 2,
};

// Minimum deposit amounts per network
const MIN_DEPOSIT = {
  polygon: 1,
  erc20: 10,
  trc20: 50,
  bep20: 1,
};

export const createDeposit = mutation({
  args: {
    userId: v.id("user"),
    amount: v.number(),
    network: v.union(
      v.literal("polygon"),
      v.literal("erc20"),
      v.literal("trc20"),
      v.literal("bep20")
    ),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate minimum amount
    const minAmount = MIN_DEPOSIT[args.network];
    if (args.amount < minAmount) {
      throw new ConvexError(
        `Minimum deposit for ${args.network.toUpperCase()} is ${minAmount} USDT`
      );
    }

    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Create transaction record
    const transactionId = await ctx.db.insert("transaction", {
      userId: args.userId,
      type: "deposit",
      amount: args.amount,
      network: args.network,
      walletAddress: args.walletAddress,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return transactionId;
  },
});

export const createWithdrawal = mutation({
  args: {
    userId: v.id("user"),
    amount: v.number(),
    network: v.union(
      v.literal("polygon"),
      v.literal("erc20"),
      v.literal("trc20"),
      v.literal("bep20")
    ),
    walletAddress: v.string(),
    transactionPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate minimum amount
    const minAmount = MIN_WITHDRAWAL[args.network];
    if (args.amount < minAmount) {
      throw new ConvexError(
        `Minimum withdrawal for ${args.network.toUpperCase()} is ${minAmount} USDT`
      );
    }

    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Verify transaction password (bcrypt compare with hashed password)
      const storedHash = user.transactionPassword || "";
      const isMatch = await compare(args.transactionPassword, storedHash);
      if (!isMatch) {
        throw new ConvexError("Invalid transaction password");
    }

    // Check user balance
    const userBalance = user.balance || 0;
    if (userBalance < args.amount) {
      throw new ConvexError(
        `Insufficient balance. Your balance: ${userBalance} USDT`
      );
    }

    // Create withdrawal transaction
    const transactionId = await ctx.db.insert("transaction", {
      userId: args.userId,
      type: "withdrawal",
      amount: args.amount,
      network: args.network,
      walletAddress: args.walletAddress,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Deduct from user balance
    await ctx.db.patch(args.userId, {
      balance: userBalance - args.amount,
    });

    return transactionId;
  },
});

export const getTransactionHistory = query({
  args: {
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transaction")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return transactions;
  },
});

export const getAllTransactions = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transaction")
      .order("desc")
      .collect();

    return transactions;
  },
});

export const getTransactionById = query({
  args: {
    transactionId: v.id("transaction"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transactionId);
  },
});

export const updateTransactionStatus = mutation({
  args: {
    transactionId: v.id("transaction"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    transactionHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError("Transaction not found");
    }

    // If withdrawal was failed, refund the amount
    if (
      args.status === "failed" &&
      transaction.type === "withdrawal" &&
      transaction.status === "pending"
    ) {
      const user = await ctx.db.get(transaction.userId);
      if (user) {
        const userBalance = user.balance || 0;
        await ctx.db.patch(transaction.userId, {
          balance: userBalance + transaction.amount,
        });
      }
    }

    // If deposit is completed, add to balance
    if (
      args.status === "completed" &&
      transaction.type === "deposit" &&
      transaction.status === "pending"
    ) {
      const user = await ctx.db.get(transaction.userId);
      if (user) {
        const userBalance = user.balance || 0;
        await ctx.db.patch(transaction.userId, {
          balance: userBalance + transaction.amount,
        });
      }
    }

    await ctx.db.patch(args.transactionId, {
      status: args.status,
      transactionHash: args.transactionHash,
      updatedAt: Date.now(),
    });
  },
});
