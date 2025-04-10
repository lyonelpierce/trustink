import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { handleError } from './error-handler';
import { Database } from '@/types/supabase';

// Initialize OpenAI client lazily
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

interface DocumentSection {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

type DbClient = SupabaseClient<Database>;

/**
 * Generate embeddings for a text using OpenAI's text-embedding-ada-002 model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.replace(/\n/g, ' '),
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  } catch (error) {
    throw handleError(error, {
      customMessage: 'Failed to generate embedding',
      context: { text: text.slice(0, 100) + '...' }
    });
  }
}

/**
 * Store document section embeddings in Supabase
 */
export async function storeEmbeddings(
  supabase: DbClient,
  documentId: string,
  sections: DocumentSection[]
): Promise<void> {
  try {
    // Process sections in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < sections.length; i += batchSize) {
      const batch = sections.slice(i, i + batchSize);
      
      // Generate embeddings for batch
      const embeddings = await Promise.all(
        batch.map(async (section) => {
          const embedding = await generateEmbedding(section.content);
          return {
            document_id: documentId,
            section_id: section.id,
            content: section.content,
            embedding,
            metadata: section.metadata || {}
          };
        })
      );
      
      // Store embeddings in database
      const { error } = await supabase
        .from('document_embeddings')
        .insert(embeddings);
      
      if (error) throw error;
    }
  } catch (error) {
    throw handleError(error, {
      customMessage: 'Failed to store embeddings',
      context: { documentId }
    });
  }
}

/**
 * Search for similar document sections using vector similarity
 */
export async function searchSimilarSections(
  supabase: DbClient,
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
  } = {}
): Promise<Array<{
  sectionId: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}>> {
  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search using similarity function
    const { data, error } = await supabase.rpc('match_document_sections', {
      query_embedding: queryEmbedding,
      match_threshold: options.matchThreshold || 0.78,
      match_count: options.matchCount || 10
    });
    
    if (error) throw error;
    if (!data) return [];
    
    // Format results
    return data.map((result: { 
      section_id: string;
      content: string;
      metadata: Record<string, any>;
      similarity: number;
    }) => ({
      sectionId: result.section_id,
      content: result.content,
      metadata: result.metadata,
      similarity: result.similarity
    }));
  } catch (error) {
    throw handleError(error, {
      customMessage: 'Failed to search similar sections',
      context: { query }
    });
  }
} 