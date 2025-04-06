# DocumentUploader Component

## Overview

The `DocumentUploader` component provides a user interface for uploading PDF documents to the application. It features a drag-and-drop interface, file validation, loading states, and error handling.

## Features

- Drag-and-drop file upload interface
- File browser fallback
- File type validation (PDF only)
- File size validation (10MB max)
- Visual feedback for upload states
- Error handling with retry functionality

## Implementation

```tsx
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { FileUp, Loader2, AlertCircle } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

export function DocumentUploader() {
  const {
    dragActive,
    setDragActive,
    uploadError,
    lastFile,
    processFile,
    isProcessing
  } = useDocumentUpload();

  // Event handlers...

  return (
    <ErrorBoundary>
      <div className="w-full max-w-xl mx-auto">
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${isProcessing ? 'pointer-events-none opacity-70' : ''}
            ${uploadError ? 'border-red-300 bg-red-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={/* handler */}
        >
          {/* Component states and UI */}
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

## Component States

The component has three main visual states:

### 1. Default State

Shows the upload drop zone with instructions:
- Upload icon
- "Upload your document" heading
- File type and size instructions
- Hidden file input field

### 2. Processing State

Shows when a file is being uploaded:
- Spinning loader icon
- "Processing document..." text
- Reduced opacity overlay

### 3. Error State

Shows when upload fails:
- Error icon
- Error message
- "Try again" button

## Integration with Document Flow

The DocumentUploader is used in:

1. **Documents Page**: As the primary upload interface
2. **Empty State**: Shown when no documents exist
3. **Upload Modal**: Available from multiple locations

## Usage Example

```tsx
import { DocumentUploader } from '@/components/DocumentUploader';

export default function DocumentsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Documents</h1>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Upload a Document</h2>
        <DocumentUploader />
      </div>
      
      {/* Rest of the page... */}
    </div>
  );
}
```

## Behavior Notes

- The component uses the `useDocumentUpload` hook for all upload business logic
- After successful upload, the document appears immediately in the document list
- Error messages are shown directly in the component
- The uploader maintains a reference to the last file for retry functionality 