"use client";

import React, { useState, useEffect } from "react";
import { EditableDocumentViewer } from "@/components/EditableDocumentViewer";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { RevisionPanel } from "@/components/RevisionPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentStore } from "@/store/zustand";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

interface DocumentAnalysisLayoutProps {
  documentId: string;
}

/**
 * Layout component for document analysis
 * Displays document viewer alongside voice assistant and revision panel
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

  useEffect(() => {
    async function fetchDocument() {
      setDocumentLoading(true);
      setError(null);

      try {
        // Make sure auth is loaded and user is signed in
        if (!isLoaded || !isSignedIn || !userId) {
          throw new Error("You must be signed in to view documents");
        }

        // Fetch document metadata
        const response = await fetch(`/api/documents?id=${documentId}`);

        if (!response.ok) {
          // Try to get error details
          let errorMessage = `Failed to fetch document: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (error) {
            console.error("Error fetching document:", error);
            // Ignore JSON parsing errors
          }
          throw new Error(errorMessage);
        }

        const documentData = await response.json();

        // Fetch document analysis/content
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
          } catch (error) {
            console.error("Error fetching document analysis:", error);
            // Ignore JSON parsing errors
          }
          throw new Error(errorMessage);
        }

        const analysisData = await analysisResponse.json();

        // Set current document with analysis data
        setCurrentDocument({
          ...documentData,
          parsedContent: {
            sections: analysisData.sections || [],
          },
        });
      } catch (error) {
        console.error("Error fetching document:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error loading document";
        setError(errorMessage);
        toast.error(errorMessage);
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
  ]);

  // Auth loading state
  if (!isLoaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading authentication...</p>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-lg">You must be signed in to view documents</p>
      </div>
    );
  }

  // Loading state
  if (isDocumentLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading document...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-lg text-destructive">{error}</p>
      </div>
    );
  }

  // No document loaded
  if (!currentDocument) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <AlertCircle className="h-8 w-8 text-warning mb-4" />
        <p className="text-lg">No document loaded</p>
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
            onValueChange={(value) =>
              setActiveTab(value as "assistant" | "revisions")
            }
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
