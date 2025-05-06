// Demo Document Page - server component
import React from 'react';
import { DocumentAnalysisLayout } from '@/components/DocumentAnalysisLayout';
import { DemoModeIndicator } from '@/components/DemoModeIndicator';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Metadata } from 'next';

/**
 * Metadata for the demo document page
 */
export const metadata: Metadata = {
  title: 'Document Analysis Demo | TrustInk',
  description: 'Demonstration of AI-powered document analysis and revision capabilities',
};

/**
 * Demo Document Page
 * 
 * This page provides a demonstration of the document analysis and revision
 * features using mock data. It automatically enables demo mode in the context.
 * 
 * Available demo document IDs:
 * - doc-123: Sample Contract
 */
export default async function DemoDocumentPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // In a demo, we use the id parameter directly without validating
  // This is just for demonstration purposes - in production code, we'd validate the ID
  const id = params.id;
  
  console.log(`[DemoPage] Loading demo document with ID: ${id}`);
  
  return (
    <div className="h-full flex flex-col">
      {/* Demo mode indicator */}
      <DemoModeIndicator className="mx-4 mt-4 mb-2" />
      
      {/* Main content */}
      <div className="flex-grow">
        <ErrorBoundary>
          <DocumentAnalysisLayout documentId={id} />
        </ErrorBoundary>
      </div>
    </div>
  );
} 