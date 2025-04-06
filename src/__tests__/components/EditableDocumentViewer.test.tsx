import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditableDocumentViewer } from '@/components/EditableDocumentViewer';
import { useDocumentStore } from '@/store/zustand';

// Mock Zustand store
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn()
}));

// Mock error utils
jest.mock('@/lib/error-utils', () => ({
  handleError: jest.fn()
}));

describe('EditableDocumentViewer Component', () => {
  // Mock functions
  const mockUpdateDocumentSection = jest.fn();
  const mockSetHighlightedSection = jest.fn();
  
  // Mock ref
  const mockRef = { current: null };
  
  // Mock document with sections
  const mockDocument = {
    name: 'Test Document.pdf',
    parsedContent: {
      sections: [
        {
          id: 'section-1',
          title: 'Section 1',
          text: 'This is section 1 content',
          pageNumber: 1,
          position: { x: 0, y: 0, width: 100, height: 100 }
        },
        {
          id: 'section-2',
          title: 'Section 2',
          text: 'This is section 2 content',
          pageNumber: 1,
          position: { x: 0, y: 100, width: 100, height: 100 }
        }
      ]
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    ((useDocumentStore as unknown) as jest.Mock).mockReturnValue({
      currentDocument: mockDocument,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
  });
  
  it('renders the document viewer with document sections', () => {
    render(<EditableDocumentViewer />);
    
    // Check document content without checking for title specifically
    expect(screen.getByText('This is section 1 content')).toBeInTheDocument();
    expect(screen.getByText('This is section 2 content')).toBeInTheDocument();
    
    // Check that headings exist (using getAllByText to handle multiple instances)
    const section1Headings = screen.getAllByText('Section 1');
    const section2Headings = screen.getAllByText('Section 2');
    expect(section1Headings.length).toBeGreaterThan(0);
    expect(section2Headings.length).toBeGreaterThan(0);
  });
  
  it('displays a message when no document is loaded', () => {
    ((useDocumentStore as unknown) as jest.Mock).mockReturnValue({
      currentDocument: null,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
    
    render(<EditableDocumentViewer ref={mockRef} />);
    
    expect(screen.getByText('No document loaded')).toBeInTheDocument();
  });
  
  it('highlights a section when clicked', () => {
    render(<EditableDocumentViewer ref={mockRef} />);
    
    // Click on a section
    fireEvent.click(screen.getByText('This is section 1 content'));
    
    // Check if setHighlightedSection was called with the right ID
    expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-1');
  });
  
  it('displays highlighted section with different styling', () => {
    ((useDocumentStore as unknown) as jest.Mock).mockReturnValue({
      currentDocument: mockDocument,
      highlightedSection: 'section-1',
      setHighlightedSection: mockSetHighlightedSection,
      updateDocumentSection: mockUpdateDocumentSection
    });
    
    render(<EditableDocumentViewer ref={mockRef} />);
    
    // Find the section elements
    const section1Text = screen.getByText('This is section 1 content');
    const section2Text = screen.getByText('This is section 2 content');
    
    // Get the container divs (the ones with the styling)
    const section1Div = section1Text.closest('div');
    const section2Div = section2Text.closest('div');
    
    expect(section1Div).not.toBeNull();
    expect(section2Div).not.toBeNull();
    
    if (section1Div && section2Div) {
      const section1Container = section1Div.parentElement;
      const section2Container = section2Div.parentElement;
      
      expect(section1Container).not.toBeNull();
      expect(section2Container).not.toBeNull();
      
      if (section1Container && section2Container) {
        // Check that the correct section has the highlight class
        expect(section1Container).toHaveClass('bg-yellow-50');
        expect(section2Container).not.toHaveClass('bg-yellow-50');
      }
    }
  });
  
  it('exposes the correct methods via ref', async () => {
    // Render with a mutable ref
    const ref = React.createRef<any>();
    render(<EditableDocumentViewer ref={ref} />);
    
    // Wait for ref to be populated
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // Check if ref has the required methods
    expect(typeof ref.current.proposeEditFromAI).toBe('function');
    expect(typeof ref.current.highlightSection).toBe('function');
    expect(typeof ref.current.getSections).toBe('function');
    
    // Test the methods
    ref.current.highlightSection('section-2');
    expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-2');
    
    const sections = ref.current.getSections();
    expect(sections.length).toBe(2);
    expect(sections[0].id).toBe('section-1');
  });
}); 