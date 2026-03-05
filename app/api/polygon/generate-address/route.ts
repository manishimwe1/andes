import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generatePolygonAddress } from "@/lib/polygon/utils";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    console.log("🔐 [Polygon] Checking authentication...");

    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ [Polygon] User authenticated:", session.user.contact);

    // Get user from Convex
    const user = await convex.query(api.user.getUserByContact, {
      contact: session.user.contact,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("👤 [Polygon] User found:", user._id);

    // Check if user already has a Polygon address
    const existingAddress = user.depositAddresses?.polygon;

    if (existingAddress) {
      console.log("📍 [Polygon] Address already exists:", existingAddress);
      return NextResponse.json({
        address: existingAddress,
        isNew: false,
        network: "polygon",
      });
    }

    console.log("🔧 [Polygon] Generating new Polygon address...");

    // Generate new Polygon address
    const { address, privateKey } = await generatePolygonAddress();

    console.log("✅ [Polygon] New address generated:", address);

    // Save address to user's depositAddresses
    await convex.mutation(api.deposit.saveDepositAddress, {
      userId: user._id,
      network: "polygon",
      address,
    });

    // IMPORTANT: In production, encrypt the private key before storing!
    console.log("⚠️  [Polygon] TESTNET PRIVATE KEY:", privateKey);

    console.log("💾 [Polygon] Address saved to database");

    return NextResponse.json({
      address,
      isNew: true,
      network: "polygon",
    });
  } catch (error: any) {
    console.error("❌ [Polygon] Error generating address:", error);

    return NextResponse.json(
      {
        error: "Failed to generate Polygon address",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
