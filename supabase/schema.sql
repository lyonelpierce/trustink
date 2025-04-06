-- TrustInk Consolidated Database Schema
-- This file combines and standardizes all database structures for the TrustInk application

------------------------------
-- TABLES
------------------------------

-- Users table (extended from Clerk user data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  user_id UUID NOT NULL, -- Foreign key to user who uploaded the document
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Document analyses table
CREATE TABLE IF NOT EXISTS document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  content JSONB NOT NULL, -- Stores analysis results including sections
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Document versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  version INTEGER NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL
);

-- User-Document relationship table 
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view', -- view, edit, owner
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, document_id)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  content JSONB,
  user_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, completed, etc.
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Signers table
CREATE TABLE IF NOT EXISTS signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed, declined
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Contract Revisions table
CREATE TABLE IF NOT EXISTS contract_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  proposed_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  comment TEXT,
  changes JSONB NOT NULL, -- Metadata about changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Document Revisions table (for direct document edits)
CREATE TABLE IF NOT EXISTS document_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  section_id TEXT NOT NULL,
  original_content TEXT NOT NULL,
  revised_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_by UUID NOT NULL,
  comment TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Section Changes table
CREATE TABLE IF NOT EXISTS section_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES contract_revisions(id) ON DELETE CASCADE NOT NULL,
  section_id TEXT NOT NULL, -- ID of the document section being changed
  original_text TEXT NOT NULL,
  proposed_text TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Revision Comments table
CREATE TABLE IF NOT EXISTS revision_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES contract_revisions(id) ON DELETE CASCADE NOT NULL,
  section_change_id UUID REFERENCES section_changes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Messages table for conversation history
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_transcript TEXT NOT NULL,
  object TEXT,
  status TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

------------------------------
-- INDEXES
------------------------------

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Document analyses indexes
CREATE INDEX IF NOT EXISTS idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_user_id ON document_analyses(user_id);

-- Document versions indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

-- User documents indexes
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_document_id ON user_documents(document_id);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- Contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_document_id ON contracts(document_id);

-- Signers indexes
CREATE INDEX IF NOT EXISTS idx_signers_contract_id ON signers(contract_id);

-- Contract revisions indexes
CREATE INDEX IF NOT EXISTS idx_contract_revisions_contract_id ON contract_revisions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_revisions_proposed_by ON contract_revisions(proposed_by);
CREATE INDEX IF NOT EXISTS idx_contract_revisions_status ON contract_revisions(status);

-- Document revisions indexes
CREATE INDEX IF NOT EXISTS idx_document_revisions_document_id ON document_revisions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_revisions_status ON document_revisions(status);
CREATE INDEX IF NOT EXISTS idx_document_revisions_created_by ON document_revisions(created_by);

-- Section changes indexes
CREATE INDEX IF NOT EXISTS idx_section_changes_revision_id ON section_changes(revision_id);

-- Revision comments indexes
CREATE INDEX IF NOT EXISTS idx_revision_comments_revision_id ON revision_comments(revision_id);
CREATE INDEX IF NOT EXISTS idx_revision_comments_user_id ON revision_comments(user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

------------------------------
-- STORAGE BUCKETS
------------------------------

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-revisions', 'document-revisions', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-documents', 'pdf-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-recordings', 'voice-recordings', false)
ON CONFLICT (id) DO NOTHING;

------------------------------
-- ROW LEVEL SECURITY POLICIES
------------------------------

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profiles"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profiles"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Documents table RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (
    user_id = auth.uid() OR 
    id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid() AND permission_level IN ('edit', 'owner')
    )
  );

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (
    user_id = auth.uid() OR 
    id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid() AND permission_level = 'owner'
    )
  );

-- Document analyses RLS
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document analyses"
  ON document_analyses FOR SELECT
  USING (
    user_id = auth.uid() OR
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own document analyses"
  ON document_analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own document analyses"
  ON document_analyses FOR UPDATE
  USING (user_id = auth.uid());

-- Document versions RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document versions they have access to"
  ON document_versions FOR SELECT
  USING (
    created_by = auth.uid() OR
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document versions they have edit access to"
  ON document_versions FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid() AND permission_level IN ('edit', 'owner')
    )
  );

-- User documents RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their document relations"
  ON user_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Document owners can manage access"
  ON user_documents FOR ALL
  USING (
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid() AND permission_level = 'owner'
    )
  );

-- Templates RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates or public templates"
  ON templates FOR SELECT
  USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY "Users can insert their own templates"
  ON templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (user_id = auth.uid());

-- Contracts RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts they created or have access to"
  ON contracts FOR SELECT
  USING (
    created_by = auth.uid() OR
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Contract owners can update contracts"
  ON contracts FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Contract owners can delete contracts"
  ON contracts FOR DELETE
  USING (created_by = auth.uid());

-- Signers RLS
ALTER TABLE signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract owners can view signers"
  ON signers FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Contract owners can manage signers"
  ON signers FOR ALL
  USING (
    contract_id IN (
      SELECT id FROM contracts 
      WHERE created_by = auth.uid()
    )
  );

-- Contract Revisions RLS
ALTER TABLE contract_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revisions for their contracts"
  ON contract_revisions FOR SELECT
  USING (
    proposed_by = auth.uid() OR
    contract_id IN (
      SELECT id FROM contracts 
      WHERE created_by = auth.uid()
    ) OR
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert revisions"
  ON contract_revisions FOR INSERT
  WITH CHECK (proposed_by = auth.uid());

CREATE POLICY "Contract owners can update revisions"
  ON contract_revisions FOR UPDATE
  USING (
    contract_id IN (
      SELECT id FROM contracts 
      WHERE created_by = auth.uid()
    )
  );

-- Document Revisions RLS
ALTER TABLE document_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all document revisions they have access to"
  ON document_revisions FOR SELECT
  USING (
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create revisions for documents they have edit access to"
  ON document_revisions FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid() AND permission_level IN ('edit', 'owner')
    )
  );

CREATE POLICY "Document owners can update revisions"
  ON document_revisions FOR UPDATE
  USING (
    document_id IN (
      SELECT document_id FROM user_documents 
      WHERE user_id = auth.uid() AND permission_level = 'owner'
    )
  );

-- Section Changes RLS
ALTER TABLE section_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view section changes for their revisions"
  ON section_changes FOR SELECT
  USING (
    revision_id IN (
      SELECT id FROM contract_revisions 
      WHERE proposed_by = auth.uid() OR 
            contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can insert section changes for their revisions"
  ON section_changes FOR INSERT
  WITH CHECK (
    revision_id IN (
      SELECT id FROM contract_revisions 
      WHERE proposed_by = auth.uid()
    )
  );

-- Revision Comments RLS
ALTER TABLE revision_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for revisions they have access to"
  ON revision_comments FOR SELECT
  USING (
    revision_id IN (
      SELECT id FROM contract_revisions 
      WHERE proposed_by = auth.uid() OR 
            contract_id IN (SELECT id FROM contracts WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own comments"
  ON revision_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM documents 
      WHERE user_id = auth.uid()
    )
  );

-- Storage policies
CREATE POLICY "Users can access their own documents"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can access document revisions they have permissions for"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'document_revisions' AND 
    (storage.foldername(name))[1] IN (
      SELECT document_id::text FROM user_documents WHERE user_id = auth.uid()
    )
  );

------------------------------
-- FUNCTIONS AND TRIGGERS
------------------------------

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_modtime
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_documents_modtime
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_document_analyses_modtime
  BEFORE UPDATE ON document_analyses
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_documents_modtime
  BEFORE UPDATE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_templates_modtime
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_contracts_modtime
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_contract_revisions_modtime
  BEFORE UPDATE ON contract_revisions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_document_revisions_modtime
  BEFORE UPDATE ON document_revisions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 