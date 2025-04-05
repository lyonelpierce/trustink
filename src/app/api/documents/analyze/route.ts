export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabaseAdmin';
import { getDocumentById, downloadDocument, saveDocumentAnalysis } from '@/lib/supabase';

// Mock function to simulate AI document analysis
// In a real implementation, this would call OpenAI or similar
async function analyzeDocumentContent(content: string, question?: string) {
  // In production, replace with actual AI integration
  console.log('Analyzing document content...');
  
  // Wait to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulated response
  if (question?.toLowerCase().includes('worry')) {
    return {
      analysis: {
        riskySections: [
          {
            id: 'section-1',
            title: 'Termination Clause',
            text: 'The contract may be terminated at any time by the Provider without prior notice.',
            risk: 'high',
            explanation: 'This clause gives the provider unilateral termination rights without notice, which puts you at significant risk.',
            suggestion: 'Negotiate for mutual termination rights with reasonable notice periods (e.g., 30 days written notice).'
          }
        ],
        summary: 'The document contains a concerning termination clause that grants one-sided rights to the provider.',
        recommendedAction: 'Consider negotiating the termination clause before signing.'
      }
    };
  }
  
  return {
    analysis: {
      riskySections: [],
      summary: 'No major concerns found in this document.',
      recommendedAction: 'The document appears to be standard and fair.'
    }
  };
}

export async function POST(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { documentId, question } = await request.json();
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    // Get document from database
    const supabase = await createClient();
    const { data: document, error: documentError } = await getDocumentById(supabase, documentId, userId);
      
    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Get document content from storage
    const { data: fileData, error: fileError } = await downloadDocument(supabase, document.path);
      
    if (fileError) {
      return NextResponse.json({ error: 'Failed to retrieve document content' }, { status: 500 });
    }
    
    // Convert file to text (simplified for demo)
    const content = await fileData.text();
    
    // Analyze document content
    const analysisResult = await analyzeDocumentContent(content, question);
    
    // Save analysis to database
    const { error: analysisError } = await saveDocumentAnalysis(
      supabase,
      documentId,
      userId,
      analysisResult
    );
    
    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
    }
    
    return NextResponse.json(analysisResult);
    
  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
} 