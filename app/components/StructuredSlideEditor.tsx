'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import pptxgen from 'pptxgenjs';
import GridLayout from 'react-grid-layout';

// Import the required CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const SLIDE_RATIO = 16/9;
const SLIDE_WIDTH = 800;
const SLIDE_HEIGHT = SLIDE_WIDTH / SLIDE_RATIO;

// Define available slide layouts
const LAYOUTS = [
  { id: 'title', name: 'Title Slide', description: 'Title and subtitle only' },
  { id: 'content', name: 'Content Slide', description: 'Title with bullet points' },
  { id: 'twoColumn', name: 'Two Column', description: 'Title with two columns of bullet points' },
  { id: 'imageText', name: 'Image with Text', description: 'Title with image placeholder and text' },
  { id: 'quote', name: 'Quote Slide', description: 'Featured quote with attribution' },
  { id: 'custom', name: 'Custom Layout', description: 'Fully customizable layout' }
];

interface SlideElement {
  id: string;
  type: 'text' | 'title' | 'bulletPoints' | 'image' | 'shape';
  content: string | string[];
  x: number;
  y: number;
  width: number;
  height: number;
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    [key: string]: string | undefined;
  };
}

interface SlideData {
  layout: string;
  title: string;
  subtitle?: string;
  bulletPoints?: string[];
  columnOnePoints?: string[];
  columnTwoPoints?: string[];
  imageDescription?: string;
  quote?: string;
  attribution?: string;
  notes?: string;
  elements?: SlideElement[];
}

interface StructuredSlideEditorProps {
  initialData?: SlideData;
  onSave: (data: { slideData: SlideData; pptxData: string; thumbnailUrl: string }) => void;
}

// Define TextProps interface
interface TextProps {
  text: string;
  style?: React.CSSProperties;
}

// Update CustomElement to match SlideElement structure
interface CustomElement {
  id: string;
  type: string;
  content: string | TextProps[] | string[];
  x: number;
  y: number;
  width: number;
  height: number;
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    [key: string]: string | undefined;
  };
}

// Helper function to convert string[] to TextProps[]
const convertToTextProps = (items: string[]): TextProps[] => {
  return items.map(text => ({ text }));
};

export default function StructuredSlideEditor({ initialData, onSave }: StructuredSlideEditorProps) {
  const [slideData, setSlideData] = useState<SlideData>(initialData || {
    layout: 'content',
    title: "Slide Title",
    subtitle: "Optional Subtitle",
    bulletPoints: ["Point 1", "Point 2", "Point 3"],
    columnOnePoints: ["Column 1 Point 1", "Column 1 Point 2"],
    columnTwoPoints: ["Column 2 Point 1", "Column 2 Point 2"],
    imageDescription: "Description of the image that should appear here",
    quote: "This is a featured quote that stands out on the slide",
    attribution: "- Quote Attribution",
    notes: "",
    elements: []
  });
  
  const [activeTab, setActiveTab] = useState('edit');
  const [previewUrl, setPreviewUrl] = useState('');
  const [customElements, setCustomElements] = useState<CustomElement[]>([]);
  
  // Initialize custom elements when layout changes to custom
  useEffect(() => {
    if (slideData.layout === 'custom' && (!slideData.elements || slideData.elements.length === 0)) {
      setCustomElements([
        {
          id: 'title-1',
          type: 'title',
          content: slideData.title || 'Custom Title',
          x: 0,
          y: 0,
          width: 12,
          height: 2,
          style: { fontSize: '24px', fontWeight: 'bold' }
        },
        {
          id: 'bullets-1',
          type: 'bulletPoints',
          content: slideData.bulletPoints || ['Point 1', 'Point 2', 'Point 3'],
          x: 0,
          y: 2,
          width: 12,
          height: 4
        }
      ]);
    }
  }, [slideData.layout, slideData.title, slideData.bulletPoints]);
  
  const handleLayoutChange = (value: string) => {
    setSlideData({...slideData, layout: value});
  };
  
  const handleInputChange = (field: keyof SlideData, value: string) => {
    setSlideData({...slideData, [field]: value});
  };
  
  const handleBulletPointChange = (field: 'bulletPoints' | 'columnOnePoints' | 'columnTwoPoints', index: number, value: string) => {
    const points = [...(slideData[field] || [])];
    points[index] = value;
    setSlideData({...slideData, [field]: points});
  };
  
  const handleAddBulletPoint = (field: 'bulletPoints' | 'columnOnePoints' | 'columnTwoPoints') => {
    const points = [...(slideData[field] || []), "New point"];
    setSlideData({...slideData, [field]: points});
  };
  
  const handleRemoveBulletPoint = (field: 'bulletPoints' | 'columnOnePoints' | 'columnTwoPoints', index: number) => {
    const points = [...(slideData[field] || [])];
    points.splice(index, 1);
    setSlideData({...slideData, [field]: points});
  };
  
  // Custom layout handlers
  const handleAddElement = (type: SlideElement['type']) => {
    const newElement: SlideElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'bulletPoints' ? ['New point'] : type === 'image' ? 'Image placeholder' : 'New text',
      x: 0,
      y: customElements.length * 2,
      width: 12,
      height: 2
    };
    
    setCustomElements([...customElements, newElement]);
  };
  
  const handleRemoveElement = (id: string) => {
    setCustomElements(customElements.filter(el => el.id !== id));
  };
  
  const handleElementChange = (id: string, content: string | TextProps[] | string[]) => {
    setCustomElements(customElements.map(el => 
      el.id === id ? {...el, content} : el
    ));
  };
  
  const handleLayoutUpdate = (layout: { i: string; x: number; y: number; w: number; h: number }[]) => {
    // Update positions and sizes from the grid layout
    const updatedElements = customElements.map(el => {
      const layoutItem = layout.find(item => item.i === el.id);
      if (layoutItem) {
        return {
          ...el,
          x: layoutItem.x,
          y: layoutItem.y,
          width: layoutItem.w,
          height: layoutItem.h
        };
      }
      return el;
    });
    
    setCustomElements(updatedElements);
  };
  
  const generatePreview = async () => {
    try {
      // Create a new presentation
      const pptx = new pptxgen();
      
      // Set the slide size
      pptx.defineLayout({ 
        name: 'CUSTOM', 
        width: SLIDE_WIDTH / 72, 
        height: SLIDE_HEIGHT / 72 
      });
      pptx.layout = 'CUSTOM';
      
      // Add a slide
      const slide = pptx.addSlide();
      
      // Generate slide based on layout
      if (slideData.layout === 'custom') {
        // For custom layout, use the custom elements
        customElements.forEach(element => {
          const x = (element.x / 12) * 10; // Convert grid units to inches
          const y = (element.y / 12) * 5.625; // Convert grid units to inches
          const w = (element.width / 12) * 10; // Convert grid units to inches
          const h = (element.height / 12) * 5.625; // Convert grid units to inches
          
          switch (element.type) {
            case 'title':
              slide.addText(element.content as string, {
                x, y, w, h,
                fontSize: 36,
                bold: true
              });
              break;
              
            case 'text':
              slide.addText(element.content as string, {
                x, y, w, h,
                fontSize: 18
              });
              break;
              
            case 'bulletPoints':
              slide.addText(convertToTextProps(element.content as string[]), {
                x, y, w, h,
                fontSize: 18,
                bullet: true
              });
              break;
              
            case 'image':
              // Add a placeholder for the image
              slide.addShape(pptx.ShapeType.rect, {
                x, y, w, h,
                fill: { color: '#EEEEEE' }
              });
              
              slide.addText("Image Placeholder", {
                x, y, w, h,
                fontSize: 14,
                color: '#666666',
                align: 'center',
                valign: 'middle'
              });
              break;
              
            case 'shape':
              slide.addShape(pptx.ShapeType.rect, {
                x, y, w, h,
                fill: { color: '#4472C4' }
              });
              break;
          }
        });
      } else {
        // For predefined layouts, use the existing code
        switch (slideData.layout) {
          case 'title':
            // Title slide
            slide.addText(slideData.title, { 
              x: 0.5, 
              y: 2.5, 
              w: 9, 
              h: 1.5,
              fontSize: 44,
              bold: true,
              align: 'center'
            });
            
            if (slideData.subtitle) {
              slide.addText(slideData.subtitle, { 
                x: 0.5, 
                y: 4, 
                w: 9, 
                h: 1,
                fontSize: 28,
                align: 'center'
              });
            }
            break;
            
          case 'content':
            // Content slide
            slide.addText(slideData.title, { 
              x: 0.5, 
              y: 0.5, 
              w: 9, 
              h: 1,
              fontSize: 36,
              bold: true
            });
            
            if (slideData.bulletPoints && slideData.bulletPoints.length > 0) {
              slide.addText(convertToTextProps(slideData.bulletPoints), { 
                x: 0.5, 
                y: 1.8, 
                w: 9, 
                h: 5,
                fontSize: 18,
                bullet: true
              });
            }
            break;
            
          case 'twoColumn':
            // Two column slide
            slide.addText(slideData.title, { 
              x: 0.5, 
              y: 0.5, 
              w: 9, 
              h: 1,
              fontSize: 36,
              bold: true
            });
            
            if (slideData.columnOnePoints && slideData.columnOnePoints.length > 0) {
              slide.addText(convertToTextProps(slideData.columnOnePoints), { 
                x: 0.5, 
                y: 1.8, 
                w: 4.25, 
                h: 5,
                fontSize: 16,
                bullet: true
              });
            }
            
            if (slideData.columnTwoPoints && slideData.columnTwoPoints.length > 0) {
              slide.addText(convertToTextProps(slideData.columnTwoPoints), { 
                x: 5.25, 
                y: 1.8, 
                w: 4.25, 
                h: 5,
                fontSize: 16,
                bullet: true
              });
            }
            break;
            
          case 'imageText':
            // Image with text slide
            slide.addText(slideData.title, { 
              x: 0.5, 
              y: 0.5, 
              w: 9, 
              h: 1,
              fontSize: 36,
              bold: true
            });
            
            // Image placeholder
            slide.addShape(pptx.ShapeType.rect, { 
              x: 0.5, 
              y: 1.8, 
              w: 4, 
              h: 3,
              fill: { color: '#EEEEEE' }
            });
            
            slide.addText("Image Placeholder", { 
              x: 0.5, 
              y: 1.8, 
              w: 4, 
              h: 3,
              fontSize: 14,
              color: '#666666',
              align: 'center',
              valign: 'middle'
            });
            
            if (slideData.imageDescription) {
              slide.addText("Description: " + slideData.imageDescription, { 
                x: 0.5, 
                y: 5, 
                w: 4, 
                h: 0.5,
                fontSize: 10,
                color: '#666666',
                italic: true
              });
            }
            
            if (slideData.bulletPoints && slideData.bulletPoints.length > 0) {
              slide.addText(convertToTextProps(slideData.bulletPoints), { 
                x: 5, 
                y: 1.8, 
                w: 4.5, 
                h: 5,
                fontSize: 16,
                bullet: true
              });
            }
            break;
            
          case 'quote':
            // Quote slide
            slide.addText(slideData.title, { 
              x: 0.5, 
              y: 0.5, 
              w: 9, 
              h: 1,
              fontSize: 36,
              bold: true
            });
            
            if (slideData.quote) {
              slide.addText('"' + slideData.quote + '"', { 
                x: 1, 
                y: 2, 
                w: 8, 
                h: 3,
                fontSize: 28,
                italic: true,
                align: 'center',
                valign: 'middle'
              });
            }
            
            if (slideData.attribution) {
              slide.addText(slideData.attribution, { 
                x: 1, 
                y: 5, 
                w: 8, 
                h: 0.5,
                fontSize: 18,
                align: 'center'
              });
            }
            break;
        }
      }
      
      // Add notes if they exist
      if (slideData.notes) {
        slide.addNotes(slideData.notes);
      }
      
      // Generate the PPTX as a string
      const pptxData = await pptx.writeFile();
      
      // Convert string to Blob
      const blob = new Blob([pptxData], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      // Switch to preview tab
      setActiveTab('preview');
      
      return blob;
    } catch (error) {
      console.error('Error generating preview:', error);
      return null;
    }
  };
  
  const handleSave = async () => {
    // Update slideData with custom elements if using custom layout
    if (slideData.layout === 'custom') {
      setSlideData({...slideData, elements: customElements as unknown as SlideElement[]});
    }
    
    // Generate the PPTX
    const pptxBlob = await generatePreview();
    
    if (pptxBlob) {
      // Convert the blob to a data URL for storage
      const reader = new FileReader();
      reader.readAsDataURL(pptxBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        // Save the slide data and the PPTX data
        onSave({
          slideData: slideData.layout === 'custom' 
            ? {...slideData, elements: customElements as unknown as SlideElement[]} 
            : slideData,
          pptxData: base64data,
          thumbnailUrl: previewUrl
        });
      };
    }
  };
  
  // Render the custom layout editor
  const renderCustomLayoutEditor = () => {
    return (
      <div className="custom-layout-editor">
        <div className="mb-4 flex space-x-2">
          <Button onClick={() => handleAddElement('title')} variant="outline" size="sm">
            Add Title
          </Button>
          <Button onClick={() => handleAddElement('text')} variant="outline" size="sm">
            Add Text
          </Button>
          <Button onClick={() => handleAddElement('bulletPoints')} variant="outline" size="sm">
            Add Bullet Points
          </Button>
          <Button onClick={() => handleAddElement('image')} variant="outline" size="sm">
            Add Image
          </Button>
          <Button onClick={() => handleAddElement('shape')} variant="outline" size="sm">
            Add Shape
          </Button>
        </div>
        
        <div className="bg-white text-black p-4 rounded" style={{ width: SLIDE_WIDTH + 'px', height: SLIDE_HEIGHT + 'px', margin: '0 auto' }}>
          <GridLayout
            className="layout"
            cols={12}
            rowHeight={30}
            width={SLIDE_WIDTH - 32} // Account for padding
            onLayoutChange={handleLayoutUpdate}
            compactType={null}
            preventCollision={false}
          >
            {customElements.map(element => (
              <div key={element.id} data-grid={{x: element.x, y: element.y, w: element.width, h: element.height, i: element.id}}>
                <div className="element-container relative border border-gray-300 p-2 h-full overflow-auto">
                  <button 
                    className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center"
                    onClick={() => handleRemoveElement(element.id)}
                  >
                    ×
                  </button>
                  
                  {element.type === 'title' && (
                    <Input 
                      value={element.content as string} 
                      onChange={(e) => handleElementChange(element.id, e.target.value)}
                      className="text-black text-2xl font-bold w-full"
                    />
                  )}
                  
                  {element.type === 'text' && (
                    <Textarea 
                      value={element.content as string} 
                      onChange={(e) => handleElementChange(element.id, e.target.value)}
                      className="text-black w-full h-full min-h-[50px]"
                    />
                  )}
                  
                  {element.type === 'bulletPoints' && (
                    <div className="bullet-points-editor">
                      {(element.content as string[]).map((point, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <span className="mr-2">•</span>
                          <Input 
                            value={point} 
                            onChange={(e) => {
                              const newPoints = [...(element.content as string[])];
                              newPoints[index] = e.target.value;
                              handleElementChange(element.id, newPoints);
                            }}
                            className="text-black flex-1"
                          />
                          <Button 
                            onClick={() => {
                              const newPoints = [...(element.content as string[])];
                              newPoints.splice(index, 1);
                              handleElementChange(element.id, newPoints);
                            }}
                            variant="ghost" 
                            size="sm"
                            className="ml-2"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      <Button 
                        onClick={() => {
                          const newPoints = [...(element.content as string[]), "New point"];
                          handleElementChange(element.id, newPoints);
                        }}
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                      >
                        Add Point
                      </Button>
                    </div>
                  )}
                  
                  {element.type === 'image' && (
                    <div className="image-placeholder flex items-center justify-center h-full bg-gray-100">
                      <div className="text-center">
                        <p className="text-gray-500">Image Placeholder</p>
                        <Input 
                          value={element.content as string} 
                          onChange={(e) => handleElementChange(element.id, e.target.value)}
                          className="text-black mt-2"
                          placeholder="Image description"
                        />
                      </div>
                    </div>
                  )}
                  
                  {element.type === 'shape' && (
                    <div className="shape-placeholder h-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white">Shape</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    );
  };
  
  // Render different form fields based on the selected layout
  const renderLayoutFields = () => {
    if (slideData.layout === 'custom') {
      return renderCustomLayoutEditor();
    }
    
    // Rest of the layout rendering code remains the same
    switch (slideData.layout) {
      case 'title':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input 
                value={slideData.title} 
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-black text-2xl font-bold"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Subtitle</label>
              <Input 
                value={slideData.subtitle || ''} 
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                className="text-black text-xl"
              />
            </div>
          </>
        );
        
      case 'content':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input 
                value={slideData.title} 
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-black text-2xl font-bold"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Bullet Points</label>
              {(slideData.bulletPoints || []).map((point, index) => (
                <div key={index} className="flex items-center mb-2">
                  <span className="mr-2">•</span>
                  <Input 
                    value={point} 
                    onChange={(e) => handleBulletPointChange('bulletPoints', index, e.target.value)}
                    className="text-black flex-1"
                  />
                  <Button 
                    onClick={() => handleRemoveBulletPoint('bulletPoints', index)}
                    variant="ghost" 
                    size="sm"
                    className="ml-2"
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button 
                onClick={() => handleAddBulletPoint('bulletPoints')}
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Add Bullet Point
              </Button>
            </div>
          </>
        );
        
      case 'twoColumn':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input 
                value={slideData.title} 
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-black text-2xl font-bold"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Left Column</label>
                {(slideData.columnOnePoints || []).map((point, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <span className="mr-2">•</span>
                    <Input 
                      value={point} 
                      onChange={(e) => handleBulletPointChange('columnOnePoints', index, e.target.value)}
                      className="text-black flex-1"
                    />
                    <Button 
                      onClick={() => handleRemoveBulletPoint('columnOnePoints', index)}
                      variant="ghost" 
                      size="sm"
                      className="ml-2"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button 
                  onClick={() => handleAddBulletPoint('columnOnePoints')}
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  Add Point
                </Button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Right Column</label>
                {(slideData.columnTwoPoints || []).map((point, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <span className="mr-2">•</span>
                    <Input 
                      value={point} 
                      onChange={(e) => handleBulletPointChange('columnTwoPoints', index, e.target.value)}
                      className="text-black flex-1"
                    />
                    <Button 
                      onClick={() => handleRemoveBulletPoint('columnTwoPoints', index)}
                      variant="ghost" 
                      size="sm"
                      className="ml-2"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button 
                  onClick={() => handleAddBulletPoint('columnTwoPoints')}
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  Add Point
                </Button>
              </div>
            </div>
          </>
        );
        
      case 'imageText':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input 
                value={slideData.title} 
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-black text-2xl font-bold"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Image Description</label>
                <div className="border-2 border-dashed border-gray-300 p-4 text-center bg-gray-100 rounded">
                  <p className="text-gray-500 mb-2">Image Placeholder</p>
                  <Textarea 
                    placeholder="Describe the image that should appear here"
                    value={slideData.imageDescription || ''} 
                    onChange={(e) => handleInputChange('imageDescription', e.target.value)}
                    className="text-black mt-2"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Text Points</label>
                {(slideData.bulletPoints || []).map((point, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <span className="mr-2">•</span>
                    <Input 
                      value={point} 
                      onChange={(e) => handleBulletPointChange('bulletPoints', index, e.target.value)}
                      className="text-black flex-1"
                    />
                    <Button 
                      onClick={() => handleRemoveBulletPoint('bulletPoints', index)}
                      variant="ghost" 
                      size="sm"
                      className="ml-2"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button 
                  onClick={() => handleAddBulletPoint('bulletPoints')}
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  Add Point
                </Button>
              </div>
            </div>
          </>
        );
        
      case 'quote':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input 
                value={slideData.title} 
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-black text-2xl font-bold"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Quote</label>
              <Textarea 
                value={slideData.quote || ''} 
                onChange={(e) => handleInputChange('quote', e.target.value)}
                className="text-black text-xl italic"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Attribution</label>
              <Input 
                value={slideData.attribution || ''} 
                onChange={(e) => handleInputChange('attribution', e.target.value)}
                className="text-black"
                placeholder="- Author Name"
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="structured-slide-editor">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit">
          <Card>
            <CardContent className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Slide Layout</label>
                <Select value={slideData.layout} onValueChange={handleLayoutChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a layout" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.map(layout => (
                      <SelectItem key={layout.id} value={layout.id}>
                        {layout.name} - {layout.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="slide-container overflow-auto" style={{ 
                maxWidth: '100%',
                margin: '0 auto',
                border: '1px solid #ccc',
                backgroundColor: 'white',
                color: 'black',
                padding: slideData.layout === 'custom' ? '0' : '20px',
                position: 'relative'
              }}>
                <div className="slide-editor">
                  {renderLayoutFields()}
                  
                  {slideData.layout !== 'custom' && (
                    <div className="mb-4 mt-6">
                      <label className="block text-sm font-medium mb-1">Presenter Notes (optional)</label>
                      <Textarea 
                        value={slideData.notes || ''} 
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="text-black"
                        rows={3}
                        placeholder="Add notes for the presenter (not visible on the slide)"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardContent className="p-4">
              {previewUrl ? (
                <div className="preview-container text-center">
                  <p className="mb-2 text-sm text-gray-400">Preview of PowerPoint slide</p>
                  <div className="preview-frame" style={{ 
                    width: SLIDE_WIDTH + 'px', 
                    height: SLIDE_HEIGHT + 'px', 
                    margin: '0 auto', 
                    border: '1px solid #ccc',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <a href={previewUrl} download="preview.pptx" className="text-blue-500 hover:underline">
                      Download Preview
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p>No preview available. Generate a preview first.</p>
                  <Button onClick={generatePreview} variant="outline" className="mt-2">
                    Generate Preview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between mt-4">
        <Button onClick={generatePreview} variant="outline">
          Generate Preview
        </Button>
        <Button onClick={handleSave} variant="default">
          Save Template
        </Button>
      </div>
    </div>
  );
} 