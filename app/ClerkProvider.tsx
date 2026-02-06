"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3210";
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

let convexClient: ConvexReactClient | null = null;
try {
  if (convexUrl) {
    convexClient = new ConvexReactClient(convexUrl);
  }
} catch (error) {
  console.error("Failed to initialize Convex client:", error);
}

export default function ClerkProviderWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!clerkKey) {
    console.warn("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set - features may not work");
  }

  if (!convexClient) {
    console.warn("Convex client not initialized - database features may not work");
    // Still render children even if Convex fails
    return (
      <ClerkProvider publishableKey={clerkKey || ""}>
        {children}
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey || ""}>
      <ConvexProvider client={convexClient}>{children}</ConvexProvider>
    </ClerkProvider>
  );
}
