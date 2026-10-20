export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      dpg_products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          brand: string;
          category: string;
          description: string;
          image: string;
          reference: string;
          badge: string | null;
          colors: string[];
          specs: string[];
          price: number | null;
          stock: number;
          reserved_stock: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          brand: string;
          category: string;
          description: string;
          image: string;
          reference?: string;
          badge?: string | null;
          colors?: string[];
          specs?: string[];
          price?: number | null;
          stock?: number;
          reserved_stock?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          brand?: string;
          category?: string;
          description?: string;
          image?: string;
          reference?: string;
          badge?: string | null;
          colors?: string[];
          specs?: string[];
          price?: number | null;
          stock?: number;
          reserved_stock?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dpg_orders: {
        Row: {
          id: string;
          reference: string;
          idempotency_key: string;
          customer_name: string;
          email: string;
          phone: string;
          address: string;
          city: string;
          state: string;
          delivery_notes: string;
          items: Json;
          subtotal: number;
          delivery_fee: number;
          total: number;
          currency: string;
          payment_status: string;
          fulfillment_status: string;
          provider: string;
          provider_reference: string;
          provider_transaction_id: string | null;
          authorization_url: string | null;
          authorization_lock_until: string | null;
          reservation_expires_at: string;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference: string;
          idempotency_key: string;
          customer_name: string;
          email: string;
          phone: string;
          address: string;
          city: string;
          state: string;
          delivery_notes?: string;
          items: Json;
          subtotal: number;
          delivery_fee?: number;
          total: number;
          currency?: string;
          payment_status?: string;
          fulfillment_status?: string;
          provider?: string;
          provider_reference: string;
          provider_transaction_id?: string | null;
          authorization_url?: string | null;
          authorization_lock_until?: string | null;
          reservation_expires_at?: string;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          fulfillment_status?: string;
        };
        Relationships: [];
      };
      dpg_order_notifications: {
        Row: {
          id: string;
          order_id: string;
          event_type: string;
          status: string;
          attempts: number;
          locked_until: string | null;
          sent_at: string | null;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          event_type: string;
          status?: string;
          attempts?: number;
          locked_until?: string | null;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      dpg_create_order: {
        Args: {
          p_reference: string;
          p_idempotency_key: string;
          p_customer: Json;
          p_items: Json;
          p_delivery_fee: number;
        };
        Returns: Json;
      };
      dpg_set_order_authorization: {
        Args: { p_reference: string; p_authorization_url: string };
        Returns: boolean;
      };
      dpg_claim_order_authorization: {
        Args: { p_reference: string };
        Returns: boolean;
      };
      dpg_release_order_authorization: {
        Args: { p_reference: string };
        Returns: undefined;
      };
      dpg_set_order_payment: {
        Args: {
          p_reference: string;
          p_status: string;
          p_transaction_id?: string | null;
          p_paid_at?: string | null;
        };
        Returns: Json;
      };
      dpg_claim_order_notification: {
        Args: { p_order_id: string; p_event_type: string };
        Returns: string | null;
      };
      dpg_finish_order_notification: {
        Args: {
          p_notification_id: string;
          p_sent: boolean;
          p_error?: string | null;
        };
        Returns: undefined;
      };
      dpg_update_order_fulfillment: {
        Args: { p_order_id: string; p_status: string };
        Returns: Json;
      };
      dpg_admin_update_product: {
        Args: { p_id: string; p_product: Json };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
