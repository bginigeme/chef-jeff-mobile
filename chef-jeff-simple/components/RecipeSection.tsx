import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  cookingTime: number;
  servings: number;
  ingredients: Array<{name: string; amount?: string; unit?: string}>;
  instructions: string[];
}

interface RecipeSectionProps {
  recipes: {
    pantryOnly: Recipe | null;
    enhanced: Recipe | null;
  };
  onGenerateRecipes: () => void;
  isGenerating: boolean;
  hasRecipes: boolean;
  canGenerate?: boolean;
  showingPantryItems?: boolean;
  recipeMode?: 'pantry' | 'explore';
}

export default function RecipeSection({ 
  recipes, 
  onGenerateRecipes, 
  isGenerating, 
  hasRecipes, 
  canGenerate = true,
  showingPantryItems = false,
  recipeMode = 'pantry'
}: RecipeSectionProps) {
  const getButtonText = () => {
    if (recipeMode === 'explore') {
      return isGenerating ? '✨ Finding Inspiration...' : '✨ Inspire Me!'
    }
    return isGenerating ? '🥫 Cooking up recipes...' : '🥫 What can I make?'
  }

  const renderRecipe = (recipe: Recipe, label: string) => (
    <View key={recipe.id} style={styles.recipeCard}>
      <Text style={styles.recipeLabel}>{label}</Text>
      <Text style={styles.recipeTitle}>{recipe.title}</Text>
      {recipe.description && (
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
      )}
      
      <View style={styles.recipeInfo}>
        <Text style={styles.infoText}>⏱️ {recipe.cookingTime} min</Text>
        <Text style={styles.infoText}>👥 Serves {recipe.servings}</Text>
        <Text style={styles.infoText}>📊 {recipe.difficulty}</Text>
      </View>

      <Text style={styles.sectionTitle}>Ingredients:</Text>
      {recipe.ingredients.map((ingredient, index) => (
        <Text key={index} style={styles.ingredient}>
          • {ingredient.amount ? `${ingredient.amount} ${ingredient.unit || ''} ` : ''}{ingredient.name}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Instructions:</Text>
      {recipe.instructions.map((instruction, index) => (
        <Text key={index} style={styles.instruction}>
          {index + 1}. {instruction}
        </Text>
      ))}
    </View>
  )

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.generateButton, (!canGenerate || isGenerating) && styles.disabledButton]}
        onPress={onGenerateRecipes}
        disabled={!canGenerate || isGenerating}
      >
        <Text style={styles.generateButtonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {!canGenerate && recipeMode === 'pantry' && !showingPantryItems && (
        <Text style={styles.emptyMessage}>
          Add ingredients to your pantry to start generating recipes! 📝
        </Text>
      )}

      {hasRecipes && (
        <ScrollView style={styles.recipesContainer}>
          {recipes.pantryOnly && renderRecipe(recipes.pantryOnly, "🥫 Pantry Recipe")}
          {recipes.enhanced && renderRecipe(recipes.enhanced, "✨ Enhanced Recipe")}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  generateButton: {
    backgroundColor: '#EA580C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
  recipesContainer: {
    maxHeight: 500,
  },
  recipeCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 5,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 10,
    marginBottom: 8,
  },
  ingredient: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
}) 
 
 