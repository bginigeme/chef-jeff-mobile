import AsyncStorage from '@react-native-async-storage/async-storage'

export interface WeeklyMealData {
  weekStart: string // ISO date string for the start of the week (Monday)
  mealsCooked: number
  weeklyGoal: number
  lastUpdated: string
}

export class MealTrackerService {
  private static STORAGE_KEY = 'weekly_meal_tracker'
  
  // Get the start of the current week (Monday)
  private static getWeekStart(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday = 0, so -6 to get to Monday
    const monday = new Date(now)
    monday.setDate(now.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday
  }
  
  // Get current week's meal data
  static async getCurrentWeekData(): Promise<WeeklyMealData> {
    try {
      const currentWeekStart = this.getWeekStart().toISOString()
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY)
      
      if (storedData) {
        const parsed: WeeklyMealData = JSON.parse(storedData)
        
        // Check if we're still in the same week
        if (parsed.weekStart === currentWeekStart) {
          return parsed
        }
      }
      
      // New week or no data - create fresh weekly data
      const newWeekData: WeeklyMealData = {
        weekStart: currentWeekStart,
        mealsCooked: 0,
        weeklyGoal: 5, // Default goal of 5 meals per week
        lastUpdated: new Date().toISOString()
      }
      
      await this.saveWeekData(newWeekData)
      return newWeekData
    } catch (error) {
      console.error('Error getting current week data:', error)
      // Return default data if there's an error
      return {
        weekStart: this.getWeekStart().toISOString(),
        mealsCooked: 0,
        weeklyGoal: 5,
        lastUpdated: new Date().toISOString()
      }
    }
  }
  
  // Save week data to storage
  private static async saveWeekData(data: WeeklyMealData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving week data:', error)
    }
  }
  
  // Add a cooked meal to the current week
  static async addCookedMeal(): Promise<WeeklyMealData> {
    try {
      const currentData = await this.getCurrentWeekData()
      const updatedData: WeeklyMealData = {
        ...currentData,
        mealsCooked: currentData.mealsCooked + 1,
        lastUpdated: new Date().toISOString()
      }
      
      await this.saveWeekData(updatedData)
      console.log('🍳 Meal added! Total this week:', updatedData.mealsCooked)
      return updatedData
    } catch (error) {
      console.error('Error adding cooked meal:', error)
      return await this.getCurrentWeekData()
    }
  }
  
  // Update weekly goal
  static async updateWeeklyGoal(newGoal: number): Promise<WeeklyMealData> {
    try {
      const currentData = await this.getCurrentWeekData()
      const updatedData: WeeklyMealData = {
        ...currentData,
        weeklyGoal: Math.max(1, Math.min(21, newGoal)), // Min 1, max 21 meals per week
        lastUpdated: new Date().toISOString()
      }
      
      await this.saveWeekData(updatedData)
      return updatedData
    } catch (error) {
      console.error('Error updating weekly goal:', error)
      return await this.getCurrentWeekData()
    }
  }
  
  // Get progress percentage
  static getProgressPercentage(mealsCooked: number, weeklyGoal: number): number {
    return Math.min(100, Math.round((mealsCooked / weeklyGoal) * 100))
  }
  
  // Get motivational message based on progress
  static getMotivationalMessage(mealsCooked: number, weeklyGoal: number): string {
    const percentage = this.getProgressPercentage(mealsCooked, weeklyGoal)
    
    if (percentage === 0) {
      return "Let's start cooking!"
    } else if (percentage < 25) {
      return "Great start! Keep going! 💪"
    } else if (percentage < 50) {
      return "You're building momentum! 🔥"
    } else if (percentage < 75) {
      return "Halfway there! Amazing work! 🌟"
    } else if (percentage < 100) {
      return "So close to your goal! 🎯"
    } else {
      return "Goal achieved! You're a cooking superstar! 🏆"
    }
  }
  
  // Get days remaining in current week
  static getDaysRemainingInWeek(): number {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    return daysUntilSunday + 1 // Include today
  }
} 
 
 