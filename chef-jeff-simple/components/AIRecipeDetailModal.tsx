import React from 'react'
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
import { AIRecipe } from '../lib/aiRecipeService'
import { ChefHatIcon } from './ChefHatIcon'

interface AIRecipeDetailModalProps {
  recipe: AIRecipe | null
  visible: boolean
  onClose: () => void
}

export const AIRecipeDetailModal: React.FC<AIRecipeDetailModalProps> = ({ 
  recipe, 
  visible, 
  onClose 
}) => {
  if (!recipe) return null

  const getMoodEmoji = (mood?: string) => {
    const moodMap: { [key: string]: string } = {
      comfort: '🫂',
      energized: '⚡',
      romantic: '💕',
      focused: '🎯',
      adventurous: '🌟',
      nostalgic: '📸',
      healthy: '🥗',
      indulgent: '🍰'
    }
    return mood ? moodMap[mood] || '🍽️' : '🍽️'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981'
      case 'Medium': return '#F59E0B'
      case 'Hard': return '#EF4444'
      default: return '#6B7280'
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recipe Header */}
          <View style={styles.recipeHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{recipe.title}</Text>
              {/* FUTURE: Add mood feature when it's added to AIRecipe interface */}
              {/* {recipe.mood && (
                <View style={styles.moodBadge}>
                  <Text style={styles.moodEmoji}>{getMoodEmoji(recipe.mood)}</Text>
                  <Text style={styles.moodText}>{recipe.mood}</Text>
                </View>
              )} */}
            </View>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>

          {/* Recipe Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⏱️</Text>
                <Text style={styles.infoLabel}>Cooking Time</Text>
                <Text style={styles.infoValue}>{recipe.cookingTime} min</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>👥</Text>
                <Text style={styles.infoLabel}>Servings</Text>
                <Text style={styles.infoValue}>{recipe.servings}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
                  {recipe.difficulty}
                </Text>
              </View>
              {recipe.cuisine && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>🌍</Text>
                  <Text style={styles.infoLabel}>Cuisine</Text>
                  <Text style={styles.infoValue}>{recipe.cuisine}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Nutrition Info */}
          {recipe.nutritionInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Nutrition Info (per serving)</Text>
              <View style={styles.nutritionGrid}>
                {recipe.nutritionInfo.calories && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.nutritionInfo.calories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                )}
                {recipe.nutritionInfo.protein && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.nutritionInfo.protein}</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                )}
                {recipe.nutritionInfo.carbs && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.nutritionInfo.carbs}</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                )}
                {recipe.nutritionInfo.fat && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.nutritionInfo.fat}</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛒 Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientBullet}>•</Text>
                <Text style={styles.ingredientText}>
                  {ingredient.amount} {ingredient.unit ? `${ingredient.unit} ` : ''}{ingredient.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Instructions</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>



          {/* AI Attribution */}
          <View style={styles.aiAttribution}>
                            <Text style={styles.aiAttributionText}>✨ Generated by Chef Jeff</Text>
            <Text style={styles.aiAttributionSubtext}>
              This recipe was personally created for you based on your pantry and preferences
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  recipeHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moodEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  moodText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  difficultyBadge: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ingredientBullet: {
    fontSize: 16,
    color: '#EA580C',
    marginRight: 12,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },

  aiAttribution: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  aiAttributionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  aiAttributionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
}) 
 
 
 