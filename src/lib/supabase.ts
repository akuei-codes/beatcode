
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fvbmckogcizaxdnlsrto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Ym1ja29nY2l6YXhkbmxzcnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMDUzODcsImV4cCI6MjA1ODg4MTM4N30.-t69uwAO88KufYBYi24v1eolbHw6ks7cR2IqX1lISW4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  rating: number;
  created_at: string;
};

export type Battle = {
  id: string;
  creator_id: string;
  defender_id: string | null;
  language: string;
  difficulty: string;
  duration: number;
  is_rated: boolean;
  status: 'waiting' | 'in_progress' | 'completed';
  start_time: string | null;
  end_time: string | null;
  problem_id: string;
  winner_id: string | null;
  created_at: string;
};

export type Solution = {
  id: string;
  battle_id: string;
  user_id: string;
  code: string;
  submitted_at: string;
};
