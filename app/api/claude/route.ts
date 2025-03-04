import { NextResponse } from 'next/server';

// Define interfaces for API requests and responses
interface ClaudeRequest {
  model: string;
  prompt: string;
  systemPrompt?: string;
  selectedUpdates?: string[];
  forceJsonOutput?: boolean;
  templateData?: {
    id: string;
    name: string;
    description: string;
    variables: Record<string, unknown>[];
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

// This interface is used in the response handling
interface ClaudeApiResponse {
  content: {
    type: string;
    text: string;
  }[];
}

export async function POST(request: Request) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { message: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const req: ClaudeRequest = await request.json();
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

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        system: finalSystemPrompt,
        messages: [
          {
            role: 'user',
            content: modifiedPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as Record<string, unknown>;
      return NextResponse.json(
        { message: `Claude API error: ${errorData.error || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json() as ClaudeApiResponse;
    
    // Extract the text content from Claude's response
    const content = data.content.map(item => item.type === 'text' ? item.text : '').join('');
    
    return NextResponse.json({
      content
    });
  } catch (error) {
    console.error('Error in Claude API route:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}