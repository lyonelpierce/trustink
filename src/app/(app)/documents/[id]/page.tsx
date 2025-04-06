// server component
import React from 'react';
import { DocumentAnalysisLayout } from '@/components/DocumentAnalysisLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { createClient } from '@/lib/supabaseAdmin';
import { getDocumentById } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

interface Params {
  id: string;
}

export default async function DocumentPage({ 
  params 
}: { 
  params: Params
}) {
  // Need to await params destructuring for Next.js 15
  const id = params.id;
  
  // Get the current user's ID from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    // If not authenticated, redirect to sign-in
    redirect('/sign-in');
  }
  
  // Get the server-side Supabase client
  const supabase = await createClient();
  
  // Check if the document exists and belongs to the current user
  const { data: document, error } = await getDocumentById(supabase, id, userId);
  
  if (error || !document) {
    console.error('Error fetching document:', error);
    // Redirect to dashboard if document doesn't exist
    redirect('/documents');
  }
  
  return (
    <ErrorBoundary>
      <DocumentAnalysisLayout documentId={id} />
    </ErrorBoundary>
  );
} 