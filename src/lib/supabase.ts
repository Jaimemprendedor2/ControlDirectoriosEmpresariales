import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface Meeting {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string | null
  is_active: boolean
}

export interface MeetingStage {
  id: string
  meeting_id: string
  title: string
  duration: number // en segundos
  order_index: number
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface MeetingSession {
  id: string
  meeting_id: string
  started_at: string
  ended_at?: string
  current_stage_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StageProgress {
  id: string
  session_id: string
  stage_id: string
  started_at: string
  ended_at?: string
  time_spent: number // en segundos
  is_completed: boolean
  created_at: string
  updated_at: string
}
