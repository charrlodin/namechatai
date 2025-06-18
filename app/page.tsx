'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { PromptArea } from '@/components/prompt-area'
import { ResultsDisplay } from '@/components/results-display'
import { ExamplesSection } from '@/components/examples-section'
import { PricingTable } from '@/components/pricing-table'
import { Footer } from '@/components/footer'
import { BusinessName } from '@/types'

export default function Home() {
  const [results, setResults] = useState<BusinessName[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  // Store the current prompt for Load More functionality
  const [currentPrompt, setCurrentPrompt] = useState<string>('')
  
  // Handle loading more names
  const handleLoadMore = async (existingNames: string[]) => {
    if (!currentPrompt) return;
    
    // Show loading state
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: currentPrompt,
          existingNames: existingNames, // Pass existing names to avoid duplicates
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Merge new results with existing ones
      if (results) {
        setResults([...results, ...data.results]);
      } else {
        setResults(data.results);
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
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        setResults(data.results)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error generating names:', error)
      // Could add error state handling here
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

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
              />
            ) : results ? (
              <ResultsDisplay 
                results={results} 
                isLoading={false} 
                isStreaming={false}
                onLoadMore={handleLoadMore}
              />
            ) : (
              <ExamplesSection />
            )}
          </div>
        </div>
        <PricingTable />
      </main>
      <Footer />
    </div>
  )
}
