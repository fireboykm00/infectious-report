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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          target_id: string | null
          target_type: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_type: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_type?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      case_reports: {
        Row: {
          age_group: string
          attachments: Json | null
          client_local_id: string | null
          created_at: string | null
          disease_code: string
          district_id: string | null
          facility_id: string | null
          gender: string
          id: string
          location_detail: string | null
          notes: string | null
          report_date: string
          reporter_id: string
          status: Database["public"]["Enums"]["case_status"] | null
          symptoms: string
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          age_group: string
          attachments?: Json | null
          client_local_id?: string | null
          created_at?: string | null
          disease_code: string
          district_id?: string | null
          facility_id?: string | null
          gender: string
          id?: string
          location_detail?: string | null
          notes?: string | null
          report_date?: string
          reporter_id: string
          status?: Database["public"]["Enums"]["case_status"] | null
          symptoms: string
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string
          attachments?: Json | null
          client_local_id?: string | null
          created_at?: string | null
          disease_code?: string
          district_id?: string | null
          facility_id?: string | null
          gender?: string
          id?: string
          location_detail?: string | null
          notes?: string | null
          report_date?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["case_status"] | null
          symptoms?: string
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_reports_disease_code_fkey"
            columns: ["disease_code"]
            isOneToOne: false
            referencedRelation: "disease_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "case_reports_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_reports_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_codes: {
        Row: {
          alert_threshold: number | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_notifiable: boolean | null
          name: string
          threshold_days: number | null
        }
        Insert: {
          alert_threshold?: number | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_notifiable?: boolean | null
          name: string
          threshold_days?: number | null
        }
        Update: {
          alert_threshold?: number | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_notifiable?: boolean | null
          name?: string
          threshold_days?: number | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          population: number | null
          province: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          population?: number | null
          province?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          population?: number | null
          province?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          district_id: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          attachments: Json | null
          case_report_id: string
          created_at: string | null
          id: string
          lab_facility_id: string | null
          lab_technician_id: string
          notes: string | null
          result: Database["public"]["Enums"]["lab_result"]
          test_type: string
          tested_at: string
        }
        Insert: {
          attachments?: Json | null
          case_report_id: string
          created_at?: string | null
          id?: string
          lab_facility_id?: string | null
          lab_technician_id: string
          notes?: string | null
          result: Database["public"]["Enums"]["lab_result"]
          test_type: string
          tested_at: string
        }
        Update: {
          attachments?: Json | null
          case_report_id?: string
          created_at?: string | null
          id?: string
          lab_facility_id?: string | null
          lab_technician_id?: string
          notes?: string | null
          result?: Database["public"]["Enums"]["lab_result"]
          test_type?: string
          tested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_case_report_id_fkey"
            columns: ["case_report_id"]
            isOneToOne: false
            referencedRelation: "case_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_lab_facility_id_fkey"
            columns: ["lab_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          error_message: string | null
          id: string
          message: string
          payload: Json | null
          recipient_email: string | null
          recipient_phone: string | null
          recipient_user_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          subject: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          payload?: Json | null
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          payload?: Json | null
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
        }
        Relationships: []
      }
      outbreaks: {
        Row: {
          affected_districts: string[] | null
          case_count: number | null
          created_at: string | null
          declared_by: string | null
          disease_code: string
          end_date: string | null
          id: string
          response_actions: Json | null
          start_date: string
          status: Database["public"]["Enums"]["outbreak_status"] | null
          updated_at: string | null
        }
        Insert: {
          affected_districts?: string[] | null
          case_count?: number | null
          created_at?: string | null
          declared_by?: string | null
          disease_code: string
          end_date?: string | null
          id?: string
          response_actions?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["outbreak_status"] | null
          updated_at?: string | null
        }
        Update: {
          affected_districts?: string[] | null
          case_count?: number | null
          created_at?: string | null
          declared_by?: string | null
          disease_code?: string
          end_date?: string | null
          id?: string
          response_actions?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["outbreak_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbreaks_disease_code_fkey"
            columns: ["disease_code"]
            isOneToOne: false
            referencedRelation: "disease_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          facility_id: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          facility_id?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          facility_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "reporter"
        | "lab_tech"
        | "district_officer"
        | "national_officer"
        | "admin"
      case_status: "suspected" | "confirmed" | "ruled_out" | "pending_lab"
      lab_result: "positive" | "negative" | "inconclusive"
      notification_channel: "email" | "sms" | "push"
      notification_status: "pending" | "sent" | "failed"
      outbreak_status: "active" | "contained" | "resolved"
      sync_status: "pending" | "syncing" | "synced" | "failed"
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
      app_role: [
        "reporter",
        "lab_tech",
        "district_officer",
        "national_officer",
        "admin",
      ],
      case_status: ["suspected", "confirmed", "ruled_out", "pending_lab"],
      lab_result: ["positive", "negative", "inconclusive"],
      notification_channel: ["email", "sms", "push"],
      notification_status: ["pending", "sent", "failed"],
      outbreak_status: ["active", "contained", "resolved"],
      sync_status: ["pending", "syncing", "synced", "failed"],
    },
  },
} as const
