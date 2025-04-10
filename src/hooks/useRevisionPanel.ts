"use client";

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { SectionRevision } from '@/types';
import { useDocumentStore } from '@/store/zustand';
import { handleError, safeAsync } from '@/lib/error-handler';
import { acceptRevision, rejectRevision, getRevisionsByDocument } from '@/lib/api-client';
import { ErrorLocations } from '@/types/error';

export interface RevisionGroup {
  sectionId: string;
  sectionTitle?: string;
  revisions: SectionRevision[];
}

interface UseRevisionPanelOptions {
  /**
   * Whether to show accepted revisions
   */
  showAccepted?: boolean;
  
  /**
   * Optional document ID to override the one from the store
   */
  documentId?: string;
  
  /**
   * Whether the panel is in a demo mode
   */
  isDemo?: boolean;

  /**
   * Whether to only show AI-generated revisions
   */
  onlyAI?: boolean;
}

/**
 * Custom hook to handle revision panel business logic
 */
export function useRevisionPanel(options: UseRevisionPanelOptions = {}) {
  const { showAccepted = false, documentId: externalDocId, isDemo = false, onlyAI = false } = options;
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [revisions, setRevisions] = useState<SectionRevision[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [filter, setFilter] = useState<'all' | 'ai' | 'user'>('all');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [processingRevisionId, setProcessingRevisionId] = useState<string | null>(null);
  
  // Get document and revisions from the store
  const {
    currentDocument,
    pendingRevisions: storeRevisions,
    acceptRevision: acceptRevisionInStore,
    rejectRevision: rejectRevisionInStore,
  } = useDocumentStore();
  
  // Use document ID from props or from the store
  const documentId = externalDocId || currentDocument?.id;
  
  /**
   * Fetch revisions from the API
   */
  const fetchRevisions = useCallback(async () => {
    if (!documentId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (isDemo) {
        // In demo mode, use the revisions from the store
        setRevisions(storeRevisions);
        return;
      }
      
      // Fetch revisions from the API
      const [response, error] = await safeAsync(getRevisionsByDocument(documentId));
      
      if (error) {
        throw error;
      }
      
      if (response) {
        setRevisions(response);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch revisions');
      setError(error);
      handleError(error, {
        customMessage: 'Failed to fetch revisions',
        context: { location: ErrorLocations.REVISION_PANEL },
        showToast: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [documentId, isDemo, storeRevisions]);
  
  /**
   * Handle click on a revision to highlight its section
   */
  const handleRevisionClick = useCallback((sectionId: string | undefined) => {
    if (sectionId) {
      setHighlightedSection(sectionId);
    }
  }, []);

  /**
   * Handle tab change (pending/history)
   */
  const handleTabChange = useCallback((tab: 'pending' | 'history') => {
    setActiveTab(tab);
  }, []);

  /**
   * Handle filter change (all/ai/user)
   */
  const handleFilterChange = useCallback((filterOption: 'all' | 'ai' | 'user') => {
    setFilter(filterOption);
  }, []);

  /**
   * Format date for display
   */
  const formatDate = useCallback((dateString: string | Date) => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  /**
   * Enhanced accept revision handler that manages processing state
   */
  const handleAcceptRevision = useCallback(async (revisionId: string, e?: React.MouseEvent) => {
    // Stop event propagation to prevent triggering parent onClick handlers
    if (e) {
      e.stopPropagation();
    }
    
    if (!documentId || !revisionId) return;
    
    try {
      setProcessingRevisionId(revisionId);
      
      const revision = revisions.find(r => r.id === revisionId || r.sectionId === revisionId);
      if (!revision) {
        throw new Error(`Revision with ID ${revisionId} not found`);
      }
      
      // Update UI immediately for better UX
      toast.loading('Accepting revision...');
      
      if (isDemo) {
        // In demo mode, just update the store
        acceptRevisionInStore(revisionId);
        toast.success('Revision accepted');
        return;
      }
      
      // Update the API and then the store
      const [, error] = await safeAsync(acceptRevision(revisionId));
      
      if (error) {
        throw error;
      }
      
      // Update the store with the API response
      acceptRevisionInStore(revisionId);
      
      // Refetch revisions to ensure we have the latest data
      await fetchRevisions();
      
      toast.success('Revision accepted successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to accept revision');
      handleError(error, {
        customMessage: 'Failed to accept revision',
        context: { location: ErrorLocations.REVISION_PANEL },
        showToast: true
      });
    } finally {
      setProcessingRevisionId(null);
    }
  }, [documentId, revisions, isDemo, acceptRevisionInStore, fetchRevisions]);
  
  /**
   * Enhanced reject revision handler that manages processing state
   */
  const handleRejectRevision = useCallback(async (revisionId: string, e?: React.MouseEvent) => {
    // Stop event propagation to prevent triggering parent onClick handlers
    if (e) {
      e.stopPropagation();
    }
    
    if (!documentId || !revisionId) return;
    
    try {
      setProcessingRevisionId(revisionId);
      
      const revision = revisions.find(r => r.id === revisionId || r.sectionId === revisionId);
      if (!revision) {
        throw new Error(`Revision with ID ${revisionId} not found`);
      }
      
      // Update UI immediately for better UX
      toast.loading('Rejecting revision...');
      
      if (isDemo) {
        // In demo mode, just update the store
        rejectRevisionInStore(revisionId);
        toast.success('Revision rejected');
        return;
      }
      
      // Update the API and then the store
      const [, error] = await safeAsync(rejectRevision(revisionId));
      
      if (error) {
        throw error;
      }
      
      // Update the store with the API response
      rejectRevisionInStore(revisionId);
      
      // Refetch revisions to ensure we have the latest data
      await fetchRevisions();
      
      toast.success('Revision rejected successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reject revision');
      handleError(error, {
        customMessage: 'Failed to reject revision',
        context: { location: ErrorLocations.REVISION_PANEL },
        showToast: true
      });
    } finally {
      setProcessingRevisionId(null);
    }
  }, [documentId, revisions, isDemo, rejectRevisionInStore, fetchRevisions]);

  /**
   * Filtered revisions based on current tab and filter
   */
  const filteredRevisions = useMemo(() => {
    let result = [...revisions];
    
    // First filter by status based on active tab
    if (activeTab === 'pending') {
      result = result.filter(rev => rev.status === 'pending' || !rev.status);
    } else if (activeTab === 'history') {
      result = result.filter(rev => rev.status === 'accepted' || rev.status === 'rejected');
    }
    
    // Then apply AI/user filter
    if (filter === 'ai') {
      result = result.filter(rev => rev.aiGenerated);
    } else if (filter === 'user') {
      result = result.filter(rev => !rev.aiGenerated);
    }
    
    // Apply onlyAI filter from options if specified
    if (onlyAI) {
      result = result.filter(rev => rev.aiGenerated);
    }
    
    // Sort by creation date (newest first)
    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [revisions, activeTab, filter, onlyAI]);
  
  /**
   * Group revisions by section for better UI organization
   */
  const revisionGroups = useMemo(() => {
    // Only use non-empty revisions array
    if (!revisions.length) return [];
    
    // Filter revisions based on showAccepted parameter
    const filteredRevisions = showAccepted 
      ? revisions 
      : revisions.filter(rev => rev.status === 'pending');
    
    // Create a map of sectionId -> revisions
    const sectionMap: Record<string, SectionRevision[]> = {};
    
    filteredRevisions.forEach(revision => {
      if (!sectionMap[revision.sectionId]) {
        sectionMap[revision.sectionId] = [];
      }
      sectionMap[revision.sectionId].push(revision);
    });
    
    // Convert the map to an array of groups
    const groups: RevisionGroup[] = Object.keys(sectionMap).map(sectionId => {
      const sectionRevisions = sectionMap[sectionId];
      const sectionTitle = currentDocument?.parsedContent?.sections.find(
        section => section.id === sectionId
      )?.title;
      
      return {
        sectionId,
        sectionTitle,
        revisions: sectionRevisions,
      };
    });
    
    return groups;
  }, [revisions, showAccepted, currentDocument]);
  
  /**
   * Load revisions when component mounts or when dependencies change
   */
  const loadRevisions = useCallback(() => {
    if (documentId) {
      fetchRevisions();
    }
  }, [documentId, fetchRevisions]);
  
  /**
   * Count pending revisions
   */
  const pendingCount = useMemo(() => {
    return revisions.filter(rev => rev.status === 'pending').length;
  }, [revisions]);
  
  /**
   * Count accepted revisions
   */
  const acceptedCount = useMemo(() => {
    return revisions.filter(rev => rev.status === 'accepted').length;
  }, [revisions]);
  
  /**
   * Count rejected revisions
   */
  const rejectedCount = useMemo(() => {
    return revisions.filter(rev => rev.status === 'rejected').length;
  }, [revisions]);
  
  // Return all the state and handlers needed by the RevisionPanel component
  return {
    isLoading,
    error,
    revisions,
    revisionGroups,
    documentId,
    pendingCount,
    acceptedCount,
    rejectedCount,
    fetchRevisions,
    handleAcceptRevision,
    handleRejectRevision,
    loadRevisions,
    showAccepted,
    // New additions
    activeTab,
    filter,
    highlightedSection,
    filteredRevisions,
    handleRevisionClick,
    handleFilterChange,
    handleTabChange,
    formatDate,
    processingRevisionId,
    // For backward compatibility with tests
    isDemo
  };
} 