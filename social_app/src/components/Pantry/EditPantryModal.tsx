import React, { useState } from 'react';
import { X, Plus, Minus, Save } from 'lucide-react';

interface EditPantryModalProps {
  isOpen: boolean;
  currentPantryItems: string[];
  onClose: () => void;
  onSave: (updatedItems: string[]) => void;
}

export const EditPantryModal: React.FC<EditPantryModalProps> = ({
  isOpen,
  currentPantryItems,
  onClose,
  onSave
}) => {
  const [pantryItems, setPantryItems] = useState<string[]>(currentPantryItems);
  const [newItem, setNewItem] = useState('');

  const commonIngredients = [
    'Chicken breast', 'Ground beef', 'Salmon', 'Eggs', 'Milk', 'Cheese', 'Butter',
    'Rice', 'Pasta', 'Bread', 'Potatoes', 'Onions', 'Garlic', 'Tomatoes',
    'Bell peppers', 'Carrots', 'Broccoli', 'Spinach', 'Mushrooms', 'Beans',
    'Olive oil', 'Salt', 'Black pepper', 'Flour', 'Sugar', 'Herbs', 'Spices'
  ];

  if (!isOpen) return null;

  const addItem = (item: string) => {
    if (item.trim() && !pantryItems.includes(item.trim())) {
      setPantryItems([...pantryItems, item.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    setPantryItems(pantryItems.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(pantryItems);
    onClose();
  };

  const handleCancel = () => {
    setPantryItems(currentPantryItems); // Reset to original
    setNewItem('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Your Pantry</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add new item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Ingredient
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem(newItem)}
                placeholder="Add ingredient..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={() => addItem(newItem)}
                className="bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-orange-600 flex items-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Common ingredients */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Quick Add Common Ingredients:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {commonIngredients.map((ingredient) => (
                <button
                  key={ingredient}
                  onClick={() => addItem(ingredient)}
                  disabled={pantryItems.includes(ingredient)}
                  className={`text-left px-3 py-2 rounded border text-sm transition duration-200 ${
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

          {/* Current pantry items */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Your Pantry Items ({pantryItems.length}):
            </h3>
            
            {pantryItems.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pantryItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <span className="text-gray-900">{item}</span>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove item"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No items in your pantry yet.</p>
                <p className="text-sm">Add some ingredients above to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center space-x-2"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 