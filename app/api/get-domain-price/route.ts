import { NextRequest, NextResponse } from 'next/server';

// Types for domain pricing response
interface DomainPriceResult {
  domain: string;
  tld: string;
  price: number;
  currency: string;
  error?: string;
}

// Error codes from Namecheap API
const ERROR_CODES: Record<string, string> = {
  '3031510': 'Error response from domain provider',
  '3011511': 'Unknown response from the provider',
  '3011500': 'Unknown error from domain provider',
  '3031500': 'Domain not found',
};

export async function POST(req: NextRequest) {
  try {
    const { domain, userLocation } = await req.json();
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }
    
    // Extract TLD from domain (e.g., .com, .io, .net)
    const tldMatch = domain.match(/\.([a-z0-9]+)$/i);
    if (!tldMatch) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }
    
    const tld = tldMatch[1];
    
    // Get Namecheap API key from environment variables
    const apiKey = process.env.NAMECHEAP_API_KEY;
    const username = process.env.NAMECHEAP_USERNAME;
    const clientIp = process.env.NAMECHEAP_CLIENT_IP;
    
    // Validate required environment variables
    if (!apiKey || !username || !clientIp) {
      console.error('Missing Namecheap API environment variables');
      
      return NextResponse.json(
        { 
          domain, 
          error: 'Missing Namecheap API configuration. Please set NAMECHEAP_API_KEY, NAMECHEAP_USERNAME, and NAMECHEAP_CLIENT_IP in your .env.local file.',
        },
        { status: 500 }
      );
    }
    
    // Build Namecheap API URL with all required parameters for pricing
    const url = new URL('https://api.namecheap.com/xml.response');
    url.searchParams.append('ApiUser', username);
    url.searchParams.append('ApiKey', apiKey);
    url.searchParams.append('UserName', username);
    url.searchParams.append('ClientIp', clientIp);
    url.searchParams.append('Command', 'namecheap.users.getPricing');
    url.searchParams.append('ProductType', 'DOMAIN');
    url.searchParams.append('ProductCategory', 'REGISTER');
    url.searchParams.append('ActionName', 'REGISTER');
    url.searchParams.append('ProductName', tld);
    
    // Add user location if available (for future use)
    if (userLocation) {
      url.searchParams.append('UserLocation', userLocation);
    }
    
    console.log(`Getting pricing for TLD: .${tld}`);
    console.log(`API URL: ${url.toString().replace(apiKey, '[REDACTED]')}`);
    
    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url.toString(), { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Namecheap API returned status ${response.status}`);
        return NextResponse.json(
          { 
            domain, 
            error: `Domain provider returned error status: ${response.status}`,
            details: 'Check if your IP address is whitelisted in the Namecheap API settings.'
          },
          { status: 400 }
        );
      }
      
      const xmlText = await response.text();
      console.log('Namecheap API response:', xmlText);
      
      // Check if the response contains an error
      if (xmlText.includes('Status="ERROR"')) {
        const errorMatch = xmlText.match(/Number="([0-9]+)">([^<]+)</);
        const errorCode = errorMatch ? errorMatch[1] : 'unknown';
        const errorMessage = errorMatch ? errorMatch[2] : 'Unknown error from domain provider';
        
        console.error(`Namecheap API error ${errorCode}: ${errorMessage}`);
        
        return NextResponse.json(
          { 
            domain, 
            error: errorMessage,
            errorCode
          },
          { status: 400 }
        );
      }
      
      // Extract pricing information from attributes
      // Look for Price attributes in the XML response
      const priceRegex = /<Price[^>]*YourPrice="([0-9.]+)"[^>]*Currency="([A-Z]+)"[^>]*>/i;
      const priceMatch = xmlText.match(priceRegex);
      
      // Fallback to regular Price attribute if YourPrice is not found
      const fallbackPriceRegex = /<Price[^>]*Price="([0-9.]+)"[^>]*Currency="([A-Z]+)"[^>]*>/i;
      const fallbackMatch = !priceMatch ? xmlText.match(fallbackPriceRegex) : null;
      
      if (!priceMatch && !fallbackMatch) {
        console.error('Could not find pricing information in response');
        return NextResponse.json(
          { 
            domain, 
            error: 'Could not determine domain pricing from provider response',
            details: 'The API response format may have changed or the TLD may not be supported.'
          },
          { status: 400 }
        );
      }
      
      const matchToUse = priceMatch || fallbackMatch;
      const price = parseFloat(matchToUse![1]);
      const currency = matchToUse![2];
      
      const result: DomainPriceResult = {
        domain,
        tld,
        price,
        currency
      };
      
      console.log(`Domain price result: ${JSON.stringify(result)}`);
      return NextResponse.json(result);
      
    } catch (error) {
      console.error('Error fetching domain price:', error);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          { 
            domain, 
            error: 'Domain price request timed out',
            details: 'The domain provider API took too long to respond.'
          },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { 
          domain, 
          error: `Error fetching domain price: ${error instanceof Error ? error.message : String(error)}`
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
