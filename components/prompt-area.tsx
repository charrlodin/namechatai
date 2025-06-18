// Prompt area component for Name Check AI
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Wand2 } from 'lucide-react'
import { apiFetch } from '@/lib/api-helpers'

import { BusinessName } from '@/types'

type PromptAreaProps = {
  onGenerate?: (prompt: string, results?: BusinessName[], isStreaming?: boolean) => void
}

export function PromptArea({ onGenerate }: PromptAreaProps) {
  const [prompt, setPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null)

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return
    
    setIsEnhancing(true)
    try {
      const response = await apiFetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      }, 'generate')
      
      const data = await response.json()
      setPrompt(data.enhancedPrompt)
    } catch (error) {
      console.error('Error enhancing prompt:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  // Update the progress timer during generation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isGenerating && generationStartTime) {
      interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - generationStartTime) / 1000);
        
        // Estimate remaining time - GPT-4 typically takes ~45-60 seconds
        const totalEstimatedTime = 50;
        const remaining = Math.max(0, totalEstimatedTime - elapsedSeconds);
        
        setEstimatedTimeRemaining(remaining);
        
        // If we've reached 0, set a timeout to force completion if streaming doesn't finish
        if (remaining === 0 && !timeoutId) {
          timeoutId = setTimeout(() => {
            console.log('Forcing completion after timeout');
            setIsGenerating(false);
            setGenerationStartTime(null);
            setEstimatedTimeRemaining(null);
          }, 10000); // 10 second grace period after countdown reaches 0
        }
      }, 1000);
    } else {
      setEstimatedTimeRemaining(null);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isGenerating, generationStartTime]);

  const handleGenerateNames = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setGenerationStartTime(Date.now())
    setEstimatedTimeRemaining(50) // Initial estimate
    
    try {
      // Use streaming API if available
      const useStreaming = true; // Set to true to enable streaming
      
      if (useStreaming) {
        // Make streaming request
        const response = await apiFetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt,
            stream: true
          }),
        }, 'generate')
        
        // Process the SSE stream
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const streamedNames: BusinessName[] = []
        let streamComplete = false
        
        if (reader) {
          // Notify that streaming has started
          if (onGenerate) {
            onGenerate(prompt, [], true)
          }
          
          // Read the stream
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                console.log('Stream reader done')
                streamComplete = true
                break
              }
              
              const chunk = decoder.decode(value, { stream: true })
              console.log('Received chunk:', chunk.length, 'bytes')
              
              // Process the chunk line by line
              const lines = chunk.split('\n')
              let currentEvent = ''
              let currentData = ''
              
              // Process each line to properly handle SSE format
              for (const line of lines) {
                if (line.startsWith('event:')) {
                  currentEvent = line.slice(7).trim()
                } else if (line.startsWith('data:')) {
                  currentData = line.slice(5).trim()
                  
                  // Process complete event-data pairs
                  if (currentEvent === 'chunk' && currentData) {
                    try {
                      const jsonData = JSON.parse(currentData)
                      streamedNames.push(jsonData)
                      
                      // Update the UI immediately with each new name
                      if (onGenerate) {
                        console.log('Streaming new name:', jsonData.name)
                        onGenerate(prompt, [...streamedNames], true)
                      }
                    } catch (e) {
                      console.warn('Error parsing SSE chunk:', e)
                    }
                    
                    // Reset for next event-data pair
                    currentEvent = ''
                    currentData = ''
                  }
                } else if (line.startsWith('event: complete')) {
                  // Stream is complete
                  console.log('Received complete event')
                  streamComplete = true
                  break
                } else if (line.startsWith('event: error')) {
                  // Extract error message
                  const dataLine = lines.find(l => l.startsWith('data:'))
                  if (dataLine) {
                    try {
                      const errorData = JSON.parse(dataLine.slice(5))
                      throw new Error(errorData.error || 'Unknown streaming error')
                    } catch (e) {
                      throw new Error('Error in stream: ' + e)
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error reading stream:', error)
            streamComplete = true
          }
        
          // Final update with all names
          console.log('Stream processing complete, found', streamedNames.length, 'names')
          if (onGenerate) {
            onGenerate(prompt, streamedNames.length > 0 ? streamedNames : [], false)
          }
          
          // Ensure we mark generation as complete
          if (streamComplete) {
            setIsGenerating(false)
            setGenerationStartTime(null)
            setEstimatedTimeRemaining(null)
          }
        }
      } else {
        // Fallback to non-streaming API
        const response = await apiFetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt 
          }),
        }, 'generate')
        
        const data = await response.json()
        
        // Call the onGenerate prop with the results if provided
        if (onGenerate) {
          onGenerate(prompt, data.results, false)
        }
      }
    } catch (error) {
      console.error('Error generating names:', error)
    } finally {
      setIsGenerating(false)
      setGenerationStartTime(null)
      setEstimatedTimeRemaining(null)
    }
  }

  return (
    <div className="container mx-auto px-4 mt-8 mb-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="space-y-1">
          <label htmlFor="business-description" className="text-sm font-medium">Describe your business</label>
          <p className="text-xs text-gray-400">Enter a description of your business idea, product, or service</p>
        </div>
        
        <div className="relative">
          <Textarea
            id="business-description"
            placeholder="e.g., A sustainable coffee shop that specializes in organic beans and eco-friendly packaging"
            className="min-h-[120px] resize-none bg-black/10 border-gray-800/30 rounded-md focus-visible:ring-1 focus-visible:ring-accent/40 focus-visible:border-accent/40"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            aria-label="Business description"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center justify-end w-full">
          <Button 
            variant="outline" 
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="gap-2 border-gray-700 hover:bg-gray-800 text-sm font-normal h-9 rounded"
          >
            {isEnhancing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Enhance Description
              </>
            )}
          </Button>
          <Button 
            variant="accent"
            onClick={handleGenerateNames}
            disabled={isGenerating || !prompt.trim()}
            className="gap-2 text-sm font-normal h-9 rounded"
          >
            {isGenerating ? (
              <>
                <Wand2 className="h-4 w-4 animate-spin" />
                <div className="flex flex-col gap-1 items-start">
                  <span>
                    {estimatedTimeRemaining !== null ? (
                      <>Generating... {estimatedTimeRemaining}s remaining</>
                    ) : (
                      <>Generating your names...</>
                    )}
                  </span>
                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-1 transition-all duration-1000 ease-linear" 
                      style={{ 
                        width: estimatedTimeRemaining !== null 
                          ? `${Math.max(0, 100 - (estimatedTimeRemaining / 50 * 100))}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Names
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
