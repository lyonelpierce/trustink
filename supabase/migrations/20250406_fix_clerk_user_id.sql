-- Migration to fix user_id handling for Clerk integration

-- First, modify the documents table to accept TEXT for user_id
ALTER TABLE documents ALTER COLUMN user_id TYPE TEXT;

-- Remove the foreign key constraint if it exists
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

-- Create a function to find the user UUID from clerk_id
CREATE OR REPLACE FUNCTION get_user_id_from_clerk_id(clerk_id_param TEXT)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid FROM users WHERE clerk_id = clerk_id_param;
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update existing rows with clerk IDs to use the UUID from users table
UPDATE documents
SET user_id = (SELECT id FROM users WHERE clerk_id = user_id)
WHERE EXISTS (SELECT 1 FROM users WHERE clerk_id = user_id);

-- Modify the document_analyses table to accept TEXT for user_id
ALTER TABLE document_analyses ALTER COLUMN user_id TYPE TEXT;

-- Remove the foreign key constraint if it exists
ALTER TABLE document_analyses DROP CONSTRAINT IF EXISTS document_analyses_user_id_fkey; 