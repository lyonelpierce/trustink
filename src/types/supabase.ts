export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          name: string
          path: string
          type: string
          size: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          path: string
          type: string
          size: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          path?: string
          type?: string
          size?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      document_embeddings: {
        Row: {
          id: string
          document_id: string
          section_id: string
          embedding: number[]
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          section_id: string
          embedding: number[]
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          section_id?: string
          embedding?: number[]
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      document_analyses: {
        Row: {
          id: string
          document_id: string
          user_id: string
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          content: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          content?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_document_sections: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: Array<{
          section_id: string
          content: string
          metadata: Json
          similarity: number
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 