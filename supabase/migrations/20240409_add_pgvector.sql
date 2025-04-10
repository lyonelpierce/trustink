-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embeddings are 1536 dimensions
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster similarity search
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_document_sections(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
) RETURNS TABLE (
  section_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.section_id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM document_embeddings de
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add RLS policies
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings for their documents" 
  ON document_embeddings FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Add indexes for common queries
CREATE INDEX idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_created_at ON document_embeddings(created_at); 