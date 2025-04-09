# TrustInk Demo Guide

This guide outlines how to effectively demonstrate the TrustInk application using the built-in demo mode.

## Demo Mode Overview

TrustInk includes a dedicated demo mode that allows showcasing the application's features without requiring backend connectivity or real user data. Key features of demo mode:

- Pre-populated mock document data
- Simulated AI interactions and responses
- Working revision workflow with accept/reject functionality
- Visual indicators for mock data
- Comprehensive logging for debugging

## Demo URL Structure

The demo mode is accessible via dedicated URL routes:

- `/demo/documents/doc-123` - Sample contract document with pre-populated revisions
- `/demo/documents/sample` - Alias for the sample contract document

## Demo Walkthrough Script

Follow this script to demonstrate the core features of TrustInk:

### 1. Document Viewing

1. **Navigate to the demo URL**: `/demo/documents/doc-123`
2. **Point out the demo mode indicator**: Note the blue banner at the top indicating that you're using mock data
3. **Explore document sections**: Scroll through the document to show the different contract sections
4. **Highlight key features**:
   - Clean document layout with sections
   - Split-view interface with document on left, AI/revisions on right
   - Section highlighting on hover

### 2. AI Assistant Interaction

1. **Ensure you're on the "AI Assistant" tab** (default view)
2. **Ask a question about risks**: Type "What are the risks in this contract?" in the input field
3. **Point out the AI response**: The system will identify risky sections in the contract
4. **Ask about a specific section**: Type "Tell me about the termination clause"
5. **Demonstrate section highlighting**: Notice how the relevant section gets highlighted in the document
6. **Ask for suggestions**: Type "How can I improve the payment terms?"
7. **Show suggested edits**: The AI will propose specific improvements

### 3. Revision Management

1. **Switch to the "Revisions" tab**: Click on the "Revisions" tab in the right panel
2. **Explore pending revisions**: Note the list of proposed revisions with:
   - Original vs. proposed text
   - Risk level indicators
   - Accept/reject buttons
3. **Accept a revision**: Click "Accept" on the first revision
4. **Observe document update**: The document section will update with the accepted revision
5. **Reject a revision**: Click "Reject" on another revision
6. **Switch to "History" view**: Click on the "History" button to see accepted/rejected revisions
7. **Filter revisions**: Use the filter buttons to show only AI or user-generated revisions

### 4. Highlighting and Navigation

1. **Click on a revision**: This will highlight the corresponding section in the document
2. **Demonstrate section navigation**: Clicking different revisions navigates to different document sections
3. **Show highlighting persistence**: The highlighted section remains visible while you review revisions

## Key Talking Points

While demonstrating, emphasize these key aspects:

### Business Value

- **Risk Identification**: "TrustInk automatically identifies risky contract clauses, reducing legal exposure"
- **Time Savings**: "What traditionally took hours of legal review can now be done in minutes"
- **Improved Collaboration**: "Teams can easily propose, review, and accept/reject changes in a structured workflow"

### Technical Capabilities

- **AI-Powered Analysis**: "Advanced AI models analyze the document content to identify risks and opportunities"
- **Structured Revision Management**: "Every proposed change is tracked, with clear accept/reject workflows"
- **Document Intelligence**: "The system understands document structure and contextual relationships between sections"

## Troubleshooting Demo Issues

If you encounter issues during the demo:

1. **Refresh the page**: This will reset the demo state
2. **Check console logs**: Open browser developer tools to see detailed logs
3. **Try alternative demo document**: Use `/demo/documents/sample` as an alternative

## Extending the Demo

To extend the demo with additional functionality:

1. Add new mock documents in `src/mocks/document-mock.ts`
2. Add custom AI responses in `src/lib/document-ai.ts`
3. Create new demo routes in `src/app/demo/`

## Transitioning from Demo to Production

When ready to move beyond the demo:

1. Connect to real backend services by setting appropriate environment variables
2. Disable demo mode by not using the `/demo/` routes
3. Implement actual AI integration by replacing mock responses in the AI service 