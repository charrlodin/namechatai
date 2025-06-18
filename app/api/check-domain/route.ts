import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, incrementRateLimit, RATE_LIMITS } from '@/lib/redis';
import { parseDomainCheckResponse } from '@/lib/xml-parser';

// Types for domain check response
// Used by the parseDomainCheckResponse function return type
export interface DomainCheckResult {
  domain: string;
  available: boolean;
  isPremium: boolean;
  price?: number;
  currency?: string;
  error?: string;
  rawResponse?: string; // For debugging
  rateLimitRemaining?: number; // Number of checks remaining today
  rateLimitTotal?: number; // Total checks allowed per day
}

// Error codes from Namecheap API
// Commented out as not currently used but kept for reference
/*
const ERROR_CODES: Record<string, string> = {
  '3031510': 'Error response from domain provider',
  '3011511': 'Unknown response from the provider',
  '2011169': 'Only 50 domains are allowed in a single check command'
};
*/

/**
 * Check domain availability using Namecheap API
 */
export async function POST(req: NextRequest) {
  let domain = '';
  
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              '127.0.0.1';
    
    const body = await req.json();
    domain = body.domain;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      );
    }
    
    // Check rate limit before proceeding
    const rateLimitKey = `domain-check:${ip}`;
    // Check if user has exceeded their rate limit
    const rateLimitCheck = await checkRateLimit(rateLimitKey, 'domain-check');
    
    if (rateLimitCheck.remaining <= 0) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can check up to ${RATE_LIMITS.DOMAIN_CHECKS_PER_DAY} domains per day.`,
          rateLimitRemaining: 0,
          rateLimitTotal: RATE_LIMITS.DOMAIN_CHECKS_PER_DAY,
          quotaExceeded: true
        },
        { status: 429 }
      );
    }
    
    // Get Namecheap API key from environment variables
    const apiKey = process.env.NAMECHEAP_API_KEY;
    // For Namecheap, your account username is your API username
    const username = process.env.NAMECHEAP_USERNAME;
    // The IP address that's whitelisted in your Namecheap account
    const clientIp = process.env.NAMECHEAP_CLIENT_IP;
    
    // Using real API calls in all environments
    
    // Validate required environment variables
    if (!apiKey || !username || !clientIp) {
      console.error('Missing Namecheap API environment variables');
      console.error(`API Key: ${apiKey ? 'Set' : 'Missing'}`);
      console.error(`Username: ${username ? 'Set' : 'Missing'}`);
      console.error(`Client IP: ${clientIp ? 'Set' : 'Missing'}`);
      
      return NextResponse.json(
        { 
          domain, 
          error: 'Missing Namecheap API configuration. Please set NAMECHEAP_API_KEY, NAMECHEAP_USERNAME, and NAMECHEAP_CLIENT_IP in your .env.local file.',
        },
        { status: 500 }
      );
    }
    
    // Build Namecheap API URL with all required parameters
    const url = new URL('https://api.namecheap.com/xml.response');
    url.searchParams.append('ApiUser', username);
    url.searchParams.append('ApiKey', apiKey);
    url.searchParams.append('UserName', username);
    url.searchParams.append('ClientIp', clientIp);
    url.searchParams.append('Command', 'namecheap.domains.check');
    url.searchParams.append('DomainList', domain);
    
    // Call Namecheap API
    console.log(`Checking domain availability for: ${domain}`);
    console.log(`API URL: ${url.toString().replace(apiKey, '[REDACTED]')}`);
    
    try {
      // Use AbortController for timeout with a longer duration (15 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let response;
      try {
        response = await fetch(url.toString(), { 
          signal: controller.signal 
        });
        
        // Clear timeout
        clearTimeout(timeoutId);
      } catch (fetchError) {
        // Clear timeout if fetch throws
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
      // Parse XML response to extract domain availability
      const xmlData = await response.text();
      let result = await parseDomainCheckResponse(xmlData, domain);
      
      // For testing purposes: override availability based on domain prefix
      // This allows our test script to predictably test rate limiting
      const isTestMode = req.headers.get('x-test-mode') === 'true';
      if (isTestMode) {
        // Use startsWith to avoid substring matches (e.g., 'unavailable-test' containing 'available-test')
        const isAvailable = domain.startsWith('available-test-');
        result = {
          ...result,
          available: isAvailable
        };
        console.log(`TEST MODE: Overriding domain ${domain} availability to ${isAvailable}`);
      }
      
      // Only count available domains against the quota
      // This way users can check unavailable domains without using their quota
      if (result.available) {
        // Increment rate limit counter for available domains
        const count = await incrementRateLimit(rateLimitKey, 'domain-check');
        const remaining = Math.max(0, RATE_LIMITS.DOMAIN_CHECKS_PER_DAY - count);
        
        // Add rate limit info to response
        result.rateLimitRemaining = remaining;
        result.rateLimitTotal = RATE_LIMITS.DOMAIN_CHECKS_PER_DAY;
      } else {
        // For unavailable domains, just get current limit info without incrementing
        const { remaining, total } = await checkRateLimit(rateLimitKey, 'domain-check');
        
        // Add rate limit info to response
        result.rateLimitRemaining = remaining;
        result.rateLimitTotal = total;
      }
      
      // Return the result
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Error parsing domain check response:', parseError);
      return NextResponse.json(
        { 
          domain, 
          error: 'Error parsing domain check response',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error checking domain availability:', error);
    return NextResponse.json(
      { 
        domain, 
        error: 'Failed to check domain availability. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Provides a mock response for domain availability when the API is unavailable
 * This is useful for development and demo purposes
 * Currently not used as we're using real API calls in all environments
 */
/*
function useMockResponse(domain: string): DomainCheckResult {
  console.log(`Using mock response for domain: ${domain}`);
  
  // Simple algorithm to determine availability based on domain length
  // In a real app, this would be replaced with actual API calls
  const isAvailable = domain.length % 2 === 0;
  
  const mockResult: DomainCheckResult = {
    domain,
    available: isAvailable,
    isPremium: false,
    error: undefined
  };
  
  if (mockResult.isPremium && mockResult.available) {
    mockResult.price = 99.99;
  }
  
  return mockResult;
}
*/
