export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseAdmin'
import { getMessageCount, insertMessage, getSessionMessages } from '@/lib/supabase'

export async function POST(request: Request) {
  const { id, item } = await request.json()
  
  if (!id || !item) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  
  try {
    const supabase = await createClient()
    
    // First check if we need to know the count for ordering
    const { data: existingMessages, error: countError } = await getMessageCount(supabase, id)
    
    if (countError) {
      console.error('Error getting message count:', countError)
      return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
    }
    
    const count = existingMessages.length
    
    // Insert the new message
    const { error: insertError } = await insertMessage(
      supabase,
      {
        id: item.id,
        session_id: id,
        content_type: item.content[0].type,
        content_transcript: item.content[0].transcript,
        object: item.object,
        role: item.role,
        status: item.status,
        type: item.type
      },
      count
    )
    
    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
    }
    
    return NextResponse.json({})
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  
  if (!id) {
    return NextResponse.json([])
  }
  
  try {
    const supabase = await createClient()
    
    const { data, error } = await getSessionMessages(supabase, id)
    
    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
