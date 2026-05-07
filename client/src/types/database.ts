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
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          shop_id: string
          tax_id: string | null
          tax_id_type: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          shop_id: string
          tax_id?: string | null
          tax_id_type?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          shop_id?: string
          tax_id?: string | null
          tax_id_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid_minor: number
          compliance_accepted_at: string | null
          compliance_data: Json
          compliance_doc_id: string | null
          compliance_provider: Database["public"]["Enums"]["compliance_provider"]
          compliance_qr_url: string | null
          compliance_status: Database["public"]["Enums"]["compliance_status"]
          compliance_submitted_at: string | null
          compliance_xml_storage_path: string | null
          country_code: Database["public"]["Enums"]["country_code"]
          created_at: string
          currency: string
          due_at: string | null
          generated_at: string
          id: string
          invoice_number: number
          pdf_storage_path: string | null
          repair_order_id: string
          shop_id: string
          subtotal_minor: number
          tax_minor: number
          total_minor: number
          updated_at: string
        }
        Insert: {
          amount_paid_minor?: number
          compliance_accepted_at?: string | null
          compliance_data?: Json
          compliance_doc_id?: string | null
          compliance_provider?: Database["public"]["Enums"]["compliance_provider"]
          compliance_qr_url?: string | null
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          compliance_submitted_at?: string | null
          compliance_xml_storage_path?: string | null
          country_code: Database["public"]["Enums"]["country_code"]
          created_at?: string
          currency: string
          due_at?: string | null
          generated_at?: string
          id?: string
          invoice_number: number
          pdf_storage_path?: string | null
          repair_order_id: string
          shop_id: string
          subtotal_minor: number
          tax_minor: number
          total_minor: number
          updated_at?: string
        }
        Update: {
          amount_paid_minor?: number
          compliance_accepted_at?: string | null
          compliance_data?: Json
          compliance_doc_id?: string | null
          compliance_provider?: Database["public"]["Enums"]["compliance_provider"]
          compliance_qr_url?: string | null
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          compliance_submitted_at?: string | null
          compliance_xml_storage_path?: string | null
          country_code?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          currency?: string
          due_at?: string | null
          generated_at?: string
          id?: string
          invoice_number?: number
          pdf_storage_path?: string | null
          repair_order_id?: string
          shop_id?: string
          subtotal_minor?: number
          tax_minor?: number
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: true
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          position: number
          qty: number
          repair_order_id: string
          taxable: boolean
          type: Database["public"]["Enums"]["line_item_type"]
          unit_price_minor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          position?: number
          qty?: number
          repair_order_id: string
          taxable?: boolean
          type: Database["public"]["Enums"]["line_item_type"]
          unit_price_minor: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          position?: number
          qty?: number
          repair_order_id?: string
          taxable?: boolean
          type?: Database["public"]["Enums"]["line_item_type"]
          unit_price_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_items_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          invoice_id: string
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_charge_id: string | null
          provider_payment_id: string | null
          refunded_amount_minor: number
          shop_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency: string
          failure_reason?: string | null
          id?: string
          invoice_id: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_charge_id?: string | null
          provider_payment_id?: string | null
          refunded_amount_minor?: number
          shop_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_charge_id?: string | null
          provider_payment_id?: string | null
          refunded_amount_minor?: number
          shop_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_orders: {
        Row: {
          approved_at: string | null
          complaint: string | null
          completed_at: string | null
          country_code: Database["public"]["Enums"]["country_code"] | null
          created_at: string
          currency: string | null
          customer_id: string
          decline_reason: string | null
          declined_at: string | null
          deleted_at: string | null
          id: string
          internal_notes: string | null
          odometer_in: number | null
          odometer_out: number | null
          public_token: string
          ro_number: number
          shop_id: string
          status: Database["public"]["Enums"]["repair_order_status"]
          subtotal_minor: number
          tax_minor: number
          tax_rate: number | null
          total_minor: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          approved_at?: string | null
          complaint?: string | null
          completed_at?: string | null
          country_code?: Database["public"]["Enums"]["country_code"] | null
          created_at?: string
          currency?: string | null
          customer_id: string
          decline_reason?: string | null
          declined_at?: string | null
          deleted_at?: string | null
          id?: string
          internal_notes?: string | null
          odometer_in?: number | null
          odometer_out?: number | null
          public_token?: string
          ro_number: number
          shop_id: string
          status?: Database["public"]["Enums"]["repair_order_status"]
          subtotal_minor?: number
          tax_minor?: number
          tax_rate?: number | null
          total_minor?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          approved_at?: string | null
          complaint?: string | null
          completed_at?: string | null
          country_code?: Database["public"]["Enums"]["country_code"] | null
          created_at?: string
          currency?: string | null
          customer_id?: string
          decline_reason?: string | null
          declined_at?: string | null
          deleted_at?: string | null
          id?: string
          internal_notes?: string | null
          odometer_in?: number | null
          odometer_out?: number | null
          public_token?: string
          ro_number?: number
          shop_id?: string
          status?: Database["public"]["Enums"]["repair_order_status"]
          subtotal_minor?: number
          tax_minor?: number
          tax_rate?: number | null
          total_minor?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_memberships_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country_code: Database["public"]["Enums"]["country_code"]
          created_at: string
          currency: string
          default_tax_rate: number
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          region: string | null
          tax_id: string | null
          tax_id_type: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country_code?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          currency?: string
          default_tax_rate?: number
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          tax_id?: string | null
          tax_id_type?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country_code?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          currency?: string
          default_tax_rate?: number
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          tax_id?: string | null
          tax_id_type?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_ownerships: {
        Row: {
          created_at: string
          customer_id: string
          ended_at: string | null
          id: string
          started_at: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_ownerships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_ownerships_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          current_customer_id: string | null
          deleted_at: string | null
          id: string
          license_plate: string | null
          make: string | null
          model: string | null
          notes: string | null
          shop_id: string
          soat_expires_at: string | null
          tecnicomecanica_expires_at: string | null
          trim: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          current_customer_id?: string | null
          deleted_at?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          shop_id: string
          soat_expires_at?: string | null
          tecnicomecanica_expires_at?: string | null
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          current_customer_id?: string | null
          deleted_at?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          shop_id?: string
          soat_expires_at?: string | null
          tecnicomecanica_expires_at?: string | null
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_current_customer_id_fkey"
            columns: ["current_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_repair_order_by_token: {
        Args: { p_token: string }
        Returns: boolean
      }
      create_shop_for_owner: {
        Args: {
          p_country_code?: Database["public"]["Enums"]["country_code"]
          p_currency?: string
          p_name: string
          p_tax_rate?: number
          p_timezone?: string
        }
        Returns: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country_code: Database["public"]["Enums"]["country_code"]
          created_at: string
          currency: string
          default_tax_rate: number
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          region: string | null
          tax_id: string | null
          tax_id_type: string | null
          timezone: string
          updated_at: string
        }
      }
      current_user_shop_ids: { Args: never; Returns: string[] }
      decline_repair_order_by_token: {
        Args: { p_reason: string; p_token: string }
        Returns: boolean
      }
      get_repair_order_by_token: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      compliance_provider:
        | "none"
        | "alegra"
        | "siigo"
        | "loggro"
        | "finkok"
        | "edicom"
        | "facturama"
        | "haulmer"
        | "nubox"
        | "openfactura"
      compliance_status:
        | "not_required"
        | "pending"
        | "submitted"
        | "accepted"
        | "rejected"
      country_code: "US" | "MX" | "CL" | "CO"
      line_item_type: "labor" | "part"
      payment_method:
        | "card"
        | "cash"
        | "check"
        | "ach"
        | "pse"
        | "transfer"
        | "other"
      payment_provider:
        | "manual"
        | "stripe"
        | "wompi"
        | "payu"
        | "mercado_pago"
        | "culqi"
        | "other"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
        | "partially_refunded"
      repair_order_status:
        | "draft"
        | "pending"
        | "approved"
        | "in_progress"
        | "completed"
        | "declined"
        | "cancelled"
      shop_role: "owner" | "tech"
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
      compliance_provider: [
        "none",
        "alegra",
        "siigo",
        "loggro",
        "finkok",
        "edicom",
        "facturama",
        "haulmer",
        "nubox",
        "openfactura",
      ],
      compliance_status: [
        "not_required",
        "pending",
        "submitted",
        "accepted",
        "rejected",
      ],
      country_code: ["US", "MX", "CL", "CO"],
      line_item_type: ["labor", "part"],
      payment_method: ["card", "cash", "check", "ach", "pse", "transfer", "other"],
      payment_provider: [
        "manual",
        "stripe",
        "wompi",
        "payu",
        "mercado_pago",
        "culqi",
        "other",
      ],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      repair_order_status: [
        "draft",
        "pending",
        "approved",
        "in_progress",
        "completed",
        "declined",
        "cancelled",
      ],
      shop_role: ["owner", "tech"],
    },
  },
} as const
