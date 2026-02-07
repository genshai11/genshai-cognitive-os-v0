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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advisor_skills: {
        Row: {
          advisor_id: string
          category: string
          code: string
          created_at: string
          description: string
          examples: Json
          id: string
          input_schema: Json
          language: string
          last_used_at: string | null
          mental_model: string | null
          output_schema: Json
          skill_id: string
          skill_name: string
          status: string
          times_used: number
          updated_at: string
          use_cases: string[]
          user_id: string
        }
        Insert: {
          advisor_id: string
          category: string
          code: string
          created_at?: string
          description: string
          examples?: Json
          id?: string
          input_schema?: Json
          language?: string
          last_used_at?: string | null
          mental_model?: string | null
          output_schema?: Json
          skill_id: string
          skill_name: string
          status?: string
          times_used?: number
          updated_at?: string
          use_cases?: string[]
          user_id: string
        }
        Update: {
          advisor_id?: string
          category?: string
          code?: string
          created_at?: string
          description?: string
          examples?: Json
          id?: string
          input_schema?: Json
          language?: string
          last_used_at?: string | null
          mental_model?: string | null
          output_schema?: Json
          skill_id?: string
          skill_name?: string
          status?: string
          times_used?: number
          updated_at?: string
          use_cases?: string[]
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          advisor_id: string
          advisor_type: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advisor_id: string
          advisor_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advisor_id?: string
          advisor_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_books: {
        Row: {
          author: string
          color: string | null
          cover_emoji: string | null
          created_at: string
          description: string | null
          genres: string[] | null
          id: string
          is_active: boolean | null
          key_concepts: string[] | null
          language: string | null
          system_prompt: string
          title: string
          updated_at: string
          wiki_url: string | null
        }
        Insert: {
          author: string
          color?: string | null
          cover_emoji?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id: string
          is_active?: boolean | null
          key_concepts?: string[] | null
          language?: string | null
          system_prompt: string
          title: string
          updated_at?: string
          wiki_url?: string | null
        }
        Update: {
          author?: string
          color?: string | null
          cover_emoji?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          key_concepts?: string[] | null
          language?: string | null
          system_prompt?: string
          title?: string
          updated_at?: string
          wiki_url?: string | null
        }
        Relationships: []
      }
      custom_frameworks: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          example_questions: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          mental_models: string[] | null
          name: string
          system_prompt: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          example_questions?: string[] | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          mental_models?: string[] | null
          name: string
          system_prompt: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          example_questions?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          mental_models?: string[] | null
          name?: string
          system_prompt?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_personas: {
        Row: {
          avatar: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          response_style: string | null
          source_type: string | null
          system_prompt: string
          tags: string[] | null
          title: string
          updated_at: string
          wiki_url: string | null
        }
        Insert: {
          avatar?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          response_style?: string | null
          source_type?: string | null
          system_prompt: string
          tags?: string[] | null
          title: string
          updated_at?: string
          wiki_url?: string | null
        }
        Update: {
          avatar?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          response_style?: string | null
          source_type?: string | null
          system_prompt?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          wiki_url?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      response_style_analytics: {
        Row: {
          confidence_score: number
          created_at: string
          current_preference: string | null
          detected_style: string
          final_style_used: string | null
          id: string
          message_count: number
          user_id: string
          was_auto_updated: boolean | null
        }
        Insert: {
          confidence_score: number
          created_at?: string
          current_preference?: string | null
          detected_style: string
          final_style_used?: string | null
          id?: string
          message_count: number
          user_id: string
          was_auto_updated?: boolean | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          current_preference?: string | null
          detected_style?: string
          final_style_used?: string | null
          id?: string
          message_count?: number
          user_id?: string
          was_auto_updated?: boolean | null
        }
        Relationships: []
      }
      skill_executions: {
        Row: {
          cached: boolean
          conversation_id: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input: Json | null
          output: Json | null
          skill_id: string
          success: boolean
          user_id: string
        }
        Insert: {
          cached?: boolean
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input?: Json | null
          output?: Json | null
          skill_id: string
          success?: boolean
          user_id: string
        }
        Update: {
          cached?: boolean
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input?: Json | null
          output?: Json | null
          skill_id?: string
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_executions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "advisor_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_versions: {
        Row: {
          change_summary: string | null
          code: string
          created_at: string
          id: string
          input_schema: Json
          output_schema: Json
          skill_id: string
          version: number
        }
        Insert: {
          change_summary?: string | null
          code: string
          created_at?: string
          id?: string
          input_schema?: Json
          output_schema?: Json
          skill_id: string
          version?: number
        }
        Update: {
          change_summary?: string | null
          code?: string
          created_at?: string
          id?: string
          input_schema?: Json
          output_schema?: Json
          skill_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_versions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "advisor_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          advisor_id: string
          advisor_type: string
          created_at: string
          id: string
          interaction_count: number | null
          last_interaction: string
          topics: string[] | null
          user_id: string
        }
        Insert: {
          advisor_id: string
          advisor_type: string
          created_at?: string
          id?: string
          interaction_count?: number | null
          last_interaction?: string
          topics?: string[] | null
          user_id: string
        }
        Update: {
          advisor_id?: string
          advisor_type?: string
          created_at?: string
          id?: string
          interaction_count?: number | null
          last_interaction?: string
          topics?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          adaptive_style_enabled: boolean | null
          bio: string | null
          career_stage: string | null
          challenges: string[] | null
          created_at: string
          display_name: string | null
          emoji_usage: string | null
          formality_level: string | null
          goals: string[] | null
          id: string
          industry: string | null
          interests: string[] | null
          language_complexity: string | null
          learning_style: string | null
          onboarding_completed: boolean | null
          preferred_response_style: string | null
          preferred_theme: string | null
          updated_at: string
          user_id: string
          values: string[] | null
        }
        Insert: {
          adaptive_style_enabled?: boolean | null
          bio?: string | null
          career_stage?: string | null
          challenges?: string[] | null
          created_at?: string
          display_name?: string | null
          emoji_usage?: string | null
          formality_level?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          interests?: string[] | null
          language_complexity?: string | null
          learning_style?: string | null
          onboarding_completed?: boolean | null
          preferred_response_style?: string | null
          preferred_theme?: string | null
          updated_at?: string
          user_id: string
          values?: string[] | null
        }
        Update: {
          adaptive_style_enabled?: boolean | null
          bio?: string | null
          career_stage?: string | null
          challenges?: string[] | null
          created_at?: string
          display_name?: string | null
          emoji_usage?: string | null
          formality_level?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          interests?: string[] | null
          language_complexity?: string | null
          learning_style?: string | null
          onboarding_completed?: boolean | null
          preferred_response_style?: string | null
          preferred_theme?: string | null
          updated_at?: string
          user_id?: string
          values?: string[] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_skill_usage: {
        Args: { p_skill_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
