import { BusinessName } from "@/types";

/**
 * Generates business names using OpenAI API with streaming support
 * @param prompt The user prompt for generating business names
 * @param count Number of business names to generate (default: 40)
 * @param model OpenAI model to use (default: 'gpt-4-turbo')
 * @param onChunk Callback function to process each chunk as it's received
 * @returns Array of generated business names
 */
export async function generateBusinessNamesWithOpenAIStream(
  prompt: string,
  count: number = 40,
  model: string = "gpt-4o-mini",
  onChunk: (chunk: BusinessName) => void
): Promise<BusinessName[]> {
  try {
    console.time("openai_api_stream_call");
    console.log(
      `Starting OpenAI streaming API call at ${new Date().toISOString()} using model ${model}`
    );

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
          {
            role: "user",
            content: `I need EXACTLY ${count} business names for: ${prompt}. Please generate a full list of ${count} names, no more and no less.`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.8,
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
    let buffer = "";
    let allNames: BusinessName[] = [];

    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete messages in the buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.trim() === "") continue;
        if (line.trim() === "data: [DONE]") continue;

        let data;
        try {
          // Remove 'data: ' prefix if it exists
          const jsonStr = line.startsWith("data: ") ? line.slice(5) : line;
          data = JSON.parse(jsonStr);
        } catch (e) {
          console.warn("Error parsing JSON from stream:", line);
          continue;
        }

        // Extract content from the stream
        if (data.choices && data.choices[0]?.delta?.content) {
          const content = data.choices[0].delta.content;

          // Try to parse complete business name entries
          const nameMatch = content.match(/Name:\s*([^\n]+)/i);
          if (nameMatch) {
            // We found a new name, try to parse it as a complete entry
            const partialContent = buffer + content;
            const parsedNames = parseBusinessNames(partialContent, 1);

            if (parsedNames.length > 0) {
              const newName = parsedNames[0];
              
              // Check if this is a new name we haven't seen before
              const isDuplicate = allNames.some(existing => existing.name === newName.name);
              
              if (!isDuplicate) {
                console.log(`Streaming new name: ${newName.name}`);
                allNames.push(newName);
                onChunk(newName); // Send the new name to the client immediately
              }
            }
          }
        }
      }
    }

    console.timeEnd("openai_api_stream_call");
    console.log(
      `Completed OpenAI streaming API call at ${new Date().toISOString()}`
    );

    // Parse the complete response to get any names that weren't caught in the streaming process
    const finalNames = parseBusinessNames(buffer, count);

    // Merge with any names we already found, avoiding duplicates
    const existingNames = new Set(allNames.map((n) => n.name));
    for (const name of finalNames) {
      if (!existingNames.has(name.name)) {
        allNames.push(name);
        onChunk(name);
      }
    }

    return allNames;
  } catch (error: any) {
    console.error("Error calling OpenAI streaming API:", error);
    console.timeEnd("openai_api_stream_call");
    throw new Error(
      `Failed to generate business names: ${error.message || "Unknown error"}`
    );
  }
}

// System prompt for the brand name generator
export const BRAND_NAME_SYSTEM_PROMPT = `You are a highly creative brand name generator.
Your job is to generate a list of 30–40 unique, memorable, and brandable business names based on the user's idea.

Names should be:
• Short, emotionally resonant, or visually evocative
• Inspired by metaphor, mythology, foreign words, or unexpected blends
• Suitable for modern tech startups or creative businesses

✳️ For each name: 1. Provide the name 2. Add the pronunciation guide (if unclear) 3. Include a short, 1-sentence explanation of why the name fits 4. Suggested social media handles for:
• X (formerly Twitter)
• Instagram
• Facebook

🧠 Notes:
• Suggest handles that follow modern conventions: lowercase, no spaces, try to keep it short
• Use common fallback formats if needed (e.g. @getName, @NameApp, @useName, @NameHQ)

❌ Do not perform domain or social handle checks
❌ Do not include availability
❌ Do not list more than 40 names

✅ Output Format (clean and consistent):

Name: Vyntra  
Pronounced: VIN-tra  
Why: Inspired by "vintage" and "mantra," it evokes timeless branding wisdom with a modern tech edge.`;

// Helper function to parse the OpenAI response into structured business names
export function parseBusinessNames(
  content: string,
  count: number = 40
): BusinessName[] {
  // Clean up the content first - remove numbered entries like "1.", "2.", etc.
  content = content.replace(/^\d+\.\s*/gm, "");

  // Split the content by name entries
  const nameBlocks = content.split(/Name:\s*/i).filter(Boolean);

  // Process each name block into a structured format
  const parsedNames = nameBlocks.map((block) => {
    // Extract name - get the first line
    let name = block.split(/\r?\n/)[0].trim();

    // Remove any remaining numbers at the beginning like "1. "
    name = name.replace(/^\d+\.?\s*/, "");

    // Skip if name is still just a number or empty
    if (!name || /^\d+$/.test(name)) {
      // If it's just a number, extract the next line as name
      const lines = block.split(/\r?\n/).filter(Boolean);
      if (lines.length > 1) {
        name = lines[1].replace(/^Pronounced:\s*/i, "").trim();
      }
    }

    // Extract pronunciation if available
    const pronunciationMatch = block.match(/Pronounced: ([^\r\n]+)/);
    const pronunciation = pronunciationMatch
      ? pronunciationMatch[1].trim()
      : "";

    // Extract description
    const whyMatch = block.match(/Why: ([^\r\n]+)/);
    const description = whyMatch ? whyMatch[1].trim() : "";

    // Extract social handles if available
    const twitterMatch =
      block.match(/@([a-zA-Z0-9_]+) \(Twitter\)/i) ||
      block.match(/@([a-zA-Z0-9_]+) \(X\)/i);
    const instagramMatch = block.match(/@([a-zA-Z0-9_]+) \(Instagram\)/i);
    const facebookMatch = block.match(/@([a-zA-Z0-9_]+) \(Facebook\)/i);

    // Default handles based on name if not found
    const nameLower = name.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Create domain options
    const domains = [`${nameLower}.com`, `${nameLower}.io`, `${nameLower}.co`];

    return {
      name,
      pronunciation,
      description,
      socialHandles: {
        twitter: twitterMatch ? twitterMatch[1] : nameLower,
        instagram: instagramMatch ? instagramMatch[1] : nameLower,
        facebook: facebookMatch ? facebookMatch[1] : nameLower,
        domains,
        domain: domains[0], // For backward compatibility
      },
    };
  });

  // Return the requested number of names
  return parsedNames.slice(0, count);
}
