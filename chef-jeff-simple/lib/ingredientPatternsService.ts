import AsyncStorage from '@react-native-async-storage/async-storage'
import { IngredientDatabase } from './ingredientDatabase.js'

interface IngredientUsage {
  name: string
  count: number
  lastUsed: number
  category: string
  avgSessionsWithOthers: string[] // Ingredients often used together
}

interface IngredientPattern {
  combination: string[] // Sorted ingredient names
  frequency: number
  lastUsed: number
  avgCookingTime: number
  preferredCuisines: string[]
}

interface QuickSuggestion {
  name: string
  reason: string
  category: string
  priority: number // Higher = more important
  type: 'frequent' | 'complementary' | 'missing_category' | 'seasonal'
}

export class IngredientPatternsService {
  private static readonly USAGE_KEY = 'chef_jeff_ingredient_usage'
  private static readonly PATTERNS_KEY = 'chef_jeff_ingredient_patterns'
  private static readonly MAX_STORED_PATTERNS = 100
  private static readonly MIN_FREQUENCY_FOR_SUGGESTION = 2

  // Track when user adds an ingredient to pantry
  static async recordIngredientUsage(ingredients: string[]): Promise<void> {
    try {
      const currentUsage = await this.getIngredientUsage()
      const timestamp = Date.now()

      // Update usage counts and metadata
      ingredients.forEach(ingredient => {
        const normalizedName = this.normalizeIngredientName(ingredient)
        const ingredientInfo = IngredientDatabase.findIngredient(ingredient)
        const category = ingredientInfo?.category || 'other'

        if (!currentUsage[normalizedName]) {
          currentUsage[normalizedName] = {
            name: ingredientInfo?.name || ingredient,
            count: 0,
            lastUsed: timestamp,
            category,
            avgSessionsWithOthers: []
          }
        }

        currentUsage[normalizedName].count++
        currentUsage[normalizedName].lastUsed = timestamp
        
        // Track ingredients used together in this session
        const othersInSession = ingredients
          .filter(other => other !== ingredient)
          .map(other => this.normalizeIngredientName(other))
        
        // Add to co-occurrence tracking (keep last 10 sessions)
        othersInSession.forEach(other => {
          if (!currentUsage[normalizedName].avgSessionsWithOthers.includes(other)) {
            currentUsage[normalizedName].avgSessionsWithOthers.push(other)
          }
        })
        
        // Keep only most recent co-occurrences (max 10)
        if (currentUsage[normalizedName].avgSessionsWithOthers.length > 10) {
          currentUsage[normalizedName].avgSessionsWithOthers = 
            currentUsage[normalizedName].avgSessionsWithOthers.slice(-10)
        }
      })

      // Record ingredient combination patterns
      if (ingredients.length >= 2) {
        await this.recordIngredientPattern(ingredients, timestamp)
      }

      await AsyncStorage.setItem(this.USAGE_KEY, JSON.stringify(currentUsage))
    } catch (error) {
      console.log('ℹ️ Could not record ingredient usage:', error)
    }
  }

  // Record successful ingredient combinations
  private static async recordIngredientPattern(
    ingredients: string[], 
    timestamp: number,
    cookingTime?: number,
    cuisine?: string
  ): Promise<void> {
    try {
      const patterns = await this.getIngredientPatterns()
      
      // Normalize and sort ingredients for consistent pattern matching
      const normalizedCombination = ingredients
        .map(ing => this.normalizeIngredientName(ing))
        .sort()
      
      const patternKey = normalizedCombination.join('|')
      
      if (!patterns[patternKey]) {
        patterns[patternKey] = {
          combination: normalizedCombination,
          frequency: 0,
          lastUsed: timestamp,
          avgCookingTime: cookingTime || 30,
          preferredCuisines: []
        }
      }

      patterns[patternKey].frequency++
      patterns[patternKey].lastUsed = timestamp
      
      if (cookingTime) {
        // Update average cooking time
        patterns[patternKey].avgCookingTime = 
          (patterns[patternKey].avgCookingTime + cookingTime) / 2
      }

      if (cuisine && !patterns[patternKey].preferredCuisines.includes(cuisine)) {
        patterns[patternKey].preferredCuisines.push(cuisine)
        // Keep only top 3 cuisines
        if (patterns[patternKey].preferredCuisines.length > 3) {
          patterns[patternKey].preferredCuisines = patterns[patternKey].preferredCuisines.slice(-3)
        }
      }

      // Clean up old patterns (keep only most frequent ones)
      const patternEntries = Object.entries(patterns)
      if (patternEntries.length > this.MAX_STORED_PATTERNS) {
        // Sort by frequency and recency, keep top patterns
        const sortedPatterns = patternEntries
          .sort(([,a], [,b]) => {
            const aScore = a.frequency * 0.7 + (Date.now() - a.lastUsed) / (1000 * 60 * 60 * 24) * 0.3
            const bScore = b.frequency * 0.7 + (Date.now() - b.lastUsed) / (1000 * 60 * 60 * 24) * 0.3
            return bScore - aScore
          })
          .slice(0, this.MAX_STORED_PATTERNS)

        const cleanedPatterns: { [key: string]: IngredientPattern } = {}
        sortedPatterns.forEach(([key, pattern]) => {
          cleanedPatterns[key] = pattern
        })
        
        await AsyncStorage.setItem(this.PATTERNS_KEY, JSON.stringify(cleanedPatterns))
      } else {
        await AsyncStorage.setItem(this.PATTERNS_KEY, JSON.stringify(patterns))
      }
    } catch (error) {
      console.log('ℹ️ Could not record ingredient pattern:', error)
    }
  }

  // Get intelligent quick suggestions based on usage patterns
  static async getQuickSuggestions(
    currentPantry: string[], 
    maxSuggestions: number = 6
  ): Promise<QuickSuggestion[]> {
    try {
      const usage = await this.getIngredientUsage()
      const patterns = await this.getIngredientPatterns()
      const suggestions: QuickSuggestion[] = []

      // Analyze current pantry composition
      const pantryAnalysis = this.analyzePantryComposition(currentPantry)

      // 1. Suggest frequently used ingredients not in current pantry
      const frequentSuggestions = await this.getFrequentIngredientSuggestions(usage, currentPantry)
      suggestions.push(...frequentSuggestions)

      // 2. Suggest complementary ingredients based on patterns
      const complementarySuggestions = await this.getComplementarySuggestions(patterns, currentPantry)
      suggestions.push(...complementarySuggestions)

      // 3. Suggest ingredients to complete missing categories
      const categorySuggestions = await this.getMissingCategorySuggestions(usage, pantryAnalysis)
      suggestions.push(...categorySuggestions)

      // Sort by priority and return top suggestions
      return suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, maxSuggestions)
    } catch (error) {
      console.log('ℹ️ Could not get quick suggestions:', error)
      return this.getFallbackSuggestions()
    }
  }

  // Get frequent ingredients not currently in pantry
  private static async getFrequentIngredientSuggestions(
    usage: { [key: string]: IngredientUsage },
    currentPantry: string[]
  ): Promise<QuickSuggestion[]> {
    const currentNormalized = currentPantry.map(item => this.normalizeIngredientName(item))
    const suggestions: QuickSuggestion[] = []

    Object.entries(usage)
      .filter(([key, data]) => 
        data.count >= this.MIN_FREQUENCY_FOR_SUGGESTION &&
        !currentNormalized.includes(key)
      )
      .sort(([,a], [,b]) => {
        // Weight by frequency and recency
        const aScore = a.count * 0.7 + (Date.now() - a.lastUsed) / (1000 * 60 * 60 * 24) * -0.3
        const bScore = b.count * 0.7 + (Date.now() - b.lastUsed) / (1000 * 60 * 60 * 24) * -0.3
        return bScore - aScore
      })
      .slice(0, 3)
      .forEach(([key, data]) => {
        suggestions.push({
          name: data.name,
          reason: `You use this ${data.count} time(s)`,
          category: data.category,
          priority: 80 + data.count * 5,
          type: 'frequent'
        })
      })

    return suggestions
  }

  // Get complementary ingredients based on successful patterns
  private static async getComplementarySuggestions(
    patterns: { [key: string]: IngredientPattern },
    currentPantry: string[]
  ): Promise<QuickSuggestion[]> {
    const currentNormalized = currentPantry.map(item => this.normalizeIngredientName(item))
    const suggestions: QuickSuggestion[] = []
    const suggestionCounts: { [key: string]: number } = {}

    // Find patterns that partially match current pantry
    Object.values(patterns)
      .filter(pattern => pattern.frequency >= this.MIN_FREQUENCY_FOR_SUGGESTION)
      .forEach(pattern => {
        const matchingIngredients = pattern.combination.filter(ing => 
          currentNormalized.includes(ing)
        )
        
        // If we have some but not all ingredients from this pattern
        if (matchingIngredients.length > 0 && matchingIngredients.length < pattern.combination.length) {
          const missingIngredients = pattern.combination.filter(ing => 
            !currentNormalized.includes(ing)
          )
          
          missingIngredients.forEach(missing => {
            if (!suggestionCounts[missing]) {
              suggestionCounts[missing] = 0
            }
            suggestionCounts[missing] += pattern.frequency
          })
        }
      })

    // Convert to suggestions
    Object.entries(suggestionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([ingredient, count]) => {
        const ingredientInfo = IngredientDatabase.findIngredient(ingredient)
        suggestions.push({
          name: ingredientInfo?.name || ingredient,
          reason: `Often used with your current ingredients`,
          category: ingredientInfo?.category || 'other',
          priority: 70 + count * 3,
          type: 'complementary'
        })
      })

    return suggestions
  }

  // Suggest ingredients to complete missing categories
  private static async getMissingCategorySuggestions(
    usage: { [key: string]: IngredientUsage },
    pantryAnalysis: { [category: string]: number }
  ): Promise<QuickSuggestion[]> {
    const suggestions: QuickSuggestion[] = []
    
    // Identify missing critical categories
    const missingCategories: string[] = []
    if (pantryAnalysis.protein === 0) missingCategories.push('protein')
    if (pantryAnalysis.vegetable === 0) missingCategories.push('vegetable')
    if (pantryAnalysis.grain === 0) missingCategories.push('grain')

    // Suggest most used ingredients from missing categories
    missingCategories.forEach(category => {
      const categoryIngredients = Object.entries(usage)
        .filter(([,data]) => data.category === category)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 1)

      categoryIngredients.forEach(([key, data]) => {
        suggestions.push({
          name: data.name,
          reason: `Complete your ${category} options`,
          category: data.category,
          priority: 60 + data.count * 2,
          type: 'missing_category'
        })
      })
    })

    return suggestions
  }

  // Helper methods
  private static normalizeIngredientName(ingredient: string): string {
    return ingredient.toLowerCase().trim()
  }

  private static analyzePantryComposition(pantry: string[]): { [category: string]: number } {
    const composition: { [category: string]: number } = {
      protein: 0,
      vegetable: 0,
      grain: 0,
      dairy: 0,
      seasoning: 0,
      other: 0
    }

    pantry.forEach(item => {
      const ingredient = IngredientDatabase.findIngredient(item)
      const category = ingredient?.category || 'other'
      composition[category] = (composition[category] || 0) + 1
    })

    return composition
  }

  private static async getIngredientUsage(): Promise<{ [key: string]: IngredientUsage }> {
    try {
      const stored = await AsyncStorage.getItem(this.USAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  private static async getIngredientPatterns(): Promise<{ [key: string]: IngredientPattern }> {
    try {
      const stored = await AsyncStorage.getItem(this.PATTERNS_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  private static getFallbackSuggestions(): QuickSuggestion[] {
    return [
      { name: 'Chicken breast', reason: 'Popular protein', category: 'protein', priority: 90, type: 'frequent' },
      { name: 'Onion', reason: 'Versatile vegetable', category: 'vegetable', priority: 85, type: 'frequent' },
      { name: 'Rice', reason: 'Staple grain', category: 'grain', priority: 80, type: 'frequent' },
      { name: 'Garlic', reason: 'Essential flavor', category: 'vegetable', priority: 75, type: 'frequent' },
      { name: 'Olive oil', reason: 'Cooking essential', category: 'fat', priority: 70, type: 'frequent' },
      { name: 'Salt', reason: 'Basic seasoning', category: 'seasoning', priority: 65, type: 'frequent' }
    ]
  }

  // Clear patterns (for testing or reset)
  static async clearPatterns(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USAGE_KEY)
      await AsyncStorage.removeItem(this.PATTERNS_KEY)
    } catch (error) {
      console.log('ℹ️ Could not clear patterns:', error)
    }
  }

  // Get usage statistics for debugging
  static async getUsageStats(): Promise<{
    totalIngredients: number
    totalPatterns: number
    mostUsedIngredients: Array<{ name: string, count: number }>
    topPatterns: Array<{ combination: string[], frequency: number }>
  }> {
    try {
      const usage = await this.getIngredientUsage()
      const patterns = await this.getIngredientPatterns()

      const mostUsed = Object.values(usage)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({ name: item.name, count: item.count }))

      const topPatterns = Object.values(patterns)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(pattern => ({ combination: pattern.combination, frequency: pattern.frequency }))

      return {
        totalIngredients: Object.keys(usage).length,
        totalPatterns: Object.keys(patterns).length,
        mostUsedIngredients: mostUsed,
        topPatterns
      }
    } catch {
      return {
        totalIngredients: 0,
        totalPatterns: 0,
        mostUsedIngredients: [],
        topPatterns: []
      }
    }
  }
} 