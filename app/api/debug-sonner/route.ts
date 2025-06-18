/**
 * Debug API to check Sonner initialization in browser
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Add a script tag to your page with the following content to debug Sonner:',
    debugScript: `
    console.log('Debugging Sonner initialization...');
    console.log('window.Sonner exists:', typeof window.Sonner !== 'undefined');
    console.log('window.toast exists:', typeof window.toast !== 'undefined');
    
    // List all properties on window that might be related to Sonner
    const sonnerRelated = Object.getOwnPropertyNames(window).filter(prop => 
      prop.toLowerCase().includes('toast') || 
      prop.toLowerCase().includes('sonner') ||
      prop.toLowerCase().includes('notification')
    );
    
    console.log('Potential Sonner-related globals:', sonnerRelated);
    `
  })
}
