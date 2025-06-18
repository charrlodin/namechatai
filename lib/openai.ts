/**
 * Validates the OpenAI API key configuration
 * @returns An object with validation status and message
 */
export function validateApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      valid: false,
      message:
        "OpenAI API key is not configured. Please add your API key to the .env.local file.",
    };
  }

  if (!apiKey.startsWith("sk-")) {
    return {
      valid: false,
      message:
        'OpenAI API key appears to be invalid. API keys should start with "sk-".',
    };
  }

  return {
    valid: true,
    message: "OpenAI API key is valid.",
  };
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

// Function to generate business names using OpenAI API via fetch
export async function generateBusinessNames(
  prompt: string,
  count: number = 18,
  model: string = "gpt-4o-mini"
) {
  try {
    // Validate API key first
    const keyValidation = validateApiKey();
    if (!keyValidation.valid) {
      throw new Error(keyValidation.message);
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
          { 
            role: "user", 
            content: `I need EXACTLY ${count} business names for: ${prompt}. Please generate a list of ${count} names, no more and no less.` 
          },
        ],
        max_tokens: 2000, // Reduced for faster response with fewer names
        temperature: 0.7, // Slightly reduced for more focused responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Parse the generated content into structured business names
    return parseBusinessNames(content, count);
  } catch (error) {
    console.error("Error generating business names:", error);
    throw error;
  }
}

// Helper function to parse the OpenAI response into structured business names
export function parseBusinessNames(content: string, count: number = 40) {
  // Split the content by name entries
  const nameBlocks = content.split(/Name: /).filter(Boolean);

  // Process each name block into a structured format
  const parsedNames = nameBlocks.map((block) => {
    // Extract name and clean up any markdown formatting or numbering
    let name = block.split(/\r?\n/)[0].trim();
    
    // Remove numbering (e.g., "1. ", "2. ")
    name = name.replace(/^\d+\.\s*/, '');
    
    // Remove markdown formatting (e.g., "**Name:**")
    name = name.replace(/\*\*/g, '').replace(/^Name:\s*/i, '');

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

    return {
      name,
      pronunciation,
      description,
      socialHandles: {
        twitter: twitterMatch ? twitterMatch[1] : nameLower,
        instagram: instagramMatch ? instagramMatch[1] : nameLower,
        facebook: facebookMatch ? facebookMatch[1] : nameLower,
        domains: [`${nameLower}.com`, `${nameLower}.io`, `${nameLower}.co`, `${nameLower}.app`],
      },
    };
  });

  // Return only the requested number of names
  return parsedNames.slice(0, count);
}

// System prompt for enhancing business name prompts
export const ENHANCE_SYSTEM_PROMPT = `You are a business idea enhancer.
Your job is to take a short, raw, or vague business idea from the user and enhance it into a polished, detailed description suitable for creative name generation.

✳️ Your enhanced output should clarify:
	•	What the business or tool does
	•	Who the target audience is
	•	What makes it unique or valuable
	•	Any relevant tone, vibe, or emotion it should convey (e.g. luxury, fast, fun, serious, bold)

✅ Output Format:
A short paragraph (4–6 sentences) describing the business clearly and in natural language — no headings, lists, or bullet points. Avoid using the word "business" repeatedly.

❌ Do not suggest names
❌ Do not explain your process
❌ Do not use generic filler ("this is a cool idea")
❌ Do not add example names or features`;

// Function to enhance a prompt using OpenAI API via fetch
export async function enhancePrompt(prompt: string) {
  try {
    // Validate API key first
    const keyValidation = validateApiKey();
    if (!keyValidation.valid) {
      throw new Error(keyValidation.message);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using gpt-4o-mini as specified for enhance prompt
        messages: [
          {
            role: "system",
            content: ENHANCE_SYSTEM_PROMPT,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || prompt;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return prompt; // Return original prompt if enhancement fails
  }
}
