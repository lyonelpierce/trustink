# System Architecture

TrustInk is built with a modern architecture using Next.js, React, Supabase, and AI integration. This document outlines the database structure and component architecture.

## Database Structure

TrustInk uses Supabase as its primary database with PostgreSQL. The schema is designed to support document management, contract processing, and AI-assisted revisions.

```mermaid
erDiagram
    USERS {
        uuid id PK
        text clerk_id
        text email
        text first_name
        text last_name
        text image_url
        timestamp created_at
        timestamp updated_at
    }
    
    DOCUMENTS {
        uuid id PK
        text name
        text path
        text type
        int size
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    DOCUMENT_ANALYSES {
        uuid id PK
        uuid document_id FK
        uuid user_id FK
        jsonb content
        timestamp created_at
    }
    
    CONTRACTS {
        uuid id PK
        text name
        text description
        uuid document_id FK
        uuid template_id FK
        text status
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    CONTRACT_REVISIONS {
        uuid id PK
        uuid contract_id FK
        uuid document_id FK
        uuid proposed_by FK
        text status
        text comment
        jsonb changes
        timestamp created_at
        timestamp updated_at
    }
    
    SECTION_CHANGES {
        uuid id PK
        uuid revision_id FK
        text section_id
        text original_text
        text proposed_text
        boolean ai_generated
        timestamp created_at
    }
    
    REVISION_COMMENTS {
        uuid id PK
        uuid revision_id FK
        uuid section_change_id FK
        uuid user_id FK
        text comment
        timestamp created_at
    }
    
    MESSAGES {
        text id PK
        text session_id
        text role
        text content_type
        text content_transcript
        text object
        text status
        text type
        timestamp created_at
    }
    
    USERS ||--o{ DOCUMENTS : creates
    DOCUMENTS ||--o{ DOCUMENT_ANALYSES : analyzes
    DOCUMENTS ||--o{ CONTRACTS : has
    CONTRACTS ||--o{ CONTRACT_REVISIONS : proposes
    CONTRACT_REVISIONS ||--o{ SECTION_CHANGES : contains
    CONTRACT_REVISIONS ||--o{ REVISION_COMMENTS : discusses
    USERS ||--o{ CONTRACT_REVISIONS : proposes
    USERS ||--o{ REVISION_COMMENTS : writes
```

### Key Tables

- **users**: Extends Clerk authentication with additional user information
- **documents**: Stores uploaded files with metadata
- **document_analyses**: Stores AI analysis results for documents
- **contracts**: Represents legal contracts linked to documents
- **contract_revisions**: Tracks proposed changes to contracts
- **section_changes**: Stores specific text changes within a revision
- **revision_comments**: Captures discussion on proposed changes
- **messages**: Stores conversation history with the AI

## Component Architecture

The application is built with React components organized in a hierarchy that facilitates document viewing, editing, and AI interaction.

```mermaid
graph TD
    A[App] --> B[DocumentAnalysisPage]
    B --> C[DocumentAIProvider]
    C --> D[DocumentAnalysisContent]
    D --> E[EditableDocumentViewer]
    D --> F[RevisionPanel]
    D --> G[TextAnimation]
    D --> H[useDocumentStore]
    D --> I[useConversation]
    D --> J[useDocumentAI]
    
    %% Store connections
    H -.->|data/actions| E
    H -.->|data/actions| F
    
    %% AI Provider connections
    J -.->|proposeEdit| E
    J -.->|highlightSection| E
    J -.->|accept/reject| E
    
    %% Conversation hookup
    I -.->|messages| G
    I -.->|AI responses| J
    
    %% Document uploader flow
    K[DocumentUploader] -->|uploads| L[API Routes]
    L -->|stores| M[Supabase]
    
    %% Document analysis flow
    D -->|analyzes| L
    L -->|retrieves/updates| M
```

## Key Architectural Components

### Frontend

- **Next.js**: Server-side rendering and API routes
- **React**: Component-based UI
- **Zustand**: State management for document data
- **Context API**: Communication between AI and document components

### Backend

- **Supabase**: Database, authentication (alongside Clerk), and storage
- **API Routes**: Next.js API endpoints for document operations
- **AI Integration**: Interfaces with AI services for document analysis

### Authentication

- **Clerk**: Primary authentication provider
- **Row-Level Security**: Enforced in Supabase for data access control

## Directory Structure

```
src/
├── app/             # Next.js app routes
│   ├── (app)/        # Private routes
│   ├── api/          # API endpoints
│   └── auth/         # Authentication routes
├── components/      # React components
├── hooks/           # Custom React hooks
├── interfaces/      # TypeScript interfaces
├── lib/             # Utility functions, API clients
├── providers/       # Context providers
├── store/           # Zustand store
└── types.ts         # Common TypeScript types
```

## Communication Flow

1. **User Interaction**: User interacts with document or asks AI questions
2. **State Management**: Zustand store manages document state
3. **Context Communication**: DocumentAIProvider facilitates AI-document interaction
4. **API Integration**: API routes handle database operations
5. **Storage**: Document files stored in Supabase storage
6. **Database**: Structured data stored in Supabase PostgreSQL 