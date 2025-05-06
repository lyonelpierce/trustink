# API Testing Guide

This document provides comprehensive guidance on testing API routes in the TrustInk application, ensuring consistent and thorough test coverage across the codebase.

## API Testing Approach

API tests in TrustInk should follow a structured approach:

1. **Isolation**: Test API routes in isolation by mocking dependencies
2. **Coverage**: Test all possible paths through the API (success, errors, edge cases)
3. **Authentication**: Always test authentication and authorization
4. **Consistency**: Use standardized patterns for all API tests
5. **Maintainability**: Create reusable helpers and fixtures

## Project Test Structure

```
src/
└── __tests__/
    ├── api/
    │   ├── documents.test.ts       # Tests for document endpoints
    │   ├── documents-analyze.test.ts  # Tests for document analysis endpoints
    │   ├── contracts.test.ts       # Tests for contract endpoints
    │   ├── webhooks.test.ts        # Tests for webhook endpoints
    │   └── utils/                  # Shared API test utilities
    │       ├── mock-request.ts     # Helper for creating mock requests
    │       ├── mock-auth.ts        # Authentication mocking utilities
    │       └── mock-supabase.ts    # Supabase client mocking utilities
    └── mocks/
        ├── handlers.ts             # MSW request handlers
        └── server.ts               # MSW server setup
```

## Standard Test Structure

Every API test file should follow this structure:

```typescript
// src/__tests__/api/documents.test.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GET, POST, DELETE } from '@/app/api/documents/route';
import { 
  // Import all functions used by the API
  getDocumentById,
  getUserDocuments,
  // ... other imports
} from '@/lib/supabase';
import { createServerSupabaseClient } from '@/lib/supabaseSsr';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabaseSsr');
jest.mock('@/lib/supabase');

// Import or define test helpers
import { createMockRequest } from '../utils/mock-request';
import { createMockFile } from '../utils/mock-file';

describe('Document API Routes', () => {
  // Test constants
  const mockUserId = 'user_123';
  const mockDocumentId = 'doc_123';
  
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure default mocks
    (auth as unknown as jest.Mock).mockResolvedValue({
      userId: mockUserId,
      getToken: jest.fn().mockResolvedValue('mock-token')
    });
  });

  // Group tests by HTTP method
  describe('GET /api/documents', () => {
    test('returns 401 when user is not authenticated', async () => {
      // Mock setup specific to this test
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: null });
      
      // Execute request
      const request = createMockRequest('https://example.com/api/documents', 'GET');
      const response = await GET(request);
      
      // Assertions
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });
    
    // Additional test cases...
  });

  // Additional HTTP method groups...
});
```

## Mock Request Helper

Create a standardized helper for generating mock requests:

```typescript
// src/__tests__/utils/mock-request.ts
import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest object for testing API routes.
 * 
 * @param url - The request URL
 * @param method - The HTTP method
 * @param body - Optional request body (for POST/PUT requests)
 * @param headers - Optional request headers
 * @returns A mock NextRequest object
 */
export function createMockRequest(
  url: string, 
  method = 'GET', 
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  // Create URL object for proper URL parameter handling
  const urlObj = new URL(url);
  
  // Create basic request object
  const request = {
    url,
    method,
    nextUrl: urlObj,
    headers: new Headers(headers),
    // Handle various body formats
    formData: jest.fn().mockResolvedValue(body instanceof FormData ? body : new FormData()),
    json: jest.fn().mockResolvedValue(body),
    // Add additional methods as needed
    clone: jest.fn().mockReturnThis(),
  } as unknown as NextRequest;
  
  return request;
}

/**
 * Creates a mock file that can be used in FormData for testing file uploads
 */
export function createMockFile(name: string, type: string, size: number): File {
  return {
    name,
    type,
    size,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(size))
  } as unknown as File;
}
```

## Authentication Testing

All API routes should have authentication tests:

```typescript
// Authentication test examples
describe('Authentication', () => {
  test('returns 401 when user is not authenticated', async () => {
    // Mock auth to return no user
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: null });
    
    const request = createMockRequest('/api/documents', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });
  
  test('returns 403 when user tries to access unauthorized resource', async () => {
    // Set up a resource that belongs to a different user
    (getDocumentById as jest.Mock).mockResolvedValue({
      data: { id: 'doc123', user_id: 'different_user_id' },
      error: null
    });
    
    const request = createMockRequest('/api/documents?id=doc123', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Access denied' });
  });
});
```

## Input Validation Testing

Test validation for all API inputs:

```typescript
// Input validation test examples
describe('Input Validation', () => {
  test('returns 400 when document ID format is invalid', async () => {
    const request = createMockRequest('/api/documents?id=invalid-id', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ 
      error: 'Invalid document ID format' 
    });
  });
  
  test('returns 400 when required fields are missing', async () => {
    const formData = new FormData();
    // Missing file field
    
    const request = createMockRequest('/api/documents', 'POST', formData);
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ 
      error: 'No file provided' 
    });
  });
  
  test('validates file type', async () => {
    const mockFile = createMockFile('test.txt', 'text/plain', 1024);
    const formData = new FormData();
    formData.append('file', mockFile);
    
    const request = createMockRequest('/api/documents', 'POST', formData);
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ 
      error: 'Only PDF files are accepted' 
    });
  });
});
```

## Success Path Testing

Test the happy path thoroughly:

```typescript
// Success path test examples
describe('Successful Operations', () => {
  test('retrieves a list of documents for the user', async () => {
    const mockDocuments = [
      { id: 'doc1', name: 'Document 1' },
      { id: 'doc2', name: 'Document 2' }
    ];
    
    (getUserDocuments as jest.Mock).mockResolvedValue({
      data: mockDocuments,
      error: null
    });
    
    const request = createMockRequest('/api/documents', 'GET');
    const response = await GET(request);
    
    expect(getUserDocuments).toHaveBeenCalledWith(mockUserId);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockDocuments);
  });
  
  test('uploads document and processes it successfully', async () => {
    // Create a mock file and form data
    const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);
    const formData = new FormData();
    formData.append('file', mockFile);
    formData.append('name', 'Test Document');
    
    // Set up mocks for the upload process
    (uploadDocumentFile as jest.Mock).mockResolvedValue({
      data: { path: 'documents/test.pdf' },
      error: null
    });
    
    (createDocumentRecord as jest.Mock).mockResolvedValue({
      data: { id: mockDocumentId, name: 'Test Document' },
      error: null
    });
    
    const request = createMockRequest('/api/documents', 'POST', formData);
    const response = await POST(request);
    
    expect(uploadDocumentFile).toHaveBeenCalled();
    expect(createDocumentRecord).toHaveBeenCalled();
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('id', mockDocumentId);
    expect(responseData).toHaveProperty('message', 'Document uploaded successfully');
  });
});
```

## Error Handling Testing

Test error handling paths:

```typescript
// Error handling test examples
describe('Error Handling', () => {
  test('handles storage error during upload', async () => {
    const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);
    const formData = new FormData();
    formData.append('file', mockFile);
    
    // Mock upload failure
    (uploadDocumentFile as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Storage error')
    });
    
    const request = createMockRequest('/api/documents', 'POST', formData);
    const response = await POST(request);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ 
      error: 'Failed to upload document' 
    });
  });
  
  test('returns empty array instead of error when document fetch fails', async () => {
    (getUserDocuments as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });
    
    const request = createMockRequest('/api/documents', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
  
  test('handles unexpected errors gracefully', async () => {
    // Force an unexpected error
    (getUserDocuments as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    
    const request = createMockRequest('/api/documents', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ 
      error: 'An unexpected error occurred' 
    });
  });
});
```

## Mocking Database Operations

Create effective Supabase client mocks:

```typescript
// Example of a comprehensive Supabase client mock
const createMockSupabaseClient = () => {
  const mockSupabaseClient = {
    // Create a basic client with chain methods
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    
    // Storage methods
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        remove: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn()
      })
    },

    // Auth methods
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn()
    }
  };
  
  return mockSupabaseClient;
};

// Set up specific method responses for a test
beforeEach(() => {
  const mockSupabaseClient = createMockSupabaseClient();
  
  // Configure for this specific test
  mockSupabaseClient.from().select().eq().single.mockResolvedValue({
    data: { id: 'doc123', name: 'Test Document' },
    error: null
  });
  
  (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
});
```

## Testing File Uploads

File uploads require special handling in tests:

```typescript
// File upload test helper
function setupFileUploadTest(fileProperties = {}) {
  // Create a mock file
  const mockFile = createMockFile(
    fileProperties.name || 'test.pdf',
    fileProperties.type || 'application/pdf',
    fileProperties.size || 1024
  );
  
  // Create form data
  const formData = new FormData();
  formData.append('file', mockFile);
  
  if (fileProperties.name) {
    formData.append('name', fileProperties.name);
  }
  
  // Set up mocks
  (uploadDocumentFile as jest.Mock).mockResolvedValue({
    data: { path: `documents/${fileProperties.name || 'test.pdf'}` },
    error: null
  });
  
  (createDocumentRecord as jest.Mock).mockResolvedValue({
    data: { id: 'doc123', name: fileProperties.name || 'test.pdf' },
    error: null
  });
  
  return { mockFile, formData };
}

// Usage
test('uploads document with custom name', async () => {
  const { formData } = setupFileUploadTest({
    name: 'Contract-2023.pdf',
    size: 2048
  });
  
  const request = createMockRequest('/api/documents', 'POST', formData);
  const response = await POST(request);
  
  expect(response.status).toBe(200);
  expect(createDocumentRecord).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      name: 'Contract-2023.pdf'
    }),
    mockUserId
  );
});
```

## Testing Query Parameters

Test various query parameter scenarios:

```typescript
// Query parameter tests
describe('Query Parameter Handling', () => {
  test('retrieves specific document when id is provided', async () => {
    (getDocumentById as jest.Mock).mockResolvedValue({
      data: { id: mockDocumentId, name: 'Test Document' },
      error: null
    });
    
    const request = createMockRequest(`/api/documents?id=${mockDocumentId}`, 'GET');
    const response = await GET(request);
    
    expect(getDocumentById).toHaveBeenCalledWith(
      expect.anything(), 
      mockDocumentId, 
      mockUserId
    );
    expect(response.status).toBe(200);
  });
  
  test('includes metadata when includeMetadata=true', async () => {
    (getUserDocumentsWithMeta as jest.Mock).mockResolvedValue({
      data: [{ id: 'doc1', name: 'Document 1', metadata: { pageCount: 10 } }],
      error: null
    });
    
    const request = createMockRequest('/api/documents?includeMetadata=true', 'GET');
    const response = await GET(request);
    
    expect(getUserDocumentsWithMeta).toHaveBeenCalledWith(mockUserId);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data[0]).toHaveProperty('metadata');
    expect(data[0].metadata).toHaveProperty('pageCount', 10);
  });
});
```

## Testing with Mock Service Worker (MSW)

For more complex API interactions, use MSW:

```typescript
// src/__tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('https://api.openai.com/v1/engines/:engineId/completions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'mock-completion-id',
        object: 'text_completion',
        created: Date.now(),
        choices: [
          {
            text: 'This is a mock completion response for testing',
            index: 0,
            logprobs: null,
            finish_reason: 'stop'
          }
        ]
      })
    );
  }),
  
  rest.post('https://api.elevenlabs.io/v1/conversation', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'mock-conversation-id',
        url: 'https://mock-url.com/audio.mp3'
      })
    );
  })
];

// In your test file:
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Integration Testing APIs

For integration testing where multiple systems interact:

```typescript
// Integration test example with document upload and analysis
test('uploads document and triggers analysis', async () => {
  // Create the document upload components
  const { mockFile, formData } = setupFileUploadTest();
  
  // Mock successful upload
  const uploadRequest = createMockRequest('/api/documents', 'POST', formData);
  const uploadResponse = await POST(uploadRequest);
  
  expect(uploadResponse.status).toBe(200);
  const uploadData = await uploadResponse.json();
  expect(uploadData).toHaveProperty('id');
  
  // Now test that we can get the document
  const getRequest = createMockRequest(`/api/documents?id=${uploadData.id}`, 'GET');
  const getResponse = await GET(getRequest);
  
  expect(getResponse.status).toBe(200);
  
  // Finally test that we can analyze it
  const analyzeRequest = createMockRequest('/api/documents/analyze', 'POST', {
    documentId: uploadData.id,
    question: 'What is this document about?'
  });
  
  // We'd need to import and mock the analyze endpoint
  // const analyzeResponse = await ANALYZE(analyzeRequest);
  // expect(analyzeResponse.status).toBe(200);
});
```

## Testing API Security

Security-focused tests:

```typescript
// Security tests
describe('API Security', () => {
  test('prevents access to another user\'s document', async () => {
    // Setup document that belongs to a different user
    (getDocumentById as jest.Mock).mockResolvedValue({
      data: { 
        id: 'doc123', 
        user_id: 'different_user_id',
        name: 'Confidential Document' 
      },
      error: null
    });
    
    // Attempt to access it with our test user
    const request = createMockRequest('/api/documents?id=doc123', 'GET');
    const response = await GET(request);
    
    // Should return forbidden
    expect(response.status).toBe(403);
  });
  
  test('sanitizes error messages in production', async () => {
    // Save the original environment
    const originalEnv = process.env.NODE_ENV;
    
    try {
      // Set to production
      process.env.NODE_ENV = 'production';
      
      // Force a database error
      (getUserDocuments as jest.Mock).mockImplementation(() => {
        throw new Error('Internal database connection string: password123');
      });
      
      const request = createMockRequest('/api/documents', 'GET');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const errorData = await response.json();
      
      // Should not expose internal details
      expect(errorData.error).toBe('An unexpected error occurred');
      expect(errorData).not.toHaveProperty('details');
      expect(errorData.error).not.toContain('password123');
      
    } finally {
      // Restore the environment
      process.env.NODE_ENV = originalEnv;
    }
  });
});
```

## Testing Performance

Test API performance constraints:

```typescript
// Performance tests
describe('API Performance Constraints', () => {
  test('rejects files larger than the size limit', async () => {
    // Create a file larger than the limit (e.g., 11MB)
    const largeFile = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024);
    const formData = new FormData();
    formData.append('file', largeFile);
    
    const request = createMockRequest('/api/documents', 'POST', formData);
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ 
      error: 'File size exceeds 10MB limit' 
    });
  });
  
  test('limits the number of results returned', async () => {
    // Generate lots of mock documents
    const manyDocuments = Array.from({ length: 100 }, (_, i) => ({
      id: `doc${i}`,
      name: `Document ${i}`
    }));
    
    (getUserDocuments as jest.Mock).mockResolvedValue({
      data: manyDocuments,
      error: null
    });
    
    const request = createMockRequest('/api/documents', 'GET');
    const response = await GET(request);
    
    const results = await response.json();
    // API should limit results
    expect(results.length).toBeLessThanOrEqual(50);
  });
});
```

## Test Coverage Requirements

To ensure thorough testing, API route tests should cover:

1. **Authentication**
   - Unauthenticated requests
   - Authorization checks
   - Token validation

2. **Input Validation**
   - Missing required fields
   - Invalid data formats
   - Invalid file types/sizes
   - Invalid query parameters

3. **Success Paths**
   - Basic CRUD operations
   - Expected response formats
   - Proper data transformation

4. **Error Handling**
   - Database errors
   - Storage errors
   - Unexpected exceptions
   - Not found scenarios
   - Validation errors

5. **Security**
   - Data access restrictions
   - Error message sanitization
   - Input sanitization

6. **Performance**
   - Size limits
   - Rate limiting (if applicable)
   - Result pagination

## Conclusion

Following these testing standards ensures that the TrustInk API remains robust, secure, and maintainable. Each API endpoint should have comprehensive test coverage before being considered production-ready.

Remember these key principles:
- Test in isolation by mocking dependencies
- Cover all possible paths through the API
- Use consistent patterns and helpers
- Test both success and error scenarios
- Focus on security and error handling 