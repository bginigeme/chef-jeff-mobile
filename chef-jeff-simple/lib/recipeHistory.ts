import AsyncStorage from '@react-native-async-storage/async-storage'
import { AIRecipe } from './aiRecipeService'

const RECIPE_HISTORY_KEY = 'chef_jeff_recipe_history'
const MAX_HISTORY_SIZE = 50 // Keep last 50 recipes

export interface RecipeHistoryItem extends AIRecipe {
  generatedAt: string
  isFavorite?: boolean
  userRating?: number // 1-5 stars
  userNotes?: string
}

export class RecipeHistoryService {
  static async saveRecipe(recipe: AIRecipe): Promise<void> {
    try {
      const history = await this.getHistory()
      
      const historyItem: RecipeHistoryItem = {
        ...recipe,
        generatedAt: new Date().toISOString(),
        isFavorite: false
      }
      
      // Add to beginning of array
      const updatedHistory = [historyItem, ...history.filter(item => item.id !== recipe.id)]
      
      // Keep only the most recent recipes
      const trimmedHistory = updatedHistory.slice(0, MAX_HISTORY_SIZE)
      
      await AsyncStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(trimmedHistory))
    } catch (error) {
      console.error('Failed to save recipe to history:', error)
    }
  }

  static async getHistory(): Promise<RecipeHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(RECIPE_HISTORY_KEY)
      return historyJson ? JSON.parse(historyJson) : []
    } catch (error) {
      console.error('Failed to load recipe history:', error)
      return []
    }
  }

  static async getFavorites(): Promise<RecipeHistoryItem[]> {
    try {
      const history = await this.getHistory()
      return history.filter(recipe => recipe.isFavorite)
    } catch (error) {
      console.error('Failed to load favorite recipes:', error)
      return []
    }
  }

  static async toggleFavorite(recipeId: string): Promise<void> {
    try {
      const history = await this.getHistory()
      const updatedHistory = history.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, isFavorite: !recipe.isFavorite }
          : recipe
      )
      
      await AsyncStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  static async rateRecipe(recipeId: string, rating: number): Promise<void> {
    try {
      const history = await this.getHistory()
      const updatedHistory = history.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, userRating: rating }
          : recipe
      )
      
      await AsyncStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to rate recipe:', error)
    }
  }

  static async addNotes(recipeId: string, notes: string): Promise<void> {
    try {
      const history = await this.getHistory()
      const updatedHistory = history.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, userNotes: notes }
          : recipe
      )
      
      await AsyncStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to add notes to recipe:', error)
    }
  }

  static async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const history = await this.getHistory()
      const updatedHistory = history.filter(recipe => recipe.id !== recipeId)
      
      await AsyncStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to delete recipe:', error)
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECIPE_HISTORY_KEY)
    } catch (error) {
      console.error('Failed to clear recipe history:', error)
    }
  }

  static async searchHistory(query: string): Promise<RecipeHistoryItem[]> {
    try {
      const history = await this.getHistory()
      const lowercaseQuery = query.toLowerCase()
      
      return history.filter(recipe => 
        recipe.title.toLowerCase().includes(lowercaseQuery) ||
        recipe.description.toLowerCase().includes(lowercaseQuery) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowercaseQuery)) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
    } catch (error) {
      console.error('Failed to search recipe history:', error)
      return []
    }
  }

  static async getRecipesByTag(tag: string): Promise<RecipeHistoryItem[]> {
    try {
      const history = await this.getHistory()
      return history.filter(recipe => recipe.tags.includes(tag))
    } catch (error) {
      console.error('Failed to get recipes by tag:', error)
      return []
    }
  }

  static async getStats(): Promise<{
    totalRecipes: number
    favoriteCount: number
    averageRating: number
    topTags: Array<{ tag: string; count: number }>
    topCuisines: Array<{ cuisine: string; count: number }>
  }> {
    try {
      const history = await this.getHistory()
      
      const totalRecipes = history.length
      const favoriteCount = history.filter(r => r.isFavorite).length
      
      const ratings = history.filter(r => r.userRating).map(r => r.userRating!)
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      
      // Count tags
      const tagCounts = history.reduce((acc, recipe) => {
        recipe.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
      
      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      // Count cuisines
      const cuisineCounts = history.reduce((acc, recipe) => {
        if (recipe.cuisine) {
          acc[recipe.cuisine] = (acc[recipe.cuisine] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
      
      const topCuisines = Object.entries(cuisineCounts)
        .map(([cuisine, count]) => ({ cuisine, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      return {
        totalRecipes,
        favoriteCount,
        averageRating,
        topTags,
        topCuisines
      }
    } catch (error) {
      console.error('Failed to get recipe stats:', error)
      return {
        totalRecipes: 0,
        favoriteCount: 0,
        averageRating: 0,
        topTags: [],
        topCuisines: []
      }
    }
  }
}

export const recipeHistory = new RecipeHistoryService() 