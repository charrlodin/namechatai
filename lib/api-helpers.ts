// API helper functions for consistent error handling
import { toast } from '@/components/sonner-provider'
import { showQuotaExceededToast } from '@/lib/quota-toast'

// We need to use global variables since we can't use React hooks in a non-React context
// These will be set by components that use the QuotaContext
let resetQuotaFn: ((type: 'generate' | 'domain-check') => void) | null = null;
let updateQuotaFn: ((type: 'generate' | 'domain-check', remaining: number, total: number) => void) | null = null;

/**
 * Register the resetQuota function from QuotaContext
 * This should be called in a component that has access to the QuotaContext
 */
export function registerQuotaReset(resetFn: (type: 'generate' | 'domain-check') => void) {
  resetQuotaFn = resetFn;
}

/**
 * Register the updateQuota function from QuotaContext
 * This should be called in a component that has access to the QuotaContext
 */
export function registerQuotaUpdate(updateFn: (type: 'generate' | 'domain-check', remaining: number, total: number) => void) {
  updateQuotaFn = updateFn;
}

/**
 * Enhanced fetch wrapper that handles common API errors including rate limits
 * @param url API endpoint URL
 * @param options Fetch options
 * @param quotaType Type of quota for toast messaging ('generate' or 'domain-check')
 * @returns Response object if successful
 * @throws Error with message if request fails
 */
export async function apiFetch(
  url: string, 
  options: RequestInit = {}, 
  quotaType: 'generate' | 'domain-check' = 'generate'
): Promise<Response> {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    // Handle rate limit exceeded (429)
    if (response.status === 429) {
      try {
        const errorData = await response.json()
        
        // Show quota exceeded toast with CTA for sign-up
        if (errorData.quotaExceeded) {
          showQuotaExceededToast(quotaType)
          
          // Reset quota in context if function is registered
          if (resetQuotaFn) {
            resetQuotaFn(quotaType)
          }
        } else {
          // Fallback to generic error toast
          toast.error("Rate Limit Exceeded: " + (errorData.error || "You've reached your daily limit. Please try again tomorrow."))
        }
      } catch (e) {
        // If we can't parse the JSON, show a generic message
        toast.error(`Rate limit exceeded. Please try again later.`)
      }
      
      throw new Error('Rate limit exceeded')
    }
    
    // Handle other error types
    throw new Error(`API error: ${response.status}`)
  }
  
  return response
}

/**
 * Parse JSON from response with error handling
 * @param response Fetch Response object
 * @param quotaType Type of quota for toast messaging ('generate' or 'domain-check')
 * @returns Parsed JSON data
 */
export async function parseJsonResponse<T>(
  response: Response, 
  quotaType: 'generate' | 'domain-check'
): Promise<T> {
  try {
    if (response.ok) {
      const data = await response.json();
      
      // Check if the response includes quota information
      if (data && data.quota && updateQuotaFn) {
        const { quota } = data;
        
        // Update quota in context if the response includes quota information
        if (quota[quotaType] && typeof quota[quotaType].remaining === 'number' && typeof quota[quotaType].total === 'number') {
          updateQuotaFn(quotaType, quota[quotaType].remaining, quota[quotaType].total);
        }
      }
      
      return data;
    } else {
      // For non-OK responses, parse and throw the error
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
  } catch (e) {
    console.error('Error parsing JSON response:', e)
    throw new Error('Invalid response format')
  }
}
