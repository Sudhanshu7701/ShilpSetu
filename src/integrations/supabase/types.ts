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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      daily_message_counts: {
        Row: {
          count: number
          id: string
          message_date: string
          user_id: string
        }
        Insert: {
          count?: number
          id?: string
          message_date?: string
          user_id: string
        }
        Update: {
          count?: number
          id?: string
          message_date?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          artisan_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          artisan_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          artisan_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      live_events: {
        Row: {
          artisan_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          scheduled_at: string
          status: string
          thumbnail_url: string | null
          title: string
          viewers_count: number | null
        }
        Insert: {
          artisan_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_at: string
          status?: string
          thumbnail_url?: string | null
          title: string
          viewers_count?: number | null
        }
        Update: {
          artisan_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_at?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          viewers_count?: number | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          id: string
          lifetime_points: number
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          artisan_id: string
          created_at: string
          customer_id: string
          id: string
          product_id: string
          quantity: number | null
          stage_images: Json | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          artisan_id: string
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
          quantity?: number | null
          stage_images?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          artisan_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
          quantity?: number | null
          stage_images?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          artisan_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_live: boolean | null
          original_price: number | null
          price: number
          quantity: number | null
          rarity_tier: string | null
          rating: number | null
          region: string | null
          reviews_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          artisan_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_live?: boolean | null
          original_price?: number | null
          price: number
          quantity?: number | null
          rarity_tier?: string | null
          rating?: number | null
          region?: string | null
          reviews_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          artisan_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_live?: boolean | null
          original_price?: number | null
          price?: number
          quantity?: number | null
          rarity_tier?: string | null
          rating?: number | null
          region?: string | null
          reviews_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_contact: boolean
          avatar_url: string | null
          bio: string | null
          brand_color: string | null
          brand_logo_url: string | null
          brand_name: string | null
          brand_tagline: string | null
          created_at: string
          followers_count: number | null
          full_name: string
          id: string
          is_verified: boolean | null
          region: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_contact?: boolean
          avatar_url?: string | null
          bio?: string | null
          brand_color?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_tagline?: string | null
          created_at?: string
          followers_count?: number | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          region?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_contact?: boolean
          avatar_url?: string | null
          bio?: string | null
          brand_color?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_tagline?: string | null
          created_at?: string
          followers_count?: number | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          region?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string
          evidence_urls: string[]
          id: string
          order_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id: string
          evidence_urls?: string[]
          id?: string
          order_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string
          evidence_urls?: string[]
          id?: string
          order_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          started_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          artisan_id: string
          created_at: string
          document_type: string
          document_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          artisan_id: string
          created_at?: string
          document_type?: string
          document_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          artisan_id?: string
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      video_call_requests: {
        Row: {
          artisan_id: string
          created_at: string
          customer_id: string
          id: string
          initiated_by: string
          order_id: string
          responded_at: string | null
          room_url: string | null
          status: string
        }
        Insert: {
          artisan_id: string
          created_at?: string
          customer_id: string
          id?: string
          initiated_by?: string
          order_id: string
          responded_at?: string | null
          room_url?: string | null
          status?: string
        }
        Update: {
          artisan_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          initiated_by?: string
          order_id?: string
          responded_at?: string | null
          room_url?: string | null
          status?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "customer" | "artisan" | "admin"
      order_status:
        | "placed"
        | "design"
        | "weaving"
        | "finishing"
        | "quality_check"
        | "dispatch"
        | "delivered"
        | "cancelled"
      subscription_tier: "free" | "normal" | "premium"
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
      app_role: ["customer", "artisan", "admin"],
      order_status: [
        "placed",
        "design",
        "weaving",
        "finishing",
        "quality_check",
        "dispatch",
        "delivered",
        "cancelled",
      ],
      subscription_tier: ["free", "normal", "premium"],
    },
  },
} as const
