"use client";

import React, { useState, useEffect } from "react";
import { EditableDocumentViewer } from "@/components/EditableDocumentViewer";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { RevisionPanel } from "@/components/RevisionPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentStore } from "@/store/zustand";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { mockDocument } from "@/mocks/document-mock";
import { handleError } from "@/lib/error-handler";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/state";
import { useAuth } from "@clerk/nextjs";

interface DocumentAnalysisLayoutProps {
  documentId: string;
}

/**
 * Layout component for document analysis
 * Displays document viewer alongside voice assistant and revision panel
 * 
 * Features:
 * - Split view with document on the left, assistant/revisions on the right
 * - Tabbed interface for switching between AI assistant and revisions
 * - Handles authentication, loading, and error states
 * - Supports demo mode with mock data
 */
export function DocumentAnalysisLayout({
  documentId,
}: DocumentAnalysisLayoutProps) {
  const [activeTab, setActiveTab] = useState("assistant");
  const [error, setError] = useState<string | null>(null);
  const {
    setCurrentDocument,
    setDocumentLoading,
    currentDocument,
    isDocumentLoading,
  } = useDocumentStore();
  const { isLoaded, userId, isSignedIn } = useAuth();
  const { isDemoMode, setUsingMockData } = useDemoMode();

  useEffect(() => {
    async function fetchDocument() {
      console.log(`[DocumentAnalysisLayout] Fetching document: ${documentId}`);
      setDocumentLoading(true);
      setError(null);

      try {
        // Demo mode check - use mock data if in demo mode
        if (isDemoMode) {
          console.log('[DocumentAnalysisLayout] Using mock document in demo mode');
          setUsingMockData(true);
          
          // Set mock document data
          if (documentId === 'doc-123' || documentId === 'sample') {
            setCurrentDocument({
              ...mockDocument,
              id: documentId,
              parsedContent: {
                sections: mockDocument.sections || [],
              },
            });
            
            console.log('[DocumentAnalysisLayout] Loaded mock document with sections:', 
              mockDocument.sections?.length || 0);
              
            setDocumentLoading(false);
            return;
          }
        }
        
        // For real implementation, ensure auth is loaded first
        if (!isLoaded) {
          console.log('[DocumentAnalysisLayout] Waiting for auth to load');
          return; // Wait for auth to load
        }
        
        // Real auth check
        if (!isSignedIn || !userId) {
          throw new Error("You must be signed in to view documents");
        }

        // Fetch document metadata
        console.log(`[DocumentAnalysisLayout] Fetching document metadata: ${documentId}`);
        const response = await fetch(`/api/documents?id=${documentId}`);

        if (!response.ok) {
          // Try to get error details
          let errorMessage = `Failed to fetch document: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
            // Ignore JSON parsing errors
          }
          throw new Error(errorMessage);
        }

        const documentData = await response.json();
        console.log('[DocumentAnalysisLayout] Document metadata loaded successfully');

        // Fetch document analysis/content
        console.log(`[DocumentAnalysisLayout] Fetching document analysis: ${documentId}`);
        const analysisResponse = await fetch(
          `/api/documents/analyze?documentId=${documentId}`
        );

        if (!analysisResponse.ok) {
          // Try to get error details
          let errorMessage = "Failed to fetch document analysis";
          try {
            const errorData = await analysisResponse.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            console.error("Error parsing analysis error:", parseError);
            // Ignore JSON parsing errors
          }
          throw new Error(errorMessage);
        }

        const analysisData = await analysisResponse.json();
        console.log('[DocumentAnalysisLayout] Document analysis loaded successfully');

        // Set current document with analysis data
        setCurrentDocument({
          ...documentData,
          parsedContent: {
            sections: analysisData.sections || [],
          },
        });
      } catch (error) {
        // Use standardized error handling
        const errorObj = handleError(error, {
          context: 'Document Analysis Layout',
          showToast: true,
          logToConsole: true
        });
        
        setError(errorObj.message);
        
        // In demo mode, fallback to mock data even for errors
        if (isDemoMode) {
          console.log('[DocumentAnalysisLayout] Falling back to mock document after error');
          setCurrentDocument({
            ...mockDocument,
            id: documentId,
            parsedContent: {
              sections: mockDocument.sections || [],
            },
          });
          setError(null); // Clear error since we're showing mock data
        }
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
  }, [
    documentId,
    setCurrentDocument,
    setDocumentLoading,
    isLoaded,
    isSignedIn,
    userId,
    isDemoMode,
    setUsingMockData
  ]);

  // Auth loading state
  if (!isLoaded && !isDemoMode) {
    return (
      <LoadingState
        title="Loading authentication"
        description="Please wait while we load your authentication data..."
      />
    );
  }

  // Not signed in (except in demo mode)
  if (!isSignedIn && !isDemoMode) {
    return (
      <ErrorState
        title="Authentication Required"
        description="You must be signed in to view documents"
      />
    );
  }

  // Loading state
  if (isDocumentLoading) {
    return (
      <LoadingState 
        title="Loading document"
        description="Please wait while we load your document..."
      />
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Error loading document"
        description={error}
      />
    );
  }

  // No document loaded
  if (!currentDocument) {
    return (
      <EmptyState
        title="No document loaded"
        description="The requested document could not be found or has not been loaded yet."
      />
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
            onValueChange={(value) =>
              setActiveTab(value as "assistant" | "revisions")
            }
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              <TabsTrigger value="revisions">Revisions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assistant" className="flex-grow overflow-auto">
              <VoiceAssistant className="h-full" />
            </TabsContent>
            
            <TabsContent value="revisions" className="flex-grow overflow-auto">
              <RevisionPanel showAccepted={true} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
