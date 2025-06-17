import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://ijpsqavaudwyphjvtwdt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHNxYXZhdWR3eXBoanZ0d2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzE0NjAsImV4cCI6MjA0ODU0NzQ2MH0.VQdh9RcNNta2OLMxFeaGHjN99V4LkRp8C4LPJvO-5Bc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
