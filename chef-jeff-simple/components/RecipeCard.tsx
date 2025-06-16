import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Recipe } from '../lib/recipeService';

interface RecipeCardProps {
  recipe: Recipe;
  onViewDetails: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onViewDetails }) => {
  const matchPercentage = Math.round(
    (recipe.usedIngredientCount / (recipe.usedIngredientCount + recipe.missedIngredientCount)) * 100
  );

  return (
    <View style={styles.card}>
      {/* Recipe Image */}
      <Image source={{ uri: recipe.image }} style={styles.image} />
      
      {/* Match Badge */}
      <View style={styles.matchBadge}>
        <Text style={styles.matchText}>{matchPercentage}% Match</Text>
      </View>

      {/* Recipe Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>

        {/* Recipe Meta */}
        <View style={styles.metaContainer}>
          {recipe.readyInMinutes && (
            <Text style={styles.metaText}>⏱️ {recipe.readyInMinutes} min</Text>
          )}
          {recipe.servings && (
            <Text style={styles.metaText}>🍽️ {recipe.servings} servings</Text>
          )}
        </View>

        {/* Ingredients Status */}
        <View style={styles.ingredientsContainer}>
          <View style={styles.ingredientStatus}>
            <Text style={styles.haveText}>✓ Have: {recipe.usedIngredientCount}</Text>
            {recipe.missedIngredientCount > 0 && (
              <Text style={styles.needText}>Need: {recipe.missedIngredientCount}</Text>
            )}
          </View>

          {/* Missing Ingredients */}
          {recipe.missedIngredients.length > 0 && (
            <View style={styles.missingContainer}>
              <Text style={styles.missingLabel}>Missing: </Text>
              <Text style={styles.missingText}>
                {recipe.missedIngredients.slice(0, 3).map(ing => ing.name).join(', ')}
                {recipe.missedIngredients.length > 3 && ` +${recipe.missedIngredients.length - 3} more`}
              </Text>
            </View>
          )}
        </View>

        {/* View Recipe Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => onViewDetails(recipe)}
        >
          <Text style={styles.buttonText}>View Recipe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 16,
  },
  ingredientsContainer: {
    marginBottom: 16,
  },
  ingredientStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  haveText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  needText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  missingContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  missingLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  missingText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
 
 