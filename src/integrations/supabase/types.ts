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
  public: {
    Tables: {
      appointment_payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          id: string
          method: string | null
          note: string | null
          paid_at: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_services: {
        Row: {
          appointment_id: string
          deleted_at: string | null
          mechanic_payout: number
          price: number
          service_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          deleted_at?: string | null
          mechanic_payout?: number
          price: number
          service_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          deleted_at?: string | null
          mechanic_payout?: number
          price?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          car_id: string
          comment: string | null
          created_at: string
          deleted_at: string | null
          duration_minutes: number
          id: string
          mechanic_id: string | null
          mileage: number | null
          paid_amount: number
          payment_status: string
          starts_at: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          car_id: string
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          mechanic_id?: string | null
          mileage?: number | null
          paid_amount?: number
          payment_status?: string
          starts_at: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          car_id?: string
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          mechanic_id?: string | null
          mileage?: number | null
          paid_amount?: number
          payment_status?: string
          starts_at?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      car_catalog_models: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      car_catalog_modifications: {
        Row: {
          body_code: string | null
          chassis_code: string | null
          created_at: string
          displacement_cc: number | null
          engine_code: string | null
          fuel: string | null
          horsepower: number | null
          hybrid: boolean
          id: string
          model_id: string
          note: string | null
          raw: string
          source: string
          steering: string | null
          updated_at: string
          year: number
        }
        Insert: {
          body_code?: string | null
          chassis_code?: string | null
          created_at?: string
          displacement_cc?: number | null
          engine_code?: string | null
          fuel?: string | null
          horsepower?: number | null
          hybrid?: boolean
          id?: string
          model_id: string
          note?: string | null
          raw?: string
          source?: string
          steering?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          body_code?: string | null
          chassis_code?: string | null
          created_at?: string
          displacement_cc?: number | null
          engine_code?: string | null
          fuel?: string | null
          horsepower?: number | null
          hybrid?: boolean
          id?: string
          model_id?: string
          note?: string | null
          raw?: string
          source?: string
          steering?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_catalog_modifications_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_catalog_models"
            referencedColumns: ["id"]
          },
        ]
      }
      car_custom_services: {
        Row: {
          brand_name: string
          category: string
          created_at: string
          duration_minutes: number
          id: string
          model_name: string
          name: string
          price: number
          updated_at: string
          year: number
        }
        Insert: {
          brand_name: string
          category: string
          created_at?: string
          duration_minutes?: number
          id?: string
          model_name: string
          name: string
          price?: number
          updated_at?: string
          year: number
        }
        Update: {
          brand_name?: string
          category?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          model_name?: string
          name?: string
          price?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      car_models: {
        Row: {
          brand_id: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          tier: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          tier?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          brand_id: string | null
          client_id: string
          color: string | null
          created_at: string
          deleted_at: string | null
          drive_type: string | null
          engine_power: number | null
          engine_volume: number | null
          id: string
          license_plate: string | null
          mileage: number | null
          model: string
          model_id: string | null
          transmission: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          brand_id?: string | null
          client_id: string
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          drive_type?: string | null
          engine_power?: number | null
          engine_volume?: number | null
          id?: string
          license_plate?: string | null
          mileage?: number | null
          model: string
          model_id?: string | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          drive_type?: string | null
          engine_power?: number | null
          engine_volume?: number | null
          id?: string
          license_plate?: string | null
          mileage?: number | null
          model?: string
          model_id?: string | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
        ]
      }
      client_comments: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reminders: {
        Row: {
          client_id: string
          created_at: string
          done_at: string | null
          id: string
          interval_kind: string
          note: string | null
          remind_at: string
          repeat: boolean
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          done_at?: string | null
          id?: string
          interval_kind?: string
          note?: string | null
          remind_at: string
          repeat?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          done_at?: string | null
          id?: string
          interval_kind?: string
          note?: string | null
          remind_at?: string
          repeat?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          birthday: string | null
          category: string
          created_at: string
          custom_fields: Json
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          is_archived: boolean
          note: string | null
          phone: string | null
          telegram: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          category?: string
          created_at?: string
          custom_fields?: Json
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_archived?: boolean
          note?: string | null
          phone?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birthday?: string | null
          category?: string
          created_at?: string
          custom_fields?: Json
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_archived?: boolean
          note?: string | null
          phone?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          spent_at: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          spent_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          spent_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mechanic_advances: {
        Row: {
          amount: number
          created_at: string
          id: string
          mechanic_id: string
          note: string | null
          paid_at: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          mechanic_id: string
          note?: string | null
          paid_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mechanic_id?: string
          note?: string | null
          paid_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_advances_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_service_rates: {
        Row: {
          amount: number
          created_at: string
          id: string
          mechanic_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          mechanic_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mechanic_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_service_rates_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_service_rates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_shifts: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          mechanic_id: string
          note: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          mechanic_id: string
          note?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          mechanic_id?: string
          note?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_shifts_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          color: string
          created_at: string
          default_payout_percent: number
          deleted_at: string | null
          full_name: string
          id: string
          phone: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          default_payout_percent?: number
          deleted_at?: string | null
          full_name: string
          id?: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          default_payout_percent?: number
          deleted_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          brand_id: string
          deleted_at: string | null
          price: number
          service_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          deleted_at?: string | null
          price: number
          service_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          deleted_at?: string | null
          price?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_usage_stats: {
        Row: {
          count: number
          created_at: string
          last_used_at: string
          service_id: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          last_used_at?: string
          service_id: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          last_used_at?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_usage_stats_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          category: string
          created_at: string
          default_payout_percent: number
          deleted_at: string | null
          duration_minutes: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category: string
          created_at?: string
          default_payout_percent?: number
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          default_payout_percent?: number
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          updated_at?: string
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
