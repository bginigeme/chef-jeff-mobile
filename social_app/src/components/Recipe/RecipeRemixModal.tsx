import React, { useState } from 'react';
import { Recipe } from '../../services/recipeService';
import { X, Plus, Minus, Save } from 'lucide-react';

interface RecipeRemixModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSave: (remixedRecipe: RemixedRecipe) => void;
}

export interface RemixedRecipe {
  originalRecipeId: number;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  servings: number;
  cookTime: number;
}

export const RecipeRemixModal: React.FC<RecipeRemixModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(`${recipe.title} (My Remix)`);
  const [ingredients, setIngredients] = useState<string[]>([
    ...recipe.usedIngredients.map(ing => ing.name),
    ...recipe.missedIngredients.map(ing => ing.name)
  ]);
  const [newIngredient, setNewIngredient] = useState('');
  const [instructions, setInstructions] = useState(recipe.instructions || 'Add your cooking instructions here...');
  const [notes, setNotes] = useState('');
  const [servings, setServings] = useState(recipe.servings || 4);
  const [cookTime, setCookTime] = useState(recipe.readyInMinutes || 30);

  if (!isOpen) return null;

  const addIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const remixedRecipe: RemixedRecipe = {
      originalRecipeId: recipe.id,
      title,
      ingredients,
      instructions,
      notes,
      servings,
      cookTime
    };
    onSave(remixedRecipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Remix Recipe</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Original Recipe Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Original Recipe</h3>
            <p className="text-blue-800">{recipe.title}</p>
          </div>

          {/* Recipe Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Recipe Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servings
              </label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cook Time (minutes)
              </label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients
            </label>
            
            {/* Add new ingredient */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                placeholder="Add ingredient..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={addIngredient}
                className="bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-orange-600 flex items-center"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Ingredient list */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span>{ingredient}</span>
                  <button
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Add step-by-step cooking instructions..."
            />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Add any personal notes or modifications..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center space-x-2"
          >
            <Save size={16} />
            <span>Save Remix</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 