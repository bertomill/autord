// Remove or use the unused imports
// If you need these types for documentation but don't use them directly,
// you can prefix them with an underscore to tell ESLint to ignore them

// For example, change:
// import { NextResponse } from 'next/server';
// To:
// import { NextResponse } from 'next/server';  // Remove if not needed

// Or for type definitions:
// type _PerplexityRequest = {
//   // ... type definition ...
// };

// Or simply remove the unused types/imports

import OpenAI from 'openai';

// Define interfaces for API requests and responses
export interface PerplexityRequest {
  model: string;
  prompt: string;
  systemPrompt?: string;
  selectedUpdates?: string[];
  forceJsonOutput?: boolean;
  response_format?: {
    type: string;
    json_schema?: {
      schema: Record<string, unknown>;
    };
  };
  templateData?: {
    id: string;
    name: string;
    description: string;
    variables: { name: string; value: string }[];
    htmlContent?: string;
    thumbnailUrl?: string;
  };
  slideFormat?: {
    title?: string;
    layout: string;
    numPoints: number;
    includeSupportingData: boolean;
    includeConclusion: boolean;
    visualStyle: string;
    customPoints?: string[];
    customSupportingData?: string[];
    customConclusion?: string;
  };
}

export interface PerplexityResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  citations?: string[];
  usage?: {
    citation_tokens?: number;
    num_search_queries?: number;
  };
}

// Extended usage interface for Perplexity API
interface PerplexityUsage extends OpenAI.CompletionUsage {
  citation_tokens?: number;
  num_search_queries?: number;
}

// Extended response interface for Perplexity API
export interface PerplexityCompletionResponse extends OpenAI.Chat.ChatCompletion {
  citations?: string[];
  usage?: PerplexityUsage;
}

export async function POST(req: Request) {
  console.log("Perplexity API route called");
  
  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body).substring(0, 500) + "..."); // Log truncated request for privacy
    
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    console.log("Calling Perplexity API...");
    const response = await fetch("https://api.perplexity.ai/...", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log("Perplexity API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", errorText);
      return new Response(JSON.stringify({ error: `API error: ${response.status} - ${errorText}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const data = await response.json();
    console.log("Perplexity API response data:", JSON.stringify(data).substring(0, 500) + "...");
    
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    console.error("Error in Perplexity API route:", error);
    
    // Check if it's an AbortError (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timed out after 25 seconds" }), {
        status: 504,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An error occurred" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 