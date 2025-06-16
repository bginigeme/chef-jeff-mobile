import AsyncStorage from '@react-native-async-storage/async-storage'
import { AIRecipe } from './aiRecipeService'

export interface UserPreference {
  userId: string
  likedRecipes: Array<{
    recipeId: string
    recipe: AIRecipe
    likedAt: string
    feedback?: {
      reason?: 'ingredients' | 'cooking_method' | 'complexity' | 'time' | 'taste' | 'other'
      specificIngredients?: string[] // Ingredients they specifically didn't like
      notes?: string
    }
  }>
  dislikedRecipes: Array<{
    recipeId: string
    recipe: AIRecipe
    dislikedAt: string
    feedback?: {
      reason?: 'ingredients' | 'cooking_method' | 'complexity' | 'time' | 'taste' | 'other'
      specificIngredients?: string[] // Ingredients they specifically didn't like
      notes?: string
    }
  }>
  preferredIngredients: string[]
  dislikedIngredients: string[]
  preferredCuisines: string[]
  dislikedCuisines: string[]
  preferredCookingMethods: string[]
  dislikedCookingMethods: string[]
  preferredDifficulty: string[]
  averageCookingTime: number
}

export interface RecipeRating {
  recipeId: string
  rating: 'like' | 'dislike'
  timestamp: string
}

export class UserPreferencesService {
  private static getStorageKey(userId: string): string {
    return `user_preferences_${userId}`
  }

  static async getUserPreferences(userId: string): Promise<UserPreference> {
    try {
      const stored = await AsyncStorage.getItem(this.getStorageKey(userId))
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error)
    }

    // Return default preferences
    return {
      userId,
      likedRecipes: [],
      dislikedRecipes: [],
      preferredIngredients: [],
      dislikedIngredients: [],
      preferredCuisines: [],
      dislikedCuisines: [],
      preferredCookingMethods: [],
      dislikedCookingMethods: [],
      preferredDifficulty: [],
      averageCookingTime: 30
    }
  }

  static async rateRecipe(userId: string, recipe: AIRecipe, rating: 'like' | 'dislike'): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId)
      const timestamp = new Date().toISOString()

      // Remove from both arrays if it exists (user changed their mind)
      preferences.likedRecipes = preferences.likedRecipes.filter(r => r.recipeId !== recipe.id)
      preferences.dislikedRecipes = preferences.dislikedRecipes.filter(r => r.recipeId !== recipe.id)

      // Add to appropriate array
      if (rating === 'like') {
        preferences.likedRecipes.push({
          recipeId: recipe.id,
          recipe,
          likedAt: timestamp
        })
      } else {
        preferences.dislikedRecipes.push({
          recipeId: recipe.id,
          recipe,
          dislikedAt: timestamp
        })
      }

      // Update learned preferences
      this.updateLearnedPreferences(preferences)

      // Save to storage
      await AsyncStorage.setItem(this.getStorageKey(userId), JSON.stringify(preferences))
      
      console.log(`Recipe ${rating}d:`, recipe.title)
    } catch (error) {
      console.error('Failed to rate recipe:', error)
    }
  }

  static async rateRecipeWithFeedback(
    userId: string, 
    recipe: AIRecipe, 
    rating: 'like' | 'dislike',
    feedback?: {
      reason?: 'ingredients' | 'cooking_method' | 'complexity' | 'time' | 'taste' | 'other'
      specificIngredients?: string[] // Ingredients they specifically didn't like
      notes?: string
    }
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId)
      const timestamp = new Date().toISOString()

      // Remove from both arrays if it exists (user changed their mind)
      preferences.likedRecipes = preferences.likedRecipes.filter(r => r.recipeId !== recipe.id)
      preferences.dislikedRecipes = preferences.dislikedRecipes.filter(r => r.recipeId !== recipe.id)

      // Add to appropriate array with feedback
      if (rating === 'like') {
        preferences.likedRecipes.push({
          recipeId: recipe.id,
          recipe,
          likedAt: timestamp,
          feedback
        } as any)
      } else {
        preferences.dislikedRecipes.push({
          recipeId: recipe.id,
          recipe,
          dislikedAt: timestamp,
          feedback
        } as any)
      }

      // Update learned preferences with feedback context
      this.updateLearnedPreferencesWithFeedback(preferences)

      // Save to storage
      await AsyncStorage.setItem(this.getStorageKey(userId), JSON.stringify(preferences))
      
      console.log(`Recipe ${rating}d with feedback:`, recipe.title, feedback)
    } catch (error) {
      console.error('Failed to rate recipe with feedback:', error)
    }
  }

  static async getRating(userId: string, recipeId: string): Promise<'like' | 'dislike' | null> {
    try {
      const preferences = await this.getUserPreferences(userId)
      
      if (preferences.likedRecipes.some(r => r.recipeId === recipeId)) {
        return 'like'
      }
      if (preferences.dislikedRecipes.some(r => r.recipeId === recipeId)) {
        return 'dislike'
      }
      
      return null
    } catch (error) {
      console.error('Failed to get recipe rating:', error)
      return null
    }
  }

  private static updateLearnedPreferences(preferences: UserPreference): void {
    // Analyze liked recipes to learn preferences
    const likedRecipes = preferences.likedRecipes.map(r => r.recipe)
    const dislikedRecipes = preferences.dislikedRecipes.map(r => r.recipe)

    // Learn preferred ingredients with confidence scoring
    const ingredientStats = new Map<string, {
      likedCount: number
      dislikedCount: number
      totalAppearances: number
      confidence: number
    }>()

    // Analyze liked recipes
    likedRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const name = ing.name.toLowerCase()
        const current = ingredientStats.get(name) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          totalAppearances: 0, 
          confidence: 0 
        }
        current.likedCount++
        current.totalAppearances++
        ingredientStats.set(name, current)
      })
    })

    // Analyze disliked recipes
    dislikedRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const name = ing.name.toLowerCase()
        const current = ingredientStats.get(name) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          totalAppearances: 0, 
          confidence: 0 
        }
        current.dislikedCount++
        current.totalAppearances++
        ingredientStats.set(name, current)
      })
    })

    // Calculate confidence scores for each ingredient
    ingredientStats.forEach((stats, ingredient) => {
      // Confidence based on sample size and preference ratio
      const preferenceRatio = stats.likedCount / (stats.likedCount + stats.dislikedCount)
      const sampleSize = stats.totalAppearances
      
      // Higher confidence with more samples and stronger preference
      stats.confidence = preferenceRatio * Math.min(sampleSize / 5, 1) // Max confidence at 5+ samples
    })

    // Extract preferred ingredients with high confidence
    preferences.preferredIngredients = Array.from(ingredientStats.entries())
      .filter(([ingredient, stats]) => {
        // Strict criteria for positive preference
        return stats.likedCount > stats.dislikedCount && // More likes than dislikes
               stats.likedCount >= 3 && // At least 3 likes (increased from 2)
               stats.confidence >= 0.7 && // High confidence (70%+ positive)
               stats.totalAppearances >= 4 // Sufficient sample size
      })
      .sort(([, a], [, b]) => b.confidence - a.confidence) // Sort by confidence
      .slice(0, 15) // Top 15 high-confidence preferences
      .map(([ingredient]) => ingredient)

    // Extract disliked ingredients with even stricter criteria
    preferences.dislikedIngredients = Array.from(ingredientStats.entries())
      .filter(([ingredient, stats]) => {
        // Very strict criteria for negative preference
        return stats.dislikedCount > stats.likedCount && // More dislikes than likes
               stats.dislikedCount >= 3 && // At least 3 dislikes
               stats.confidence <= 0.3 && // Low confidence (30% or less positive)
               stats.totalAppearances >= 5 && // Larger sample size for negative assumptions
               stats.likedCount === 0 // Never liked (very strict)
      })
      .sort(([, a], [, b]) => a.confidence - b.confidence) // Sort by lowest confidence (most disliked)
      .slice(0, 5) // Only top 5 strong dislikes
      .map(([ingredient]) => ingredient)

    // Learn cuisine preferences with context awareness
    const cuisineStats = new Map<string, {
      likedCount: number
      dislikedCount: number
      confidence: number
    }>()

    likedRecipes.forEach(recipe => {
      if (recipe.cuisine) {
        const current = cuisineStats.get(recipe.cuisine) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          confidence: 0 
        }
        current.likedCount++
        cuisineStats.set(recipe.cuisine, current)
      }
    })

    dislikedRecipes.forEach(recipe => {
      if (recipe.cuisine) {
        const current = cuisineStats.get(recipe.cuisine) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          confidence: 0 
        }
        current.dislikedCount++
        cuisineStats.set(recipe.cuisine, current)
      }
    })

    // Calculate cuisine confidence
    cuisineStats.forEach((stats, cuisine) => {
      const total = stats.likedCount + stats.dislikedCount
      const preferenceRatio = stats.likedCount / total
      stats.confidence = preferenceRatio * Math.min(total / 3, 1) // Max confidence at 3+ samples
    })

    preferences.preferredCuisines = Array.from(cuisineStats.entries())
      .filter(([cuisine, stats]) => {
        return stats.likedCount > stats.dislikedCount &&
               stats.likedCount >= 2 &&
               stats.confidence >= 0.65 // High confidence for cuisine preference
      })
      .sort(([, a], [, b]) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(([cuisine]) => cuisine)

    // Only mark cuisines as disliked with very strong evidence
    preferences.dislikedCuisines = Array.from(cuisineStats.entries())
      .filter(([cuisine, stats]) => {
        return stats.dislikedCount > stats.likedCount &&
               stats.dislikedCount >= 3 && // Need multiple dislikes
               stats.confidence <= 0.2 && // Very low preference
               stats.likedCount === 0 // Never liked this cuisine
      })
      .sort(([, a], [, b]) => a.confidence - b.confidence)
      .slice(0, 2) // Very conservative - max 2 disliked cuisines
      .map(([cuisine]) => cuisine)

    // Learn difficulty preferences (more forgiving)
    const difficultyPreferences = new Map<string, number>()
    likedRecipes.forEach(recipe => {
      difficultyPreferences.set(recipe.difficulty, (difficultyPreferences.get(recipe.difficulty) || 0) + 1)
    })

    preferences.preferredDifficulty = Array.from(difficultyPreferences.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([difficulty]) => difficulty)

    // Learn average cooking time preference
    if (likedRecipes.length > 0) {
      const totalTime = likedRecipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0)
      preferences.averageCookingTime = Math.round(totalTime / likedRecipes.length)
    }

    console.log('📊 Updated user preferences with confidence scoring:', {
      preferredIngredients: preferences.preferredIngredients.slice(0, 5),
      dislikedIngredients: preferences.dislikedIngredients,
      preferredCuisines: preferences.preferredCuisines,
      dislikedCuisines: preferences.dislikedCuisines,
      averageCookingTime: preferences.averageCookingTime,
      totalLikedRecipes: likedRecipes.length,
      totalDislikedRecipes: dislikedRecipes.length
    })
  }

  private static updateLearnedPreferencesWithFeedback(preferences: UserPreference): void {
    // Enhanced learning that considers feedback context
    const likedRecipes = preferences.likedRecipes.map(r => r.recipe)
    const dislikedRecipes = preferences.dislikedRecipes.map(r => r.recipe)
    const dislikedWithFeedback = preferences.dislikedRecipes.filter((r: any) => r.feedback?.reason === 'ingredients')

    // When users specifically dislike ingredients, weight those more heavily
    const ingredientStats = new Map<string, {
      likedCount: number
      dislikedCount: number
      specificDislikes: number // New: explicitly disliked
      totalAppearances: number
      confidence: number
    }>()

    // Analyze liked recipes
    likedRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const name = ing.name.toLowerCase()
        const current = ingredientStats.get(name) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          specificDislikes: 0,
          totalAppearances: 0, 
          confidence: 0 
        }
        current.likedCount++
        current.totalAppearances++
        ingredientStats.set(name, current)
      })
    })

    // Analyze disliked recipes with context
    dislikedRecipes.forEach((recipe, index) => {
      const dislikedEntry = preferences.dislikedRecipes[index] as any
      const isIngredientIssue = dislikedEntry.feedback?.reason === 'ingredients'
      const specificIngredients = dislikedEntry.feedback?.specificIngredients || []

      recipe.ingredients.forEach(ing => {
        const name = ing.name.toLowerCase()
        const current = ingredientStats.get(name) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          specificDislikes: 0,
          totalAppearances: 0, 
          confidence: 0 
        }
        
        current.dislikedCount++
        current.totalAppearances++
        
        // Weight specific ingredient dislikes more heavily
        if (isIngredientIssue || specificIngredients.includes(ing.name)) {
          current.specificDislikes++
        }
        
        ingredientStats.set(name, current)
      })
    })

    // Calculate enhanced confidence scores
    ingredientStats.forEach((stats, ingredient) => {
      const preferenceRatio = stats.likedCount / (stats.likedCount + stats.dislikedCount)
      const sampleSize = stats.totalAppearances
      
      // Penalize ingredients with specific dislikes
      const specificDislikesPenalty = stats.specificDislikes * 2 // Double weight for explicit dislikes
      const adjustedDislikes = stats.dislikedCount + specificDislikesPenalty
      const adjustedRatio = stats.likedCount / (stats.likedCount + adjustedDislikes)
      
      stats.confidence = adjustedRatio * Math.min(sampleSize / 5, 1)
    })

    // Extract preferred ingredients with high confidence
    preferences.preferredIngredients = Array.from(ingredientStats.entries())
      .filter(([ingredient, stats]) => {
        // Strict criteria for positive preference
        return stats.likedCount > stats.dislikedCount && // More likes than dislikes
               stats.likedCount >= 3 && // At least 3 likes (increased from 2)
               stats.confidence >= 0.7 && // High confidence (70%+ positive)
               stats.totalAppearances >= 4 // Sufficient sample size
      })
      .sort(([, a], [, b]) => b.confidence - a.confidence) // Sort by confidence
      .slice(0, 15) // Top 15 high-confidence preferences
      .map(([ingredient]) => ingredient)

    // Extract disliked ingredients with even stricter criteria
    preferences.dislikedIngredients = Array.from(ingredientStats.entries())
      .filter(([ingredient, stats]) => {
        // Very strict criteria for negative preference
        return stats.dislikedCount > stats.likedCount && // More dislikes than likes
               stats.dislikedCount >= 3 && // At least 3 dislikes
               stats.confidence <= 0.3 && // Low confidence (30% or less positive)
               stats.totalAppearances >= 5 && // Larger sample size for negative assumptions
               stats.likedCount === 0 // Never liked (very strict)
      })
      .sort(([, a], [, b]) => a.confidence - b.confidence) // Sort by lowest confidence (most disliked)
      .slice(0, 5) // Only top 5 strong dislikes
      .map(([ingredient]) => ingredient)

    // Learn cuisine preferences with context awareness
    const cuisineStats = new Map<string, {
      likedCount: number
      dislikedCount: number
      confidence: number
    }>()

    likedRecipes.forEach(recipe => {
      if (recipe.cuisine) {
        const current = cuisineStats.get(recipe.cuisine) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          confidence: 0 
        }
        current.likedCount++
        cuisineStats.set(recipe.cuisine, current)
      }
    })

    dislikedRecipes.forEach(recipe => {
      if (recipe.cuisine) {
        const current = cuisineStats.get(recipe.cuisine) || { 
          likedCount: 0, 
          dislikedCount: 0, 
          confidence: 0 
        }
        current.dislikedCount++
        cuisineStats.set(recipe.cuisine, current)
      }
    })

    // Calculate cuisine confidence
    cuisineStats.forEach((stats, cuisine) => {
      const total = stats.likedCount + stats.dislikedCount
      const preferenceRatio = stats.likedCount / total
      stats.confidence = preferenceRatio * Math.min(total / 3, 1) // Max confidence at 3+ samples
    })

    preferences.preferredCuisines = Array.from(cuisineStats.entries())
      .filter(([cuisine, stats]) => {
        return stats.likedCount > stats.dislikedCount &&
               stats.likedCount >= 2 &&
               stats.confidence >= 0.65 // High confidence for cuisine preference
      })
      .sort(([, a], [, b]) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(([cuisine]) => cuisine)

    // Only mark cuisines as disliked with very strong evidence
    preferences.dislikedCuisines = Array.from(cuisineStats.entries())
      .filter(([cuisine, stats]) => {
        return stats.dislikedCount > stats.likedCount &&
               stats.dislikedCount >= 3 && // Need multiple dislikes
               stats.confidence <= 0.2 && // Very low preference
               stats.likedCount === 0 // Never liked this cuisine
      })
      .sort(([, a], [, b]) => a.confidence - b.confidence)
      .slice(0, 2) // Very conservative - max 2 disliked cuisines
      .map(([cuisine]) => cuisine)

    // Learn difficulty preferences (more forgiving)
    const difficultyPreferences = new Map<string, number>()
    likedRecipes.forEach(recipe => {
      difficultyPreferences.set(recipe.difficulty, (difficultyPreferences.get(recipe.difficulty) || 0) + 1)
    })

    preferences.preferredDifficulty = Array.from(difficultyPreferences.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([difficulty]) => difficulty)

    // Learn average cooking time preference
    if (likedRecipes.length > 0) {
      const totalTime = likedRecipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0)
      preferences.averageCookingTime = Math.round(totalTime / likedRecipes.length)
    }

    console.log('📊 Updated user preferences with confidence scoring:', {
      preferredIngredients: preferences.preferredIngredients.slice(0, 5),
      dislikedIngredients: preferences.dislikedIngredients,
      preferredCuisines: preferences.preferredCuisines,
      dislikedCuisines: preferences.dislikedCuisines,
      averageCookingTime: preferences.averageCookingTime,
      totalLikedRecipes: likedRecipes.length,
      totalDislikedRecipes: dislikedRecipes.length
    })
  }

  static async getPersonalizationPrompt(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId)
      
      if (preferences.likedRecipes.length === 0 && preferences.dislikedRecipes.length === 0) {
        return '' // No personalization data yet
      }

      let prompt = '\n\nPERSONALIZATION BASED ON USER PREFERENCES:'

      if (preferences.preferredIngredients.length > 0) {
        prompt += `\nUSER LOVES THESE INGREDIENTS: ${preferences.preferredIngredients.slice(0, 8).join(', ')}`
      }

      if (preferences.dislikedIngredients.length > 0) {
        prompt += `\nUSER DISLIKES THESE INGREDIENTS: ${preferences.dislikedIngredients.slice(0, 5).join(', ')} (avoid if possible)`
      }

      if (preferences.preferredCuisines.length > 0) {
        prompt += `\nUSER'S FAVORITE CUISINES: ${preferences.preferredCuisines.join(', ')}`
      }

      if (preferences.dislikedCuisines.length > 0) {
        prompt += `\nUSER DISLIKES THESE CUISINES: ${preferences.dislikedCuisines.join(', ')}`
      }

      if (preferences.preferredDifficulty.length > 0) {
        prompt += `\nUSER PREFERS ${preferences.preferredDifficulty[0].toUpperCase()} DIFFICULTY RECIPES`
      }

      prompt += `\nUSER'S PREFERRED COOKING TIME: Around ${preferences.averageCookingTime} minutes`

      prompt += '\n\nPlease incorporate these preferences into the recipe while still using the pantry ingredients!'

      return prompt
    } catch (error) {
      console.error('Failed to generate personalization prompt:', error)
      return ''
    }
  }

  static async getRecommendationBonus(userId: string): Promise<{
    preferredIngredients: string[]
    avoidIngredients: string[]
    preferredCuisine?: string
    preferredDifficulty?: string
  }> {
    try {
      const preferences = await this.getUserPreferences(userId)
      
      return {
        preferredIngredients: preferences.preferredIngredients.slice(0, 5),
        avoidIngredients: preferences.dislikedIngredients.slice(0, 3),
        preferredCuisine: preferences.preferredCuisines[0],
        preferredDifficulty: preferences.preferredDifficulty[0] as any
      }
    } catch (error) {
      console.error('Failed to get recommendation bonus:', error)
      return {
        preferredIngredients: [],
        avoidIngredients: []
      }
    }
  }

  static async getUserStats(userId: string): Promise<{
    totalLikes: number
    totalDislikes: number
    topCuisine?: string
    favoriteIngredients: string[]
    averageCookingTime: number
  }> {
    try {
      const preferences = await this.getUserPreferences(userId)
      
      return {
        totalLikes: preferences.likedRecipes.length,
        totalDislikes: preferences.dislikedRecipes.length,
        topCuisine: preferences.preferredCuisines[0],
        favoriteIngredients: preferences.preferredIngredients.slice(0, 5),
        averageCookingTime: preferences.averageCookingTime
      }
    } catch (error) {
      console.error('Failed to get user stats:', error)
      return {
        totalLikes: 0,
        totalDislikes: 0,
        favoriteIngredients: [],
        averageCookingTime: 30
      }
    }
  }
} 
 
 