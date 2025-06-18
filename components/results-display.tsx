// Results display component for Name Check AI
'use client'

import { useState, useEffect } from 'react'
import { BusinessNameCard, DomainInfo } from '@/components/business-name-card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { BusinessName } from '@/types'
import { RateLimitIndicator } from '@/components/rate-limit-indicator'
// Toast import removed - not used in this component

// Use the imported BusinessName type from @/types

// Helper type to ensure social handle platforms match the expected types
type SocialPlatform = 'twitter' | 'instagram' | 'facebook';

type ResultsDisplayProps = {
  results: BusinessName[] | null
  isLoading?: boolean
  isStreaming?: boolean
  onLoadMore?: (existingNames: string[]) => void
  domainCheckRateLimit?: { remaining?: number; total?: number }
  // setDomainCheckRateLimit removed as it's not used in this component
}

export function ResultsDisplay({ 
  results, 
  isLoading = false, 
  isStreaming = false, 
  onLoadMore,
  domainCheckRateLimit
}: ResultsDisplayProps) {
  // No toast used in this component
  // Display state - how many items to show
  const [displayCount, setDisplayCount] = useState(9) // Initially show 9 items
  const itemsPerBatch = 9 // How many more items to load each time
  
  // Reset display count when new results come in during streaming
  useEffect(() => {
    if (isStreaming || (results && results.length > 0)) {
      setDisplayCount(9);
    }
  }, [isStreaming, results]);
  
  // Load more results
  const loadMore = () => {
    // If we're showing all available results and there's an onLoadMore handler, request more names
    if (displayCount >= (results?.length || 0) && onLoadMore && results) {
      // Get existing names to avoid duplicates
      const existingNames = results.map(result => result.name);
      onLoadMore(existingNames);
    } else {
      // Otherwise just show more of the existing results
      setDisplayCount(prev => prev + itemsPerBatch);
    }
  }
  
  // Helper function to transform API results to match BusinessNameCard props format
  const transformResults = (resultsToTransform: BusinessName[]) => {
    return resultsToTransform.map(result => {
      // Check for domains at both top level and inside socialHandles
      let domainsList: (string | DomainInfo)[] = [];
      
      // Handle all possible domain sources and formats
      if (result.domains) {
        // Top level domains array (streaming API format)
        domainsList = result.domains;
      } else if (result.socialHandles?.domains) {
        // Inside socialHandles (parseBusinessNames format)
        domainsList = result.socialHandles.domains;
      } else if (result.socialHandles?.domain) {
        // Legacy single domain string
        domainsList = [result.socialHandles.domain];
      } else {
        // Fallback to name-based domain
        domainsList = [`${result.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`];
      }
      
      return {
        name: result.name,
        available: true, // This would ideally come from an API check
        pronunciation: result.pronunciation || '', // Use pronunciation from API if available
        description: result.description,
        domains: domainsList.map(domain => {
          // Handle both string domains and domain objects
          if (typeof domain === 'string') {
            return { 
              name: domain, 
              available: true 
            };
          } else if (typeof domain === 'object' && domain !== null) {
            // Ensure domain object has a name property
            return {
              name: domain.name || '',
              available: domain.available !== undefined ? domain.available : true
            };
          } else {
            // Fallback for unexpected types
            return { 
              name: String(domain), 
              available: true 
            };
          }
        }) as DomainInfo[],
        socialHandles: [
          { 
            platform: 'twitter' as SocialPlatform, 
            handle: result.socialHandles.twitter.startsWith('@') 
              ? result.socialHandles.twitter 
              : `@${result.socialHandles.twitter}` 
          },
          { 
            platform: 'instagram' as SocialPlatform, 
            handle: result.socialHandles.instagram.startsWith('@') 
              ? result.socialHandles.instagram 
              : `@${result.socialHandles.instagram}` 
          },
          { 
            platform: 'facebook' as SocialPlatform, 
            handle: result.socialHandles.facebook 
              ? (result.socialHandles.facebook.startsWith('@') 
                ? result.socialHandles.facebook 
                : `@${result.socialHandles.facebook}`) 
              : `@${result.name.toLowerCase()}` 
          }
        ]
      };
    });
  };
  
  // Generate placeholder names for better UX during loading
  const generatePlaceholderNames = () => {
    const placeholders = [
      'Generating creative names...',
      'Brainstorming ideas...',
      'Crafting unique brands...',
      'Finding the perfect name...',
      'Creating memorable options...',
      'Exploring possibilities...',
      'Designing your brand...',
      'Analyzing your industry...',
      'Checking availability...'
    ];
    
    return Array.from({ length: 9 }, (_, i) => ({
      name: placeholders[i % placeholders.length],
      available: false,
      pronunciation: '',
      description: 'Our AI is working on your request...',
      domains: [{ name: 'example.com', available: false }],
      socialHandles: [
        { platform: 'twitter' as SocialPlatform, handle: '@loading' },
        { platform: 'instagram' as SocialPlatform, handle: '@loading' },
        { platform: 'facebook' as SocialPlatform, handle: '@loading' }
      ]
    }));
  };
  
  // Render loading state with skeleton cards
  const renderLoadingSkeletons = () => {
    return generatePlaceholderNames().map((placeholder, index) => (
      <div key={index} className="border border-gray-800 rounded-lg bg-black/40 p-5 animate-pulse">
        <div className="flex justify-between items-start mb-2">
          <div className="h-6 bg-gray-800 rounded w-1/2"></div>
        </div>
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-1"></div>
        <div className="h-4 bg-gray-800 rounded w-full mb-4"></div>
        <div className="space-y-2 mt-4">
          <div className="h-4 bg-gray-800 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        </div>
      </div>
    ));
  };
  
  // Render the full loading state
  const renderLoadingState = () => {
    return (
      <div className="container mx-auto px-4 mt-12 mb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Generating Names</h2>
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-400">Please wait...</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
            {renderLoadingSkeletons()}
          </div>
        </div>
      </div>
    );
  };


  
  // Render the appropriate UI based on state
  if (isLoading || isStreaming) {
    return renderLoadingState();
  }
  
  // Early return if no results
  if (!results || results.length === 0) {
    return null;
  }
  
  // Transform the API results
  const transformedResults = transformResults(results);
  
  // Get the items to display based on the current display count
  const displayedItems = transformedResults.slice(0, displayCount);
  
  // Show rate limit indicator if we have domain check rate limit info
  const showRateLimitIndicator = domainCheckRateLimit?.remaining !== undefined && 
                                domainCheckRateLimit?.total !== undefined;

  return (
    <div className="container mx-auto px-4 mt-12 mb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Generated Business Names</h2>
          {isStreaming && (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-400">Generating...</span>
            </div>
          )}
        </div>
        
        {/* Show rate limit indicator for domain checks */}
        {showRateLimitIndicator && domainCheckRateLimit && (
          <div className="mb-6">
            <RateLimitIndicator
              remaining={domainCheckRateLimit.remaining || 0}
              total={domainCheckRateLimit.total || 0}
              type="domain-check"
              className="max-w-xs"
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
          {displayedItems.map((result, index) => (
            <BusinessNameCard
              key={`${result.name}-${index}`}
              name={result.name}
              available={result.available}
              pronunciation={result.pronunciation}
              description={result.description}
              domains={result.domains}
              socialHandles={result.socialHandles}
              onCheckDomain={(domainName, idx) => console.log(`Checking domain ${domainName} at index ${idx}`)}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-center mt-8">
          <Button 
            variant="accent" 
            size="sm" 
            onClick={loadMore} 
            className="px-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
