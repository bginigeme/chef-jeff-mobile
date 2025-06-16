export interface Recipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: Array<{
    id: number;
    name: string;
    image: string;
  }>;
  usedIngredients: Array<{
    id: number;
    name: string;
    image: string;
  }>;
  readyInMinutes?: number;
  servings?: number;
  summary?: string;
  instructions?: string;
}

// Fallback recipes for when API is not available
export const fallbackRecipes: Recipe[] = [
  {
    id: 1,
    title: "🍳 Perfect Scrambled Eggs",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400",
    usedIngredientCount: 3,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 1, name: "eggs", image: "" },
      { id: 2, name: "butter", image: "" },
      { id: 3, name: "milk", image: "" }
    ],
    missedIngredients: [],
    readyInMinutes: 10,
    servings: 2,
    summary: "Creamy, fluffy scrambled eggs that are perfect for breakfast or any time of day.",
    instructions: "1. Crack eggs into a bowl and whisk with milk. 2. Heat butter in pan over medium-low heat. 3. Pour in eggs and gently stir continuously. 4. Season with salt and pepper. 5. Serve immediately."
  },
  {
    id: 2,
    title: "🍝 Simple Garlic Pasta",
    image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400",
    usedIngredientCount: 2,
    missedIngredientCount: 1,
    usedIngredients: [
      { id: 4, name: "pasta", image: "" },
      { id: 5, name: "olive oil", image: "" }
    ],
    missedIngredients: [
      { id: 6, name: "garlic", image: "" }
    ],
    readyInMinutes: 15,
    servings: 4,
    summary: "Quick and delicious pasta with aromatic garlic and olive oil.",
    instructions: "1. Cook pasta according to package directions. 2. Heat olive oil in large pan. 3. Add minced garlic and cook until fragrant. 4. Toss drained pasta with garlic oil. 5. Season and serve."
  },
  {
    id: 3,
    title: "🍚 Fluffy Rice Bowl",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
    usedIngredientCount: 1,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 7, name: "rice", image: "" }
    ],
    missedIngredients: [],
    readyInMinutes: 20,
    servings: 2,
    summary: "Perfectly cooked fluffy rice, a versatile base for any meal.",
    instructions: "1. Rinse rice until water runs clear. 2. Add rice and water to pot (1:2 ratio). 3. Bring to boil, then reduce heat to low. 4. Cover and simmer 18 minutes. 5. Let stand 5 minutes, then fluff with fork."
  },
  {
    id: 4,
    title: "🥗 Fresh Garden Salad",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    usedIngredientCount: 2,
    missedIngredientCount: 1,
    usedIngredients: [
      { id: 8, name: "lettuce", image: "" },
      { id: 9, name: "tomato", image: "" }
    ],
    missedIngredients: [
      { id: 10, name: "cucumber", image: "" }
    ],
    readyInMinutes: 5,
    servings: 2,
    summary: "Fresh, crisp salad with garden vegetables.",
    instructions: "1. Wash and chop lettuce. 2. Dice tomatoes and cucumber. 3. Combine in bowl. 4. Add your favorite dressing. 5. Toss and serve immediately."
  },
  {
    id: 5,
    title: "🍞 Avocado Toast",
    image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400",
    usedIngredientCount: 2,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 11, name: "bread", image: "" },
      { id: 12, name: "avocado", image: "" }
    ],
    missedIngredients: [],
    readyInMinutes: 5,
    servings: 1,
    summary: "Creamy avocado on perfectly toasted bread - simple and delicious.",
    instructions: "1. Toast bread to golden brown. 2. Mash ripe avocado with fork. 3. Spread avocado on toast. 4. Season with salt, pepper, and lemon juice. 5. Enjoy immediately."
  },
  {
    id: 6,
    title: "🥞 Fluffy Pancakes",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    usedIngredientCount: 4,
    missedIngredientCount: 1,
    usedIngredients: [
      { id: 13, name: "flour", image: "" },
      { id: 14, name: "eggs", image: "" },
      { id: 15, name: "milk", image: "" },
      { id: 16, name: "butter", image: "" }
    ],
    missedIngredients: [
      { id: 17, name: "baking powder", image: "" }
    ],
    readyInMinutes: 20,
    servings: 4,
    summary: "Light, fluffy pancakes perfect for weekend breakfast.",
    instructions: "1. Mix dry ingredients. 2. Whisk wet ingredients separately. 3. Combine wet and dry ingredients. 4. Cook on heated griddle until bubbles form. 5. Flip and cook until golden."
  }
];

// Function to get recipes based on pantry items
export const getRecipesByIngredients = (pantryItems: string[]): Recipe[] => {
  if (!pantryItems || pantryItems.length === 0) {
    return fallbackRecipes;
  }

  // Calculate match scores for each recipe
  const recipesWithScores = fallbackRecipes.map(recipe => {
    const usedIngredients = recipe.usedIngredients.filter(ingredient =>
      pantryItems.some(pantryItem => 
        pantryItem.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(pantryItem.toLowerCase())
      )
    );

    const missedIngredients = recipe.usedIngredients.filter(ingredient =>
      !pantryItems.some(pantryItem => 
        pantryItem.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(pantryItem.toLowerCase())
      )
    ).concat(recipe.missedIngredients);

    return {
      ...recipe,
      usedIngredientCount: usedIngredients.length,
      missedIngredientCount: missedIngredients.length,
      usedIngredients,
      missedIngredients,
      matchScore: usedIngredients.length / (usedIngredients.length + missedIngredients.length)
    };
  });

  // Sort by match score (highest first)
  return recipesWithScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(({ matchScore, ...recipe }) => recipe);
}; 
 
 