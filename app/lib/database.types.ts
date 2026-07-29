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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          child_id: string
          id: string
          recorded_at: string
          recorded_by: string
          school_day_id: string
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          child_id: string
          id?: string
          recorded_at?: string
          recorded_by: string
          school_day_id: string
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          child_id?: string
          id?: string
          recorded_at?: string
          recorded_by?: string
          school_day_id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_school_day_id_fkey"
            columns: ["school_day_id"]
            isOneToOne: false
            referencedRelation: "school_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          metadata: Json
          school_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          metadata?: Json
          school_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          metadata?: Json
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          active: boolean
          birth_date: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          school_id: string
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          school_id: string
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_staff: {
        Row: {
          classroom_id: string
          created_at: string
          membership_id: string
          school_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          membership_id: string
          school_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          membership_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_staff_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_staff_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "school_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          active: boolean
          age_group: string | null
          created_at: string
          default_end: string
          default_start: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          active?: boolean
          age_group?: string | null
          created_at?: string
          default_end: string
          default_start: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          active?: boolean
          age_group?: string | null
          created_at?: string
          default_end?: string
          default_start?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_summaries: {
        Row: {
          child_id: string
          created_at: string
          id: string
          narrative: string
          published_at: string
          published_by: string
          school_day_id: string
          school_id: string
          snapshot: Json
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          narrative: string
          published_at: string
          published_by: string
          school_day_id: string
          school_id: string
          snapshot: Json
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          narrative?: string
          published_at?: string
          published_by?: string
          school_day_id?: string
          school_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "daily_summaries_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_summaries_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_summaries_school_day_id_fkey"
            columns: ["school_day_id"]
            isOneToOne: false
            referencedRelation: "school_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_summaries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          child_id: string
          classroom_id: string
          created_at: string
          ends_on: string | null
          expected_end: string
          expected_start: string
          id: string
          schedule_name: string
          school_id: string
          starts_on: string
          status: Database["public"]["Enums"]["enrollment_status"]
          weekdays: number[]
        }
        Insert: {
          child_id: string
          classroom_id: string
          created_at?: string
          ends_on?: string | null
          expected_end: string
          expected_start: string
          id?: string
          schedule_name: string
          school_id: string
          starts_on: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          weekdays?: number[]
        }
        Update: {
          child_id?: string
          classroom_id?: string
          created_at?: string
          ends_on?: string | null
          expected_end?: string
          expected_start?: string
          id?: string
          schedule_name?: string
          school_id?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_links: {
        Row: {
          active: boolean
          can_view_routine: boolean
          child_id: string
          created_at: string
          id: string
          membership_id: string
          relationship: string
          school_id: string
        }
        Insert: {
          active?: boolean
          can_view_routine?: boolean
          child_id: string
          created_at?: string
          id?: string
          membership_id: string
          relationship: string
          school_id: string
        }
        Update: {
          active?: boolean
          can_view_routine?: boolean
          child_id?: string
          created_at?: string
          id?: string
          membership_id?: string
          relationship?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "school_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      routine_configurations: {
        Row: {
          category: Database["public"]["Enums"]["routine_category"]
          classroom_id: string
          enabled: boolean
          id: string
          options: Json
          position: number
          required: boolean
          school_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["routine_category"]
          classroom_id: string
          enabled?: boolean
          id?: string
          options?: Json
          position?: number
          required?: boolean
          school_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["routine_category"]
          classroom_id?: string
          enabled?: boolean
          id?: string
          options?: Json
          position?: number
          required?: boolean
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_configurations_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_configurations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_entries: {
        Row: {
          category: Database["public"]["Enums"]["routine_category"]
          child_id: string
          id: string
          is_exception: boolean
          period_key: string
          recorded_at: string
          recorded_by: string
          school_day_id: string
          school_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: Database["public"]["Enums"]["routine_category"]
          child_id: string
          id?: string
          is_exception?: boolean
          period_key?: string
          recorded_at?: string
          recorded_by: string
          school_day_id: string
          school_id: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: Database["public"]["Enums"]["routine_category"]
          child_id?: string
          id?: string
          is_exception?: boolean
          period_key?: string
          recorded_at?: string
          recorded_by?: string
          school_day_id?: string
          school_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "routine_entries_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_entries_school_day_id_fkey"
            columns: ["school_day_id"]
            isOneToOne: false
            referencedRelation: "school_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_days: {
        Row: {
          classroom_id: string
          created_at: string
          day: string
          id: string
          published_at: string | null
          published_by: string | null
          school_id: string
          status: Database["public"]["Enums"]["day_status"]
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          day: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["day_status"]
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          day?: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["day_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_days_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_days_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_days_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["school_role"]
          school_id: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["school_role"]
          school_id: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["school_role"]
          school_id?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_handoffs: {
        Row: {
          classroom_id: string
          created_at: string
          created_by: string
          from_shift: Database["public"]["Enums"]["shift_key"]
          id: string
          note: string
          resolved_at: string | null
          resolved_by: string | null
          school_day_id: string
          school_id: string
          status: Database["public"]["Enums"]["handoff_status"]
          to_shift: Database["public"]["Enums"]["shift_key"]
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_by: string
          from_shift: Database["public"]["Enums"]["shift_key"]
          id?: string
          note: string
          resolved_at?: string | null
          resolved_by?: string | null
          school_day_id: string
          school_id: string
          status?: Database["public"]["Enums"]["handoff_status"]
          to_shift: Database["public"]["Enums"]["shift_key"]
        }
        Update: {
          classroom_id?: string
          created_at?: string
          created_by?: string
          from_shift?: Database["public"]["Enums"]["shift_key"]
          id?: string
          note?: string
          resolved_at?: string | null
          resolved_by?: string | null
          school_day_id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["handoff_status"]
          to_shift?: Database["public"]["Enums"]["shift_key"]
        }
        Relationships: [
          {
            foreignKeyName: "shift_handoffs_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handoffs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handoffs_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handoffs_school_day_id_fkey"
            columns: ["school_day_id"]
            isOneToOne: false
            referencedRelation: "school_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handoffs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_views: {
        Row: {
          first_viewed_at: string
          id: string
          last_viewed_at: string
          school_id: string
          summary_id: string
          viewer_id: string
        }
        Insert: {
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          school_id: string
          summary_id: string
          viewer_id: string
        }
        Update: {
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          school_id?: string
          summary_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_views_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summary_views_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "daily_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summary_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_child: { Args: { target_child_id: string }; Returns: boolean }
      can_access_classroom: {
        Args: { target_classroom_id: string }
        Returns: boolean
      }
      has_school_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["school_role"][]
          target_school_id: string
        }
        Returns: boolean
      }
      is_active_school_member: {
        Args: { target_school_id: string }
        Returns: boolean
      }
      publish_school_day: {
        Args: { target_day_id: string }
        Returns: undefined
      }
      resolve_shift_handoff: {
        Args: { target_handoff_id: string }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "left_early"
      day_status: "draft" | "ready" | "published"
      enrollment_status: "active" | "inactive"
      handoff_status: "open" | "resolved"
      membership_status: "invited" | "active" | "suspended"
      routine_category:
        | "attendance"
        | "meal"
        | "hydration"
        | "sleep"
        | "hygiene"
        | "activity"
        | "note"
      school_role: "director" | "teacher" | "family"
      shift_key: "morning" | "afternoon"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "left_early"],
      day_status: ["draft", "ready", "published"],
      enrollment_status: ["active", "inactive"],
      handoff_status: ["open", "resolved"],
      membership_status: ["invited", "active", "suspended"],
      routine_category: [
        "attendance",
        "meal",
        "hydration",
        "sleep",
        "hygiene",
        "activity",
        "note",
      ],
      school_role: ["director", "teacher", "family"],
      shift_key: ["morning", "afternoon"],
    },
  },
} as const
