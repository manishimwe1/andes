import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateBscAddress } from "@/lib/bsc/utils";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    console.log("🔐 [BSC] Checking authentication...");

    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ [BSC] User authenticated:", session.user.contact);

    // Get user from Convex
    const user = await convex.query(api.user.getUserByContact, {
      contact: session.user.contact,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("👤 [BSC] User found:", user._id);

    // Check if user already has a BEP20 address
    const existingAddress = user.depositAddresses?.bep20;

    if (existingAddress) {
      console.log("📍 [BSC] Address already exists:", existingAddress);
      return NextResponse.json({
        address: existingAddress,
        isNew: false,
        network: "bep20",
      });
    }

    console.log("🔧 [BSC] Generating new BSC address...");

    // Generate new BSC address
    const { address, privateKey } = await generateBscAddress();

    console.log("✅ [BSC] New address generated:", address);

    // Save address to user's depositAddresses
    await convex.mutation(api.deposit.saveDepositAddress, {
      userId: user._id,
      network: "bep20",
      address,
    });

    // IMPORTANT: In production, encrypt the private key before storing!
    // For testnet, we'll just log it (NEVER do this in production!)
    console.log("⚠️  [BSC] TESTNET PRIVATE KEY:", privateKey);
    console.log("⚠️  SAVE THIS SECURELY! In production, encrypt before storing!");

    console.log("💾 [BSC] Address saved to database");

    return NextResponse.json({
      address,
      isNew: true,
      network: "bep20",
      // NEVER return private key to client!
    });
  } catch (error: any) {
    console.error("❌ [BSC] Error generating address:", error);

    return NextResponse.json(
      {
        error: "Failed to generate BSC address",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
