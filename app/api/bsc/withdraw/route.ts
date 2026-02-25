import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { isValidBscAddress, sendBscTransaction } from '@/lib/bsc/utils';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.contact) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount, address, network, tokenType } = body;

        if (!amount || !address || !network) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (network !== 'bep20') {
             return NextResponse.json({ error: "Only BSC (BEP20) withdrawals are supported via this endpoint" }, { status: 400 });
        }
        
        if (!isValidBscAddress(address)) {
             return NextResponse.json({ error: "Invalid BSC address" }, { status: 400 });
        }

        const type = tokenType || "BNB"; // Default to Native BNB
        if (!["BNB", "USDT", "USDC"].includes(type)) {
            return NextResponse.json({ error: "Invalid token type" }, { status: 400 });
        }
        
        // 1. Get User ID from Convex
        const user = await convex.query(api.user.getUserByContact, {
             contact: session.user.contact,
        });

        if (!user) {
             return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Request Withdrawal in Convex (deducts balance, creates pending tx)
        // This throws error if insufficient balance
        let transactionId;
        try {
            transactionId = await convex.mutation(api.withdrawal.requestWithdrawal, {
                userId: user._id,
                amount: parseFloat(amount),
                address: address,
                network: 'bep20',
            });
        } catch (err: any) {
             return NextResponse.json({ error: err.message || "Failed to create withdrawal request" }, { status: 400 });
        }

        // 3. Process withdrawal on BSC Blockchain
        try {
            console.log(`Processing ${type} withdrawal: ${amount} to ${address}`);

            // Execute Transfer
            const txHash = await sendBscTransaction(address, parseFloat(amount), type as any);

            console.log(`Withdrawal successful. TX ID: ${txHash}`);

            // 4. Update transaction status to completed
            await convex.mutation(api.withdrawal.completeWithdrawal, {
                transactionId,
                status: 'completed',
                transactionHash: txHash
            });

            return NextResponse.json({ 
                success: true, 
                txId: txHash,
                message: "Withdrawal successful" 
            });

        } catch (error: any) {
            console.error("Blockchain withdrawal failed:", error);
            
            // 5. Refund user on failure
            await convex.mutation(api.withdrawal.completeWithdrawal, {
                transactionId,
                status: 'failed',
                error: error.message || "Blockchain transaction failed"
            });

            return NextResponse.json({ 
                error: "Withdrawal failed on blockchain. Your balance has been refunded.",
                details: error.message 
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Withdrawal API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
