export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      catalogs: {
        Row: {
          id: string
          user_id: string
          file_url: string
          original_filename: string
          file_type: string
          status: 'pending' | 'processing' | 'completed' | 'error'
          extraction_result: Json | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_url: string
          original_filename: string
          file_type: string
          status?: 'pending' | 'processing' | 'completed' | 'error'
          extraction_result?: Json | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_url?: string
          original_filename?: string
          file_type?: string
          status?: 'pending' | 'processing' | 'completed' | 'error'
          extraction_result?: Json | null
          error_message?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          catalog_id: string | null
          name: string
          category: string
          brand: string | null
          dosage: string | null
          price: number
          extracted_price_text: string | null
          description: string | null
          image_url: string | null
          status: 'review' | 'approved' | 'rejected'
          confidence_score: number | null
          source_type: string
          created_at: string
          updated_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          catalog_id?: string | null
          name: string
          category: string
          brand?: string | null
          dosage?: string | null
          price: number
          extracted_price_text?: string | null
          description?: string | null
          image_url?: string | null
          status?: 'review' | 'approved' | 'rejected'
          confidence_score?: number | null
          source_type: string
          created_at?: string
          updated_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          catalog_id?: string | null
          name?: string
          category?: string
          brand?: string | null
          dosage?: string | null
          price?: number
          extracted_price_text?: string | null
          description?: string | null
          image_url?: string | null
          status?: 'review' | 'approved' | 'rejected'
          confidence_score?: number | null
          source_type?: string
          created_at?: string
          updated_at?: string
          approved_at?: string | null
        }
      }
      generated_contents: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          type: 'post' | 'story' | 'carousel' | 'catalog' | 'video'
          title: string
          caption: string
          hashtags: string
          cta: string
          video_script: string | null
          content_data: Json | null
          art_url: string | null
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          type: 'post' | 'story' | 'carousel' | 'catalog' | 'video'
          title: string
          caption: string
          hashtags: string
          cta: string
          video_script?: string | null
          content_data?: Json | null
          art_url?: string | null
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          type?: 'post' | 'story' | 'carousel' | 'catalog' | 'video'
          title?: string
          caption?: string
          hashtags?: string
          cta?: string
          video_script?: string | null
          content_data?: Json | null
          art_url?: string | null
          scheduled_for?: string | null
          created_at?: string
        }
      }
      content_products: {
        Row: {
          content_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          content_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          content_id?: string
          product_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      catalog_status: 'pending' | 'processing' | 'completed' | 'error'
      product_status: 'review' | 'approved' | 'rejected'
      content_type: 'post' | 'story' | 'carousel' | 'catalog' | 'video'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
