import { supabase } from './supabase'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

export interface GoogleAuthResult {
  success: boolean
  session?: any
  error?: string
}

export class GoogleAuthService {
  static async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      // Get the redirect URI for Expo
      const redirectUri = Linking.createURL('auth/callback')
      
      // Start the OAuth flow with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri
        }
      })
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      // Open the returned URL in a browser
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUri)
        // After redirect, Supabase will handle the session
        return { success: true }
      }
      return { success: false, error: 'No URL returned from Supabase' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
