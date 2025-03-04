import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define interfaces for API requests and responses
interface PerplexityRequest {
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
interface PerplexityCompletionResponse extends OpenAI.Chat.ChatCompletion {
  citations?: string[];
  usage?: PerplexityUsage;
}

export async function POST(request: Request) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { message: 'Perplexity API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const req: PerplexityRequest = await request.json();
    const { model, prompt, systemPrompt, selectedUpdates, forceJsonOutput = false, templateData, slideFormat } = req;

    if (!prompt) {
      return NextResponse.json(
        { message: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Create the user prompt with selected updates if available
    let enhancedUserPrompt = prompt;
    if (selectedUpdates && selectedUpdates.length > 0) {
      enhancedUserPrompt += "\n\nIncorporate the following research updates into your response:\n\n";
      selectedUpdates.forEach((update, index) => {
        enhancedUserPrompt += `Update ${index + 1}: ${update}\n\n`;
      });
    }

    // If JSON output is forced, add a clear instruction
    if (forceJsonOutput) {
      enhancedUserPrompt = `${enhancedUserPrompt}\n\nIMPORTANT: Your response MUST be a valid JSON object and nothing else. Do not include any explanations, markdown formatting, or text outside the JSON.`;
    }

    // Default system prompt if none provided
    const defaultSystemPrompt = "You are a research assistant that provides well-researched, up-to-date information with proper citations. Format your response in markdown with clear headings, bullet points for key insights, and numbered lists for recommendations. Include relevant statistics and data when available.";

    // Enhanced system prompt for JSON output
    let finalSystemPrompt = systemPrompt || defaultSystemPrompt;
    if (forceJsonOutput) {
      finalSystemPrompt = `${finalSystemPrompt} You MUST return ONLY a valid JSON object. Your entire response must be parseable as JSON. Do not include any text, explanations, or formatting outside the JSON object.`;
    }

    // Modify the system prompt based on template data
    if (templateData) {
      // Add template-specific instructions to the system prompt
      finalSystemPrompt += `\n\nThe user has selected a template called "${templateData.name}". 
      The template has the following description: "${templateData.description}".
      
      ${templateData.htmlContent ? `The template has the following HTML content structure:
      ${templateData.htmlContent}` : ''}
      
      The template has the following variables that need to be filled:
      ${JSON.stringify(templateData.variables, null, 2)}
      
      Please create a PowerPoint presentation that follows the layout and structure shown in this template.
      Identify the key elements in the template (title, subtitle, main points, etc.) and use them as a guide for structuring your response.
      Your response should be in JSON format that can be used to generate a PowerPoint with a similar layout.`;
    }

    // Construct a modified prompt that includes the slide format requirements
    let modifiedPrompt = enhancedUserPrompt;
    
    if (forceJsonOutput && slideFormat) {
      // Add slide format instructions to the prompt
      modifiedPrompt += `\n\nPlease format the slide according to these specifications:
- Title: ${slideFormat.title ? `"${slideFormat.title}"` : "Generate an appropriate title"}
- Layout: ${slideFormat.layout === 'two-column' ? 'Two columns of bullet points' : 
          slideFormat.layout === 'single-column' ? 'Single column of bullet points' : 
          slideFormat.layout === 'comparison' ? 'Comparison format' : 
          'Timeline format'}
- Number of main points: ${slideFormat.numPoints}
- ${slideFormat.includeSupportingData ? 'Include' : 'Do not include'} supporting data for each point
- ${slideFormat.includeConclusion ? 'Include' : 'Do not include'} a conclusion
- Visual style: ${slideFormat.visualStyle}`;

      // Add custom points if provided
      if (slideFormat.customPoints?.length) {
        modifiedPrompt += `\n\nUse these specific points in the slide (fill in any remaining points needed):`;
        slideFormat.customPoints.forEach((point, index) => {
          if (point.trim()) {
            modifiedPrompt += `\n- Point ${index + 1}: "${point}"`;
            
            // Add supporting data if provided
            if (slideFormat.includeSupportingData && 
                slideFormat.customSupportingData?.[index]?.trim()) {
              modifiedPrompt += `\n  Supporting data: "${slideFormat.customSupportingData[index]}"`;
            }
          }
        });
      }
      
      // Add custom conclusion if provided
      if (slideFormat.includeConclusion && slideFormat.customConclusion?.trim()) {
        modifiedPrompt += `\n\nUse this specific conclusion: "${slideFormat.customConclusion}"`;
      }
    }

    // Add response_format for JSON output if needed
    if (forceJsonOutput) {
      // Define a more specific schema that includes references
      req['response_format'] = {
        type: "json_schema",
        json_schema: {
          schema: {
            type: "object",
            properties: {
              layout: { type: "string" },
              numPoints: { type: "integer" },
              includeSupportingData: { type: "boolean" },
              includeConclusion: { type: "boolean" },
              visualStyle: { type: "string" },
              content: { 
                type: "object",
                properties: {
                  header: { type: "string" },
                  columns: { 
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        points: { 
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              content: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  },
                  conclusion: { type: "string" }
                }
              },
              references: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    url: { type: "string" },
                    date: { type: "string" }
                  },
                  required: ["id", "title", "url"]
                }
              }
            },
            required: ["layout", "numPoints", "includeSupportingData", "includeConclusion", "visualStyle", "content", "references"]
          }
        }
      };
    }

    // Prepare messages array for Perplexity API
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    // Add system message if provided
    if (finalSystemPrompt && finalSystemPrompt.trim()) {
      messages.push({ 
        role: 'system', 
        content: finalSystemPrompt.trim() 
      });
    }
    
    // Add the user message with the prompt
    messages.push({ 
      role: 'user', 
      content: modifiedPrompt.trim() 
    });
    
    // Initialize OpenAI client with Perplexity base URL
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.perplexity.ai'
    });
    
    // Prepare request options
    const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
      model: model || 'sonar-small-chat',
      messages: messages
    };
    
    console.log('Sending to Perplexity API:', JSON.stringify(requestOptions, null, 2));

    // Call Perplexity API using OpenAI client
    const response = await client.chat.completions.create(requestOptions) as PerplexityCompletionResponse;
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      return NextResponse.json(
        { message: 'Invalid response format from Perplexity API' },
        { status: 500 }
      );
    }
    
    // Extract citations from the response if they exist
    const citations = response.citations || [];
    
    // Return both content and citations
    return NextResponse.json({
      content: response.choices[0].message.content,
      citations: citations,
      searchStats: {
        citationTokens: response.usage?.citation_tokens || 0,
        numSearchQueries: response.usage?.num_search_queries || 0
      }
    });
  } catch (error) {
    console.error('Error in Perplexity API route:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 