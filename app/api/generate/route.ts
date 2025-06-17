// API route for generating business names and social handles
import { NextResponse } from 'next/server';
import { generateBusinessNames } from '@/lib/openai';
import { generateBusinessNamesWithOpenAIStream, parseBusinessNames, BRAND_NAME_SYSTEM_PROMPT } from '@/lib/openai-stream';
import { BusinessName } from '@/types';

// Add support for streaming responses
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Parse request body
    const { prompt, useFastModel, stream = false } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    // Default to 40 names
    const count = 40;
    
    // Choose model based on useFastModel flag
    const model = useFastModel ? 'gpt-3.5-turbo' : 'gpt-4o-mini';
    console.log(`Using model: ${model} with${stream ? '' : 'out'} streaming`);
    
    // If streaming is requested, use SSE
    if (stream) {
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          // Send initial message
          controller.enqueue(encoder.encode('event: start\ndata: {"status":"started"}\n\n'));
          
          try {
            // Use streaming API
            await generateBusinessNamesWithOpenAIStream(
              prompt, 
              count, 
              model,
              (chunk: BusinessName) => {
                // Send each name as it's generated
                controller.enqueue(
                  encoder.encode(`event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`)
                );
              }
            );
            
            // Send completion message
            controller.enqueue(
              encoder.encode('event: complete\ndata: {"status":"complete"}\n\n')
            );
          } catch (error: any) {
            console.error('Streaming error:', error);
            // Send error message
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ 
                error: error.message || 'Unknown error' 
              })}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });
      
      // Return the stream response
      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Non-streaming approach (original implementation)
    console.time('total_generation_time');
    let businessNames = await generateBusinessNames(prompt, count, model);
    
    // If we didn't get enough names, make additional calls to reach 40
    if (businessNames.length < count) {
      console.log(`Only got ${businessNames.length} names, making additional calls to reach ${count}`);
      
      // Make additional calls until we reach the desired count
      while (businessNames.length < count) {
        const additionalPrompt = `I need ${count - businessNames.length} MORE unique business names for: ${prompt}. Please generate ONLY the additional names needed.`;
        
        const additionalNames = await generateBusinessNames(additionalPrompt, count - businessNames.length, model);
        
        // Add the additional names to our list
        businessNames = [...businessNames, ...additionalNames];
        
        // Avoid infinite loops if we're not getting new names
        if (additionalNames.length === 0) break;
      }
    }
    
    // Limit to the requested count
    businessNames = businessNames.slice(0, count);
    console.timeEnd('total_generation_time');
    
    return NextResponse.json({ results: businessNames });
  } catch (error: any) {
    console.error('Error generating business names:', error);
    return NextResponse.json(
      { error: `Failed to generate business names: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Function moved to lib/openai.ts and lib/openai-stream.ts

// System prompt moved to lib/openai-stream.ts

// Helper function moved to lib/openai.ts
// Mock generator code removed

// Duplicate extractKeywords function removed

// Helper function moved to lib/openai.ts
