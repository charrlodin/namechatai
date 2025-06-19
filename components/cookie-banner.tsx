'use client';

/**
 * Cookie consent banner with accept/reject options
 */
import { useState, useEffect } from 'react';
import CookieConsent, { Cookies } from 'react-cookie-consent';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CookieBanner() {
  const [isClient, setIsClient] = useState(false);
  
  // Only render on client-side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle cookie acceptance
  const handleAccept = () => {
    // Set analytics cookies to enabled
    Cookies.set('analytics-enabled', 'true', { expires: 365 });
    console.log('Cookies accepted');
  };

  // Handle cookie rejection
  const handleDecline = () => {
    // Set analytics cookies to disabled
    Cookies.set('analytics-enabled', 'false', { expires: 365 });
    console.log('Cookies declined');
    
    // Disable any analytics that might be running
    if (typeof window !== 'undefined') {
      // Example: Disable Google Analytics
      // Use proper type assertion for window property
      (window as any)['ga-disable-GA_MEASUREMENT_ID'] = true;
    }
  };
  
  if (!isClient) return null;

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      onAccept={handleAccept}
      onDecline={handleDecline}
      expires={365}
      cookieName="namecheckai-consent"
      buttonClasses=""
      declineButtonClasses=""
      containerClasses=""
      contentClasses=""
      buttonWrapperClasses=""
      style={{
        background: '#111111',
        borderTop: '1px solid #333',
        color: '#fff',
        padding: '1rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}
      buttonStyle={{
        background: '#f97316',
        color: '#000',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        transition: 'background-color 150ms'
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: '#f97316',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontWeight: 500,
        cursor: 'pointer',
        border: '1px solid #f97316',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        transition: 'background-color 150ms'
      }}
      contentStyle={{
        flex: '1',
        margin: '0',
        fontSize: '0.875rem'
      }}
    >
      <span>
        We use cookies to improve your experience. By using Name Check AI, you agree to our{' '}
        <Link href="/privacy" className="text-orange-500 hover:text-orange-400 underline">
          Privacy Policy
        </Link>.
      </span>
    </CookieConsent>
  );
}
