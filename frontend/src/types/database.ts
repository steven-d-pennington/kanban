export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_items: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          title: string;
          description: string | null;
          type: string;
          priority: string;
          status: string;
          column_order: number;
          assigned_to: string | null;
          assigned_agent: string | null;
          story_points: number | null;
          due_date: string | null;
          labels: Json;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          title: string;
          description?: string | null;
          type: string;
          priority?: string;
          status?: string;
          column_order?: number;
          assigned_to?: string | null;
          assigned_agent?: string | null;
          story_points?: number | null;
          due_date?: string | null;
          labels?: Json;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          title?: string;
          description?: string | null;
          type?: string;
          priority?: string;
          status?: string;
          column_order?: number;
          assigned_to?: string | null;
          assigned_agent?: string | null;
          story_points?: number | null;
          due_date?: string | null;
          labels?: Json;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      agent_activity: {
        Row: {
          id: string;
          work_item_id: string | null;
          agent_type: string;
          agent_instance_id: string | null;
          action: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_item_id?: string | null;
          agent_type: string;
          agent_instance_id?: string | null;
          action: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_item_id?: string | null;
          agent_type?: string;
          agent_instance_id?: string | null;
          action?: string;
          details?: Json;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          work_item_id: string;
          author_id: string | null;
          author_agent: string | null;
          content: string;
          is_system_message: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          work_item_id: string;
          author_id?: string | null;
          author_agent?: string | null;
          content: string;
          is_system_message?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          work_item_id?: string;
          author_id?: string | null;
          author_agent?: string | null;
          content?: string;
          is_system_message?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      agent_instances: {
        Row: {
          id: string;
          agent_type: string;
          display_name: string;
          status: string;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          agent_type: string;
          display_name: string;
          status?: string;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_type?: string;
          display_name?: string;
          status?: string;
          last_seen_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      agent_activity_feed: {
        Row: {
          id: string;
          agent_instance_id: string;
          agent_type: string;
          action: string;
          work_item_title: string | null;
          status: string;
          created_at: string;
          duration_ms: number | null;
          agent_display_name: string | null;
          error_message: string | null;
          work_item_id: string | null;
        };
      };
      agent_claimed_items: {
        Row: {
          id: string;
          title: string;
          claimed_minutes_ago: number;
          claimed_by_instance: string;
          claimed_at: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
