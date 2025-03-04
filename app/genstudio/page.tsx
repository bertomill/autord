'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import TemplatePreview from './components/TemplatePreview';

// Define interfaces for updates
interface Update {
  id?: string;
  userId: string;
  companySymbol?: string;
  companyName?: string;
  title: string;
  content: string;
  date: Timestamp;
  type: 'earnings' | 'news' | 'filing' | 'note' | 'general';
  isGeneral: boolean;
  link?: string;
}

// Define the SlideTemplate interface
interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  layout: string;
  format: {
    layout: string;
    numPoints: number;
    includeSupportingData: boolean;
    includeConclusion: boolean;
    visualStyle: string;
  };
  createdAt: string;
  thumbnailUrl?: string;
}

// Define prebuilt templates
const prebuiltTemplates: SlideTemplate[] = [
  {
    id: 'one-slide-presentation',
    name: 'One-Slide Presentation',
    description: 'Standard one-slide presentation with key points',
    layout: 'two-column',
    format: {
      layout: 'two-column',
      numPoints: 4,
      includeSupportingData: true,
      includeConclusion: true,
      visualStyle: 'corporate'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'research-summary',
    name: 'Research Summary',
    description: 'Summarize research findings in a clean format',
    layout: 'single-column',
    format: {
      layout: 'single-column',
      numPoints: 5,
      includeSupportingData: false,
      includeConclusion: true,
      visualStyle: 'minimal'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'comparison-slide',
    name: 'Comparison',
    description: 'Compare two topics side by side',
    layout: 'comparison',
    format: {
      layout: 'comparison',
      numPoints: 6,
      includeSupportingData: true,
      includeConclusion: true,
      visualStyle: 'academic'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'timeline-slide',
    name: 'Timeline',
    description: 'Present events in chronological order',
    layout: 'timeline',
    format: {
      layout: 'timeline',
      numPoints: 4,
      includeSupportingData: true,
      includeConclusion: false,
      visualStyle: 'creative'
    },
    createdAt: new Date().toISOString()
  }
];

export default function GenStudioPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('one-slide-presentation');
  const [selectedModel, setSelectedModel] = useState('sonar-deep-research');
  const [includeResearch, setIncludeResearch] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('select-research');
  const [editedContent, setEditedContent] = useState('');
  const [userFeedback, setUserFeedback] = useState('');
  const [userTemplates, setUserTemplates] = useState<SlideTemplate[]>([]);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateFormat, setNewTemplateFormat] = useState({
    layout: 'two-column',
    numPoints: 5,
    includeSupportingData: true,
    includeConclusion: true,
    visualStyle: 'corporate'
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SlideTemplate | null>(null);
  const [citations, setCitations] = useState<string[]>([]);

  // System prompts for content generation
  const systemPrompts = [
    {
      id: 'default',
      name: 'Default Research Assistant',
      prompt: 'You are a helpful research assistant. Provide well-structured, comprehensive responses based on the available information. Include relevant facts and data when available.'
    },
    {
      id: 'detailed',
      name: 'Detailed Analysis',
      prompt: 'You are an expert analyst providing in-depth analysis. Structure your response with clear sections, bullet points where appropriate, and ensure comprehensive coverage of the topic. Include nuanced perspectives and detailed explanations.'
    },
    {
      id: 'concise',
      name: 'Concise Summary',
      prompt: 'You are a concise summarizer. Provide brief, clear summaries that capture the essential points without unnecessary details. Focus on clarity and brevity while ensuring all key information is included.'
    },
    {
      id: 'json-output',
      name: 'JSON Output',
      prompt: `You are a JSON generator. You MUST ONLY output valid JSON. DO NOT include any explanations, markdown formatting, or text outside the JSON object. DO NOT use markdown code blocks. DO NOT include any XML tags. Your entire response must be a single, valid, parseable JSON object and nothing else.

If you're asked to create a presentation slide, you must return a JSON object with the appropriate fields as specified in the prompt. This is critical: your response will be directly parsed as JSON by a machine, so any text outside the JSON object will cause errors.

IMPORTANT: You MUST include a "references" array in your JSON with each reference containing "id", "title", "url", and optionally "date" fields. For example:

"references": [
  {
    "id": "1",
    "title": "Source Title 1",
    "url": "https://example.com/source1",
    "date": "January 1, 2025"
  },
  {
    "id": "2",
    "title": "Source Title 2",
    "url": "https://example.com/source2",
    "date": "February 1, 2025"
  }
]

When citing sources in your content, use the reference id in square brackets, like [1] or [2].

For each reference cited in the content, you MUST provide a corresponding entry in the references array with a valid URL. If you don't know the exact URL, make a reasonable guess based on the source name and content.`
    },
    {
      id: 'custom',
      name: 'Custom Prompt',
      prompt: ''
    }
  ];

  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState('default');

  // Models for content generation
  const models = [
    { id: 'sonar-deep-research', name: 'Sonar Deep Research (128k)', description: 'Optimized for in-depth research tasks' },
    { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro (128k)', description: 'Enhanced reasoning capabilities' },
    { id: 'sonar-reasoning', name: 'Sonar Reasoning (128k)', description: 'Strong reasoning and analysis' },
    { id: 'sonar-pro', name: 'Sonar Pro (200k)', description: 'Largest context window (200k)' },
    { id: 'sonar', name: 'Sonar (128k)', description: 'General purpose model' },
    { id: 'r1-1776', name: 'R1-1776 (128k)', description: 'Alternative model architecture' }
  ];

  // Fetch saved updates from Firebase
  useEffect(() => {
    const fetchUpdates = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Create a query against the updates collection
        const updatesRef = collection(db, 'updates');
        const q = query(
          updatesRef,
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        // Execute the query
        const querySnapshot = await getDocs(q);
        
        // Map the documents to our Update interface
        const fetchedUpdates: Update[] = [];
        querySnapshot.forEach((doc) => {
          fetchedUpdates.push({
            id: doc.id,
            ...doc.data() as Omit<Update, 'id'>
          });
        });
        
        setUpdates(fetchedUpdates);
      } catch (error) {
        console.error('Error fetching updates:', error);
        setUpdates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpdates();
  }, [user]);

  useEffect(() => {
    const loadedUserTemplates = localStorage.getItem('userSlideTemplates');
    if (loadedUserTemplates) {
      setUserTemplates(JSON.parse(loadedUserTemplates));
    }
  }, []);

  const handleSystemPromptChange = (promptId: string) => {
    setSelectedSystemPrompt(promptId);
    if (promptId !== 'custom') {
      const selectedPrompt = systemPrompts.find(p => p.id === promptId);
      if (selectedPrompt) {
        setSystemPrompt(selectedPrompt.prompt);
      }
    } else {
      setSystemPrompt('');
    }
  };

  const handleUpdateSelection = (updateId: string) => {
    setSelectedUpdates(prev => {
      if (prev.includes(updateId)) {
        return prev.filter(id => id !== updateId);
      } else {
        return [...prev, updateId];
      }
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setApiError(null);
    
    try {
      console.log("Starting content generation...");
      
      // Add client-side timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout to match server-side
      
      // Get the selected template format
      const template = [...prebuiltTemplates, ...userTemplates].find(t => t.id === selectedTemplate);
      
      // Get the system prompt content
      let systemPromptContent = '';
      if (selectedSystemPrompt === 'custom') {
        systemPromptContent = systemPrompt;
      } else {
        const selectedPromptObj = systemPrompts.find(p => p.id === selectedSystemPrompt);
        if (selectedPromptObj) {
          systemPromptContent = selectedPromptObj.prompt;
        }
      }
      
      // Construct the user message with research context if selected
      let userMessage = prompt;
      
      // Add a reminder about references
      userMessage += "\n\nIMPORTANT: Include complete references with URLs for all sources cited in your response. Each reference should have an id, title, url, and date (if available).";
      
      // Limit the number of research items to prevent timeouts
      const limitedSelectedUpdates = selectedUpdates.slice(0, 3); // Limit to 3 research items
      
      // Add selected research to the prompt if there are selected updates
      if (limitedSelectedUpdates.length > 0) {
        userMessage += "\n\nHere is some research to consider:\n\n";
        
        updates
          .filter(update => update.id && limitedSelectedUpdates.includes(update.id as string))
          .forEach((update, index) => {
            // Limit the content length for each research item
            const limitedContent = update.content.length > 1000 
              ? update.content.substring(0, 1000) + "..." 
              : update.content;
              
            userMessage += `--- Source [${index + 1}]: ${update.title} ---\n${limitedContent}\n`;
            if (update.link) {
              userMessage += `URL: ${update.link}\n`;
            }
            userMessage += "\n";
          });
          
        // If we limited the research items, let the user know
        if (limitedSelectedUpdates.length < selectedUpdates.length) {
          userMessage += `\n(Note: Only using ${limitedSelectedUpdates.length} of ${selectedUpdates.length} selected research items to prevent timeout.)\n`;
        }
      }
      
      // Add template information to the prompt
      if (template) {
        userMessage += `\n\nPlease format the response according to this template: ${template.name}. `;
        userMessage += `This is a ${template.layout} layout with the following format: ${JSON.stringify(template.format)}.`;
      }
      
      // Make the API request
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: userMessage,
          systemPrompt: systemPromptContent,
          selectedUpdates: limitedSelectedUpdates.map(id => {
            const update = updates.find(u => u.id === id);
            return update ? `${update.title}: ${update.content.substring(0, 1000)}...` : '';
          }).filter(Boolean),
          forceJsonOutput: selectedSystemPrompt === 'json-output',
          slideFormat: template?.format
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log("API response status:", response.status);
      
      // Check for non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error(`Received non-JSON response: ${textResponse.substring(0, 100)}...`);
      }
      
      const data = await response.json();
      console.log("Response data received:", Object.keys(data));
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Process the response
      const content = data.content;
      setGeneratedContent(content);
      
      // IMPORTANT: Also set the editedContent state with the generated content
      setEditedContent(content);
      
      // Store citations if they exist
      setCitations(data.citations || []);
      
      // Move to the review tab
      setActiveTab('review-content');
    } catch (error: unknown) {
      console.error("Error generating content:", error);
      
      // Provide user-friendly error message
      if (error instanceof Error && error.name === "AbortError") {
        setApiError("Request timed out. Try using a shorter prompt or fewer research items.");
      } else if (error instanceof Error && error.message.includes("SyntaxError")) {
        setApiError("Received invalid response format. This might be due to a service timeout or error.");
      } else if (error instanceof Error && error.message.includes("ERR_BLOCKED_BY_CLIENT")) {
        setApiError("Your browser or an extension (like an ad blocker) is blocking Firestore requests. Please disable ad blockers for this site and try again.");
      } else {
        setApiError(`Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to handle moving to the next step
  const handleNextStep = () => {
    if (activeTab === 'select-research') {
      setActiveTab('configure-generation');
    } else if (activeTab === 'configure-generation') {
      handleGenerate();
    } else if (activeTab === 'review-content') {
      if (editedContent.trim()) {
        setActiveTab('finalize');
      } else {
        setApiError('No content to finalize. Please generate content first.');
      }
    }
  };

  // Function to handle moving to the previous step
  const handlePrevStep = () => {
    if (activeTab === 'configure-generation') {
      setActiveTab('select-research');
    } else if (activeTab === 'review-content') {
      setActiveTab('configure-generation');
    } else if (activeTab === 'finalize') {
      setActiveTab('review-content');
    }
  };

  // Function to select a template
  const selectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Find the template in either prebuilt or user templates
    const template = [...prebuiltTemplates, ...userTemplates].find(t => t.id === templateId);
    if (template) {
      // Update your existing state with the template format
      console.log('Selected template:', template);
      
      // If you have a slideFormat state, update it
      // setSlideFormat(template.format);
    }
  };

  // Function to save a new template
  const saveNewTemplate = () => {
    if (!newTemplateName.trim()) return;
    
    // Create a new template object
    const newTemplate: SlideTemplate = {
      id: `user-template-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim(),
      layout: newTemplateFormat.layout,
      format: { ...newTemplateFormat },
      createdAt: new Date().toISOString()
    };
    
    // Add to user templates
    const updatedTemplates = [...userTemplates, newTemplate];
    setUserTemplates(updatedTemplates);
    
    // Save to localStorage
    localStorage.setItem('userSlideTemplates', JSON.stringify(updatedTemplates));
    
    // Select the new template
    setSelectedTemplate(newTemplate.id);
    
    // Close the modal and reset fields
    setShowCreateTemplateModal(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
  };

  // Function to delete a user template
  const deleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = userTemplates.filter(t => t.id !== templateId);
      setUserTemplates(updatedTemplates);
      localStorage.setItem('userSlideTemplates', JSON.stringify(updatedTemplates));
      
      // If the deleted template was selected, select the first available template
      if (selectedTemplate === templateId) {
        if (prebuiltTemplates.length > 0) {
          selectTemplate(prebuiltTemplates[0].id);
        } else if (updatedTemplates.length > 0) {
          selectTemplate(updatedTemplates[0].id);
        }
      }
    }
  };

  const openPreview = (template: SlideTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const handleTemplateClick = (template: SlideTemplate) => {
    if (selectedTemplate === template.id) {
      // If already selected, show preview
      openPreview(template);
    } else {
      // Otherwise, select the template
      selectTemplate(template.id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">GenStudio</h1>
      <p className="text-gray-400 mb-6">Generate content based on your research using AI with web search capabilities</p>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-[#333]">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'select-research' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('select-research')}
          >
            1. Select Research
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'configure-generation' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('configure-generation')}
          >
            2. Configure Generation
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'review-content' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => generatedContent ? setActiveTab('review-content') : null}
            disabled={!generatedContent}
            style={{ opacity: !generatedContent ? 0.5 : 1, cursor: !generatedContent ? 'not-allowed' : 'pointer' }}
          >
            3. Review & Edit
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'finalize' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('finalize')}
            disabled={!generatedContent}
          >
            4. Finalize
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        {/* Step 1: Select Research */}
        {activeTab === 'select-research' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Research Updates</h2>
            <p className="text-gray-400 mb-4">Choose the research updates you want to include in your generated content.</p>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : updates.length === 0 ? (
              <div className="bg-[#222] rounded-md p-4 text-center">
                <p className="text-gray-400">No updates found. Add updates in the Updates section to include them in your content generation.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {updates.map(update => update.id && (
                  <div 
                    key={update.id}
                    className={`p-4 rounded-md border ${
                      selectedUpdates.includes(update.id as string) 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-[#333] bg-[#0f0f0f]'
                    } hover:border-blue-400 transition-colors cursor-pointer`}
                    onClick={() => handleUpdateSelection(update.id as string)}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id={`update-${update.id}`}
                        checked={selectedUpdates.includes(update.id as string)}
                        onChange={() => handleUpdateSelection(update.id as string)}
                        className="mt-1 rounded bg-[#0f0f0f] border-[#333]"
                      />
                      <label htmlFor={`update-${update.id}`} className="ml-3 flex-1 cursor-pointer">
                        <div className="font-medium">{update.title}</div>
                        <div className="text-sm text-[#94a3b8] mt-1 line-clamp-2">{update.content}</div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-[#666]">{formatDate(update.date)}</span>
                          {update.companyName && (
                            <span className="text-xs bg-[#333] px-2 py-0.5 rounded-full">{update.companyName}</span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-between">
              <div>
                <span className="text-sm text-gray-400">
                  {selectedUpdates.length} update{selectedUpdates.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <button
                onClick={handleNextStep}
                disabled={selectedUpdates.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
              >
                Next: Configure Generation
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Configure Generation */}
        {activeTab === 'configure-generation' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Configure Content Generation</h2>
            <p className="text-gray-400 mb-4">Select a template and configure generation settings.</p>
            
            {/* Add Selected Research Preview */}
            {selectedUpdates.length > 0 && (
              <div className="mb-6 bg-[#222] border border-[#333] rounded-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Selected Research ({selectedUpdates.length})</h3>
                  <button 
                    onClick={() => setActiveTab('select-research')}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Edit Selection
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {updates
                    .filter(update => update.id && selectedUpdates.includes(update.id as string))
                    .map(update => (
                      <div key={update.id} className="flex items-start p-2 bg-[#1a1a1a] rounded-md">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                        <div className="ml-2 flex-1 overflow-hidden">
                          <div className="font-medium text-sm truncate">{update.title}</div>
                          <div className="text-xs text-gray-400 truncate">{update.content.substring(0, 100)}{update.content.length > 100 ? '...' : ''}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Templates</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Prebuilt Templates */}
                {prebuiltTemplates.map(template => (
                  <div 
                    key={template.id}
                    className={`bg-[#222] border ${selectedTemplate === template.id ? 'border-blue-500' : 'border-[#333]'} 
                               hover:border-blue-500 rounded-md overflow-hidden cursor-pointer transition-colors`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="aspect-video bg-[#1a1a1a] flex items-center justify-center">
                      <div className="w-full h-full">
                        <TemplatePreview template={template} />
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-400">{template.description}</p>
                    </div>
                  </div>
                ))}
                
                {/* User-created Templates */}
                {userTemplates.map(template => (
                  <div 
                    key={template.id}
                    className={`bg-[#222] border ${selectedTemplate === template.id ? 'border-blue-500' : 'border-[#333]'} 
                               hover:border-blue-500 rounded-md overflow-hidden cursor-pointer transition-colors`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="aspect-video bg-[#1a1a1a] flex items-center justify-center">
                      <div className="w-full h-full">
                        <TemplatePreview template={template} />
                      </div>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-400">Custom</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="Delete template"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Create New Template Button */}
                <div 
                  className="bg-[#222] border border-dashed border-[#444] hover:border-blue-500 rounded-md overflow-hidden cursor-pointer transition-colors flex flex-col items-center justify-center aspect-video"
                  onClick={() => setShowCreateTemplateModal(true)}
                >
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="mt-2 text-sm text-gray-400">Create New Template</span>
                </div>
              </div>
              
              {/* After selecting a template, show the prompt field */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white h-32"
                  placeholder="Enter your prompt here..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Settings</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Model
                  </label>
                  <div className="bg-[#222] border border-[#333] rounded-md">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-transparent border-0 px-3 py-2 text-white focus:ring-0 focus:outline-none"
                    >
                      {models.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Add model description */}
                  <div className="mt-1 text-xs text-gray-400">
                    {models.find(m => m.id === selectedModel)?.description}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeResearch}
                      onChange={(e) => setIncludeResearch(e.target.checked)}
                      className="rounded bg-[#2a2a2a] border-[#333]"
                    />
                    <span className="ml-2 text-gray-300">Include web research (Perplexity API)</span>
                  </label>
                </div>
                
                <div className="mb-4">
                  <button
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    {showAdvancedOptions ? '- Hide' : '+ Show'} Advanced Options
                  </button>
                </div>
                
                {showAdvancedOptions && (
                  <div className="mt-4 p-4 bg-[#222] rounded-md border border-[#333]">
                    <h4 className="font-medium mb-2">System Prompt</h4>
                    
                    <div className="space-y-2 mb-3">
                      {systemPrompts.map(prompt => (
                        <label key={prompt.id} className="flex items-center">
                          <input
                            type="radio"
                            name="systemPrompt"
                            value={prompt.id}
                            checked={selectedSystemPrompt === prompt.id}
                            onChange={() => handleSystemPromptChange(prompt.id)}
                            className="rounded-full bg-[#2a2a2a] border-[#333]"
                          />
                          <span className="ml-2 text-gray-300">{prompt.name}</span>
                        </label>
                      ))}
                    </div>
                    
                    {selectedSystemPrompt === 'custom' && (
                      <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white h-32"
                        placeholder="Enter custom system prompt..."
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={handlePrevStep}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Content'
                )}
              </button>
            </div>
            
            {apiError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded-md text-red-400">
                {apiError}
              </div>
            )}
          </div>
        )}
        
        {/* Step 3: Review & Edit */}
        {activeTab === 'review-content' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Review & Edit Content</h2>
            <p className="text-gray-400 mb-4">Review the generated content and make any necessary edits.</p>
            
            <div className="mb-4">
              <textarea
                value={editedContent || generatedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white h-96 font-mono"
                placeholder={generatedContent ? "" : "No content has been generated yet. Please go back to the Configure Generation step and generate content."}
              />
            </div>
            
            {/* Display Citations */}
            {citations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-2">Sources & References</h3>
                <div className="bg-[#2a2a2a] border border-[#333] rounded p-3">
                  <ul className="list-disc pl-5 space-y-1">
                    {citations.map((citation, index) => (
                      <li key={index} className="text-blue-400 hover:text-blue-300">
                        <a 
                          href={citation} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="break-all"
                        >
                          {citation}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Feedback for Improvement (Optional)
              </label>
              <textarea
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white h-24"
                placeholder="What would you like to improve about this content? This feedback will help us enhance future generations."
              />
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={handlePrevStep}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Next: Finalize
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Finalize */}
        {activeTab === 'finalize' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Finalize Content</h2>
            <p className="text-gray-400 mb-4">Your content is ready to use. You can download it or copy it to your clipboard.</p>
            
            <div className="mb-6 bg-[#222] border border-[#333] rounded-md p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 overflow-auto max-h-96">
                {editedContent}
              </pre>
            </div>
            
            {/* Display References if available */}
            {(() => {
              try {
                const contentObj = JSON.parse(editedContent);
                if (contentObj.references && contentObj.references.length > 0) {
                  return (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">References</h3>
                      <div className="bg-[#222] border border-[#333] rounded-md p-4">
                        <ul className="list-disc pl-5 space-y-2">
                          {contentObj.references.map((ref: { id: string; title: string; url?: string; date?: string }, index: number) => (
                            <li key={index} className="text-gray-300">
                              [{ref.id}] <span className="font-medium">{ref.title}</span>
                              {ref.url && (
                                <> - <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{ref.url}</a></>
                              )}
                              {ref.date && <span className="text-gray-500 ml-2">({ref.date})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(editedContent);
                  // Show a toast or some feedback
                  alert('Content copied to clipboard!');
                }}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy to Clipboard
              </button>
              
              <button
                onClick={() => {
                  // Logic to download as JSON
                  const blob = new Blob([editedContent], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'generated-content.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON
              </button>
              
              {/* Add more export options as needed */}
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={handlePrevStep}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  // Reset the form and go back to the first step
                  setPrompt('');
                  setGeneratedContent('');
                  setEditedContent('');
                  setUserFeedback('');
                  setSelectedUpdates([]);
                  setActiveTab('select-research');
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Start New Generation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-4xl w-full">
            <h3 className="text-xl font-semibold mb-4">Create New Template</h3>
            
            <div className="flex gap-6">
              <div className="w-1/2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white"
                    placeholder="Enter a name for this template"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white h-20"
                    placeholder="Describe what this template is for"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Layout
                  </label>
                  <select
                    value={newTemplateFormat.layout}
                    onChange={(e) => setNewTemplateFormat({...newTemplateFormat, layout: e.target.value})}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white"
                  >
                    <option value="two-column">Two Column</option>
                    <option value="single-column">Single Column</option>
                    <option value="comparison">Comparison</option>
                    <option value="timeline">Timeline</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Visual Style
                  </label>
                  <select
                    value={newTemplateFormat.visualStyle}
                    onChange={(e) => setNewTemplateFormat({...newTemplateFormat, visualStyle: e.target.value})}
                    className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="corporate">Corporate</option>
                    <option value="academic">Academic</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
              </div>
              
              <div className="w-1/2">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Preview
                  </label>
                </div>
                
                <div className="border border-[#333] rounded-md overflow-hidden bg-[#222] aspect-video">
                  <TemplatePreview 
                    template={{
                      id: 'preview',
                      name: newTemplateName || 'New Template',
                      layout: newTemplateFormat.layout,
                      format: newTemplateFormat
                    }} 
                  />
                </div>
                
                <div className="mt-4 text-xs text-gray-400">
                  This preview shows how your template will appear. The actual content will be generated based on your prompt and selected research.
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTemplateModal(false)}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveNewTemplate}
                disabled={!newTemplateName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-5xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{previewTemplate.name}</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-2 text-sm text-gray-400">
              {previewTemplate.description}
            </div>
            
            <div className="border border-[#333] rounded-md overflow-hidden bg-[#222] aspect-video mb-4">
              <TemplatePreview template={previewTemplate} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#222] border border-[#333] rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Layout</h4>
                <p className="text-sm text-gray-400">{previewTemplate.layout}</p>
                
                <h4 className="text-sm font-medium mt-3 mb-2">Content Structure</h4>
                <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
                  {previewTemplate.layout === 'two-column' && (
                    <>
                      <li>Left column: Key points with bullet points</li>
                      <li>Right column: Visual representation or supporting data</li>
                      <li>Title at the top with optional subtitle</li>
                    </>
                  )}
                  {previewTemplate.layout === 'single-column' && (
                    <>
                      <li>Centered title and content</li>
                      <li>Sequential information flow</li>
                      <li>Clean, focused presentation of ideas</li>
                    </>
                  )}
                  {previewTemplate.layout === 'comparison' && (
                    <>
                      <li>Side-by-side comparison of two topics</li>
                      <li>Parallel structure for easy comparison</li>
                      <li>Highlights similarities and differences</li>
                    </>
                  )}
                  {previewTemplate.layout === 'timeline' && (
                    <>
                      <li>Chronological presentation of events</li>
                      <li>Visual timeline with key milestones</li>
                      <li>Shows progression and development</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="bg-[#222] border border-[#333] rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Visual Style</h4>
                <p className="text-sm text-gray-400">{previewTemplate.format.visualStyle}</p>
                
                <h4 className="text-sm font-medium mt-3 mb-2">Best Used For</h4>
                <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
                  {previewTemplate.layout === 'two-column' && (
                    <>
                      <li>Executive summaries</li>
                      <li>Key findings presentations</li>
                      <li>Data-supported arguments</li>
                    </>
                  )}
                  {previewTemplate.layout === 'single-column' && (
                    <>
                      <li>Research summaries</li>
                      <li>Focused topic exploration</li>
                      <li>Narrative presentations</li>
                    </>
                  )}
                  {previewTemplate.layout === 'comparison' && (
                    <>
                      <li>Product comparisons</li>
                      <li>Competing theories or approaches</li>
                      <li>Before/after scenarios</li>
                    </>
                  )}
                  {previewTemplate.layout === 'timeline' && (
                    <>
                      <li>Historical developments</li>
                      <li>Project roadmaps</li>
                      <li>Evolution of concepts</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
              <button
                onClick={() => {
                  selectTemplate(previewTemplate.id);
                  setShowPreviewModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 