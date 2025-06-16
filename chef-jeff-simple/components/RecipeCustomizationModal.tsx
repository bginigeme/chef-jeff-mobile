import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Switch } from 'react-native'
import { RecipeRequest } from '../lib/aiRecipeService'

interface RecipeCustomizationModalProps {
  visible: boolean
  onClose: () => void
  onGenerateRecipe: (request: RecipeRequest) => void
  pantryIngredients: string[]
}

const DIETARY_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 
  'Low-Carb', 'Keto', 'Paleo', 'Low-Sodium', 'Diabetic-Friendly'
]

const CUISINE_TYPES = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'French',
  'American', 'Thai', 'Japanese', 'Middle Eastern', 'Fusion'
]

const COOKING_METHODS = [
  'Pan-fry', 'Bake', 'Grill', 'Steam', 'Stir-fry', 'Roast', 
  'Slow-cook', 'Raw/No-cook', 'One-pot', 'Air-fry'
]

const MEAL_TYPES = [
  { name: 'Breakfast', emoji: '🌅' },
  { name: 'Brunch', emoji: '🥐' },
  { name: 'Lunch', emoji: '🥙' },
  { name: 'Dinner', emoji: '🍽️' },
  { name: 'Snack', emoji: '🍿' },
  { name: 'Appetizer', emoji: '🥗' },
  { name: 'Dessert', emoji: '🍰' },
  { name: 'Fit Meal', emoji: '💪' },
  { name: 'Comfort Food', emoji: '🫂' },
  { name: 'Quick Bite', emoji: '⚡' }
]

export const RecipeCustomizationModal: React.FC<RecipeCustomizationModalProps> = ({
  visible,
  onClose,
  onGenerateRecipe,
  pantryIngredients
}) => {
  const [cookingTime, setCookingTime] = useState(30)
  const [servings, setServings] = useState(2)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy')
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([])
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [selectedCookingMethods, setSelectedCookingMethods] = useState<string[]>([])
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([])
  const [additionalIngredients, setAdditionalIngredients] = useState('')
  const [avoidIngredients, setAvoidIngredients] = useState('')
  const [specificRequest, setSpecificRequest] = useState('')

  const handleGenerate = () => {
    const request: RecipeRequest = {
      pantryIngredients: [
        ...pantryIngredients,
        ...additionalIngredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0)
      ],
      dietaryRestrictions: selectedDietaryRestrictions,
      cookingTime,
      servings,
      cuisine: selectedCuisines.length > 0 ? selectedCuisines.join(', ') : undefined,
      difficulty,
      cookingMethod: selectedCookingMethods.length > 0 ? selectedCookingMethods.join(', ') : undefined,
      mealType: selectedMealTypes.length > 0 ? selectedMealTypes.join(', ') : undefined,
      avoidIngredients: avoidIngredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0),
      specificRequest: specificRequest || undefined
    }
    
    onGenerateRecipe(request)
    onClose()
  }

  const toggleDietaryRestriction = (restriction: string) => {
    setSelectedDietaryRestrictions(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    )
  }

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    )
  }

  const toggleCookingMethod = (method: string) => {
    setSelectedCookingMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    )
  }

  const toggleMealType = (mealType: string) => {
    setSelectedMealTypes(prev => 
      prev.includes(mealType) 
        ? prev.filter(m => m !== mealType)
        : [...prev, mealType]
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Customize Your Recipe</Text>
          <Text style={styles.subtitle}>Tell Chef Jeff exactly what you want!</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cooking Time & Servings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Basic Info</Text>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cooking Time (minutes)</Text>
                <TextInput
                  style={styles.numberInput}
                  value={cookingTime.toString()}
                  onChangeText={(text) => setCookingTime(parseInt(text) || 30)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Servings</Text>
                <TextInput
                  style={styles.numberInput}
                  value={servings.toString()}
                  onChangeText={(text) => setServings(parseInt(text) || 2)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Difficulty Level</Text>
            <View style={styles.optionRow}>
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyOption,
                    difficulty === level && styles.selectedOption
                  ]}
                  onPress={() => setDifficulty(level as any)}
                >
                  <Text style={[
                    styles.optionText,
                    difficulty === level && styles.selectedOptionText
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dietary Restrictions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🥗 Dietary Preferences</Text>
            <View style={styles.tagContainer}>
              {DIETARY_RESTRICTIONS.map((restriction) => (
                <TouchableOpacity
                  key={restriction}
                  style={[
                    styles.tag,
                    selectedDietaryRestrictions.includes(restriction) && styles.selectedTag
                  ]}
                  onPress={() => toggleDietaryRestriction(restriction)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedDietaryRestrictions.includes(restriction) && styles.selectedTagText
                  ]}>
                    {restriction}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cuisine Type */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithClear}>
              <Text style={styles.sectionTitle}>🌍 Cuisine Styles (Select Multiple)</Text>
              {selectedCuisines.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedCuisines([])} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedCuisines.length > 0 && (
              <Text style={styles.selectionCount}>
                {selectedCuisines.length} cuisine{selectedCuisines.length > 1 ? 's' : ''} selected
              </Text>
            )}
            <View style={styles.tagContainer}>
              {CUISINE_TYPES.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.tag,
                    selectedCuisines.includes(cuisine) && styles.selectedTag
                  ]}
                  onPress={() => toggleCuisine(cuisine)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedCuisines.includes(cuisine) && styles.selectedTagText
                  ]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cooking Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithClear}>
              <Text style={styles.sectionTitle}>🔥 Cooking Methods (Select Multiple)</Text>
              {selectedCookingMethods.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedCookingMethods([])} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedCookingMethods.length > 0 && (
              <Text style={styles.selectionCount}>
                {selectedCookingMethods.length} method{selectedCookingMethods.length > 1 ? 's' : ''} selected
              </Text>
            )}
            <View style={styles.tagContainer}>
              {COOKING_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.tag,
                    selectedCookingMethods.includes(method) && styles.selectedTag
                  ]}
                  onPress={() => toggleCookingMethod(method)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedCookingMethods.includes(method) && styles.selectedTagText
                  ]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Type */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithClear}>
              <Text style={styles.sectionTitle}>🍽️ Meal Types (Select Multiple)</Text>
              {selectedMealTypes.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedMealTypes([])} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedMealTypes.length > 0 && (
              <Text style={styles.selectionCount}>
                {selectedMealTypes.length} meal type{selectedMealTypes.length > 1 ? 's' : ''} selected
              </Text>
            )}
            <View style={styles.tagContainer}>
              {MEAL_TYPES.map((meal) => (
                <TouchableOpacity
                  key={meal.name}
                  style={[
                    styles.tag,
                    selectedMealTypes.includes(meal.name) && styles.selectedTag
                  ]}
                  onPress={() => toggleMealType(meal.name)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedMealTypes.includes(meal.name) && styles.selectedTagText
                  ]}>
                    {meal.emoji} {meal.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>➕ Additional Ingredients</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., fresh herbs, cheese, spices (comma separated)"
              placeholderTextColor="#9CA3AF"
              value={additionalIngredients}
              onChangeText={setAdditionalIngredients}
              multiline
            />
          </View>

          {/* Avoid Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚫 Avoid These Ingredients</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., mushrooms, cilantro (comma separated)"
              placeholderTextColor="#9CA3AF"
              value={avoidIngredients}
              onChangeText={setAvoidIngredients}
              multiline
            />
          </View>

          {/* Specific Request */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💭 Special Requests</Text>
            <TextInput
              style={[styles.textInput, { height: 80 }]}
              placeholder="e.g., 'Make it spicy', 'Include protein', 'One-pot meal', etc."
              placeholderTextColor="#9CA3AF"
              value={specificRequest}
              onChangeText={setSpecificRequest}
              multiline
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <Text style={styles.generateButtonText}>
              ✨ Generate Custom Recipe
            </Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#EA580C',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedOptionText: {
    color: 'white',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 2,
  },
  selectedTag: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  selectedTagText: {
    color: 'white',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  generateButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  selectionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  sectionHeaderWithClear: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EA580C',
  },
}) 