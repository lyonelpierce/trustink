import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevisionPanel } from '@/components/RevisionPanel';
import { useRevisionPanel } from '@/hooks/useRevisionPanel';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { SectionRevision } from '@/types';
import { startMSWServer } from '@/mocks/msw-server';

// Mock dependencies
jest.mock('@/hooks/useRevisionPanel');
jest.mock('@/contexts/DemoModeContext');

// Start MSW server
startMSWServer();

describe('RevisionPanel Component', () => {
  // Mock revision data
  const mockRevisions: SectionRevision[] = [
    {
      id: 'rev-1',
      documentId: 'doc-123',
      sectionId: 'section-1',
      originalText: 'Original text for section 1',
      proposedText: 'Proposed text for section 1',
      comment: 'This is a comment for section 1',
      aiGenerated: true,
      status: 'pending',
      createdAt: new Date('2023-04-01T12:00:00Z'),
      createdBy: 'ai-assistant'
    },
    {
      id: 'rev-2',
      documentId: 'doc-123',
      sectionId: 'section-2',
      originalText: 'Original text for section 2',
      proposedText: 'Proposed text for section 2',
      aiGenerated: false,
      status: 'pending',
      createdAt: new Date('2023-04-02T12:00:00Z'),
      createdBy: 'user-123'
    }
  ];

  // Mock hook return values
  const mockUseRevisionPanel = {
    activeTab: 'pending',
    filter: 'all',
    isLoading: false,
    error: null,
    highlightedSection: null,
    filteredRevisions: mockRevisions,
    handleAcceptRevision: jest.fn(),
    handleRejectRevision: jest.fn(),
    handleRevisionClick: jest.fn(),
    handleFilterChange: jest.fn(),
    handleTabChange: jest.fn(),
    formatDate: (date: Date) => date.toLocaleDateString(),
    processingRevisionId: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useRevisionPanel hook
    (useRevisionPanel as jest.Mock).mockReturnValue(mockUseRevisionPanel);
    
    // Mock useDemoMode hook
    (useDemoMode as jest.Mock).mockReturnValue({
      usingMockData: false
    });
  });

  test('renders revision panel with pending revisions', () => {
    render(<RevisionPanel />);
    
    // Check for main heading
    expect(screen.getByText('Revisions')).toBeInTheDocument();
    
    // Check for revision tabs
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    
    // Check for filter options
    expect(screen.getByTitle('Show all revisions')).toBeInTheDocument();
    expect(screen.getByTitle('Show AI-generated revisions')).toBeInTheDocument();
    expect(screen.getByTitle('Show user-generated revisions')).toBeInTheDocument();
    
    // Check for revision content
    expect(screen.getByText('section-1')).toBeInTheDocument();
    expect(screen.getByText('section-2')).toBeInTheDocument();
    
    // Original text should be displayed
    expect(screen.getByText('Original text for section 1')).toBeInTheDocument();
    
    // Proposed text should be displayed
    expect(screen.getByText('Proposed text for section 1')).toBeInTheDocument();
    
    // Comment should be displayed
    expect(screen.getByText('This is a comment for section 1')).toBeInTheDocument();
    
    // Action buttons should be present
    expect(screen.getAllByText('Accept').length).toBe(2);
    expect(screen.getAllByText('Reject').length).toBe(2);
  });

  test('displays loading state when isLoading is true', () => {
    // Override mock to show loading state
    (useRevisionPanel as jest.Mock).mockReturnValue({
      ...mockUseRevisionPanel,
      isLoading: true
    });
    
    render(<RevisionPanel />);
    
    // Check for loading indicator
    expect(screen.getByText('Loading revisions')).toBeInTheDocument();
    
    // Action buttons should not be present
    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  test('displays error state when there is an error', () => {
    // Override mock to show error state
    (useRevisionPanel as jest.Mock).mockReturnValue({
      ...mockUseRevisionPanel,
      isLoading: false,
      error: 'Failed to load revisions'
    });
    
    render(<RevisionPanel />);
    
    // Check for error message
    expect(screen.getByText('Error loading revisions')).toBeInTheDocument();
    expect(screen.getByText('Failed to load revisions')).toBeInTheDocument();
  });

  test('displays empty state when there are no revisions', () => {
    // Override mock to show empty state
    (useRevisionPanel as jest.Mock).mockReturnValue({
      ...mockUseRevisionPanel,
      isLoading: false,
      error: null,
      filteredRevisions: [],
      activeTab: 'pending'
    });
    
    render(<RevisionPanel />);
    
    // Check for empty state message
    expect(screen.getByText('No pending revisions')).toBeInTheDocument();
  });

  test('displays demo mode indicator when using mock data', () => {
    // Override mock to show demo mode
    (useDemoMode as jest.Mock).mockReturnValue({
      usingMockData: true
    });
    
    render(<RevisionPanel />);
    
    // Check for demo mode indicator
    expect(screen.getByText(/Demo Mode/i)).toBeInTheDocument();
  });

  test('calls handleAcceptRevision when Accept button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<RevisionPanel />);
    
    // Get the first Accept button
    const acceptButton = screen.getAllByText('Accept')[0];
    
    // Click on the button
    await user.click(acceptButton);
    
    // Verify that handler was called with correct revision ID
    expect(mockUseRevisionPanel.handleAcceptRevision).toHaveBeenCalledWith('rev-1', expect.anything());
  });

  test('calls handleRejectRevision when Reject button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<RevisionPanel />);
    
    // Get the first Reject button
    const rejectButton = screen.getAllByText('Reject')[0];
    
    // Click on the button
    await user.click(rejectButton);
    
    // Verify that handler was called with correct revision ID
    expect(mockUseRevisionPanel.handleRejectRevision).toHaveBeenCalledWith('rev-1', expect.anything());
  });

  test('calls handleRevisionClick when revision item is clicked', async () => {
    const user = userEvent.setup();
    
    render(<RevisionPanel />);
    
    // Find the revision item (use section name to identify)
    const revisionItem = screen.getByText('section-1').closest('li');
    
    if (!revisionItem) {
      throw new Error('Revision item not found');
    }
    
    // Click on the revision item
    await user.click(revisionItem);
    
    // Verify that handler was called with correct section ID
    expect(mockUseRevisionPanel.handleRevisionClick).toHaveBeenCalledWith('section-1');
  });

  test('calls handleTabChange when History tab is clicked', async () => {
    const user = userEvent.setup();
    
    render(<RevisionPanel />);
    
    // Find the History tab button
    const historyTab = screen.getByText('History');
    
    // Click on the tab
    await user.click(historyTab);
    
    // Verify that handler was called with correct tab name
    expect(mockUseRevisionPanel.handleTabChange).toHaveBeenCalledWith('history');
  });

  test('calls handleFilterChange when filter buttons are clicked', async () => {
    const user = userEvent.setup();
    
    render(<RevisionPanel />);
    
    // Find the AI filter button
    const aiFilterButton = screen.getByTitle('Show AI-generated revisions');
    
    // Click on the button
    await user.click(aiFilterButton);
    
    // Verify that handler was called with correct filter
    expect(mockUseRevisionPanel.handleFilterChange).toHaveBeenCalledWith('ai');
    
    // Find the user filter button
    const userFilterButton = screen.getByTitle('Show user-generated revisions');
    
    // Click on the button
    await user.click(userFilterButton);
    
    // Verify that handler was called with correct filter
    expect(mockUseRevisionPanel.handleFilterChange).toHaveBeenCalledWith('user');
  });

  test('should render with showAccepted prop', () => {
    render(<RevisionPanel showAccepted={true} />);
    
    // Verify that useRevisionPanel was called with correct props
    expect(useRevisionPanel).toHaveBeenCalledWith(
      expect.objectContaining({ showAccepted: true })
    );
  });

  test('should render with onlyAI prop', () => {
    render(<RevisionPanel onlyAI={true} />);
    
    // Verify that useRevisionPanel was called with correct props
    expect(useRevisionPanel).toHaveBeenCalledWith(
      expect.objectContaining({ onlyAI: true })
    );
  });

  test('displays processing state when accepting/rejecting a revision', () => {
    // Override mock to show processing state
    (useRevisionPanel as jest.Mock).mockReturnValue({
      ...mockUseRevisionPanel,
      processingRevisionId: 'rev-1'
    });
    
    render(<RevisionPanel />);
    
    // Check for processing message
    expect(screen.getAllByText('Processing...')[0]).toBeInTheDocument();
    
    // Buttons should be disabled
    const buttons = screen.getAllByRole('button');
    const disabledButtons = buttons.filter(button => button.hasAttribute('disabled'));
    
    // There should be at least one disabled button (the processing one)
    expect(disabledButtons.length).toBeGreaterThan(0);
  });
}); 