import React, { useState, useEffect } from 'react';
import { Recipe } from '../../services/recipeService';
import { Heart, X, ChefHat, Clock, Users, Info } from 'lucide-react';

interface SwipeRecipeViewProps {
  recipes: Recipe[];
  onLike: (recipe: Recipe) => void;
  onPass: (recipe: Recipe) => void;
  onRemix: (recipe: Recipe) => void;
  onViewDetails: (recipeId: number) => void;
}

export const SwipeRecipeView: React.FC<SwipeRecipeViewProps> = ({
  recipes,
  onLike,
  onPass,
  onRemix,
  onViewDetails
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const currentRecipe = recipes[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating || !currentRecipe) return;

    setIsAnimating(true);
    setSwipeDirection(direction);

    // Call appropriate callback
    if (direction === 'right') {
      onLike(currentRecipe);
    } else {
      onPass(currentRecipe);
    }

    // Animate and move to next recipe
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
      setSwipeDirection(null);
    }, 300);
  };

  const matchPercentage = currentRecipe ? Math.round(
    (currentRecipe.usedIngredientCount / (currentRecipe.usedIngredientCount + currentRecipe.missedIngredientCount)) * 100
  ) : 0;

  // Reset when recipes change
  useEffect(() => {
    setCurrentIndex(0);
  }, [recipes]);

  if (!currentRecipe) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-lg p-8">
        <ChefHat className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No more recipes!
        </h3>
        <p className="text-gray-500 text-center">
          You've seen all available recipes. Try updating your pantry for more suggestions!
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Recipe Card Stack */}
      <div className="relative h-[600px]">
        {/* Next recipe (background) */}
        {recipes[currentIndex + 1] && (
          <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform scale-95 opacity-50">
            <img
              src={recipes[currentIndex + 1].image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
              alt="Next recipe"
              className="w-full h-64 object-cover rounded-t-xl"
            />
          </div>
        )}

        {/* Current recipe */}
        <div 
          className={`absolute inset-0 bg-white rounded-xl shadow-xl transition-all duration-300 ${
            isAnimating ? (
              swipeDirection === 'right' 
                ? 'transform translate-x-full rotate-12 opacity-0'
                : 'transform -translate-x-full -rotate-12 opacity-0'
            ) : 'transform translate-x-0 rotate-0 opacity-100'
          }`}
        >
          {/* Recipe Image */}
          <div className="relative h-64 overflow-hidden rounded-t-xl">
            <img
              src={currentRecipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
              alt={currentRecipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {matchPercentage}% Match
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h2 className="text-white text-xl font-bold line-clamp-2">
                {currentRecipe.title}
              </h2>
            </div>
          </div>

          {/* Recipe Info */}
          <div className="p-6">
            {/* Meta Info */}
            <div className="flex items-center justify-center space-x-6 mb-4">
              {currentRecipe.readyInMinutes && (
                <div className="flex items-center space-x-1 text-gray-600">
                  <Clock size={16} />
                  <span className="text-sm">{currentRecipe.readyInMinutes} min</span>
                </div>
              )}
              {currentRecipe.servings && (
                <div className="flex items-center space-x-1 text-gray-600">
                  <Users size={16} />
                  <span className="text-sm">{currentRecipe.servings} servings</span>
                </div>
              )}
            </div>

            {/* Ingredients Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-green-600 font-semibold">
                  ✓ Have: {currentRecipe.usedIngredientCount}
                </span>
                {currentRecipe.missedIngredientCount > 0 && (
                  <span className="text-orange-600 font-semibold">
                    Need: {currentRecipe.missedIngredientCount}
                  </span>
                )}
              </div>

              {/* Missing Ingredients */}
              {currentRecipe.missedIngredients.length > 0 && (
                <div className="text-xs text-gray-600 bg-orange-50 p-3 rounded-lg">
                  <span className="font-medium">Missing: </span>
                  {currentRecipe.missedIngredients.slice(0, 4).map((ing, index) => (
                    <span key={ing.id}>
                      {ing.name}
                      {index < Math.min(currentRecipe.missedIngredients.length, 4) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {currentRecipe.missedIngredients.length > 4 && (
                    <span> +{currentRecipe.missedIngredients.length - 4} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4">
              {/* Pass Button */}
              <button
                onClick={() => handleSwipe('left')}
                disabled={isAnimating}
                className="flex items-center justify-center w-14 h-14 bg-red-100 text-red-500 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                title="Pass"
              >
                <X size={24} />
              </button>

              {/* Info Button */}
              <button
                onClick={() => onViewDetails(currentRecipe.id)}
                className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-500 rounded-full hover:bg-blue-200 transition-colors"
                title="View Details"
              >
                <Info size={20} />
              </button>

              {/* Remix Button */}
              <button
                onClick={() => onRemix(currentRecipe)}
                className="flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-500 rounded-full hover:bg-orange-200 transition-colors"
                title="Remix"
              >
                <ChefHat size={20} />
              </button>

              {/* Like Button */}
              <button
                onClick={() => handleSwipe('right')}
                disabled={isAnimating}
                className="flex items-center justify-center w-14 h-14 bg-green-100 text-green-500 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                title="Like"
              >
                <Heart size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Recipe {currentIndex + 1} of {recipes.length}</span>
          <span>{recipes.length - currentIndex - 1} left</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / recipes.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Swipe Instructions */}
      <div className="mt-4 text-center text-xs text-gray-400">
        <p>❌ Pass • ❤️ Like • 👨‍🍳 Remix • ℹ️ Details</p>
      </div>
    </div>
  );
}; 