'use client';

import { SectionRevision } from '@/types';
import { Check, X, MessageSquare, Clock, UserCircle, Bot } from 'lucide-react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DemoModeIndicator } from './DemoModeIndicator';
import { useRevisionPanel } from '@/hooks/useRevisionPanel';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/state';

/**
 * RevisionPanel component props
 */
interface RevisionPanelProps {
  /**
   * Whether to show accepted revisions
   */
  showAccepted?: boolean;
  
  /**
   * Whether to only show AI-generated revisions
   */
  onlyAI?: boolean;
}

/**
 * RevisionPanel component
 * 
 * Displays a list of pending and historical revisions for the current document,
 * with options to accept or reject revisions.
 * 
 * Features:
 * - Tabbed interface for pending vs. historical revisions
 * - Filtering by AI-generated vs. user-generated revisions
 * - Section highlighting on click
 * - Accept/reject functionality for pending revisions
 * - Demo mode support
 */
export function RevisionPanel({ showAccepted = false, onlyAI = false }: RevisionPanelProps) {
  const { usingMockData } = useDemoMode();
  const {
    activeTab,
    filter,
    isLoading,
    error,
    highlightedSection,
    filteredRevisions,
    handleAcceptRevision,
    handleRejectRevision,
    handleRevisionClick,
    handleFilterChange,
    handleTabChange,
    formatDate,
    processingRevisionId
  } = useRevisionPanel({ showAccepted, onlyAI });
  
  // Get error message as string
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;
  
  return (
    <div className="border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Demo mode indicator */}
      {usingMockData && (
        <DemoModeIndicator className="m-2" />
      )}
      
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
        <h3 className="font-medium">Revisions</h3>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded text-sm ${activeTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleTabChange('pending')}
          >
            Pending
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm ${activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleTabChange('history')}
          >
            History
          </button>
        </div>
        
        <div className="flex space-x-1">
          <button 
            className={`p-1 rounded text-sm ${filter === 'all' ? 'bg-gray-300' : 'bg-gray-200'}`}
            onClick={() => handleFilterChange('all')}
            title="Show all revisions"
          >
            All
          </button>
          <button 
            className={`p-1 rounded text-sm ${filter === 'ai' ? 'bg-gray-300' : 'bg-gray-200'}`}
            onClick={() => handleFilterChange('ai')}
            title="Show AI-generated revisions"
          >
            <Bot size={16} />
          </button>
          <button 
            className={`p-1 rounded text-sm ${filter === 'user' ? 'bg-gray-300' : 'bg-gray-200'}`}
            onClick={() => handleFilterChange('user')}
            title="Show user-generated revisions"
          >
            <UserCircle size={16} />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {isLoading ? (
          <LoadingState
            title="Loading revisions"
            compact={true}
          />
        ) : errorMessage ? (
          <ErrorState
            title="Error loading revisions"
            description={errorMessage}
            compact={true}
          />
        ) : filteredRevisions.length === 0 ? (
          <EmptyState
            title={activeTab === 'pending' ? 'No pending revisions' : 'No revision history'}
            compact={true}
          />
        ) : (
          <ul className="divide-y">
            {filteredRevisions.map((revision: SectionRevision) => (
              <li 
                key={revision.id || revision.sectionId}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  highlightedSection === revision.sectionId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleRevisionClick(revision.sectionId)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    {revision.aiGenerated ? (
                      <Bot size={16} className="text-purple-500 mr-1" />
                    ) : (
                      <UserCircle size={16} className="text-blue-500 mr-1" />
                    )}
                    <span className="font-medium">{revision.sectionId}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    <span>{formatDate(revision.createdAt)}</span>
                  </div>
                </div>
                
                {revision.comment && (
                  <div className="flex items-center text-sm text-gray-600 mt-1 mb-2">
                    <MessageSquare size={14} className="mr-1" />
                    <span>{revision.comment}</span>
                  </div>
                )}
                
                <div className="mt-2 text-sm">
                  <div className="bg-red-50 p-2 rounded-md mb-2 line-through">
                    {revision.originalText.length > 100 
                      ? `${revision.originalText.substring(0, 100)}...` 
                      : revision.originalText}
                  </div>
                  <div className="bg-green-50 p-2 rounded-md">
                    {revision.proposedText.length > 100 
                      ? `${revision.proposedText.substring(0, 100)}...` 
                      : revision.proposedText}
                  </div>
                </div>
                
                {activeTab === 'pending' && (
                  <div className="flex justify-end mt-3 space-x-2">
                    <button
                      onClick={(e) => handleAcceptRevision(revision.id || revision.sectionId, e)}
                      className="flex items-center px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                      disabled={processingRevisionId === revision.id}
                    >
                      <Check size={14} className="mr-1" />
                      {processingRevisionId === revision.id ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={(e) => handleRejectRevision(revision.id || revision.sectionId, e)}
                      className="flex items-center px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      disabled={processingRevisionId === revision.id}
                    >
                      <X size={14} className="mr-1" />
                      {processingRevisionId === revision.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
                
                {activeTab === 'history' && (
                  <div className="flex justify-end mt-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      revision.status === 'accepted' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {revision.status === 'accepted' ? 'Accepted' : 'Rejected'}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 