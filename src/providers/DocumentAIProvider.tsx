'use client';

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { useDocumentStore } from '@/store/zustand';
import { EditableDocumentViewerRef } from '@/components/EditableDocumentViewer';
import { handleError } from '@/lib/error-utils';

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
    console.error('[DocumentAI] useDocumentAI must be used within a DocumentAIProvider');
    throw new Error('useDocumentAI must be used within a DocumentAIProvider');
  }
  return context;
}

export function DocumentAIProvider({ children }: { children: React.ReactNode }) {
  console.log('[DocumentAI] Provider initialized');
  
  const { setHighlightedSection, updateDocumentSection } = useDocumentStore();
  
  const documentViewerRef = useRef<EditableDocumentViewerRef>(null) as React.RefObject<EditableDocumentViewerRef>;
  const [lastAction, setLastAction] = useState<{
    type: 'highlight' | 'propose_edit' | 'accept_edit' | 'reject_edit' | null;
    sectionId: string | null;
    text?: string;
  }>({ type: null, sectionId: null });
  
  const highlightSection = useCallback((sectionId: string) => {
    console.log('[DocumentAI] Highlighting section:', sectionId);
    
    try {
      if (!documentViewerRef.current) {
        console.warn('[DocumentAI] Document viewer ref is not available');
        return;
      }
      
      documentViewerRef.current.highlightSection(sectionId);
      
      setLastAction({
        type: 'highlight',
        sectionId,
      });
      
      console.log('[DocumentAI] Section highlighted successfully');
    } catch (error) {
      console.error('[DocumentAI] Error highlighting section:', error);
      handleError(error, {
        context: 'DocumentAI.highlightSection',
        customMessage: 'Failed to highlight section'
      });
    }
  }, []);
  
  const proposeEdit = useCallback((sectionId: string, newText: string) => {
    console.log('[DocumentAI] Proposing edit for section:', sectionId);
    
    try {
      if (!documentViewerRef.current) {
        console.warn('[DocumentAI] Document viewer ref is not available');
        return;
      }
      
      documentViewerRef.current.proposeEditFromAI(sectionId, newText);
      
      setLastAction({
        type: 'propose_edit',
        sectionId,
        text: newText,
      });
      
      console.log('[DocumentAI] Edit proposed successfully');
    } catch (error) {
      console.error('[DocumentAI] Error proposing edit:', error);
      handleError(error, {
        context: 'DocumentAI.proposeEdit',
        customMessage: 'Failed to propose edit'
      });
    }
  }, []);
  
  const acceptLastEdit = useCallback(() => {
    console.log('[DocumentAI] Accepting last edit');
    
    try {
      if (lastAction.type !== 'propose_edit' || !lastAction.sectionId) {
        console.warn('[DocumentAI] No edit to accept');
        return;
      }
      
      const sections = documentViewerRef.current?.getSections() || [];
      const section = sections.find(s => s.id === lastAction.sectionId);
      
      if (!section || !section.proposedText) {
        console.warn('[DocumentAI] Section or proposed text not found');
        return;
      }
      
      if (documentViewerRef.current) {
        console.log('[DocumentAI] Updating document with accepted changes');
        const acceptButtonElement = document.querySelector(`#section-${lastAction.sectionId} button[aria-label="Accept edit"]`);
        if (acceptButtonElement) {
          (acceptButtonElement as HTMLButtonElement).click();
        }
      }
      
      setLastAction({
        type: 'accept_edit',
        sectionId: lastAction.sectionId,
      });
      
      console.log('[DocumentAI] Edit accepted successfully');
    } catch (error) {
      console.error('[DocumentAI] Error accepting edit:', error);
      handleError(error, {
        context: 'DocumentAI.acceptLastEdit',
        customMessage: 'Failed to accept edit'
      });
    }
  }, [lastAction]);
  
  const rejectLastEdit = useCallback(() => {
    console.log('[DocumentAI] Rejecting last edit');
    
    try {
      if (lastAction.type !== 'propose_edit' || !lastAction.sectionId) {
        console.warn('[DocumentAI] No edit to reject');
        return;
      }
      
      if (documentViewerRef.current) {
        console.log('[DocumentAI] Updating document with rejected changes');
        const rejectButtonElement = document.querySelector(`#section-${lastAction.sectionId} button[aria-label="Reject edit"]`);
        if (rejectButtonElement) {
          (rejectButtonElement as HTMLButtonElement).click();
        }
      }
      
      setLastAction({
        type: 'reject_edit',
        sectionId: lastAction.sectionId,
      });
      
      console.log('[DocumentAI] Edit rejected successfully');
    } catch (error) {
      console.error('[DocumentAI] Error rejecting edit:', error);
      handleError(error, {
        context: 'DocumentAI.rejectLastEdit',
        customMessage: 'Failed to reject edit'
      });
    }
  }, [lastAction]);
  
  const value = {
    proposeEdit,
    highlightSection,
    lastAction,
    acceptLastEdit,
    rejectLastEdit,
    documentViewerRef,
  };

  console.log('[DocumentAI] Rendering provider with context', { lastAction });

  return (
    <DocumentAIContext.Provider value={value}>
      {children}
    </DocumentAIContext.Provider>
  );
} 