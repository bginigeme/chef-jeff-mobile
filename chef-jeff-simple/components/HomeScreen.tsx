import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { AIRecipeGenerator } from '../lib/aiRecipeService';
import { UserPreferencesService } from '../lib/userPreferences';
import { RecipeHistoryService } from '../lib/recipeHistory';

const quickAddItems = ['Ground beef', 'Salmon', 'Eggs', 'Rice', 'Bread'];
const allRecipes = [
  {
    id: '1',
    title: 'Lemon Herbs Infused Chicken Rhapsody',
    ingredients: ['Chicken', 'olive oil', 'lemon juice'],
    missing: 'olive oil, lemon juice…',
  },
  {
    id: '2',
    title: 'Korean-Style Spicy Honey Chicken Sizzle',
    ingredients: ['Chicken', 'Honey', 'Gochujang (Korean chili paste)'],
    missing: 'Honey, Gochujang (Korean chili paste)…',
  },
];

export const HomeScreen = ({ onProfile, onSignOut }: { onProfile: () => void; onSignOut: () => void }) => {
  const [tab, setTab] = useState<'cook' | 'history'>('cook');
  const [showRecipes, setShowRecipes] = useState(false);
  const [pantry, setPantry] = useState<string[]>(['Chicken breast', 'Eggs', 'Potatoes', 'Pasta']);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRecipes, setAiRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [recipeDetailVisible, setRecipeDetailVisible] = useState(false);
  const [recipeRatings, setRecipeRatings] = useState<{[key: string]: 'like' | 'dislike'}>({});
  const [userId] = useState('user-123'); // Mock user ID for now
  const [fastMode, setFastMode] = useState(false); // Toggle for faster image generation
  const [historyRecipes, setHistoryRecipes] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Calculate have/need for each recipe based on pantry
  const recommendedRecipes = allRecipes.map((recipe) => {
    const have = recipe.ingredients.filter((item) => pantry.includes(item)).length;
    const need = recipe.ingredients.length - have;
    return { ...recipe, have, need };
  });

  const handleCreateMeal = async () => {
    console.log('🍳 [CHEFJEFF] handleCreateMeal called!');
    setShowRecipes(false);
    setLoading(true);
    setError(null);
    setAiRecipes([]);
    try {
      console.log('🍳 [CHEFJEFF] Starting recipe generation with pantry:', pantry);
      const generator = new AIRecipeGenerator();
      console.log('🍳 [CHEFJEFF] AIRecipeGenerator created');
      
      const request = {
        pantryIngredients: pantry,
        dietaryRestrictions: [],
        cookingTime: 30,
        servings: 2,
        cuisine: undefined,
        difficulty: undefined,
        cookingMethod: undefined,
        mealType: undefined,
        avoidIngredients: [],
        specificRequest: undefined,
      };
      
      console.log('🍳 [CHEFJEFF] About to call generateRecipeWithImage...');
      
      // Generate two recipes with progressive loading
      const [recipe1, recipe2] = await Promise.all([
        generator.generateRecipeWithImage(request, 'strict', undefined, true),
        generator.generateRecipeWithImage(request, 'enhanced', undefined, true)
      ]);
      
      console.log('🍳 [CHEFJEFF] Generated recipes:', { 
        recipe1Title: recipe1.title, 
        recipe1ImageUrl: recipe1.imageUrl,
        recipe2Title: recipe2.title, 
        recipe2ImageUrl: recipe2.imageUrl 
      });
      
      setAiRecipes([recipe1, recipe2]);
      setShowRecipes(true);
      console.log('🍳 [CHEFJEFF] Recipes set and UI updated');
    } catch (e: any) {
      console.error('🍳 [CHEFJEFF] Recipe generation error:', e);
      setError(e.message || 'Failed to generate recipes.');
    } finally {
      setLoading(false);
      console.log('🍳 [CHEFJEFF] Loading finished');
    }
  };

  const handleQuickAdd = (item: string) => {
    if (!pantry.includes(item)) setPantry([...pantry, item]);
  };
  const handleRemovePantryItem = (item: string) => {
    setPantry(pantry.filter((i) => i !== item));
  };
  const handleAddItem = () => {
    if (newItem.trim() && !pantry.includes(newItem.trim())) {
      setPantry([...pantry, newItem.trim()]);
    }
    setNewItem('');
    setAddModalVisible(false);
  };

  const handleLikeRecipe = async (recipe: any) => {
    try {
      console.log('❤️ [CHEFJEFF] Liking recipe:', recipe.title);
      
      // Update local state
      setRecipeRatings(prev => ({ ...prev, [recipe.id]: 'like' }));
      
      // Save to history
      await RecipeHistoryService.saveRecipe(recipe);
      
      // Save to user preferences
      await UserPreferencesService.rateRecipe(userId, recipe, 'like');
      
      console.log('✅ [CHEFJEFF] Recipe liked and saved to history');
    } catch (error) {
      console.error('❌ [CHEFJEFF] Error liking recipe:', error);
    }
  };

  const handleDislikeRecipe = async (recipe: any) => {
    try {
      console.log('👎 [CHEFJEFF] Disliking recipe:', recipe.title);
      
      // Update local state
      setRecipeRatings(prev => ({ ...prev, [recipe.id]: 'dislike' }));
      
      // Save to history
      await RecipeHistoryService.saveRecipe(recipe);
      
      // Save to user preferences
      await UserPreferencesService.rateRecipe(userId, recipe, 'dislike');
      
      console.log('✅ [CHEFJEFF] Recipe disliked and saved to history');
    } catch (error) {
      console.error('❌ [CHEFJEFF] Error disliking recipe:', error);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      console.log('📚 [CHEFJEFF] Loading recipe history...');
      
      const history = await RecipeHistoryService.getHistory();
      console.log('📚 [CHEFJEFF] Loaded', history.length, 'recipes from history');
      
      setHistoryRecipes(history);
    } catch (error) {
      console.error('❌ [CHEFJEFF] Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when tab changes to history
  React.useEffect(() => {
    if (tab === 'history') {
      loadHistory();
    }
  }, [tab]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../assets/images/chef-jeff-transparent.png')} style={styles.logo} />
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.profileButton} onPress={onProfile}>
            <Text style={styles.profileButtonText}>👤 Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'cook' && styles.tabButtonActive]}
          onPress={() => setTab('cook')}
        >
          <Text style={[styles.tabButtonText, tab === 'cook' && styles.tabButtonTextActive]}>Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'history' && styles.tabButtonActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabButtonText, tab === 'history' && styles.tabButtonTextActive]}>
            📚 History ({historyRecipes.length})
          </Text>
        </TouchableOpacity>
      </View>
      {/* Content */}
      {tab === 'cook' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Pantry Section */}
          <View style={styles.pantryCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.pantryTitle}>Your Pantry ({pantry.length} items)</Text>
              <TouchableOpacity style={styles.addItemButton} onPress={() => setAddModalVisible(true)}>
                <Text style={styles.addItemButtonText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.currentItemsLabel}>Current Items:</Text>
            <View style={styles.pantryItemsRow}>
              {pantry.map((item) => (
                <View key={item} style={styles.pantryPill}>
                  <Text style={styles.pantryPillText}>{item}</Text>
                  <TouchableOpacity onPress={() => handleRemovePantryItem(item)}>
                    <Text style={styles.removePillText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <Text style={styles.quickAddLabel}>Quick Add:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickAddItems.map((item) => (
                <TouchableOpacity key={item} style={styles.quickAddPill} onPress={() => handleQuickAdd(item)}>
                  <Text style={styles.quickAddPillText}>+ {item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Add Item Modal */}
          <Modal visible={addModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Add Pantry Item</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter ingredient name"
                  value={newItem}
                  onChangeText={setNewItem}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCancelButton}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddItem} style={styles.modalAddButton}>
                    <Text style={styles.modalAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          
          {/* Recipe Detail Modal */}
          <Modal visible={recipeDetailVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.recipeDetailCard}>
                <View style={styles.recipeDetailHeader}>
                  <Text style={styles.recipeDetailTitle}>Recipe Details</Text>
                  <TouchableOpacity onPress={() => setRecipeDetailVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                {selectedRecipe && (
                  <ScrollView style={styles.recipeDetailContent}>
                    {selectedRecipe.imageUrl && (
                      <Image 
                        source={{ uri: selectedRecipe.imageUrl }} 
                        style={styles.recipeDetailImage}
                        resizeMode="contain"
                        onError={(e) => console.error('Recipe detail image error:', e.nativeEvent)}
                        onLoad={() => console.log('Recipe detail image loaded successfully')}
                      />
                    )}
                    <Text style={styles.recipeDetailRecipeTitle}>{selectedRecipe.title}</Text>
                    <Text style={styles.recipeDetailDescription}>{selectedRecipe.description}</Text>
                    
                    <View style={styles.recipeDetailStats}>
                      <Text style={styles.recipeDetailStat}>⏱️ {selectedRecipe.cookingTime} min</Text>
                      <Text style={styles.recipeDetailStat}>👥 Serves {selectedRecipe.servings}</Text>
                      <Text style={styles.recipeDetailStat}>📊 {selectedRecipe.difficulty}</Text>
                    </View>
                    
                    <Text style={styles.recipeDetailSectionTitle}>Ingredients:</Text>
                    {selectedRecipe.ingredients.map((ingredient: any, index: number) => (
                      <Text key={index} style={styles.recipeDetailIngredient}>
                        • {ingredient.amount ? `${ingredient.amount} ${ingredient.unit || ''} ` : ''}{ingredient.name}
                      </Text>
                    ))}
                    
                    <Text style={styles.recipeDetailSectionTitle}>Instructions:</Text>
                    {selectedRecipe.instructions.map((instruction: string, index: number) => (
                      <Text key={index} style={styles.recipeDetailInstruction}>
                        {index + 1}. {instruction}
                      </Text>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
          {/* Create Meal Button */}
          {!showRecipes && !loading && (
            <View style={styles.createMealSection}>
              <TouchableOpacity style={styles.createMealButton} onPress={handleCreateMeal}>
                <Text style={styles.createMealButtonText}>Generate Recipes with Chef Jeff</Text>
              </TouchableOpacity>
              
              {/* Speed Toggle */}
              <TouchableOpacity 
                style={[styles.speedToggle, fastMode && styles.speedToggleActive]}
                onPress={() => setFastMode(!fastMode)}
              >
                <Text style={[styles.speedToggleText, fastMode && styles.speedToggleTextActive]}>
                  {fastMode ? '⚡ Fast Mode' : '🐌 Quality Mode'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {loading && (
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={{ color: '#EA580C', marginTop: 10 }}>Chef Jeff is thinking...</Text>
            </View>
          )}
          {error && (
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>{error}</Text>
            </View>
          )}
          {/* Recommended Recipes */}
          {showRecipes && aiRecipes.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Chef Jeff's Recipe Recommendations</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.instantText}>⚡ Instant</Text>
                  <Text style={styles.customizeText}>  ⚙️ Customize</Text>
                </View>
              </View>
              {pantry.length === 0 ? (
                <Text style={styles.emptyPantryText}>
                  Add ingredients to your pantry to get AI-generated recipe recommendations!
                </Text>
              ) : (
                aiRecipes.map((recipe, idx) => {
                  console.log(`Rendering recipe ${idx}:`, { title: recipe.title, imageUrl: recipe.imageUrl });
                  
                  // Calculate have/need based on pantry ingredients
                  const have = recipe.ingredients.filter((ingredient: any) => 
                    pantry.some(pantryItem => 
                      pantryItem.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                      ingredient.name.toLowerCase().includes(pantryItem.toLowerCase())
                    )
                  ).length;
                  const need = recipe.ingredients.length - have;
                  
                  return (
                    <View key={recipe.id || idx} style={styles.recipeCard}>
                      {recipe.imageUrl ? (
                        <Image 
                          source={{ uri: recipe.imageUrl }} 
                          style={styles.recipeImage}
                          resizeMode="contain"
                          onError={(e) => console.error(`Image load error for recipe ${idx}:`, e.nativeEvent)}
                          onLoad={() => console.log(`Image loaded successfully for recipe ${idx}`)}
                        />
                      ) : (
                        <View style={styles.recipeImagePlaceholder}>
                          <Text style={styles.recipeImagePlaceholderText}>No image available</Text>
                          <Text style={styles.recipeImagePlaceholderText}>Image URL: {recipe.imageUrl || 'undefined'}</Text>
                        </View>
                      )}
                      <View style={styles.recipeHeader}>
                        <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                        <View style={styles.recipeBadge}>
                          <Text style={styles.recipeBadgeText}>🥄 Pantry Only</Text>
                        </View>
                      </View>
                      <View style={styles.recipeStatsRow}>
                        <View style={styles.statItem}>
                          <Text style={styles.statIcon}>✔</Text>
                          <Text style={styles.haveText}>Have: {have}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statIcon}>🛒</Text>
                          <Text style={styles.needText}>Need: {need}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.viewRecipeButton}
                        onPress={() => {
                          setSelectedRecipe(recipe);
                          setRecipeDetailVisible(true);
                        }}
                      >
                        <Text style={styles.viewRecipeButtonText}>View Recipe</Text>
                      </TouchableOpacity>
                      <View style={styles.recipeActions}>
                        <TouchableOpacity 
                          style={[
                            styles.actionButton,
                            recipeRatings[recipe.id] === 'like' && styles.likedButton
                          ]}
                          onPress={() => handleLikeRecipe(recipe)}
                        >
                          <Text style={[
                            styles.actionButtonText,
                            recipeRatings[recipe.id] === 'like' && styles.likedButtonText
                          ]}>
                            {recipeRatings[recipe.id] === 'like' ? '❤️' : '🤍'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[
                            styles.actionButton,
                            recipeRatings[recipe.id] === 'dislike' && styles.dislikedButton
                          ]}
                          onPress={() => handleDislikeRecipe(recipe)}
                        >
                          <Text style={[
                            styles.actionButtonText,
                            recipeRatings[recipe.id] === 'dislike' && styles.dislikedButtonText
                          ]}>
                            {recipeRatings[recipe.id] === 'dislike' ? '💔' : '👎'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
              
              {/* Generate More Recipes Button */}
              <TouchableOpacity 
                style={styles.generateMoreButton} 
                onPress={handleCreateMeal}
              >
                <Text style={styles.generateMoreButtonText}>🔄 Generate More Recipes</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : tab === 'history' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* History Header */}
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recipe History</Text>
            <Text style={styles.historySubtitle}>
              {historyRecipes.length} recipes in your history
            </Text>
          </View>

          {/* Loading State */}
          {historyLoading && (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.historyLoadingText}>Loading your recipe history...</Text>
            </View>
          )}

          {/* Empty State */}
          {!historyLoading && historyRecipes.length === 0 && (
            <View style={styles.historyEmpty}>
              <Text style={styles.historyEmptyTitle}>No recipes yet!</Text>
              <Text style={styles.historyEmptyText}>
                Like or dislike some recipes in the Cook tab to see them here
              </Text>
            </View>
          )}

          {/* History Recipes */}
          {!historyLoading && historyRecipes.length > 0 && (
            <View style={styles.historyRecipes}>
              {historyRecipes.map((recipe, index) => {
                // Calculate have/need based on current pantry
                const have = recipe.ingredients.filter((ingredient: any) =>
                  pantry.some(pantryItem =>
                    pantryItem.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                    ingredient.name.toLowerCase().includes(pantryItem.toLowerCase())
                  )
                ).length;
                const need = recipe.ingredients.length - have;

                return (
                  <View key={recipe.id || index} style={styles.historyRecipeCard}>
                    {recipe.imageUrl ? (
                      <Image 
                        source={{ uri: recipe.imageUrl }} 
                        style={styles.historyRecipeImage}
                        resizeMode="contain"
                        onError={(e) => console.error(`History image load error for recipe ${index}:`, e.nativeEvent)}
                        onLoad={() => console.log(`History image loaded successfully for recipe ${index}`)}
                      />
                    ) : (
                      <View style={styles.historyRecipeImagePlaceholder}>
                        <Text style={styles.historyRecipeImagePlaceholderText}>No image</Text>
                      </View>
                    )}
                    
                    <View style={styles.historyRecipeContent}>
                      <Text style={styles.historyRecipeTitle} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                      
                      <View style={styles.historyRecipeStats}>
                        <Text style={styles.historyRecipeStat}>⏱️ {recipe.cookingTime} min</Text>
                        <Text style={styles.historyRecipeStat}>👥 Serves {recipe.servings}</Text>
                        <Text style={styles.historyRecipeStat}>📊 {recipe.difficulty}</Text>
                      </View>

                      <View style={styles.historyRecipeIngredients}>
                        <Text style={styles.historyRecipeIngredientsTitle}>Ingredients:</Text>
                        <Text style={styles.historyRecipeIngredientsText} numberOfLines={2}>
                          {recipe.ingredients.slice(0, 3).map((ing: any) => ing.name).join(', ')}
                          {recipe.ingredients.length > 3 ? '...' : ''}
                        </Text>
                      </View>

                      <View style={styles.historyRecipeActions}>
                        <TouchableOpacity 
                          style={styles.historyViewButton}
                          onPress={() => {
                            setSelectedRecipe(recipe);
                            setRecipeDetailVisible(true);
                          }}
                        >
                          <Text style={styles.historyViewButtonText}>View Recipe</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.historyRecipeRating}>
                          <Text style={styles.historyRecipeRatingText}>
                            {recipe.isFavorite ? '❤️ Favorited' : '📅 Saved'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#EA580C',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
  },
  profileButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
  },
  signOutButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FEF3C7',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabButtonTextActive: {
    color: '#EA580C',
  },
  pantryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pantryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  addItemButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addItemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  currentItemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pantryItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pantryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  pantryPillText: {
    fontSize: 14,
    color: '#374151',
  },
  removePillText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  quickAddLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  quickAddPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  quickAddPillText: {
    fontSize: 14,
    color: '#EA580C',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#6B7280',
    fontSize: 16,
  },
  modalAddButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createMealButton: {
    backgroundColor: '#EA580C',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createMealButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  instantText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  customizeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  emptyPantryText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  recipeCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeImagePlaceholderText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  recipeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recipeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recipeDescription: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 8,
  },
  recipeStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  haveText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  needText: {
    fontSize: 14,
    color: '#EA580C',
    fontWeight: '600',
  },
  viewRecipeButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewRecipeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
  },
  recipeDetailCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
    width: '90%',
  },
  recipeDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recipeDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  recipeDetailContent: {
    padding: 20,
  },
  recipeDetailImage: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
  },
  recipeDetailRecipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  recipeDetailDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 24,
  },
  recipeDetailStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  recipeDetailStat: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  recipeDetailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  recipeDetailIngredient: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  recipeDetailInstruction: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  missingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  missingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyText: {
    fontSize: 18,
    color: '#6B7280',
  },
  historySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  historyHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  historyLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  historyLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  historyEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  historyEmptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  historyEmptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  historyRecipes: {
    padding: 20,
  },
  historyRecipeCard: {
    backgroundColor: '#FFFFFF',
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
  historyRecipeImage: {
    width: '100%',
    height: 220,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
  },
  historyRecipeImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyRecipeImagePlaceholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  historyRecipeContent: {
    padding: 16,
  },
  historyRecipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  historyRecipeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  historyRecipeStat: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  historyRecipeIngredients: {
    marginBottom: 16,
  },
  historyRecipeIngredientsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  historyRecipeIngredientsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  historyRecipeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyViewButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  historyViewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyRecipeRating: {
    alignItems: 'flex-end',
  },
  historyRecipeRatingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  generateMoreButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
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
  generateMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createMealSection: {
    alignItems: 'center',
    gap: 12,
  },
  speedToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  speedToggleActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  speedToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  speedToggleTextActive: {
    color: '#FFFFFF',
  },
  likedButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  likedButtonText: {
    color: '#EF4444',
  },
  dislikedButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#6B7280',
    borderWidth: 1,
  },
  dislikedButtonText: {
    color: '#6B7280',
  },
}); 