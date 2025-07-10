import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// Get these from your Supabase project dashboard at https://app.supabase.com
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  dietary_restrictions: string[];
  skill_level: string;
  pantry_items: string[];
  created_at: string;
  updated_at: string;
} 