import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useDocumentEditing } from '@/hooks/useDocumentEditing';
import { useDocumentStore } from '@/store/zustand';
import { DocumentSection } from '@/types';
import { handleError } from '@/lib/error-utils';

// Mock dependencies
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn()
}));

jest.mock('@/lib/error-utils', () => ({
  handleError: jest.fn()
}));

describe('useDocumentEditing hook', () => {
  // Define mock document sections
  const mockSections: DocumentSection[] = [
    {
      id: 'section-1',
      title: 'Section 1',
      text: 'Original text for section 1',
      pageNumber: 1,
      position: { x: 0, y: 0, width: 100, height: 50 }
    },
    {
      id: 'section-2',
      title: 'Section 2',
      text: 'Original text for section 2',
      pageNumber: 1,
      position: { x: 0, y: 50, width: 100, height: 50 }
    },
    {
      id: 'section-3',
      text: 'Original text for section 3 (without title)',
      pageNumber: 2,
      position: { x: 0, y: 0, width: 100, height: 50 }
    }
  ];

  // Mock document store functions
  const mockSetHighlightedSection = jest.fn();
  const mockUpdateDocumentSection = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementation for useDocumentStore
    (useDocumentStore as any as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        name: 'Test Document',
        parsedContent: {
          sections: mockSections
        }
      },
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
  });

  test('initializes with correct default values and processes document sections', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Verify sections are processed correctly
    expect(result.current.sections).toHaveLength(mockSections.length);
    expect(result.current.sections[0].id).toBe('section-1');
    expect(result.current.sections[0].isEditing).toBe(false);
    expect(result.current.sections[0].proposedText).toBeUndefined();
    expect(result.current.hasDocument).toBe(true);
  });

  test('handles missing document gracefully', () => {
    // Mock a scenario with no document
    (useDocumentStore as any as jest.Mock).mockReturnValue({
      currentDocument: null,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
    
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Verify no sections are loaded and hasDocument is false
    expect(result.current.sections).toHaveLength(0);
    expect(result.current.hasDocument).toBe(false);
  });

  test('handles document without sections gracefully', () => {
    // Mock a scenario with a document that has no parsedContent
    (useDocumentStore as any as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        name: 'Test Document',
        parsedContent: null
      },
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
    
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Verify no sections are loaded
    expect(result.current.sections).toHaveLength(0);
  });

  test('handles errors during section processing', () => {
    // Mock a document that will cause an error during section processing
    (useDocumentStore as any as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        name: 'Test Document',
        parsedContent: {
          sections: null // This will cause an error when mapping
        }
      },
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
    
    // Render the hook
    renderHook(() => useDocumentEditing());
    
    // Verify error handler was called
    expect(handleError).toHaveBeenCalled();
  });

  test('proposes edit for a section', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Propose an edit
    act(() => {
      result.current.proposeEdit('section-1', 'Proposed new text for section 1');
    });
    
    // Verify the section has the proposed text
    expect(result.current.sections[0].proposedText).toBe('Proposed new text for section 1');
    
    // Original text should remain unchanged
    expect(result.current.sections[0].text).toBe('Original text for section 1');
  });

  test('accepts edit for a section', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // First propose an edit
    act(() => {
      result.current.proposeEdit('section-1', 'Proposed new text for section 1');
    });
    
    // Then accept the edit
    act(() => {
      result.current.acceptEdit('section-1');
    });
    
    // Verify the document update function was called
    expect(mockUpdateDocumentSection).toHaveBeenCalledWith('section-1', 'Proposed new text for section 1');
    
    // Verify the section text is updated and proposed text is cleared
    expect(result.current.sections[0].text).toBe('Proposed new text for section 1');
    expect(result.current.sections[0].proposedText).toBeUndefined();
  });

  test('accepts edit does nothing when no proposed text exists', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Try to accept an edit without proposing first
    act(() => {
      result.current.acceptEdit('section-1');
    });
    
    // Verify the document update function was not called
    expect(mockUpdateDocumentSection).not.toHaveBeenCalled();
    
    // Verify the section text remains unchanged
    expect(result.current.sections[0].text).toBe('Original text for section 1');
  });

  test('rejects edit for a section', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // First propose an edit
    act(() => {
      result.current.proposeEdit('section-1', 'Proposed new text for section 1');
    });
    
    // Then reject the edit
    act(() => {
      result.current.rejectEdit('section-1');
    });
    
    // Verify the document update function was not called (rejecting doesn't update the text)
    expect(mockUpdateDocumentSection).not.toHaveBeenCalled();
    
    // Verify the section text remains original and proposed text is cleared
    expect(result.current.sections[0].text).toBe('Original text for section 1');
    expect(result.current.sections[0].proposedText).toBeUndefined();
  });

  test('starts editing a section', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Start editing
    act(() => {
      result.current.startEditing('section-1');
    });
    
    // Verify the section is in editing mode
    expect(result.current.sections[0].isEditing).toBe(true);
  });

  test('saves direct edit for a section', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Start editing and then save
    act(() => {
      result.current.startEditing('section-1');
    });
    
    act(() => {
      result.current.saveEdit('section-1', 'Directly edited text');
    });
    
    // Verify the document update function was called with saveRevision=true
    expect(mockUpdateDocumentSection).toHaveBeenCalledWith('section-1', 'Directly edited text', true);
    
    // Verify the section text is updated and isEditing is set to false
    expect(result.current.sections[0].text).toBe('Directly edited text');
    expect(result.current.sections[0].isEditing).toBe(false);
  });

  test('cancels editing for a section', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Start editing and then cancel
    act(() => {
      result.current.startEditing('section-1');
    });
    
    act(() => {
      result.current.cancelEditing('section-1');
    });
    
    // Verify the document update function was not called
    expect(mockUpdateDocumentSection).not.toHaveBeenCalled();
    
    // Verify the section text remains unchanged and isEditing is set to false
    expect(result.current.sections[0].text).toBe('Original text for section 1');
    expect(result.current.sections[0].isEditing).toBe(false);
  });

  test('passes through highlightedSection from store', () => {
    // Mock a store with a highlighted section
    (useDocumentStore as any as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        name: 'Test Document',
        parsedContent: {
          sections: mockSections
        }
      },
      highlightedSection: 'section-2',
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
    
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Verify the highlighted section is passed through
    expect(result.current.highlightedSection).toBe('section-2');
  });

  test('setHighlightedSection calls store function', () => {
    // Render the hook
    const { result } = renderHook(() => useDocumentEditing());
    
    // Call setHighlightedSection
    act(() => {
      result.current.setHighlightedSection('section-3');
    });
    
    // Verify the store function was called
    expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-3');
  });
}); 