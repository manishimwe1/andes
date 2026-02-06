'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode, Suspense } from "react";

export default function NextAuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading session...</div>}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </Suspense>
  );
}
