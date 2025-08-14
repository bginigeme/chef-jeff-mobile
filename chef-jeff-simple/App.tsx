import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Modal, Image, Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
// Firebase imports
import { FirebaseAuthService, FirebaseUser } from './lib/firebaseAuth'
import { FirebaseDatabaseService, UserProfile, SavedRecipe } from './lib/firebaseDatabase'
import { testFirebaseConnection } from './lib/firebaseTest'
import { aiRecipeGenerator, AIRecipe, RecipeRequest } from './lib/aiRecipeService'
import { AIRecipeCard } from './components/AIRecipeCard'
import { AIRecipeDetailModal } from './components/AIRecipeDetailModal'
import { SplashScreen as CustomSplashScreen } from './components/SplashScreen'
import { RecipeCustomizationModal } from './components/RecipeCustomizationModal'
import { RecipeHistoryService, RecipeHistoryItem } from './lib/recipeHistory'
import { PantryManager } from './components/PantryManager'
import { UserPreferencesService } from './lib/userPreferences'
import { ProfilePage } from './components/ProfilePage'
import { WeeklyMealTracker } from './components/WeeklyMealTracker'
import { WeeklyMealData } from './lib/mealTracker'
import { fastRecipeGenerator } from './lib/fastRecipeGenerator'
import { enhancedFastRecipeGenerator } from './lib/enhancedFastRecipeGenerator'
import { CachedRecipeService } from './lib/cachedRecipeService'
import { IngredientPatternsService } from './lib/ingredientPatternsService'
import { ChefHatIcon } from './components/ChefHatIcon'
import { ImportedRecipeCard } from './components/ImportedRecipeCard'
import { SocialRecipeService, SocialRecipeData } from './lib/socialRecipeService'

// Development mode check
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development'

// Removed explicit preventAutoHide to avoid native splash lock in production
// try {
//   SplashScreen.preventAutoHideAsync()
// } catch (error) {
//   console.log('⚠️ SplashScreen not available, continuing...')
// }

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



// Firebase user interface (replaces Session)
interface FirebaseSession {
  user: FirebaseUser;
}

function MainApp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [session, setSession] = useState<FirebaseSession | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [sharedRecipe, setSharedRecipe] = useState<SocialRecipeData | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [importingURL, setImportingURL] = useState(false)
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
  const [currentTab, setCurrentTab] = useState<'generate' | 'history' | 'import'>('generate')
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
  const [firebaseStatus, setFirebaseStatus] = useState<'loading' | 'connected' | 'error' | 'local'>('local')

  // Local Profile interface
  // Use Firebase UserProfile interface instead
  type Profile = UserProfile;

  useEffect(() => {
    const startup = async () => {
      try {
        console.log('🚀 Starting app initialization...')
        // Test Firebase connection
        console.log('🧪 Testing Firebase configuration...')
        testFirebaseConnection()
        
        // Check for stored Firebase session (this will set initialLoading to false when auth state is determined)
        const unsubscribe = await checkStoredSession()
        
        console.log('✅ Startup completed successfully')
        
        // Return cleanup function
        return unsubscribe
      } catch (e) {
        console.log('Startup error:', e)
        // Ensure app continues even if something fails
        setInitialLoading(false)
      }
    }
    
    const cleanup = startup()
    
    // Cleanup function
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(unsubscribe => {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe()
          }
        })
      }
    }
  }, [])

  // Load recipe history when session changes or when switching to history tab
  useEffect(() => {
    if (session?.user?.uid && currentTab === 'history') {
      console.log('🔄 Loading recipe history for tab switch...')
      loadRecipeHistory()
    }
  }, [session?.user?.uid, currentTab])

  // Fallback timeout to prevent getting stuck on splash screen
  useEffect(() => {
    if (showSplash) {
      const fallbackTimeout = setTimeout(() => {
        console.log('⚠️ Splash screen fallback timeout reached, forcing continue');
        setShowSplash(false);
      }, 5000); // 5 second fallback
      
      return () => clearTimeout(fallbackTimeout);
    }
  }, [showSplash])

  const handleSplashFinish = () => {
    setShowSplash(false)
  }

  // Handle URL scheme for Share Extension
  useEffect(() => {
    const handleURL = async (url: string) => {
      console.log('🔗 Received URL:', url);
      
      if (url.startsWith('chefjeff://recipe')) {
        try {
          const urlObj = new URL(url);
          const sourceURL = urlObj.searchParams.get('sourceURL');
          
          if (sourceURL) {
            // Extract recipe data from the original social media URL
            const recipeData = await SocialRecipeService.extractRecipeFromURL(sourceURL);
            
            if (recipeData) {
              console.log('📝 Extracted recipe data:', recipeData);
              setSharedRecipe(recipeData);
              
              // Show success message
              Alert.alert(
                'Recipe Imported!',
                `Successfully imported recipe from ${recipeData.author || 'social media'}`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert('Error', 'No recipe data found in the shared content');
            }
          } else {
            Alert.alert('Error', 'Invalid recipe URL');
          }
        } catch (error) {
          console.log('❌ Error parsing recipe URL:', error);
          Alert.alert('Error', 'Failed to import recipe');
        }
      }
    };

    // Handle initial URL if app was opened via URL
    Linking.getInitialURL().then((initialURL) => {
      if (initialURL) {
        handleURL(initialURL);
      }
    });

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', (event) => {
      handleURL(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);



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
      
      // Simple local password update (no Supabase)
      Alert.alert(
        'Password Updated!',
        'Your password has been successfully updated.',
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
    } catch (error: any) {
      logError('Reset password error', error)
      Alert.alert('Error', error.message)
    } finally {
      setResetPasswordLoading(false)
    }
  }

  const checkStoredSession = async () => {
    try {
      console.log('🔍 Checking stored Firebase session...');
      
      // Use onAuthStateChanged to wait for Firebase to restore the session from AsyncStorage
      const unsubscribe = FirebaseAuthService.onAuthStateChange((user) => {
        console.log('🔍 Auth state changed:', user ? `User ${user.uid}` : 'No user');
        
        if (user) {
          console.log('🔍 Found Firebase user:', user.uid);
          setSession({ user });
        } else {
          console.log('🔍 No Firebase user found');
          setSession(null);
        }
        
        // Only set initial loading to false after auth state is determined
        setInitialLoading(false);
      });
      
      // Cleanup subscription when component unmounts
      return unsubscribe;
    } catch (error) {
      console.log('❌ Firebase session check failed:', error);
      setInitialLoading(false);
    }
  }

  // Background loading after app is visible
  useEffect(() => {
    if (session?.user && !initialLoading) {
      // Load profile in background after startup
      setTimeout(() => {
        loadUserProfile()
      }, 1000); // 1 second delay to ensure app is fully visible
    }
  }, [session, initialLoading])

  useEffect(() => {
    if (profile && !initialLoading) {
      // Load recipe history in background
      setTimeout(() => {
        loadRecipeHistory()
      }, 1500); // 1.5 second delay
    }
  }, [profile, initialLoading])

  const loadUserProfile = async (showSetupIfMissing: boolean = false) => {
    if (!session?.user) return

    try {
      console.log('☁️ Loading profile from Firebase...')
      setFirebaseStatus('connected')
      
      // Try to load from Firebase first
      const firebaseProfile = await FirebaseDatabaseService.getUserProfile(session.user.uid)
      if (firebaseProfile) {
        console.log('☁️ Loaded profile from Firebase:', firebaseProfile)
        setProfile(firebaseProfile)
        return
      }
      
              // Fallback to local storage if Firebase profile doesn't exist
        console.log('📱 Firebase profile not found, trying local storage...')
        const storedProfile = await AsyncStorage.getItem('user_profile')
        if (storedProfile) {
          const userProfile = JSON.parse(storedProfile)
          console.log('📱 Loaded profile from local storage:', userProfile)
          setProfile(userProfile)
          setFirebaseStatus('local')
        } else if (showSetupIfMissing) {
        setShowSetupModal(true)
      }
    } catch (error: any) {
      console.log('❌ Error loading profile from Firebase:', error)
      console.log('📱 Falling back to local storage...')
      
      try {
        const storedProfile = await AsyncStorage.getItem('user_profile')
        if (storedProfile) {
          const userProfile = JSON.parse(storedProfile)
          console.log('📱 Loaded profile from local storage:', userProfile)
          setProfile(userProfile)
          setFirebaseStatus('local')
        } else if (showSetupIfMissing) {
          setShowSetupModal(true)
        }
      } catch (localError: any) {
        console.log('❌ Error loading from local storage:', localError)
        if (showSetupIfMissing) {
          setShowSetupModal(true)
        }
      }
    }
  }

  const loadRecipeHistory = async () => {
    try {
      if (session?.user?.uid) {
        // Load from Firebase first
        const cloudHistory = await FirebaseDatabaseService.getUserRecipes(session.user.uid, 50)
        if (cloudHistory && cloudHistory.length > 0) {
          // Map SavedRecipe -> RecipeHistoryItem-compatible structure for display
          const mapped = cloudHistory.map((doc) => ({
            ...doc.recipe,
            id: doc.id || doc.recipe.id,
            generatedAt: (doc.createdAt as any)?.toDate ? (doc.createdAt as any).toDate().toISOString() : new Date().toISOString(),
            isFavorite: doc.isFavorite,
            source: doc.source,
            sourceURL: doc.sourceURL,
          }))
          setRecipeHistory(mapped)
          return
        }
      }
      // Fallback to local
      const history = await RecipeHistoryService.getHistory()
      setRecipeHistory(history || [])
    } catch (error) {
      logError('Failed to load recipe history', error)
    }
  }

  const handleImportURL = async () => {
    if (!urlInput.trim()) return
    
    setImportingURL(true)
    try {
      const recipeData = await SocialRecipeService.extractRecipeFromURL(urlInput.trim())
      if (recipeData) {
        setSharedRecipe(recipeData)
        setUrlInput('')
        Alert.alert(
          'Recipe Imported!',
          `Successfully imported recipe from ${recipeData.author || 'social media'}`
        )
      } else {
        Alert.alert('Error', 'No recipe data found in the URL')
      }
    } catch (error) {
      console.log('❌ Error importing recipe:', error)
      Alert.alert('Error', 'Failed to import recipe from URL')
    } finally {
      setImportingURL(false)
    }
  }

  const generateAIRecipes = async (customRequest?: RecipeRequest) => {
    // Require pantry items for recipe generation
    if (!profile || profile.pantryItems.length === 0) return
    
    // Import ingredient validation
    const { IngredientDatabase } = await import('./lib/ingredientDatabase')
    
    // Validate pantry composition
    const validation = IngredientDatabase.validatePantryItems(profile.pantryItems)
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
    console.log('📋 User\'s pantry items:', profile.pantryItems)
    
    setGeneratingRecipe(true)
    
    // Clear existing recipes and show loading state
    setRecipes({ pantryOnly: null, enhanced: null })
    
    try {
      let request: RecipeRequest
      
      // Use pantry-based recipe generation with savory focus
      request = customRequest || {
        pantryIngredients: profile?.pantryItems || [],
        cookingTime: 30,
        servings: 2,
        difficulty: 'Easy',
        specificRequest: 'Create an incredibly savory and mouth-watering dish that will make everyone salivate! Focus on umami-rich flavors, proper seasoning, and irresistible taste.'
      }
      
      // Try cached recipes first for instant results
      const cachedResult = await CachedRecipeService.getFastRecipes(
        request,
        session?.user?.uid,
        false // Don't force refresh
      )
      
      if (cachedResult.fromCache) {
        console.log('⚡ Using cached recipes - instant Jeff Style response!')
        
        // Set recipes immediately from cache
        setRecipes({
          pantryOnly: cachedResult.recipes[0] || null,
          enhanced: cachedResult.recipes[1] || null
        })
        
        // Save to history (Cloud first)
        for (const recipe of cachedResult.recipes) {
          try {
            if (session?.user?.uid) {
              const id = await FirebaseDatabaseService.saveRecipe(session.user.uid, recipe, 'ai')
              console.log('🌩️ Cloud recipe saved (ai):', id)
            } else {
              await RecipeHistoryService.saveRecipe(recipe)
            }
          } catch (saveError) {
            console.log('ℹ️ Recipe saved locally, history sync will happen later')
          }
        }
        
        await loadRecipeHistory()
        
      } else {
        // Generate new recipes with progressive loading
        const finalRecipes = await aiRecipeGenerator.generateDualPantryRecipesProgressive(
          request, 
          session?.user?.uid,
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
          profile.pantryItems,
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
                      title: `Savory ${profile.pantryItems[0] || 'Ingredient'} Delight`,
          description: 'A deliciously savory preparation using your available ingredients with rich, mouth-watering flavors',
                      ingredients: profile.pantryItems.slice(0, 3).map((item: string) => ({
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
      console.log('🔄 Starting Firebase sign in process...')
      
      const firebaseUser = await FirebaseAuthService.signIn(email, password)
      const sessionData = { user: firebaseUser }
      
              console.log('✅ Firebase authentication successful')
        setSession(sessionData)
        
        // Reset forgot password state when signing in
        setShowForgotPassword(false)
        
        // Load profile and show setup if needed
        setTimeout(() => {
          loadUserProfile(true)
        }, 100)
    } catch (err: any) {
      console.log('❌ Firebase sign in error:', err)
      logError('Firebase sign in error', err)
      Alert.alert('Sign In Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    setLoading(true)
    
    try {
      console.log('🔄 Starting Firebase sign up process...')
      
      const firebaseUser = await FirebaseAuthService.signUp(email, password)
      const sessionData = { user: firebaseUser }
      
      console.log('✅ Firebase sign up successful')
      setSession(sessionData)
      
      // Reset forgot password state when signing up
      setShowForgotPassword(false)
      
      // New users will need to set up their profile
      setTimeout(() => {
        setShowSetupModal(true)
      }, 100)
    } catch (err: any) {
      console.log('❌ Firebase sign up error:', err)
      logError('Firebase sign up error', err)
      Alert.alert('Sign Up Error', err.message)
    }
    
    setLoading(false)
  }

  const handleSignOut = async () => {
    if (!session) return
    
    try {
      console.log('🔄 Starting Firebase sign out process...')
      
      await FirebaseAuthService.signOut()
      setSession(null)
      setProfile(null)
      setRecipes({ pantryOnly: null, enhanced: null })
      setRecipeHistory([])
      setRecentlyShownRecipeIds([])
      
      // Clear local storage
      await AsyncStorage.removeItem('user_profile')
      
      console.log('✅ Firebase sign out successful')
      Alert.alert('Success', 'Signed out successfully!')
    } catch (error: any) {
      console.log('❌ Firebase sign out error:', error)
      logError('Firebase sign out error', error)
      Alert.alert('Error', error.message)
    }
  }

  const handleSetupProfile = async () => {
    if (!session?.user || !setupForm.firstName || !setupForm.lastName) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      console.log('🔄 Creating Firebase user profile...')
      
      // Create profile in Firebase
      const newProfile = await FirebaseDatabaseService.createUserProfile(
        session.user.uid,
        {
          email: session.user.email!,
          firstName: setupForm.firstName,
          lastName: setupForm.lastName,
          pantryItems: setupForm.pantryItems
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
        }
      )

      setProfile(newProfile)
      setShowSetupModal(false)
      
      console.log('✅ Firebase profile created successfully')
      Alert.alert('Success', 'Profile created! Click "Generate Recipe" to get your first AI recipe from Chef Jeff!')
    } catch (error) {
      console.log('❌ Firebase profile creation error:', error)
      console.log('🔄 Falling back to local storage...')
      
      try {
        // Fallback to local storage
        const localProfile = {
          id: session.user.uid,
          email: session.user.email!,
          firstName: setupForm.firstName,
          lastName: setupForm.lastName,
          pantryItems: setupForm.pantryItems
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0),
          createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
          updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any
        }
        
        // Save to local storage
        await AsyncStorage.setItem('user_profile', JSON.stringify(localProfile))
        
        setProfile(localProfile)
        setShowSetupModal(false)
        
        console.log('✅ Local profile created successfully')
        Alert.alert('Success', 'Profile created locally! Click "Generate Recipe" to get your first AI recipe from Chef Jeff!')
      } catch (localError) {
        console.log('❌ Local profile creation also failed:', localError)
        Alert.alert('Error', 'Failed to create profile. Please try again.')
      }
    }
  }

  const handleViewRecipe = (recipe: AIRecipe) => {
    setSelectedRecipe(recipe)
    setShowRecipeModal(true)
  }

  const handleUpdatePantry = async (newPantryItems: string[]) => {
    if (!session?.user || !profile) return

    try {
      console.log('🔄 Updating Firebase pantry with:', newPantryItems);
      
      // Update profile in Firebase
      await FirebaseDatabaseService.updateUserProfile(session.user.uid, {
        pantryItems: newPantryItems
      });
      
      // Update local state
      const updatedProfile = {
        ...profile,
        pantryItems: newPantryItems
      };
      setProfile(updatedProfile);
      
      console.log('✅ Firebase pantry updated successfully');
    } catch (error) {
      console.log('❌ Firebase pantry update error:', error);
      logError('Failed to update Firebase pantry', error);
    }
  }

  const handleGenerateNewRecipe = () => {
    // Don't clear existing recipes immediately - let users see current recipes while generating new ones
    generateAIRecipes()
  }

  // Debug session state when history tab is active
  useEffect(() => {
    if (currentTab === 'history') {
      console.log('🔍 History Tab Debug:', { 
        sessionExists: !!session, 
        userId: session?.user?.uid, 
        recipeHistoryLength: recipeHistory.length 
      })
    }
  }, [currentTab, session, recipeHistory.length])

  const handleRateRecipe = async (recipe: AIRecipe, rating: 'like' | 'dislike') => {
    console.log('🚨🚨🚨 handleRateRecipe CALLED! 🚨🚨🚨')
    console.log('🚨🚨🚨 This should be visible! 🚨🚨🚨')
    
    if (!session?.user?.uid) return
    
    try {
      console.log('🎯 handleRateRecipe: Starting for recipe:', recipe.title)
      
      await UserPreferencesService.rateRecipe(session.user.uid, recipe, rating)
      console.log('✅ Local rating saved')
      
      // Also persist to Firestore for cross-device profile
      const recipeDocId = recipe.id.startsWith('imported_') ? recipe.id : `local_${recipe.id}`
      console.log('🔥 Calling FirebaseDatabaseService.saveUserRating with:', { userId: session.user.uid, recipeDocId, rating })
      
      await FirebaseDatabaseService.saveUserRating(session.user.uid, recipeDocId, recipe, rating)
      console.log(`🌩️ Saved cloud rating: ${rating} → ${recipe.title}`)

      // Refresh profile stats if profile is open later
      try { console.log('👍 Rating persisted for user', session.user.uid) } catch {}
      
      // Force refresh Profile page data if it's currently open
      if (showProfileModal) {
        console.log('🔄 Refreshing Profile page data...')
        // This will trigger the Profile page to reload data
        setShowProfileModal(false)
        setTimeout(() => setShowProfileModal(true), 100)
      }
      
      // Show feedback to user
      const message = rating === 'like' 
        ? '❤️ Awesome! Chef Jeff is learning you love this style. More savory recipes like this coming up!'
        : '👎 Got it! Chef Jeff will avoid similar ingredients and flavors in future recipes.'
      
      // Show quick toast-style feedback (you could replace this with a proper toast library)
      Alert.alert('Preference Saved', message)
    } catch (error: any) {
      console.log('❌ Error in handleRateRecipe:', error)
      console.log('ℹ️ Recipe preference saved locally, will sync when online')
      // Don't show error to user, just log it
    }
  }

  const generateFastRecipes = async () => {
    if (!profile || profile.pantryItems.length === 0) return
    
    // Import ingredient validation
    const { IngredientDatabase } = await import('./lib/ingredientDatabase')
    
    // Validate pantry composition
    const validation = IngredientDatabase.validatePantryItems(profile.pantryItems)
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
        profile.pantryItems,
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
            profile.pantryItems,
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
            title: `Simple ${profile.pantryItems[0] || 'Ingredient'} Dish`,
            description: 'A basic preparation using your available ingredients',
            ingredients: profile.pantryItems.slice(0, 3).map((item: string) => ({
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
          profile.pantryItems,
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
                      title: `Simple ${profile.pantryItems[0] || 'Ingredient'} Dish`,
          description: 'A basic preparation using your available ingredients',
                      ingredients: profile.pantryItems.slice(0, 3).map((item: string) => ({
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
      // Simple local password reset (no Supabase)
      Alert.alert(
        'Password Reset',
        'Password reset functionality is not available in local mode.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      )
      setResetEmail('')
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
      // Simple local Google sign in (no Supabase)
      Alert.alert('Google Sign In', 'Google sign in is not available in local mode.')
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
            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusText,
                firebaseStatus === 'connected' && styles.statusConnected,
                firebaseStatus === 'error' && styles.statusError,
                firebaseStatus === 'local' && styles.statusLocal,
                firebaseStatus === 'loading' && styles.statusLoading
              ]}>
                {firebaseStatus === 'connected' && '☁️ Cloud'}
                {firebaseStatus === 'error' && '❌ Error'}
                {firebaseStatus === 'local' && '📱 Local'}
                {firebaseStatus === 'loading' && '🔄 Loading...'}
              </Text>
            </View>
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
              History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, currentTab === 'import' && styles.activeTab]}
            onPress={() => setCurrentTab('import')}
          >
            <Text style={[styles.tabText, currentTab === 'import' && styles.activeTabText]}>
              Import
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
                  pantryItems={profile.pantryItems}
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
                    userId={session?.user?.uid}
                    initialRating={recipeRatings[recipes.pantryOnly.id]}
                    pantryItems={profile?.pantryItems || []}
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
                    userId={session?.user?.uid}
                    initialRating={recipeRatings[recipes.enhanced.id]}
                    pantryItems={profile?.pantryItems || []}
                  />
                ) : null}

                {Object.values(recipes).every(recipe => recipe === null) && !generatingRecipe && (
                  <View style={[styles.generateButtonsRow, { justifyContent: 'center' }]}>
                    <TouchableOpacity 
                      style={[
                        styles.generateButton, 
                        styles.aiButton,
                        (!profile || profile.pantryItems.length === 0) && styles.disabledButton
                      ]}
                      onPress={() => {
                        console.log('✨ Chef Jeff AI button pressed!')
                        console.log('Profile:', profile ? 'exists' : 'missing')
                        console.log('Pantry items:', profile?.pantryItems?.length || 0)
                        console.log('Full pantry:', profile?.pantryItems)
                        
                        if (!profile) {
                          console.log('❌ No profile found!')
                          return
                        }
                        
                        if (!profile.pantryItems || profile.pantryItems.length === 0) {
                          console.log('❌ No pantry items found!')
                          console.log('Please add ingredients to your pantry first')
                          return
                        }
                        
                        generateAIRecipes()
                      }}
                      // Temporarily remove disabled condition to test
                      // disabled={!profile || profile.pantryItems.length === 0}
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
                        (!profile || profile.pantryItems.length === 0) && styles.disabledButton
                      ]}
                      onPress={() => {
                        console.log('✨ Chef Jeff AI button pressed!')
                        console.log('Profile:', profile ? 'exists' : 'missing')
                        console.log('Pantry items:', profile?.pantryItems?.length || 0)
                        console.log('Full pantry:', profile?.pantryItems)
                        
                        if (!profile) {
                          console.log('❌ No profile found!')
                          return
                        }
                        
                        if (!profile.pantryItems || profile.pantryItems.length === 0) {
                          console.log('❌ No pantry items found!')
                          console.log('Please add ingredients to your pantry first')
                          return
                        }
                        
                        generateAIRecipes()
                      }}
                      // Temporarily remove disabled condition to test
                      // disabled={generatingRecipe || (!profile || profile.pantryItems.length === 0)}
                    >
                      <Text style={styles.generateButtonText}>
                        Create Meal
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          ) : currentTab === 'history' ? (
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
                      userId={session?.user?.uid}
                      initialRating={recipeRatings[recipe.id]}
                      pantryItems={profile?.pantryItems || []}
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
          ) : (
            /* Import Tab */
            <View style={styles.importSection}>
              <Text style={styles.sectionTitle}>Imported Recipes</Text>
              
              {/* URL Input Section */}
              <View style={styles.urlInputContainer}>
                <Text style={styles.urlInputLabel}>Paste Recipe URL:</Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://instagram.com/p/..."
                  placeholderTextColor="#9CA3AF"
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity 
                  style={styles.importButton}
                  onPress={handleImportURL}
                  disabled={!urlInput.trim() || importingURL}
                >
                  <Text style={styles.importButtonText}>
                    {importingURL ? 'Importing...' : 'Import Recipe'}
                  </Text>
                </TouchableOpacity>
              </View>

              {sharedRecipe ? (
                <View style={styles.importItem}>
                  <ImportedRecipeCard
                    recipe={sharedRecipe}
                    onSave={async (recipe) => {
                      try {
                        // Convert SocialRecipeData to AIRecipe format
                        const aiRecipe: AIRecipe = {
                          id: `imported_${Date.now()}`,
                          title: recipe.title || 'Imported Recipe',
                          description: recipe.description || '',
                          ingredients: recipe.ingredients?.map((ing: string) => ({
                            name: ing,
                            amount: '1',
                            unit: 'portion'
                          })) || [],
                          instructions: recipe.instructions || [],
                          imageUrl: recipe.image || '',
                          cookingTime: 30, // Default cooking time for imported recipes
                          servings: 4, // Default servings for imported recipes
                          difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard', // Default difficulty
                          tags: recipe.hashtags || []
                        };
                        
                                     // Save to Firebase recipe history
             if (session?.user?.uid) {
               await FirebaseDatabaseService.saveRecipe(session.user.uid, aiRecipe, 'imported', recipe.sourceURL)
             } else {
               await RecipeHistoryService.saveRecipe(aiRecipe)
             }
             // Refresh history display
             await loadRecipeHistory();
                        
                        setSharedRecipe(null);
                        Alert.alert('Success', 'Recipe saved to your history!');
                      } catch (error) {
                        console.error('Failed to save imported recipe:', error);
                        Alert.alert('Error', 'Failed to save recipe. Please try again.');
                      }
                    }}
                    onDismiss={() => setSharedRecipe(null)}
                  />
                </View>
              ) : (
                <View style={styles.noImportContainer}>
                  <Text style={styles.noImportText}>
                    No imported recipes yet. Share a recipe from Instagram, TikTok, or other social platforms to get started!
                  </Text>
                  <Text style={styles.importInstructions}>
                    📱 Copy a recipe URL and paste it here, or use the share extension when available.
                  </Text>
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
          onRate={(recipe, rating) => handleRateRecipe(recipe, rating)}
          currentRating={selectedRecipe ? recipeRatings[selectedRecipe.id] || null : null}
        />

        {/* Recipe Customization Modal */}
        <RecipeCustomizationModal
          visible={showCustomizationModal}
          onClose={() => setShowCustomizationModal(false)}
          onGenerateRecipe={generateAIRecipes}
          pantryIngredients={profile?.pantryItems || []}
        />

        {/* Profile Page Modal */}
        <ProfilePage
          userId={session?.user?.uid || ''}
          userName={profile?.firstName || 'Chef'}
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdate={(newName) => {
            // Update the profile state with the new name
            if (profile) {
              setProfile({
                ...profile,
                firstName: newName.split(' ')[0] || newName,
                lastName: newName.split(' ').slice(1).join(' ') || ''
              })
            }
          }}
        />

                {/* Forgot Password Overlay */}
        {showForgotPassword && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
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
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Forgot Password Overlay - Moved to root level */}
      {showForgotPassword && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
              style={styles.button}
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
        </View>
      )}
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
          {/* <GoogleSignInButton /> */}
          
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
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
              onPress={() => {
                console.log('🔑 Forgot Password button pressed');
                console.log('🔑 Current showForgotPassword state:', showForgotPassword);
                setShowForgotPassword(true);
                console.log('🔑 Set showForgotPassword to true');
              }}
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
  importSection: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
  },
  importItem: {
    marginBottom: 15,
  },
  noImportContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
  noImportText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  importInstructions: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  urlInputContainer: {
    marginBottom: 20,
  },
  urlInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: 'white',
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: '#EA580C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#FED7AA',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
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
  statusContainer: {
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statusConnected: {
    color: '#10B981', // Green
  },
  statusError: {
    color: '#EF4444', // Red
  },
  statusLocal: {
    color: '#F59E0B', // Yellow
  },
  statusLoading: {
    color: '#3B82F6', // Blue
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  )
}