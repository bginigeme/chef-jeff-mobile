import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { Recipe } from '../lib/recipeService';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, visible, onClose }) => {
  if (!recipe) return null;

  const matchPercentage = Math.round(
    (recipe.usedIngredientCount / (recipe.usedIngredientCount + recipe.missedIngredientCount)) * 100
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recipe Image */}
          <Image source={{ uri: recipe.image }} style={styles.image} />
          
          {/* Match Badge */}
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>{matchPercentage}% Match</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {recipe.readyInMinutes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>⏱️ Cook Time</Text>
                <Text style={styles.metaValue}>{recipe.readyInMinutes} minutes</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>🍽️ Servings</Text>
                <Text style={styles.metaValue}>{recipe.servings}</Text>
              </View>
            )}
          </View>

          {/* Summary */}
          {recipe.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Recipe</Text>
              <Text style={styles.summary}>{recipe.summary}</Text>
            </View>
          )}

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            
            {/* Ingredients You Have */}
            {recipe.usedIngredients.length > 0 && (
              <View style={styles.ingredientGroup}>
                <Text style={styles.ingredientGroupTitle}>✓ You Have ({recipe.usedIngredients.length})</Text>
                {recipe.usedIngredients.map((ingredient, index) => (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <Text style={styles.haveIngredient}>• {ingredient.name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Missing Ingredients */}
            {recipe.missedIngredients.length > 0 && (
              <View style={styles.ingredientGroup}>
                <Text style={styles.ingredientGroupTitle}>🛒 You Need ({recipe.missedIngredients.length})</Text>
                {recipe.missedIngredients.map((ingredient, index) => (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <Text style={styles.needIngredient}>• {ingredient.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Instructions */}
          {recipe.instructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.instructions}>{recipe.instructions}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metaItem: {
    marginRight: 24,
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  summary: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  ingredientGroup: {
    marginBottom: 16,
  },
  ingredientGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  ingredientItem: {
    paddingVertical: 4,
  },
  haveIngredient: {
    fontSize: 16,
    color: '#10B981',
  },
  needIngredient: {
    fontSize: 16,
    color: '#F59E0B',
  },
  instructions: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
}); 
 
 