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

// Add runtime configuration
export const config = {
  runtime: 'edge',
};

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

// Define the type for the Perplexity API request
interface PerplexityApiRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  max_tokens: number;
  temperature: number;
  response_format?: {
    type: string;
    json_schema?: {
      schema: Record<string, unknown>;
    };
  };
}

export async function POST(req: Request) {
  console.log("Perplexity API route called");
  
  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body).substring(0, 500) + "...");
    
    // Format the request body for Perplexity API
    const perplexityRequest: PerplexityApiRequest = {
      model: body.model || "sonar-small-chat",
      messages: [
        {
          role: "system",
          content: body.systemPrompt || "You are a helpful assistant."
        },
        {
          role: "user",
          content: body.prompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.7
    };
    
    // Only add response_format if it's specifically needed
    if (body.forceJsonOutput) {
      perplexityRequest.response_format = { type: "json_object" };
    } else if (body.response_format) {
      perplexityRequest.response_format = body.response_format;
    }
    
    // Add timeout handling with a longer timeout (120 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Request timeout reached, aborting...");
      controller.abort();
    }, 120000); // Increase to 120 seconds
    
    console.log(`[${new Date().toISOString()}] Calling Perplexity API with formatted request:`, JSON.stringify(perplexityRequest).substring(0, 500) + "...");
    
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify(perplexityRequest),
        signal: controller.signal,
      });
      
      console.log(`[${new Date().toISOString()}] Perplexity API response received`);
      clearTimeout(timeoutId);
      
      console.log("Perplexity API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error:", errorText);
        return Response.json({ error: `Perplexity API error: ${response.status} ${errorText}` }, { status: response.status });
      }
      
      const data = await response.json();
      console.log("Perplexity API response data:", JSON.stringify(data).substring(0, 500) + "...");
      
      return Response.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.error("Request aborted due to timeout");
          return Response.json({ error: "Request timed out after 120 seconds" }, { status: 504 });
        }
      }
      
      throw fetchError; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error("Error in Perplexity API route:", error);
    
    if (error instanceof Error) {
      return Response.json({ error: `Error: ${error.message}` }, { status: 500 });
    }
    
    return Response.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 