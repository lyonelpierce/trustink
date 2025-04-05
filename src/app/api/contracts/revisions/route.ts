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
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { contractId, documentId, changes, comment } = await request.json();
    
    if (!contractId || !documentId || !changes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Create a new revision record
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
      console.error('Error creating revision:', revisionError);
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
    
    if (sectionChanges.length > 0) {
      const { error: sectionChangeError } = await addSectionChanges(
        supabase,
        revisionData.id,
        sectionChanges
      );
        
      if (sectionChangeError) {
        console.error('Error creating section changes:', sectionChangeError);
      }
    }
    
    return NextResponse.json({ 
      id: revisionData.id,
      status: 'pending',
      message: 'Revision created successfully' 
    });
    
  } catch (error) {
    console.error('Error creating revision:', error);
    return NextResponse.json({ error: 'Failed to create revision' }, { status: 500 });
  }
}

/**
 * Update a revision status (accept/reject)
 */
export async function PATCH(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { revisionId, status, comment } = await request.json();
    
    if (!revisionId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (status !== 'accepted' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Get the contract to ensure the user has permission to update
    const { data: revisionData, error: revisionError } = await getRevisionWithContract(supabase, revisionId);
      
    if (revisionError || !revisionData) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }
    
    // Check if user is the contract owner
    if (revisionData.contracts.created_by !== userId) {
      return NextResponse.json({ error: 'Only the contract owner can accept or reject revisions' }, { status: 403 });
    }
    
    // Update the revision status
    const { data: updatedRevision, error: updateError } = await updateRevisionStatus(
      supabase,
      revisionId,
      status
    );
      
    if (updateError) {
      console.error('Error updating revision:', updateError);
      return NextResponse.json({ error: 'Failed to update revision' }, { status: 500 });
    }
    
    // If accepted, we would typically update the document with the changes
    // This would be implemented in a production version
    
    // Add a comment if provided
    if (comment) {
      await addRevisionComment(supabase, revisionId, userId, comment);
    }
    
    return NextResponse.json({ 
      status: updatedRevision.status,
      message: `Revision ${status}` 
    });
    
  } catch (error) {
    console.error('Error updating revision:', error);
    return NextResponse.json({ error: 'Failed to update revision' }, { status: 500 });
  }
}

/**
 * Get revisions for a contract or document
 */
export async function GET(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const contractId = url.searchParams.get('contractId');
    const documentId = url.searchParams.get('documentId');
    const status = url.searchParams.get('status') as 'pending' | 'accepted' | 'rejected' | null;
    
    if (!contractId && !documentId) {
      return NextResponse.json({ error: 'Missing contractId or documentId' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    const { data, error } = await getRevisions(supabase, {
      contractId: contractId || undefined,
      documentId: documentId || undefined,
      status: status || undefined
    });
    
    if (error) {
      console.error('Error fetching revisions:', error);
      return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
  }
} 