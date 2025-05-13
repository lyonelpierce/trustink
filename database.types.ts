export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: number
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: number
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          name: string
          path: string
          size: number
          status: string
          updated_at: string
          user_id: string
          visibility: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          path: string
          size: number
          status?: string
          updated_at?: string
          user_id: string
          visibility?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          path?: string
          size?: number
          status?: string
          updated_at?: string
          user_id?: string
          visibility?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      documents_data: {
        Row: {
          created_at: string
          data: string
          document_id: string
          id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          document_id: string
          id?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          document_id?: string
          id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      documents_lines: {
        Row: {
          bbox: number[] | null
          color: number
          created_at: string
          document_id: string
          font: string
          height: number
          id: string
          page_number: number
          position_x: number
          position_y: number
          size: number
          style: string
          text: string
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          bbox?: number[] | null
          color: number
          created_at?: string
          document_id: string
          font: string
          height: number
          id?: string
          page_number: number
          position_x: number
          position_y: number
          size: number
          style: string
          text: string
          updated_at?: string
          user_id: string
          width: number
        }
        Update: {
          bbox?: number[] | null
          color?: number
          created_at?: string
          document_id?: string
          font?: string
          height?: number
          id?: string
          page_number?: number
          position_x?: number
          position_y?: number
          size?: number
          style?: string
          text?: string
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_paragraphs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_paragraphs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      fields: {
        Row: {
          created_at: string
          document_id: string
          height: number
          id: number
          page: number
          position_x: number
          position_y: number
          recipient_id: string | null
          secondary_id: string
          type: Database["public"]["Enums"]["field_type"]
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          created_at?: string
          document_id: string
          height?: number
          id?: number
          page: number
          position_x?: number
          position_y?: number
          recipient_id?: string | null
          secondary_id?: string
          type?: Database["public"]["Enums"]["field_type"]
          updated_at?: string
          user_id: string
          width?: number
        }
        Update: {
          created_at?: string
          document_id?: string
          height?: number
          id?: number
          page?: number
          position_x?: number
          position_y?: number
          recipient_id?: string | null
          secondary_id?: string
          type?: Database["public"]["Enums"]["field_type"]
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "fields_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fields_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fields_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      recipients: {
        Row: {
          color: string
          created_at: string
          deleted_at: string
          document_id: string
          email: string
          id: string
          is_read: boolean
          is_send: boolean
          is_signed: boolean
          signature_id: string | null
          signed_at: string
          signer_id: string | null
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          deleted_at?: string
          document_id: string
          email: string
          id?: string
          is_read?: boolean
          is_send?: boolean
          is_signed?: boolean
          signature_id?: string | null
          signed_at?: string
          signer_id?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          deleted_at?: string
          document_id?: string
          email?: string
          id?: string
          is_read?: boolean
          is_send?: boolean
          is_signed?: boolean
          signature_id?: string | null
          signed_at?: string
          signer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipients_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipients_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipients_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
          {
            foreignKeyName: "recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      signatures: {
        Row: {
          created_at: string
          font: string
          full_name: string
          id: string
          initials: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          font?: string
          full_name: string
          id?: string
          initials: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          font?: string
          full_name?: string
          id?: string
          initials?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          image_url: string
          last_name: string
        }
        Insert: {
          clerk_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          image_url: string
          last_name: string
        }
        Update: {
          clerk_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          image_url?: string
          last_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_document_embeddings: {
        Args: {
          query_embedding: string
          document_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          embedding: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      field_type:
        | "signature"
        | "initials"
        | "name"
        | "email"
        | "date"
        | "text"
        | "number"
        | "radio"
        | "checkbox"
        | "dropdown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      field_type: [
        "signature",
        "initials",
        "name",
        "email",
        "date",
        "text",
        "number",
        "radio",
        "checkbox",
        "dropdown",
      ],
    },
  },
} as const
