# TrustInk Documentation

This directory contains comprehensive documentation for the TrustInk document management system with AI integration.

## Documentation Index

1. [System Architecture](./01-system-architecture.md) - Database design and component structure
2. [Data Models](./02-data-models.md) - Core data types and store structure
3. [User Flows](./03-user-flows.md) - Document analysis and revision management workflows
4. [API Reference](./04-api-reference.md) - API endpoints and usage
5. [Component Reference](./05-component-reference.md) - Key components and their roles
6. [Implementation Status](./06-implementation-status.md) - What's implemented, mocked, and needs to be completed
7. [Development Roadmap](./07-development-roadmap.md) - Future development plans
8. [Build System](./build-system.md) - Build configuration, development workflow, and dependency management
9. [PDF Architecture](./pdf-architecture.md) - PDF upload and processing design
10. [PDF Implementation Tasks](./pdf-implementation-tasks.md) - Task checklist for PDF implementation
11. [PDF Testing Guide](./pdf-testing-guide.md) - Guide for testing PDF functionality
12. [PDF Upload Roadmap](./pdf-upload-roadmap.md) - Specific roadmap for PDF functionality
13. [Voice Assistant Guide](./voice-assistant-guide.md) - Voice-based document interaction features

## Installation and Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```bash
# Install dependencies
npm install
```

> **Note about dependencies**: The project uses React 18.2 and compatible testing libraries. We've specifically aligned our dependencies to avoid version conflicts. If you encounter dependency issues, ensure you're using the exact versions specified in package.json.

### Development

```bash
# Start the development server
npm run dev

# Run tests
npm test

# Build for production (with linting)
npm run build

# Build for production (without linting)
npm run build -- --no-lint
```

For more details on the build system and configuration files, see the [Build System](./build-system.md) documentation.

## Getting Started

For developers new to the project, we recommend starting with the [System Architecture](./01-system-architecture.md) document to understand the overall structure, followed by the [User Flows](./03-user-flows.md) to understand how users interact with the system. The [Development Roadmap](./07-development-roadmap.md) provides an overview of upcoming features and priorities.

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
- **Dual Interaction Modes**: Interact with documents using both text and speech
- **Text-Based Interaction**: Type questions and receive text responses about documents
- **Voice-Based Interaction**: Ask questions verbally and receive spoken responses
- **Web Speech API**: Uses browser's built-in speech recognition and synthesis
- **Document Context**: AI responses consider both the document content and highlighted sections
- **Conversation History**: Track and review your conversation with the AI assistant
- **Future Enhancements**: Planned integration with ElevenLabs for higher quality speech and OpenAI Whisper for improved recognition

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