import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Modal, Image } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { supabase } from './lib/supabase'
import { getProfile, createProfile, updatePantryItems, Profile } from './lib/database'
import { aiRecipeGenerator, AIRecipe, RecipeRequest } from './lib/aiRecipeService'
import { AIRecipeCard } from './components/AIRecipeCard'
import { AIRecipeDetailModal } from './components/AIRecipeDetailModal'
import { SplashScreen as CustomSplashScreen } from './components/SplashScreen'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import { RecipeCustomizationModal } from './components/RecipeCustomizationModal'
import { RecipeHistoryService, RecipeHistoryItem } from './lib/recipeHistory'
import { PantryManager } from './components/PantryManager'
import { UserPreferencesService } from './lib/userPreferences'
import { ProfilePage } from './components/ProfilePage'
import { WeeklyMealTracker } from './components/WeeklyMealTracker'
import { WeeklyMealData } from './lib/mealTracker'
import { fastRecipeGenerator } from './lib/fastRecipeGenerator'
import { enhancedFastRecipeGenerator } from './lib/enhancedFastRecipeGenerator'
import { recipeSyncService } from './lib/recipeSync'
import { CachedRecipeService } from './lib/cachedRecipeService'
import { IngredientPatternsService } from './lib/ingredientPatternsService'
import { ChefHatIcon } from './components/ChefHatIcon'
import { GoogleAuthService } from './lib/googleAuth'

// Development mode check
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development'

// Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync()
} catch (error) {
  console.log('⚠️ SplashScreen not available, continuing...')
}

// Helper function to log errors without showing them to users
const logError = (context: string, error: any) => {
  // Only log errors in development mode
  if (isDevelopment) {
    console.log(`ℹ️ ${context}: ${error.message || error}`)
  }
}

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('🚨 App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Chef Jeff Encountered an Issue</Text>
          <Text style={styles.errorText}>Please restart the app to continue cooking!</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}

interface Session {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

function MainApp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recipes, setRecipes] = useState<{ pantryOnly: AIRecipe | null; enhanced: AIRecipe | null }>({ pantryOnly: null, enhanced: null })
  const [recipeHistory, setRecipeHistory] = useState<RecipeHistoryItem[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<AIRecipe | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)
  const [generatingRecipe, setGeneratingRecipe] = useState(false)
  const [currentTab, setCurrentTab] = useState<'generate' | 'history'>('generate')
  // FUTURE: Uncomment for Inspire Me feature
  // const [recipeMode, setRecipeMode] = useState<'pantry' | 'explore'>('pantry')
  const [setupForm, setSetupForm] = useState({
    firstName: '',
    lastName: '',
    pantryItems: ''
  })
  const [recipeRatings, setRecipeRatings] = useState<{ [key: string]: 'like' | 'dislike' | null }>({})
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [recentlyShownRecipeIds, setRecentlyShownRecipeIds] = useState<string[]>([])
  const [lastProfessionalButtonTap, setLastProfessionalButtonTap] = useState(0)

  useEffect(() => {
    checkForPasswordReset()
    checkStoredSession()
    
    // Force refresh local database to get updated image URLs
    import('./lib/localRecipeDatabase').then(({ localRecipeDatabase }) => {
      localRecipeDatabase.forceRefreshDatabase().catch((error: any) => {
        console.log('Failed to refresh local database:', error.message)
      })
    })
    
    // Start background sync after a short delay
    setTimeout(() => {
      recipeSyncService.smartSync().catch(error => {
        console.log('Background sync failed (this is normal without API key):', error.message)
      })
    }, 2000)
  }, [])

  const checkForPasswordReset = async () => {
    try {
      const url = await Linking.getInitialURL()
      if (url) {
        const parsedUrl = Linking.parse(url)
        const params = parsedUrl.queryParams as any
        
        if (params?.type === 'recovery' && params?.access_token && params?.refresh_token) {
          // This is a password reset link
          setSession({
            access_token: params.access_token,
            user: { id: '', email: '' } // We'll get user info after setting session
          })
          setShowPasswordReset(true)
          return true // Indicate we found a reset link
        }
      }
    } catch (error) {
      logError('Error checking for password reset', error)
    }
    return false
  }

  const handleResetPasswordSubmit = async () => {
    if (!resetPassword || !resetConfirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (resetPassword !== resetConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (resetPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    try {
      setResetPasswordLoading(true)
      
      // Update password using Supabase REST API
      const response = await fetch(`https://ijpsqavaudwyphjvtwdt.supabase.co/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHNxYXZhdWR3eXBoanZ0d2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDU4MjEsImV4cCI6MjA2NDEyMTgyMX0.WmVxbZM7cxRQr4ey3XyTUvyLt1_N_wJw-GBcnylzEqs',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          password: resetPassword,
        }),
      })

      if (response.ok) {
        Alert.alert(
          'Password Updated!',
          'Your password has been successfully updated. Please sign in with your new password.',
          [{ 
            text: 'OK', 
            onPress: () => {
              setShowPasswordReset(false)
              setSession(null)
              setResetPassword('')
              setResetConfirmPassword('')
            }
          }]
        )
      } else {
        const data = await response.json()
        throw new Error(data.error_description || data.message || 'Failed to update password')
      }
    } catch (error: any) {
      logError('Reset password error', error)
      Alert.alert('Error', error.message)
    } finally {
      setResetPasswordLoading(false)
    }
  }

  const checkStoredSession = async () => {
    try {
      // Skip session check if we're in password reset mode
      if (showPasswordReset) {
        setInitialLoading(false)
        try {
          await SplashScreen.hideAsync()
        } catch (error) {
          // SplashScreen might not be available
        }
        return
      }

      const storedSession = await AsyncStorage.getItem('session')
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession)
        
        // Validate the session by trying to fetch the profile
        try {
          const testProfile = await getProfile(parsedSession.user.id)
          // If successful, the session is valid
          setSession(parsedSession)
        } catch (sessionError: any) {
          // Session is invalid (likely expired), clear it
          console.log('🔄 Stored session is invalid (expired), clearing it')
          await AsyncStorage.removeItem('session')
          // Don't set the session, user will see login screen
        }
      }
    } catch (error) {
      console.log('No stored session found or validation failed')
      // Clear any corrupted session data
      try {
        await AsyncStorage.removeItem('session')
      } catch (clearError) {
        // Ignore cleanup errors
      }
    }
    
    setInitialLoading(false)
    try {
      await SplashScreen.hideAsync()
    } catch (error) {
      // SplashScreen might not be available
    }
  }

  const handleSplashFinish = () => {
    setShowSplash(false)
  }

  const storeSession = async (sessionData: Session) => {
    try {
      await AsyncStorage.setItem('session', JSON.stringify(sessionData))
    } catch (error) {
      logError('Failed to store session', error)
    }
  }

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('session')
    } catch (error) {
      logError('Failed to clear session', error)
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadUserProfile()
    }
  }, [session])

  useEffect(() => {
    if (profile) {
      loadRecipeHistory()
    }
  }, [profile])

  const loadUserProfile = async (showSetupIfMissing: boolean = false) => {
    if (!session?.user) return

    try {
      const userProfile = await getProfile(session.user.id)
      if (userProfile) {
        setProfile(userProfile)
      } else if (showSetupIfMissing) {
        // Only show setup modal if explicitly requested (after sign in/up)
        setShowSetupModal(true)
      }
      // If no profile and showSetupIfMissing is false, just don't set profile (user will see sign-in screen)
    } catch (error: any) {
      logError('Error loading user profile', error)
      
      // If profile loading fails completely, we can't continue
      // Show the setup modal to let the user try again
      if (showSetupIfMissing) {
        setShowSetupModal(true)
      }
    } finally {
      try {
        await SplashScreen.hideAsync()
      } catch (error: any) {
        logError('Profile loading failed with error', error)
      }
    }
  }

  const loadRecipeHistory = async () => {
    try {
      const history = await RecipeHistoryService.getHistory()
      setRecipeHistory(history || [])
    } catch (error) {
      logError('Failed to load recipe history', error)
    }
  }

  const generateAIRecipes = async (customRequest?: RecipeRequest) => {
    // Require pantry items for recipe generation
    if (!profile || profile.pantry_items.length === 0) return
    
    // Import ingredient validation
    const { IngredientDatabase } = await import('./lib/ingredientDatabase')
    
    // Validate pantry composition
    const validation = IngredientDatabase.validatePantryItems(profile.pantry_items)
    if (!validation.valid) {
      Alert.alert(
        'Need More Main Ingredients',
        `You have ${validation.substantiveCount} main ingredient(s) and ${validation.enhancerCount} seasoning(s). Please add at least 2 main ingredients (proteins, vegetables, grains) for recipe generation.\n\n💡 ${validation.suggestions[0] || 'Try adding chicken, rice, or vegetables to your pantry.'}`
      )
      return
    }
    
    // Clear recently shown recipes when switching to AI generation
    setRecentlyShownRecipeIds([])
    console.log('🧹 Cleared recently shown recipes for AI generation')
    console.log('🥄 Generating savory AI recipes with smart caching...')
    console.log('📋 User\'s pantry items:', profile.pantry_items)
    
    setGeneratingRecipe(true)
    
    // Clear existing recipes and show loading state
    setRecipes({ pantryOnly: null, enhanced: null })
    
    try {
      let request: RecipeRequest
      
      // Use pantry-based recipe generation with savory focus
      request = customRequest || {
        pantryIngredients: profile?.pantry_items || [],
        cookingTime: 30,
        servings: 2,
        difficulty: 'Easy',
        specificRequest: 'Create an incredibly savory and mouth-watering dish that will make everyone salivate! Focus on umami-rich flavors, proper seasoning, and irresistible taste.'
      }
      
      // Try cached recipes first for instant results
      const cachedResult = await CachedRecipeService.getFastRecipes(
        request,
        session?.user?.id,
        false // Don't force refresh
      )
      
      if (cachedResult.fromCache) {
        console.log('⚡ Using cached recipes - instant Jeff Style response!')
        
        // Set recipes immediately from cache
        setRecipes({
          pantryOnly: cachedResult.recipes[0] || null,
          enhanced: cachedResult.recipes[1] || null
        })
        
        // Save to history
        for (const recipe of cachedResult.recipes) {
          try {
            await RecipeHistoryService.saveRecipe(recipe)
          } catch (saveError) {
            console.log('ℹ️ Recipe saved locally, history sync will happen later')
          }
        }
        
        await loadRecipeHistory()
        
      } else {
        // Generate new recipes with progressive loading
        const finalRecipes = await aiRecipeGenerator.generateDualPantryRecipesProgressive(
          request, 
          session?.user?.id,
          // Callback for when each recipe is ready
          async (recipeType, recipe) => {
            console.log(`📝 ${recipeType} recipe received:`, recipe.title)
            
            // Map recipe types to our state structure
            const mappedType = recipeType === 'recipe1' ? 'pantryOnly' : 'enhanced'
            
            // Update state immediately when each recipe is ready
            setRecipes(prev => ({
              ...prev,
              [mappedType]: recipe
            }))
            
            // Save to history immediately (with error handling)
            try {
              await RecipeHistoryService.saveRecipe(recipe)
            } catch (saveError) {
              console.log('ℹ️ Recipe saved locally, history sync will happen later')
            }
            
            // If this is the first recipe ready, we can show partial UI feedback
            if (recipeType === 'recipe1') {
              console.log('🎉 First savory recipe ready! User can start reading...')
            }
          }
        )
        
        // Refresh history once both are complete (with error handling)
        try {
          await loadRecipeHistory()
        } catch (historyError) {
          console.log('ℹ️ Recipe history will be available after next app restart')
        }
      }
      
      console.log('✅ All recipes loaded successfully!')
      
    } catch (error: any) {
      console.log('ℹ️ Recipe services temporarily unavailable, using backup system')
      
      // Quick fallback to fast AI recipes
      try {
        console.log('🔄 Quick fallback to AI recipes...')
        const fastRecipe = fastRecipeGenerator.generateProgrammaticRecipe(
          profile.pantry_items,
          { cookingTime: 30, servings: 2, difficulty: 'Easy' }
        )
        
        const convertToAIRecipe = (fastRecipe: any) => ({
          ...fastRecipe,
          nutritionInfo: {
            calories: 300,
            protein: '20g',
            carbs: '30g',
            fat: '12g'
          }
        })
        
        setRecipes({
          pantryOnly: convertToAIRecipe(fastRecipe),
          enhanced: convertToAIRecipe(fastRecipe)
        })
      } catch (fallbackError: any) {
        console.log('ℹ️ All recipe services unavailable, using basic recipe template')
        // Create a very basic fallback recipe
        const basicRecipe: AIRecipe = {
          id: Date.now().toString(),
          title: `Savory ${profile.pantry_items[0] || 'Ingredient'} Delight`,
          description: 'A deliciously savory preparation using your available ingredients with rich, mouth-watering flavors',
          ingredients: profile.pantry_items.slice(0, 3).map(item => ({
            name: item,
            amount: '1',
            unit: 'portion'
          })).concat([
            { name: 'salt', amount: 'to taste', unit: '' },
            { name: 'black pepper', amount: 'to taste', unit: '' },
            { name: 'olive oil', amount: '2', unit: 'tbsp' }
          ]),
          instructions: [
            'Prepare your ingredients with proper knife work for even cooking',
            'Heat olive oil in pan over medium-high heat for optimal searing',
            'Season generously with salt and pepper for deep savory flavors',
            'Cook using high heat to develop rich, golden-brown colors and umami',
            'Taste and adjust seasoning for maximum savory appeal',
            'Serve hot and enjoy the irresistible savory goodness!'
          ],
          cookingTime: 20,
          servings: 2,
          difficulty: 'Easy',
          cuisine: 'Savory Home Cooking',
          tags: ['pantry-only', 'savory', 'mouth-watering'],
          nutritionInfo: {
            calories: 320,
            protein: '18g',
            carbs: '25g',
            fat: '15g'
          }
        }
        
        setRecipes({
          pantryOnly: basicRecipe,
          enhanced: basicRecipe
        })
      }
    }
    
    setGeneratingRecipe(false)
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        throw error;
      }
      if (data && data.session && data.user) {
        const sessionData = {
          access_token: data.session.access_token,
          user: {
            id: data.user.id,
            email: data.user.email ?? '',
          }
        }
        setSession(sessionData)
        await storeSession(sessionData)
        
        // Load profile and show setup if needed
        setTimeout(() => {
          loadUserProfile(true)
        }, 100)
      }
    } catch (err: any) {
      logError('Sign in error', err)
      Alert.alert('Sign In Error', err.message)
    }
    
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        throw error;
      }
      if (data && data.session && data.user) {
        const sessionData = {
          access_token: data.session.access_token,
          user: {
            id: data.user.id,
            email: data.user.email ?? '',
          }
        }
        setSession(sessionData)
        await storeSession(sessionData)
        
        // New users will need to set up their profile
        setTimeout(() => {
          setShowSetupModal(true)
        }, 100)
      } else {
        // For sign up that requires email confirmation
        Alert.alert('Success', 'Please check your email for the confirmation link, then sign in!')
      }
    } catch (err: any) {
      logError('Sign up error', err)
      Alert.alert('Sign Up Error', err.message)
    }
    
    setLoading(false)
  }

  const handleSignOut = async () => {
    if (!session) return
    
    try {
      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      setRecipes({ pantryOnly: null, enhanced: null })
      await clearSession()
    } catch (error: any) {
      logError('Sign out error', error)
      Alert.alert('Error', error.message)
    }
  }

  const handleSetupProfile = async () => {
    if (!session?.user || !setupForm.firstName || !setupForm.lastName) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      const newProfile = await createProfile(session.user.id, session.user.email!, {
        first_name: setupForm.firstName,
        last_name: setupForm.lastName
      })

      if (newProfile && setupForm.pantryItems) {
        const pantryArray = setupForm.pantryItems
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0)
        
        const updatedProfile = await updatePantryItems(session.user.id, pantryArray)
        setProfile(updatedProfile)
      } else {
        setProfile(newProfile)
      }

      setShowSetupModal(false)
      Alert.alert('Success', 'Profile created! Click "Generate Recipe" to get your first AI recipe from Chef Jeff!')
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.')
    }
  }

  const handleViewRecipe = (recipe: AIRecipe) => {
    setSelectedRecipe(recipe)
    setShowRecipeModal(true)
  }

  const handleUpdatePantry = async (newPantryItems: string[]) => {
    if (!session?.user || !profile) return

    try {
      const updatedProfile = await updatePantryItems(session.user.id, newPantryItems)
      if (updatedProfile) {
        // Record ingredient usage patterns for learning (when items are added)
        if (newPantryItems.length > profile.pantry_items.length) {
          try {
            await IngredientPatternsService.recordIngredientUsage(newPantryItems)
          } catch (patternError) {
            console.log('Could not record ingredient patterns:', patternError)
          }
        }
        
        setProfile(updatedProfile)
      }
    } catch (error) {
      logError('Failed to update pantry', error)
    }
  }

  const handleGenerateNewRecipe = () => {
    // Don't clear existing recipes immediately - let users see current recipes while generating new ones
    generateAIRecipes()
  }

  const handleRateRecipe = async (recipe: AIRecipe, rating: 'like' | 'dislike') => {
    if (!session?.user?.id) return
    
    try {
      await UserPreferencesService.rateRecipe(session.user.id, recipe, rating)
      console.log(`Recipe ${rating}d: ${recipe.title}`)
      
      // Show feedback to user
      const message = rating === 'like' 
        ? '❤️ Awesome! Chef Jeff is learning you love this style. More savory recipes like this coming up!'
        : '👎 Got it! Chef Jeff will avoid similar ingredients and flavors in future recipes.'
      
      // Show quick toast-style feedback (you could replace this with a proper toast library)
      Alert.alert('Preference Saved', message)
    } catch (error: any) {
      console.log('ℹ️ Recipe preference saved locally, will sync when online')
      // Don't show error to user, just log it
    }
  }

  // Load recipe ratings when recipes change
  useEffect(() => {
    const loadRatings = async () => {
      if (!session?.user?.id || Object.values(recipes).every(recipe => recipe === null)) return
      
      try {
        const ratings: { [key: string]: 'like' | 'dislike' | null } = {}
        for (const recipe of Object.values(recipes).filter(recipe => recipe !== null)) {
          const rating = await UserPreferencesService.getRating(session.user.id, recipe!.id)
          ratings[recipe!.id] = rating
        }
        setRecipeRatings(ratings)
      } catch (error) {
        console.log('ℹ️ Recipe ratings will load when service is available')
      }
    }
    
    loadRatings()
  }, [recipes, session?.user?.id])

  // Load ratings for recipe history
  useEffect(() => {
    const loadHistoryRatings = async () => {
      if (!session?.user?.id || recipeHistory.length === 0) return
      
      try {
        const ratings: { [key: string]: 'like' | 'dislike' | null } = {}
        for (const recipe of recipeHistory) {
          const rating = await UserPreferencesService.getRating(session.user.id, recipe.id)
          ratings[recipe.id] = rating
        }
        setRecipeRatings(prev => ({ ...prev, ...ratings }))
      } catch (error) {
        console.log('ℹ️ Recipe history ratings will load when service is available')
      }
    }
    
    loadHistoryRatings()
  }, [recipeHistory, session?.user?.id])

  const generateFastRecipes = async () => {
    if (!profile || profile.pantry_items.length === 0) return
    
    // Import ingredient validation
    const { IngredientDatabase } = await import('./lib/ingredientDatabase')
    
    // Validate pantry composition
    const validation = IngredientDatabase.validatePantryItems(profile.pantry_items)
    if (!validation.valid) {
      Alert.alert(
        'Need More Main Ingredients',
        `You have ${validation.substantiveCount} main ingredient(s) and ${validation.enhancerCount} seasoning(s). Please add at least 2 main ingredients (proteins, vegetables, grains) for recipe generation.\n\n💡 ${validation.suggestions[0] || 'Try adding chicken, rice, or vegetables to your pantry.'}`
      )
      return
    }
    
    console.log('Generating instant professional recipes...')
    console.log('Recently shown recipe IDs:', recentlyShownRecipeIds)
    const startTime = performance.now()
    
    try {
      setGeneratingRecipe(true)
      
      // Use instant recipes method for sub-100ms performance
      const instantResults = await enhancedFastRecipeGenerator.getInstantRecipes(
        profile.pantry_items,
        {
          maxResults: 6, // Increased from 4 to get more variety
          maxCookingTime: 45,
          includeSpoonacular: true, // Try cached Spoonacular if available
          includeAI: true, // Include fast AI recipes for instant results
          excludeRecipeIds: recentlyShownRecipeIds // Exclude recently shown recipes
        }
      )
      
      const endTime = performance.now()
      console.log(`⚡ Instant recipes generated in ${Math.round(endTime - startTime)}ms`)
      
      if (instantResults.length === 0) {
        console.log('ℹ️ Instant recipes unavailable, using local alternatives')
        
        // Quick fallback to fast AI recipes
        try {
          console.log('🔄 Quick fallback to AI recipes...')
          const fastRecipe = fastRecipeGenerator.generateProgrammaticRecipe(
            profile.pantry_items,
            { cookingTime: 30, servings: 2, difficulty: 'Easy' }
          )
          
          const convertToAIRecipe = (fastRecipe: any) => ({
            ...fastRecipe,
            nutritionInfo: {
              calories: 300,
              protein: '20g',
              carbs: '30g',
              fat: '12g'
            }
          })
          
          setRecipes({
            pantryOnly: convertToAIRecipe(fastRecipe),
            enhanced: convertToAIRecipe(fastRecipe)
          })
        } catch (fallbackError: any) {
          console.log('ℹ️ All recipe services unavailable, using basic recipe template')
          // Create a very basic fallback recipe
          const basicRecipe: AIRecipe = {
            id: Date.now().toString(),
            title: `Simple ${profile.pantry_items[0] || 'Ingredient'} Dish`,
            description: 'A basic preparation using your available ingredients',
            ingredients: profile.pantry_items.slice(0, 3).map(item => ({
              name: item,
              amount: '1',
              unit: 'portion'
            })),
            instructions: [
              'Prepare your ingredients',
              'Combine using your preferred cooking method',
              'Season to taste and serve'
            ],
            cookingTime: 20,
            servings: 2,
            difficulty: 'Easy',
            cuisine: 'Simple',
            tags: ['pantry-only', 'basic'],
            nutritionInfo: {
              calories: 250,
              protein: '15g',
              carbs: '25g',
              fat: '10g'
            }
          }
          
          setRecipes({
            pantryOnly: basicRecipe,
            enhanced: basicRecipe
          })
        }
      } else {
        // Convert instant results to AIRecipe format
        const convertInstantToAIRecipe = (recipeSource: any): AIRecipe => {
          const recipe = recipeSource.recipe
          const isProfessional = recipeSource.source === 'spoonacular'
          
          const converted = {
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            cookingTime: recipe.cookingTime,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            cuisine: recipe.cuisine,
            tags: [...recipe.tags, isProfessional ? 'spoonacular' : 'fast-ai', isProfessional ? 'professional' : 'instant'],
            imageUrl: recipe.imageUrl,
            imagePrompt: recipe.imagePrompt,
            nutritionInfo: recipe.nutritionInfo || {
              calories: 350,
              protein: '25g',
              carbs: '35g',
              fat: '15g'
            }
          }
          
          // Debug log for image
          if (recipe.title.includes('Chicken Alfredo')) {
            console.log('🖼️ Chicken Alfredo imageUrl:', recipe.imageUrl, '-> converted:', converted.imageUrl)
          }
          
          return converted
        }
        
        // Set the first two recipes
        const firstRecipe = convertInstantToAIRecipe(instantResults[0])
        const secondRecipe = instantResults.length > 1 
          ? convertInstantToAIRecipe(instantResults[1])
          : firstRecipe
        
        setRecipes({
          pantryOnly: firstRecipe,
          enhanced: secondRecipe
        })
        
        // Track the newly shown recipe IDs
        const newlyShownIds = [firstRecipe.id, secondRecipe.id]
        setRecentlyShownRecipeIds(prev => {
          const updated = [...prev, ...newlyShownIds]
          // Keep only the last 8 recipe IDs to prevent the list from growing indefinitely
          // With 5 recipes in local DB, this ensures we cycle through all recipes
          return updated.slice(-8)
        })
        
        console.log('🔄 Newly shown recipes:', newlyShownIds)
        console.log('🔄 Updated recently shown list:', [...recentlyShownRecipeIds, ...newlyShownIds].slice(-8))
        
        // Save to history
        await RecipeHistoryService.saveRecipe(firstRecipe)
        if (instantResults.length > 1) {
          await RecipeHistoryService.saveRecipe(secondRecipe)
        }
        
        await loadRecipeHistory()
        
        const professionalCount = instantResults.filter(r => r.source === 'spoonacular').length
        const aiCount = instantResults.filter(r => r.source === 'fast-generator').length
        
        console.log(`✅ Loaded ${instantResults.length} instant recipes (${professionalCount} professional + ${aiCount} AI) in ${Math.round(endTime - startTime)}ms`)
      }
    } catch (error: any) {
      logError('Error generating instant recipes', error)
      
      // Quick fallback to fast AI recipes
      try {
        console.log('🔄 Quick fallback to AI recipes...')
        const fastRecipe = fastRecipeGenerator.generateProgrammaticRecipe(
          profile.pantry_items,
          { cookingTime: 30, servings: 2, difficulty: 'Easy' }
        )
        
        const convertToAIRecipe = (fastRecipe: any) => ({
          ...fastRecipe,
          nutritionInfo: {
            calories: 300,
            protein: '20g',
            carbs: '30g',
            fat: '12g'
          }
        })
        
        setRecipes({
          pantryOnly: convertToAIRecipe(fastRecipe),
          enhanced: convertToAIRecipe(fastRecipe)
        })
      } catch (fallbackError: any) {
        console.log('ℹ️ All recipe services unavailable, using basic recipe template')
        // Create a very basic fallback recipe
        const basicRecipe: AIRecipe = {
          id: Date.now().toString(),
          title: `Simple ${profile.pantry_items[0] || 'Ingredient'} Dish`,
          description: 'A basic preparation using your available ingredients',
          ingredients: profile.pantry_items.slice(0, 3).map(item => ({
            name: item,
            amount: '1',
            unit: 'portion'
          })),
          instructions: [
            'Prepare your ingredients',
            'Combine using your preferred cooking method',
            'Season to taste and serve'
          ],
          cookingTime: 20,
          servings: 2,
          difficulty: 'Easy',
          cuisine: 'Simple',
          tags: ['pantry-only', 'basic'],
          nutritionInfo: {
            calories: 250,
            protein: '15g',
            carbs: '25g',
            fat: '10g'
          }
        }
        
        setRecipes({
          pantryOnly: basicRecipe,
          enhanced: basicRecipe
        })
      }
    } finally {
      setGeneratingRecipe(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    try {
      setResetLoading(true)
      // Using direct REST API call since we're using the REST API approach
      const response = await fetch(`https://ijpsqavaudwyphjvtwdt.supabase.co/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHNxYXZhdWR3eXBoanZ0d2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDU4MjEsImV4cCI6MjA2NDEyMTgyMX0.WmVxbZM7cxRQr4ey3XyTUvyLt1_N_wJw-GBcnylzEqs',
        },
        body: JSON.stringify({
          email: resetEmail,
        }),
      })

      if (response.ok) {
        Alert.alert(
          'Password Reset Email Sent',
          'Check your email for password reset instructions.',
          [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
        )
        setResetEmail('')
      } else {
        const data = await response.json()
        throw new Error(data.error_description || data.message || 'Failed to send reset email')
      }
    } catch (error: any) {
      logError('Reset password error', error)
      Alert.alert('Error', error.message)
    } finally {
      setResetLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const result = await GoogleAuthService.signInWithGoogle()
      if (!result.success && result.error && !result.error.includes('cancelled')) {
        Alert.alert('Google Sign In Error', result.error)
      }
      // On success, Supabase will handle session
    } catch (error: any) {
      Alert.alert('Google Sign In Error', error.message)
    }
    setGoogleLoading(false)
  }

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  // Show custom splash screen
  if (showSplash) {
    return <CustomSplashScreen onAnimationFinish={handleSplashFinish} />
  }

  // Show password reset screen if needed
  if (showPasswordReset) {
  return (
    <View style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('./assets/images/chef-jeff-transparent.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tagline}>Set New Password</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>Reset Password</Text>
            <Text style={styles.signInSubtitle}>
              Enter your new password below
            </Text>

            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#9CA3AF"
              value={resetPassword}
              onChangeText={setResetPassword}
              secureTextEntry
              editable={!resetPasswordLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#9CA3AF"
              value={resetConfirmPassword}
              onChangeText={setResetConfirmPassword}
              secureTextEntry
              editable={!resetPasswordLoading}
            />

            <TouchableOpacity
              style={[styles.button, resetPasswordLoading && styles.disabledButton]}
              onPress={handleResetPasswordSubmit}
              disabled={resetPasswordLoading}
            >
              {resetPasswordLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setShowPasswordReset(false)
                setSession(null)
                setResetPassword('')
                setResetConfirmPassword('')
              }}
              disabled={resetPasswordLoading}
            >
              <Text style={styles.toggleButtonText}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // Show main app only when we have both session and profile
  if (session && session.user && profile) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Image 
              source={require('./assets/images/chef-jeff-transparent.png')} 
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfileModal(true)}
            >
              <Text style={styles.profileButtonText}>👤 Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity 
            style={[styles.tab, currentTab === 'generate' && styles.activeTab]}
            onPress={() => setCurrentTab('generate')}
          >
            <View style={styles.tabContent}>
              <ChefHatIcon size={16} style={[
                styles.tabIcon, 
                { tintColor: currentTab === 'generate' ? '#EA580C' : 'white' }
              ]} />
              <Text style={[styles.tabText, currentTab === 'generate' && styles.activeTabText]}>
                Cook
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, currentTab === 'history' && styles.activeTab]}
            onPress={() => setCurrentTab('history')}
          >
            <Text style={[styles.tabText, currentTab === 'history' && styles.activeTabText]}>
              📚 History ({recipeHistory.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentTab === 'generate' ? (
            <>
              {/* Weekly Meal Tracker Section - Temporarily disabled, keeping for future use */}
              {/* <WeeklyMealTracker 
                onMealAdded={(newData: WeeklyMealData) => {
                  console.log('Meal added! New weekly total:', newData.mealsCooked)
                }}
              /> */}

              {/* Pantry Section */}
              {profile && (
                <PantryManager
                  pantryItems={profile.pantry_items}
                  onUpdatePantry={handleUpdatePantry}
                />
              )}

              {/* FUTURE: Explore Mode Message (commented out for future use) */}
              {/* {recipeMode === 'explore' && (
                <View style={styles.exploreModeCard}>
                  <Text style={styles.exploreModeTitle}>✨ Discover Amazing Recipes</Text>
                  <Text style={styles.exploreModeSubtitle}>
                    Get inspired with trending and creative recipes from around the world!
                  </Text>
                </View>
              )} */}

              {/* Recipes Section */}
              <View style={styles.recipesSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Recommended Recipes
                  </Text>
                  <View style={styles.headerButtons}>
                    <TouchableOpacity 
                      style={styles.customizeButton}
                      onPress={() => setShowCustomizationModal(true)}
                    >
                      <Text style={styles.customizeButtonText}>⚙️ Customize</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Choose your cooking adventure: 🥄 Professional for tested recipes • ✨ AI for personalized magic
                  {profile && Object.values(recipeRatings).some(rating => rating !== null) && (
                    <Text style={styles.learningIndicator}> • 🧠 Learning your taste!</Text>
                  )}
                </Text>
                
                {generatingRecipe && (
                  <View style={styles.generatingContainer}>
                    <ActivityIndicator size="large" color="#EA580C" />
                    <Text style={styles.generatingText}>
                      Generating savory AI recipes with images... ✨🤤
                    </Text>
                    <Text style={styles.generatingSubtext}>
                      Two mouth-watering savory recipes using your pantry ingredients!
                    </Text>
                  </View>
                )}

                {/* Pantry-Only Recipe */}
                {generatingRecipe && !recipes.pantryOnly ? (
                  <View style={styles.recipeLoadingContainer}>
                    <View style={styles.recipeLoadingPlaceholder}>
                      <ActivityIndicator size="large" color="#EA580C" />
                      <Text style={styles.recipeLoadingText}>
                        Generating savory recipe with image...
                      </Text>
                    </View>
                  </View>
                ) : recipes.pantryOnly ? (
                  <AIRecipeCard
                    recipe={recipes.pantryOnly}
                    onViewDetails={handleViewRecipe}
                    onRate={handleRateRecipe}
                    userId={session?.user?.id}
                    initialRating={recipeRatings[recipes.pantryOnly.id]}
                    pantryItems={profile?.pantry_items || []}
                  />
                ) : null}

                {/* Enhanced Recipe */}
                {generatingRecipe && !recipes.enhanced ? (
                  <View style={styles.recipeLoadingContainer}>
                    <View style={styles.recipeLoadingPlaceholder}>
                      <ActivityIndicator size="large" color="#EA580C" />
                      <Text style={styles.recipeLoadingText}>
                        Generating second savory recipe with image...
                      </Text>
                    </View>
                  </View>
                ) : recipes.enhanced ? (
                  <AIRecipeCard
                    recipe={recipes.enhanced}
                    onViewDetails={handleViewRecipe}
                    onRate={handleRateRecipe}
                    userId={session?.user?.id}
                    initialRating={recipeRatings[recipes.enhanced.id]}
                    pantryItems={profile?.pantry_items || []}
                  />
                ) : null}

                {Object.values(recipes).every(recipe => recipe === null) && !generatingRecipe && (
                  <View style={[styles.generateButtonsRow, { justifyContent: 'center' }]}>
                    <TouchableOpacity 
                      style={[
                        styles.generateButton, 
                        styles.aiButton,
                        (!profile || profile.pantry_items.length === 0) && styles.disabledButton
                      ]}
                      onPress={() => {
                        console.log('✨ Chef Jeff AI button pressed!')
                        console.log('Profile:', profile ? 'exists' : 'missing')
                        console.log('Pantry items:', profile?.pantry_items?.length || 0)
                        console.log('Full pantry:', profile?.pantry_items)
                        
                        if (!profile) {
                          console.log('❌ No profile found!')
                          return
                        }
                        
                        if (!profile.pantry_items || profile.pantry_items.length === 0) {
                          console.log('❌ No pantry items found!')
                          console.log('Please add ingredients to your pantry first')
                          return
                        }
                        
                        generateAIRecipes()
                      }}
                      // Temporarily remove disabled condition to test
                      // disabled={!profile || profile.pantry_items.length === 0}
                    >
                      <Text style={styles.generateButtonText}>
                        Create Meal
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {Object.values(recipes).some(recipe => recipe !== null) && (
                  <View style={[styles.generateButtonsRow, { justifyContent: 'center' }]}>
                    <TouchableOpacity 
                      style={[
                        styles.generateButton, 
                        styles.aiButton,
                        (!profile || profile.pantry_items.length === 0) && styles.disabledButton
                      ]}
                      onPress={() => {
                        console.log('✨ Chef Jeff AI button pressed!')
                        console.log('Profile:', profile ? 'exists' : 'missing')
                        console.log('Pantry items:', profile?.pantry_items?.length || 0)
                        console.log('Full pantry:', profile?.pantry_items)
                        
                        if (!profile) {
                          console.log('❌ No profile found!')
                          return
                        }
                        
                        if (!profile.pantry_items || profile.pantry_items.length === 0) {
                          console.log('❌ No pantry items found!')
                          console.log('Please add ingredients to your pantry first')
                          return
                        }
                        
                        generateAIRecipes()
                      }}
                      // Temporarily remove disabled condition to test
                      // disabled={generatingRecipe || (!profile || profile.pantry_items.length === 0)}
                    >
                      <Text style={styles.generateButtonText}>
                        Create Meal
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          ) : (
            /* History Tab */
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Recipe History</Text>
              {recipeHistory.length > 0 ? (
                recipeHistory.map((recipe) => (
                  <View key={recipe.id} style={styles.historyItem}>
                    <AIRecipeCard
                      recipe={recipe}
                      onViewDetails={handleViewRecipe}
                      onRate={handleRateRecipe}
                      userId={session?.user?.id}
                      initialRating={recipeRatings[recipe.id]}
                      pantryItems={profile?.pantry_items || []}
                    />
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyDate}>
                        Generated {new Date(recipe.generatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noHistoryContainer}>
                  <Text style={styles.noHistoryText}>
                    No recipes in your history yet. Generate your first recipe to get started!
                  </Text>
                  <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={() => setCurrentTab('generate')}
                  >
                    <Text style={styles.generateButtonText}>
                      ✨ Generate Your First Recipe
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Recipe Detail Modal */}
        <AIRecipeDetailModal
          recipe={selectedRecipe}
          visible={showRecipeModal}
          onClose={() => {
            setShowRecipeModal(false)
            setSelectedRecipe(null)
          }}
        />

        {/* Recipe Customization Modal */}
        <RecipeCustomizationModal
          visible={showCustomizationModal}
          onClose={() => setShowCustomizationModal(false)}
          onGenerateRecipe={generateAIRecipes}
          pantryIngredients={profile?.pantry_items || []}
        />

        {/* Profile Page Modal */}
        <ProfilePage
          userId={session?.user?.id || ''}
          userName={profile?.first_name || 'Chef'}
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />

        {/* Forgot Password Modal */}
        <Modal visible={showForgotPassword} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.forgotPasswordContainer}>
            <View style={styles.forgotPasswordHeader}>
              <Text style={styles.forgotPasswordTitle}>Reset Password</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.forgotPasswordDescription}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!resetLoading}
            />

            <TouchableOpacity
              style={[styles.button, resetLoading && styles.disabledButton]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Email</Text>
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        {/* Logo Section - Updated to use the Chef Jeff logo image */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('./assets/images/chef-jeff-transparent.png')} 
              style={styles.logoImage}
              resizeMode="contain"
              onLoad={() => {
                console.log('✅ Login logo loaded successfully')
              }}
              onError={(error) => {
                console.log('❌ Login logo failed to load:', error.nativeEvent.error)
              }}
            />
          </View>
          <Text style={styles.tagline}>Your Personal Cooking Assistant</Text>
        </View>

        {/* Sign In Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeTitle}>
            {isSigningUp ? 'Create Account' : 'Welcome Back!'}
          </Text>
          <Text style={styles.signInSubtitle}>
            {isSigningUp 
              ? 'Sign up to start cooking with Chef Jeff' 
              : 'Sign in to discover amazing recipes'
            }
          </Text>
          
          {/* Google Sign In Button */}
          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={loading || googleLoading}
          />
          
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
            placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
            editable={!loading && !googleLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
            placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
            editable={!loading && !googleLoading}
          />
          
          <TouchableOpacity 
            style={[styles.button, (loading || googleLoading) && styles.disabledButton]} 
            onPress={isSigningUp ? handleSignUp : handleSignIn}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isSigningUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
      </TouchableOpacity>
      
          {/* Toggle between sign in and sign up */}
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setIsSigningUp(!isSigningUp)}
            disabled={loading || googleLoading}
          >
            <Text style={styles.toggleButtonText}>
              {isSigningUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </Text>
      </TouchableOpacity>

          {/* Forgot Password Link - only show on sign in */}
          {!isSigningUp && (
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={() => setShowForgotPassword(true)}
              disabled={loading || googleLoading}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Setup Modal - handles both email and Google users */}
        <Modal visible={showSetupModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.setupContainer}>
            <View style={styles.setupTitleContainer}>
              <ChefHatIcon size={32} style={styles.setupTitleIcon} />
              <Text style={styles.setupTitle}>Welcome to Chef Jeff!</Text>
            </View>
            <Text style={styles.setupSubtitle}>Let's set up your profile</Text>
            
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={setupForm.firstName}
              onChangeText={(text) => setSetupForm({...setupForm, firstName: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={setupForm.lastName}
              onChangeText={(text) => setSetupForm({...setupForm, lastName: text})}
            />
            
            {/* Pantry Setup with New Interface */}
            <View style={styles.setupPantrySection}>
              <Text style={styles.setupPantryTitle}>Add Your Pantry Items (Optional)</Text>
              <Text style={styles.setupPantrySubtitle}>Start with a few ingredients you have at home</Text>
              
              <PantryManager
                pantryItems={setupForm.pantryItems.split(',').map(item => item.trim()).filter(item => item.length > 0)}
                onUpdatePantry={(items) => setSetupForm({...setupForm, pantryItems: items.join(', ')})}
                style={styles.setupPantryManager}
              />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleSetupProfile}>
              <Text style={styles.buttonText}>Create Profile</Text>
      </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EA580C',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  button: {
    width: '100%',
    backgroundColor: '#EA580C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButton: {
    backgroundColor: '#F97316',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 20,
  },
  comingSoon: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 50, // Account for status bar
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoImage: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  signOutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  pantrySection: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EA580C',
    flex: 1,
  },
  recipesSection: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
  },
  noRecipesContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  noRecipesText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  setupContainer: {
    flex: 1,
    backgroundColor: '#EA580C',
    padding: 20,
    paddingTop: 50,
  },
  setupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setupTitleIcon: {
    marginRight: 8,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  setupSubtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.9,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 8,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
  },
  generatingContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  generatingText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  generatingSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  generateButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  instantButton: {
    backgroundColor: '#F97316',
  },
  aiButton: {
    backgroundColor: '#EA580C',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customizeButton: {
    padding: 8,
  },
  customizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
  },
  tabNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  activeTabText: {
    color: '#EA580C',
  },
  historySection: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
  },
  historyItem: {
    marginBottom: 15,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  noHistoryContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  setupPantrySection: {
    marginBottom: 20,
  },
  setupPantryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  setupPantrySubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 15,
  },
  setupPantryManager: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  recipeLoadingContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  recipeLoadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeLoadingText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 15,
    textAlign: 'center',
  },
  learningIndicator: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  fastButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  fastButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    flex: 1,
    backgroundColor: '#FED7AA',
    padding: 20,
    paddingTop: 60,
  },
  forgotPasswordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  forgotPasswordDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    lineHeight: 24,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 8,
  },
  generateButton: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#EA580C',
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  errorButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#EA580C',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  toggleButtonText: {
    color: '#EA580C',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  )
}