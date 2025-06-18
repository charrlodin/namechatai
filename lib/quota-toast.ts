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
    ? 'You\'ve reached your daily limit for name generations. Sign up for unlimited generations!'
    : 'You\'ve reached your daily limit for domain checks. Sign up for unlimited domain checks!';

  toast.error(title, {
    description,
    duration: 8000, // Show for 8 seconds
    id: `quota-exceeded-${type}`, // Prevent duplicate toasts
    action: {
      label: 'Sign up',
      onClick: () => window.location.href = '/signup',
    },
    className: 'quota-exceeded-toast',
  });
  
  // Log for debugging
  console.log(`Quota exceeded toast shown for ${type}`);
}
