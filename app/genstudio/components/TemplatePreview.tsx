import React from 'react';

interface TemplatePreviewProps {
  template: {
    id: string;
    name: string;
    layout: string;
    format: {
      layout: string;
      visualStyle: string;
    };
  };
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template }) => {
  // Render different preview layouts based on template type
  switch (template.layout) {
    case 'two-column':
      return (
        <div className="w-full h-full flex flex-col">
          <div className="bg-gray-700 h-10 flex items-center px-3">
            <div className="bg-gray-500 w-40 h-4 rounded"></div>
          </div>
          <div className="flex-1 flex">
            <div className="w-1/2 p-3 border-r border-gray-700">
              <div className="bg-gray-600 w-full h-4 rounded mb-3"></div>
              <div className="bg-gray-600 w-3/4 h-4 rounded mb-6"></div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-blue-500 w-2 h-2 rounded-full mt-1 mr-2"></div>
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 w-2 h-2 rounded-full mt-1 mr-2"></div>
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 w-2 h-2 rounded-full mt-1 mr-2"></div>
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                </div>
              </div>
            </div>
            <div className="w-1/2 p-3 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center">
                <div className="text-xs text-gray-400">Visual</div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'single-column':
      return (
        <div className="w-full h-full flex flex-col">
          <div className="bg-gray-700 h-10 flex items-center px-3">
            <div className="bg-gray-500 w-40 h-4 rounded"></div>
          </div>
          <div className="flex-1 p-3">
            <div className="bg-gray-600 w-3/4 h-4 rounded mb-3 mx-auto"></div>
            <div className="bg-gray-600 w-1/2 h-4 rounded mb-6 mx-auto"></div>
            
            <div className="max-w-md mx-auto space-y-3">
              <div className="bg-gray-600 w-full h-3 rounded"></div>
              <div className="bg-gray-600 w-full h-3 rounded"></div>
              <div className="bg-gray-600 w-full h-3 rounded"></div>
              <div className="bg-gray-600 w-full h-3 rounded"></div>
              <div className="bg-gray-600 w-3/4 h-3 rounded"></div>
            </div>
            
            <div className="mt-6 mx-auto w-40 h-4 bg-gray-600 rounded"></div>
          </div>
        </div>
      );
      
    case 'comparison':
      return (
        <div className="w-full h-full flex flex-col">
          <div className="bg-gray-700 h-10 flex items-center px-3">
            <div className="bg-gray-500 w-40 h-4 rounded"></div>
          </div>
          <div className="flex-1 p-3">
            <div className="bg-gray-600 w-3/4 h-4 rounded mb-6 mx-auto"></div>
            
            <div className="flex">
              <div className="w-1/2 p-2 border-r border-gray-700">
                <div className="bg-gray-500 w-1/2 h-4 rounded mb-3 mx-auto"></div>
                <div className="space-y-2">
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                </div>
              </div>
              <div className="w-1/2 p-2">
                <div className="bg-gray-500 w-1/2 h-4 rounded mb-3 mx-auto"></div>
                <div className="space-y-2">
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                  <div className="bg-gray-600 w-full h-3 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'timeline':
      return (
        <div className="w-full h-full flex flex-col">
          <div className="bg-gray-700 h-10 flex items-center px-3">
            <div className="bg-gray-500 w-40 h-4 rounded"></div>
          </div>
          <div className="flex-1 p-3">
            <div className="bg-gray-600 w-3/4 h-4 rounded mb-6 mx-auto"></div>
            
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600"></div>
              
              <div className="flex items-center mb-6">
                <div className="w-1/2 pr-4 text-right">
                  <div className="bg-gray-600 w-3/4 h-3 rounded ml-auto mb-1"></div>
                  <div className="bg-gray-600 w-1/2 h-3 rounded ml-auto"></div>
                </div>
                <div className="w-4 h-4 rounded-full bg-blue-500 z-10"></div>
                <div className="w-1/2 pl-4">
                  <div className="bg-gray-500 w-1/4 h-3 rounded mb-1"></div>
                </div>
              </div>
              
              <div className="flex items-center mb-6">
                <div className="w-1/2 pr-4 text-right">
                  <div className="bg-gray-500 w-1/4 h-3 rounded ml-auto mb-1"></div>
                </div>
                <div className="w-4 h-4 rounded-full bg-blue-500 z-10"></div>
                <div className="w-1/2 pl-4">
                  <div className="bg-gray-600 w-3/4 h-3 rounded mb-1"></div>
                  <div className="bg-gray-600 w-1/2 h-3 rounded"></div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-1/2 pr-4 text-right">
                  <div className="bg-gray-600 w-3/4 h-3 rounded ml-auto mb-1"></div>
                  <div className="bg-gray-600 w-1/2 h-3 rounded ml-auto"></div>
                </div>
                <div className="w-4 h-4 rounded-full bg-blue-500 z-10"></div>
                <div className="w-1/2 pl-4">
                  <div className="bg-gray-500 w-1/4 h-3 rounded mb-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400">Template Preview</div>
        </div>
      );
  }
};

export default TemplatePreview; 