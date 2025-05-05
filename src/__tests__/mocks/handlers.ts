import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import { mockDocument } from '@/mocks/document-mock';
import { mockRevisions } from '@/mocks/revision-mock';

// Mock API handlers for testing
export const handlers: HttpHandler[] = [
  // Document endpoints
  http.get('/api/documents', ({ request, params }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      return HttpResponse.json({
        id,
        name: 'Test Document',
        path: 'test-path',
        type: 'application/pdf',
        size: 12345,
        user_id: 'test-user',
        created_at: new Date().toISOString(),
      });
    }
    
    return HttpResponse.json({
      documents: [
        {
          id: 'doc-123',
          name: 'Test Document 1',
          path: 'test-path-1',
          type: 'application/pdf',
          size: 12345,
          user_id: 'test-user',
          created_at: new Date().toISOString(),
        },
        {
          id: 'doc-456',
          name: 'Test Document 2',
          path: 'test-path-2',
          type: 'application/pdf',
          size: 67890,
          user_id: 'test-user',
          created_at: new Date().toISOString(),
        }
      ]
    });
  }),
  
  // Document analysis endpoint
  http.get('/api/documents/analyze', ({ request }) => {
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return HttpResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      sections: mockDocument.sections,
      metadata: {
        pageCount: 10,
        documentType: 'Contract',
        language: 'en'
      }
    });
  }),
  
  // Contract revisions endpoints
  http.get('/api/contracts/revisions', ({ request }) => {
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return HttpResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ revisions: mockRevisions });
  }),
  
  http.post('/api/contracts/revisions', () => {
    return HttpResponse.json(
      { 
        id: `rev-${Date.now()}`,
        message: 'Revision created successfully'
      },
      { status: 201 }
    );
  }),
  
  http.patch('/api/contracts/revisions/:id', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({ 
      id,
      message: 'Revision updated successfully'
    });
  }),
  
  // Error scenarios for testing error handling
  http.get('/api/error/unauthorized', () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),
  
  http.get('/api/error/server', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),
  
  http.get('/api/error/timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return HttpResponse.json(
      { error: 'Request Timeout' },
      { status: 408 }
    );
  })
];

export default handlers; 