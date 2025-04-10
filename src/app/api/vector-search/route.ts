import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { searchSimilarSections } from '@/lib/embeddings';
import OpenAI from 'openai';
import { Database } from '@/types/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    // Authenticate request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Search for relevant sections
    const sections = await searchSimilarSections(supabase, query);

    // Build context from relevant sections
    const context = sections
      .map(section => section.content)
      .join('\n\n');

    // Build prompt
    const prompt = `
      You are a helpful document assistant. Using only the information from the following document sections,
      answer the user's question. If you cannot answer the question based on the provided sections,
      say "I cannot find information about that in the document."
      
      Document sections:
      ${context}
      
      Question: ${query}
      
      Answer (in markdown format):
    `.trim();

    // Stream completion from OpenAI
    const response = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt,
      max_tokens: 500,
      temperature: 0,
      stream: true
    });

    // Create a TransformStream to process the response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process each chunk
    for await (const chunk of response) {
      const text = chunk.choices[0]?.text || '';
      const data = `data: ${JSON.stringify({ text })}\n\n`;
      await writer.write(encoder.encode(data));
    }

    // End the stream
    await writer.write(encoder.encode('data: [DONE]\n\n'));
    await writer.close();

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
} 