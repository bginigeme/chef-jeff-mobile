// Spoonacular API service
// Get your free API key at: https://spoonacular.com/food-api

const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

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

export interface RecipeDetails extends Recipe {
  instructions: string;
  summary: string;
  readyInMinutes: number;
  servings: number;
  extendedIngredients: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
  }>;
}

class RecipeService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Find recipes by ingredients
  async findRecipesByIngredients(
    ingredients: string[],
    number: number = 6,
    ranking: number = 1
  ): Promise<Recipe[]> {
    try {
      const ingredientsString = ingredients.join(',');
      const response = await fetch(
        `${BASE_URL}/findByIngredients?` +
        `apiKey=${this.apiKey}&` +
        `ingredients=${encodeURIComponent(ingredientsString)}&` +
        `number=${number}&` +
        `ranking=${ranking}&` +
        `ignorePantry=false`
      );

      if (!response.ok) {
        throw new Error(`Recipe API error: ${response.status}`);
      }

      const recipes = await response.json();
      return recipes;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  }

  // Get detailed recipe information
  async getRecipeDetails(recipeId: number): Promise<RecipeDetails> {
    try {
      const response = await fetch(
        `${BASE_URL}/${recipeId}/information?` +
        `apiKey=${this.apiKey}&` +
        `includeNutrition=false`
      );

      if (!response.ok) {
        throw new Error(`Recipe details API error: ${response.status}`);
      }

      const recipeDetails = await response.json();
      return recipeDetails;
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const recipeService = new RecipeService(SPOONACULAR_API_KEY);

// Fallback recipes for when API is not available or no API key
export const fallbackRecipes: Recipe[] = [
  {
    id: 1,
    title: "Simple Scrambled Eggs",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300",
    usedIngredientCount: 2,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 1, name: "eggs", image: "" },
      { id: 2, name: "butter", image: "" }
    ],
    missedIngredients: [],
    readyInMinutes: 10,
    servings: 2
  },
  {
    id: 2,
    title: "Basic Pasta",
    image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=300",
    usedIngredientCount: 2,
    missedIngredientCount: 1,
    usedIngredients: [
      { id: 3, name: "pasta", image: "" },
      { id: 4, name: "olive oil", image: "" }
    ],
    missedIngredients: [
      { id: 5, name: "garlic", image: "" }
    ],
    readyInMinutes: 15,
    servings: 4
  },
  {
    id: 3,
    title: "Rice Bowl",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300",
    usedIngredientCount: 1,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 6, name: "rice", image: "" }
    ],
    missedIngredients: [],
    readyInMinutes: 20,
    servings: 2
  }
]; 