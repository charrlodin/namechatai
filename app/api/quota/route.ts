import { NextRequest, NextResponse } from 'next/server';
import { getQuotaRemaining } from '@/lib/redis-utils';
import { RATE_LIMITS } from '@/lib/constants';

/**
 * API endpoint to get the current quota information
 * Used by the QuotaContext to display accurate quota information
 */
export async function GET(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Get remaining quota for both types
    const generateRemaining = await getQuotaRemaining(ip, 'generate');
    const domainCheckRemaining = await getQuotaRemaining(ip, 'domain-check');
    
    // Return quota information
    return NextResponse.json({
      generate: {
        remaining: generateRemaining,
        total: RATE_LIMITS.GENERATIONS_PER_DAY,
      },
      'domain-check': {
        remaining: domainCheckRemaining,
        total: RATE_LIMITS.DOMAIN_CHECKS_PER_DAY,
      }
    });
  } catch (error) {
    console.error('Error fetching quota information:', error);
    
    // Return fallback values in case of error
    return NextResponse.json({
      generate: {
        remaining: RATE_LIMITS.GENERATIONS_PER_DAY,
        total: RATE_LIMITS.GENERATIONS_PER_DAY,
      },
      'domain-check': {
        remaining: RATE_LIMITS.DOMAIN_CHECKS_PER_DAY,
        total: RATE_LIMITS.DOMAIN_CHECKS_PER_DAY,
      }
    });
  }
}
