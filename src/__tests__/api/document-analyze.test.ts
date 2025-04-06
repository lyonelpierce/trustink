import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/documents/analyze/route';

// Mock auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'user-123' }),
}));

// Mock supabase client
jest.mock('@/lib/supabaseAdmin', () => ({
  createClient: jest.fn().mockReturnValue({}),
}));

// Mock supabase functions
jest.mock('@/lib/supabase', () => ({
  getDocumentById: jest.fn(),
  downloadDocument: jest.fn(),
  saveDocumentAnalysis: jest.fn(),
}));

// Mock document-ai
jest.mock('@/lib/document-ai', () => ({
  analyzeDocument: jest.fn().mockResolvedValue({
    summary: 'Test analysis summary',
    recommendations: ['Test recommendation']
  }),
}));

// Import mocked functions
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabaseAdmin';
import { getDocumentById, downloadDocument, saveDocumentAnalysis } from '@/lib/supabase';
import { analyzeDocument } from '@/lib/document-ai';

describe('Document Analysis API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET endpoint', () => {
    test('returns 401 when user is not authenticated', async () => {
      // Mock auth to return no user
      (auth as unknown as jest.Mock).mockResolvedValueOnce({ userId: null });
      
      // Create request with documentId
      const req = new NextRequest(
        new URL('http://localhost/api/documents/analyze?documentId=doc-123')
      );
      
      const response = await GET(req);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
    
    test('returns 400 when documentId is missing', async () => {
      // Create request without documentId
      const req = new NextRequest(
        new URL('http://localhost/api/documents/analyze')
      );
      
      const response = await GET(req);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Document ID is required');
    });
    
    test('returns 404 when document is not found', async () => {
      // Mock getDocumentById to return null
      (getDocumentById as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: new Error('Document not found')
      });
      
      // Create request with documentId
      const req = new NextRequest(
        new URL('http://localhost/api/documents/analyze?documentId=doc-123')
      );
      
      const response = await GET(req);
      const responseData = await response.json();
      
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Document not found');
    });
    
    test('returns existing analysis when available', async () => {
      // Mock getDocumentById to return document
      (getDocumentById as jest.Mock).mockResolvedValueOnce({
        data: { id: 'doc-123', path: 'documents/doc-123.pdf' },
        error: null
      });
      
      // Mock Supabase query to return existing analysis
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{
            content: {
              sections: [{ id: 'section-1', text: 'Test content' }],
              pageCount: 1
            }
          }],
          error: null
        })
      };
      
      (createClient as jest.Mock).mockReturnValueOnce(mockSupabase);
      
      // Create request with documentId
      const req = new NextRequest(
        new URL('http://localhost/api/documents/analyze?documentId=doc-123')
      );
      
      const response = await GET(req);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        sections: [{ id: 'section-1', text: 'Test content' }],
        pageCount: 1
      });
    });
    
    test('creates new analysis when none exists', async () => {
      // Mock getDocumentById to return document
      (getDocumentById as jest.Mock).mockResolvedValueOnce({
        data: { id: 'doc-123', path: 'documents/doc-123.pdf' },
        error: null
      });
      
      // Mock Supabase query to return no existing analysis
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
      
      (createClient as jest.Mock).mockReturnValueOnce(mockSupabase);
      
      // Mock downloadDocument to return file data
      (downloadDocument as jest.Mock).mockResolvedValueOnce({
        data: {
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1)),
          text: jest.fn().mockResolvedValue('Test document content')
        },
        error: null
      });
      
      // Mock saveDocumentAnalysis
      (saveDocumentAnalysis as jest.Mock).mockResolvedValueOnce({
        error: null
      });
      
      // Create request with documentId
      const req = new NextRequest(
        new URL('http://localhost/api/documents/analyze?documentId=doc-123')
      );
      
      const response = await GET(req);
      
      // The exact content is hard to assert because it depends on extractPdfSections
      // But we can check that we get a 200 response
      expect(response.status).toBe(200);
    });
  });
  
  describe('POST endpoint', () => {
    test('returns 401 when user is not authenticated', async () => {
      // Mock auth to return no user
      (auth as unknown as jest.Mock).mockResolvedValueOnce({ userId: null });
      
      // Create request with minimal data
      const req = new NextRequest(
        'http://localhost/api/documents/analyze',
        {
          method: 'POST',
          body: JSON.stringify({ documentId: 'doc-123' })
        }
      );
      
      const response = await POST(req);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
    
    test('returns 400 when documentId is missing', async () => {
      // Create request without documentId
      const req = new NextRequest(
        'http://localhost/api/documents/analyze',
        {
          method: 'POST',
          body: JSON.stringify({ question: 'Test question' })
        }
      );
      
      const response = await POST(req);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Document ID is required');
    });
    
    test('successfully analyzes document with question', async () => {
      // Mock getDocumentById to return document
      (getDocumentById as jest.Mock).mockResolvedValueOnce({
        data: { id: 'doc-123', path: 'documents/doc-123.pdf' },
        error: null
      });
      
      // Mock Supabase query to return existing analysis with sections
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{
            content: {
              sections: [{ id: 'section-1', text: 'Test content' }]
            }
          }],
          error: null
        })
      };
      
      (createClient as jest.Mock).mockReturnValueOnce(mockSupabase);
      
      // Mock downloadDocument to return file data
      (downloadDocument as jest.Mock).mockResolvedValueOnce({
        data: {
          text: jest.fn().mockResolvedValue('Test document content')
        },
        error: null
      });
      
      // Mock analyzeDocument to return analysis result
      (analyzeDocument as jest.Mock).mockResolvedValueOnce({
        summary: 'Test analysis summary',
        recommendations: ['Test recommendation']
      });
      
      // Mock saveDocumentAnalysis
      (saveDocumentAnalysis as jest.Mock).mockResolvedValueOnce({
        error: null
      });
      
      // Create request with documentId and question
      const req = new NextRequest(
        'http://localhost/api/documents/analyze',
        {
          method: 'POST',
          body: JSON.stringify({
            documentId: 'doc-123',
            question: 'What are the risks?',
            highlightedSectionId: 'section-1'
          })
        }
      );
      
      const response = await POST(req);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.analysis).toEqual({
        summary: 'Test analysis summary',
        recommendations: ['Test recommendation']
      });
      
      // Verify analyzeDocument was called with correct parameters
      expect(analyzeDocument).toHaveBeenCalledWith(
        {
          documentId: 'doc-123',
          question: 'What are the risks?',
          highlightedSectionId: 'section-1'
        },
        'Test document content',
        [{ id: 'section-1', text: 'Test content' }]
      );
      
      // Verify saveDocumentAnalysis was called
      expect(saveDocumentAnalysis).toHaveBeenCalled();
    });
  });
}); 