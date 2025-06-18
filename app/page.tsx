'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { PromptArea } from '@/components/prompt-area'
import { ResultsDisplay } from '@/components/results-display'
import { ExamplesSection } from '@/components/examples-section'
import { PricingTable } from '@/components/pricing-table'
import { Footer } from '@/components/footer'
import { RateLimitIndicator } from '@/components/rate-limit-indicator'
import { BusinessName } from '@/types'
import { toast } from '@/components/sonner-provider'
import { showQuotaExceededToast } from '@/lib/quota-toast'
import { apiFetch } from '@/lib/api-helpers'

export default function Home() {
  const [results, setResults] = useState<BusinessName[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  // Store the current prompt for Load More functionality
  const [currentPrompt, setCurrentPrompt] = useState<string>('')
  
  // Track rate limit information
  const [generateRateLimit, setGenerateRateLimit] = useState<{ remaining?: number; total?: number }>({})
  // Domain check rate limit state (read-only for now)
  const [domainCheckRateLimit] = useState<{ remaining?: number; total?: number }>({})
  
  // Handle loading more names
  const handleLoadMore = async (existingNames: string[]) => {
    if (!currentPrompt) return;
    
    // Show loading state
    setIsLoading(true);
    
    try {
      const response = await apiFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: currentPrompt,
          existingNames: existingNames, // Pass existing names to avoid duplicates
        })
      }, 'generate');
      
      // apiFetch already handles 429 responses and shows appropriate toasts
      
      const data = await response.json();
      
      // Check for rate limit information
      if (data.rateLimitRemaining !== undefined && data.rateLimitTotal !== undefined) {
        setGenerateRateLimit({
          remaining: data.rateLimitRemaining,
          total: data.rateLimitTotal
        });
      }
      
      // Merge new results with existing ones
      if (results) {
        setResults([...results, ...data.results || data.names]);
      } else {
        setResults(data.results || data.names);
      }
    } catch (error) {
      console.error('Error loading more names:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle the generation process from the PromptArea component
  const handleGenerateNames = async (prompt: string, generatedResults?: BusinessName[], streaming?: boolean) => {
    // Store the prompt for potential Load More requests later
    setCurrentPrompt(prompt)
    // If this is a streaming update
    if (streaming !== undefined) {
      setIsStreaming(streaming)
    }
    
    // Start loading state if not already loading or if this is not a streaming update
    if (!isLoading && streaming === undefined) {
      setIsLoading(true)
      setResults(null) // Reset results when starting a new generation
    }
    
    try {
      // If results were passed directly, use them
      if (generatedResults && generatedResults.length > 0) {
        setResults(generatedResults)
        
        // If streaming has completed, end loading state
        if (streaming === false) {
          setIsLoading(false)
          setIsStreaming(false)
        }
        return
      }
      
      // Otherwise, fetch from API (non-streaming fallback)
      if (!streaming) {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        })
        
        if (!response.ok) {
          // Check for rate limit exceeded
          if (response.status === 429) {
            const errorData = await response.json();
            
            // Show quota exceeded toast with CTA for sign-up
            if (errorData.quotaExceeded) {
              showQuotaExceededToast('generate');
            } else {
              // Fallback to generic error toast if not quota-related
              toast.error("Rate Limit Exceeded: " + (errorData.error || "You've reached your daily limit. Please try again tomorrow."));
            }
            
            setIsLoading(false);
            return;
          }
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Check for rate limit information
        if (data.rateLimitRemaining !== undefined && data.rateLimitTotal !== undefined) {
          setGenerateRateLimit({
            remaining: data.rateLimitRemaining,
            total: data.rateLimitTotal
          });
        }
        
        setResults(data.names || data.results)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error generating names:', error)
      // Could add error state handling here
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  // Event handler for streaming events - commented out as we're using a different approach
  // Keeping the implementation for reference in case we need to revert to EventSource
  /*
  const handleStreamEvent = (event: MessageEvent) => {
    try {
      const eventType = event.type
      const data = JSON.parse(event.data)
      
      switch (eventType) {
        case 'chunk':
          // Add the new name to the results
          setResults((prevResults) => {
            // If we have previous results, append the new one
            if (prevResults) {
              return [...prevResults, data]
            }
            // Otherwise, start a new array
            return [data]
          })
          break
          
        case 'complete':
          // Streaming is complete
          setIsStreaming(false)
          setIsLoading(false)
          break
          
        case 'error':
          console.error('Streaming error:', data.error)
          setIsStreaming(false)
          setIsLoading(false)
          
          // Check if it's a rate limit error
          if (data.error && data.error.includes('limit')) {
            toast.error("Rate Limit Exceeded: " + data.error);
          }
          break
          
        case 'ratelimit':
          // Update rate limit information
          if (data.remaining !== undefined && data.total !== undefined) {
            setGenerateRateLimit({
              remaining: data.remaining,
              total: data.total
            });
          }
          break
          
        default:
          // Ignore other event types
          break
      }
    } catch (error) {
      console.error('Error handling stream event:', error)
    }
  }
  */

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="py-12">
          <Hero />
          <div className="mt-8">
            <PromptArea onGenerate={handleGenerateNames} />
            {isLoading ? (
              <ResultsDisplay 
                results={isStreaming ? results : null} 
                isLoading={true} 
                isStreaming={isStreaming}
                onLoadMore={handleLoadMore}
                domainCheckRateLimit={domainCheckRateLimit}
              />
            ) : results ? (
              <ResultsDisplay 
                results={results} 
                isLoading={false} 
                isStreaming={false}
                onLoadMore={handleLoadMore}
                domainCheckRateLimit={domainCheckRateLimit}
              />
            ) : (
              <ExamplesSection />
            )}
          </div>
        </div>
        <PricingTable />
        <div className="container mx-auto px-4 mb-2">
          {generateRateLimit.remaining !== undefined && (
            <RateLimitIndicator 
              type="generate" 
              remaining={generateRateLimit.remaining || 0} 
              total={generateRateLimit.total || 0} 
              className="justify-end"
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
