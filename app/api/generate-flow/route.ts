// app/api/generate-flow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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
    
    console.log('Processing prompt:', prompt);
    
    // Create the system prompt for generating a flow
    const systemPrompt = `
    You are a flow diagram generator that creates outlines for papers and projects.
    
    Given a brief description of a paper or project, generate a linear flow of connected nodes that 
    represent the logical sections or steps. Each node should have a clear title (label) and 
    optionally a short name/identifier.
    
    Return ONLY a JSON object with this structure, nothing else:
    {
      "nodes": [
        {
          "title": "Section Title",
          "name": "Optional short identifier"
        },
        ...more nodes
      ]
    }
    
    Make sure the flow is linear (no branches) with a logical progression from start to finish.
    Typically include 5-8 nodes for a comprehensive but focused flow.
    `;
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Configure the generation
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 800,
    };
    
    // Create a chat and send the messages
    const chat = model.startChat({
      generationConfig,
    });
    
    // Send the system prompt and user prompt
    const result = await chat.sendMessage(systemPrompt + "\n\nUser request: " + prompt);
    const responseText = result.response.text();
    
    console.log('Gemini raw response:', responseText);
    
    // Extract the JSON part from the response
    let jsonStr = responseText;
    
    // If response contains markdown code block, extract the JSON
    if (responseText.includes('```json')) {
      const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
    } else if (responseText.includes('```')) {
      // Try to find any code block if JSON specific one isn't found
      const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
    }
    
    // Parse the JSON response
    try {
      const flowData = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
        throw new Error('Invalid response structure');
      }
      
      return NextResponse.json(flowData);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      
      // Try to recover with a simpler format or fallback
      try {
        // Create a fallback flow from the text response
        const fallbackFlow = createFallbackFlow(responseText);
        return NextResponse.json(fallbackFlow);
      } catch (fallbackError) {
        return NextResponse.json(
          { error: 'Failed to parse Gemini response', responseText },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to create a fallback flow from text
function createFallbackFlow(text: string) {
  // Try to extract meaningful sections from the response
  const lines = text.split('\n');
  const nodes = [];
  
  // Look for lines that might contain titles or section names
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('}') && 
        !trimmed.startsWith('[') && !trimmed.startsWith(']') && 
        !trimmed.startsWith('```')) {
      
      // Check if it's a reasonable length for a title (not too long)
      if (trimmed.length <= 50) {
        nodes.push({
          title: trimmed,
          name: ""
        });
      }
    }
  }
  
  // If we couldn't extract anything useful, provide default structure
  if (nodes.length < 3) {
    return {
      nodes: [
        { title: "Introduction", name: "intro" },
        { title: "Background", name: "background" },
        { title: "Methodology", name: "method" },
        { title: "Results", name: "results" },
        { title: "Conclusion", name: "conclusion" }
      ]
    };
  }
  
  return { nodes };
}