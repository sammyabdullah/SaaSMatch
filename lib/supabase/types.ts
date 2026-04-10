/**
 * Hand-written TypeScript types that mirror the Supabase schema.
 *
 * Once you have a live Supabase project, replace this file with the
 * generated output from:
 *   npx supabase gen types typescript --project-id <your-project-id> > lib/supabase/types.ts
 */

export type UserRole = 'founder' | 'investor' | 'admin'
export type FounderStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b'
export type ArrRange = '0-500k' | '500k-2m' | '2m-5m' | '5m-plus'
export type GtmMotion = 'sales-led' | 'product-led' | 'hybrid'
export type RevenueModel = 'seat-based' | 'usage-based' | 'platform-fee' | 'other'
export type FounderStatus = 'pending' | 'active' | 'expired' | 'closed'
export type MatchStatus = 'active' | 'responded' | 'expired' | 'closed'
export type FlagSide = 'founder' | 'investor'

export interface Database {
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
      }

      founder_profiles: {
        Row: {
          id: string
          company_name: string
          location: string
          founded_year: number
          stage: FounderStage
          arr_range: ArrRange
          arr_exact: number | null
          mom_growth_pct: number
          nrr_pct: number
          acv_usd: number
          gtm_motion: GtmMotion
          revenue_model: RevenueModel
          raising_amount_usd: number
          wants_lead: boolean
          wants_board_seat: boolean
          check_size_min_usd: number
          check_size_max_usd: number
          geography_preference: string
          why_now: string
          product_categories: string[]
          status: FounderStatus
          profile_expires_at: string | null
          is_approved: boolean
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
          mom_growth_pct: number
          nrr_pct: number
          acv_usd: number
          gtm_motion: GtmMotion
          revenue_model: RevenueModel
          raising_amount_usd: number
          wants_lead?: boolean
          wants_board_seat?: boolean
          check_size_min_usd: number
          check_size_max_usd: number
          geography_preference: string
          why_now: string
          product_categories?: string[]
          status?: FounderStatus
          profile_expires_at?: string | null
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['founder_profiles']['Insert'], 'id'>>
      }

      investor_profiles: {
        Row: {
          id: string
          firm_name: string
          partner_name: string
          location: string
          check_size_min_usd: number
          check_size_max_usd: number
          stages: FounderStage[]
          leads_rounds: boolean
          takes_board_seat: boolean
          geography_focus: string
          saas_subcategories: string[]
          arr_sweet_spot_min: number
          arr_sweet_spot_max: number
          thesis_statement: string
          value_beyond_capital: string
          typical_response_days: number
          is_approved: boolean
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          firm_name: string
          partner_name: string
          location: string
          check_size_min_usd: number
          check_size_max_usd: number
          stages?: FounderStage[]
          leads_rounds?: boolean
          takes_board_seat?: boolean
          geography_focus: string
          saas_subcategories?: string[]
          arr_sweet_spot_min: number
          arr_sweet_spot_max: number
          thesis_statement: string
          value_beyond_capital: string
          typical_response_days: number
          is_approved?: boolean
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['investor_profiles']['Insert'], 'id'>>
      }

      flags: {
        Row: {
          id: string
          founder_id: string
          investor_id: string
          flagged_by: FlagSide
          created_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          investor_id: string
          flagged_by: FlagSide
          created_at?: string
        }
        Update: never
      }

      matches: {
        Row: {
          id: string
          founder_id: string
          investor_id: string
          matched_at: string
          investor_responded_at: string | null
          response_deadline: string
          status: MatchStatus
          created_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          investor_id: string
          matched_at?: string
          investor_responded_at?: string | null
          response_deadline: string
          status?: MatchStatus
          created_at?: string
        }
        Update: {
          investor_responded_at?: string | null
          status?: MatchStatus
        }
      }

      investor_warnings: {
        Row: {
          id: string
          investor_id: string
          reason: string
          issued_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          investor_id: string
          reason: string
          issued_at?: string
          resolved_at?: string | null
        }
        Update: {
          resolved_at?: string | null
        }
      }
    }

    Functions: {
      fn_expire_founder_profiles: {
        Args: Record<string, never>
        Returns: number
      }
      fn_expire_matches_and_warn: {
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
      match_status: MatchStatus
      flag_side: FlagSide
    }
  }
}
