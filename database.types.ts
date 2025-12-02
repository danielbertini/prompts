export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_execution_logs: {
        Row: {
          company_id: string | null
          completion_tokens: number | null
          created_at: string | null
          customer_id: string | null
          execution_id: string | null
          id: string
          model_name: string
          prompt_tokens: number | null
          success: boolean | null
          timestamp: string | null
          total_tokens: number | null
        }
        Insert: {
          company_id?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          customer_id?: string | null
          execution_id?: string | null
          id?: string
          model_name: string
          prompt_tokens?: number | null
          success?: boolean | null
          timestamp?: string | null
          total_tokens?: number | null
        }
        Update: {
          company_id?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          customer_id?: string | null
          execution_id?: string | null
          id?: string
          model_name?: string
          prompt_tokens?: number | null
          success?: boolean | null
          timestamp?: string | null
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_execution_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborator_x_service_x_location: {
        Row: {
          colaborator_id: string
          company_id: string
          location_id: string
          service_id: string
        }
        Insert: {
          colaborator_id: string
          company_id: string
          location_id: string
          service_id: string
        }
        Update: {
          colaborator_id?: string
          company_id?: string
          location_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborator_x_service_x_location_colaborator_id_fkey"
            columns: ["colaborator_id"]
            isOneToOne: false
            referencedRelation: "colaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborator_x_service_x_location_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborator_x_service_x_location_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborator_x_service_x_location_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "company_services"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborators: {
        Row: {
          active: boolean | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          about: string | null
          created_at: string
          id: string
          name: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          token_balance: number | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          id?: string
          name?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          token_balance?: number | null
        }
        Update: {
          about?: string | null
          created_at?: string
          id?: string
          name?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          token_balance?: number | null
        }
        Relationships: []
      }
      company_locations: {
        Row: {
          address: Json | null
          company_id: string | null
          complement: string | null
          created_at: string
          id: string
          name: string | null
          parking: boolean
          phone: string | null
        }
        Insert: {
          address?: Json | null
          company_id?: string | null
          complement?: string | null
          created_at?: string
          id?: string
          name?: string | null
          parking?: boolean
          phone?: string | null
        }
        Update: {
          address?: Json | null
          company_id?: string | null
          complement?: string | null
          created_at?: string
          id?: string
          name?: string | null
          parking?: boolean
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_phones: {
        Row: {
          company_id: string
          created_at: string | null
          display_name: string | null
          evolution_apikey: string | null
          id: string
          instance_id: string | null
          instance_name: string
          last_connection_at: string | null
          phone_number: string | null
          profile_name: string | null
          profile_picture_url: string | null
          settings: Json | null
          status: string | null
          updated_at: string | null
          webhook_events: string[] | null
          webhook_url: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          display_name?: string | null
          evolution_apikey?: string | null
          id?: string
          instance_id?: string | null
          instance_name: string
          last_connection_at?: string | null
          phone_number?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          display_name?: string | null
          evolution_apikey?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string
          last_connection_at?: string | null
          phone_number?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_phones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_products: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          title: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_services: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean
          name: string | null
          price: string | null
          price_on_request: boolean
          price_starting_from: boolean
          recurrence_type: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name?: string | null
          price?: string | null
          price_on_request?: boolean
          price_starting_from?: boolean
          recurrence_type?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name?: string | null
          price?: string | null
          price_on_request?: boolean
          price_starting_from?: boolean
          recurrence_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_memories: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          memory: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          memory?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          memory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_memories_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_messages: {
        Row: {
          created_at: string
          customer_id: string | null
          from: string | null
          id: string
          isBuffer: boolean | null
          message: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          from?: string | null
          id?: string
          isBuffer?: boolean | null
          message?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          from?: string | null
          id?: string
          isBuffer?: boolean | null
          message?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthdate: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          isBusiness: boolean | null
          last_message: string | null
          name: string | null
          picture: string | null
          session_id: string
        }
        Insert: {
          birthdate?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          isBusiness?: boolean | null
          last_message?: string | null
          name?: string | null
          picture?: string | null
          session_id: string
        }
        Update: {
          birthdate?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          isBusiness?: boolean | null
          last_message?: string | null
          name?: string | null
          picture?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          colaborator_id: string | null
          company_id: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          event_date: string | null
          id: string
          location_id: string | null
          service_id: string | null
          title: string | null
        }
        Insert: {
          colaborator_id?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          location_id?: string | null
          service_id?: string | null
          title?: string | null
        }
        Update: {
          colaborator_id?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          location_id?: string | null
          service_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_colaborator_id_fkey"
            columns: ["colaborator_id"]
            isOneToOne: false
            referencedRelation: "colaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "company_services"
            referencedColumns: ["id"]
          },
        ]
      }
      human_in_the_loop: {
        Row: {
          created_at: string
          id: string
          remote_jid: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          remote_jid?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          remote_jid?: string | null
        }
        Relationships: []
      }
      message_blocker: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_blocker_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      message_buffer: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          message: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          message?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          created_at: string | null
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          background: string | null
          bio: string | null
          company_id: string | null
          created_at: string
          email: string | null
          fullname: string | null
          id: string
          picture: string | null
          username: string | null
        }
        Insert: {
          background?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          fullname?: string | null
          id: string
          picture?: string | null
          username?: string | null
        }
        Update: {
          background?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          fullname?: string | null
          id?: string
          picture?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_availability_by_colaborator: {
        Args: {
          p_colaborator_id: string
          p_company_id: string
          p_event_date: string
          p_location_id?: string
        }
        Returns: {
          colaborator_id: string
          customer_id: string
          event_date: string
          event_end: string
          id: string
          location_id: string
          service_id: string
        }[]
      }
      get_company_by_phone_number: {
        Args: { p_phone_number: string }
        Returns: Json
      }
      get_customer_context: {
        Args: { p_company_id: string; p_session_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
