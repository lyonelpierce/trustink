'use client';

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { useDocumentStore } from '@/store/zustand';
import { EditableDocumentViewerRef } from '@/components/EditableDocumentViewer';

interface DocumentAIContextType {
  proposeEdit: (sectionId: string, newText: string) => void;
  highlightSection: (sectionId: string) => void;
  lastAction: {
    type: 'highlight' | 'propose_edit' | 'accept_edit' | 'reject_edit' | null;
    sectionId: string | null;
    text?: string;
  };
  acceptLastEdit: () => void;
  rejectLastEdit: () => void;
  documentViewerRef: React.RefObject<EditableDocumentViewerRef>;
}

const DocumentAIContext = createContext<DocumentAIContextType | undefined>(undefined);

export function useDocumentAI() {
  const context = useContext(DocumentAIContext);
  if (context === undefined) {
    throw new Error('useDocumentAI must be used within a DocumentAIProvider');
  }
  return context;
}

export function DocumentAIProvider({ children }: { children: React.ReactNode }) {
  const { setHighlightedSection, updateDocumentSection } = useDocumentStore();
  
  // Keep track of the last action for reference
  const [lastAction, setLastAction] = useState<DocumentAIContextType['lastAction']>({
    type: null,
    sectionId: null
  });
  
  // Reference to the editable document viewer component
  // Use a non-null assertion to ensure the type matches the expected RefObject<EditableDocumentViewerRef>
  const documentViewerRef = useRef<EditableDocumentViewerRef>(null!);
  
  // Function to highlight a section
  const highlightSection = useCallback((sectionId: string) => {
    setHighlightedSection(sectionId);
    
    // Use the ref's highlightSection method if available
    if (documentViewerRef.current) {
      documentViewerRef.current.highlightSection(sectionId);
    }
    
    setLastAction({
      type: 'highlight',
      sectionId
    });
  }, [setHighlightedSection]);
  
  // Function to propose an edit to a section
  const proposeEdit = useCallback((sectionId: string, newText: string) => {
    // Update the highlighted section
    setHighlightedSection(sectionId);
    
    // If we have a reference to the document viewer, use it to propose the edit
    if (documentViewerRef.current) {
      documentViewerRef.current.proposeEditFromAI(sectionId, newText);
    }
    
    // Update last action
    setLastAction({
      type: 'propose_edit',
      sectionId,
      text: newText
    });
  }, [setHighlightedSection]);
  
  // Function to accept the last proposed edit
  const acceptLastEdit = useCallback(() => {
    if (lastAction.type === 'propose_edit' && lastAction.sectionId && lastAction.text) {
      // Update the document
      updateDocumentSection(lastAction.sectionId, lastAction.text);
      
      // Update last action
      setLastAction({
        type: 'accept_edit',
        sectionId: lastAction.sectionId
      });
    }
  }, [lastAction, updateDocumentSection]);
  
  // Function to reject the last proposed edit
  const rejectLastEdit = useCallback(() => {
    if (lastAction.type === 'propose_edit' && lastAction.sectionId) {
      // Update last action
      setLastAction({
        type: 'reject_edit',
        sectionId: lastAction.sectionId
      });
    }
  }, [lastAction]);
  
  // The context value
  const value = {
    proposeEdit,
    highlightSection,
    lastAction,
    acceptLastEdit,
    rejectLastEdit,
    documentViewerRef
  };
  
  return (
    <DocumentAIContext.Provider value={value}>
      {children}
    </DocumentAIContext.Provider>
  );
} 