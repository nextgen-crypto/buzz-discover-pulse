export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comment_likes: {
        Row: {
          comment_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          is_deleted: boolean;
          is_edited: boolean;
          metadata: Json;
          parent_id: string | null;
          post_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          is_edited?: boolean;
          metadata?: Json;
          parent_id?: string | null;
          post_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          is_edited?: boolean;
          metadata?: Json;
          parent_id?: string | null;
          post_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      content_audit: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string;
          id: string;
          ref_id: string;
        };
        Insert: {
          action: string;
          actor_id: string;
          created_at?: string;
          id?: string;
          ref_id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string;
          id?: string;
          ref_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_audit_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string;
          user_a_id: string;
          user_b_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          user_a_id: string;
          user_b_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          user_a_id?: string;
          user_b_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_user_a_id_fkey";
            columns: ["user_a_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_user_b_id_fkey";
            columns: ["user_b_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      feed_events: {
        Row: {
          author_id: string | null;
          created_at: string;
          event: string;
          id: string;
          meta: Json;
          post_id: string;
          user_id: string;
        };
        Insert: {
          author_id?: string | null;
          created_at?: string;
          event: string;
          id?: string;
          meta?: Json;
          post_id: string;
          user_id: string;
        };
        Update: {
          author_id?: string | null;
          created_at?: string;
          event?: string;
          id?: string;
          meta?: Json;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feed_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          followee_id: string;
          follower_id: string;
        };
        Insert: {
          created_at?: string;
          followee_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey";
            columns: ["followee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_requests: {
        Row: {
          created_at: string;
          followee_id: string;
          requester_id: string;
        };
        Insert: {
          created_at?: string;
          followee_id: string;
          requester_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          requester_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_requests_followee_id_fkey";
            columns: ["followee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          is_read: boolean;
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          sender_id: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string;
          created_at: string;
          id: string;
          is_read: boolean;
          kind: string;
          ref_id: string;
          text: string;
          user_id: string;
        };
        Insert: {
          actor_id: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind: string;
          ref_id?: string;
          text?: string;
          user_id: string;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind?: string;
          ref_id?: string;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_stats: {
        Row: {
          completes: number;
          impressions: number;
          plays: number;
          post_id: string;
          updated_at: string;
        };
        Insert: {
          completes?: number;
          impressions?: number;
          plays?: number;
          post_id: string;
          updated_at?: string;
        };
        Update: {
          completes?: number;
          impressions?: number;
          plays?: number;
          post_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author_id: string;
          caption: string;
          category: string;
          comments_count: number;
          comments_enabled: boolean;
          created_at: string;
          hashtags: string[];
          id: string;
          image_url: string | null;
          is_edited: boolean;
          location: string | null;
          status: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          author_id: string;
          caption?: string;
          category?: string;
          comments_count?: number;
          comments_enabled?: boolean;
          created_at?: string;
          hashtags?: string[];
          id?: string;
          image_url?: string | null;
          is_edited?: boolean;
          location?: string | null;
          status?: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          author_id?: string;
          caption?: string;
          category?: string;
          comments_count?: number;
          comments_enabled?: boolean;
          created_at?: string;
          hashtags?: string[];
          id?: string;
          image_url?: string | null;
          is_edited?: boolean;
          location?: string | null;
          status?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string;
          created_at: string;
          display_name: string;
          id: string;
          is_private: boolean;
          updated_at: string;
          username: string;
          verified: boolean;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string;
          created_at?: string;
          display_name: string;
          id: string;
          is_private?: boolean;
          updated_at?: string;
          username: string;
          verified?: boolean;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_private?: boolean;
          updated_at?: string;
          username?: string;
          verified?: boolean;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          details: string;
          id: string;
          kind: string;
          reason: string;
          ref_id: string;
          ref_title: string;
          reporter_id: string;
          resolution: string;
          status: string;
          target_user_id: string | null;
        };
        Insert: {
          created_at?: string;
          details?: string;
          id?: string;
          kind: string;
          reason: string;
          ref_id: string;
          ref_title?: string;
          reporter_id: string;
          resolution?: string;
          status?: string;
          target_user_id?: string | null;
        };
        Update: {
          created_at?: string;
          details?: string;
          id?: string;
          kind?: string;
          reason?: string;
          ref_id?: string;
          ref_title?: string;
          reporter_id?: string;
          resolution?: string;
          status?: string;
          target_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      warnings: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warnings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saves: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saves_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
