/**
 * EditableDocumentViewer Component Tests
 * 
 * This test suite covers the core functionality of the EditableDocumentViewer component, including:
 * 
 * 1. Basic rendering
 *   - Document sections rendering with proper content and titles
 *   - Empty state when no document is loaded
 *   - Document title display (from first section or 'Untitled Document')
 * 
 * 2. User interactions
 *   - Section highlighting when clicked
 *   - Styling changes for highlighted sections
 *   - Accept/reject functionality for proposed edits
 *   - Event propagation stop for editing actions
 * 
 * 3. Auto-scrolling behavior
 *   - Automatic scrolling to highlighted sections
 * 
 * 4. Component ref API
 *   - proposeEditFromAI(): Proposing edits programmatically 
 *   - highlightSection(): Highlighting a section programmatically
 *   - getSections(): Getting the current sections
 * 
 * 5. Conditional rendering
 *   - Different displays for sections with/without titles
 *   - Display of proposed edits with accept/reject buttons
 *   - Empty state when no document is loaded
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditableDocumentViewer, EditableDocumentViewerRef } from '@/components/EditableDocumentViewer';
import { useDocumentEditing } from '@/hooks/useDocumentEditing';

// Mock hooks
jest.mock('@/hooks/useDocumentEditing', () => ({
  useDocumentEditing: jest.fn()
}));

// Mock error boundary
jest.mock('@/components/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}));

// Mock error utils
jest.mock('@/lib/error-utils', () => ({
  handleError: jest.fn()
}));

describe('EditableDocumentViewer Component', () => {
  // Mock document with sections
  const mockSections = [
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
    },
    {
      id: 'section-3',
      text: 'This is section 3 content without a title',
      pageNumber: 2,
      position: { x: 0, y: 0, width: 100, height: 100 }
    }
  ];

  // Mock functions
  const mockProposeEdit = jest.fn();
  const mockAcceptEdit = jest.fn();
  const mockRejectEdit = jest.fn();
  const mockSetHighlightedSection = jest.fn();
  
  // Set up default mock returns
  beforeEach(() => {
    jest.clearAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
    
    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: mockSections,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      proposeEdit: mockProposeEdit,
      acceptEdit: mockAcceptEdit,
      rejectEdit: mockRejectEdit,
      hasDocument: true
    });
  });
  
  it('renders the document viewer with all sections', () => {
    render(<EditableDocumentViewer />);
    
    // Check document sections are rendered
    expect(screen.getByText('This is section 1 content')).toBeInTheDocument();
    expect(screen.getByText('This is section 2 content')).toBeInTheDocument();
    expect(screen.getByText('This is section 3 content without a title')).toBeInTheDocument();
    
    // Check section titles (using getAllByText since they appear in both header and content)
    expect(screen.getAllByText('Section 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Section 2').length).toBeGreaterThan(0);
    
    // Check document title appears somewhere in the document
    const section1Elements = screen.getAllByText('Section 1');
    expect(section1Elements.length).toBeGreaterThan(0);
  });
  
  it('displays the empty state when no document is loaded', () => {
    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: [],
      hasDocument: false,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection
    });
    
    render(<EditableDocumentViewer />);
    
    expect(screen.getByText('No document loaded')).toBeInTheDocument();
  });
  
  it('highlights a section when clicked', () => {
    render(<EditableDocumentViewer />);
    
    // Click on a section
    fireEvent.click(screen.getByText('This is section 1 content'));
    
    // Check if setHighlightedSection was called with the right ID
    expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-1');
  });
  
  it('applies highlight styling to the highlighted section', () => {
    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: mockSections,
      highlightedSection: 'section-2',
      setHighlightedSection: mockSetHighlightedSection,
      proposeEdit: mockProposeEdit,
      acceptEdit: mockAcceptEdit,
      rejectEdit: mockRejectEdit,
      hasDocument: true
    });
    
    render(<EditableDocumentViewer />);
    
    // Find all section containers
    const section1Container = screen.getByText('This is section 1 content').closest('div[id^="section-"]');
    const section2Container = screen.getByText('This is section 2 content').closest('div[id^="section-"]');
    
    // Check that section 2 has highlight class and section 1 doesn't
    expect(section2Container).toHaveClass('bg-yellow-50');
    expect(section1Container).not.toHaveClass('bg-yellow-50');
  });
  
  it('renders a section with proposed text and edit buttons', () => {
    const sectionsWithProposal = [
      ...mockSections,
      {
        id: 'section-4',
        title: 'Section with Edit',
        text: 'Original text content',
        proposedText: 'This is a proposed change',
        pageNumber: 2,
        position: { x: 0, y: 200, width: 100, height: 100 }
      }
    ];
    
    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: sectionsWithProposal,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      proposeEdit: mockProposeEdit,
      acceptEdit: mockAcceptEdit,
      rejectEdit: mockRejectEdit,
      hasDocument: true
    });
    
    render(<EditableDocumentViewer />);
    
    // Check that both original and proposed text are displayed
    expect(screen.getByText('Original text content')).toBeInTheDocument();
    expect(screen.getByText('This is a proposed change')).toBeInTheDocument();
    
    // Check that the suggested edit label is displayed
    expect(screen.getByText('Suggested Edit:')).toBeInTheDocument();
    
    // Check that accept/reject buttons are rendered
    const acceptButton = screen.getByLabelText('Accept edit');
    const rejectButton = screen.getByLabelText('Reject edit');
    
    expect(acceptButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();
  });
  
  it('calls acceptEdit when accept button is clicked', () => {
    const sectionsWithProposal = [
      ...mockSections.slice(0, 1),
      {
        id: 'section-2',
        title: 'Section 2',
        text: 'Original text for section 2',
        proposedText: 'Proposed text for section 2',
        pageNumber: 1,
        position: { x: 0, y: 100, width: 100, height: 100 }
      }
    ];
    
    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: sectionsWithProposal,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      proposeEdit: mockProposeEdit,
      acceptEdit: mockAcceptEdit,
      rejectEdit: mockRejectEdit,
      hasDocument: true
    });
    
    render(<EditableDocumentViewer />);
    
    // Find and click the accept button
    const acceptButton = screen.getByLabelText('Accept edit');
    fireEvent.click(acceptButton);
    
    // Check that acceptEdit was called with the right section ID
    expect(mockAcceptEdit).toHaveBeenCalledWith('section-2');
    
    // Ensure event propagation was stopped (doesn't trigger section highlighting)
    expect(mockSetHighlightedSection).not.toHaveBeenCalled();
  });
  
  it('calls rejectEdit when reject button is clicked', () => {
    const sectionsWithProposal = [
      ...mockSections.slice(0, 1),
      {
        id: 'section-2',
        title: 'Section 2',
        text: 'Original text for section 2',
        proposedText: 'Proposed text for section 2',
        pageNumber: 1,
        position: { x: 0, y: 100, width: 100, height: 100 }
      }
    ];
    
    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: sectionsWithProposal,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      proposeEdit: mockProposeEdit,
      acceptEdit: mockAcceptEdit,
      rejectEdit: mockRejectEdit,
      hasDocument: true
    });
    
    render(<EditableDocumentViewer />);
    
    // Find and click the reject button
    const rejectButton = screen.getByLabelText('Reject edit');
    fireEvent.click(rejectButton);
    
    // Check that rejectEdit was called with the right section ID
    expect(mockRejectEdit).toHaveBeenCalledWith('section-2');
    
    // Ensure event propagation was stopped (doesn't trigger section highlighting)
    expect(mockSetHighlightedSection).not.toHaveBeenCalled();
  });

  it('scrolls to highlighted section when highlightedSection changes', () => {
    // Mock the getElementById before rendering
    const mockElement = document.createElement('div');
    document.getElementById = jest.fn().mockReturnValue(mockElement);

    // Initial render with no highlighted section
    const { rerender } = render(<EditableDocumentViewer />);

    // Verify scrollIntoView hasn't been called yet
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    // Update the hook to return a highlighted section
    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: mockSections,
      highlightedSection: 'section-2',
      setHighlightedSection: mockSetHighlightedSection,
      proposeEdit: mockProposeEdit,
      acceptEdit: mockAcceptEdit,
      rejectEdit: mockRejectEdit,
      hasDocument: true
    });

    // Re-render with updated props
    rerender(<EditableDocumentViewer />);

    // This should trigger the useEffect for scrolling
    // Need to wait for the useEffect to run
    expect(document.getElementById).toHaveBeenCalledWith('section-section-2');
    
    // Verify scrollIntoView was called on the element
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });
  
  it('exposes the correct methods via ref', async () => {
    // Create a ref to capture the exposed methods
    const ref = React.createRef<EditableDocumentViewerRef>();
    render(<EditableDocumentViewer ref={ref} />);
    
    // Wait for the ref to be populated
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // Check that ref exposes the required methods
    expect(typeof ref.current!.proposeEditFromAI).toBe('function');
    expect(typeof ref.current!.highlightSection).toBe('function');
    expect(typeof ref.current!.getSections).toBe('function');
    
    // Test proposeEditFromAI method
    ref.current!.proposeEditFromAI('section-1', 'New AI text');
    expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-1');
    expect(mockProposeEdit).toHaveBeenCalledWith('section-1', 'New AI text');
    
    // Test highlightSection method
    ref.current!.highlightSection('section-2');
    expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-2');
    
    // Test getSections method
    const sections = ref.current!.getSections();
    expect(sections).toEqual(mockSections);
  });

  it('renders untitled document when first section has no title', () => {
    // Mock sections where first section has no title
    const sectionsWithoutTitle = [
      {
        id: 'section-1',
        text: 'Section without title',
        pageNumber: 1,
        position: { x: 0, y: 0, width: 100, height: 100 }
      },
      ...mockSections.slice(1)
    ];

    (useDocumentEditing as jest.Mock).mockReturnValue({
      sections: sectionsWithoutTitle,
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection,
      proposeEdit: mockProposeEdit,
      acceptEdit: mockAcceptEdit,
      rejectEdit: mockRejectEdit,
      hasDocument: true
    });

    render(<EditableDocumentViewer />);
    
    // Check for 'Untitled Document' in the header
    expect(screen.getByText('Untitled Document')).toBeInTheDocument();
  });
}); 