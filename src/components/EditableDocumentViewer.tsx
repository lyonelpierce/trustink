'use client';

import { useDocumentStore } from '@/store/zustand';
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { handleError } from '@/lib/error-utils';

interface EditableSection {
  id: string;
  title?: string;
  text: string;
  pageNumber: number;
  position: { x: number; y: number; width: number; height: number };
  isEditing?: boolean;
  proposedText?: string;
}

interface EditableDocumentViewerProps {
  // If the component doesn't need props, we'll use Record<string, never> instead of empty interface
  readonly _props?: never;
}

export interface EditableDocumentViewerRef {
  proposeEditFromAI: (sectionId: string, newText: string) => void;
  highlightSection: (sectionId: string | null) => void;
  getSections: () => EditableSection[];
}

export const EditableDocumentViewer = forwardRef<EditableDocumentViewerRef, EditableDocumentViewerProps>((props, ref) => {
  console.log('[EditableDocumentViewer] Component rendered');
  
  const { 
    currentDocument, 
    highlightedSection, 
    setHighlightedSection,
    updateDocumentSection
  } = useDocumentStore();
  
  // We'll use isLoading state for future functionality
  const [isLoading] = useState(false);
  const [sections, setSections] = useState<EditableSection[]>([]);
  
  // Process the document and extract sections
  useEffect(() => {
    try {
      if (!currentDocument?.parsedContent?.sections) {
        console.log('[EditableDocumentViewer] No document sections to render');
        return;
      }
      
      console.log('[EditableDocumentViewer] Processing document sections:', currentDocument.parsedContent.sections.length);
      
      setSections(currentDocument.parsedContent.sections.map(section => ({
        ...section,
        text: section.text || '',
        isEditing: false,
        proposedText: undefined
      })));
    } catch (error) {
      handleError(error, {
        context: 'EditableDocumentViewer.processSections',
        customMessage: 'Failed to process document sections'
      });
    }
  }, [currentDocument]);

  // Handle section highlighting
  useEffect(() => {
    if (highlightedSection) {
      console.log('[EditableDocumentViewer] Highlighting section:', highlightedSection);
      // Find the element and scroll to it
      const element = document.getElementById(`section-${highlightedSection}`);
      if (element) {
        console.log('[EditableDocumentViewer] Scrolling to highlighted section');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.log('[EditableDocumentViewer] Could not find section element to highlight');
      }
    }
  }, [highlightedSection]);

  // Handle proposed edit from AI
  const handleProposedEdit = useCallback((sectionId: string, newText: string) => {
    console.log('[EditableDocumentViewer] Handling proposed edit for section:', sectionId);
    // Update sections with proposed text
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, proposedText: newText } 
          : section
      )
    );
  }, []);

  // Accept proposed edit
  const acceptEdit = useCallback((sectionId: string) => {
    console.log('[EditableDocumentViewer] Accepting edit for section:', sectionId);
    const section = sections.find(s => s.id === sectionId);
    if (section?.proposedText) {
      // Update the section in the document store
      console.log('[EditableDocumentViewer] Updating document with accepted changes');
      updateDocumentSection(sectionId, section.proposedText);
      
      // Update local state
      setSections(prev => 
        prev.map(s => 
          s.id === sectionId 
            ? { ...s, text: section.proposedText || s.text, proposedText: undefined } 
            : s
        )
      );
    } else {
      console.log('[EditableDocumentViewer] Cannot accept edit: No proposed text found');
    }
  }, [sections, updateDocumentSection]);

  // Reject proposed edit
  const rejectEdit = useCallback((sectionId: string) => {
    console.log('[EditableDocumentViewer] Rejecting edit for section:', sectionId);
    // Clear the proposed edit
    setSections(prev => 
      prev.map(s => 
        s.id === sectionId 
          ? { ...s, proposedText: undefined } 
          : s
      )
    );
  }, []);

  // This function would be called by the AI to propose an edit
  // Expose this via a ref or context to be called from the AI component
  const proposeEditFromAI = useCallback((sectionId: string, newText: string) => {
    console.log('[EditableDocumentViewer] AI proposing edit for section:', sectionId);
    // Set highlighted section
    setHighlightedSection(sectionId);
    
    // Propose the edit
    handleProposedEdit(sectionId, newText);
  }, [handleProposedEdit, setHighlightedSection]);

  // Add a function to get sections
  const getSections = useCallback(() => {
    console.log('[EditableDocumentViewer] Getting current sections');
    return sections;
  }, [sections]);
  
  // Add a function to highlight sections
  const highlightSection = useCallback((sectionId: string | null) => {
    console.log('[EditableDocumentViewer] Setting highlighted section:', sectionId);
    setHighlightedSection(sectionId);
  }, [setHighlightedSection]);

  // Expose functions through the ref
  useImperativeHandle(ref, () => {
    console.log('[EditableDocumentViewer] Exposing functions via ref');
    return {
      proposeEditFromAI,
      highlightSection,
      getSections
    };
  }, [proposeEditFromAI, highlightSection, getSections]);

  if (!currentDocument) {
    return (
      <ErrorBoundary>
        <div className="w-full h-[600px] flex items-center justify-center border rounded-lg">
          <p className="text-gray-500">No document loaded</p>
        </div>
      </ErrorBoundary>
    );
  }

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="w-full h-[600px] flex flex-col items-center justify-center border rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading document...</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="border rounded-lg w-full overflow-hidden">
        <div className="bg-gray-100 p-2 border-b">
          <h3 className="font-medium truncate">{currentDocument?.name || 'Untitled Document'}</h3>
        </div>
        <div className="w-full h-[600px] overflow-y-auto p-4">
          {sections.map((section) => (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className={`mb-6 p-4 border rounded-lg transition-all ${
                highlightedSection === section.id
                  ? 'bg-yellow-50 border-yellow-400 shadow-md'
                  : 'border-gray-200'
              }`}
              onClick={() => {
                console.log('[EditableDocumentViewer] Section clicked:', section.id);
                setHighlightedSection(section.id);
              }}
            >
              {section.title && (
                <h4 className="font-medium text-lg mb-2">{section.title}</h4>
              )}
              
              <div className="text-gray-800 whitespace-pre-wrap">
                {section.text}
              </div>
              
              {/* Show proposed edit if available */}
              {section.proposedText && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex flex-row justify-between items-center mb-2">
                    <h5 className="font-medium text-sm text-blue-600">Suggested Edit:</h5>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[EditableDocumentViewer] Accept button clicked for section:', section.id);
                          acceptEdit(section.id);
                        }}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                        aria-label="Accept edit"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[EditableDocumentViewer] Reject button clicked for section:', section.id);
                          rejectEdit(section.id);
                        }}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                        aria-label="Reject edit"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 text-gray-800 whitespace-pre-wrap">
                    {section.proposedText}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
});

// Add proper display name
EditableDocumentViewer.displayName = 'EditableDocumentViewer'; 