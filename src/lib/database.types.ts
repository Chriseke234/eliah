// =============================================================================
// Database Types — generated from Supabase schema
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'ADMIN' | 'CLIENT'
export type RequestStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
export type ActivityActionType = 'CREATED' | 'STATUS_UPDATED' | 'PAYMENT_LINK_ADDED' | 'ATTACHMENT_ADDED' | 'PRIORITY_UPDATED'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          favicon_url: string | null
          custom_domain: string | null
          auto_notify_client: boolean
          auto_assign_enabled: boolean
          default_assignee_id: string | null
          auto_notify_agency: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          favicon_url?: string | null
          custom_domain?: string | null
          auto_notify_client?: boolean
          auto_assign_enabled?: boolean
          default_assignee_id?: string | null
          auto_notify_agency?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          favicon_url?: string | null
          custom_domain?: string | null
          auto_notify_client?: boolean
          auto_assign_enabled?: boolean
          default_assignee_id?: string | null
          auto_notify_agency?: boolean
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          org_id: string
          role: UserRole
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          org_id: string
          role?: UserRole
          full_name?: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          role?: UserRole
          full_name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      requests: {
        Row: {
          id: string
          title: string
          description: string | null
          status: RequestStatus
          client_id: string
          org_id: string
          payment_link: string | null
          priority: Priority
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: RequestStatus
          client_id: string
          org_id: string
          payment_link?: string | null
          priority?: Priority
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: RequestStatus
          client_id?: string
          org_id?: string
          payment_link?: string | null
          priority?: Priority
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      attachments: {
        Row: {
          id: string
          request_id: string
          file_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          file_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          file_path?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      request_activity: {
        Row: {
          id: string
          request_id: string
          org_id: string
          actor_id: string | null
          action_type: ActivityActionType
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          org_id: string
          actor_id?: string | null
          action_type: ActivityActionType
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          org_id?: string
          actor_id?: string | null
          action_type?: ActivityActionType
          details?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_activity_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_activity_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      request_time_entries: {
        Row: {
          id: string
          request_id: string
          org_id: string
          user_id: string
          start_time: string
          end_time: string | null
          duration_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          org_id: string
          user_id: string
          start_time: string
          end_time?: string | null
          duration_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          org_id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          duration_seconds?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_time_entries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      request_comments: {
        Row: {
          id: string
          request_id: string
          org_id: string
          sender_id: string | null
          message: string
          attachment_path: string | null
          attachment_name: string | null
          call_link: string | null
          call_title: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          org_id: string
          sender_id?: string | null
          message: string
          attachment_path?: string | null
          attachment_name?: string | null
          call_link?: string | null
          call_title?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          org_id?: string
          sender_id?: string | null
          message?: string
          attachment_path?: string | null
          attachment_name?: string | null
          call_link?: string | null
          call_title?: string | null
          is_system?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_comments_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      request_read_states: {
        Row: {
          request_id: string
          user_id: string
          last_read_at: string
        }
        Insert: {
          request_id: string
          user_id: string
          last_read_at?: string
        }
        Update: {
          request_id?: string
          user_id?: string
          last_read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_read_states_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_read_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          org_id: string
          title: string
          body: string | null
          type: NotificationType
          read: boolean
          request_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          title: string
          body?: string | null
          type?: NotificationType
          read?: boolean
          request_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string
          title?: string
          body?: string | null
          type?: NotificationType
          read?: boolean
          request_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      request_status: RequestStatus
    }
  }
}

// Convenience type aliases
export type OrgRow = Database['public']['Tables']['organizations']['Row']
export type OrgUpdate = Database['public']['Tables']['organizations']['Update']
export type UserRow = Database['public']['Tables']['users']['Row']
export type RequestRow = Database['public']['Tables']['requests']['Row']
export type AttachmentRow = Database['public']['Tables']['attachments']['Row']
export type RequestActivityRow = Database['public']['Tables']['request_activity']['Row']
export type RequestActivityInsert = Database['public']['Tables']['request_activity']['Insert']
export type RequestTimeEntryRow = Database['public']['Tables']['request_time_entries']['Row']
export type RequestCommentRow = Database['public']['Tables']['request_comments']['Row']
export type RequestReadStateRow = Database['public']['Tables']['request_read_states']['Row']
export type NotificationRow = Database['public']['Tables']['notifications']['Row']

export type RequestCommentWithSender = RequestCommentRow & {
  sender?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
}

export type RequestInsert = Database['public']['Tables']['requests']['Insert']
export type RequestUpdate = Database['public']['Tables']['requests']['Update']
export type AttachmentInsert = Database['public']['Tables']['attachments']['Insert']

// Extended types with joins
export type RequestWithClient = RequestRow & {
  users: Pick<UserRow, 'id' | 'full_name' | 'email' | 'avatar_url'>
}

export type RequestWithDetails = RequestRow & {
  attachments?: AttachmentRow[]
  activity?: (RequestActivityRow & { actor?: Pick<UserRow, 'full_name' | 'email'> | null })[]
  users?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'avatar_url'>
}
