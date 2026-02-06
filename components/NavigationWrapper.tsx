'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/Navigation'), { 
  ssr: false,
  loading: () => <div className="h-20 bg-white/95 shadow-md" />
});

export default function NavigationWrapper() {
  return (
    <Suspense fallback={<div className="h-20 bg-white/95 shadow-md" />}>
    </Suspense>
  );
}
