'use client';

import { Suspense, useEffect, useState } from 'react';

function ToasterContent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { Toaster } = require('sonner');
  return <Toaster />;
}

export function ToasterWrapper() {
  return (
    <Suspense fallback={null}>
      <ToasterContent />
    </Suspense>
  );
}
