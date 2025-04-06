# API Reference

This document provides a comprehensive reference for all API endpoints in the TrustInk application. The API is built using Next.js API routes with TypeScript.

## Authentication

All API endpoints require authentication through Clerk. The authentication is managed by including the `auth` middleware from Clerk in the API route handlers.

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authorized request
}
```

## Document Management

### GET /api/documents

Retrieves a list of documents for the authenticated user.

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "name": "Contract.pdf",
      "path": "documents/user_id_timestamp.pdf",
      "type": "application/pdf",
      "size": 123456,
      "created_at": "2023-06-15T12:34:56Z"
    }
  ]
}
```

### GET /api/documents/:id

Retrieves a specific document by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "Contract.pdf",
  "path": "documents/user_id_timestamp.pdf",
  "type": "application/pdf",
  "size": 123456,
  "created_at": "2023-06-15T12:34:56Z"
}
```

### POST /api/documents

Uploads a new document to the system and processes it.

**Request**:
- Format: `multipart/form-data`
- Authentication: Required

| Field    | Type | Required | Description                         |
|----------|------|----------|-------------------------------------|
| file     | File | Yes      | The PDF file to upload (max 10MB)   |
| name     | String | No     | Custom name for the document        |

**Response**:
- Status: 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Contract.pdf",
  "path": "userId_1649759238273.pdf",
  "pageCount": 12,
  "message": "Document uploaded successfully"
}
```

**Errors**:
- 401 Unauthorized: Authentication required
- 400 Bad Request: No file provided or invalid file
- 500 Internal Server Error: Upload or processing failed

**Implementation Notes**:
- File is uploaded to Supabase storage in the `documents` bucket
- Document metadata is stored in the `documents` table
- Document content/sections are stored in the `document_analyses` table
- Unique filename created using `userId_timestamp.fileExtension` format

### DELETE /api/documents/:id

Deletes a document by ID.

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

## Document Analysis

### POST /api/documents/analyze

Analyzes a document for insights and risks.

**Request:**
```json
{
  "documentId": "uuid",
  "question": "What are the risks in this contract?"
}
```

**Response:**
```json
{
  "analysis": {
    "riskySections": [
      {
        "id": "section-1",
        "title": "Termination Clause",
        "text": "The contract may be terminated...",
        "risk": "high",
        "explanation": "This clause gives unilateral rights...",
        "suggestion": "Negotiate for mutual termination..."
      }
    ],
    "summary": "The document contains concerning clauses...",
    "recommendedAction": "Consider negotiating before signing..."
  }
}
```

## Contract Revisions

### GET /api/contracts/revisions

Retrieves revisions for a contract or document.

**Query Parameters:**
- `contractId`: ID of the contract
- `documentId`: ID of the document
- `status` (optional): Filter by status ('pending', 'accepted', 'rejected')

**Response:**
```json
{
  "revisions": [
    {
      "id": "uuid",
      "contractId": "uuid",
      "documentId": "uuid",
      "proposedBy": "user_id",
      "status": "pending",
      "comment": "Improved termination terms",
      "changes": [...],
      "createdAt": "2023-06-15T12:34:56Z"
    }
  ]
}
```

### POST /api/contracts/revisions

Creates a new revision proposal.

**Request:**
```json
{
  "contractId": "uuid",
  "documentId": "uuid",
  "changes": [
    {
      "sectionId": "section-1",
      "originalText": "Original contract text...",
      "proposedText": "New contract text...",
      "aiGenerated": true,
      "comment": "More balanced terms"
    }
  ],
  "comment": "Proposed changes to improve contract balance"
}
```

**Response:**
```json
{
  "id": "uuid",
  "message": "Revision proposal created successfully"
}
```

### PATCH /api/contracts/revisions/:id

Updates the status of a revision.

**Request:**
```json
{
  "status": "accepted",
  "comment": "These changes look good"
}
```

**Response:**
```json
{
  "message": "Revision status updated successfully"
}
```

## Contracts

### POST /api/contracts

Creates a new contract from a document.

**Request:**
```json
{
  "name": "Service Agreement",
  "description": "Contract for IT services",
  "documentId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Service Agreement",
  "message": "Contract created successfully"
}
```

### GET /api/contracts

Retrieves a list of contracts for the authenticated user.

**Response:**
```json
{
  "contracts": [
    {
      "id": "uuid",
      "name": "Service Agreement",
      "description": "Contract for IT services",
      "status": "draft",
      "created_at": "2023-06-15T12:34:56Z"
    }
  ]
}
```

### GET /api/contracts/:id

Retrieves a specific contract by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "Service Agreement",
  "description": "Contract for IT services",
  "document": {
    "id": "uuid",
    "name": "Contract.pdf"
  },
  "status": "draft",
  "created_at": "2023-06-15T12:34:56Z"
}
```

## Utility Endpoints

### GET /api/user

Retrieves information about the authenticated user.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Implementation Notes

### API Route Structure

```
/api
├── documents
│   ├── route.ts
│   ├── [id]
│   │   └── route.ts
│   └── analyze
│       └── route.ts
├── contracts
│   ├── route.ts
│   ├── [id]
│   │   └── route.ts
│   └── revisions
│       ├── route.ts
│       └── [id]
│           └── route.ts
└── user
    └── route.ts
```

### Error Handling

All API endpoints use consistent error handling through utility functions:

```typescript
import { handleApiError, unauthorized, badRequest, notFound } from '@/lib/api-error-utils';

// Example usage
if (!userId) {
  return unauthorized();
}

if (!documentId) {
  return badRequest('Document ID is required');
}

if (!document) {
  return notFound();
}
```

### Mock vs. Real Implementations

In the current MVP:

- **Document upload**: Fully implemented with Supabase storage
- **Document analysis**: Using mock functions instead of actual AI integration
- **User authentication**: Fully implemented with Clerk
- **Contract revisions**: Fully implemented with Supabase database

The API design allows for seamless transition from mock implementations to real services by swapping out the implementation functions while maintaining the same interface. 