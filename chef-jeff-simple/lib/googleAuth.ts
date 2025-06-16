import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { supabaseAuth } from './supabase'

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession()

export interface GoogleAuthResult {
  success: boolean
  session?: any
  error?: string
}

export class GoogleAuthService {
  static async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      // Use Supabase's Google OAuth - no client ID needed, Supabase handles it
      const redirectUri = AuthSession.makeRedirectUri()

      console.log('🚀 Starting Supabase Google OAuth...')
      console.log('🔗 Redirect URI:', redirectUri)

      // Use Supabase's OAuth endpoint - it handles Google OAuth configuration
      const supabaseUrl = 'https://ijpsqavaudwyphjvtwdt.supabase.co'
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`

      console.log('🌐 Supabase Auth URL:', authUrl)

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)

      console.log('📱 Auth result type:', result.type)

      if (result.type === 'success') {
        console.log('✅ Auth successful, processing result...')
        const url = result.url
        console.log('🔍 Result URL:', url)
        
        // Parse the URL fragment (after #) instead of query params
        // Supabase returns tokens in the fragment: exp://...#access_token=...&refresh_token=...
        const urlObj = new URL(url)
        const fragment = urlObj.hash.substring(1) // Remove the # character
        const params = new URLSearchParams(fragment)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const expiresAt = params.get('expires_at')
        const error = params.get('error')
        const errorDescription = params.get('error_description')
        
        console.log('🔑 Access token found:', accessToken ? 'Yes' : 'No')
        console.log('🔄 Refresh token found:', refreshToken ? 'Yes' : 'No')
        
        if (error) {
          console.error('❌ OAuth error:', error, errorDescription)
          throw new Error(`OAuth error: ${error} - ${errorDescription}`)
        }
        
        if (!accessToken) {
          console.error('❌ No access token received')
          console.log('📋 Available fragment params:', Array.from(params.entries()))
          throw new Error('No access token received from Supabase')
        }

        console.log('🎯 Getting user data from JWT token...')
        
        // Decode the JWT access token to get user data (no API call needed)
        // JWT format: header.payload.signature
        try {
          const tokenParts = accessToken.split('.')
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT format')
          }
          
          // Decode the payload (second part)
          const payload = JSON.parse(atob(tokenParts[1]))
          
          const userData = {
            id: payload.sub,
            email: payload.email,
            user_metadata: payload.user_metadata || {}
          }
          
          console.log('👤 User data decoded from JWT:', userData.email)
          console.log('📧 Email:', userData.email)
          console.log('👨‍💼 Full name:', userData.user_metadata.full_name)

          console.log('✅ Supabase Google OAuth complete!')
          
          return {
            success: true,
            session: {
              access_token: accessToken,
              refresh_token: refreshToken,
              user: userData,
            },
          }
        } catch (decodeError) {
          console.error('❌ Failed to decode JWT:', decodeError)
          throw new Error('Failed to decode user data from access token')
        }
      } else if (result.type === 'cancel') {
        console.log('🚫 User cancelled authentication')
        return {
          success: false,
          error: 'User cancelled the authentication',
        }
      } else {
        console.log('❌ Authentication failed with type:', result.type)
        return {
          success: false,
          error: 'Authentication failed',
        }
      }
    } catch (error: any) {
      console.error('💥 Supabase Google auth error:', error)
      return {
        success: false,
        error: error.message || 'Authentication failed',
      }
    }
  }
}

// Alternative simpler implementation using Supabase's built-in OAuth
// This requires configuring your Supabase project with Google OAuth
export class SupabaseGoogleAuth {
  static async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      // This would work if you have Supabase OAuth configured
      // But requires more complex setup with custom URL schemes
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'chef-jeff-simple',
      })

      // Get your Supabase URL and redirect to OAuth
      const supabaseUrl = 'https://ijpsqavaudwyphjvtwdt.supabase.co'
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)

      if (result.type === 'success') {
        // Parse the URL to get the session tokens
        const url = result.url
        const urlParams = new URL(url).searchParams
        
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        
        if (accessToken) {
          return {
            success: true,
            session: {
              access_token: accessToken,
              refresh_token: refreshToken,
            },
          }
        }
      }

      return {
        success: false,
        error: 'Failed to get session from Supabase',
      }
    } catch (error: any) {
      console.error('Supabase Google auth error:', error)
      return {
        success: false,
        error: error.message || 'Authentication failed',
      }
    }
  }
} 
 
 