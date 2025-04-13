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
      contract_revisions: {
        Row: {
          changes: Json
          comment: string | null
          contract_id: string
          created_at: string
          document_id: string
          id: string
          proposed_by: string
          status: string
          updated_at: string
        }
        Insert: {
          changes: Json
          comment?: string | null
          contract_id: string
          created_at?: string
          document_id: string
          id?: string
          proposed_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          changes?: Json
          comment?: string | null
          contract_id?: string
          created_at?: string
          document_id?: string
          id?: string
          proposed_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_revisions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_revisions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_revisions_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          document_id: string
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_analysis: {
        Row: {
          content: Json
          created_at: string
          document_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          document_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          document_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_analyses_user_id_fkey"
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
      fields: {
        Row: {
          color: string
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
          color: string
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
          color?: string
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
            foreignKeyName: "fields_color_fkey"
            columns: ["color"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["color"]
          },
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
          account_id: string | null
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
          user_id: string
        }
        Insert: {
          account_id?: string | null
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
          user_id: string
        }
        Update: {
          account_id?: string | null
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipients_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
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
            foreignKeyName: "recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      revision_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          revision_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          revision_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          revision_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_comments_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "contract_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      section_changes: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          id: string
          original_text: string
          proposed_text: string
          revision_id: string
          section_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          id?: string
          original_text: string
          proposed_text: string
          revision_id: string
          section_id: string
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          id?: string
          original_text?: string
          proposed_text?: string
          revision_id?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_changes_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "contract_revisions"
            referencedColumns: ["id"]
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
      [_ in never]: never
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
