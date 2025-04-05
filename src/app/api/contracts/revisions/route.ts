export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabaseAdmin';
import { 
  createRevision, 
  addSectionChanges, 
  getRevisionWithContract, 
  updateRevisionStatus, 
  addRevisionComment, 
  getRevisions 
} from '@/lib/supabase';

/**
 * Create a new revision for a contract
 */
export async function POST(request: Request) {
  console.log('[API:Revisions] POST request received');
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[API:Revisions] Unauthorized request - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('[API:Revisions] Request body:', { 
      contractId: body.contractId,
      documentId: body.documentId,
      // Log number of changes instead of full changes for brevity
      changeCount: body.changes ? Object.keys(body.changes).length : 0 
    });
    
    const { contractId, documentId, changes, comment } = body;
    
    if (!contractId || !documentId || !changes) {
      console.log('[API:Revisions] Bad request - missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Create a new revision record
    console.log('[API:Revisions] Creating revision record');
    const { data: revisionData, error: revisionError } = await createRevision(
      supabase,
      {
        contract_id: contractId,
        document_id: documentId,
        proposed_by: userId,
        comment,
        changes
      }
    );
      
    if (revisionError) {
      console.error('[API:Revisions] Error creating revision:', revisionError);
      return NextResponse.json({ error: 'Failed to create revision' }, { status: 500 });
    }
    
    // Create section change records for each change
    const sectionChanges = [];
    for (const sectionId in changes) {
      const change = changes[sectionId];
      sectionChanges.push({
        section_id: sectionId,
        original_text: change.originalText,
        proposed_text: change.proposedText,
        ai_generated: change.aiGenerated || false
      });
    }
    
    console.log('[API:Revisions] Adding', sectionChanges.length, 'section changes');
    const { error: sectionChangeError } = await addSectionChanges(
      supabase,
      revisionData.id,
      sectionChanges
    );
    
    if (sectionChangeError) {
      console.error('[API:Revisions] Error adding section changes:', sectionChangeError);
      return NextResponse.json({ error: 'Failed to add section changes' }, { status: 500 });
    }
    
    console.log('[API:Revisions] Revision created successfully');
    return NextResponse.json({ 
      id: revisionData.id,
      status: 'pending',
      message: 'Revision created successfully' 
    });
    
  } catch (error) {
    console.error('[API:Revisions] Unexpected error in POST:', error);
    return NextResponse.json({ error: 'Failed to create revision' }, { status: 500 });
  }
}

/**
 * Update a revision status (accept/reject)
 */
export async function PATCH(request: Request) {
  console.log('[API:Revisions] PATCH request received');
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[API:Revisions] Unauthorized request - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('[API:Revisions] Request body:', { 
      revisionId: body.revisionId,
      status: body.status,
      hasComment: !!body.comment
    });
    
    const { revisionId, status, comment } = body;
    
    if (!revisionId || !status) {
      console.log('[API:Revisions] Bad request - missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (status !== 'accepted' && status !== 'rejected') {
      console.log('[API:Revisions] Bad request - invalid status:', status);
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Get the contract to ensure the user has permission to update
    console.log('[API:Revisions] Fetching revision:', revisionId);
    const { data: revisionData, error: revisionError } = await getRevisionWithContract(supabase, revisionId);
      
    if (revisionError || !revisionData) {
      console.error('[API:Revisions] Error fetching revision:', revisionError);
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }
    
    // Check if user is the contract owner
    if (revisionData.contracts.created_by !== userId) {
      console.log('[API:Revisions] User does not have permission to update revision');
      return NextResponse.json({ error: 'Only the contract owner can accept or reject revisions' }, { status: 403 });
    }
    
    // Update the revision status
    console.log('[API:Revisions] Updating revision status to:', status);
    const { data: updatedRevision, error: updateError } = await updateRevisionStatus(
      supabase,
      revisionId,
      status
    );
      
    if (updateError) {
      console.error('[API:Revisions] Error updating revision:', updateError);
      return NextResponse.json({ error: 'Failed to update revision' }, { status: 500 });
    }
    
    // If accepted, we would typically update the document with the changes
    // This would be implemented in a production version
    
    // Add a comment if provided
    if (comment) {
      console.log('[API:Revisions] Adding comment to revision');
      const { error: commentError } = await addRevisionComment(
        supabase,
        revisionId,
        userId,
        comment
      );
      
      if (commentError) {
        console.warn('[API:Revisions] Error adding comment:', commentError);
        // We'll continue even if the comment fails
      }
    }
    
    console.log('[API:Revisions] Revision updated successfully');
    return NextResponse.json({ 
      status: updatedRevision.status,
      message: `Revision ${status}` 
    });
    
  } catch (error) {
    console.error('[API:Revisions] Unexpected error in PATCH:', error);
    return NextResponse.json({ error: 'Failed to update revision' }, { status: 500 });
  }
}

/**
 * Get revisions for a contract or document
 */
export async function GET(request: Request) {
  console.log('[API:Revisions] GET request received');
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[API:Revisions] Unauthorized request - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const contractId = url.searchParams.get('contractId');
    const documentId = url.searchParams.get('documentId');
    const status = url.searchParams.get('status') as 'pending' | 'accepted' | 'rejected' | null;
    
    console.log('[API:Revisions] Query parameters:', { contractId, documentId, status });
    
    if (!contractId && !documentId) {
      console.log('[API:Revisions] Bad request - missing contractId or documentId');
      return NextResponse.json({ error: 'Missing contractId or documentId' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    console.log('[API:Revisions] Fetching revisions');
    const { data, error } = await getRevisions(supabase, {
      contractId: contractId || undefined,
      documentId: documentId || undefined,
      status: status || undefined
    });
    
    if (error) {
      console.error('[API:Revisions] Error fetching revisions:', error);
      return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
    
    console.log('[API:Revisions] Found', data?.length || 0, 'revisions');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[API:Revisions] Unexpected error in GET:', error);
    return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
  }
} 