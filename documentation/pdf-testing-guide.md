# PDF Upload and Processing Testing Guide

This document provides comprehensive testing procedures for the PDF upload, storage, and processing workflow in TrustInk.

## Testing Environment Setup

1. **Local Development Environment**
   - Ensure Supabase local instance is running
   - Set up test buckets in Supabase storage
   - Create test users in Clerk

2. **Test Data Preparation**
   - Prepare test PDF files of various sizes (small, medium, large)
   - Create PDFs with different structures (simple, complex, multi-page)
   - Include PDFs with different types of content (text, images, tables)

3. **Environment Variables**
   - Configure appropriate test environment variables
   - Set up separate storage bucket for testing

## Unit Tests

### DocumentUploader Component

```tsx
// src/__tests__/components/DocumentUploader.test.tsx

describe('DocumentUploader Component', () => {
  beforeEach(() => {
    // Setup mocks for storage and document store
    jest.clearAllMocks();
    (useDocumentStore as jest.Mock).mockReturnValue({
      setCurrentDocument: mockSetCurrentDocument,
      setDocumentLoading: mockSetDocumentLoading,
      isDocumentLoading: false
    });
  });

  it('validates file type and rejects non-PDF files', async () => {
    render(<DocumentUploader />);
    
    const file = createMockTextFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Validation should reject the file
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please upload a PDF file');
      expect(mockSetDocumentLoading).not.toHaveBeenCalled();
    });
  });

  it('processes PDF files and uploads to server', async () => {
    // Mock successful fetch response
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'doc-123', name: 'test.pdf' })
      })
    );

    render(<DocumentUploader />);
    
    const file = createMockPdfFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check upload process
    await waitFor(() => {
      expect(mockSetDocumentLoading).toHaveBeenCalledWith(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/documents', expect.any(Object));
      expect(mockSetCurrentDocument).toHaveBeenCalledWith(expect.objectContaining({
        id: 'doc-123',
        name: 'test.pdf'
      }));
      expect(toast.success).toHaveBeenCalledWith('Document uploaded successfully');
    });
  });

  it('handles fetch errors during upload', async () => {
    // Mock failed fetch response
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      })
    );

    render(<DocumentUploader />);
    
    const file = createMockPdfFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check error handling
    await waitFor(() => {
      expect(mockSetDocumentLoading).toHaveBeenCalledWith(true);
      expect(mockSetDocumentLoading).toHaveBeenCalledWith(false);
      expect(handleError).toHaveBeenCalled();
    });
  });
});
```

### Document API Endpoints

```tsx
// src/__tests__/api/documents.test.ts

describe('Document API Endpoints', () => {
  beforeEach(() => {
    // Mock Supabase client and responses
    mockSupabaseClient.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'documents/test.pdf' }, error: null })
    });
    
    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: { id: 'doc-123' }, error: null })
      })
    });
    
    // Mock auth
    mockAuth.mockResolvedValue({ userId: 'user-123' });
  });

  it('POST /api/documents uploads PDF and creates record', async () => {
    // Create test FormData with file
    const formData = new FormData();
    formData.append('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }));
    
    const req = new Request('http://localhost/api/documents', {
      method: 'POST',
      body: formData
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual(expect.objectContaining({
      id: 'doc-123',
      name: 'test.pdf',
      path: 'documents/test.pdf'
    }));
    
    // Verify Supabase calls
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('documents');
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents');
  });

  it('GET /api/documents retrieves document by ID', async () => {
    // Mock document fetch response
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { id: 'doc-123', name: 'test.pdf' }, 
              error: null 
            })
          })
        })
      })
    });
    
    const req = new Request('http://localhost/api/documents?id=doc-123');
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual(expect.objectContaining({
      id: 'doc-123',
      name: 'test.pdf'
    }));
  });

  it('handles unauthorized requests', async () => {
    // Mock unauthorized user
    mockAuth.mockResolvedValue({ userId: null });
    
    const req = new Request('http://localhost/api/documents');
    const response = await GET(req);
    
    expect(response.status).toBe(401);
  });
});
```

### PDF Processing Functions

```tsx
// src/__tests__/lib/pdfProcessing.test.ts

describe('PDF Processing Functions', () => {
  it('extracts PDF sections correctly', async () => {
    // Mock PDF document
    const pdfDoc = {
      getPageCount: jest.fn().mockReturnValue(2),
      getPage: jest.fn().mockImplementation((index) => ({
        getSize: jest.fn().mockReturnValue({ width: 612, height: 792 })
      }))
    };
    
    PDFDocument.load = jest.fn().mockResolvedValue(pdfDoc);
    
    const buffer = new ArrayBuffer(8);
    const result = await extractPdfSections(buffer);
    
    expect(result.pageCount).toBe(2);
    expect(result.sections.length).toBe(2);
    expect(result.sections[0]).toEqual(expect.objectContaining({
      id: 'page-1',
      pageNumber: 1,
      position: expect.objectContaining({
        width: 612,
        height: 792
      })
    }));
  });

  it('handles errors in PDF processing', async () => {
    // Mock PDF loading error
    PDFDocument.load = jest.fn().mockRejectedValue(new Error('Invalid PDF'));
    
    const buffer = new ArrayBuffer(8);
    
    await expect(extractPdfSections(buffer)).rejects.toThrow('Failed to extract sections from PDF');
  });
});
```

## Integration Tests

### Upload to View Flow

```tsx
// src/__tests__/integration/uploadToView.test.tsx

describe('Upload to View Integration Flow', () => {
  beforeAll(() => {
    // Setup mock server responses
    server.use(
      rest.post('/api/documents', (req, res, ctx) => {
        return res(ctx.json({
          id: 'doc-123',
          name: 'test.pdf',
          path: 'documents/test.pdf'
        }));
      }),
      rest.get('/api/documents', (req, res, ctx) => {
        return res(ctx.json({
          id: 'doc-123',
          name: 'test.pdf',
          user_id: 'user-123'
        }));
      }),
      rest.get('/api/documents/analyze', (req, res, ctx) => {
        return res(ctx.json({
          sections: [
            {
              id: 'page-1',
              title: 'Page 1',
              text: 'Test content',
              pageNumber: 1,
              position: { x: 0, y: 0, width: 612, height: 792 }
            }
          ],
          pageCount: 1
        }));
      })
    );
  });

  it('completes full upload to view flow', async () => {
    // Render the upload component
    const { getByText, findByText } = render(
      <TestWrapper>
        <DocumentUploader />
      </TestWrapper>
    );
    
    // Simulate file upload
    const file = createMockPdfFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    // Wait for upload success
    await findByText('Document uploaded successfully');
    
    // Navigate to document page
    const { findByText: findInDocPage } = render(
      <TestWrapper>
        <DocumentAnalysisPage params={{ id: 'doc-123' }} />
      </TestWrapper>
    );
    
    // Verify document is displayed
    await findInDocPage('test.pdf');
    await findInDocPage('Test content');
  });
});
```

### Document Analysis Flow

```tsx
// src/__tests__/integration/documentAnalysis.test.tsx

describe('Document Analysis Integration Flow', () => {
  beforeAll(() => {
    // Setup mock server responses
    server.use(
      rest.get('/api/documents/analyze', (req, res, ctx) => {
        return res(ctx.json({
          sections: [
            {
              id: 'section-1',
              title: 'Termination Clause',
              text: 'The contract may be terminated...',
              pageNumber: 1,
              position: { x: 0, y: 0, width: 500, height: 100 }
            }
          ],
          analysis: {
            riskySections: [
              {
                id: 'section-1',
                risk: 'high',
                explanation: 'This clause gives unilateral rights'
              }
            ]
          }
        }));
      })
    );
  });

  it('analyzes document and highlights sections', async () => {
    // Setup document store with a loaded document
    (useDocumentStore as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        name: 'test.pdf',
        parsedContent: {
          sections: [
            {
              id: 'section-1',
              title: 'Termination Clause',
              text: 'The contract may be terminated...',
              pageNumber: 1,
              position: { x: 0, y: 0, width: 500, height: 100 }
            }
          ]
        }
      },
      setHighlightedSection: mockSetHighlightedSection
    });
    
    // Render document analysis component
    const { getByText, findByText } = render(
      <TestWrapper>
        <DocumentAnalysisContent documentId="doc-123" />
      </TestWrapper>
    );
    
    // Simulate asking a question about concerns
    fireEvent.change(screen.getByPlaceholderText('Ask about this document...'), {
      target: { value: 'What should I worry about?' }
    });
    fireEvent.click(screen.getByText('Send'));
    
    // Verify the section gets highlighted
    await waitFor(() => {
      expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-1');
    });
    
    // Verify analysis is displayed
    await findByText('This clause gives unilateral rights');
  });
});
```

## End-to-End Tests

For end-to-end testing, we'll use Cypress to simulate the complete user experience:

```javascript
// cypress/integration/document-upload.spec.js

describe('Document Upload and Analysis E2E', () => {
  beforeEach(() => {
    // Login to test account
    cy.login();
    cy.visit('/dashboard');
  });

  it('uploads a PDF and views it successfully', () => {
    // Navigate to upload page
    cy.contains('Upload Document').click();
    
    // Upload a test PDF file
    cy.get('input[type="file"]').attachFile('test.pdf');
    
    // Verify upload success
    cy.contains('Document uploaded successfully', { timeout: 10000 }).should('be.visible');
    
    // Verify document appears in list and click to view
    cy.visit('/documents');
    cy.contains('test.pdf').click();
    
    // Verify document loads and displays content
    cy.contains('Page 1').should('be.visible');
    cy.get('.document-section').should('have.length.at.least', 1);
  });

  it('analyzes a document and highlights sections', () => {
    // Navigate to existing document
    cy.visit('/documents');
    cy.contains('test.pdf').click();
    
    // Ask question about document
    cy.get('[data-testid="ai-input"]').type('What should I be concerned about in this contract?');
    cy.get('[data-testid="send-button"]').click();
    
    // Verify AI response
    cy.contains('I found some concerns', { timeout: 15000 }).should('be.visible');
    
    // Verify section highlighting
    cy.get('.bg-yellow-50').should('be.visible');
  });

  it('creates and manages document revisions', () => {
    // Navigate to existing document
    cy.visit('/documents');
    cy.contains('test.pdf').click();
    
    // Switch to revision mode
    cy.contains('Revision Mode').click();
    
    // Create a new revision
    cy.contains('Termination Clause').closest('.document-section').click();
    cy.get('[data-testid="edit-button"]').click();
    cy.get('[data-testid="section-editor"]').clear().type('The contract may be terminated by either party with 30 days notice.');
    cy.get('[data-testid="save-button"]').click();
    
    // Verify revision appears in the panel
    cy.get('[data-testid="revision-panel"]').contains('Termination Clause').should('be.visible');
    
    // Accept the revision
    cy.get('[data-testid="accept-button"]').click();
    
    // Verify document is updated
    cy.contains('The contract may be terminated by either party with 30 days notice.').should('be.visible');
  });
});
```

## Performance Testing

### Load Testing Script

Use k6 for load testing the document upload flow:

```javascript
// k6/document-upload-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load test files
const testFiles = new SharedArray('test PDFs', function() {
  // Return array of test files with their content
  return [
    { name: 'small.pdf', size: 100000, content: open('./files/small.pdf', 'b') },
    { name: 'medium.pdf', size: 1000000, content: open('./files/medium.pdf', 'b') },
    { name: 'large.pdf', size: 5000000, content: open('./files/large.pdf', 'b') },
  ];
});

export let options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '3m', target: 10 }, // Stay at 10 users
    { duration: '1m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<5000'], // 95% of requests should be below 5s
    'http_req_failed': ['rate<0.05'],    // Less than 5% of requests should fail
  },
};

export default function() {
  // Get auth token (implement authentication logic)
  const authToken = getAuthToken();
  
  // Select a random test file
  const file = testFiles[Math.floor(Math.random() * testFiles.length)];
  
  // Upload file
  const formData = {
    file: http.file(file.content, file.name, 'application/pdf'),
  };
  
  const response = http.post('https://app.trustink.dev/api/documents', formData, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  // Check response
  check(response, {
    'Upload successful': (r) => r.status === 200,
    'Response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  // If successful, check document processing
  if (response.status === 200) {
    const documentId = JSON.parse(response.body).id;
    
    // Poll analysis endpoint until processing is complete
    let analysisComplete = false;
    let attempts = 0;
    
    while (!analysisComplete && attempts < 10) {
      sleep(1);
      attempts++;
      
      const analysisResponse = http.get(`https://app.trustink.dev/api/documents/analyze?documentId=${documentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (analysisResponse.status === 200) {
        const analysis = JSON.parse(analysisResponse.body);
        if (analysis.sections && analysis.sections.length > 0) {
          analysisComplete = true;
          
          check(analysisResponse, {
            'Analysis successful': (r) => r.status === 200,
            'Sections extracted': (r) => analysis.sections.length > 0,
            'Analysis time < 10s': (r) => r.timings.duration < 10000,
          });
        }
      }
    }
  }
  
  sleep(1);
}
```

## Error Scenarios Testing

For robustness, test the following error scenarios:

1. **Invalid File Types**
   - Attempt to upload non-PDF files (DOC, JPG, etc.)
   - Verify proper error messaging

2. **Corrupted PDFs**
   - Upload malformed PDF files
   - Verify error handling and user feedback

3. **Large Files**
   - Test with files exceeding size limits
   - Verify proper error messaging and handling

4. **Network Failures**
   - Simulate network interruptions during upload
   - Test retry mechanisms

5. **Server Errors**
   - Simulate 5xx responses from server
   - Verify error handling and user feedback

6. **Database Failures**
   - Simulate database connection issues
   - Test fallback mechanisms

## Testing Metrics to Track

| Metric | Target | Monitoring Method |
|--------|--------|-------------------|
| Upload Success Rate | >99% | Log analysis |
| Average Upload Time | <2s | Performance monitoring |
| PDF Processing Success | >95% | Log analysis |
| Text Extraction Accuracy | >90% | Manual verification |
| Section Highlighting Speed | <500ms | Front-end metrics |
| User Error Rate | <5% | User session analysis |

## Automated Testing Setup

1. **CI/CD Pipeline Integration**
   - Run unit and integration tests on every PR
   - Run performance tests on scheduled basis
   - Block deployment on test failures

2. **Test Report Generation**
   - Generate coverage reports
   - Track metrics over time
   - Identify regression issues

3. **Testing Environment Management**
   - Use Docker containers for consistent testing
   - Reset database state between test runs
   - Manage test data lifecycle

## Conclusion

This comprehensive testing guide provides a structured approach to ensuring the PDF upload, storage, and processing workflow functions correctly, performs well, and handles errors gracefully. By following these testing procedures, we can deliver a robust and reliable document management system to our users. 