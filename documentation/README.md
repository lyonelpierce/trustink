# TrustInk Documentation

This directory contains comprehensive documentation for the TrustInk document management system with AI integration.

## Quick Links for Developers

- **[Project Status & Roadmap](./07-development-roadmap.md)** - Current implementation status and development plans
- **[System Architecture](./01-system-architecture.md)** - Technical architecture and database schema
- **[Data Models](./02-data-models.md)** - Core data types and database structure

## Documentation Index

### Core Documentation

1. **[System Architecture](./01-system-architecture.md)** - Database design and component structure
2. **[Data Models](./02-data-models.md)** - Core data types and store structure
3. **[User Flows](./03-user-flows.md)** - Document analysis and revision management workflows
4. **[API Reference](./04-api-reference.md)** - API endpoints and usage
5. **[Component Reference](./05-component-reference.md)** - Key components and their roles

### Project Management

6. **[Project Status & Roadmap](./07-development-roadmap.md)** - ⭐ Single source of truth for implementation status and development plans

### Implementation Guides

7. **[PDF Architecture](./pdf-architecture.md)** - PDF upload and processing design
8. **[PDF Implementation Tasks](./pdf-implementation-tasks.md)** - Task checklist for PDF implementation
9. **[PDF Testing Guide](./pdf-testing-guide.md)** - Guide for testing PDF functionality
10. **[Voice Assistant Guide](./voice-assistant-guide.md)** - Voice-based document interaction features
11. **[Build System](./build-system.md)** - Build configuration, development workflow, and dependency management

## Documentation Structure

The documentation is organized to serve different needs:

- **Core Documentation (01-05)**: Describes the system design and components
- **Project Management (06-07)**: Tracks implementation status and roadmap
- **Implementation Guides**: Provides detailed information for specific features

## Best Practices for Documentation

When contributing to this documentation:

1. **Single Source of Truth**: The [Project Status & Roadmap](./07-development-roadmap.md) document is the authoritative source for implementation status and development plans.

2. **Keep Content Focused**: Each document should have a clear, specific purpose to avoid duplication.

3. **Cross-Reference**: Link to other documents rather than duplicating information.

4. **Update README**: When adding new documentation, update this README to maintain the index.

5. **Use Diagrams**: Use Mermaid syntax for consistent diagrams.

## Getting Started

For new developers:

1. Start with the **[Project Status & Roadmap](./07-development-roadmap.md)** to understand what's been implemented and what's next
2. Review the **[System Architecture](./01-system-architecture.md)** for an overview of the system
3. Examine the **[User Flows](./03-user-flows.md)** to understand how users interact with the system

## Installation and Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev

# Run tests
npm test

# Build for production (with linting)
npm run build
```

## Key Features

### Document Management
- Upload and manage PDF documents
- View and navigate document content
- Organize documents by user

### AI Analysis
- Analyze document content for risks and issues
- Ask questions about specific document sections
- Receive recommendations for improvements

### Voice Assistant
- Interact with documents using both text and speech
- Ask questions verbally and receive spoken responses
- AI responses consider both document content and highlighted sections

### Collaborative Editing
- Propose and review document changes
- Track revision history
- Accept or reject suggested edits

## Code Structure

The codebase follows a clean separation of concerns:
- Components focus on rendering UI elements
- Custom hooks encapsulate business logic
- Context providers manage shared state
- API routes handle data operations

## Troubleshooting

### Common Issues

1. **Dependency Management**: The project has specific version requirements for React and testing libraries. If you need to update dependencies, make sure to check compatibility between React, Next.js, and the testing stack.

2. **TypeScript Build Errors**: Most type errors can be resolved by updating type definitions or fixing type mismatches in the code. For test files, ensure proper type casting for mocks.

3. **Build Process Warnings**: Warnings about Babel configuration can be ignored if the build is successful. We're transitioning away from custom Babel configurations to use Next.js's native SWC compiler.

## Contributing

When contributing to this documentation, please ensure that diagrams are updated using Mermaid syntax for consistency. 