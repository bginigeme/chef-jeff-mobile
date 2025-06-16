import AsyncStorage from '@react-native-async-storage/async-storage'
import { AIRecipe, RecipeRequest, aiRecipeGenerator } from './aiRecipeService'
import { UserPreferencesService } from './userPreferences'

const CACHED_RECIPES_KEY = 'chef_jeff_cached_recipes'
const MAX_CACHED_RECIPES_PER_COMBO = 5
const CACHE_EXPIRY_HOURS = 24

interface CachedRecipeEntry {
  pantryHash: string
  userPreferencesHash: string
  recipes: AIRecipe[]
  generatedAt: string
  accessCount: number
  lastAccessed: string
}

interface RecipeCache {
  version: string
  entries: CachedRecipeEntry[]
}

export class CachedRecipeService {
  private static generatePantryHash(pantryItems: string[]): string {
    // Create consistent hash from sorted pantry items
    return pantryItems
      .map(item => item.toLowerCase().trim())
      .sort()
      .join('|')
  }

  private static async generateUserPreferencesHash(userId?: string): Promise<string> {
    if (!userId) return 'no-user'
    
    try {
      const prefs = await UserPreferencesService.getUserPreferences(userId)
      const prefString = [
        prefs.preferredIngredients.join(','),
        prefs.dislikedIngredients.join(','),
        prefs.preferredCuisines.join(','),
        prefs.averageCookingTime.toString()
      ].join('|')
      
      return btoa(prefString).substring(0, 16) // Short hash
    } catch {
      return 'no-prefs'
    }
  }

  private static async getCache(): Promise<RecipeCache> {
    try {
      const cacheJson = await AsyncStorage.getItem(CACHED_RECIPES_KEY)
      return cacheJson ? JSON.parse(cacheJson) : { version: '1.0.0', entries: [] }
    } catch {
      return { version: '1.0.0', entries: [] }
    }
  }

  private static async saveCache(cache: RecipeCache): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_RECIPES_KEY, JSON.stringify(cache))
    } catch (error) {
      console.log('ℹ️ Failed to save recipe cache:', error)
    }
  }

  private static isExpired(entry: CachedRecipeEntry): boolean {
    const now = new Date()
    const generated = new Date(entry.generatedAt)
    const hoursOld = (now.getTime() - generated.getTime()) / (1000 * 60 * 60)
    return hoursOld > CACHE_EXPIRY_HOURS
  }

  /**
   * Get cached recipes for pantry items, or generate new ones if needed
   */
  static async getFastRecipes(
    request: RecipeRequest,
    userId?: string,
    forceRefresh: boolean = false
  ): Promise<{ recipes: AIRecipe[]; fromCache: boolean }> {
    const pantryHash = this.generatePantryHash(request.pantryIngredients)
    const userPrefsHash = await this.generateUserPreferencesHash(userId)
    
    if (!forceRefresh) {
      // Try to get from cache first
      const cached = await this.getCachedRecipes(pantryHash, userPrefsHash)
      if (cached.length > 0) {
        console.log('⚡ Using cached Jeff Style recipes - instant response!')
        return { recipes: cached, fromCache: true }
      }
    }

    // Generate new recipes and cache them
    console.log('🔄 Generating new Jeff Style recipes for cache...')
    const newRecipes = await this.generateAndCacheRecipes(request, userId, pantryHash, userPrefsHash)
    
    return { recipes: newRecipes, fromCache: false }
  }

  private static async getCachedRecipes(
    pantryHash: string,
    userPrefsHash: string
  ): Promise<AIRecipe[]> {
    const cache = await this.getCache()
    
    const matchingEntry = cache.entries.find(entry => 
      entry.pantryHash === pantryHash &&
      entry.userPreferencesHash === userPrefsHash &&
      !this.isExpired(entry)
    )

    if (matchingEntry) {
      // Update access stats
      matchingEntry.accessCount++
      matchingEntry.lastAccessed = new Date().toISOString()
      await this.saveCache(cache)
      
      return matchingEntry.recipes
    }

    return []
  }

  private static async generateAndCacheRecipes(
    request: RecipeRequest,
    userId: string | undefined,
    pantryHash: string,
    userPrefsHash: string
  ): Promise<AIRecipe[]> {
    try {
      // Generate recipes using the existing AI service
      const result = await aiRecipeGenerator.generateDualPantryRecipesProgressive(
        request,
        userId
      )

      const recipes = [result.recipe1, result.recipe2]

      // Cache the results
      await this.cacheRecipes(pantryHash, userPrefsHash, recipes)

      return recipes
    } catch (error) {
      console.log('ℹ️ Failed to generate recipes for cache, using fallback')
      return []
    }
  }

  private static async cacheRecipes(
    pantryHash: string,
    userPrefsHash: string,
    recipes: AIRecipe[]
  ): Promise<void> {
    const cache = await this.getCache()

    // Remove old entry if exists
    cache.entries = cache.entries.filter(entry =>
      !(entry.pantryHash === pantryHash && entry.userPreferencesHash === userPrefsHash)
    )

    // Add new entry
    const newEntry: CachedRecipeEntry = {
      pantryHash,
      userPreferencesHash: userPrefsHash,
      recipes,
      generatedAt: new Date().toISOString(),
      accessCount: 1,
      lastAccessed: new Date().toISOString()
    }

    cache.entries.unshift(newEntry)

    // Cleanup: Remove old/unused entries
    await this.cleanupCache(cache)

    await this.saveCache(cache)
    console.log(`💾 Cached ${recipes.length} recipes for pantry combination`)
  }

  private static async cleanupCache(cache: RecipeCache): Promise<void> {
    // Remove expired entries
    cache.entries = cache.entries.filter(entry => !this.isExpired(entry))

    // Keep only top 50 most accessed/recent entries
    cache.entries = cache.entries
      .sort((a, b) => {
        // Sort by access count and recency
        const aScore = a.accessCount + (new Date(a.lastAccessed).getTime() / 1000000)
        const bScore = b.accessCount + (new Date(b.lastAccessed).getTime() / 1000000)
        return bScore - aScore
      })
      .slice(0, 50)
  }

  /**
   * Pre-generate recipes for common pantry combinations
   */
  static async preGenerateCommonRecipes(
    commonPantryCombos: string[][],
    userId?: string
  ): Promise<void> {
    console.log('🔄 Pre-generating recipes for common pantry combinations...')
    
    for (const pantryItems of commonPantryCombos) {
      const request: RecipeRequest = {
        pantryIngredients: pantryItems,
        cookingTime: 30,
        servings: 2,
        difficulty: 'Easy'
      }

      try {
        await this.getFastRecipes(request, userId, true) // Force refresh to generate
        await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
      } catch (error) {
        console.log(`ℹ️ Skipped pre-generation for ${pantryItems.join(', ')}`)
      }
    }
    
    console.log('✅ Pre-generation complete')
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalEntries: number
    totalRecipes: number
    hitRate: number
    oldestEntry: string
  }> {
    const cache = await this.getCache()
    
    const totalRecipes = cache.entries.reduce((sum, entry) => sum + entry.recipes.length, 0)
    const totalAccess = cache.entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const hitRate = totalAccess > 0 ? (totalAccess / (totalAccess + cache.entries.length)) : 0
    
    const oldestEntry = cache.entries.length > 0 
      ? cache.entries.reduce((oldest, entry) => 
          new Date(entry.generatedAt) < new Date(oldest.generatedAt) ? entry : oldest
        ).generatedAt
      : 'None'

    return {
      totalEntries: cache.entries.length,
      totalRecipes,
      hitRate,
      oldestEntry
    }
  }

  /**
   * Clear all cached recipes
   */
  static async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHED_RECIPES_KEY)
    console.log('🧹 Recipe cache cleared')
  }
} 