// server component
import React from 'react';
import { DocumentAnalysisLayout } from '@/components/DocumentAnalysisLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { createClient } from '@/lib/supabaseAdmin';
import { getDocumentById } from '@/lib/supabase';
import { redirect } from 'next/navigation';

interface Params {
  id: string;
}

export default async function DocumentPage({ 
  params 
}: { 
  params: Params
}) {
  const { id } = params;
  
  // Get the server-side Supabase client
  const supabase = await createClient();
  
  // Check if the document exists
  const { data: document, error } = await getDocumentById(supabase, id, 'user-id'); // User ID needs to be fetched from auth in a real implementation
  
  if (error || !document) {
    // Redirect to dashboard if document doesn't exist
    redirect('/dashboard');
  }
  
  return (
    <ErrorBoundary>
      <DocumentAnalysisLayout documentId={id} />
    </ErrorBoundary>
  );
} 