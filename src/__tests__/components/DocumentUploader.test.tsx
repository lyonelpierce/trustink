import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { DocumentUploader } from '@/components/DocumentUploader';
import { createMockPdfFile, createMockTextFile } from '../mocks/fileMock';

// Mock the PDF processing library
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn().mockResolvedValue({
      getPageCount: jest.fn().mockReturnValue(1),
      getPage: jest.fn().mockReturnValue({
        getSize: jest.fn().mockReturnValue({ width: 800, height: 1000 })
      })
    })
  }
}));

// Mock the fetch function
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 'mock-doc-id' })
  })
) as jest.Mock;

// Mock error handling functions
jest.mock('@/lib/error-utils', () => ({
  handleError: jest.fn(),
  safeAsync: jest.fn().mockImplementation(async (promise) => {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      return [null, error];
    }
  })
}));

// Mock the Zustand store
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn()
}));

// Mock the toast notification
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn().mockReturnValue({ update: jest.fn(), success: jest.fn(), error: jest.fn() })
  }
}));

// Helper to get the file input element
const getFileInput = (): HTMLInputElement => {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
};

describe('DocumentUploader Component', () => {
  const mockSetCurrentDocument = jest.fn();
  const mockSetDocumentLoading = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Mock the document store
    const useDocumentStore = jest.requireMock('@/store/zustand').useDocumentStore;
    useDocumentStore.mockReturnValue({
      setCurrentDocument: mockSetCurrentDocument,
      setDocumentLoading: mockSetDocumentLoading,
      isDocumentLoading: false
    });
  });

  test('renders the uploader component', () => {
    render(<DocumentUploader />);
    expect(screen.getByText(/Upload your document/i)).toBeInTheDocument();
    expect(getFileInput()).toBeInTheDocument();
  });

  test('shows loading state when isDocumentLoading is true', () => {
    // Mock loading state
    const useDocumentStore = jest.requireMock('@/store/zustand').useDocumentStore;
    useDocumentStore.mockReturnValue({
      setCurrentDocument: mockSetCurrentDocument,
      setDocumentLoading: mockSetDocumentLoading,
      isDocumentLoading: true
    });
    
    render(<DocumentUploader />);
    expect(screen.getByText(/Processing document/i)).toBeInTheDocument();
  });

  test('rejects non-PDF files', async () => {
    render(<DocumentUploader />);
    
    const file = createMockTextFile();
    const fileInput = getFileInput();
    
    // Try to upload a non-PDF file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Verify error message
    expect(toast.error).toHaveBeenCalledWith('Please upload a PDF file');
    expect(mockSetDocumentLoading).not.toHaveBeenCalled();
  });

  test('validates file size and rejects files larger than 10MB', async () => {
    render(<DocumentUploader />);
    
    // Create a mock file that's too large (11MB)
    const largeFile = new File(
      ['x'.repeat(11 * 1024 * 1024)], 
      'large.pdf', 
      { type: 'application/pdf' }
    );
    
    const fileInput = getFileInput();
    
    // Try to upload a large file
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    // Verify error message
    expect(toast.error).toHaveBeenCalledWith('File size exceeds 10MB limit');
    expect(mockSetDocumentLoading).not.toHaveBeenCalled();
  });
});
