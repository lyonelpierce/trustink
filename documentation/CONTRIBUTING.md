# Contributing to TrustInk Documentation

This guide explains how to effectively contribute to and maintain the TrustInk documentation.

## Documentation Structure

The TrustInk documentation is organized into four main categories:

1. **Core Documentation** - System design and components (01-05)
2. **Project Management** - Implementation status and roadmap (06-07)
3. **Implementation Guides** - Detailed information for specific features
4. **Component Documentation** - In the `/components` and `/hooks` directories

## Key Documentation Principles

### 1. Single Source of Truth

The [Project Status & Roadmap](./07-development-roadmap.md) document is the authoritative source for implementation status and development plans. Always update this document when:

- Features are completed
- Implementation priorities change
- New tasks or features are added to the roadmap

### 2. Avoid Duplication

Don't repeat the same information across multiple documents:

- **DO**: Use cross-references to link to existing information
- **DON'T**: Copy and paste the same content into multiple files

### 3. Keep Documentation Updated

When making code changes, update the relevant documentation:

- New component? Update the Component Reference
- Changed API? Update the API Reference
- Completed a feature? Update the Project Status & Roadmap

### 4. Use Standard Formatting

Follow these formatting guidelines:

- Use Markdown properly with appropriate heading levels
- Use Mermaid for diagrams and flowcharts
- Use code blocks with language specification for code samples
- Use emojis consistently for status (✅ ⚠️ ❌)

## How to Update Documentation

### Adding a New Feature to the Roadmap

1. Edit [07-development-roadmap.md](./07-development-roadmap.md)
2. Add the feature under the appropriate quarter/phase
3. Include clear implementation details and acceptance criteria

### Marking a Feature as Completed

1. Edit [07-development-roadmap.md](./07-development-roadmap.md)
2. Move the feature from "Features To Be Implemented" to "Fully Implemented Features"
3. Add the completion date

### Adding a New Document

1. Create the new document with clear sections and appropriate details
2. Update [README.md](./README.md) to include the new document in the index
3. Add cross-references from existing documents if relevant

### Adding Component Documentation

1. Add detailed JSDoc comments to your components and hooks
2. For complex components, create a dedicated Markdown file in the `/components` or `/hooks` directory
3. Update [05-component-reference.md](./05-component-reference.md) with a reference to the new component

## Example: Documenting a Feature Implementation

When implementing a new feature:

1. **Start**: Review the feature requirements in [07-development-roadmap.md](./07-development-roadmap.md)
2. **During Development**: Keep notes on implementation details
3. **After Completion**: 
   - Update [07-development-roadmap.md](./07-development-roadmap.md) to mark the feature as complete
   - Update relevant technical documentation
   - Add component-specific documentation if needed

## Questions or Issues

If you have questions about documentation structure or need clarification:
- Ask in the development channel
- Create an issue with the "documentation" label
- Consult the [README.md](./README.md) for guidance 