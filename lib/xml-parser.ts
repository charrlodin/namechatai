/**
 * Simple XML parsing utility for Namecheap API responses
 */

/**
 * Simple XML parser interface
 */
interface SimpleXmlParser {
  text: string;
  match: (pattern: RegExp) => string[] | null;
  includes: (text: string) => boolean;
}

/**
 * Parse XML string to extract domain check results
 */
export async function parseXml(xmlText: string): Promise<SimpleXmlParser> {
  // For a real implementation, we would use a proper XML parser
  // This is a simple regex-based parser for demonstration
  return {
    text: xmlText,
    match: (pattern: RegExp): string[] | null => {
      return xmlText.match(pattern);
    },
    includes: (text: string): boolean => {
      return xmlText.includes(text);
    }
  };
}

/**
 * Parse Namecheap domain check response
 */
export async function parseDomainCheckResponse(xmlText: string, domain: string): Promise<{
  domain: string;
  available: boolean;
  isPremium: boolean;
  price?: number;
  currency?: string;
  error?: string;
  rawResponse?: string;
  rateLimitRemaining?: number;
  rateLimitTotal?: number;
}> {
  try {
    const xml = await parseXml(xmlText);
    
    // Check if there's an error in the response
    const errorMatch = xml.match(/ErrorNo="([0-9]+)"/);
    if (errorMatch && errorMatch[1] !== '0') {
      const errorCode = errorMatch[1];
      const errorMessage = `Error code ${errorCode} from domain provider`;
      return {
        domain,
        available: false,
        isPremium: false,
        error: errorMessage,
        rawResponse: xmlText
      };
    }
    
    // Check if the API response status is OK
    if (!xml.includes('Status="OK"')) {
      return {
        domain,
        available: false,
        isPremium: false,
        error: 'Domain provider API returned an error',
        rawResponse: xmlText
      };
    }
    
    // Extract domain check result using regex
    const domainCheckRegex = new RegExp(`DomainCheckResult\\s+Domain="${domain}"\\s+Available="(true|false)"`, 'i');
    const availabilityMatch = xml.match(domainCheckRegex);
    
    if (!availabilityMatch) {
      return {
        domain,
        available: false,
        isPremium: false,
        error: 'Could not determine domain availability',
        rawResponse: xmlText
      };
    }
    
    const available = availabilityMatch[1].toLowerCase() === 'true';
    
    // Check if domain is premium
    const isPremiumRegex = new RegExp(`DomainCheckResult\\s+Domain="${domain}"[^>]*IsPremiumName="(true|false)"`, 'i');
    const premiumMatch = xml.match(isPremiumRegex);
    const isPremium = premiumMatch ? premiumMatch[1].toLowerCase() === 'true' : false;
    
    // Extract price if available
    let price: number | undefined;
    let currency: string | undefined;
    
    if (isPremium) {
      const priceRegex = new RegExp(`DomainCheckResult\\s+Domain="${domain}"[^>]*PremiumRegistrationPrice="([\\d\\.]+)"`, 'i');
      const priceMatch = xml.match(priceRegex);
      
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        currency = 'USD'; // Namecheap uses USD by default
      }
    }
    
    return {
      domain,
      available,
      isPremium,
      price,
      currency,
      rawResponse: xmlText
    };
  } catch (error) {
    console.error('Error parsing domain check response:', error);
    return {
      domain,
      available: false,
      isPremium: false,
      error: 'Error parsing domain check response',
      rawResponse: xmlText
    };
  }
}
