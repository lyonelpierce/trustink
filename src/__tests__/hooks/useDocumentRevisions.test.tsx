import { renderHook, act } from '@testing-library/react';
import { useDocumentRevisions } from '@/hooks/useDocumentRevisions';
import { useDocumentStore } from '@/store/zustand';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { toast } from 'sonner';
import { Mock } from 'jest-mock';

// Mock dependencies
jest.mock('@/store/zustand');
jest.mock('@/contexts/DemoModeContext');
jest.mock('sonner');

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('useDocumentRevisions hook', () => {
  // Setup mocks
  const mockAcceptRevision = jest.fn();
  const mockRejectRevision = jest.fn();
  const mockProposeRevision = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock zustand store
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      revisions: {
        'rev-1': {
          id: 'rev-1',
          documentId: 'doc-123',
          sectionId: 'section-1',
          originalText: 'Original text',
          proposedText: 'Proposed text',
          comment: 'Test comment',
          aiGenerated: true,
          status: 'pending',
          createdAt: new Date(),
          createdBy: 'ai-assistant',
          riskLevel: 'low',
          riskCategory: 'clarity'
        }
      },
      pendingRevisions: [
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
          createdBy: 'ai-assistant',
          riskLevel: 'low',
          riskCategory: 'clarity'
        }
      ],
      currentDocument: { id: 'doc-123' },
      acceptRevision: mockAcceptRevision,
      rejectRevision: mockRejectRevision,
      proposeRevision: mockProposeRevision
    });
    
    // Mock demoMode context
    (useDemoMode as unknown as jest.Mock).mockReturnValue({
      isDemoMode: true,
      usingMockData: true,
      setUsingMockData: jest.fn()
    });
    
    // Mock fetch to resolve successfully
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        id: 'rev-1', 
        status: 'accepted' 
      })
    });
    
    // Mock toast
    (toast.success as jest.Mock).mockImplementation(() => {});
    (toast.error as jest.Mock).mockImplementation(() => {});
  });
  
  test('should return revisions from store', () => {
    const { result } = renderHook(() => useDocumentRevisions('doc-123'));
    
    expect(result.current.revisions).toBeDefined();
    expect(result.current.pendingRevisions).toHaveLength(1);
    expect(result.current.pendingRevisions[0].id).toBe('rev-1');
  });
  
  test('should accept revision in demo mode', async () => {
    const { result } = renderHook(() => useDocumentRevisions('doc-123'));
    
    await act(async () => {
      await result.current.acceptRevision('rev-1');
    });
    
    // Verify store function was called
    expect(mockAcceptRevision).toHaveBeenCalledWith('rev-1');
    // Verify API was not called in demo mode
    expect(global.fetch).not.toHaveBeenCalled();
    // Verify toast was shown
    expect(toast.success).toHaveBeenCalledWith('Revision accepted');
  });
  
  test('should reject revision in demo mode', async () => {
    const { result } = renderHook(() => useDocumentRevisions('doc-123'));
    
    await act(async () => {
      await result.current.rejectRevision('rev-1');
    });
    
    // Verify store function was called
    expect(mockRejectRevision).toHaveBeenCalledWith('rev-1');
    // Verify API was not called in demo mode
    expect(global.fetch).not.toHaveBeenCalled();
    // Verify toast was shown
    expect(toast.success).toHaveBeenCalledWith('Revision rejected');
  });
  
  test('should propose revision in demo mode', async () => {
    const { result } = renderHook(() => useDocumentRevisions('doc-123'));
    
    await act(async () => {
      await result.current.proposeRevision(
        'section-1',
        'Original text',
        'New proposed text',
        'Test comment',
        'medium'
      );
    });
    
    // Verify store function was called
    expect(mockProposeRevision).toHaveBeenCalled();
    // Verify API was not called in demo mode
    expect(global.fetch).not.toHaveBeenCalled();
    // Verify toast was shown
    expect(toast.success).toHaveBeenCalledWith('Revision proposed');
  });
  
  test('should filter revisions', () => {
    const { result } = renderHook(() => useDocumentRevisions('doc-123'));
    
    act(() => {
      result.current.filterRevisions('all');
    });
    
    expect(result.current.currentFilter).toBe('all');
    
    act(() => {
      result.current.filterRevisions('pending');
    });
    
    expect(result.current.currentFilter).toBe('pending');
  });
  
  test('should handle non-demo mode API calls (mock)', async () => {
    // Change demo mode to false
    (useDemoMode as jest.Mock).mockReturnValue({
      isDemoMode: false,
      usingMockData: false,
      setUsingMockData: jest.fn()
    });
    
    const { result } = renderHook(() => useDocumentRevisions('doc-123'));
    
    await act(async () => {
      await result.current.acceptRevision('rev-1');
    });
    
    // Verify API was called
    expect(global.fetch).toHaveBeenCalled();
    // And store function was also called
    expect(mockAcceptRevision).toHaveBeenCalledWith('rev-1');
  });
}); 