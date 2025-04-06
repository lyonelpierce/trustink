export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabaseAdmin';
import { 
  uploadDocumentFile, 
  createDocumentRecord, 
  getDocumentById, 
  getUserDocuments, 
  saveDocumentAnalysis, 
  getUserDocumentsWithMeta,
  extractPdfText,
  getDocumentAnalysis,
  getUserIdByClerkId
} from '@/lib/supabase';
import { 
  handleApiError, 
  unauthorized, 
  badRequest, 
  notFound
} from '@/lib/api-error-utils';

export async function POST(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      return unauthorized();
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return badRequest('No file provided');
    }
    
    const name = formData.get('name') as string || file.name;
    
    // Upload file to Supabase storage
    const supabase = await createClient();
    const fileBuffer = await file.arrayBuffer();
    
    // Create a unique filename
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${timestamp}.${fileExtension}`;
    
    // Upload the file
    const { data: storageData, error: storageError } = await uploadDocumentFile(
      supabase,
      fileName,
      fileBuffer,
      file.type
    );
    
    if (storageError) {
      console.error('[API/documents] Error uploading to storage:', storageError);
      return handleApiError(storageError, 'documents.upload', 'Failed to upload document');
    }
    
    // Extract document content
    const { sections, pageCount } = await extractPdfText(fileBuffer);
    
    // Create document record in database
    const { data: documentData, error: documentError } = await createDocumentRecord(
      supabase,
      {
        name,
        path: storageData.path,
        type: file.type,
        size: file.size,
        user_id: userId,
      }
    );
      
    if (documentError) {
      console.error('[API/documents] Error saving document record:', documentError);
      return handleApiError(documentError, 'documents.create', 'Failed to save document record');
    }
    
    // Save document analysis with sections
    const { error: analysisError } = await saveDocumentAnalysis(
      supabase,
      documentData.id,
      userId,
      {
        pageCount,
        sections,
        extractedAt: new Date().toISOString()
      }
    );
    
    if (analysisError) {
      console.error('[API/documents] Error saving document analysis:', analysisError);
      // We'll continue even if analysis saving fails
    }
    
    return NextResponse.json({ 
      id: documentData.id,
      name: documentData.name,
      path: documentData.path,
      pageCount,
      message: 'Document uploaded successfully' 
    });
    
  } catch (error) {
    console.error('[API/documents] Error processing document:', error);
    return handleApiError(error, 'documents.post', 'Failed to process document');
  }
}

export async function GET(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      return unauthorized();
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const includeAnalysis = url.searchParams.get('includeAnalysis') === 'true';
    const includeContracts = url.searchParams.get('includeContracts') === 'true';
    
    const supabase = await createClient();
    
    if (id) {
      // Get a specific document
      const { data, error } = await getDocumentById(supabase, id, userId);
        
      if (error) {
        return notFound('Document not found');
      }
      
      // Get additional data if requested
      if (includeAnalysis) {
        const { data: analysisData, error: analysisError } = await getDocumentAnalysis(
          supabase,
          id,
          userId
        );
          
        if (!analysisError && analysisData) {
          data.analysis = analysisData;
        }
      }
      
      return NextResponse.json(data);
    } else {
      try {
        // List all documents for the user
        const { data, error } = includeAnalysis || includeContracts
          ? await getUserDocumentsWithMeta(supabase, userId)
          : await getUserDocuments(supabase, userId);
          
        if (error) {
          console.error('[API:documents.list]', error);
          // If there's a format error with the user ID, return an empty array
          // rather than a 500 error
          return NextResponse.json([]);
        }
        
        return NextResponse.json(data || []);
      } catch (error) {
        console.error('[API:documents.list]', error);
        // Return empty array instead of error for better user experience
        return NextResponse.json([]);
      }
    }
  } catch (error) {
    console.error('[API:documents.get]', error);
    // Return empty array for document list requests
    return NextResponse.json([]);
  }
} 