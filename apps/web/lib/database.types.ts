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
      accounts: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          picture_url: string | null
          public_data: Json
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          picture_url?: string | null
          public_data?: Json
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          picture_url?: string | null
          public_data?: Json
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          account_id: string
          api_key: string | null
          auth_type: string
          auto_provision: boolean
          category: string
          created_at: string
          created_by: string
          default_user_role: string | null
          description: string | null
          documentation: string | null
          enabled: boolean
          health_check_interval: number
          icon: string | null
          id: string
          last_health_check: string | null
          name: string
          requires_auth: boolean
          service_key: string
          service_type: string
          ssl_enabled: boolean
          status: string
          supports_user_provisioning: boolean
          tags: string[] | null
          updated_at: string
          updated_by: string
          url: string
          user_provisioning_config: Json | null
          version: string | null
        }
        Insert: {
          account_id: string
          api_key?: string | null
          auth_type?: string
          auto_provision?: boolean
          category: string
          created_at?: string
          created_by: string
          default_user_role?: string | null
          description?: string | null
          documentation?: string | null
          enabled?: boolean
          health_check_interval?: number
          icon?: string | null
          id?: string
          last_health_check?: string | null
          name: string
          requires_auth?: boolean
          service_key: string
          service_type: string
          ssl_enabled?: boolean
          status?: string
          supports_user_provisioning?: boolean
          tags?: string[] | null
          updated_at?: string
          updated_by: string
          url: string
          user_provisioning_config?: Json | null
          version?: string | null
        }
        Update: {
          account_id?: string
          api_key?: string | null
          auth_type?: string
          auto_provision?: boolean
          category?: string
          created_at?: string
          created_by?: string
          default_user_role?: string | null
          description?: string | null
          documentation?: string | null
          enabled?: boolean
          health_check_interval?: number
          icon?: string | null
          id?: string
          last_health_check?: string | null
          name?: string
          requires_auth?: boolean
          service_key?: string
          service_type?: string
          ssl_enabled?: boolean
          status?: string
          supports_user_provisioning?: boolean
          tags?: string[] | null
          updated_at?: string
          updated_by?: string
          url?: string
          user_provisioning_config?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_account: {
        Args: { account_id: string; admin_user_id: string }
        Returns: undefined
      }
      get_approval_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_approved_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          email: string
          requested_at: string
          approval_status: string
          approved_at: string
          approved_by: string
          picture_url: string
          email_confirmed_at: string
          last_sign_in_at: string
          approved_by_email: string
        }[]
      }
      get_pending_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          email: string
          requested_at: string
          approval_status: string
          picture_url: string
          email_confirmed_at: string
          last_sign_in_at: string
        }[]
      }
      get_user_approval_status: {
        Args: { user_id: string }
        Returns: Json
      }
      reject_account: {
        Args: { account_id: string; admin_user_id: string; reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

