import React from 'react';
import { Recipe } from '../../services/recipeService';
import { Clock, Users, ChefHat } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onRemix: (recipe: Recipe) => void;
  onViewDetails: (recipeId: number) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onRemix, onViewDetails }) => {
  const matchPercentage = Math.round(
    (recipe.usedIngredientCount / (recipe.usedIngredientCount + recipe.missedIngredientCount)) * 100
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Recipe Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm font-medium">
          {matchPercentage}% Match
        </div>
      </div>

      {/* Recipe Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {recipe.title}
        </h3>

        {/* Recipe Meta */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {recipe.readyInMinutes && (
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>{recipe.readyInMinutes} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <Users size={16} />
              <span>{recipe.servings} servings</span>
            </div>
          )}
        </div>

        {/* Ingredients Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-green-600 font-medium">
              ✓ Have: {recipe.usedIngredientCount}
            </span>
            {recipe.missedIngredientCount > 0 && (
              <span className="text-orange-600 font-medium">
                Need: {recipe.missedIngredientCount}
              </span>
            )}
          </div>

          {/* Missing Ingredients */}
          {recipe.missedIngredients.length > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Missing: </span>
              {recipe.missedIngredients.slice(0, 3).map((ing, index) => (
                <span key={ing.id}>
                  {ing.name}
                  {index < Math.min(recipe.missedIngredients.length, 3) - 1 ? ', ' : ''}
                </span>
              ))}
              {recipe.missedIngredients.length > 3 && (
                <span> +{recipe.missedIngredients.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(recipe.id)}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            View Recipe
          </button>
          <button
            onClick={() => onRemix(recipe)}
            className="flex items-center justify-center bg-orange-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <ChefHat size={16} className="mr-1" />
            Remix
          </button>
        </div>
      </div>
    </div>
  );
}; 