/**
 * Hand-written Database type for UnlockedVC.
 * Replace with the generated output once you have a live project:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'founder' | 'investor' | 'lender' | 'admin'
export type FounderStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b'
export type ArrRange = '0-500k' | '500k-2m' | '2m-5m' | '5m-plus'
export type GtmMotion = 'sales-led' | 'product-led' | 'hybrid'
export type RevenueModel = 'seat-based' | 'usage-based' | 'platform-fee' | 'other'
export type FounderStatus = 'pending' | 'active' | 'expired' | 'closed'
export type FlagSide = 'founder' | 'investor'
export type FlagStatus = 'pending' | 'accepted' | 'declined'
export type LenderFlagSide = 'founder' | 'lender'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          email: string
          created_at: string
        }
        Insert: {
          id: string
          role: UserRole
          email: string
          created_at?: string
        }
        Update: {
          role?: UserRole
          email?: string
        }
        Relationships: []
      }

      founder_profiles: {
        Row: {
          id: string
          company_name: string
          website: string | null
          location: string
          founded_year: number
          stage: FounderStage
          arr_range: ArrRange
          arr_exact: number | null
          mom_growth_pct: number | null
          nrr_pct: number | null
          acv_usd: number | null
          gtm_motion: GtmMotion
          revenue_model: RevenueModel
          raising_amount_usd: number
          why_now: string
          product_categories: string[]
          status: FounderStatus
          profile_expires_at: string | null
          is_approved: boolean
          approved_at: string | null
          clock_restarted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name: string
          location: string
          founded_year: number
          stage: FounderStage
          arr_range: ArrRange
          arr_exact?: number | null
          mom_growth_pct?: number | null
          nrr_pct?: number | null
          acv_usd?: number | null
          gtm_motion: GtmMotion
          revenue_model: RevenueModel
          raising_amount_usd: number
          why_now: string
          website?: string | null
          product_categories?: string[]
          status?: FounderStatus
          profile_expires_at?: string | null
          is_approved?: boolean
          approved_at?: string | null
          clock_restarted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          location?: string
          founded_year?: number
          stage?: FounderStage
          arr_range?: ArrRange
          arr_exact?: number | null
          mom_growth_pct?: number | null
          nrr_pct?: number | null
          acv_usd?: number | null
          gtm_motion?: GtmMotion
          revenue_model?: RevenueModel
          raising_amount_usd?: number
          why_now?: string
          product_categories?: string[]
          status?: FounderStatus
          profile_expires_at?: string | null
          is_approved?: boolean
          approved_at?: string | null
          clock_restarted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'founder_profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      investor_profiles: {
        Row: {
          id: string
          firm_name: string
          partner_name: string
          website: string | null
          location: string
          check_size_min_usd: number
          check_size_max_usd: number
          stages: FounderStage[]
          leads_rounds: boolean
          geography_focus: string
          saas_subcategories: string[]
          arr_sweet_spot_min: number
          arr_sweet_spot_max: number
          thesis_statement: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          firm_name: string
          partner_name: string
          website?: string | null
          location: string
          check_size_min_usd: number
          check_size_max_usd: number
          stages?: FounderStage[]
          leads_rounds?: boolean
          geography_focus: string
          saas_subcategories?: string[]
          arr_sweet_spot_min: number
          arr_sweet_spot_max: number
          thesis_statement: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          firm_name?: string
          partner_name?: string
          website?: string | null
          location?: string
          check_size_min_usd?: number
          check_size_max_usd?: number
          stages?: FounderStage[]
          leads_rounds?: boolean
          geography_focus?: string
          saas_subcategories?: string[]
          arr_sweet_spot_min?: number
          arr_sweet_spot_max?: number
          thesis_statement?: string
          is_approved?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'investor_profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      flags: {
        Row: {
          id: string
          founder_id: string
          investor_id: string
          flagged_by: FlagSide
          status: FlagStatus
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          investor_id: string
          flagged_by: FlagSide
          status?: FlagStatus
          created_at?: string
        }
        Update: {
          status?: FlagStatus
          responded_at?: string | null
        }
        Relationships: []
      }

      profile_views: {
        Row: {
          id: string
          investor_id: string
          founder_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          investor_id: string
          founder_id: string
          viewed_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }

      lender_profiles: {
        Row: {
          id: string
          institution_name: string
          contact_name: string
          website: string | null
          location: string
          loan_size_min_usd: number
          loan_size_max_usd: number
          loan_types: string[]
          stages: string[]
          geography_focus: string
          saas_subcategories: string[]
          arr_min_requirement: number
          arr_max_sweet_spot: number
          thesis_statement: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          institution_name: string
          contact_name: string
          website?: string | null
          location: string
          loan_size_min_usd: number
          loan_size_max_usd: number
          loan_types?: string[]
          stages?: string[]
          geography_focus: string
          saas_subcategories?: string[]
          arr_min_requirement: number
          arr_max_sweet_spot: number
          thesis_statement: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          institution_name?: string
          contact_name?: string
          website?: string | null
          location?: string
          loan_size_min_usd?: number
          loan_size_max_usd?: number
          loan_types?: string[]
          stages?: string[]
          geography_focus?: string
          saas_subcategories?: string[]
          arr_min_requirement?: number
          arr_max_sweet_spot?: number
          thesis_statement?: string
          is_approved?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lender_profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      lender_flags: {
        Row: {
          id: string
          founder_id: string
          lender_id: string
          flagged_by: LenderFlagSide
          status: FlagStatus
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          lender_id: string
          flagged_by: LenderFlagSide
          status?: FlagStatus
          created_at?: string
        }
        Update: {
          status?: FlagStatus
          responded_at?: string | null
        }
        Relationships: []
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      fn_expire_founder_profiles: {
        Args: Record<string, never>
        Returns: number
      }
      auth_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
    }

    Enums: {
      user_role: UserRole
      founder_stage: FounderStage
      arr_range: ArrRange
      gtm_motion: GtmMotion
      revenue_model: RevenueModel
      founder_status: FounderStatus
      flag_side: FlagSide
      lender_flag_side: LenderFlagSide
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}
