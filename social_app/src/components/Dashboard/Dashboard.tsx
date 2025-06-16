import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProfile, Profile, saveRemixedRecipe, updatePantryItems } from '../../supabase/database';
import { recipeService, fallbackRecipes, Recipe } from '../../services/recipeService';
import { RecipeCard } from '../Recipe/RecipeCard';
import { SwipeRecipeView } from '../Recipe/SwipeRecipeView';
import { RecipeRemixModal, RemixedRecipe } from '../Recipe/RecipeRemixModal';
import { EditPantryModal } from '../Pantry/EditPantryModal';
import { ChefHat, Loader2, AlertCircle, Edit3, Grid3X3, Heart } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRemixModalOpen, setIsRemixModalOpen] = useState(false);
  const [isEditPantryModalOpen, setIsEditPantryModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);

        // Fetch recipes based on pantry items
        if (userProfile?.pantry_items && userProfile.pantry_items.length > 0) {
          try {
            const fetchedRecipes = await recipeService.findRecipesByIngredients(
              userProfile.pantry_items,
              8  // Get 8 recipes
            );
            setRecipes(fetchedRecipes);
          } catch (apiError) {
            console.warn('Spoonacular API error, using fallback recipes:', apiError);
            // Use fallback recipes if API fails
            setRecipes(fallbackRecipes);
          }
        } else {
          // Show fallback recipes if no pantry items
          setRecipes(fallbackRecipes);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleRemix = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRemixModalOpen(true);
  };

  const handleSaveRemix = async (remixedRecipe: RemixedRecipe) => {
    if (!user) return;

    try {
      const savedRecipe = await saveRemixedRecipe(user.id, {
        original_recipe_id: remixedRecipe.originalRecipeId,
        title: remixedRecipe.title,
        ingredients: remixedRecipe.ingredients,
        instructions: remixedRecipe.instructions,
        notes: remixedRecipe.notes,
        servings: remixedRecipe.servings,
        cook_time: remixedRecipe.cookTime,
      });

      if (savedRecipe) {
        alert(`Recipe "${remixedRecipe.title}" saved to your profile!`);
      }
    } catch (error) {
      console.error('Error saving remixed recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const handleUpdatePantry = async (updatedPantryItems: string[]) => {
    if (!user) return;

    try {
      await updatePantryItems(user.id, updatedPantryItems);
      
      // Update the profile state with new pantry items
      if (profile) {
        const updatedProfile = { ...profile, pantry_items: updatedPantryItems };
        setProfile(updatedProfile);
        
        // Refresh recipes based on updated pantry
        if (updatedPantryItems.length > 0) {
          try {
            const fetchedRecipes = await recipeService.findRecipesByIngredients(
              updatedPantryItems,
              8
            );
            setRecipes(fetchedRecipes);
          } catch (apiError) {
            console.warn('Spoonacular API error, using fallback recipes:', apiError);
            setRecipes(fallbackRecipes);
          }
        } else {
          setRecipes(fallbackRecipes);
        }
      }
      
      alert('Pantry updated successfully!');
    } catch (error) {
      console.error('Error updating pantry:', error);
      alert('Failed to update pantry. Please try again.');
    }
  };

  const handleLikeRecipe = (recipe: Recipe) => {
    // You can implement saving liked recipes to profile here
    console.log('Liked recipe:', recipe.title);
    // For now, just show a message
    alert(`❤️ Liked "${recipe.title}"! (Feature: Save to favorites coming soon)`);
  };

  const handlePassRecipe = (recipe: Recipe) => {
    // Optional: Track passed recipes to avoid showing again
    console.log('Passed recipe:', recipe.title);
  };

  const handleViewDetails = async (recipeId: number) => {
    try {
      const details = await recipeService.getRecipeDetails(recipeId);
      alert(`Recipe details for "${details.title}" - Implementation coming soon!`);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      alert('Failed to load recipe details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500 mb-4" />
          <p className="text-gray-600">Loading your recipes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Recipe Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Pantry Items
          </h3>
          <p className="text-3xl font-bold text-orange-500">
            {profile.pantry_items?.length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Recipe Matches
          </h3>
          <p className="text-3xl font-bold text-blue-500">
            {recipes.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Skill Level
          </h3>
          <p className="text-3xl font-bold text-green-500 capitalize">
            {profile.cooking_skill_level}
          </p>
        </div>
      </div>

      {/* Recipe Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Recommended Recipes
          </h2>
          
          {/* View Mode Toggle */}
          {recipes.length > 0 && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 size={16} />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('swipe')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'swipe' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Heart size={16} />
                <span>Swipe</span>
              </button>
            </div>
          )}
        </div>
        
        {recipes.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onRemix={handleRemix}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            /* Swipe View */
            <div className="flex justify-center">
              <SwipeRecipeView
                recipes={recipes}
                onLike={handleLikeRecipe}
                onPass={handlePassRecipe}
                onRemix={handleRemix}
                onViewDetails={handleViewDetails}
              />
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 mb-4">
              Add some ingredients to your pantry to get recipe suggestions!
            </p>
          </div>
        )}
      </div>

      {/* Pantry Items */}
      {profile.pantry_items && profile.pantry_items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Pantry
            </h3>
            <button
              onClick={() => setIsEditPantryModalOpen(true)}
              className="flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              <Edit3 size={16} />
              <span>Edit Pantry</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.pantry_items.map((item: string, index: number) => (
              <span
                key={index}
                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty pantry state with edit button */}
      {(!profile.pantry_items || profile.pantry_items.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your pantry is empty
          </h3>
          <p className="text-gray-600 mb-4">
            Add some ingredients to get personalized recipe suggestions!
          </p>
          <button
            onClick={() => setIsEditPantryModalOpen(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Add Pantry Items
          </button>
        </div>
      )}

      {/* Remix Modal */}
      {selectedRecipe && (
        <RecipeRemixModal
          recipe={selectedRecipe}
          isOpen={isRemixModalOpen}
          onClose={() => {
            setIsRemixModalOpen(false);
            setSelectedRecipe(null);
          }}
          onSave={handleSaveRemix}
        />
      )}

      {/* Edit Pantry Modal */}
      <EditPantryModal
        isOpen={isEditPantryModalOpen}
        currentPantryItems={profile.pantry_items || []}
        onClose={() => setIsEditPantryModalOpen(false)}
        onSave={handleUpdatePantry}
      />
    </div>
  );
};

export default Dashboard; 