import { SupabaseClient } from '@supabase/supabase-js';

type MessageInput = {
  id: string;
  session_id: string;
  content_type: string;
  content_transcript: string;
  object: string;
  role: string;
  status: string;
  type: string;
};

/**
 * Get the count of messages for a session to maintain order
 */
export const getMessageCount = async (supabase: SupabaseClient, sessionId: string) => {
  return await supabase
    .from('messages')
    .select('count')
    .eq('session_id', sessionId);
};

/**
 * Insert a new message with conflict handling
 */
export const insertMessage = async (
  supabase: SupabaseClient, 
  message: MessageInput, 
  orderIndex: number
) => {
  return await supabase
    .from('messages')
    .upsert({
      created_at: orderIndex,
      id: message.id,
      session_id: message.session_id,
      content_type: message.content_type,
      content_transcript: message.content_transcript,
      object: message.object,
      role: message.role,
      status: message.status,
      type: message.type
    }, { 
      onConflict: 'id',
      ignoreDuplicates: true 
    });
};

/**
 * Get all messages for a session ordered by created_at
 */
export const getSessionMessages = async (supabase: SupabaseClient, sessionId: string) => {
  return await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
};

/**
 * Get a document by ID for a specific user
 */
export const getDocumentById = async (supabase: SupabaseClient, documentId: string, userId: string) => {
  return await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();
};

/**
 * Get all documents for a user
 */
export const getUserDocuments = async (supabase: SupabaseClient, userId: string) => {
  return await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

/**
 * Get all documents for a user with additional metadata
 */
export const getUserDocumentsWithMeta = async (supabase: SupabaseClient, userId: string) => {
  return await supabase
    .from('documents')
    .select(`
      *,
      document_analyses(id, content),
      contracts(id, name, status)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
};

/**
 * Upload a document to storage
 */
export const uploadDocumentFile = async (
  supabase: SupabaseClient,
  fileName: string,
  fileBuffer: ArrayBuffer,
  contentType: string
) => {
  return await supabase
    .storage
    .from('documents')
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: false
    });
};

/**
 * Create a document record in the database
 */
export const createDocumentRecord = async (
  supabase: SupabaseClient,
  data: {
    name: string;
    path: string;
    type: string;
    size: number;
    user_id: string;
  }
) => {
  return await supabase
    .from('documents')
    .insert(data)
    .select()
    .single();
};

/**
 * Get contract revisions by contract ID and status
 */
export const getRevisionsByContract = async (
  supabase: SupabaseClient,
  contractId: string,
  status?: 'pending' | 'accepted' | 'rejected'
) => {
  let query = supabase
    .from('contract_revisions')
    .select('*, section_changes(*)')
    .eq('contract_id', contractId);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  return await query;
};

/**
 * Create a new contract revision
 */
export const createRevision = async (
  supabase: SupabaseClient,
  data: {
    contract_id: string;
    document_id: string;
    proposed_by: string;
    status?: 'pending' | 'accepted' | 'rejected';
    comment?: string;
    changes: Record<string, unknown>;
  }
) => {
  return await supabase
    .from('contract_revisions')
    .insert({
      contract_id: data.contract_id,
      document_id: data.document_id,
      proposed_by: data.proposed_by,
      status: data.status || 'pending',
      comment: data.comment,
      changes: data.changes
    })
    .select()
    .single();
};

/**
 * Add section changes to a revision
 */
export const addSectionChanges = async (
  supabase: SupabaseClient,
  revisionId: string,
  changes: Array<{
    section_id: string;
    original_text: string;
    proposed_text: string;
    ai_generated?: boolean;
  }>
) => {
  const formattedChanges = changes.map(change => ({
    revision_id: revisionId,
    section_id: change.section_id,
    original_text: change.original_text,
    proposed_text: change.proposed_text,
    ai_generated: change.ai_generated || false
  }));
  
  return await supabase
    .from('section_changes')
    .insert(formattedChanges);
};

/**
 * Get revision by ID with contract details
 */
export const getRevisionWithContract = async (supabase: SupabaseClient, revisionId: string) => {
  return await supabase
    .from('contract_revisions')
    .select('*, contracts:contract_id(*)')
    .eq('id', revisionId)
    .single();
};

/**
 * Update a revision's status
 */
export const updateRevisionStatus = async (
  supabase: SupabaseClient,
  revisionId: string,
  status: 'accepted' | 'rejected',
  updatedAt?: string
) => {
  return await supabase
    .from('contract_revisions')
    .update({ 
      status, 
      updated_at: updatedAt || new Date().toISOString() 
    })
    .eq('id', revisionId)
    .select()
    .single();
};

/**
 * Add a comment to a revision
 */
export const addRevisionComment = async (
  supabase: SupabaseClient,
  revisionId: string,
  userId: string,
  comment: string
) => {
  return await supabase
    .from('revision_comments')
    .insert({
      revision_id: revisionId,
      user_id: userId,
      comment
    });
};

/**
 * Get revisions by contract/document ID and optional status
 */
export const getRevisions = async (
  supabase: SupabaseClient,
  filters: {
    contractId?: string;
    documentId?: string;
    status?: 'pending' | 'accepted' | 'rejected';
  }
) => {
  let query = supabase
    .from('contract_revisions')
    .select('*, section_changes(*), revision_comments(*)');
  
  if (filters.contractId) {
    query = query.eq('contract_id', filters.contractId);
  }
  
  if (filters.documentId) {
    query = query.eq('document_id', filters.documentId);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  // Order by created_at descending (newest first)
  query = query.order('created_at', { ascending: false });
  
  return await query;
};

/**
 * Download document content from storage
 */
export const downloadDocument = async (supabase: SupabaseClient, path: string) => {
  return await supabase
    .storage
    .from('documents')
    .download(path);
};

/**
 * Save document analysis to the database
 */
export const saveDocumentAnalysis = async (
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
  analysisContent: Record<string, unknown>
) => {
  return await supabase
    .from('document_analyses')
    .insert({
      document_id: documentId,
      user_id: userId,
      content: analysisContent
    });
};

/**
 * Get document analysis for a specific document
 */
export const getDocumentAnalysis = async (
  supabase: SupabaseClient,
  documentId: string,
  userId?: string
) => {
  let query = supabase
    .from('document_analyses')
    .select('*')
    .eq('document_id', documentId);
  
  // Add user filter if provided
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  return await query.single();
};

/**
 * Extract text from PDF document using PDF-lib
 * Creates basic section structure based on pages
 */
export const extractPdfText = async (buffer: ArrayBuffer) => {
  const { PDFDocument } = await import('pdf-lib');
  console.log('[extractPdfText] Extracting text from PDF...');
  
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`[extractPdfText] PDF has ${pageCount} pages`);
    
    // For now, create basic sections by page
    // In a more advanced implementation, you'd use PDF.js or another library
    // to extract actual text content and identify meaningful sections
    const sections = [];
    
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
    
    console.log(`[extractPdfText] Extracted ${sections.length} sections`);
    return { sections, pageCount };
  } catch (error) {
    console.error('[extractPdfText] Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}; 