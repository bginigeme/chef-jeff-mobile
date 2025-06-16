import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// Get these from your Supabase project dashboard at https://app.supabase.com
const supabaseUrl = 'https://ijpsqavaudwyphjvtwdt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHNxYXZhdWR3eXBoanZ0d2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDU4MjEsImV4cCI6MjA2NDEyMTgyMX0.WmVxbZM7cxRQr4ey3XyTUvyLt1_N_wJw-GBcnylzEqs';

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