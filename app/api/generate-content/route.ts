import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client with the same API key you're using for generate-flow
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { nodeTitle, userPrompt } = await request.json();
    
    if (!nodeTitle || !userPrompt) {
      return NextResponse.json(
        { error: 'Node title and user prompt are required' },
        { status: 400 }
      );
    }
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }
    
    console.log('Generating content for node:', nodeTitle);
    console.log('Based on prompt:', userPrompt);
    
    // Get the generative model - use the same model as your generate-flow endpoint
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Configure the generation
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 500,
    };
    
    // Create a chat and send the messages
    const chat = model.startChat({
      generationConfig,
    });
    
    // Create the prompt for generating node content
    const contentPrompt = `
    You are an AI assistant helping to generate concise, well-written content for a flow diagram node.
    
    Generate 1-3 focused paragraphs for a node with the title "${nodeTitle}".
    The content should be directly relevant to both the node title and the user's specific request.
    
    User's request: ${userPrompt}
    
    The content should be appropriate for a professional flow diagram/mind map and directly usable without
    any additional formatting or explanation.
    
    Return ONLY the content text itself, with no prefixes, introductions, or explanations.
    `;
    
    // Send the prompt and get the response
    const result = await chat.sendMessage(contentPrompt);
    const content = result.response.text().trim();
    
    console.log('Content generated successfully');
    
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
