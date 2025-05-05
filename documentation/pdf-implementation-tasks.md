# PDF Upload and Processing Implementation Tasks

This document provides a detailed task checklist for implementing the complete PDF upload, storage, and viewing workflow in TrustInk.

## Document Upload Component

- [ ] **File Validation**
  - [x] Implement file type validation (PDF only)
  - [ ] Add file size validation (limit to 10MB)
  - [ ] Implement file integrity check
  - [ ] Add clear error messaging for validation failures

- [ ] **Upload UI Enhancements**
  - [ ] Add drag-and-drop functionality
  - [ ] Implement upload progress indicator
  - [ ] Create upload cancellation option
  - [ ] Add file preview before upload
  - [ ] Improve error state UI with retry options

- [ ] **Backend Integration**
  - [x] Create FormData with file for API submission
  - [x] Post to document upload endpoint
  - [ ] Implement chunked upload for large files
  - [ ] Add retry logic for failed uploads
  - [ ] Implement proper error handling for various failure scenarios

## PDF Processing

- [ ] **Text Extraction**
  - [x] Basic PDF loading with pdf-lib
  - [ ] Implement advanced text extraction with pdf.js
  - [ ] Extract text by page and position
  - [ ] Handle text formatting and styles
  - [ ] Process embedded fonts correctly

- [ ] **Section Detection**
  - [ ] Implement paragraph detection algorithm
  - [ ] Detect headings and sections based on formatting
  - [ ] Group related content into logical sections
  - [ ] Preserve document hierarchy
  - [ ] Identify tables and structured data

- [ ] **Metadata Extraction**
  - [ ] Extract document title and author information
  - [ ] Identify creation and modification dates
  - [ ] Extract document keywords and properties
  - [ ] Process custom metadata fields
  - [ ] Handle document permissions and restrictions

## Supabase Integration

- [ ] **Storage Configuration**
  - [x] Set up Supabase storage bucket for documents
  - [ ] Configure appropriate bucket permissions
  - [ ] Set up storage lifecycle policies
  - [ ] Implement access control for documents
  - [ ] Configure CORS settings for direct uploads

- [ ] **Database Schema**
  - [x] Create documents table with basic fields
  - [ ] Add document_analyses table for analysis results
  - [ ] Create document_revisions table for tracking changes
  - [ ] Set up user_documents relation table
  - [ ] Add appropriate indexes for query performance

- [ ] **API Functions**
  - [x] Implement POST endpoint for document upload
  - [x] Create GET endpoint for document retrieval
  - [x] Add document analysis endpoint
  - [ ] Implement document revision endpoints
  - [ ] Add document sharing and permissions endpoints

## Document Viewer Component

- [ ] **UI Components**
  - [x] Implement basic document viewer container
  - [x] Create section highlighting functionality
  - [ ] Add zoom and page navigation controls
  - [ ] Implement search functionality within document
  - [ ] Create print and download options

- [ ] **Interactive Features**
  - [x] Enable section selection
  - [ ] Implement text selection and copying
  - [ ] Add annotation capabilities
  - [ ] Create measurement tools for dimensions
  - [ ] Add comment and feedback functionality

- [ ] **Revision Management**
  - [x] Implement revision panel UI
  - [ ] Create diff visualization for changes
  - [ ] Add version history navigation
  - [ ] Implement change acceptance/rejection controls
  - [ ] Create revision export functionality

## AI Integration

- [ ] **Document Analysis**
  - [x] Set up mock analysis function
  - [ ] Integrate with OpenAI for text analysis
  - [ ] Implement risk detection algorithms
  - [ ] Create summarization functionality
  - [ ] Add sentiment and tone analysis

- [ ] **Conversational AI**
  - [x] Implement basic AI chat interface
  - [ ] Create context-aware document Q&A
  - [ ] Add explanation generation for complex sections
  - [ ] Implement suggestion generation for improvements
  - [ ] Create domain-specific legal/contract analysis

## State Management

- [ ] **Zustand Store Enhancements**
  - [x] Implement document loading state
  - [x] Add current document state management
  - [ ] Create selected section state
  - [ ] Add revision history state management
  - [ ] Implement persistent state with localStorage

- [ ] **Performance Optimizations**
  - [ ] Implement document content caching
  - [ ] Add lazy loading for document pages
  - [ ] Create virtualization for large documents
  - [ ] Optimize re-renders with memoization
  - [ ] Add progressive loading for document content

## Testing

- [ ] **Unit Tests**
  - [ ] Create tests for DocumentUploader component
  - [ ] Implement tests for PDF processing functions
  - [ ] Add tests for document API endpoints
  - [ ] Create tests for state management
  - [ ] Implement tests for utility functions

- [ ] **Integration Tests**
  - [ ] Test upload to view flow
  - [ ] Implement document analysis flow tests
  - [ ] Create revision management tests
  - [ ] Add authentication and permission tests
  - [ ] Implement error handling tests

- [ ] **End-to-End Tests**
  - [ ] Create complete user flow tests
  - [ ] Implement cross-browser testing
  - [ ] Add mobile responsiveness tests
  - [ ] Create performance benchmark tests
  - [ ] Implement accessibility tests

## Security

- [ ] **Authentication**
  - [x] Secure all API endpoints with auth
  - [ ] Implement document ownership validation
  - [ ] Add role-based access control
  - [ ] Create audit logging for document access
  - [ ] Implement session management for document editing

- [ ] **Data Protection**
  - [ ] Add server-side file scanning for malware
  - [ ] Implement document encryption at rest
  - [ ] Create secure viewer for sensitive documents
  - [ ] Add watermarking for downloaded documents
  - [ ] Implement document expiry and self-destruction

## Deployment

- [ ] **Infrastructure**
  - [ ] Configure appropriate storage scaling
  - [ ] Set up CDN for document delivery
  - [ ] Implement caching strategies
  - [ ] Configure rate limiting for API endpoints
  - [ ] Set up monitoring and alerting

- [ ] **CI/CD Pipeline**
  - [ ] Create automated test runs in CI
  - [ ] Implement deployment approval workflow
  - [ ] Add performance regression checks
  - [ ] Create blue/green deployment strategy
  - [ ] Implement automated rollback procedures

## User Experience

- [ ] **Onboarding**
  - [ ] Create guided tour for document upload
  - [ ] Implement help tooltips for key features
  - [ ] Add example documents for demonstration
  - [ ] Create contextual help documentation
  - [ ] Implement user preference saving

- [ ] **Error Handling**
  - [ ] Create user-friendly error messages
  - [ ] Implement automatic recovery options
  - [ ] Add offline support with synchronization
  - [ ] Create progress persistence for long operations
  - [ ] Implement detailed error logging for support

## Analytics

- [ ] **Usage Tracking**
  - [ ] Track document upload success rates
  - [ ] Implement document view analytics
  - [ ] Create feature usage statistics
  - [ ] Track AI interaction metrics
  - [ ] Implement conversion funnels

- [ ] **Performance Monitoring**
  - [ ] Track document load times
  - [ ] Measure API response times
  - [ ] Monitor document processing durations
  - [ ] Track client-side rendering performance
  - [ ] Implement real user monitoring

## Documentation

- [x] **Technical Documentation**
  - [x] Create PDF upload roadmap document
  - [x] Implement testing guide
  - [x] Create implementation tasks checklist
  - [ ] Document API endpoints and data schemas
  - [ ] Create architecture diagram and documentation

- [ ] **User Documentation**
  - [ ] Create user guides for document upload
  - [ ] Implement help center articles
  - [ ] Add FAQ for common issues
  - [ ] Create video tutorials for key features
  - [ ] Implement contextual help throughout app 

# PDF Implementation Tasks

This document outlines specific tasks needed to enhance the PDF processing and document analysis capabilities of TrustInk.

## Current Implementation Status

The current PDF processing and document analysis implementation has the following components:

- ✅ Basic PDF upload via `DocumentUploader` component
- ✅ Custom hook `useDocumentUpload` for handling PDF file validation and processing
- ✅ Supabase storage integration for storing PDF files
- ✅ Database structure for documents, analyses, and relationships
- ✅ User-document relationship with proper authentication
- ✅ Basic extraction of PDF metadata using pdf-lib
- ✅ Document viewer for displaying PDF content by sections
- ✅ API endpoints for document upload and analysis
- ✅ Tests for document upload validation

## Implementation Tasks

### 1. Enhanced PDF Text Extraction

The current implementation uses a placeholder for PDF content extraction. We need to implement proper text extraction.

**Required Tasks:**

1. **Integrate with PDF.js or Similar Library**
   - Add PDF.js to the project dependencies
   - Create a utility for extracting text content from PDFs

   ```typescript
   // src/lib/pdf-utils.ts
   import * as pdfjs from 'pdfjs-dist';

   export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string[]> {
     // Load PDF document
     const pdf = await pdfjs.getDocument({ data: buffer }).promise;
     const textContent: string[] = [];
     
     // Extract text from each page
     for (let i = 1; i <= pdf.numPages; i++) {
       const page = await pdf.getPage(i);
       const content = await page.getTextContent();
       const text = content.items.map(item => 'str' in item ? item.str : '').join(' ');
       textContent.push(text);
     }
     
     return textContent;
   }
   ```

2. **Update Documents/Analyze API**
   - Modify `/app/api/documents/analyze/route.ts` to use the text extraction utility
   - Replace the placeholder text with actual PDF content

   ```typescript
   // Update in src/app/api/documents/analyze/route.ts
   import { extractTextFromPDF } from '@/lib/pdf-utils';

   // Inside extractPdfSections function
   const textContent = await extractTextFromPDF(buffer);
   const sections = [];
   
   for (let i = 0; i < pageCount; i++) {
     const page = pdfDoc.getPage(i);
     const { width, height } = page.getSize();
     
     sections.push({
       id: `page-${i+1}`,
       title: `Page ${i+1}`,
       text: textContent[i] || '', // Real extracted text
       pageNumber: i+1,
       position: { x: 0, y: 0, width, height }
     });
   }
   ```

3. **Handle Text Formatting**
   - Preserve paragraph breaks and structures
   - Handle different character encodings in PDFs
   - Add support for detecting tables and lists

### 2. Intelligent Section Detection

The current implementation treats each page as a separate section. We need more intelligent content sectioning.

**Required Tasks:**

1. **Heading Detection Algorithm**
   - Create a utility that can identify headings in PDF text
   - Use font size, style, and position information from PDF.js

   ```typescript
   // src/lib/section-detection.ts
   interface TextItem {
     text: string;
     fontSize: number;
     fontName: string;
     x: number;
     y: number;
   }

   export function detectHeadings(textItems: TextItem[]): TextItem[] {
     // Identify items that are likely headings based on font size, position, etc.
     const averageFontSize = calculateAverageFontSize(textItems);
     
     return textItems.filter(item => 
       item.fontSize > averageFontSize * 1.2 && // 20% larger than average text
       item.text.length < 100 && // Not too long
       !item.text.endsWith('.') // Doesn't end with period (likely not a sentence)
     );
   }
   ```

2. **Implement Section Splitting**
   - Split content between headings into logical sections
   - Handle nested sections and subsections

   ```typescript
   // src/lib/section-detection.ts
   export function splitIntoSections(
     fullText: string, 
     headings: TextItem[]
   ): { title: string, content: string }[] {
     const sections = [];
     
     // Sort headings by their position in the document
     const sortedHeadings = [...headings].sort((a, b) => a.y - b.y);
     
     // Create sections using heading boundaries
     for (let i = 0; i < sortedHeadings.length; i++) {
       const currentHeading = sortedHeadings[i];
       const nextHeading = sortedHeadings[i + 1];
       
       const startIndex = fullText.indexOf(currentHeading.text);
       const endIndex = nextHeading 
         ? fullText.indexOf(nextHeading.text) 
         : fullText.length;
       
       if (startIndex !== -1) {
         const content = fullText.substring(
           startIndex + currentHeading.text.length, 
           endIndex
         ).trim();
         
         sections.push({
           title: currentHeading.text,
           content: content
         });
       }
     }
     
     return sections;
   }
   ```

3. **Update Analyze API to Use Intelligent Sectioning**
   - Modify the PDF extraction to use the new section detection
   - Add section hierarchy information

### 3. Document Content Analysis

Enhance the AI analysis capabilities to provide more useful document insights.

**Required Tasks:**

1. **Improve OpenAI Prompts**
   - Refine the system prompt for document analysis
   - Add specific legal terminology and concepts to focus on

   ```typescript
   // In src/app/api/documents/analyze/route.ts
   const systemPrompt = `You are an expert legal document analyzer specializing in contracts. 
   Analyze the provided document for the following:
   
   1. Key terms and definitions
   2. Obligations for each party
   3. Liability clauses and limitations
   4. Termination conditions
   5. Governing law
   6. Potential risks or ambiguities
   
   Return your analysis in a structured JSON format with the following fields:
   - sections: Array of found sections with { title, content, analysis, riskLevel, suggestedChanges }
   - parties: Identified parties in the agreement
   - keyTerms: Important defined terms and their meanings
   - risks: Overall risk assessment with specific concerns
   - summary: Brief overview of the document purpose and structure
   
   Be specific about potential issues and provide actionable suggestions.`;
   ```

2. **Add Caching for Analysis Results**
   - Implement Redis or similar caching solution
   - Cache analysis results by document ID and timestamp

   ```typescript
   // src/lib/cache.ts
   import { Redis } from '@upstash/redis';

   const redis = new Redis({
     url: process.env.REDIS_URL || '',
     token: process.env.REDIS_TOKEN || '',
   });

   export async function getCachedAnalysis(documentId: string): Promise<any | null> {
     return await redis.get(`analysis:${documentId}`);
   }

   export async function cacheAnalysis(documentId: string, analysis: any): Promise<void> {
     await redis.set(`analysis:${documentId}`, analysis, { ex: 60 * 60 * 24 * 7 }); // 1 week
   }
   ```

3. **Add Document Type Detection**
   - Implement logic to identify document types (contract, NDA, etc.)
   - Customize analysis based on document type

### 4. API Enhancements

Improve the API endpoints for better performance and functionality.

**Required Tasks:**

1. **Add Progress Tracking for Long Analyses**
   - Implement WebSockets or polling for tracking analysis progress
   - Store analysis state in database

2. **Add Pagination and Filtering for Document List**
   - Enhance the documents API to support pagination
   - Add filtering by document type, date, etc.

   ```typescript
   // In src/app/api/documents/route.ts, update GET handler
   const page = parseInt(url.searchParams.get('page') || '1');
   const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
   const sortBy = url.searchParams.get('sortBy') || 'created_at';
   const sortOrder = url.searchParams.get('sortOrder') || 'desc';
   const documentType = url.searchParams.get('type');
   const startDate = url.searchParams.get('startDate');
   const endDate = url.searchParams.get('endDate');
   
   let query = supabase
     .from('documents')
     .select('*')
     .eq('user_id', userId);
   
   // Apply filters
   if (documentType) {
     query = query.eq('type', documentType);
   }
   
   if (startDate) {
     query = query.gte('created_at', startDate);
   }
   
   if (endDate) {
     query = query.lte('created_at', endDate);
   }
   
   // Apply sorting and pagination
   query = query
     .order(sortBy, { ascending: sortOrder === 'asc' })
     .range((page - 1) * pageSize, page * pageSize - 1);
   ```

3. **Add Bulk Operations**
   - Implement endpoints for bulk document processing
   - Support batch analysis of multiple documents

### 5. Tests and Quality Assurance

Add comprehensive testing for the PDF processing and analysis features.

**Required Tasks:**

1. **Create Unit Tests for PDF Utilities**
   - Test text extraction accuracy
   - Test section detection algorithms

   ```typescript
   // src/__tests__/lib/pdf-utils.test.ts
   import { extractTextFromPDF } from '@/lib/pdf-utils';
   import { readFileSync } from 'fs';
   import { join } from 'path';

   describe('PDF Utilities', () => {
     test('extracts text from PDF correctly', async () => {
       const samplePDF = readFileSync(join(__dirname, '../mocks/sample.pdf'));
       const result = await extractTextFromPDF(samplePDF.buffer);
       
       expect(result).toBeInstanceOf(Array);
       expect(result.length).toBeGreaterThan(0);
       expect(result[0]).toContain('Expected text in first page');
     });
   });
   ```

2. **Create Integration Tests for Document Analysis**
   - Test end-to-end document upload and analysis flow
   - Verify section detection and content analysis

   ```typescript
   // src/__tests__/integration/documentAnalysis.test.tsx
   import { render, screen, waitFor } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { DocumentUploader } from '@/components/DocumentUploader';
   import { createMockPdfFile } from '../mocks/fileMock';
   
   test('uploads and analyzes document', async () => {
     // Setup mock fetch responses
     global.fetch = jest.fn()
       .mockImplementationOnce(() => Promise.resolve({
         ok: true,
         json: () => Promise.resolve({ id: 'doc-123' })
       }))
       .mockImplementationOnce(() => Promise.resolve({
         ok: true,
         json: () => Promise.resolve({
           sections: [{ id: 'section-1', title: 'Introduction', text: 'Sample text' }],
           analysis: { summary: 'Sample analysis' }
         })
       }));
     
     render(<DocumentUploader />);
     
     // Simulate file upload
     const file = createMockPdfFile();
     const input = screen.getByTestId('file-input');
     userEvent.upload(input, file);
     
     // Verify document was uploaded and analyzed
     await waitFor(() => {
       expect(global.fetch).toHaveBeenCalledTimes(2);
       expect(global.fetch).toHaveBeenCalledWith('/api/documents/analyze', expect.any(Object));
     });
   });
   ```

3. **Performance Testing**
   - Test analysis performance with various PDF sizes
   - Identify and address bottlenecks

## Implementation Schedule

| Task | Priority | Estimated Effort | Dependencies |
|------|----------|-----------------|--------------|
| Text Extraction | High | 3 days | None |
| Section Detection | High | 4 days | Text Extraction |
| Content Analysis | Medium | 5 days | Section Detection |
| API Enhancements | Medium | 3 days | None |
| Testing | High | Ongoing | All features |

## Success Criteria

1. **Text Extraction Accuracy**
   - 95%+ accuracy in extracting text from standard PDFs
   - Correct handling of PDF tables and formatting

2. **Section Detection Effectiveness**
   - Correctly identify 90%+ of major sections in legal documents
   - Properly maintain hierarchy in nested sections

3. **Analysis Quality**
   - Identify key contractual elements accurately
   - Provide actionable insights for document risks

4. **Performance Metrics**
   - Process a 50-page document in under 30 seconds
   - API response time under 500ms for cached results

## Future Considerations

1. **OCR Integration**
   - Add support for scanned documents
   - Handle image-based PDFs with text recognition

2. **Language Support**
   - Extend analysis to non-English documents
   - Support multilingual document processing

3. **Template Learning**
   - Implement ML to recognize document templates
   - Use template data to improve section detection 

## Document Comparison and Diff Visualization

### Approach for Implementing Contract Diffing

We will implement diff viewing similar to git commits with the following approach:

1. **Diffing Algorithm**
   - Implement a text-based diffing algorithm using [diff-match-patch](https://github.com/google/diff-match-patch) library
   - Store both the original text and revised text for each section in our database
   - Calculate diffs at rendering time to ensure flexibility

2. **UI Components for Diff Visualization**
   - Create a `DiffViewer` component that shows:
     - Side-by-side comparison (original vs. proposed)
     - Inline diff view with color-coding (red for deletions, green for additions)
     - Word-level or character-level diffing for precision
   - Support toggling between different viewing modes

3. **Contract Version Management**
   - Track all versions of document sections in the `section_changes` table
   - Add metadata for each change (timestamp, user, AI-generated flag)
   - Implement version history navigation similar to git history

4. **Technical Implementation Details**
   ```typescript
   interface SectionDiff {
     original: string;
     modified: string;
     changes: Array<{
       type: 'addition' | 'deletion' | 'unchanged';
       text: string;
       startIndex: number;
       endIndex: number;
     }>;
   }
   
   // Component usage example
   <DiffViewer 
     original={section.original_text} 
     modified={section.proposed_text}
     viewMode="inline" // or "side-by-side"
     wordLevel={true} 
   />
   ```

### Risk Highlighting Implementation

For LLM-based risk highlighting in contracts:

1. **AI Integration for Risk Detection**
   - Enhance the existing document analysis API to include risk detection
   - Use Claude's capabilities to identify potentially risky clauses based on:
     - Legal implications
     - Financial risks
     - Unclear or ambiguous language
     - Restrictive terms

2. **Risk Categorization System**
   ```typescript
   enum RiskLevel {
     HIGH = 'high',
     MEDIUM = 'medium',
     LOW = 'low',
     NONE = 'none'
   }
   
   interface RiskAnnotation {
     sectionId: string;
     riskLevel: RiskLevel;
     explanation: string;
     suggestedAlternative?: string;
     category: 'legal' | 'financial' | 'clarity' | 'restrictive' | 'other';
   }
   ```

3. **UI Components for Risk Visualization**
   - Create a `RiskHighlighter` component that applies different highlighting styles based on risk level
   - Implement a hover tooltip that shows risk explanation
   - Add a risk summary panel showing all identified risks in the document

4. **User Interaction Flow**
   - Initial document upload triggers basic document analysis
   - User can request specific risk assessment ("Analyze this contract for risks")
   - AI identifies risky sections and returns risk annotations
   - UI highlights risky sections with appropriate color coding
   - User can click on highlights to see explanations and suggested alternatives

5. **Technical Implementation**
   - Extend `document_analyses` table to include risk annotations
   - Modify `EditableDocumentViewer` to support risk highlighting
   - Create a new API endpoint specifically for risk analysis

## Document Section Highlighting

### Implementation Details

1. **Section Definition and Storage**
   - Define sections based on structural elements (headings, paragraphs)
   - Store section metadata including:
     - Position information (for visual highlighting)
     - Content hash (for change detection)
     - Risk assessment data

2. **Highlighting Mechanism**
   - Use CSS for visual highlighting with transition effects
   - Apply highlighting based on:
     - User selection
     - AI recommendation
     - Risk level
     - Current editing focus

3. **Interactive Highlighting API**
   ```typescript
   // Function to highlight a section
   function highlightSection(sectionId: string, highlightType: 'selection' | 'risk' | 'ai-focus') {
     // Implementation details
   }
   
   // In the document viewer component
   useEffect(() => {
     if (highlightedSectionId) {
       const element = document.getElementById(`section-${highlightedSectionId}`);
       if (element) {
         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
         element.classList.add('highlighted');
       }
     }
   }, [highlightedSectionId]);
   ```

4. **LLM Integration for Contextual Highlighting**
   - When user asks questions about specific topics, the LLM will:
     - Identify relevant sections
     - Return section IDs to highlight
     - Provide context about why these sections are relevant
   - Implementation through the document analysis API with a new parameter for highlighting intent

## Incremental Implementation Plan

1. **Phase 1: Basic Diffing and Highlighting (Current Sprint)**
   - Implement basic section highlighting in `EditableDocumentViewer`
   - Create `DiffViewer` component with simple inline diff visualization
   - Add section navigation with highlighting

2. **Phase 2: Risk Analysis Integration (Next Sprint)**
   - Extend document analysis API to include risk detection
   - Create risk visualization components
   - Implement risk summary panel

3. **Phase 3: Advanced Features (Future)**
   - Implement version history navigation
   - Add collaborative highlighting for multiple users
   - Create AI-suggested improvements based on risk analysis 