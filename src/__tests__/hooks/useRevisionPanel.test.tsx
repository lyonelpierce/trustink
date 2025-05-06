import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useRevisionPanel } from '@/hooks/useRevisionPanel';
import { useDocumentStore } from '@/store/zustand';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { toast } from 'sonner';
import { SectionRevision } from '@/types';
import { startMSWServer } from '@/mocks/msw-server';

// Define types for our mocks
interface DocumentStore {
  currentDocument: any;
  pendingRevisions: SectionRevision[];
  acceptRevision: jest.Mock;
  rejectRevision: jest.Mock;
  setHighlightedSection?: jest.Mock;
}

// Mock dependencies
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn()
}));

jest.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: jest.fn()
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn()
  }
}));

// Mock fetch API
global.fetch = jest.fn() as jest.Mock;

// Start MSW server
startMSWServer();

describe('useRevisionPanel hook', () => {
  // Mock revision data
  const mockRevisions: SectionRevision[] = [
    {
      id: 'rev-1',
      documentId: 'doc-123',
      sectionId: 'section-1',
      originalText: 'Original text',
      proposedText: 'Proposed text',
      comment: 'Test comment',
      aiGenerated: true,
      status: 'pending',
      createdAt: new Date(),
      createdBy: 'ai-assistant'
    },
    {
      id: 'rev-2',
      documentId: 'doc-123',
      sectionId: 'section-2',
      originalText: 'Original section 2',
      proposedText: 'Proposed section 2',
      aiGenerated: false,
      status: 'accepted',
      createdAt: new Date(),
      createdBy: 'user-123'
    }
  ];

  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock document store
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        parsedContent: {
          sections: [
            { id: 'section-1', title: 'Section 1', text: 'Section 1 content' },
            { id: 'section-2', title: 'Section 2', text: 'Section 2 content' }
          ]
        }
      },
      pendingRevisions: mockRevisions.filter(rev => rev.status === 'pending'),
      acceptRevision: jest.fn(),
      rejectRevision: jest.fn(),
      setHighlightedSection: jest.fn()
    });
    
    // Mock demo mode context
    (useDemoMode as unknown as jest.Mock).mockReturnValue({
      isDemoMode: false,
      usingMockData: false
    });
    
    // Mock successful fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        id: 'rev-1', 
        status: 'accepted' 
      })
    });
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useRevisionPanel());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.documentId).toBe('doc-123');
    expect(result.current.showAccepted).toBe(false);
  });

  test('should override document ID when provided', () => {
    const { result } = renderHook(() => useRevisionPanel({ documentId: 'custom-doc-id' }));
    
    expect(result.current.documentId).toBe('custom-doc-id');
  });

  test('should handle demo mode', () => {
    (useDemoMode as unknown as jest.Mock).mockReturnValue({
      isDemoMode: true,
      usingMockData: true
    });
    
    const { result } = renderHook(() => useRevisionPanel({ isDemo: true }));
    
    // Instead of checking isDemo directly, verify expected behavior
    expect(result.current.revisions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  test('should fetch revisions when loadRevisions is called', async () => {
    // Setup fetch to return mock revisions
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevisions
    });
    
    const { result } = renderHook(() => useRevisionPanel());
    
    await act(async () => {
      result.current.loadRevisions();
    });
    
    // Verify loading state changes
    expect(result.current.isLoading).toBe(false);
    
    // Verify revisions are set correctly
    expect(result.current.revisions.length).toBeGreaterThan(0);
  });

  test('should handle accept revision in demo mode', async () => {
    // Setup demo mode
    (useDemoMode as unknown as jest.Mock).mockReturnValue({
      isDemoMode: true,
      usingMockData: true
    });
    
    const mockAcceptRevision = jest.fn();
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: { id: 'doc-123' },
      pendingRevisions: mockRevisions,
      acceptRevision: mockAcceptRevision,
      rejectRevision: jest.fn()
    });
    
    const { result } = renderHook(() => useRevisionPanel({ isDemo: true }));
    
    // Load revisions first
    await act(async () => {
      result.current.loadRevisions();
    });
    
    // Accept a revision
    await act(async () => {
      await result.current.handleAcceptRevision('rev-1');
    });
    
    // Verify store function was called
    expect(mockAcceptRevision).toHaveBeenCalledWith('rev-1');
    
    // Verify API was not called in demo mode
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Verify toast was shown
    expect(toast.success).toHaveBeenCalledWith('Revision accepted');
  });

  test('should handle reject revision in demo mode', async () => {
    // Setup demo mode
    (useDemoMode as unknown as jest.Mock).mockReturnValue({
      isDemoMode: true,
      usingMockData: true
    });
    
    const mockRejectRevision = jest.fn();
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: { id: 'doc-123' },
      pendingRevisions: mockRevisions,
      acceptRevision: jest.fn(),
      rejectRevision: mockRejectRevision
    });
    
    const { result } = renderHook(() => useRevisionPanel({ isDemo: true }));
    
    // Load revisions first
    await act(async () => {
      result.current.loadRevisions();
    });
    
    // Reject a revision
    await act(async () => {
      await result.current.handleRejectRevision('rev-1');
    });
    
    // Verify store function was called
    expect(mockRejectRevision).toHaveBeenCalledWith('rev-1');
    
    // Verify API was not called in demo mode
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Verify toast was shown
    expect(toast.success).toHaveBeenCalledWith('Revision rejected');
  });

  test('should handle error when fetching revisions', async () => {
    // Mock fetch to return error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    });
    
    const { result } = renderHook(() => useRevisionPanel());
    
    await act(async () => {
      result.current.loadRevisions();
    });
    
    // Verify error state
    expect(result.current.error).not.toBeNull();
    
    // Verify toast error was shown (using handleError internally)
    expect(toast.error).toHaveBeenCalled();
  });

  test('should handle non-demo mode API calls', async () => {
    // Setup successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, id: 'rev-1', status: 'accepted' })
    });
    
    const mockAcceptRevision = jest.fn();
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: { id: 'doc-123' },
      pendingRevisions: mockRevisions,
      acceptRevision: mockAcceptRevision,
      rejectRevision: jest.fn()
    });
    
    const { result } = renderHook(() => useRevisionPanel());
    
    // Accept a revision (which should call the API)
    await act(async () => {
      await result.current.handleAcceptRevision('rev-1');
    });
    
    // Verify API was called
    expect(global.fetch).toHaveBeenCalled();
    
    // Verify store function was called
    expect(mockAcceptRevision).toHaveBeenCalledWith('rev-1');
    
    // Verify toast success was shown
    expect(toast.success).toHaveBeenCalled();
  });

  test('should calculate revision counts correctly', () => {
    // Mock revisions with different statuses
    const mixedRevisions = [
      ...mockRevisions,
      {
        id: 'rev-3',
        documentId: 'doc-123',
        sectionId: 'section-3',
        originalText: 'Original text 3',
        proposedText: 'Proposed text 3',
        aiGenerated: true,
        status: 'rejected',
        createdAt: new Date(),
        createdBy: 'user-123'
      }
    ];
    
    // Set up store with mixed revisions
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: { id: 'doc-123' },
      pendingRevisions: mixedRevisions.filter(rev => rev.status === 'pending'),
      acceptRevision: jest.fn(),
      rejectRevision: jest.fn()
    });
    
    // Mock API to return all revisions
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mixedRevisions
    });
    
    const { result } = renderHook(() => useRevisionPanel());
    
    // Load the revisions
    act(() => {
      result.current.loadRevisions();
    });
    
    // Check counts
    expect(result.current.pendingCount).toBe(1); // One pending revision
    expect(result.current.acceptedCount).toBe(1); // One accepted revision
    expect(result.current.rejectedCount).toBe(1); // One rejected revision
    expect(result.current.revisions.length).toBe(3); // Total of 3 revisions
  });
}); 