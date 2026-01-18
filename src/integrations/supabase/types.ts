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
      concept_maps: {
        Row: {
          created_at: string | null
          edges: Json
          id: string
          material_id: string
          nodes: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          edges: Json
          id?: string
          material_id: string
          nodes: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          edges?: Json
          id?: string
          material_id?: string
          nodes?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_maps_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_decks: {
        Row: {
          card_count: number | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          note_id: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          note_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          note_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          ease_factor: number | null
          front: string
          hint: string | null
          id: string
          interval_days: number | null
          next_review: string | null
          repetitions: number | null
          updated_at: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          ease_factor?: number | null
          front: string
          hint?: string | null
          id?: string
          interval_days?: number | null
          next_review?: string | null
          repetitions?: number | null
          updated_at?: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          ease_factor?: number | null
          front?: string
          hint?: string | null
          id?: string
          interval_days?: number | null
          next_review?: string | null
          repetitions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          group_id: string
          id: string
          invite_code: string
          max_uses: number | null
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          group_id: string
          id?: string
          invite_code: string
          max_uses?: number | null
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          group_id?: string
          id?: string
          invite_code?: string
          max_uses?: number | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          message_id: string
          mime_type: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          message_id: string
          mime_type?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          message_id?: string
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reads: {
        Row: {
          group_id: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reads_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      material_flashcards: {
        Row: {
          back: string
          created_at: string | null
          difficulty: string | null
          front: string
          hint: string | null
          id: string
          material_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string | null
          difficulty?: string | null
          front: string
          hint?: string | null
          id?: string
          material_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string | null
          difficulty?: string | null
          front?: string
          hint?: string | null
          id?: string
          material_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_flashcards_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      note_attachments: {
        Row: {
          bucket_id: string
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          note_id: string
          object_path: string
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          bucket_id?: string
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          note_id: string
          object_path: string
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          note_id?: string
          object_path?: string
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          note_id: string
          tag_id: string
        }
        Insert: {
          note_id: string
          tag_id: string
        }
        Update: {
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          folder_id: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          explanation: string | null
          id: string
          material_id: string
          options: Json | null
          question: string
          question_type: string
          user_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          material_id: string
          options?: Json | null
          question: string
          question_type: string
          user_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          material_id?: string
          options?: Json | null
          question?: string
          question_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_questions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_study_minutes: number | null
          full_name: string | null
          id: string
          notification_enabled: boolean | null
          preferred_study_time: string | null
          study_goal: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_study_minutes?: number | null
          full_name?: string | null
          id?: string
          notification_enabled?: boolean | null
          preferred_study_time?: string | null
          study_goal?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_study_minutes?: number | null
          full_name?: string | null
          id?: string
          notification_enabled?: boolean | null
          preferred_study_time?: string | null
          study_goal?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_notes: {
        Row: {
          group_id: string
          id: string
          note_id: string
          shared_at: string
          shared_by: string
        }
        Insert: {
          group_id: string
          id?: string
          note_id: string
          shared_at?: string
          shared_by: string
        }
        Update: {
          group_id?: string
          id?: string
          note_id?: string
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_notes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string | null
          extracted_content: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          folder_id: string | null
          generate_concept_map: boolean | null
          generate_flashcards: boolean | null
          generate_questions: boolean | null
          generate_tutor_notes: boolean | null
          id: string
          language: string | null
          processing_error: string | null
          processing_status: string | null
          subject: string | null
          title: string
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          extracted_content?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          generate_concept_map?: boolean | null
          generate_flashcards?: boolean | null
          generate_questions?: boolean | null
          generate_tutor_notes?: boolean | null
          id?: string
          language?: string | null
          processing_error?: string | null
          processing_status?: string | null
          subject?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          extracted_content?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          generate_concept_map?: boolean | null
          generate_flashcards?: boolean | null
          generate_questions?: boolean | null
          generate_tutor_notes?: boolean | null
          id?: string
          language?: string | null
          processing_error?: string | null
          processing_status?: string | null
          subject?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          cards_studied: number | null
          correct_count: number | null
          created_at: string
          deck_id: string | null
          ended_at: string | null
          id: string
          started_at: string
          total_time_seconds: number | null
          user_id: string
        }
        Insert: {
          cards_studied?: number | null
          correct_count?: number | null
          created_at?: string
          deck_id?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string
          total_time_seconds?: number | null
          user_id: string
        }
        Update: {
          cards_studied?: number | null
          correct_count?: number | null
          created_at?: string
          deck_id?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string
          total_time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          cancelled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paystack_customer_code: string | null
          paystack_email_token: string | null
          paystack_subscription_code: string | null
          plan: string
          plan_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan?: string
          plan_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan?: string
          plan_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          content: string
          created_at: string | null
          id: string
          material_id: string
          summary_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          material_id: string
          summary_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          material_id?: string
          summary_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_notes: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          material_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          material_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          material_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_notes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
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
      get_group_unread_count: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: number
      }
      get_user_plan: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
