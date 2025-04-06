import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserDashboard } from '@/components/UserDashboard';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn()
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}));

// Mock formatDistanceToNow from date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago')
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('UserDashboard Component', () => {
  // Setup mock data
  const mockDocuments = [
    {
      id: 'doc-1',
      name: 'Contract.pdf',
      created_at: '2023-04-01T12:00:00Z',
      updated_at: '2023-04-01T12:00:00Z',
      size: 1024 * 1024, // 1MB
      type: 'application/pdf'
    },
    {
      id: 'doc-2',
      name: 'Agreement.pdf',
      created_at: '2023-03-28T10:00:00Z',
      updated_at: '2023-03-29T15:30:00Z',
      size: 512 * 1024, // 512KB
      type: 'application/pdf'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Clerk auth with userId
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'user-123'
    });
  });

  test('renders loading state initially', () => {
    // Mock a pending fetch that doesn't resolve immediately
    mockFetch.mockReturnValue(new Promise(() => {}));
    
    render(<UserDashboard />);
    
    expect(screen.getByText(/Loading your documents/i)).toBeInTheDocument();
  });

  test('renders documents when fetch succeeds', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockDocuments)
    });
    
    render(<UserDashboard />);
    
    // Check for loading state initially
    expect(screen.getByText(/Loading your documents/i)).toBeInTheDocument();
    
    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('Agreement.pdf')).toBeInTheDocument();
      // Check for file size formatting
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      expect(screen.getByText('512.0 KB')).toBeInTheDocument();
      // Check for date formatting
      expect(screen.getAllByText('2 days ago').length).toBe(2);
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/documents');
  });

  test('renders error state when fetch fails', async () => {
    // Mock failed fetch response
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    });
    
    render(<UserDashboard />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Failed to load your documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    });
    
    // Verify toast error was called
    expect(toast.error).toHaveBeenCalledWith('Failed to load your documents');
  });

  test('renders empty state when no documents are available', async () => {
    // Mock empty response
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([])
    });
    
    render(<UserDashboard />);
    
    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/No documents yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload your first document/i)).toBeInTheDocument();
    });
    
    // Check for the upload button
    const uploadLink = screen.getByText(/Upload Document/i);
    expect(uploadLink).toBeInTheDocument();
    expect(uploadLink.closest('a')).toHaveAttribute('href', '/upload');
  });

  test('does not fetch documents when userId is not available', () => {
    // Mock Clerk auth with no userId
    (useAuth as jest.Mock).mockReturnValue({
      userId: null
    });
    
    render(<UserDashboard />);
    
    // Fetch should not be called without a userId
    expect(mockFetch).not.toHaveBeenCalled();
  });
}); 