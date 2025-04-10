-- Schema for DocuSign 2.0 Application

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (extended from Clerk user data)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document embeddings table
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to match document sections by embedding similarity
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
    document_embeddings.section_id,
    document_embeddings.content,
    document_embeddings.metadata,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity
  FROM document_embeddings
  WHERE 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Document analyses table
CREATE TABLE document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document versions table
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  version INTEGER NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  document_id UUID REFERENCES documents(id),
  content JSONB,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  document_id UUID REFERENCES documents(id),
  template_id UUID REFERENCES templates(id),
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signers table
CREATE TABLE signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Revisions table (for tracking proposed changes)
CREATE TABLE contract_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  comment TEXT,
  changes JSONB NOT NULL, -- Stores the actual changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Section Changes table (for specific section edits within a revision)
CREATE TABLE section_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES contract_revisions(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL, -- Reference to the section in the document
  original_text TEXT NOT NULL,
  proposed_text TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revision Comments table (for discussion on proposed changes)
CREATE TABLE revision_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES contract_revisions(id) ON DELETE CASCADE,
  section_change_id UUID REFERENCES section_changes(id) NULL,
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for conversation history
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_transcript TEXT NOT NULL,
  object TEXT,
  status TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_signers_contract_id ON signers(contract_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_contract_revisions_contract_id ON contract_revisions(contract_id);
CREATE INDEX idx_section_changes_revision_id ON section_changes(revision_id);
CREATE INDEX idx_revision_comments_revision_id ON revision_comments(revision_id);

-- Create Storage buckets
-- Run these in the Supabase SQL editor:

-- INSERT INTO storage.buckets (id, name) VALUES ('documents', 'documents');
-- INSERT INTO storage.buckets (id, name) VALUES ('pdf-documents', 'pdf-documents');
-- INSERT INTO storage.buckets (id, name) VALUES ('voice-recordings', 'voice-recordings');

-- Set up Row Level Security (RLS) policies
-- Documents RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents" 
  ON documents FOR SELECT
  USING (user_id = auth.uid()::uuid);
  
CREATE POLICY "Users can insert their own documents" 
  ON documents FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);
  
CREATE POLICY "Users can update their own documents" 
  ON documents FOR UPDATE
  USING (user_id = auth.uid()::uuid);
  
CREATE POLICY "Users can delete their own documents" 
  ON documents FOR DELETE
  USING (user_id = auth.uid()::uuid);

-- Apply similar RLS policies to other tables...

-- Contract Revisions RLS
ALTER TABLE contract_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revisions for their contracts" 
  ON contract_revisions FOR SELECT
  USING (
    (contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid())) OR
    (proposed_by = auth.uid())
  );
  
CREATE POLICY "Users can insert revisions" 
  ON contract_revisions FOR INSERT
  WITH CHECK (proposed_by = auth.uid());

-- Section Changes RLS  
ALTER TABLE section_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view section changes for their revisions" 
  ON section_changes FOR SELECT
  USING (
    revision_id IN (
      SELECT id FROM contract_revisions 
      WHERE (proposed_by = auth.uid()) OR 
            (contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid()))
    )
  );

-- Document Analyses RLS
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document analyses" 
  ON document_analyses FOR SELECT
  USING (user_id = auth.uid());
  
-- Templates RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates or public templates" 
  ON templates FOR SELECT
  USING (user_id = auth.uid() OR is_public = TRUE);
  
CREATE POLICY "Users can insert their own templates" 
  ON templates FOR INSERT
  WITH CHECK (user_id = auth.uid());
  
-- Document Embeddings RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document embeddings for their documents" 
  ON document_embeddings FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can insert document embeddings for their documents" 
  ON document_embeddings FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can delete document embeddings for their documents" 
  ON document_embeddings FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()::uuid
    )
  );

-- Create index for similarity search
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON templates
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_contract_revisions_updated_at
BEFORE UPDATE ON contract_revisions
FOR EACH ROW EXECUTE PROCEDURE update_modified_column(); 