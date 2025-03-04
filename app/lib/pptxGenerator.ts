import PptxGenJS from 'pptxgenjs';

// Define the slide data interface based on our JSON structure
export interface SlideData {
  title: string;
  subtitle: string | null;
  mainPoints: {
    text: string;
    supportingData: string | null;
  }[];
  conclusion: string;
  visualSuggestion: string;
}

/**
 * Generates a PowerPoint presentation with a single slide from the provided JSON data
 * @param slideData The structured data for the slide
 * @returns A Blob containing the PowerPoint file
 */
export async function generateOneSlidePresentation(slideData: SlideData): Promise<Blob> {
  // Create a new PowerPoint presentation
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = slideData.title;
  
  // Define colors for a professional look
  const colors = {
    primary: '0078D4', // Microsoft blue
    secondary: '2B579A', // Darker blue
    accent: '5C2D91',   // Purple
    text: '333333',     // Dark gray
    lightText: '666666', // Medium gray
    background: 'FFFFFF', // White
    highlight: 'FFD700'  // Gold
  };

  // Create a slide with a gradient background
  const slide = pptx.addSlide();
  
  // Add a subtle gradient background
  slide.background = { 
    color: colors.background,
    // Remove unsupported properties
    // gradientType: 'linear',
    // gradientStops: [
    //   { color: 'F5F5F5', position: 0 },
    //   { color: 'FFFFFF', position: 100 }
    // ]
  };

  // Add a colored header bar
  slide.addShape('rect', { 
    x: 0, 
    y: 0, 
    w: '100%', 
    h: 0.5, 
    fill: { color: colors.primary } 
  });

  // Add title with a modern look
  slide.addText(slideData.title, {
    x: 0.5,
    y: 0.7,
    w: '90%',
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: colors.primary,
    align: 'center',
    fontFace: 'Segoe UI'
  });

  // Add subtitle if it exists
  if (slideData.subtitle) {
    slide.addText(slideData.subtitle, {
      x: 0.5,
      y: 1.6,
      w: '90%',
      h: 0.6,
      fontSize: 20,
      color: colors.secondary,
      align: 'center',
      fontFace: 'Segoe UI'
    });
  }

  // Add main points with a modern bullet style
  const startY = slideData.subtitle ? 2.4 : 2.0;
  slideData.mainPoints.forEach((point, index) => {
    // Add bullet point shape
    slide.addShape('ellipse', {
      x: 0.7,
      y: startY + (index * 1.1) + 0.1,
      w: 0.15,
      h: 0.15,
      fill: { color: colors.accent }
    });

    // Add main point text
    slide.addText(point.text, {
      x: 1.0,
      y: startY + (index * 1.1),
      w: '85%',
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colors.text,
      fontFace: 'Segoe UI'
    });

    // Add supporting data if it exists
    if (point.supportingData) {
      slide.addText(point.supportingData, {
        x: 1.0,
        y: startY + (index * 1.1) + 0.5,
        w: '85%',
        h: 0.5,
        fontSize: 16,
        color: colors.lightText,
        italic: true,
        fontFace: 'Segoe UI'
      });
    }
  });

  // Add a divider line before conclusion
  slide.addShape('line', {
    x: 2.0,
    y: 6.2,
    w: 6.0,
    h: 0,
    line: { color: colors.primary, width: 1.5, dashType: 'dash' }
  });

  // Add conclusion with a highlight box
  slide.addShape('rect', {
    x: 0.5,
    y: 6.4,
    w: '90%',
    h: 0.7,
    fill: { color: colors.primary + '15' }, // Light version of primary color (15% opacity)
    line: { color: colors.primary, width: 1 }
  });

  slide.addText(slideData.conclusion, {
    x: 0.7,
    y: 6.5,
    w: '88%',
    h: 0.6,
    fontSize: 18,
    color: colors.text,
    bold: true,
    align: 'center',
    fontFace: 'Segoe UI'
  });

  // Add visual suggestion note at the bottom
  slide.addText(`Visual Suggestion: ${slideData.visualSuggestion}`, {
    x: 0.5,
    y: 7.3,
    w: '90%',
    h: 0.4,
    fontSize: 10,
    color: colors.lightText,
    italic: true,
    align: 'center',
    fontFace: 'Segoe UI'
  });

  // Add a footer with date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  slide.addText(dateStr, {
    x: 0.5,
    y: 7.7,
    w: 2.0,
    h: 0.3,
    fontSize: 8,
    color: colors.lightText,
    fontFace: 'Segoe UI'
  });

  // Generate the PowerPoint file as a Blob
  return pptx.write()
    .then(buffer => {
      // Convert the buffer to a Blob
      return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    });
}

/**
 * Parses a JSON string into SlideData, with validation
 * @param jsonString The JSON string to parse
 * @returns The parsed SlideData object or null if invalid
 */
export function parseSlideData(jsonString: string): SlideData | null {
  try {
    // Try to parse the JSON string
    let data: Partial<SlideData>;
    
    // First, try to parse as is
    try {
      data = JSON.parse(jsonString);
    } catch {
      // If direct parsing fails, try to extract JSON from the string
      // This handles cases where the AI might add extra text around the JSON
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('Error parsing extracted JSON:', innerError);
          return null;
        }
      } else {
        console.error('No JSON object found in the string');
        return null;
      }
    }
    
    // Validate the required fields
    if (!data.title || !Array.isArray(data.mainPoints) || !data.conclusion) {
      console.error('Invalid slide data: missing required fields');
      return null;
    }
    
    // Ensure mainPoints have the required structure
    if (!data.mainPoints.every((point: { text?: string }) => typeof point.text === 'string')) {
      console.error('Invalid slide data: mainPoints must have text property');
      return null;
    }
    
    // Ensure visualSuggestion exists, or provide a default
    if (!data.visualSuggestion) {
      data.visualSuggestion = "Simple bar chart or comparison table";
    }
    
    return data as SlideData;
  } catch (error) {
    console.error('Error parsing slide data:', error);
    return null;
  }
}

/**
 * Attempts to convert markdown content to SlideData JSON format
 * This is a helper function for cases where the AI returns markdown instead of JSON
 * @param markdownContent The markdown content to convert
 * @returns The converted SlideData object or null if conversion fails
 */
export function convertMarkdownToSlideData(markdownContent: string): SlideData | null {
  try {
    // Extract title (first heading)
    const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "Presentation Title";
    
    // Extract subtitle (second heading or first paragraph after title)
    let subtitle: string | null = null;
    const subtitleMatch = markdownContent.match(/^##\s+(.+)$/m) || 
                          markdownContent.match(/^#\s+.+\n\n([^\n#]+)/m);
    if (subtitleMatch) {
      subtitle = subtitleMatch[1].trim();
    }
    
    // Extract main points (bullet points)
    const mainPoints: { text: string; supportingData: string | null }[] = [];
    const bulletPointRegex = /[*-]\s+([^*\n]+)(?:\n\s+`([^`]+)`)?/g;
    
    let match;
    while ((match = bulletPointRegex.exec(markdownContent)) !== null) {
      mainPoints.push({
        text: match[1].trim(),
        supportingData: match[2] ? match[2].trim() : null
      });
    }
    
    // If no bullet points found, try to extract paragraphs as main points
    if (mainPoints.length === 0) {
      const paragraphs = markdownContent.split('\n\n').slice(1); // Skip title paragraph
      for (let i = 0; i < Math.min(paragraphs.length, 5); i++) {
        if (paragraphs[i] && !paragraphs[i].startsWith('#')) {
          mainPoints.push({
            text: paragraphs[i].substring(0, 50).trim() + (paragraphs[i].length > 50 ? '...' : ''),
            supportingData: null
          });
        }
      }
    }
    
    // Ensure we have at least one main point
    if (mainPoints.length === 0) {
      mainPoints.push({
        text: "Key point from the research",
        supportingData: null
      });
    }
    
    // Extract conclusion (last paragraph or section)
    let conclusion = "Research findings highlight important implications for future work.";
    const conclusionMatch = markdownContent.match(/\n\n([^#\n].{10,100})\n\n?$/);
    if (conclusionMatch) {
      conclusion = conclusionMatch[1].trim();
    }
    
    // Extract visual suggestion (look for any mention of visual elements)
    let visualSuggestion = "Comparison chart of key metrics";
    const visualMatch = markdownContent.match(/(?:chart|graph|diagram|table|visual|layout|figure)/i);
    if (visualMatch) {
      const visualContext = markdownContent.substring(
        Math.max(0, visualMatch.index! - 50),
        Math.min(markdownContent.length, visualMatch.index! + 100)
      );
      visualSuggestion = visualContext.trim();
    }
    
    // Create the slide data
    return {
      title,
      subtitle,
      mainPoints,
      conclusion,
      visualSuggestion
    };
  } catch (error) {
    console.error('Error converting markdown to slide data:', error);
    return null;
  }
} 