# useDocumentUpload Hook

## Overview

The `useDocumentUpload` hook provides functionality for uploading, validating, and processing PDF documents. It handles the full document upload flow including drag-and-drop interactions, file validation, and API integration.

## Usage

```tsx
import { useDocumentUpload } from '@/hooks/useDocumentUpload';

function MyComponent() {
  const {
    dragActive,
    setDragActive,
    uploadError,
    lastFile,
    processFile,
    isProcessing
  } = useDocumentUpload();
  
  // Use in component...
}
```

## API Reference

### Return Values

| Property       | Type                       | Description                                  |
|----------------|----------------------------|----------------------------------------------|
| `dragActive`   | `boolean`                  | Whether drag interaction is active           |
| `setDragActive`| `(active: boolean) => void`| Set drag state                              |
| `uploadError`  | `string \| null`           | Error message if upload failed               |
| `lastFile`     | `File \| null`             | Reference to last file for retry             |
| `processFile`  | `(file: File) => Promise<string \| null>` | Process and upload file       |
| `isProcessing` | `boolean`                  | Whether file is being processed              |

### Implementation Details

The hook provides the following functionality:

#### File Validation

- Validates file type (only PDF allowed)
- Validates file size (maximum 10MB)
- Provides error messages for invalid files

#### File Processing

- Reads file contents as ArrayBuffer
- Parses PDF structure using pdf-lib
- Uploads file to API endpoint
- Updates document store with new document information

## Example Implementation

```typescript
// From src/hooks/useDocumentUpload.ts
const processFile = useCallback(async (file: File) => {
  if (!validateFile(file)) {
    return null;
  }

  try {
    setDocumentLoading(true);
    
    // Read file
    const arrayBuffer = await file.arrayBuffer();
    
    // Process PDF
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfDoc = await PDFDocument.load(uint8Array);

    // Upload to API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    
    const response = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    });
    
    // Update document store
    setCurrentDocument({
      id: response.id,
      name: file.name,
      file: file,
      pdfBytes: uint8Array,
      parsedContent: { sections }
    });
    
    return response.id;
  } catch (error) {
    // Error handling
    setUploadError('Failed to process PDF');
    return null;
  } finally {
    setDocumentLoading(false);
  }
}, [/* dependencies */]);
```

## Integration with Components

This hook is primarily used by the `DocumentUploader` component, which provides the user interface for file uploads including:

- Drag-and-drop area
- File selection button
- Progress indicator
- Error display and retry functionality 