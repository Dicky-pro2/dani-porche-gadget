export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      dpg_products: {
        Row: {
          id: string
          slug: string
          name: string
          brand: string
          category: string
          description: string
          image: string
          reference: string
          badge: string | null
          colors: string[]
          specs: string[]
          price: number | null
          stock: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          brand: string
          category: string
          description: string
          image: string
          reference?: string
          badge?: string | null
          colors?: string[]
          specs?: string[]
          price?: number | null
          stock?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          brand?: string
          category?: string
          description?: string
          image?: string
          reference?: string
          badge?: string | null
          colors?: string[]
          specs?: string[]
          price?: number | null
          stock?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
