/**
 * Pricing page that redirects to homepage pricing section
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to homepage with pricing anchor
    router.replace('/#pricing');
  }, [router]);
  
  // Return empty div while redirecting
  return <div className="min-h-screen bg-black"></div>;
}
