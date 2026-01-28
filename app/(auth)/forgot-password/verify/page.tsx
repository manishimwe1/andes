"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const VerifyPageContent = dynamic(() => import("./VerifyPageContent"), { ssr: false });

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to indigo-200 px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </section>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
