import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { payload } = await request.json();
    
    // Get API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { message: 'Perplexity API key is not configured' },
        { status: 500 }
      );
    }
    
    // Prepare the request to Perplexity API
    const perplexityPayload = {
      ...payload,
      // Add any additional Perplexity-specific parameters here
    };
    
    // Make the request to Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(perplexityPayload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: `Perplexity API error: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Extract the content from the Perplexity response
    const content = data.choices[0].message.content;
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error in generate API route:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 