import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updatePantryItems } from '../../supabase/database';

interface PantrySetupProps {
  onPantryComplete: () => void;
}

const PantrySetup: React.FC<PantrySetupProps> = ({ onPantryComplete }) => {
  const [currentItem, setCurrentItem] = useState('');
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const commonIngredients = [
    'Chicken breast', 'Ground beef', 'Salmon', 'Eggs', 'Milk', 'Cheese', 'Butter',
    'Rice', 'Pasta', 'Bread', 'Potatoes', 'Onions', 'Garlic', 'Tomatoes',
    'Bell peppers', 'Carrots', 'Broccoli', 'Spinach', 'Mushrooms', 'Beans',
    'Olive oil', 'Salt', 'Black pepper', 'Flour', 'Sugar', 'Herbs', 'Spices'
  ];

  const addItem = (item: string) => {
    if (item && !pantryItems.includes(item)) {
      setPantryItems([...pantryItems, item]);
      setCurrentItem('');
    }
  };

  const removeItem = (item: string) => {
    setPantryItems(pantryItems.filter(i => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || pantryItems.length === 0) {
      setError('Please add at least one item to your pantry');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await updatePantryItems(user.id, pantryItems);

      onPantryComplete();
    } catch (error: any) {
      setError('Failed to save pantry items: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-orange-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Chef Jeff</h1>
          <h2 className="text-xl font-semibold text-gray-700">What's in Your Pantry?</h2>
          <p className="text-gray-600 mt-2">Add ingredients you have available to get personalized recipe recommendations!</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={currentItem}
              onChange={(e) => setCurrentItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem(currentItem)}
              placeholder="Add an ingredient..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => addItem(currentItem)}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition duration-200"
            >
              Add
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-gray-700 font-semibold mb-2">Common Ingredients (click to add):</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {commonIngredients.map((ingredient) => (
                <button
                  key={ingredient}
                  type="button"
                  onClick={() => addItem(ingredient)}
                  disabled={pantryItems.includes(ingredient)}
                  className={`text-left px-3 py-2 rounded border transition duration-200 ${
                    pantryItems.includes(ingredient)
                      ? 'bg-green-100 border-green-300 text-green-700 cursor-not-allowed'
                      : 'bg-gray-50 border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                  }`}
                >
                  {ingredient}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-gray-700 font-semibold mb-2">Your Pantry Items:</h3>
            {pantryItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pantryItems.map((item) => (
                  <span
                    key={item}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="text-orange-600 hover:text-orange-800 text-lg font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No items added yet. Add some ingredients to get started!</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={loading || pantryItems.length === 0}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 transition duration-200 font-medium"
          >
            {loading ? 'Saving Pantry...' : `Save Pantry (${pantryItems.length} items)`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PantrySetup; 