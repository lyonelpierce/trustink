# Error Handling Standards

This document outlines the standardized approach to error handling across the TrustInk application. Consistent error handling improves user experience, simplifies debugging, and makes the codebase more maintainable.

## Core Principles

1. **User-Friendly Messages**: Display meaningful, actionable messages to users
2. **Detailed Logging**: Log detailed error information for debugging
3. **Consistent Structure**: Use standardized error formats across the application
4. **Graceful Degradation**: The application should continue functioning when possible
5. **Contextual Handling**: Errors should be handled as close to their source as possible

## Error Handler Utility

The `error-handler.ts` utility provides standardized error handling throughout the application:

```typescript
// src/lib/error-handler.ts
export interface ErrorHandlerOptions {
  /**
   * Custom error message to display instead of the default one.
   */
  customMessage?: string;
  
  /**
   * If true, errors won't be shown to the user (but will still be logged).
   */
  suppressErrors?: boolean;
  
  /**
   * Optional callback to execute when an error occurs.
   */
  onError?: (error: unknown) => void;
}

export interface ExtendedError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Standard error handler for client-side errors.
 * Logs errors and shows toast notifications.
 */
export function handleError(error: unknown, options?: ErrorHandlerOptions): void {
  // Log the error for debugging
  console.error("Application error:", error);
  
  // Generate user-friendly message
  const message = getUserFriendlyErrorMessage(error, options?.customMessage);
  
  // Show toast notification unless suppressed
  if (!options?.suppressErrors) {
    toast.error(message);
  }
  
  // Execute optional callback
  if (options?.onError) {
    options.onError(error);
  }
}
```

## Error Handling Patterns

### API Routes

API routes should handle errors consistently:

```typescript
// Example API route with error handling
export async function GET(request: Request) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return unauthorized();
    }
    
    // Input validation
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id && !isValidUUID(id)) {
      return badRequest('Invalid document ID format');
    }
    
    // Database operation
    const result = await getDocumentById(supabase, id, userId);
    if (result.error) {
      return handleApiError(result.error, {
        customMessage: 'Failed to retrieve document'
      });
    }
    
    // Not found check
    if (!result.data) {
      return notFound('Document not found');
    }
    
    // Success response
    return NextResponse.json(result.data);
    
  } catch (error) {
    // Unexpected errors
    return handleApiError(error, {
      customMessage: 'An unexpected error occurred'
    });
  }
}
```

### Component Error Handling

Components should implement error boundaries and graceful fallbacks:

```tsx
// Error boundary usage
const DocumentViewer = () => {
  return (
    <ErrorBoundary
      fallback={<DocumentErrorState onRetry={handleRetry} />}
    >
      <DocumentContent />
    </ErrorBoundary>
  );
};

// Inside components
const DocumentContent = () => {
  const [error, setError] = useState<Error | null>(null);
  
  // Use try/catch with async operations
  const loadDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await fetchDocument(documentId);
      setDocument(result);
      
    } catch (error) {
      setError(error as Error);
      handleError(error, {
        customMessage: 'Failed to load document'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show appropriate UI based on state
  if (error) {
    return <ErrorDisplay message={error.message} onRetry={loadDocument} />;
  }
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  // Render normal content
  return <div>Document content...</div>;
};
```

### Custom Hooks Error Handling

Custom hooks should encapsulate their error handling:

```typescript
// Error handling in custom hook
export function useDocumentUpload() {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadDocument = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Validate input
      if (!file || !file.type.includes('pdf')) {
        throw new Error('Please upload a PDF file');
      }
      
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      // Check for API errors
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }
      
      return data;
      
    } catch (error) {
      handleError(error, {
        customMessage: 'Document upload failed'
      });
      setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  return { uploadDocument, error, isUploading };
}
```

## Error Response Structure

### API Error Responses

API errors should follow a consistent structure:

```typescript
// Standard error response format
interface ErrorResponse {
  error: string;           // User-friendly message
  errorCode?: string;      // Optional error code for client handling
  details?: unknown;       // Optional details (only in development)
}

// Helper functions
export function badRequest(message = 'Bad request'): Response {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

export function unauthorized(message = 'Unauthorized'): Response {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

export function forbidden(message = 'Forbidden'): Response {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

export function notFound(message = 'Not found'): Response {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  );
}

export function serverError(message = 'Internal server error'): Response {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}
```

### Client Error Handling

Client-side code should handle API errors consistently:

```typescript
// Client-side API call with error handling
const fetchDocuments = async (): Promise<Document[]> => {
  try {
    const response = await fetch('/api/documents');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    handleError(error, {
      customMessage: 'Failed to load documents'
    });
    return [];
  }
};
```

## User-Friendly Error Messages

Error messages should be:

1. **Clear**: Explain what went wrong in simple terms
2. **Actionable**: Tell the user what they can do to resolve the issue
3. **Respectful**: Don't blame the user
4. **Concise**: Keep messages brief but informative

Examples:

| ❌ Bad Message | ✅ Good Message |
|---------------|----------------|
| "Error 404" | "We couldn't find the document you're looking for. It may have been moved or deleted." |
| "Network failure" | "Unable to connect to the server. Please check your internet connection and try again." |
| "Invalid input" | "Please provide a valid email address in the format name@example.com" |
| "Database error" | "We're having trouble accessing your documents right now. Please try again in a few minutes." |

## Error Tracking and Monitoring

### Logging Standards

Errors should be logged with sufficient context:

```typescript
// Comprehensive error logging
try {
  // Operation that might fail
} catch (error) {
  console.error(
    'Document upload failed:',
    {
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      error: error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error
    }
  );
  
  // Handle error for user
}
```

### Production Error Handling

In production:

1. **Never expose stack traces** to end users
2. **Always log detailed errors** for debugging
3. **Provide user-friendly fallbacks** for all error states
4. **Implement retry mechanisms** for transient failures

## Implementation in Different Contexts

### React Component Error States

Components should have dedicated error states:

```tsx
// Error state component
const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <AlertCircle className="error-icon" />
      <h3>Something went wrong</h3>
      <p>{message || "We couldn't complete your request"}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};
```

### Data Fetching

SWR and React Query should use consistent error handling:

```tsx
// SWR with error handling
const { data, error, isLoading, mutate } = useSWR(
  `/api/documents/${documentId}`,
  fetcher,
  {
    onError: (err) => {
      handleError(err, {
        customMessage: 'Failed to load document'
      });
    },
    shouldRetryOnError: true,
    errorRetryCount: 3
  }
);

if (error) {
  return (
    <ErrorState 
      message="Could not load the document"
      onRetry={() => mutate()}
    />
  );
}
```

### Form Validation

Form errors should be handled consistently:

```tsx
// Form error handling
const UploadForm = () => {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!file) {
      errors.file = 'Please select a file to upload';
    } else if (!file.type.includes('pdf')) {
      errors.file = 'Only PDF files are accepted';
    } else if (file.size > 10 * 1024 * 1024) {
      errors.file = 'File size must be less than 10MB';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Submit form
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {formErrors.file && (
        <p className="error-message">{formErrors.file}</p>
      )}
      <Button type="submit">Upload</Button>
    </form>
  );
};
```

## Testing Error Handling

Error handling should be thoroughly tested:

```typescript
// Testing error handling
describe('Document API Error Handling', () => {
  test('returns 401 when user is not authenticated', async () => {
    // Mock auth to return no user
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: null });
    
    const request = createMockRequest('/api/documents', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });
  
  test('returns 400 when document ID format is invalid', async () => {
    const request = createMockRequest('/api/documents?id=invalid-id', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ 
      error: 'Invalid document ID format' 
    });
  });
  
  test('handles database errors gracefully', async () => {
    // Mock database error
    (getDocumentById as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Database connection failed')
    });
    
    const request = createMockRequest('/api/documents?id=valid-uuid', 'GET');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ 
      error: 'Failed to retrieve document' 
    });
  });
});
```

## Conclusion

Consistent error handling is critical for a high-quality application. By following these standards:

1. Users receive clear, actionable information when things go wrong
2. Developers can quickly diagnose and fix issues
3. The application degrades gracefully under error conditions
4. Code remains maintainable and consistent across the codebase

All TrustInk developers should use the error handling utilities provided in `error-handler.ts` and follow the patterns outlined in this document. 