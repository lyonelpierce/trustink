"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDocumentStore } from '@/store/zustand';
import { SectionRevision, RiskLevel } from '@/types';
import { ErrorLocations } from '@/types/error';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { toast } from 'sonner';
import { handleError } from '@/lib/error-handler';

/**
 * Interface for the return value of useDocumentRevisions hook
 */
interface UseDocumentRevisionsResult {
  /**
   * List of all revisions for the current document
   */
  revisions: SectionRevision[];
  
  /**
   * List of pending revisions for the current document
   */
  pendingRevisions: SectionRevision[];
  
  /**
   * Whether revisions are currently loading
   */
  isLoading: boolean;
  
  /**
   * Error message if loading revisions failed
   */
  error: string | null;
  
  /**
   * Accept a revision by ID
   */
  acceptRevision: (revisionId: string) => Promise<void>;
  
  /**
   * Reject a revision by ID
   */
  rejectRevision: (revisionId: string) => Promise<void>;
  
  /**
   * Propose a new revision for a section
   */
  proposeRevision: (
    sectionId: string, 
    originalText: string, 
    proposedText: string, 
    comment?: string,
    riskLevel?: RiskLevel
  ) => Promise<void>;
  
  /**
   * Filter revisions by different criteria
   */
  filterRevisions: (filter: 'all' | 'pending' | 'accepted' | 'rejected') => void;
  
  /**
   * Current filter applied to revisions
   */
  currentFilter: 'all' | 'pending' | 'accepted' | 'rejected';
}

/**
 * Custom hook for managing document revisions
 * 
 * Abstracts business logic for fetching, creating, accepting, and rejecting
 * document revisions away from the UI components.
 * 
 * @param documentId - ID of the current document
 * @returns An object with revisions and methods to manage them
 */
export function useDocumentRevisions(documentId?: string): UseDocumentRevisionsResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  
  const { isDemoMode, usingMockData } = useDemoMode();
  
  const { 
    revisions,
    pendingRevisions,
    acceptRevision: acceptRevisionStore,
    rejectRevision: rejectRevisionStore,
    proposeRevision: proposeRevisionStore,
    currentDocument
  } = useDocumentStore();

  /**
   * Loads revisions for the current document
   */
  const loadRevisions = useCallback(async () => {
    if (!documentId && !currentDocument?.id) {
      console.log('[useDocumentRevisions] No document ID provided');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // If in demo mode or using mock data, use mock revisions
      if (isDemoMode || usingMockData) {
        console.log('[useDocumentRevisions] Using mock revisions in demo mode');
        // In a real implementation, would dispatch to the store here
        // For now, the store already has mock data
        setIsLoading(false);
        return;
      }
      
      // For real implementation, fetch revisions from API
      const docId = documentId || currentDocument?.id;
      console.log(`[useDocumentRevisions] Fetching revisions for document ${docId}`);
      
      const response = await fetch(`/api/contracts/revisions?documentId=${docId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch revisions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // In a real implementation, would dispatch to the store here
      // store.dispatch({ type: 'SET_REVISIONS', payload: data.revisions });
      
      console.log(`[useDocumentRevisions] Loaded ${data.revisions?.length || 0} revisions`);
    } catch (error) {
      console.error('[useDocumentRevisions] Error loading revisions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load revisions');
      
      // If we have mock data available, use it as fallback
      if (isDemoMode) {
        console.log('[useDocumentRevisions] Falling back to mock revisions');
        // Mock data already in store
      }
      
      handleError(error, {
        customMessage: 'Failed to fetch document revisions',
        context: { location: ErrorLocations.DOCUMENT_REVISIONS },
        showToast: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [documentId, currentDocument, isDemoMode, usingMockData]);

  // Load revisions when the document changes
  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  /**
   * Accept a revision
   */
  const acceptRevision = async (revisionId: string) => {
    console.log(`[useDocumentRevisions] Accepting revision ${revisionId}`);
    
    try {
      setError(null);
      
      if (isDemoMode || usingMockData) {
        // Use local store for demo mode
        acceptRevisionStore(revisionId);
        toast.success('Revision accepted');
        return;
      }
      
      // For real implementation
      const response = await fetch(`/api/contracts/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'accepted',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to accept revision: ${response.statusText}`);
      }
      
      // Update local state through the store
      acceptRevisionStore(revisionId);
      toast.success('Revision accepted');
    } catch (error) {
      console.error('[useDocumentRevisions] Error accepting revision:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept revision');
      toast.error('Failed to accept revision');
    }
  };

  /**
   * Reject a revision
   */
  const rejectRevision = async (revisionId: string) => {
    console.log(`[useDocumentRevisions] Rejecting revision ${revisionId}`);
    
    try {
      setError(null);
      
      if (isDemoMode || usingMockData) {
        // Use local store for demo mode
        rejectRevisionStore(revisionId);
        toast.success('Revision rejected');
        return;
      }
      
      // For real implementation
      const response = await fetch(`/api/contracts/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reject revision: ${response.statusText}`);
      }
      
      // Update local state through the store
      rejectRevisionStore(revisionId);
      toast.success('Revision rejected');
    } catch (error) {
      console.error('[useDocumentRevisions] Error rejecting revision:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject revision');
      toast.error('Failed to reject revision');
    }
  };

  /**
   * Propose a new revision
   */
  const proposeRevision = async (
    sectionId: string, 
    originalText: string, 
    proposedText: string, 
    comment?: string,
    riskLevel?: RiskLevel
  ) => {
    console.log(`[useDocumentRevisions] Proposing revision for section ${sectionId}`);
    
    try {
      setError(null);
      
      if (!documentId && !currentDocument?.id) {
        throw new Error('No document ID available');
      }
      
      const docId = documentId || currentDocument?.id;
      
      if (isDemoMode || usingMockData) {
        // Use local store for demo mode - adapt to expected signature
        // store expects: sectionId, newText, aiGenerated, comment, riskLevel
        proposeRevisionStore(
          sectionId,                // sectionId
          proposedText,             // newText
          false,                    // aiGenerated (user-generated)
          comment || 'Proposed revision',  // comment
          riskLevel                 // riskLevel
        );
        toast.success('Revision proposed');
        return;
      }
      
      // For real implementation
      const response = await fetch('/api/contracts/revisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: docId,
          changes: [
            {
              sectionId,
              originalText,
              proposedText,
              comment,
              riskLevel
            }
          ]
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to propose revision: ${response.statusText}`);
      }
      
      // Response received successfully, but we don't need to use the data
      await response.json();
      
      // Update local state - adapt to expected signature
      // store expects: sectionId, newText, aiGenerated, comment, riskLevel
      proposeRevisionStore(
        sectionId,                // sectionId
        proposedText,             // newText
        false,                    // aiGenerated (user-generated)
        comment || 'Proposed revision',  // comment
        riskLevel                 // riskLevel
      );
      
      toast.success('Revision proposed successfully');
    } catch (error) {
      console.error('[useDocumentRevisions] Error proposing revision:', error);
      setError(error instanceof Error ? error.message : 'Failed to propose revision');
      
      // Use standardized error handling
      handleError(error, {
        customMessage: 'Failed to propose document revision',
        context: { location: ErrorLocations.DOCUMENT_REVISIONS },
        showToast: true
      });
    }
  };

  /**
   * Filter revisions by status
   */
  const filterRevisions = (filter: 'all' | 'pending' | 'accepted' | 'rejected') => {
    setCurrentFilter(filter);
  };

  return {
    revisions,
    pendingRevisions,
    isLoading,
    error,
    acceptRevision,
    rejectRevision,
    proposeRevision,
    filterRevisions,
    currentFilter
  };
} 