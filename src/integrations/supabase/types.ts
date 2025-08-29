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
      activity_events_v1: {
        Row: {
          amount_bucket: string
          amount_gross: number
          amount_net: number
          amount_tax: number
          business_id: string
          client_account_id: string | null
          country: string
          created_at: string
          currency: string
          event_date: string
          event_ts: string
          id: string
          sign: number
          type: string
          upload_id: string
          vat_rate: number
          vat_rate_pct: number
        }
        Insert: {
          amount_bucket: string
          amount_gross: number
          amount_net: number
          amount_tax: number
          business_id: string
          client_account_id?: string | null
          country: string
          created_at?: string
          currency: string
          event_date: string
          event_ts: string
          id?: string
          sign: number
          type: string
          upload_id: string
          vat_rate: number
          vat_rate_pct: number
        }
        Update: {
          amount_bucket?: string
          amount_gross?: number
          amount_net?: number
          amount_tax?: number
          business_id?: string
          client_account_id?: string | null
          country?: string
          created_at?: string
          currency?: string
          event_date?: string
          event_ts?: string
          id?: string
          sign?: number
          type?: string
          upload_id?: string
          vat_rate?: number
          vat_rate_pct?: number
        }
        Relationships: []
      }
      alerts: {
        Row: {
          baseline_days: number
          business_id: string | null
          created_at: string
          delay_hours: number
          expected_at: string
          id: string
          last_order_at: string
          location_id: string | null
          resolved_at: string | null
          supplier_id: string
          type: string
          user_id: string
        }
        Insert: {
          baseline_days: number
          business_id?: string | null
          created_at?: string
          delay_hours: number
          expected_at: string
          id?: string
          last_order_at: string
          location_id?: string | null
          resolved_at?: string | null
          supplier_id: string
          type?: string
          user_id: string
        }
        Update: {
          baseline_days?: number
          business_id?: string | null
          created_at?: string
          delay_hours?: number
          expected_at?: string
          id?: string
          last_order_at?: string
          location_id?: string | null
          resolved_at?: string | null
          supplier_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_alerts_supplier_id"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_flags: {
        Row: {
          business_id: string
          created_at: string
          date: string
          id: string
          note: string | null
          outlet_id: string
          product_id: string
          qty: number
          updated_at: string
          zscore: number
        }
        Insert: {
          business_id: string
          created_at?: string
          date: string
          id?: string
          note?: string | null
          outlet_id: string
          product_id: string
          qty: number
          updated_at?: string
          zscore: number
        }
        Update: {
          business_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          outlet_id?: string
          product_id?: string
          qty?: number
          updated_at?: string
          zscore?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          business_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      central_kitchen_config: {
        Row: {
          business_id: string
          created_at: string
          id: string
          location_id: string
          updated_at: string
          visible_stock_to_branches: boolean
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          location_id: string
          updated_at?: string
          visible_stock_to_branches?: boolean
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          location_id?: string
          updated_at?: string
          visible_stock_to_branches?: boolean
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_delivery_note_items: {
        Row: {
          ck_delivery_note_id: string
          id: string
          product_id: string
          qty: number
        }
        Insert: {
          ck_delivery_note_id: string
          id?: string
          product_id: string
          qty: number
        }
        Update: {
          ck_delivery_note_id?: string
          id?: string
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "ck_delivery_note_items_ck_delivery_note_id_fkey"
            columns: ["ck_delivery_note_id"]
            isOneToOne: false
            referencedRelation: "ck_delivery_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_delivery_notes: {
        Row: {
          ck_order_id: string
          id: string
          issued_at: string
          number: string
        }
        Insert: {
          ck_order_id: string
          id?: string
          issued_at?: string
          number: string
        }
        Update: {
          ck_order_id?: string
          id?: string
          issued_at?: string
          number?: string
        }
        Relationships: [
          {
            foreignKeyName: "ck_delivery_notes_ck_order_id_fkey"
            columns: ["ck_order_id"]
            isOneToOne: true
            referencedRelation: "ck_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_grn_items: {
        Row: {
          ck_grn_id: string
          id: string
          product_id: string
          qty: number
        }
        Insert: {
          ck_grn_id: string
          id?: string
          product_id: string
          qty: number
        }
        Update: {
          ck_grn_id?: string
          id?: string
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "ck_grn_items_ck_grn_id_fkey"
            columns: ["ck_grn_id"]
            isOneToOne: false
            referencedRelation: "ck_grns"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_grns: {
        Row: {
          ck_order_id: string
          id: string
          number: string
          received_at: string
        }
        Insert: {
          ck_order_id: string
          id?: string
          number: string
          received_at?: string
        }
        Update: {
          ck_order_id?: string
          id?: string
          number?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ck_grns_ck_order_id_fkey"
            columns: ["ck_order_id"]
            isOneToOne: true
            referencedRelation: "ck_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_order_lines: {
        Row: {
          approved_qty: number | null
          ck_order_id: string
          id: string
          notes: string | null
          product_id: string
          received_qty: number | null
          requested_qty: number
          shipped_qty: number | null
          uom: string | null
        }
        Insert: {
          approved_qty?: number | null
          ck_order_id: string
          id?: string
          notes?: string | null
          product_id: string
          received_qty?: number | null
          requested_qty: number
          shipped_qty?: number | null
          uom?: string | null
        }
        Update: {
          approved_qty?: number | null
          ck_order_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          received_qty?: number | null
          requested_qty?: number
          shipped_qty?: number | null
          uom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ck_order_lines_ck_order_id_fkey"
            columns: ["ck_order_id"]
            isOneToOne: false
            referencedRelation: "ck_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_orders: {
        Row: {
          business_id: string
          created_at: string
          created_by_user_id: string
          expected_delivery_at: string | null
          from_location_id: string
          id: string
          notes: string | null
          requested_delivery_at: string | null
          status: Database["public"]["Enums"]["ck_order_status"]
          to_location_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id: string
          expected_delivery_at?: string | null
          from_location_id: string
          id?: string
          notes?: string | null
          requested_delivery_at?: string | null
          status?: Database["public"]["Enums"]["ck_order_status"]
          to_location_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string
          expected_delivery_at?: string | null
          from_location_id?: string
          id?: string
          notes?: string | null
          requested_delivery_at?: string | null
          status?: Database["public"]["Enums"]["ck_order_status"]
          to_location_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_accounts: {
        Row: {
          country: string | null
          created_at: string | null
          display_name: string
          id: string
          organization_id: string
          oss_opt_in: boolean | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          organization_id: string
          oss_opt_in?: boolean | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          oss_opt_in?: boolean | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      external_signals: {
        Row: {
          business_id: string
          created_at: string
          date: string
          id: string
          kind: string
          location_id: string
          updated_at: string
          value_num: number | null
          value_text: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          date: string
          id?: string
          kind: string
          location_id: string
          updated_at?: string
          value_num?: number | null
          value_text?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          date?: string
          id?: string
          kind?: string
          location_id?: string
          updated_at?: string
          value_num?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      feature_toggles: {
        Row: {
          business_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_enabled: boolean
          key: string
          outlet_id: string | null
          rollout_pct: number
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          key: string
          outlet_id?: string | null
          rollout_pct?: number
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          key?: string
          outlet_id?: string | null
          rollout_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_toggles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_toggles_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_signals: {
        Row: {
          business_id: string
          ck_location_id: string
          conf_high: number | null
          conf_low: number | null
          created_at: string
          date: string
          horizon_days: number
          id: string
          model: string
          outlet_id: string
          product_id: string
          qty_pred: number
          updated_at: string
        }
        Insert: {
          business_id: string
          ck_location_id: string
          conf_high?: number | null
          conf_low?: number | null
          created_at?: string
          date: string
          horizon_days: number
          id?: string
          model: string
          outlet_id: string
          product_id: string
          qty_pred: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          ck_location_id?: string
          conf_high?: number | null
          conf_low?: number | null
          created_at?: string
          date?: string
          horizon_days?: number
          id?: string
          model?: string
          outlet_id?: string
          product_id?: string
          qty_pred?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventories: {
        Row: {
          business_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          location_id: string | null
          name: string
          notes: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          name: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          counted_quantity: number
          created_at: string
          id: string
          inventory_id: string
          notes: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          counted_quantity?: number
          created_at?: string
          id?: string
          inventory_id: string
          notes?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          counted_quantity?: number
          created_at?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_ledger: {
        Row: {
          business_id: string
          created_at: string
          delta: number
          id: string
          location_id: string
          occurred_at: string
          product_id: string
          reason: string
          ref_id: string
          ref_type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          delta: number
          id?: string
          location_id: string
          occurred_at?: string
          product_id: string
          reason: string
          ref_id: string
          ref_type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          delta?: number
          id?: string
          location_id?: string
          occurred_at?: string
          product_id?: string
          reason?: string
          ref_id?: string
          ref_type?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          client_account_id: string
          created_at: string | null
          created_by: string
          expires_at: string
          id: string
          max_uses: number | null
          period: string
          token_hash: string
          used_count: number | null
        }
        Insert: {
          client_account_id: string
          created_at?: string | null
          created_by: string
          expires_at: string
          id?: string
          max_uses?: number | null
          period: string
          token_hash: string
          used_count?: number | null
        }
        Update: {
          client_account_id?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string
          id?: string
          max_uses?: number | null
          period?: string
          token_hash?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          location_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          location_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          location_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          location_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          location_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          location_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string | null
          created_at: string
          delivery_date: string | null
          id: string
          location_id: string | null
          notes: string | null
          order_date: string
          order_number: string
          status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      outlet_supplier_habits: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          order_cadence_dow: number | null
          outlet_id: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          order_cadence_dow?: number | null
          outlet_id: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          order_cadence_dow?: number | null
          outlet_id?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          business_id: string | null
          category: string | null
          ck_location_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          emoji: string | null
          id: string
          internal_transfer_price_cents: number | null
          is_active: boolean | null
          location_id: string | null
          minimum_stock: number | null
          moq: number | null
          name: string
          pack_size: number | null
          photo_url: string | null
          price: number | null
          shelf_life_days: number | null
          source: Database["public"]["Enums"]["product_source"] | null
          stock_quantity: number | null
          supplier_id: string | null
          supplier_price_cents: number | null
          tags: string[] | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          ck_location_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          internal_transfer_price_cents?: number | null
          is_active?: boolean | null
          location_id?: string | null
          minimum_stock?: number | null
          moq?: number | null
          name: string
          pack_size?: number | null
          photo_url?: string | null
          price?: number | null
          shelf_life_days?: number | null
          source?: Database["public"]["Enums"]["product_source"] | null
          stock_quantity?: number | null
          supplier_id?: string | null
          supplier_price_cents?: number | null
          tags?: string[] | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          ck_location_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          internal_transfer_price_cents?: number | null
          is_active?: boolean | null
          location_id?: string | null
          minimum_stock?: number | null
          moq?: number | null
          name?: string
          pack_size?: number | null
          photo_url?: string | null
          price?: number | null
          shelf_life_days?: number | null
          source?: Database["public"]["Enums"]["product_source"] | null
          stock_quantity?: number | null
          supplier_id?: string | null
          supplier_price_cents?: number | null
          tags?: string[] | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      retail_products: {
        Row: {
          business_id: string
          category: string
          cost: number
          created_at: string
          id: string
          is_active: boolean
          location_id: string
          name: string
          price: number
          reorder_point: number
          stock: number
          supplier: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          business_id: string
          category: string
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          location_id: string
          name: string
          price?: number
          reorder_point?: number
          stock?: number
          supplier?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          business_id?: string
          category?: string
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string
          name?: string
          price?: number
          reorder_point?: number
          stock?: number
          supplier?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retail_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_transactions: {
        Row: {
          business_id: string
          created_at: string
          id: string
          location_id: string
          notes: string | null
          quantity: number
          retail_product_id: string
          retail_variant_id: string | null
          supplier: string | null
          total_cost: number | null
          total_revenue: number | null
          transaction_date: string
          type: string
          unit_cost: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          location_id: string
          notes?: string | null
          quantity: number
          retail_product_id: string
          retail_variant_id?: string | null
          supplier?: string | null
          total_cost?: number | null
          total_revenue?: number | null
          transaction_date?: string
          type: string
          unit_cost?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          location_id?: string
          notes?: string | null
          quantity?: number
          retail_product_id?: string
          retail_variant_id?: string | null
          supplier?: string | null
          total_cost?: number | null
          total_revenue?: number | null
          transaction_date?: string
          type?: string
          unit_cost?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retail_transactions_retail_product_id_fkey"
            columns: ["retail_product_id"]
            isOneToOne: false
            referencedRelation: "retail_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retail_transactions_retail_variant_id_fkey"
            columns: ["retail_variant_id"]
            isOneToOne: false
            referencedRelation: "retail_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_variants: {
        Row: {
          cost: number
          created_at: string
          id: string
          label: string
          price: number
          reorder_point: number
          retail_product_id: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          label: string
          price?: number
          reorder_point?: number
          retail_product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          label?: string
          price?: number
          reorder_point?: number
          retail_product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retail_variants_retail_product_id_fkey"
            columns: ["retail_product_id"]
            isOneToOne: false
            referencedRelation: "retail_products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_cart_lines: {
        Row: {
          id: string
          name: string | null
          note: string | null
          position: number
          product_id: string
          qty: number
          saved_cart_id: string
          source: string
          supplier_id: string | null
          unit: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          note?: string | null
          position?: number
          product_id: string
          qty: number
          saved_cart_id: string
          source: string
          supplier_id?: string | null
          unit?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          note?: string | null
          position?: number
          product_id?: string
          qty?: number
          saved_cart_id?: string
          source?: string
          supplier_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_cart_lines_saved_cart_id_fkey"
            columns: ["saved_cart_id"]
            isOneToOne: false
            referencedRelation: "saved_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_carts: {
        Row: {
          business_id: string
          color_hex: string | null
          created_at: string
          emoji: string | null
          icon: string | null
          id: string
          is_favorite: boolean
          name: string
          note: string | null
          outlet_id: string | null
          owner_user_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          business_id: string
          color_hex?: string | null
          created_at?: string
          emoji?: string | null
          icon?: string | null
          id?: string
          is_favorite?: boolean
          name: string
          note?: string | null
          outlet_id?: string | null
          owner_user_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          color_hex?: string | null
          created_at?: string
          emoji?: string | null
          icon?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          note?: string | null
          outlet_id?: string | null
          owner_user_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_amz_transactions: {
        Row: {
          business_id: string
          client_account_id: string | null
          created_at: string | null
          id: string
          taxable_jurisdiction: string | null
          total_activity_value_amt_vat_excl: number | null
          total_activity_value_amt_vat_incl: number | null
          total_activity_value_vat_amt: number | null
          transaction_currency_code: string | null
          transaction_depart_date: string | null
          transaction_type: string | null
          upload_id: string
        }
        Insert: {
          business_id: string
          client_account_id?: string | null
          created_at?: string | null
          id?: string
          taxable_jurisdiction?: string | null
          total_activity_value_amt_vat_excl?: number | null
          total_activity_value_amt_vat_incl?: number | null
          total_activity_value_vat_amt?: number | null
          transaction_currency_code?: string | null
          transaction_depart_date?: string | null
          transaction_type?: string | null
          upload_id: string
        }
        Update: {
          business_id?: string
          client_account_id?: string | null
          created_at?: string | null
          id?: string
          taxable_jurisdiction?: string | null
          total_activity_value_amt_vat_excl?: number | null
          total_activity_value_amt_vat_incl?: number | null
          total_activity_value_vat_amt?: number | null
          transaction_currency_code?: string | null
          transaction_depart_date?: string | null
          transaction_type?: string | null
          upload_id?: string
        }
        Relationships: []
      }
      supplier_draft_lines: {
        Row: {
          explain: string[] | null
          id: string
          name: string | null
          note: string | null
          position: number
          product_id: string
          qty: number
          supplier_draft_id: string
          unit: string | null
        }
        Insert: {
          explain?: string[] | null
          id?: string
          name?: string | null
          note?: string | null
          position?: number
          product_id: string
          qty: number
          supplier_draft_id: string
          unit?: string | null
        }
        Update: {
          explain?: string[] | null
          id?: string
          name?: string | null
          note?: string | null
          position?: number
          product_id?: string
          qty?: number
          supplier_draft_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_draft_lines_supplier_draft_id_fkey"
            columns: ["supplier_draft_id"]
            isOneToOne: false
            referencedRelation: "supplier_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_drafts: {
        Row: {
          business_id: string
          created_at: string
          id: string
          note: string | null
          outlet_id: string
          owner_user_id: string | null
          status: string
          supplier_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          note?: string | null
          outlet_id: string
          owner_user_id?: string | null
          status?: string
          supplier_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          note?: string | null
          outlet_id?: string
          owner_user_id?: string | null
          status?: string
          supplier_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_order_lines: {
        Row: {
          currency: string | null
          id: string
          net_unit_price_cents: number | null
          product_id: string
          qty: number
          supplier_order_id: string
          unit_price_cents: number | null
          uom: string | null
        }
        Insert: {
          currency?: string | null
          id?: string
          net_unit_price_cents?: number | null
          product_id: string
          qty: number
          supplier_order_id: string
          unit_price_cents?: number | null
          uom?: string | null
        }
        Update: {
          currency?: string | null
          id?: string
          net_unit_price_cents?: number | null
          product_id?: string
          qty?: number
          supplier_order_id?: string
          unit_price_cents?: number | null
          uom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_lines_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_order_responses: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          modified_items: Json | null
          order_id: string
          response_date: string | null
          status: string
          supplier_message: string | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          modified_items?: Json | null
          order_id: string
          response_date?: string | null
          status?: string
          supplier_message?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          modified_items?: Json | null
          order_id?: string
          response_date?: string | null
          status?: string
          supplier_message?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_responses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          business_id: string
          created_at: string
          email_sent_at: string | null
          id: string
          location_id: string
          status: Database["public"]["Enums"]["supplier_order_status"] | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          location_id: string
          status?: Database["public"]["Enums"]["supplier_order_status"] | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          location_id?: string
          status?: Database["public"]["Enums"]["supplier_order_status"] | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_settings: {
        Row: {
          alerts_enabled: boolean
          created_at: string
          id: string
          override_days: number | null
          snooze_until: string | null
          supplier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          override_days?: number | null
          snooze_until?: string | null
          supplier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          override_days?: number | null
          snooze_until?: string | null
          supplier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          business_id: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          lead_time_days: number | null
          location_id: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_time_days?: number | null
          location_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_id?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_time_days?: number | null
          location_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_files: {
        Row: {
          analysis_status: string | null
          client_account_id: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          period: string | null
          storage_path: string | null
          upload_date: string
          user_id: string
        }
        Insert: {
          analysis_status?: string | null
          client_account_id?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          period?: string | null
          storage_path?: string | null
          upload_date?: string
          user_id: string
        }
        Update: {
          analysis_status?: string | null
          client_account_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          period?: string | null
          storage_path?: string | null
          upload_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_files_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          language: string | null
          notifications_enabled: boolean | null
          preferences: Json | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vat_reports: {
        Row: {
          analysis_date: string
          client_account_id: string | null
          created_at: string
          currency: string | null
          file_id: string | null
          id: string
          report_data: Json
          report_name: string
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          client_account_id?: string | null
          created_at?: string
          currency?: string | null
          file_id?: string | null
          id?: string
          report_data: Json
          report_name: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          client_account_id?: string | null
          created_at?: string
          currency?: string | null
          file_id?: string | null
          id?: string
          report_data?: Json
          report_name?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vat_reports_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_reports_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_order_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          received_quantity: number | null
          retail_product_id: string
          retail_variant_id: string | null
          total_cost: number
          unit_cost: number
          vendor_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity: number
          received_quantity?: number | null
          retail_product_id: string
          retail_variant_id?: string | null
          total_cost: number
          unit_cost: number
          vendor_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          received_quantity?: number | null
          retail_product_id?: string
          retail_variant_id?: string | null
          total_cost?: number
          unit_cost?: number
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_order_items_retail_product_id_fkey"
            columns: ["retail_product_id"]
            isOneToOne: false
            referencedRelation: "retail_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_order_items_retail_variant_id_fkey"
            columns: ["retail_variant_id"]
            isOneToOne: false
            referencedRelation: "retail_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_order_items_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_orders: {
        Row: {
          business_id: string
          created_at: string
          expected_delivery_date: string | null
          id: string
          location_id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          total_amount: number | null
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          location_id: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          business_id: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activity_breakdown: {
        Args: {
          p_from: string
          p_group_by: string
          p_to: string
          p_type?: string
        }
        Returns: {
          avg_sales: number
          gross: number
          key: string
          tax: number
          transactions: number
        }[]
      }
      activity_summary: {
        Args: {
          p_country?: string
          p_from: string
          p_include_refunds?: boolean
          p_to: string
          p_type?: string
        }
        Returns: {
          average_sales: number
          currency: string
          gross_amount: number
          tax_amount: number
          total_transactions: number
        }[]
      }
      activity_timeseries: {
        Args: {
          p_from: string
          p_group_by_country?: boolean
          p_interval: string
          p_metric: string
          p_to: string
          p_type?: string
        }
        Returns: {
          group_key: string
          period: string
          value: number
        }[]
      }
      ff_hash_bucket: {
        Args: { seed: string }
        Returns: number
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_supplier_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_vendor_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_business_ids: {
        Args: { _user_id: string }
        Returns: {
          business_id: string
        }[]
      }
      get_user_locations: {
        Args: { _business_id: string; _user_id: string }
        Returns: {
          location_id: string
        }[]
      }
      has_role: {
        Args: {
          _business_id: string
          _location_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_feature_enabled: {
        Args: {
          p_business_id?: string
          p_key: string
          p_outlet_id?: string
          p_user_seed?: string
        }
        Returns: boolean
      }
      is_org_admin_for_business: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      norm_country: {
        Args: { raw: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "ORG_ADMIN"
        | "SITE_MANAGER"
        | "SITE_STAFF"
        | "VIEW_ONLY"
        | "FIRM_ADMIN"
        | "ACCOUNTANT"
        | "CONTRIBUTOR"
      ck_order_status:
        | "Draft"
        | "Sent"
        | "Accepted"
        | "Changed"
        | "Rejected"
        | "Shipped"
        | "Received"
        | "Canceled"
      order_status: "draft" | "sent" | "ack" | "delivered" | "canceled"
      product_source: "CK" | "SUPPLIER"
      supplier_order_status: "draft" | "sent" | "ack" | "delivered" | "canceled"
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
        "ORG_ADMIN",
        "SITE_MANAGER",
        "SITE_STAFF",
        "VIEW_ONLY",
        "FIRM_ADMIN",
        "ACCOUNTANT",
        "CONTRIBUTOR",
      ],
      ck_order_status: [
        "Draft",
        "Sent",
        "Accepted",
        "Changed",
        "Rejected",
        "Shipped",
        "Received",
        "Canceled",
      ],
      order_status: ["draft", "sent", "ack", "delivered", "canceled"],
      product_source: ["CK", "SUPPLIER"],
      supplier_order_status: ["draft", "sent", "ack", "delivered", "canceled"],
    },
  },
} as const
