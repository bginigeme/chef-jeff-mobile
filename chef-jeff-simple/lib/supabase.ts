import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://ijpsqavaudwyphjvtwdt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHNxYXZhdWR3eXBoanZ0d2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDU4MjEsImV4cCI6MjA2NDEyMTgyMX0.WmVxbZM7cxRQr4ey3XyTUvyLt1_N_wJw-GBcnylzEqs'

// Direct REST API calls to avoid WebSocket issues
export const supabaseAuth = {
  signInWithPassword: async (email: string, password: string) => {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
    
    const data = await response.json()
    console.log('Auth API response status:', response.status)
    console.log('Auth API response:', data)
    
    if (!response.ok) {
      throw new Error(data.error_description || data.message || 'Authentication failed')
    }
    
    return data
  },

  signUp: async (email: string, password: string) => {
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
    
    const data = await response.json()
    console.log('Signup API response status:', response.status)
    console.log('Signup API response:', data)
    
    if (!response.ok) {
      throw new Error(data.error_description || data.message || 'Sign up failed')
    }
    
    return data
  },

  signOut: async (accessToken: string) => {
    const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error_description || data.message || 'Sign out failed')
    }
    
    return { success: true }
  }
}

// Database operations
export const supabaseDb = {
  from: (table: string) => ({
    select: async (columns: string = '*', accessToken?: string) => {
      const headers: any = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
        method: 'GET',
        headers,
      })
      
      const data = await response.json()
      console.log('DB select response status:', response.status)
      console.log('DB select response:', data)
      
      if (!response.ok) {
        return { data: null, error: data }
      }
      
      return { data, error: null }
    },

    insert: async (values: any, accessToken?: string) => {
      const headers: any = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Prefer': 'return=representation',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(values),
      })
      
      const data = await response.json()
      console.log('DB insert response status:', response.status)
      console.log('DB insert response:', data)
      
      if (!response.ok) {
        return { data: null, error: data }
      }
      
      return { data, error: null }
    },

    update: async (values: any, filter: string, accessToken?: string) => {
      const headers: any = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Prefer': 'return=representation',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(values),
      })
      
      const data = await response.json()
      console.log('DB update response status:', response.status)
      console.log('DB update response:', data)
      
      if (!response.ok) {
        return { data: null, error: data }
      }
      
      return { data, error: null }
    }
  })
}
