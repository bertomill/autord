'use client';

import { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import StructuredSlideEditor from '../components/StructuredSlideEditor';

interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'list' | 'image';
  defaultValue?: string | number | string[];
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
}

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  variables: TemplateVariable[];
  slideData?: SlideData;
  pptxData?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('slideTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      // Set example templates if none exist
      setTemplates(exampleTemplates);
      localStorage.setItem('slideTemplates', JSON.stringify(exampleTemplates));
    }
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('slideTemplates', JSON.stringify(templates));
    }
  }, [templates]);

  const handleCreateTemplate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateVariables([]);
  };

  const handleEditTemplate = (template: Template) => {
    setIsCreating(false);
    setIsEditing(true);
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setTemplateVariables([...template.variables]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleSaveTemplate = (data: { slideData: SlideData; pptxData: string; thumbnailUrl: string }) => {
    const newTemplate: Template = {
      id: isEditing && selectedTemplate ? selectedTemplate.id : `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      variables: templateVariables,
      slideData: data.slideData,
      pptxData: data.pptxData,
      thumbnailUrl: data.thumbnailUrl,
      createdAt: isEditing && selectedTemplate ? selectedTemplate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isEditing && selectedTemplate) {
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? newTemplate : t));
    } else {
      setTemplates([...templates, newTemplate]);
    }

    setIsCreating(false);
    setIsEditing(false);
  };

  const handleAddVariable = () => {
    const newVariable: TemplateVariable = {
      id: `var-${Date.now()}`,
      name: 'New Variable',
      description: 'Description',
      type: 'text'
    };
    setTemplateVariables([...templateVariables, newVariable]);
  };

  const handleUpdateVariable = (index: number, field: keyof TemplateVariable, value: string | number | string[]) => {
    const updatedVariables = [...templateVariables];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    setTemplateVariables(updatedVariables);
  };

  const handleRemoveVariable = (index: number) => {
    setTemplateVariables(templateVariables.filter((_, i) => i !== index));
  };

  // If user is creating or editing a template, show the template editor
  if (isCreating || isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Template' : 'Create New Template'}</h1>
        
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Template Name</label>
            <Input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full bg-[#333] text-white"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Description</label>
            <Textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="w-full bg-[#333] text-white"
              rows={3}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Variables</label>
            {templateVariables.map((variable, index) => (
              <div key={variable.id} className="flex items-center gap-2 mb-2 p-2 bg-[#222] rounded">
                <Input
                  type="text"
                  value={variable.name}
                  onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                  className="flex-1 bg-[#333] text-white"
                  placeholder="Variable name"
                />
                <select
                  value={variable.type}
                  onChange={(e) => handleUpdateVariable(index, 'type', e.target.value as 'text' | 'number' | 'list' | 'image')}
                  className="bg-[#333] text-white p-2 rounded"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="list">List</option>
                  <option value="image">Image</option>
                </select>
                <Button
                  onClick={() => handleRemoveVariable(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              onClick={handleAddVariable}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Add Variable
            </Button>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Slide Designer</h2>
            <div className="slide-designer-container">
              <StructuredSlideEditor 
                initialData={selectedTemplate?.slideData} 
                onSave={handleSaveTemplate} 
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the templates gallery
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PowerPoint Templates</h1>
        <Button
          onClick={handleCreateTemplate}
          variant="default"
        >
          Create Template
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="bg-[#1a1a1a] border-gray-700 overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              {template.thumbnailUrl ? (
                <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl">{template.name}</span>
              )}
            </div>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-xs">
                {template.variables.length} variables • Last updated: {new Date(template.updatedAt).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                onClick={() => handleEditTemplate(template)}
                variant="ghost"
                className="text-blue-400 hover:text-blue-300"
              >
                Edit
              </Button>
              <Button
                onClick={() => handleDeleteTemplate(template.id)}
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No templates found. Create your first template to get started.</p>
          <Button
            onClick={handleCreateTemplate}
            variant="default"
          >
            Create Template
          </Button>
        </div>
      )}
    </div>
  );
}

// Example templates
const exampleTemplates: Template[] = [
  {
    id: 'one-slide-presentation',
    name: 'One-Slide Presentation',
    description: 'A single slide that summarizes research findings',
    thumbnailUrl: '/templates/one-slide-thumbnail.png',
    variables: [
      { id: 'title', name: 'Title', description: 'Main headline of the slide', type: 'text', defaultValue: 'Research Summary' },
      { id: 'subtitle', name: 'Subtitle', description: 'Optional subtitle or tagline', type: 'text' },
      { id: 'mainPoints', name: 'Main Points', description: 'Key points with supporting data', type: 'list' },
      { id: 'conclusion', name: 'Conclusion', description: 'Brief concluding statement', type: 'text' },
      { id: 'visualSuggestion', name: 'Visual Element', description: 'Description of visual element', type: 'text' }
    ],
    slideData: {
      layout: 'content',
      title: 'Research Summary',
      subtitle: 'Key Findings and Insights',
      bulletPoints: ['Key finding 1', 'Key finding 2', 'Key finding 3'],
      notes: 'Present this slide as an overview of the research findings.'
    },
    createdAt: '2023-12-01T12:00:00Z',
    updatedAt: '2023-12-15T09:30:00Z'
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'A slide for executive summary presentations',
    thumbnailUrl: '/templates/executive-summary-thumbnail.png',
    variables: [
      { id: 'title', name: 'Title', description: 'Main title of the presentation', type: 'text', defaultValue: 'Executive Summary' },
      { id: 'introduction', name: 'Introduction', description: 'Brief introduction to the topic', type: 'text' },
      { id: 'keyFindings', name: 'Key Findings', description: 'List of key findings from the research', type: 'list' },
      { id: 'recommendations', name: 'Recommendations', description: 'List of recommendations based on findings', type: 'list' },
      { id: 'conclusion', name: 'Conclusion', description: 'Summary of the findings and implications', type: 'text' }
    ],
    slideData: {
      layout: 'twoColumn',
      title: 'Executive Summary',
      columnOnePoints: ['Finding 1', 'Finding 2', 'Finding 3'],
      columnTwoPoints: ['Recommendation 1', 'Recommendation 2', 'Recommendation 3'],
      notes: 'This slide presents the key findings and recommendations side by side.'
    },
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-20T14:45:00Z'
  }
];
