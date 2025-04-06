'use client';

import React, { useState, useEffect } from 'react';
import { EditableDocumentViewer } from '@/components/EditableDocumentViewer';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { RevisionPanel } from '@/components/RevisionPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentStore } from '@/store/zustand';
import { Loader2 } from 'lucide-react';

interface DocumentAnalysisLayoutProps {
  documentId: string;
}

/**
 * Layout component for document analysis
 * Displays document viewer alongside voice assistant and revision panel
 */
export function DocumentAnalysisLayout({ documentId }: DocumentAnalysisLayoutProps) {
  const [activeTab, setActiveTab] = useState('assistant');
  const { setCurrentDocument, setDocumentLoading, currentDocument, isDocumentLoading } = useDocumentStore();
  
  useEffect(() => {
    async function fetchDocument() {
      setDocumentLoading(true);
      
      try {
        // Fetch document metadata
        const response = await fetch(`/api/documents?id=${documentId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`);
        }
        
        const documentData = await response.json();
        
        // Fetch document analysis/content
        const analysisResponse = await fetch(`/api/documents/analyze?documentId=${documentId}`);
        
        if (!analysisResponse.ok) {
          throw new Error('Failed to fetch document analysis');
        }
        
        const analysisData = await analysisResponse.json();
        
        // Set current document with analysis data
        setCurrentDocument({
          ...documentData,
          parsedContent: {
            sections: analysisData.sections || []
          }
        });
        
      } catch (error) {
        console.error('Error fetching document:', error);
      } finally {
        setDocumentLoading(false);
      }
    }
    
    fetchDocument();
    
    // Cleanup function
    return () => {
      // Clear document when navigating away
      setCurrentDocument(null);
    };
  }, [documentId, setCurrentDocument, setDocumentLoading]);
  
  // Loading state
  if (isDocumentLoading || !currentDocument) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading document...</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow flex overflow-hidden">
        {/* Document viewer (left side) */}
        <div className="w-1/2 h-full overflow-auto border-r">
          <EditableDocumentViewer />
        </div>
        
        {/* Assistant/Revisions panel (right side) */}
        <div className="w-1/2 h-full flex flex-col overflow-hidden">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'assistant' | 'revisions')}
            className="h-full flex flex-col"
          >
            <div className="border-b">
              <TabsList className="mx-4 my-2">
                <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
                <TabsTrigger value="revisions">Revisions</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="assistant" className="flex-grow">
              <VoiceAssistant className="h-full" />
            </TabsContent>
            
            <TabsContent value="revisions" className="flex-grow overflow-auto">
              <RevisionPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 