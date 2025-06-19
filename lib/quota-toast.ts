'use client';

import { toast } from '@/components/sonner-provider';
import { Button } from '@/components/ui/button';

/**
 * Display a toast notification when a user exceeds their quota
 * Includes a CTA to sign up for a free account with higher limits
 * 
 * @param type The type of quota exceeded ('generate' or 'domain-check')
 */
export function showQuotaExceededToast(type: 'generate' | 'domain-check') {
  const title = type === 'generate'
    ? 'Name Generation Limit Reached'
    : 'Domain Check Limit Reached';

  const description = type === 'generate'
    ? 'You\'ve reached your daily limit for name generations. Upgrade to a premium plan for unlimited generations and advanced features!'
    : 'You\'ve reached your daily limit for domain checks. Upgrade to a premium plan for unlimited domain checks and priority support!';

  toast.error(title, {
    description,
    duration: 8000, // Show for 8 seconds
    id: `quota-exceeded-${type}`, // Prevent duplicate toasts
    action: {
      label: 'View Plans',
      onClick: () => {
        // If we're already on the homepage, scroll to pricing section
        if (window.location.pathname === '/' || window.location.pathname === '') {
          const pricingSection = document.getElementById('pricing');
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          // If on another page, navigate to homepage with pricing anchor
          window.location.href = '/#pricing';
        }
      },
    },
    className: 'quota-exceeded-toast',
  });
  
  // Log for debugging
  console.log(`Quota exceeded toast shown for ${type}`);
}
