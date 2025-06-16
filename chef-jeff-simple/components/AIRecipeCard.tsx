import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { AIRecipe } from '../lib/aiRecipeService'
import { ChefHatIcon } from './ChefHatIcon'

interface AIRecipeCardProps {
  recipe: AIRecipe
  onViewDetails: (recipe: AIRecipe) => void
  onRate?: (recipe: AIRecipe, rating: 'like' | 'dislike') => void
  userId?: string
  initialRating?: 'like' | 'dislike' | null
  pantryItems?: string[] // Add pantry items to calculate match percentage
}

export const AIRecipeCard: React.FC<AIRecipeCardProps> = ({ 
  recipe, 
  onViewDetails, 
  onRate,
  userId,
  initialRating = null,
  pantryItems = []
}) => {
  const [currentRating, setCurrentRating] = useState<'like' | 'dislike' | null>(initialRating)
  const [imageLoadError, setImageLoadError] = useState(false)

  useEffect(() => {
    setCurrentRating(initialRating)
  }, [initialRating])

  const handleRate = (rating: 'like' | 'dislike') => {
    // If clicking the same rating, remove it (toggle off)
    const newRating = currentRating === rating ? null : rating
    setCurrentRating(newRating)
    
    if (onRate && newRating) {
      onRate(recipe, newRating)
    }
  }

  // Calculate have/need counts
  const getIngredientCounts = () => {
    const normalizedPantry = pantryItems.map(item => item.toLowerCase().trim())
    let have = 0
    let need = 0
    
    // If this is a pantry-only recipe, all ingredients should be available
    const isPantryOnly = recipe.tags?.includes('pantry-only')
    
    // Common kitchen staples that most people have
    const commonEnhancements = [
      'salt', 'black pepper', 'white pepper', 'pepper', 'garlic powder', 'onion powder',
      'olive oil', 'vegetable oil', 'cooking oil', 'oil', 'butter',
      'lemon juice', 'lime juice', 'vinegar', 'white vinegar', 'apple cider vinegar',
      'oregano', 'thyme', 'paprika', 'cumin', 'red pepper flakes', 'chili flakes'
    ]
    
    recipe.ingredients.forEach(ingredient => {
      const ingredientName = ingredient.name.toLowerCase()
      
      if (isPantryOnly) {
        // For pantry-only recipes, count all ingredients as "have"
        have++
      } else {
        // Check if it's in pantry
        const isInPantry = normalizedPantry.some(pantryItem => 
          pantryItem.includes(ingredientName) || ingredientName.includes(pantryItem)
        )
        
        // Check if it's a common enhancement
        const isCommonEnhancement = commonEnhancements.some(enhancement =>
          ingredientName.includes(enhancement) || enhancement.includes(ingredientName)
        )
        
        if (isInPantry || isCommonEnhancement) {
          have++
        } else {
          need++
        }
      }
    })
    
    return { have, need }
  }

  const { have, need } = getIngredientCounts()

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981'
      case 'Medium': return '#F59E0B'
      case 'Hard': return '#EF4444'
      default: return '#6B7280'
    }
  }

  return (
    <View style={styles.card}>
      {/* Recipe image with match percentage overlay - only show for recipes with valid images */}
      {recipe.imageUrl && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: recipe.imageUrl }} 
            style={styles.recipeImage}
            resizeMode="cover"
            onLoad={() => {
              console.log('✅ Recipe image loaded successfully:', recipe.title)
              setImageLoadError(false)
            }}
            onError={(error) => {
              console.log('❌ Failed to load recipe image:', recipe.title, 'URL:', recipe.imageUrl, 'Error:', error.nativeEvent.error)
              setImageLoadError(true)
            }}
            onLoadStart={() => console.log('🔄 Loading image for:', recipe.title, recipe.imageUrl)}
          />
          
          {/* Fallback to placeholder if image fails */}
          {imageLoadError && (
            <View style={[styles.recipeImage, styles.imagePlaceholder, { position: 'absolute', top: 0, left: 0 }]}>
              <Text style={styles.placeholderText}>🍽️</Text>
              <Text style={styles.placeholderSubtext}>Image Unavailable</Text>
            </View>
          )}
        </View>
      )}

      {/* Recipe content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
          {recipe.tags?.includes('pantry-only') && (
            <View style={styles.pantryOnlyBadge}>
              <Text style={styles.pantryOnlyText}>🥄 Pantry Only</Text>
            </View>
          )}
        </View>
        
        {/* Ingredient counts */}
        <View style={styles.ingredientCounts}>
          <View style={styles.countItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.countText}>Have: {have}</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={styles.needIcon}>🛒</Text>
            <Text style={styles.countTextNeed}>Need: {need}</Text>
          </View>
        </View>

        {/* Missing ingredients preview */}
        {need > 0 && !recipe.tags?.includes('pantry-only') && (
          <View style={styles.missingIngredients}>
            <Text style={styles.missingLabel}>Missing:</Text>
            <Text style={styles.missingText} numberOfLines={1}>
              {recipe.ingredients
                .filter(ingredient => {
                  const ingredientName = ingredient.name.toLowerCase()
                  
                  // Check if it's in pantry
                  const isInPantry = pantryItems.some(pantryItem => 
                    pantryItem.toLowerCase().includes(ingredientName) || 
                    ingredientName.includes(pantryItem.toLowerCase())
                  )
                  
                  // Check if it's a common enhancement (don't show as missing)
                  const commonEnhancements = [
                    'salt', 'black pepper', 'white pepper', 'pepper', 'garlic powder', 'onion powder',
                    'olive oil', 'vegetable oil', 'cooking oil', 'oil', 'butter',
                    'lemon juice', 'lime juice', 'vinegar', 'white vinegar', 'apple cider vinegar',
                    'oregano', 'thyme', 'paprika', 'cumin', 'red pepper flakes', 'chili flakes'
                  ]
                  const isCommonEnhancement = commonEnhancements.some(enhancement =>
                    ingredientName.includes(enhancement) || enhancement.includes(ingredientName)
                  )
                  
                  // Only show as missing if it's not in pantry AND not a common enhancement
                  return !isInPantry && !isCommonEnhancement
                })
                .slice(0, 2)
                .map(ing => ing.name)
                .join(', ')}
              {need > 2 && '...'}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => onViewDetails(recipe)}
          >
            <Text style={styles.viewButtonText}>View Recipe</Text>
          </TouchableOpacity>
          
          {/* Like/Dislike buttons */}
          {onRate && userId && (
            <View style={styles.ratingButtons}>
              <TouchableOpacity 
                style={[
                  styles.ratingButton,
                  currentRating === 'like' && styles.likedButton
                ]}
                onPress={() => handleRate('like')}
              >
                <Text style={[
                  styles.ratingButtonText,
                  currentRating === 'like' && styles.likedButtonText
                ]}>
                  {currentRating === 'like' ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.ratingButton,
                  currentRating === 'dislike' && styles.dislikedButton
                ]}
                onPress={() => handleRate('dislike')}
              >
                <Text style={[
                  styles.ratingButtonText,
                  currentRating === 'dislike' && styles.dislikedButtonText
                ]}>
                  {currentRating === 'dislike' ? '💔' : '👎'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
    position: 'relative',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
    lineHeight: 24,
    flex: 1,
  },
  pantryOnlyBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pantryOnlyText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  ingredientCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  needIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  countText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  countTextNeed: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
  missingIngredients: {
    marginBottom: 16,
  },
  missingLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  missingText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  likedButton: {
    backgroundColor: '#FEE2E2',
  },
  dislikedButton: {
    backgroundColor: '#F3F4F6',
  },
  ratingButtonText: {
    fontSize: 16,
  },
  likedButtonText: {
    fontSize: 16,
  },
  dislikedButtonText: {
    fontSize: 16,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  placeholderSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
}) 
 