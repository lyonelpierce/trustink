import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { storeEmbeddings } from '@/lib/embeddings';
import { extractPdfSections } from '@/lib/document-processor';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function generateEmbeddings() {
  try {
    // Initialize Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, get all document IDs that already have embeddings
    const { data: existingEmbeddings, error: embeddingsError } = await supabase
      .from('document_embeddings')
      .select('document_id');

    if (embeddingsError) {
      throw embeddingsError;
    }

    const processedIds = new Set(existingEmbeddings?.map(e => e.document_id as string) || []);

    // Then, get all documents that don't have embeddings
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, path');

    if (documentsError) {
      throw documentsError;
    }

    // Filter out documents that already have embeddings
    const documentsToProcess = documents.filter(doc => !processedIds.has(doc.id));

    console.log(`Found ${documentsToProcess.length} documents to process`);

    // Process each document
    for (const doc of documentsToProcess) {
      console.log(`Processing document ${doc.id}...`);

      try {
        // Download document content
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('documents')
          .download(doc.path);

        if (fileError) throw fileError;

        // Extract sections
        const buffer = await fileData.arrayBuffer();
        const { sections } = await extractPdfSections(buffer);

        // Generate and store embeddings
        await storeEmbeddings(supabase, doc.id, sections);

        console.log(`✓ Generated embeddings for document ${doc.id}`);
      } catch (error) {
        console.error(`× Failed to process document ${doc.id}:`, error);
      }
    }

    console.log('Embedding generation complete!');
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    process.exit(1);
  }
}

// Run script
generateEmbeddings(); 