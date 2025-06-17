// API route for enhancing business idea prompts
import { NextResponse } from 'next/server'

// System prompt for enhancing business name prompts
const ENHANCE_SYSTEM_PROMPT = `You are a helpful assistant that enhances business name generation prompts. 
Take the user's input and expand it with more details, context, and specific requirements that would help generate better business name ideas.
Focus on adding industry context, target audience details, brand personality traits, and any unique selling propositions.
Keep your response concise (under 200 words) and focused on the business concept.
Do not introduce yourself or add any commentary - just return the enhanced prompt.`;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not found, falling back to mock data');
      const mockEnhancedPrompt = enhancePromptWithBusinessContext(prompt);
      return NextResponse.json({ enhancedPrompt: mockEnhancedPrompt });
    }

    // Call OpenAI API to enhance the prompt
    const enhancedPrompt = await enhancePromptWithOpenAI(prompt);
    
    return NextResponse.json({ enhancedPrompt })
  } catch (error) {
    console.error('Error enhancing prompt:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}

// Function to enhance a prompt using OpenAI API
async function enhancePromptWithOpenAI(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: ENHANCE_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0]?.message?.content || prompt;
    
    return enhancedPrompt;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    // Fall back to mock enhancement if OpenAI call fails
    return enhancePromptWithBusinessContext(prompt);
  }
}

function enhancePromptWithBusinessContext(prompt: string): string {
  // This is a simple enhancement function
  // In production, this would use an AI service
  
  const businessContexts = [
    'considering market trends and customer needs',
    'with a focus on scalability and growth potential',
    'that stands out from competitors in the industry',
    'with a memorable and brandable identity',
    'that conveys professionalism and expertise',
    'with global appeal and expansion possibilities'
  ]
  
  const randomContext = businessContexts[Math.floor(Math.random() * businessContexts.length)]
  
  return `${prompt.trim()} ${randomContext}`
}
