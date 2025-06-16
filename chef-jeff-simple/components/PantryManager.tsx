import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { IngredientDatabase, IngredientInfo } from '../lib/ingredientDatabase'
import { IngredientPatternsService } from '../lib/ingredientPatternsService'

interface PantryManagerProps {
  pantryItems: string[]
  onUpdatePantry: (items: string[]) => void
  style?: any
}

export const PantryManager: React.FC<PantryManagerProps> = ({ 
  pantryItems, 
  onUpdatePantry, 
  style 
}) => {
  const [newItem, setNewItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [suggestions, setSuggestions] = useState<IngredientInfo[]>([])
  const [showValidation, setShowValidation] = useState(false)
  const [quickSuggestions, setQuickSuggestions] = useState<Array<{
    name: string
    reason: string
    category: string
    priority: number
    type: 'frequent' | 'complementary' | 'missing_category' | 'seasonal'
  }>>([])
  const [loadingQuickSuggestions, setLoadingQuickSuggestions] = useState(false)

  // Load quick suggestions when pantry changes
  useEffect(() => {
    loadQuickSuggestions()
  }, [pantryItems])

  const loadQuickSuggestions = async () => {
    try {
      setLoadingQuickSuggestions(true)
      const suggestions = await IngredientPatternsService.getQuickSuggestions(pantryItems, 6)
      setQuickSuggestions(suggestions)
    } catch (error) {
      console.log('Could not load quick suggestions:', error)
    } finally {
      setLoadingQuickSuggestions(false)
    }
  }

  const addItemInternal = async (itemToAdd?: string) => {
    const ingredient = itemToAdd || newItem.trim()
    if (!ingredient) {
      Alert.alert('Error', 'Please enter an ingredient')
      return
    }
    
    // Check if item already exists
    if (pantryItems.some(item => item.toLowerCase() === ingredient.toLowerCase())) {
      Alert.alert('Already Added', `${ingredient} is already in your pantry`)
      setNewItem('')
      setSuggestions([])
      return
    }

    // Try to find ingredient in database for smart naming
    const foundIngredient = IngredientDatabase.findIngredient(ingredient)
    const finalName = foundIngredient ? foundIngredient.name : ingredient
    
    // Add new item
    const updatedItems = [...pantryItems, finalName]
    onUpdatePantry(updatedItems)
    
    // Record ingredient usage pattern
    try {
      await IngredientPatternsService.recordIngredientUsage([finalName])
    } catch (error) {
      console.log('Could not record ingredient usage:', error)
    }
    
    setNewItem('')
    setSuggestions([])
    setIsAdding(false)
    
    // Show validation after adding items
    setShowValidation(true)
  }

  const addItem = () => addItemInternal()
  const addSuggestion = (suggestion: string) => addItemInternal(suggestion)

  const handleInputChange = (text: string) => {
    setNewItem(text)
    if (text.length >= 2) {
      const newSuggestions = IngredientDatabase.getSuggestions(text, 5)
      setSuggestions(newSuggestions)
    } else {
      setSuggestions([])
    }
  }

  const removeItem = (indexToRemove: number) => {
    const updatedItems = pantryItems.filter((_, index) => index !== indexToRemove)
    onUpdatePantry(updatedItems)
    setShowValidation(true)
  }

  // Get pantry validation info
  const validation = IngredientDatabase.validatePantryItems(pantryItems)
  
  // Group pantry items by category for better display
  const groupedPantryItems = pantryItems.reduce((groups, item) => {
    const ingredient = IngredientDatabase.findIngredient(item)
    const category = ingredient?.category || 'other'
    if (!groups[category]) groups[category] = []
    groups[category].push({ name: item, ingredient })
    return groups
  }, {} as { [category: string]: { name: string, ingredient: IngredientInfo | null }[] })

  const commonIngredients = [
    'Chicken breast', 'Ground beef', 'Salmon', 'Eggs', 'Rice', 'Pasta', 
    'Bread', 'Potatoes', 'Onions', 'Garlic', 'Tomatoes', 'Bell peppers',
    'Carrots', 'Broccoli', 'Spinach', 'Cheese', 'Milk', 'Butter',
    'Olive oil', 'Salt', 'Black pepper', 'Oregano'
  ]

  const suggestedItems = commonIngredients.filter(item => 
    !pantryItems.some(pantryItem => 
      pantryItem.toLowerCase() === item.toLowerCase()
    )
  ).slice(0, 6)

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Pantry ({pantryItems.length} items)</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAdding(!isAdding)}
        >
          <Text style={styles.addButtonText}>
            {isAdding ? '✕ Cancel' : '+ Add Item'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Input */}
      {isAdding && (
        <View style={styles.addItemContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Enter ingredient (e.g., chicken breast, lowry's)"
              value={newItem}
              onChangeText={handleInputChange}
              autoFocus
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.confirmButton} onPress={addItem}>
              <Text style={styles.confirmButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              <Text style={styles.suggestionsLabel}>Suggestions:</Text>
              {suggestions.map((suggestion, index) => {
                const categoryInfo = IngredientDatabase.getCategoryInfo(suggestion.category)
                return (
                  <TouchableOpacity 
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => addSuggestion(suggestion.name)}
                  >
                    <Text style={styles.suggestionEmoji}>{categoryInfo.emoji}</Text>
                    <Text style={styles.suggestionText}>{suggestion.name}</Text>
                    <Text style={styles.suggestionCategory}>({categoryInfo.name})</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>
      )}

      {/* Pantry Validation Warning */}
      {pantryItems.length > 0 && showValidation && !validation.valid && (
        <View style={styles.validationWarning}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Need More Main Ingredients</Text>
            <Text style={styles.warningText}>
              You have {validation.substantiveCount} main ingredient(s) and {validation.enhancerCount} seasoning(s). 
              Add at least 2 main ingredients for recipe generation.
            </Text>
            {validation.suggestions.length > 0 && (
              <Text style={styles.warningsSuggestion}>
                💡 {validation.suggestions[0]}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={() => setShowValidation(false)}
          >
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Add Suggestions */}
      {quickSuggestions.length > 0 && (
        <View style={styles.quickAddContainer}>
          <Text style={styles.quickAddTitle}>⚡ Quick Add</Text>
          <Text style={styles.quickAddSubtitle}>Based on your usage patterns</Text>
          
          <View style={styles.quickSuggestionsGrid}>
            {quickSuggestions.map((suggestion, index) => {
              const categoryInfo = IngredientDatabase.getCategoryInfo(suggestion.category)
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickSuggestionChip, getQuickSuggestionStyle(suggestion.type)]}
                  onPress={() => addItemInternal(suggestion.name)}
                >
                  <Text style={styles.quickSuggestionEmoji}>{categoryInfo.emoji}</Text>
                  <View style={styles.quickSuggestionTextContainer}>
                    <Text style={styles.quickSuggestionName}>{suggestion.name}</Text>
                    <Text style={styles.quickSuggestionReason}>{suggestion.reason}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
          
          {loadingQuickSuggestions && (
            <Text style={styles.loadingText}>🧠 Learning your preferences...</Text>
          )}
        </View>
      )}

      {/* Current Pantry Items */}
      {pantryItems.length > 0 ? (
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionLabel}>
            Current Items ({validation.substantiveCount} main, {validation.enhancerCount} seasonings):
          </Text>
          <View style={styles.itemsGrid}>
            {pantryItems.map((item, index) => {
              const ingredient = IngredientDatabase.findIngredient(item)
              const categoryInfo = ingredient ? IngredientDatabase.getCategoryInfo(ingredient.category) : null
              
              return (
                <View key={index} style={[
                  styles.pantryChip,
                  ingredient && !ingredient.isSubstantive && styles.seasoningChip
                ]}>
                  {categoryInfo && <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>}
                  <Text style={styles.pantryChipText}>{item}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeItem(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No ingredients added yet. Add some to get recipe suggestions!
          </Text>
        </View>
      )}

      {/* Quick Add Suggestions */}
      {!isAdding && suggestedItems.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionLabel}>Quick Add:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.suggestionsRow}>
              {suggestedItems.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    const updatedItems = [...pantryItems, item]
                    onUpdatePantry(updatedItems)
                  }}
                >
                  <Text style={styles.suggestionChipText}>+ {item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const getQuickSuggestionStyle = (type: string) => {
  switch (type) {
    case 'frequent':
      return { borderColor: '#059669', backgroundColor: '#ECFDF5' }
    case 'complementary':
      return { borderColor: '#DC2626', backgroundColor: '#FEF2F2' }
    case 'missing_category':
      return { borderColor: '#7C3AED', backgroundColor: '#F3E8FF' }
    default:
      return { borderColor: '#6B7280', backgroundColor: '#F9FAFB' }
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
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
  addButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addItemContainer: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  itemsContainer: {
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pantryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  pantryChipText: {
    fontSize: 14,
    color: '#374151',
    marginRight: 6,
  },
  removeButton: {
    width: 18,
    height: 18,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  suggestionChipText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
  suggestionsDropdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  suggestionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  validationWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  warningsSuggestion: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  seasoningChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  quickAddContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  quickAddSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  quickSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  quickSuggestionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  quickSuggestionTextContainer: {
    flex: 1,
  },
  quickSuggestionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  quickSuggestionReason: {
    fontSize: 11,
    color: '#64748B',
  },
  loadingText: {
    fontSize: 12,
    color: '#6366F1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}) 
 
 