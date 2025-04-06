export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabaseAdmin';
import { 
  getDocumentById, 
  downloadDocument, 
  saveDocumentAnalysis,
  getUserIdByClerkId
} from '@/lib/supabase';
import { PDFDocument } from 'pdf-lib';
import { analyzeDocument, type AnalysisRequest, type DocumentSection } from '@/lib/document-ai';

// Extract sections from PDF document
async function extractPdfSections(buffer: ArrayBuffer): Promise<{ sections: DocumentSection[], pageCount: number }> {
  console.log('[API/analyze] Extracting sections from PDF...');
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`[API/analyze] PDF has ${pageCount} pages`);
    
    // Create basic sections by page
    // In a production version, this would use more sophisticated text extraction
    const sections: DocumentSection[] = [];
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      sections.push({
        id: `page-${i+1}`,
        title: `Page ${i+1}`,
        text: `Content from page ${i+1}`, // Placeholder - would contain actual text in full implementation
        pageNumber: i+1,
        position: { x: 0, y: 0, width, height }
      });
    }
    
    console.log(`[API/analyze] Extracted ${sections.length} sections`);
    return { sections, pageCount };
  } catch (error) {
    console.error('[API/analyze] Error extracting PDF sections:', error);
    throw new Error('Failed to extract sections from PDF');
  }
}

// GET endpoint to fetch document analysis
export async function GET(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[API/analyze] GET: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get document ID from query params
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      console.log('[API/analyze] GET: Missing document ID');
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    console.log(`[API/analyze] GET: Fetching analysis for document ${documentId}`);
    
    // Get document from database
    const supabase = await createClient();
    
    // Try to find the database user UUID from Clerk ID
    const userUuid = await getUserIdByClerkId(supabase, userId);
    
    if (!userUuid) {
      console.error(`[API/analyze] GET: No user found for Clerk ID ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { data: document, error: documentError } = await getDocumentById(supabase, documentId, userId);
      
    if (documentError || !document) {
      console.log('[API/analyze] GET: Document not found');
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Check if document has already been analyzed
    const { data: analyses, error: analysesError } = await supabase
      .from('document_analyses')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userUuid) // Use the UUID instead of Clerk ID
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!analysesError && analyses && analyses.length > 0) {
      console.log('[API/analyze] GET: Found existing analysis');
      return NextResponse.json(analyses[0].content);
    }
    
    // If no analysis exists, we need to create default sections
    console.log('[API/analyze] GET: No existing analysis, extracting sections');
    
    // Get document content from storage
    const { data: fileData, error: fileError } = await downloadDocument(supabase, document.path);
      
    if (fileError || !fileData) {
      console.log('[API/analyze] GET: Failed to download document');
      return NextResponse.json({ error: 'Failed to retrieve document content' }, { status: 500 });
    }
    
    // Extract basic sections from the PDF
    const buffer = await fileData.arrayBuffer();
    const { sections, pageCount } = await extractPdfSections(buffer);
    
    // Create a basic analysis
    const analysisResult = {
      pageCount,
      sections,
      extractedAt: new Date().toISOString()
    };
    
    // Save analysis to database with user UUID
    const { error: saveError } = await saveDocumentAnalysis(
      supabase,
      documentId,
      userUuid, // Use the UUID instead of Clerk ID
      analysisResult
    );
    
    if (saveError) {
      console.error('[API/analyze] GET: Error saving analysis:', saveError);
      // Continue even with save error
    }
    
    console.log('[API/analyze] GET: Returning new analysis with', sections.length, 'sections');
    return NextResponse.json(analysisResult);
    
  } catch (error) {
    console.error('[API/analyze] GET: Error processing document:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[API/analyze] POST: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const requestData: AnalysisRequest = await request.json();
    const { documentId, question, highlightedSectionId, requestType } = requestData;
    
    if (!documentId) {
      console.log('[API/analyze] POST: Missing document ID');
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    console.log(`[API/analyze] POST: Analyzing document ${documentId} with request type: ${requestType || 'question'}`);
    
    // Get document from database
    const supabase = await createClient();
    
    // Try to find the database user UUID from Clerk ID
    const userUuid = await getUserIdByClerkId(supabase, userId);
    
    if (!userUuid) {
      console.error(`[API/analyze] POST: No user found for Clerk ID ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { data: document, error: documentError } = await getDocumentById(supabase, documentId, userId);
      
    if (documentError || !document) {
      console.log('[API/analyze] POST: Document not found');
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Get document content from storage
    const { data: fileData, error: fileError } = await downloadDocument(supabase, document.path);
      
    if (fileError || !fileData) {
      console.log('[API/analyze] POST: Failed to download document');
      return NextResponse.json({ error: 'Failed to retrieve document content' }, { status: 500 });
    }
    
    // Get existing analysis for sections
    let sections: DocumentSection[] = [];
    const { data: analyses, error: analysesError } = await supabase
      .from('document_analyses')
      .select('content')
      .eq('document_id', documentId)
      .eq('user_id', userUuid) // Use UUID instead of Clerk ID
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!analysesError && analyses && analyses.length > 0 && analyses[0].content.sections) {
      console.log('[API/analyze] POST: Using existing sections from analysis');
      sections = analyses[0].content.sections;
    } else {
      // Extract sections if not available
      console.log('[API/analyze] POST: Extracting sections from document');
      const buffer = await fileData.arrayBuffer();
      const extractResult = await extractPdfSections(buffer);
      sections = extractResult.sections;
    }
    
    // Analyze document content
    const analysisResult = await analyzeDocument({
      documentId,
      question,
      highlightedSectionId,
      requestType,
      sections
    });
    
    // Save analysis to database
    const { error: saveError } = await saveDocumentAnalysis(
      supabase,
      documentId,
      userUuid,
      {
        analysis: analysisResult,
        query: question || requestType,
        timestamp: new Date().toISOString()
      }
    );
    
    if (saveError) {
      console.error('[API/analyze] POST: Error saving analysis:', saveError);
    }
    
    console.log('[API/analyze] POST: Analysis complete');
    return NextResponse.json({ analysis: analysisResult });
    
  } catch (error) {
    console.error('[API/analyze] POST: Error during analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze document', 
      message: (error as Error).message 
    }, { status: 500 });
  }
} 