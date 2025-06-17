import { NextRequest, NextResponse } from 'next/server';

// Types for domain check response
interface DomainCheckResult {
  domain: string;
  available: boolean;
  isPremium: boolean;
  price?: number;
  currency?: string;
  error?: string;
  rawResponse?: string; // For debugging
}

// Error codes from Namecheap API
const ERROR_CODES: Record<string, string> = {
  '3031510': 'Error response from domain provider',
  '3011511': 'Unknown response from the provider',
  '2011169': 'Only 50 domains are allowed in a single check command'
};

/**
 * Check domain availability using Namecheap API
 */
export async function POST(req: NextRequest) {
  let domain = '';
  
  try {
    const body = await req.json();
    domain = body.domain;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      );
    }
    
    // Get Namecheap API key from environment variables
    const apiKey = process.env.NAMECHEAP_API_KEY;
    // For Namecheap, your account username is your API username
    const username = process.env.NAMECHEAP_USERNAME;
    // The IP address that's whitelisted in your Namecheap account
    const clientIp = process.env.NAMECHEAP_CLIENT_IP;
    
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
      
      // Get XML response
      const xmlText = await response.text();
      console.log('Raw XML response:', xmlText);
      
      // Check if the API response status is OK
      if (!response.ok || !xmlText.includes('Status="OK"')) {
        console.error(`Namecheap API returned non-OK status: ${response.status}`);
        console.error('Response body:', xmlText);
        
        return NextResponse.json(
          { 
            domain, 
            error: 'Domain provider API returned an error. Your IP address may not be whitelisted.',
            details: `Status code: ${response.status}. Make sure to whitelist your IP address in the Namecheap API settings.`
          },
          { status: 400 }
        );
      }
      
      // Check if there's an error in the response
      const errorMatch = xmlText.match(/ErrorNo="([0-9]+)"/); 
      if (errorMatch && errorMatch[1] !== '0') {
        const errorCode = errorMatch[1];
        const errorMessage = ERROR_CODES[errorCode] || 'Unknown error from domain provider';
        console.error(`Namecheap API error ${errorCode}: ${errorMessage}`);
        
        return NextResponse.json(
          { 
            domain, 
            error: errorMessage,
            errorCode,
            details: 'Check if your IP address is whitelisted in the Namecheap API settings.'
          },
          { status: 400 }
        );
      }
      
      // Extract domain check result using more precise regex
      const domainCheckRegex = new RegExp(`DomainCheckResult\\s+Domain="${domain}"\\s+Available="(true|false)"`, 'i');
      const availabilityMatch = xmlText.match(domainCheckRegex);
      
      if (!availabilityMatch) {
        console.error('Could not find domain availability in response');
        return NextResponse.json(
          { 
            domain, 
            error: 'Could not determine domain availability from provider response',
            details: 'The API response format may have changed or the domain may not be supported.'
          },
          { status: 400 }
        );
      }
      
      const available = availabilityMatch[1].toLowerCase() === 'true';
      
      // Check if it's a premium domain
      const premiumRegex = new RegExp(`DomainCheckResult\\s+Domain="${domain}".*?IsPremiumName="(true|false)"`, 'i');
      const premiumMatch = xmlText.match(premiumRegex);
      const isPremium = premiumMatch ? premiumMatch[1].toLowerCase() === 'true' : false;
      
      // Extract pricing information if available
      const priceRegex = new RegExp(`DomainCheckResult\\s+Domain="${domain}".*?PremiumRegistrationPrice="([0-9.]+)"`, 'i');
      const priceMatch = xmlText.match(priceRegex);
      
      const result: DomainCheckResult = {
        domain,
        available,
        isPremium
      };
      
      // Add pricing if available
      if (priceMatch && priceMatch[1]) {
        const price = parseFloat(priceMatch[1]);
        if (!isNaN(price) && price > 0) {
          result.price = price;
          result.currency = 'USD'; // Namecheap API returns prices in USD
        }
      }
      
      console.log('Domain check result:', result);
      return NextResponse.json(result);
    } catch (apiError) {
      console.error('Error calling Namecheap API:', apiError);
      return NextResponse.json(
        { 
          domain, 
          error: 'Error connecting to domain provider API',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
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
 */
function useMockResponse(domain: string): DomainCheckResult {
  console.log(`Using mock response for domain: ${domain}`);
  
  // Simple algorithm to determine availability based on domain length
  // In a real app, this would be replaced with actual API calls
  const isAvailable = domain.length % 2 === 0;
  
  const mockResult: DomainCheckResult = {
    domain,
    available: isAvailable,
    isPremium: domain.length < 6, // Short domains are premium
  };
  
  if (mockResult.isPremium && mockResult.available) {
    mockResult.price = 99.99;
  }
  
  return mockResult;
}
