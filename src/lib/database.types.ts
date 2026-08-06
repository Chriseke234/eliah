// =============================================================================
// Database Types — generated from Supabase schema
// Re-generate with: npx supabase gen types typescript --project-id <your-id> > src/lib/database.types.ts
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

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          created_at?: string
        }
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
export type UserRow = Database['public']['Tables']['users']['Row']
export type RequestRow = Database['public']['Tables']['requests']['Row']
export type AttachmentRow = Database['public']['Tables']['attachments']['Row']
export type NotificationRow = Database['public']['Tables']['notifications']['Row']

export type RequestInsert = Database['public']['Tables']['requests']['Insert']
export type RequestUpdate = Database['public']['Tables']['requests']['Update']
export type AttachmentInsert = Database['public']['Tables']['attachments']['Insert']

// Extended types with joins
export type RequestWithClient = RequestRow & {
  users: Pick<UserRow, 'id' | 'full_name' | 'email' | 'avatar_url'>
}

export type RequestWithAttachments = RequestRow & {
  attachments: AttachmentRow[]
  users: Pick<UserRow, 'id' | 'full_name' | 'email'>
}
