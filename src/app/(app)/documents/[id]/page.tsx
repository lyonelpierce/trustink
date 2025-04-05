'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { EditableDocumentViewer } from '@/components/EditableDocumentViewer';
import { RevisionPanel } from '@/components/RevisionPanel';
import TextAnimation from '@/components/TextAnimation';
import { useDocumentStore } from '@/store/zustand';
import { DocumentAIProvider, useDocumentAI } from '@/providers/DocumentAIProvider';
import { toast } from 'sonner';
import { useConversation } from '@11labs/react';
import { Loader2, ThumbsUp, ThumbsDown, FileEdit, Users } from 'lucide-react';
import { handleError, safeAsync } from '@/lib/error-utils';
import ErrorBoundary from '@/components/ErrorBoundary';

const DocumentAnalysisContent = () => {
  console.log('[DocumentAnalysisContent] Component rendered');
  
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [isOwner] = useState(true);
  const [reviewMode, setReviewMode] = useState(false); // Toggle for review mode
  
  const { 
    setCurrentDocument, 
    proposeRevision, 
    pendingRevisions, 
    startRevisionSession 
  } = useDocumentStore();
  
  const { 
    proposeEdit, 
    highlightSection, 
    lastAction, 
    acceptLastEdit, 
    rejectLastEdit, 
    documentViewerRef 
  } = useDocumentAI();
  
  // Set up revision session ID for this conversation
  useEffect(() => {
    if (params.id) {
      console.log('[DocumentAnalysisContent] Starting revision session for:', params.id);
      startRevisionSession(`session-${params.id}`);
    }
    
    return () => {
      // Clean up revision session on unmount
    };
  }, [params.id, startRevisionSession]);
  
  // Load document data
  useEffect(() => {
    async function loadDocument() {
      console.log('[DocumentAnalysisContent] Loading document with ID:', params.id);
      try {
        setLoading(true);
        
        const [response, responseError] = await safeAsync(
          fetch(`/api/documents?id=${params.id}`),
          { context: 'loadDocument', showToast: false }
        );
        
        if (responseError || !response || !response.ok) {
          throw new Error('Failed to load document');
        }
        
        const [document, documentError] = await safeAsync(
          response.json(),
          { context: 'loadDocument.parseJson', showToast: false }
        );
        
        if (documentError || !document) {
          console.log('[DocumentAnalysisContent] Failed to parse document data');
          throw new Error('Failed to parse document data');
        }
        
        console.log('[DocumentAnalysisContent] Document loaded:', document.name);
        setDocumentName(document.name);
        
        // In a real app, we would download and process the actual document here
        // For demo purposes, we're setting a placeholder document
        setCurrentDocument({
          id: document.id,
          name: document.name,
          contractId: 'contract-123', // Mock contract ID
          ownerId: 'user-123', // Mock owner ID
          parsedContent: {
            sections: [
              {
                id: 'section-1',
                title: 'Termination Clause',
                text: 'The contract may be terminated at any time by the Provider without prior notice.',
                pageNumber: 1,
                position: { x: 50, y: 50, width: 700, height: 100 }
              },
              {
                id: 'section-2',
                title: 'Payment Terms',
                text: 'Payment is due within 30 days of receiving the invoice. Late payments are subject to a 5% monthly interest rate.',
                pageNumber: 1,
                position: { x: 50, y: 200, width: 700, height: 150 }
              },
              {
                id: 'section-3',
                title: 'Intellectual Property',
                text: 'All intellectual property developed during the engagement shall belong exclusively to the Provider.',
                pageNumber: 2,
                position: { x: 50, y: 50, width: 700, height: 100 }
              }
            ]
          }
        });
      } catch (error) {
        handleError(error, { 
          context: 'loadDocument', 
          customMessage: 'Failed to load document' 
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      loadDocument();
    }
    
    return () => {
      // Clean up
      setCurrentDocument(null);
    };
  }, [params.id, setCurrentDocument]);

  const conversation = useConversation({
    onError: (error: string) => { 
      console.log('[Conversation] Error:', error);
      toast.error(error); 
    },
    onConnect: () => { 
      console.log('[Conversation] Connected to ElevenLabs');
      toast.success('Connected to ElevenLabs'); 
    },
    onMessage: async (props: { message: string; source: string }) => {
      const { message, source } = props;
      console.log(`[Conversation] Message from ${source}:`, message.substring(0, 100) + (message.length > 100 ? '...' : ''));
      
      if (source === 'ai') {
        setCurrentText(message);
        
        // If the message contains section references, highlight them
        if (message.toLowerCase().includes('termination clause')) {
          highlightSection('section-1');
        } else if (message.toLowerCase().includes('payment terms')) {
          highlightSection('section-2');
        } else if (message.toLowerCase().includes('intellectual property')) {
          highlightSection('section-3');
        }
        
        // If AI is proposing a rewrite
        if (message.toLowerCase().includes('i\'ll rewrite') ||
            message.toLowerCase().includes('here\'s a better')) {
          
          let sectionId = '';
          let newText = '';
          let comment = '';
          
          // Determine which section to update based on the message
          if (message.toLowerCase().includes('termination')) {
            sectionId = 'section-1';
            newText = 'This agreement may be terminated by either party with 30 days written notice. Immediate termination is only permitted in cases of material breach.';
            comment = 'AI suggested a more balanced termination clause';
          } else if (message.toLowerCase().includes('payment')) {
            sectionId = 'section-2';
            newText = 'Payment is due within 45 days of receiving the invoice. Late payments are subject to a 2% monthly interest rate.';
            comment = 'AI suggested more favorable payment terms';
          } else if (message.toLowerCase().includes('intellectual property') || message.toLowerCase().includes('ip')) {
            sectionId = 'section-3';
            newText = 'All intellectual property developed during the engagement shall be jointly owned by both parties, with a perpetual license granted to the Provider for commercial use.';
            comment = 'AI suggested a joint ownership of IP';
          }
          
          if (sectionId && newText) {
            console.log('[Conversation] AI proposing edit for section:', sectionId);
            if (isOwner) {
              // If the user is the owner, propose the edit directly
              proposeEdit(sectionId, newText);
            } else {
              // If the user is a signer/reviewer, create a revision proposal
              proposeRevision(sectionId, newText, true, comment);
            }
          }
        }
      } else if (source === 'user') {
        // If user asks about concerns, trigger document analysis
        if (message.toLowerCase().includes('worry') || 
            message.toLowerCase().includes('concern') ||
            message.toLowerCase().includes('risk')) {
          await analyzeDocument();
        }
        
        // If user asks to rewrite a section
        if (message.toLowerCase().includes('rewrite') || 
            message.toLowerCase().includes('update') ||
            message.toLowerCase().includes('change')) {
          
          // Determine which section to update based on the message
          if (message.toLowerCase().includes('termination')) {
            setCurrentText('I\'ll rewrite the termination clause to be more balanced: "This agreement may be terminated by either party with 30 days written notice. Immediate termination is only permitted in cases of material breach."');
          } else if (message.toLowerCase().includes('payment')) {
            setCurrentText('I\'ll revise the payment terms to be more favorable: "Payment is due within 45 days of receiving the invoice. Late payments are subject to a 2% monthly interest rate."');
          }
        }
        
        // If user says yes, accept the last proposed edit
        if (lastAction.type === 'propose_edit' && 
            (message.toLowerCase().includes('yes') || 
             message.toLowerCase().includes('accept') || 
             message.toLowerCase().includes('approve'))) {
          console.log('[Conversation] User accepted proposed edit');
          acceptLastEdit();
          setCurrentText('Great! I\'ve updated the document with the changes.');
        }
        
        // If user says no, reject the last proposed edit
        if (lastAction.type === 'propose_edit' && 
            (message.toLowerCase().includes('no') || 
             message.toLowerCase().includes('reject') || 
             message.toLowerCase().includes('don\'t'))) {
          console.log('[Conversation] User rejected proposed edit');
          rejectLastEdit();
          setCurrentText('No problem. I\'ve discarded the suggested changes.');
        }
      }
      
      // Save conversation message to database
      // This would be implemented in a production version
    },
  });

  const analyzeDocument = async () => {
    if (!params.id) return;
    
    console.log('[DocumentAnalysisContent] Analyzing document...');
    try {
      setAnalyzing(true);
      // Make API call to analyze the document
      // ... rest of the function
    } catch (error) {
      handleError(error, {
        context: 'analyzeDocument',
        customMessage: 'Failed to analyze document'
      });
    } finally {
      setAnalyzing(false);
    }
  };
  
  const connectConversation = async () => {
    toast('Setting up ElevenLabs...');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const [response, responseError] = await safeAsync(
        fetch('/api/i', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
        { context: 'connectConversation', showToast: false }
      );
      
      if (responseError || !response) {
        throw new Error('Failed to connect to ElevenLabs');
      }
      
      const [data, dataError] = await safeAsync(
        response.json(),
        { context: 'connectConversation.parseJson', showToast: false }
      );
      
      if (dataError || !data) {
        throw new Error('Failed to parse response from ElevenLabs');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      await conversation.startSession({ signedUrl: data.apiKey });
    } catch (error) {
      handleError(error, {
        context: 'connectConversation',
        customMessage: 'Failed to set up ElevenLabs client'
      });
    }
  };
  
  const disconnectConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);
  
  const handleStartListening = () => {
    if (conversation.status !== 'connected') connectConversation();
  };
  
  const handleStopListening = () => {
    if (conversation.status === 'connected') disconnectConversation();
  };
  
  useEffect(() => {
    return () => {
      disconnectConversation();
    };
  }, [disconnectConversation]);

  // Add event logging for UI interactions
  const handleReviewModeToggle = (enabled: boolean) => {
    console.log('[DocumentAnalysisContent] Review mode toggled:', enabled);
    setReviewMode(enabled);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2">Loading document...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{documentName}</h1>
        
        <div className="flex space-x-3">
          {/* Toggle between edit and review modes */}
          <button 
            className={`flex items-center px-3 py-1.5 rounded ${reviewMode ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
            onClick={() => handleReviewModeToggle(false)}
            title="Edit mode"
          >
            <FileEdit size={16} className="mr-1" />
            Edit
          </button>
          <button 
            className={`flex items-center px-3 py-1.5 rounded ${reviewMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleReviewModeToggle(true)}
            title="Review mode"
          >
            <Users size={16} className="mr-1" />
            {pendingRevisions.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-1">
                {pendingRevisions.length}
              </span>
            )}
            Review
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main document area - takes 3 columns in review mode, 3 in edit mode */}
        <div className={`${reviewMode ? 'lg:col-span-3' : 'lg:col-span-3'}`}>
          <h2 className="text-xl font-semibold mb-4">Document</h2>
          <EditableDocumentViewer ref={documentViewerRef} />
          
          {/* Edit approval interface - only show in edit mode */}
          {!reviewMode && lastAction.type === 'propose_edit' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm mb-2">Do you want to apply this change?</p>
              <div className="flex space-x-2">
                <button 
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={acceptLastEdit}
                >
                  <ThumbsUp size={16} className="mr-1" />
                  Accept
                </button>
                <button 
                  className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={rejectLastEdit}
                >
                  <ThumbsDown size={16} className="mr-1" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Assistant and Revision Panel */}
        <div className="lg:col-span-2">
          {reviewMode ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Revisions</h2>
              <RevisionPanel showAccepted={true} />
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">About Review Mode</h3>
                <p className="text-sm text-gray-600 mb-2">
                  In review mode, you can see proposed changes from all parties. You can accept or reject 
                  each change individually.
                </p>
                <p className="text-sm text-gray-600">
                  The contract will only be final once all parties have agreed on the terms.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
              <div className="border rounded-lg p-6 bg-gray-50 h-[600px] flex flex-col">
                <p className="text-sm text-gray-500 mb-4">
                  Ask me questions about this document like &quot;Is there anything I should worry about?&quot; or &quot;Can you rewrite this section?&quot;
                </p>
                
                <div className="flex-1 flex items-center justify-center">
                  <TextAnimation 
                    currentText={currentText}
                    isAudioPlaying={conversation.isSpeaking}
                    onStopListening={handleStopListening}
                    onStartListening={handleStartListening}
                  />
                </div>
                
                {analyzing && (
                  <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing document...
                  </div>
                )}
              </div>
              
              {/* Show pending revision count */}
              {pendingRevisions.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-yellow-800">
                    {pendingRevisions.length} pending revision{pendingRevisions.length !== 1 ? 's' : ''}
                  </span>
                  <button 
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => setReviewMode(true)}
                  >
                    Review now
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DocumentAnalysisPage() {
  return (
    <ErrorBoundary>
      <DocumentAIProvider>
        <DocumentAnalysisContent />
      </DocumentAIProvider>
    </ErrorBoundary>
  );
} 