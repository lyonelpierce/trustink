import { createClient } from '@/lib/supabaseAdmin';
import { SupabaseClient } from '@supabase/supabase-js';

export type RevisionStatus = 'pending' | 'accepted' | 'rejected';

export interface SectionChange {
  section_id: string;
  original_text: string;
  proposed_text: string;
  ai_generated?: boolean;
}

export interface RevisionInput {
  contract_id: string;
  document_id: string;
  proposed_by: string;
  comment?: string;
  changes: Record<string, { originalText: string; proposedText: string; aiGenerated?: boolean }>;
}

/**
 * Create a new revision
 */
export async function createRevision(
  supabase: SupabaseClient,
  input: RevisionInput
) {
  console.log('[Revisions] Creating revision for contract:', input.contract_id);
  
  const changeCount = Object.keys(input.changes).length;
  console.log(`[Revisions] Revision contains ${changeCount} section changes`);
  
  return supabase
    .from('contract_revisions')
    .insert({
      contract_id: input.contract_id,
      document_id: input.document_id,
      proposed_by: input.proposed_by,
      comment: input.comment,
      status: 'pending',
    })
    .select()
    .single();
}

/**
 * Add section changes to a revision
 */
export async function addSectionChanges(
  supabase: SupabaseClient,
  revisionId: string,
  changes: SectionChange[]
) {
  console.log(`[Revisions] Adding ${changes.length} section changes to revision ${revisionId}`);
  
  // Insert section changes
  const formattedChanges = changes.map(change => ({
    revision_id: revisionId,
    section_id: change.section_id,
    original_text: change.original_text,
    proposed_text: change.proposed_text,
    ai_generated: change.ai_generated || false,
  }));
  
  return supabase
    .from('section_changes')
    .insert(formattedChanges);
}

/**
 * Get a revision with its section changes
 */
export async function getRevision(
  supabase: SupabaseClient,
  revisionId: string
) {
  console.log(`[Revisions] Getting revision ${revisionId}`);
  
  const { data: revision, error } = await supabase
    .from('contract_revisions')
    .select(`
      *,
      section_changes (*)
    `)
    .eq('id', revisionId)
    .single();
    
  if (error) {
    console.error(`[Revisions] Error getting revision ${revisionId}:`, error);
    return { data: null, error };
  }
  
  console.log(`[Revisions] Found revision with ${revision.section_changes.length} section changes`);
  return { data: revision, error: null };
}

/**
 * Get a revision with its related contract
 */
export async function getRevisionWithContract(
  supabase: SupabaseClient,
  revisionId: string
) {
  console.log(`[Revisions] Getting revision ${revisionId} with contract info`);
  
  return supabase
    .from('contract_revisions')
    .select(`
      *,
      contracts (*)
    `)
    .eq('id', revisionId)
    .single();
}

/**
 * Update the status of a revision
 */
export async function updateRevisionStatus(
  supabase: SupabaseClient,
  revisionId: string,
  status: RevisionStatus
) {
  console.log(`[Revisions] Updating revision ${revisionId} status to ${status}`);
  
  return supabase
    .from('contract_revisions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', revisionId)
    .select()
    .single();
}

/**
 * Add a comment to a revision
 */
export async function addRevisionComment(
  supabase: SupabaseClient,
  revisionId: string,
  userId: string,
  content: string
) {
  console.log(`[Revisions] Adding comment to revision ${revisionId} by user ${userId}`);
  
  return supabase
    .from('revision_comments')
    .insert({
      revision_id: revisionId,
      user_id: userId,
      content,
    });
}

/**
 * Get all revisions for a contract or document
 */
export async function getRevisions(
  supabase: SupabaseClient,
  {
    contractId,
    documentId,
    status,
  }: {
    contractId?: string;
    documentId?: string;
    status?: RevisionStatus;
  }
) {
  console.log('[Revisions] Getting revisions with filters:', { contractId, documentId, status });
  
  let query = supabase
    .from('contract_revisions')
    .select(`
      *,
      section_changes (*),
      revision_comments (*)
    `);
    
  if (contractId) {
    query = query.eq('contract_id', contractId);
  }
  
  if (documentId) {
    query = query.eq('document_id', documentId);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[Revisions] Error getting revisions:', error);
  } else {
    console.log(`[Revisions] Found ${data?.length || 0} revisions`);
  }
  
  return { data, error };
} 