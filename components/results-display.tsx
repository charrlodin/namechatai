// Results display component for Name Check AI
'use client'

import { useState, useEffect } from 'react'
import { BusinessNameCard, DomainInfo, SocialHandle } from '@/components/business-name-card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { BusinessName } from '@/types'

// Use the imported BusinessName type from @/types

// Helper type to ensure social handle platforms match the expected types
type SocialPlatform = 'twitter' | 'instagram' | 'facebook';

type ResultsDisplayProps = {
  results: BusinessName[] | null
  isLoading?: boolean
  isStreaming?: boolean
}

export function ResultsDisplay({ results, isLoading = false, isStreaming = false }: ResultsDisplayProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9 // 3 columns x 3 rows
  
  // Helper function to transform API results to match BusinessNameCard props format
  const transformResults = (resultsToTransform: BusinessName[]) => {
    return resultsToTransform.map(result => {
      // Handle both new domains array and legacy domain string
      const domainsList = result.socialHandles.domains || 
        (result.socialHandles.domain ? [result.socialHandles.domain] : [`${result.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`]);
      
      return {
        name: result.name,
        available: true, // This would ideally come from an API check
        pronunciation: result.pronunciation || '', // Use pronunciation from API if available
        description: result.description,
        domains: domainsList.map(domain => ({ 
          name: domain, 
          available: true 
        })) as DomainInfo[],
        socialHandles: [
          { platform: 'twitter' as SocialPlatform, handle: `@${result.socialHandles.twitter}` },
          { platform: 'instagram' as SocialPlatform, handle: `@${result.socialHandles.instagram}` },
          { platform: 'facebook' as SocialPlatform, handle: `@${result.socialHandles.facebook || result.name.toLowerCase()}` } // Use facebook handle if available, otherwise fallback
        ] as SocialHandle[]
      };
    });
  };
  
  // If loading or streaming, show appropriate UI
  if (isLoading || isStreaming) {
    return (
      <div className="container mx-auto px-4 mt-12 mb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Generating Names</h2>
            <div className="flex items-center text-orange-500">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>{isStreaming && results && results.length > 0 ? `Generated ${results.length} names so far...` : 'Please wait...'}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite" aria-busy="true">
            {/* If streaming and we have results, show them along with skeletons */}
            {isStreaming && results && results.length > 0 ? (
              <>
                {/* Show streamed results */}
                {transformResults(results).map((result, index) => (
                  <BusinessNameCard
                    key={`${result.name}-${index}`}
                    name={result.name}
                    available={result.available}
                    pronunciation={result.pronunciation}
                    description={result.description}
                    domains={result.domains}
                    socialHandles={result.socialHandles}
                  />
                ))}
                
                {/* Show skeleton placeholders for remaining slots */}
                {Array(Math.max(0, 6 - results.length)).fill(0).map((_, index) => (
                  <div key={`skeleton-${index}`} className="border border-gray-800 rounded-lg bg-black/40 p-5 animate-pulse">
                    <div className="h-6 bg-gray-800 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-800 rounded mb-2 w-1/2"></div>
                    <div className="h-4 bg-gray-800 rounded mb-4 w-full"></div>
                    <div className="h-20 bg-gray-800 rounded mb-3"></div>
                    <div className="h-16 bg-gray-800 rounded"></div>
                  </div>
                ))}
              </>
            ) : (
              // Show standard loading skeletons if no streamed results yet
              Array(6).fill(0).map((_, index) => (
                <div key={index} className="border border-gray-800 rounded-lg bg-black/40 p-5 animate-pulse">
                  <div className="h-6 bg-gray-800 rounded mb-3 w-2/3"></div>
                  <div className="h-4 bg-gray-800 rounded mb-2 w-1/2"></div>
                  <div className="h-4 bg-gray-800 rounded mb-4 w-full"></div>
                  <div className="h-20 bg-gray-800 rounded mb-3"></div>
                  <div className="h-16 bg-gray-800 rounded"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }
  
  if (!results || results.length === 0) {
    return null
  }
  
  // Transform the API results if available
  const transformedResults = results ? transformResults(results) : [];

  // Calculate pagination
  const totalPages = Math.ceil(transformedResults.length / itemsPerPage)
  
  // Reset to page 1 when new results come in during streaming
  useEffect(() => {
    if (isStreaming || (results && results.length > 0)) {
      setCurrentPage(1);
    }
  }, [isStreaming, results]);
  
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = transformedResults.slice(indexOfFirstItem, indexOfLastItem)
  
  // Page navigation handlers
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const goToPage = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="container mx-auto px-4 mt-12 mb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Generated Names</h2>
          <div className="text-sm text-gray-400">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, transformedResults.length)} of {transformedResults.length} names
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
          {currentItems.map((result, index) => (
            <BusinessNameCard
              key={`${result.name}-${index}`}
              name={result.name}
              available={result.available}
              pronunciation={result.pronunciation}
              description={result.description}
              domains={result.domains}
              socialHandles={result.socialHandles}
            />
          ))}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-8 space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevPage} 
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="border-gray-800 bg-transparent hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className={currentPage === page ? 
                    "bg-orange-500 hover:bg-orange-600 text-white" : 
                    "border-gray-800 bg-transparent hover:bg-gray-800"}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="border-gray-800 bg-transparent hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
