import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentAnalysisLayout } from '@/components/DocumentAnalysisLayout';
import { useDocumentStore } from '@/store/zustand';
import { RevisionPanel } from '@/components/RevisionPanel';
import { startMSWServer } from '@/mocks/msw-server';
import { mockDocument } from '@/mocks/document-mock';
import { auth } from '@clerk/nextjs/server';

// Define types for our mocks
interface MockDocumentStore {
  currentDocument: any | null;
  isDocumentLoading: boolean;
  highlightedSection?: string | null;
  loadError?: string;
  setCurrentDocument: jest.Mock;
  setDocumentLoading: jest.Mock;
  setHighlightedSection?: jest.Mock;
}

// Mock Clerk Auth
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn().mockReturnValue({
    isSignedIn: true,
    userId: 'test-user-id',
    isLoaded: true
  })
}));

// Mock the document store
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn()
}));

// Mock the RevisionPanel component
jest.mock('@/components/RevisionPanel', () => ({
  RevisionPanel: jest.fn(() => <div data-testid="mock-revision-panel">Revision Panel Mock</div>)
}));

// Mock the EditableDocumentViewer component
jest.mock('@/components/EditableDocumentViewer', () => ({
  EditableDocumentViewer: jest.fn(() => <div data-testid="document-viewer">Document Viewer Mock</div>)
}));

// Mock the VoiceAssistant component
jest.mock('@/components/VoiceAssistant', () => ({
  VoiceAssistant: jest.fn(() => <div data-testid="mock-voice-assistant">Ask questions about your document</div>)
}));

// Mock DemoMode context
jest.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: jest.fn().mockReturnValue({
    isDemoMode: false,
    usingMockData: false,
    setUsingMockData: jest.fn()
  })
}));

// Start MSW
startMSWServer();

describe('DocumentAnalysisLayout', () => {
  beforeEach(() => {
    // Mock auth to return a user
    (auth as unknown as jest.Mock).mockResolvedValue({
      userId: 'user-123',
      getToken: jest.fn().mockResolvedValue('mock-token')
    });
    
    // Setup document store with default values
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: null,
      isDocumentLoading: false,
      highlightedSection: null,
      setCurrentDocument: jest.fn(),
      setDocumentLoading: jest.fn(),
      setHighlightedSection: jest.fn()
    } as MockDocumentStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state while fetching document', async () => {
    // Set loading state to true
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: null,
      isDocumentLoading: true,
      setCurrentDocument: jest.fn(),
      setDocumentLoading: jest.fn()
    } as MockDocumentStore);

    render(<DocumentAnalysisLayout documentId="doc-123" />);
    
    // Check for loading indicator
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('renders document when loaded successfully', async () => {
    // Mock successful document load
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: mockDocument,
      isDocumentLoading: false,
      setCurrentDocument: jest.fn(),
      setDocumentLoading: jest.fn(),
      setHighlightedSection: jest.fn()
    } as MockDocumentStore);

    render(<DocumentAnalysisLayout documentId="doc-123" />);
    
    // Wait for document to be rendered
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Check for the document viewer
    expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
  });

  test('renders error state when document fetch fails', async () => {
    // Mock the store to return an error state
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: null,
      isDocumentLoading: false,
      loadError: 'Failed to load document', 
      setCurrentDocument: jest.fn(),
      setDocumentLoading: jest.fn()
    } as MockDocumentStore);

    render(<DocumentAnalysisLayout documentId="error-doc" />);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to load document/i)).toBeInTheDocument();
    });
  });

  test('switches between tabs', async () => {
    // Mock successful document load
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: mockDocument,
      isDocumentLoading: false,
      setCurrentDocument: jest.fn(),
      setDocumentLoading: jest.fn(),
      setHighlightedSection: jest.fn()
    } as MockDocumentStore);

    render(<DocumentAnalysisLayout documentId="doc-123" />);
    
    // Setup user event
    const user = userEvent.setup();
    
    // Wait for document to be rendered
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Check that AI assistant tab is active by default
    expect(screen.getByText(/Ask questions about/i)).toBeInTheDocument();
    
    // Click on Revisions tab
    await user.click(screen.getByRole('tab', { name: /Revisions/i }));
    
    // Check that Revisions tab is now active
    expect(screen.getByTestId('mock-revision-panel')).toBeInTheDocument();
    
    // Click back to AI Assistant tab
    await user.click(screen.getByRole('tab', { name: /AI Assistant/i }));
    
    // Check that AI Assistant tab is active again
    expect(screen.getByText(/Ask questions about/i)).toBeInTheDocument();
  });
}); 