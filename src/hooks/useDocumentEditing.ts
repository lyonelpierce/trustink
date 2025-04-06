import { useState, useCallback, useEffect } from 'react';
import { useDocumentStore } from '@/store/zustand';
import { handleError } from '@/lib/error-utils';
import { DocumentSection } from '@/types';

interface EditableSection extends DocumentSection {
  isEditing?: boolean;
  proposedText?: string;
}

export function useDocumentEditing() {
  const { 
    currentDocument, 
    highlightedSection, 
    setHighlightedSection,
    updateDocumentSection
  } = useDocumentStore();
  
  const [sections, setSections] = useState<EditableSection[]>([]);
  
  // Process the document and extract sections
  useEffect(() => {
    try {
      if (!currentDocument?.parsedContent?.sections) {
        console.log('[useDocumentEditing] No document sections to render');
        return;
      }
      
      console.log('[useDocumentEditing] Processing document sections:', 
        currentDocument.parsedContent.sections.length);
      
      setSections(currentDocument.parsedContent.sections.map(section => ({
        ...section,
        text: section.text || '',
        isEditing: false,
        proposedText: undefined
      })));
    } catch (error) {
      handleError(error, {
        context: 'useDocumentEditing.processSections',
        customMessage: 'Failed to process document sections'
      });
    }
  }, [currentDocument]);

  // Handle proposed edit
  const proposeEdit = useCallback((sectionId: string, newText: string) => {
    console.log('[useDocumentEditing] Proposing edit for section:', sectionId);
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, proposedText: newText } 
          : section
      )
    );
  }, []);

  // Accept edit
  const acceptEdit = useCallback((sectionId: string) => {
    console.log('[useDocumentEditing] Accepting edit for section:', sectionId);
    const section = sections.find(s => s.id === sectionId);
    if (section?.proposedText) {
      // Update the section in the document store
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
      console.log('[useDocumentEditing] Cannot accept edit: No proposed text found');
    }
  }, [sections, updateDocumentSection]);

  // Reject edit
  const rejectEdit = useCallback((sectionId: string) => {
    console.log('[useDocumentEditing] Rejecting edit for section:', sectionId);
    // Clear the proposed edit
    setSections(prev => 
      prev.map(s => 
        s.id === sectionId 
          ? { ...s, proposedText: undefined } 
          : s
      )
    );
  }, []);

  // Start direct editing of a section
  const startEditing = useCallback((sectionId: string) => {
    console.log('[useDocumentEditing] Starting direct editing of section:', sectionId);
    setSections(prev => 
      prev.map(s => 
        s.id === sectionId 
          ? { ...s, isEditing: true } 
          : s
      )
    );
  }, []);

  // Save a directly edited section
  const saveEdit = useCallback((sectionId: string, newText: string) => {
    console.log('[useDocumentEditing] Saving direct edit for section:', sectionId);
    updateDocumentSection(sectionId, newText, true); // Save as revision
    
    setSections(prev => 
      prev.map(s => 
        s.id === sectionId 
          ? { ...s, text: newText, isEditing: false } 
          : s
      )
    );
  }, [updateDocumentSection]);

  // Cancel direct editing
  const cancelEditing = useCallback((sectionId: string) => {
    console.log('[useDocumentEditing] Canceling direct edit for section:', sectionId);
    setSections(prev => 
      prev.map(s => 
        s.id === sectionId 
          ? { ...s, isEditing: false } 
          : s
      )
    );
  }, []);

  return {
    sections,
    highlightedSection,
    setHighlightedSection,
    proposeEdit,
    acceptEdit,
    rejectEdit,
    startEditing,
    saveEdit,
    cancelEditing,
    hasDocument: !!currentDocument
  };
} 