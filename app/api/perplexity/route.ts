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
  regions: ['iad1'], // Use a specific region for better performance
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
    
    // Log only the first part of the request to avoid excessive logging
    console.log("Request body type:", body.model || "sonar-small-chat");
    
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
    
    // Optimize the request by reducing the complexity
    if (perplexityRequest.messages[1].content.length > 6000) {
      console.log("Trimming long prompt from", perplexityRequest.messages[1].content.length, "to 6000 characters");
      perplexityRequest.messages[1].content = perplexityRequest.messages[1].content.substring(0, 6000) + "...";
    }
    
    // Use a shorter timeout to ensure we don't hit Vercel's limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Request timeout reached, aborting...");
      controller.abort();
    }, 50000); // 50 seconds to stay under Vercel's 60s limit
    
    console.log(`[${new Date().toISOString()}] Calling Perplexity API`);
    
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
      
      console.log(`[${new Date().toISOString()}] Perplexity API response received, status:`, response.status);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error:", errorText);
        return Response.json({ error: `Perplexity API error: ${response.status} ${errorText}` }, { status: response.status });
      }
      
      const data = await response.json();
      console.log("Perplexity API response received successfully");
      
      return Response.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError instanceof Error ? fetchError.message : "Unknown error");
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.error("Request aborted due to timeout");
          return Response.json({ 
            error: "Request timed out. Please try with a shorter prompt or fewer research items.",
            partial_response: true
          }, { status: 504 });
        }
      }
      
      throw fetchError; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error("Error in Perplexity API route:", error instanceof Error ? error.message : "Unknown error");
    
    if (error instanceof Error) {
      return Response.json({ error: `Error: ${error.message}` }, { status: 500 });
    }
    
    return Response.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 