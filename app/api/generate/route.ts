// API route for generating business names and social handles
import { NextResponse } from "next/server";
import { generateBusinessNames } from "@/lib/openai";
import {
  generateBusinessNamesWithOpenAIStream,
} from "@/lib/openai-stream";
import { BusinessName } from "@/types";
import { checkRateLimit, incrementRateLimit, RATE_LIMITS } from "@/lib/redis";

// Add support for streaming responses
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              '127.0.0.1';
    
    // Check rate limit before processing
    const rateLimit = await checkRateLimit(ip, 'generate');
    
    if (rateLimit.isLimited) {
      return NextResponse.json(
        { 
          error: `Daily generation limit reached (${RATE_LIMITS.GENERATIONS_PER_DAY}/day). Please try again tomorrow.`,
          rateLimitRemaining: 0,
          rateLimitTotal: RATE_LIMITS.GENERATIONS_PER_DAY,
          quotaExceeded: true
        },
        { status: 429 }
      );
    }
    
    // Parse request body
    const { prompt, stream = false, existingNames = [] } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Generate names for faster response
    const count = 18;
    
    // Log if we're handling a "Load More" request
    if (existingNames.length > 0) {
      console.log(`Load More request with ${existingNames.length} existing names`);
    }

    // Always use gpt-4o-mini for best results
    const model = "gpt-4o-mini";
    console.log(`Using model: ${model} with${stream ? "" : "out"} streaming`);

    // If streaming is requested, use SSE
    if (stream) {
      // Increment rate limit counter for streaming requests
      await incrementRateLimit(ip, 'generate');
      const newRateLimit = await checkRateLimit(ip, 'generate');
      
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          // Send initial message
          controller.enqueue(
            encoder.encode('event: start\ndata: {"status":"started"}\n\n')
          );

          try {
            // Send rate limit info
            controller.enqueue(
              encoder.encode(
                `event: ratelimit\ndata: ${JSON.stringify({
                  remaining: newRateLimit.remaining,
                  total: newRateLimit.total
                })}\n\n`
              )
            );
            
            // Use streaming API with proper await
            await generateBusinessNamesWithOpenAIStream(
              prompt,
              count,
              model,
              (chunk: BusinessName) => {
                // Send each name as it's generated
                controller.enqueue(
                  encoder.encode(
                    `event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`
                  )
                );
              },
              existingNames // Pass existing names to avoid duplicates
            );
            
            // Send completion message
            controller.enqueue(
              encoder.encode(
                'event: complete\ndata: {"status":"complete"}\n\n'
              )
            );
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            // Don't close the controller here, as we've already sent some names
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: {"error":"${error instanceof Error ? error.message : 'Unknown error'}"}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      // Return the stream response
      return new Response(streamResponse, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // For non-streaming response, use regular API call
      console.time("openai_api_call");
      const startTime = Date.now();
      
      // Increment rate limit counter
      await incrementRateLimit(ip, 'generate');
      const newRateLimit = await checkRateLimit(ip, 'generate');

      try {
        // Generate business names using OpenAI
        const generatedNames = await generateBusinessNames(prompt, count, model);
        
        // Filter out any names that already exist in the existingNames array
        let filteredNames = generatedNames;
        if (existingNames.length > 0) {
          filteredNames = generatedNames.filter(name => 
            !existingNames.includes(name.name)
          );
          
          console.log(`Filtered out ${generatedNames.length - filteredNames.length} duplicate names`);
          
          // If we filtered out too many names and have fewer than requested,
          // we could make another API call to get more unique names
          if (filteredNames.length < count / 2) {
            console.log(`Too many duplicates, generating additional names...`);
            const additionalNames = await generateBusinessNames(prompt, count, model);
            
            // Filter these additional names too
            const additionalFiltered = additionalNames.filter(name => 
              !existingNames.includes(name.name) && 
              !filteredNames.some(existing => existing.name === name.name)
            );
            
            // Add the additional filtered names to our results
            filteredNames = [...filteredNames, ...additionalFiltered];
            console.log(`Added ${additionalFiltered.length} additional unique names`);
          }
        }

        // Log timing information
        const apiDuration = Date.now() - startTime;
        console.timeEnd("openai_api_call");
        console.log(`OpenAI API call took ${apiDuration}ms`);

        // Return the filtered names
        return NextResponse.json({
          names: filteredNames,
          timing: {
            total: Date.now() - startTime,
            openai: apiDuration,
            parsing: 0,
          },
          rateLimitRemaining: newRateLimit.remaining,
          rateLimitTotal: newRateLimit.total
        });
      } catch (error) {
        console.error("Error generating business names:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          { error: `Failed to generate business names: ${errorMessage}` },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error processing request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
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
