import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://ijpsqavaudwyphjvtwdt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHNxYXZhdWR3eXBoanZ0d2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDU4MjEsImV4cCI6MjA2NDEyMTgyMX0.WmVxbZM7cxRQr4ey3XyTUvyLt1_N_wJw-GBcnylzEqs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
