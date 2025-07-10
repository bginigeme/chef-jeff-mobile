# Supabase OAuth Configuration Guide

## 🔧 **Current Issue:**
Google OAuth works but session isn't being set because the redirect URI isn't properly configured for your environment.

## 📱 **Environment-Specific Configuration:**

### **Option 1: For Expo Go (Development)**
If you're using `expo start` (Expo Go):

**In Supabase Dashboard:**
1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: `exp://192.168.1.198:8081`
3. **Redirect URLs**: 
   ```
   exp://192.168.1.198:8081/--/auth/callback
   exp://192.168.1.198:8081
   ```

**In Google Cloud Console:**
- **Authorized redirect URIs**: `https://ijpsqavaudwyphjvtwdt.supabase.co/auth/v1/callback`

### **Option 2: For Development Build (Recommended)**
If you're using `expo run:ios` or `expo run:android`:

**In Supabase Dashboard:**
1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: `chef-jeff-simple://`
3. **Redirect URLs**: 
   ```
   chef-jeff-simple://auth/callback
   chef-jeff-simple://
   ```

**In Google Cloud Console:**
- **Authorized redirect URIs**: `https://ijpsqavaudwyphjvtwdt.supabase.co/auth/v1/callback`

## 🚀 **Quick Fix for Expo Go:**

Update your `googleAuth.ts` to use the Expo Go URL:

```typescript
// For Expo Go development
const redirectUri = 'exp://192.168.1.198:8081/--/auth/callback'
```

## 🎯 **Recommended Solution:**

**Use a development build** for proper OAuth testing:

```bash
# Install development build
npx expo install expo-dev-client

# Run on device/simulator
npx expo run:ios
# or
npx expo run:android
```

This will use your custom scheme `chef-jeff-simple://` and work properly with OAuth.

## 🔍 **Current Status:**
- ✅ OAuth flow completes
- ✅ Redirect URI is correct
- ❌ Session not being set (redirect not working in Expo Go)

## 🧪 **Test Steps:**
1. Update Supabase configuration with correct URLs
2. Try OAuth again
3. Check if session is set
4. If still not working, switch to development build

The issue is that Expo Go doesn't support custom URL schemes, so the redirect back to your app isn't working. 