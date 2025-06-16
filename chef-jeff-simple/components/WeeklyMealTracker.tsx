import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { MealTrackerService, WeeklyMealData } from '../lib/mealTracker.js'

interface WeeklyMealTrackerProps {
  onMealAdded?: (newData: WeeklyMealData) => void
}

export const WeeklyMealTracker: React.FC<WeeklyMealTrackerProps> = ({ onMealAdded }) => {
  const [weeklyData, setWeeklyData] = useState<WeeklyMealData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeeklyData()
  }, [])

  const loadWeeklyData = async () => {
    try {
      const data = await MealTrackerService.getCurrentWeekData()
      setWeeklyData(data)
    } catch (error) {
      console.error('Error loading weekly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = async () => {
    try {
      const updatedData = await MealTrackerService.addCookedMeal()
      setWeeklyData(updatedData)
      onMealAdded?.(updatedData)
      
      // Show success message
      const motivationalMessage = MealTrackerService.getMotivationalMessage(
        updatedData.mealsCooked, 
        updatedData.weeklyGoal
      )
      Alert.alert('Meal Added! 🍳', motivationalMessage)
    } catch (error) {
      console.error('Error adding meal:', error)
      Alert.alert('Error', 'Failed to add meal. Please try again.')
    }
  }

  const handleGoalAdjustment = () => {
    if (!weeklyData) return
    
    Alert.prompt(
      'Weekly Goal 🎯',
      `Current goal: ${weeklyData.weeklyGoal} meals per week.\nEnter your new weekly cooking goal:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async (value) => {
            const newGoal = parseInt(value || '5')
            if (isNaN(newGoal) || newGoal < 1) {
              Alert.alert('Invalid Goal', 'Please enter a number between 1 and 21.')
              return
            }
            
            try {
              const updatedData = await MealTrackerService.updateWeeklyGoal(newGoal)
              setWeeklyData(updatedData)
              Alert.alert('Goal Updated! 🎯', `Your new weekly goal is ${newGoal} meals.`)
            } catch (error) {
              Alert.alert('Error', 'Failed to update goal. Please try again.')
            }
          }
        }
      ],
      'plain-text',
      weeklyData.weeklyGoal.toString()
    )
  }

  if (loading || !weeklyData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📊 Weekly Cooking Progress</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  const progressPercentage = MealTrackerService.getProgressPercentage(
    weeklyData.mealsCooked, 
    weeklyData.weeklyGoal
  )
  const motivationalMessage = MealTrackerService.getMotivationalMessage(
    weeklyData.mealsCooked, 
    weeklyData.weeklyGoal
  )
  const daysRemaining = MealTrackerService.getDaysRemainingInWeek()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Weekly Cooking Progress</Text>
        <TouchableOpacity onPress={handleGoalAdjustment} style={styles.goalButton}>
          <Text style={styles.goalButtonText}>⚙️ Goal</Text>
        </TouchableOpacity>
      </View>
      
      {/* Progress Circle */}
      <View style={styles.progressSection}>
        <View style={styles.progressCircle}>
          <View style={[styles.progressFill, { 
            transform: [{ rotate: `${(progressPercentage / 100) * 360}deg` }] 
          }]} />
          <View style={styles.progressInner}>
            <Text style={styles.progressNumber}>{weeklyData.mealsCooked}</Text>
            <Text style={styles.progressLabel}>of {weeklyData.weeklyGoal}</Text>
          </View>
        </View>
        
        <View style={styles.progressInfo}>
          <Text style={styles.motivationalText}>{motivationalMessage}</Text>
          <Text style={styles.progressPercentage}>{progressPercentage}% Complete</Text>
          {daysRemaining > 1 && (
            <Text style={styles.daysRemaining}>
              {daysRemaining} days left this week
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.addMealButton} onPress={handleAddMeal}>
          <Text style={styles.addMealButtonText}>+ Cooked a Meal!</Text>
        </TouchableOpacity>
        
        {weeklyData.mealsCooked >= weeklyData.weeklyGoal && (
          <View style={styles.congratsSection}>
            <Text style={styles.congratsText}>🏆 Goal Achieved!</Text>
            <Text style={styles.congratsSubtext}>You're crushing your cooking goals!</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EA580C',
    flex: 1,
  },
  goalButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  goalButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressCircle: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    marginRight: 15,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#EA580C',
    transformOrigin: 'right center',
  },
  progressInner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  progressLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressInfo: {
    flex: 1,
  },
  motivationalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '500',
    marginBottom: 2,
  },
  daysRemaining: {
    fontSize: 11,
    color: '#6B7280',
  },
  actionSection: {
    alignItems: 'center',
  },
  addMealButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addMealButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  congratsSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  congratsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 2,
  },
  congratsSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
}) 
 
 