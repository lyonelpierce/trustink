# Test Progress & Standards

This document outlines the current test coverage, testing standards, and best practices for the TrustInk application.

## Testing Standards

### API Testing Standards

API tests should follow these guidelines to ensure consistent and maintainable testing:

1. **Test Structure**
   - Group tests by HTTP method (GET, POST, PUT, DELETE)
   - Include authentication tests for each endpoint
   - Test both success and error paths
   - Provide clear, descriptive test names

2. **Mock Standards**
   - Mock external dependencies with consistent patterns
   - Cast auth mocks with proper TypeScript typing: `(auth as unknown as jest.Mock)`
   - Use consistent mock return structures that match real responses
   - Provide typed mock clients for Supabase

3. **Request/Response Helpers**
   - Use standardized helpers for creating mock requests:
   ```typescript
   const createMockRequest = (url: string, method: string, body?: any): NextRequest => {
     const request = {
       url,
       method,
       formData: jest.fn().mockResolvedValue(body),
       json: jest.fn().mockResolvedValue(body)
     } as unknown as NextRequest;
     return request;
   };
   ```

4. **Test Coverage Requirements**
   - Authentication checks (401 responses)
   - Input validation (400 responses)
   - Success cases with expected data (200 responses)
   - Error handling and recovery (500 responses)
   - Edge cases specific to each endpoint

### Component Testing Standards

1. **Render Tests**
   - Every component should have a basic render test
   - Test loading, error, and empty states when applicable
   - Verify key UI elements are present

2. **Interaction Tests**
   - Test user interactions (clicks, form inputs, etc.)
   - Verify state changes result in appropriate UI updates
   - Mock handlers for events and callbacks

3. **Integration with State Management**
   - Mock Zustand stores consistently using `jest.requireMock()`
   - Test component behavior with different store states
   - Verify components correctly update store state

### Hook Testing Standards

1. **Setup and Teardown**
   - Clear all mocks between tests
   - Reset global objects and environment
   - Use beforeEach/afterEach for consistent state

2. **State Transitions**
   - Test initial state
   - Test state transitions for all possible inputs
   - Verify side effects are triggered correctly

3. **Mock Dependencies**
   - Properly type mocked dependencies
   - When mocking React hooks, use the `renderHook` utility

## State Management Guidelines

TrustInk uses Zustand for state management. Follow these guidelines when working with state:

### Store Structure

1. **Separation of Concerns**
   - Create separate stores for distinct features (documents, user, UI)
   - Each store should focus on a specific domain

2. **State Interface**
   - Define TypeScript interfaces for all store states
   - Document each property with clear comments
   ```typescript
   interface DocumentState {
     currentDocument: Document | null; // Currently loaded document
     isDocumentLoading: boolean;       // Loading state for document operations
     highlightedSection: string | null; // ID of currently highlighted section
     // ... other properties
   }
   ```

3. **Actions**
   - Keep actions simple and focused on a single task
   - Use meaningful action names that describe the intent
   - Return void for side effects, or return the new state for reducers

### Store Usage in Components

1. **Selective Subscription**
   - Subscribe only to the state properties needed by the component
   ```typescript
   // Good - subscribe only to needed state
   const { currentDocument, isDocumentLoading } = useDocumentStore(
     state => ({
       currentDocument: state.currentDocument,
       isDocumentLoading: state.isDocumentLoading
     })
   );
   
   // Avoid - subscribing to the entire store
   const documentStore = useDocumentStore();
   ```

2. **Memoization**
   - Use memoization to prevent unnecessary re-renders
   - Extract complex computations from render functions

3. **Testing**
   - Mock the store in tests using `jest.mock`
   - Return different states to test different scenarios

## Error Handling in API Routes

API routes should follow consistent error handling patterns:

### Error Response Structure

1. **Consistent Response Format**
   ```typescript
   {
     error: string;           // Human-readable error message
     errorCode?: string;      // Optional code for programmatic handling
     details?: unknown;       // Optional details for debugging
   }
   ```

2. **HTTP Status Codes**
   - 400: Bad Request (client error, invalid input)
   - 401: Unauthorized (authentication required)
   - 403: Forbidden (authenticated but insufficient permissions)
   - 404: Not Found (resource doesn't exist)
   - 500: Internal Server Error (server-side error)

### Error Handling Utilities

1. **Helper Functions**
   - Use the error utility functions in `src/lib/error-handler.ts`
   ```typescript
   // Example usage in API routes
   if (!userId) {
     return unauthorized();
   }
   
   if (!documentId) {
     return badRequest('Document ID is required');
   }
   
   try {
     // Operation that may fail
   } catch (error) {
     return handleApiError(error, {
       customMessage: 'Failed to process document'
     });
   }
   ```

2. **Error Logging**
   - Log errors with appropriate severity
   - Include enough context for debugging
   - Sanitize sensitive information

3. **Client-Side Handling**
   - Use the `handleError` utility consistently
   - Display user-friendly messages while logging details

## Current Test Coverage

| Category | Component/Feature | Status | Notes |
|----------|-------------------|--------|-------|
| Components | DocumentUploader | ✅ | Basic render, file validation |
| Components | VoiceAssistant | 🔶 | Partial coverage, 1 failing test |
| Components | EditableDocumentViewer | ✅ | Comprehensive coverage |
| Components | RevisionPanel | ✅ | Comprehensive coverage |
| Components | DocumentAnalysisLayout | ✅ | Integration testing |
| Hooks | useDocumentUpload | ✅ | Full coverage |
| Hooks | useVoiceAssistant | 🔶 | Web Speech API mocking issues |
| Hooks | useRevisionPanel | ✅ | Full coverage |
| Hooks | useDocumentRevisions | ✅ | Full coverage |
| Hooks | useVectorSearch | ✅ | Full coverage with mocks |
| API | /api/documents (GET) | ✅ | Auth, success/error paths |
| API | /api/documents (POST) | ✅ | File validation, upload |
| API | /api/documents (DELETE) | ✅ | Basic tests |
| API | /api/documents/analyze | ✅ | Basic implementation |
| API | /api/vector-search | ✅ | Full coverage with streaming |
| API | /api/contracts/revisions | ❌ | Not implemented |
| API | /api/c (conversation) | ❌ | Not implemented |
| API | /api/i (integration) | ❌ | Not implemented |
| Utilities | embeddings.ts | ✅ | Full coverage with mocks |
| Utilities | document-processor.ts | ✅ | Basic section extraction |
| Utilities | error-handler.ts | ✅ | Comprehensive coverage |

## Test Implementation Priorities

1. **Remaining API Endpoints**
   - /api/contracts/revisions
   - /api/c (conversation endpoints)
   - /api/i (integration endpoints)

2. **Voice Assistant**
   - Fix Web Speech API mocking issues
   - Complete test coverage for voice interactions
   - Add streaming response tests

3. **Integration Tests**
   - Document upload → analysis → search flow
   - Voice interaction with document context
   - Revision workflow with AI suggestions

## Recent Improvements

1. **Vector Search Testing**
   - ✅ Added tests for embedding generation
   - ✅ Added tests for similarity search
   - ✅ Added tests for streaming responses
   - ✅ Improved type safety in tests

2. **Error Handling**
   - ✅ Fixed error context typing
   - ✅ Added proper error handling in embeddings
   - ✅ Improved error messages for API responses

3. **Type Safety**
   - ✅ Added Supabase database types
   - ✅ Fixed mock type issues
   - ✅ Improved error handler types

## Next Steps

1. **Test Coverage Expansion**
   - Add tests for remaining API endpoints
   - Complete voice assistant testing
   - Add end-to-end tests for key workflows

2. **Performance Testing**
   - Add tests for large document handling
   - Test embedding generation performance
   - Test streaming response performance

3. **Documentation**
   - Update API documentation with new endpoints
   - Add testing examples to contributor guide
   - Document common testing patterns

## Success Metrics

- Unit Test Coverage: >90%
- Integration Test Coverage: >80%
- API Endpoint Coverage: 100%
- Performance Test Coverage: Key workflows
- Documentation Coverage: All testable features 