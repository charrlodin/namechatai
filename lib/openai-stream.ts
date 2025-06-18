import { BusinessName } from "@/types";

// System prompt for the brand name generator
export const BRAND_NAME_SYSTEM_PROMPT = `You are a highly creative brand name generator.
Your job is to generate a list of exactly 18 unique, memorable, and brandable business names based on the user's idea.

👉 IMPORTANT: Each name MUST include ALL of these elements:
• The business name no longer than 15 characters
• How it's pronounced (phonetic spelling)
• Why it's a good fit (brief explanation)

✅ REQUIRED OUTPUT FORMAT (follow this EXACTLY):

Name: [Business Name]
Pronounced: [Phonetic Pronunciation]
Why: [Brief explanation of why this name works]

For example:
Name: Vyntra
Pronounced: VIN-tra
Why: Inspired by "vintage" and "mantra," it evokes timeless branding wisdom with a modern tech edge.

⚠️ CRITICAL: ALWAYS include the pronunciation for EVERY name.
⚠️ CRITICAL: ALWAYS include the "Why" explanation for EVERY name.
⚠️ CRITICAL: Format each name exactly as shown above with Name:, Pronounced:, and Why: labels.
⚠️ CRITICAL: Generate exactly 18 names, no more, no less.

❌ Do not number the names
❌ Do not include any other information beyond the format specified above`;

/**
 * Generates business names using OpenAI API with streaming support
 * @param prompt The user prompt for generating business names
 * @param count Number of business names to generate (default: 18)
 * @param model OpenAI model to use (default: 'gpt-4o-mini')
 * @param onChunk Callback function to process each chunk as it's received
 * @param existingNames Optional array of existing names to avoid duplicates
 * @returns Array of generated business names
 */
export async function generateBusinessNamesWithOpenAIStream(
  prompt: string,
  count: number = 18,
  model: string = "gpt-4o-mini",
  onChunk: (chunk: BusinessName) => void,
  existingNamesToAvoid?: string[]
): Promise<BusinessName[]> {
  try {
    console.time("openai_api_stream_call");
    console.log(
      `Starting OpenAI streaming API call at ${new Date().toISOString()} using model ${model}`
    );

    // Prepare the user message with the main prompt
    let userMessage = `I need EXACTLY ${count} business names for: ${prompt}. Please generate a list of ${count} names, no more and no less.`;
    
    // Add existing names to avoid if provided
    const namesToAvoid = existingNamesToAvoid || [];
    if (namesToAvoid.length > 0) {
      userMessage += ` IMPORTANT: Please avoid using these existing names: ${namesToAvoid.join(', ')}.`;
    }
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: BRAND_NAME_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2000, // Reduced for faster response with fewer names
        temperature: 0.7, // Slightly reduced for more focused responses
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    // Buffer to accumulate text chunks
    let buffer = "";
    // Full content to accumulate the entire response
    let fullContent = "";
    // Track if we've emitted at least one name
    let hasEmittedFirstName = false;
    // Track when we started processing
    const startTime = Date.now();
    const allNames: BusinessName[] = [];

    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Log first name latency and try to extract first name quickly
      if (!hasEmittedFirstName && buffer.includes("Name:")) {
        const firstNameLatency = Date.now() - startTime;
        console.log(`First name detected in ${firstNameLatency}ms`);

        // We'll wait for a complete name block instead of quick extraction
        // This ensures we get proper names and not partial/confusing data
        console.log(`First name detected in buffer, waiting for complete data`);
      }

      // Check if we have a complete name block
      if (buffer.includes("Name:")) {
        // Try to extract complete name blocks
        const nameMatches = buffer.match(
          /Name:([^\n]*)(\n|\r\n)([\s\S]*?)(?=(Name:|$))/g
        );

        if (nameMatches) {
          for (const match of nameMatches) {
            try {
              // Parse the name block
              const nameBlock = match.trim();
              const nameMatch = nameBlock.match(/Name:([^\n]*)/);
              const pronunciationMatch = nameBlock.match(
                /Pronounced:([^\n]*)(\n|\r\n|$)/
              );
              const whyMatch = nameBlock.match(/Why:([^\n]*)(\n|\r\n|$)/);

              if (nameMatch) {
                const name = nameMatch[1].trim();
                const pronunciation = pronunciationMatch
                  ? pronunciationMatch[1].trim()
                  : "";
                const description = whyMatch ? whyMatch[1].trim() : "";

                // Only process complete entries
                if (name && pronunciation && description) {
                  // Generate a clean handle base from the name
                  const handleBase = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");

                  // Create a business name object
                  const businessName: BusinessName = {
                    name,
                    pronunciation,
                    description,
                    available: true,
                    domains: [
                      { name: `${handleBase}.com`, available: true },
                      { name: `${handleBase}.io`, available: true },
                      { name: `${handleBase}.co`, available: true },
                    ],
                    socialHandles: {
                      twitter: `@${handleBase}`,
                      instagram: `@${handleBase}`,
                      facebook: `@${handleBase}`,
                    },
                  };

                  // Check if this is a new name we haven't seen before
                  const isDuplicate = allNames.some(
                    (existing) => existing.name === name
                  );

                  if (!isDuplicate) {
                    console.log(`Streaming new name: ${name}`);
                    allNames.push(businessName);
                    onChunk(businessName); // Send the new name to the client immediately

                    if (!hasEmittedFirstName) {
                      console.log(
                        `First complete name emitted in ${
                          Date.now() - startTime
                        }ms`
                      );
                      hasEmittedFirstName = true;
                    }
                  }
                }
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_: unknown) {
              console.warn("Error parsing name block");
              continue;
            }
          }
        }
      }

      // Process complete messages in the buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "[DONE]") {
            // End of stream
            break;
          }

          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content || "";

            if (content) {
              // Accumulate the content
              fullContent += content;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            // Ignore invalid JSON
          }
        }
      }
    }

    console.timeEnd("openai_api_stream_call");
    console.log(
      `Completed OpenAI streaming API call at ${new Date().toISOString()}`
    );

    // Parse the complete response to get any names that weren't caught in the streaming process
    const finalNames = parseBusinessNames(fullContent, count);

    // Merge with any names we already found, avoiding duplicates
    const existingNames = new Set(allNames.map((n) => n.name));
    for (const name of finalNames) {
      if (!existingNames.has(name.name)) {
        allNames.push(name);
        onChunk(name);
      }
    }

    return allNames;
  } catch (error: unknown) {
    console.error("Error calling OpenAI streaming API:", error);
    console.timeEnd("openai_api_stream_call");
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate business names: ${errorMessage}`);
  }
}

// Helper function to parse the OpenAI response into structured business names
export function parseBusinessNames(
  content: string,
  count: number = 18
): BusinessName[] {
  // Clean up the content first - remove numbered entries like "1.", "2.", etc.
  content = content.replace(/^\d+\.\s*/gm, "");

  // Log the first 100 chars of content for debugging
  console.log(
    `Parsing content (first 100 chars): ${content.substring(0, 100)}...`
  );

  // Split the content by name entries, but ensure we're getting complete blocks
  // This regex looks for "Name:" at the start of a line or after a newline
  const nameBlocks = content.split(/(?:^|\n)Name:\s*/i).filter(Boolean);

  console.log(`Found ${nameBlocks.length} name blocks`);
  if (nameBlocks.length > 0) {
    console.log(`First block sample: ${nameBlocks[0].substring(0, 50)}...`);
  }

  // Process each name block into a structured format
  const parsedNames = nameBlocks.flatMap((block) => {
    // Extract name - get the first line, but make sure it's not empty
    const lines = block.split(/\r?\n/).filter((line) => line.trim().length > 0);
    let name = lines[0]?.trim() || "";

    // Remove any remaining numbers at the beginning like "1. "
    name = name.replace(/^\d+\.?\s*/, "");

    // Skip if name is still just a number or empty
    if (!name || /^\d+$/.test(name)) {
      // If it's just a number, extract the next line as name
      if (lines.length > 1) {
        name = lines[1].replace(/^Pronounced:\s*/i, "").trim();
      }
    }

    // Make sure we have a valid name before continuing
    if (!name || name === "Name" || name.length < 2) {
      console.log(`Skipping invalid name: "${name}"`);
      // Skip this entry by returning an empty array (flatMap will flatten it out)
      return [];
    }

    // Extract pronunciation if available
    const pronunciationMatch = block.match(/Pronounced:\s*([^\r\n]+)/i);
    const pronunciation = pronunciationMatch
      ? pronunciationMatch[1].trim()
      : "";

    // Extract description - look for a line starting with "Why:" as per the system prompt
    let description = "";
    const whyMatch = block.match(/Why:\s*([^\r\n]+)/i);

    if (whyMatch) {
      description = whyMatch[1].trim();
    }

    // Skip incomplete entries
    if (!name || !pronunciation || !description) {
      console.log(`Skipping incomplete business name: ${name}`);
      return [];
    }

    // Generate a clean handle base from the name
    const handleBase = name.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Return a single business name object
    return [
      {
        name,
        pronunciation,
        description,
        available: true, // Default to available
        domains: [
          { name: `${handleBase}.com`, available: true },
          { name: `${handleBase}.io`, available: true },
          { name: `${handleBase}.co`, available: true },
        ],
        socialHandles: {
          twitter: `@${handleBase}`,
          instagram: `@${handleBase}`,
          facebook: `@${handleBase}`,
        },
      },
    ];
  });

  // Log how many names we found
  console.log(`Successfully parsed ${parsedNames.length} business names`);

  // Return only the requested number of names
  return parsedNames.slice(0, count);
}
