'use client';

import { useDocumentStore } from '@/store/zustand';
import { useMemo, useState } from 'react';
import { Check, X, MessageSquare, Clock, UserCircle, Bot } from 'lucide-react';
import { SectionRevision } from '@/types';

interface RevisionPanelProps {
  showAccepted?: boolean;
  onlyAI?: boolean;
}

export function RevisionPanel({ showAccepted = false, onlyAI = false }: RevisionPanelProps) {
  const { 
    pendingRevisions, 
    revisions, 
    acceptRevision, 
    rejectRevision, 
    highlightedSection,
    setHighlightedSection 
  } = useDocumentStore();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [filter, setFilter] = useState<'all' | 'ai' | 'user'>(onlyAI ? 'ai' : 'all');
  
  // Filter revisions based on tab and filter settings
  const filteredRevisions = useMemo(() => {
    const revisionsToFilter = activeTab === 'pending' 
      ? pendingRevisions 
      : revisions.filter((rev: SectionRevision) => showAccepted || rev.status === 'rejected');
    
    if (filter === 'all') return revisionsToFilter;
    if (filter === 'ai') return revisionsToFilter.filter((rev: SectionRevision) => rev.aiGenerated);
    if (filter === 'user') return revisionsToFilter.filter((rev: SectionRevision) => !rev.aiGenerated);
    
    return revisionsToFilter;
  }, [activeTab, filter, pendingRevisions, revisions, showAccepted]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Handle clicking on a revision to highlight the corresponding section
  const handleRevisionClick = (sectionId: string) => {
    setHighlightedSection(sectionId);
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
        <h3 className="font-medium">Revisions</h3>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded text-sm ${activeTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm ${activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
        
        <div className="flex space-x-1">
          <button 
            className={`p-1 rounded text-sm ${filter === 'all' ? 'bg-gray-300' : 'bg-gray-200'}`}
            onClick={() => setFilter('all')}
            title="Show all revisions"
          >
            All
          </button>
          <button 
            className={`p-1 rounded text-sm ${filter === 'ai' ? 'bg-gray-300' : 'bg-gray-200'}`}
            onClick={() => setFilter('ai')}
            title="Show AI-generated revisions"
          >
            <Bot size={16} />
          </button>
          <button 
            className={`p-1 rounded text-sm ${filter === 'user' ? 'bg-gray-300' : 'bg-gray-200'}`}
            onClick={() => setFilter('user')}
            title="Show user-generated revisions"
          >
            <UserCircle size={16} />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[300px]">
        {filteredRevisions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {activeTab === 'pending' 
              ? 'No pending revisions' 
              : 'No revision history'}
          </div>
        ) : (
          <ul className="divide-y">
            {filteredRevisions.map((revision: SectionRevision) => (
              <li 
                key={`${revision.sectionId}-${revision.createdAt.getTime()}`}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptRevision(revision.sectionId);
                      }}
                      className="flex items-center px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                    >
                      <Check size={14} className="mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rejectRevision(revision.sectionId);
                      }}
                      className="flex items-center px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      <X size={14} className="mr-1" />
                      Reject
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