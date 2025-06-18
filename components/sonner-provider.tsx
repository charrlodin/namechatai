'use client';

// Properly import Sonner from the package
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

// Re-export the toast function for use throughout the app
export const toast = sonnerToast;

// This component renders the actual Sonner Toaster component
export function SonnerProvider() {
  return (
    <SonnerToaster 
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={5000}
    />
  );
}
