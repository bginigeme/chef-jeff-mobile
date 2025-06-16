import Constants from 'expo-constants';

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  spoonacularSourceUrl: string;
  aggregateLikes: number;
  healthScore: number;
  spoonacularScore: number;
  pricePerServing: number;
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
      equipment: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
      length?: {
        number: number;
        unit: string;
      };
    }>;
  }>;
  extendedIngredients: Array<{
    id: number;
    aisle: string;
    image: string;
    consistency: string;
    name: string;
    nameClean: string;
    original: string;
    originalString: string;
    originalName: string;
    amount: number;
    unit: string;
    meta: string[];
    measures: {
      us: { amount: number; unitShort: string; unitLong: string };
      metric: { amount: number; unitShort: string; unitLong: string };
    };
  }>;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
      percentOfDailyNeeds: number;
    }>;
  };
  dishTypes: string[];
  diets: string[];
  occasions: string[];
  cuisines: string[];
  summary: string;
  instructions: string;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  veryHealthy: boolean;
  cheap: boolean;
  veryPopular: boolean;
  sustainable: boolean;
  lowFodmap: boolean;
  weightWatcherSmartPoints: number;
  gaps: string;
  preparationMinutes: number;
  cookingMinutes: number;
  creditsText: string;
  license: string;
  sourceName: string;
}

interface SpoonacularSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  equipment?: string;
  includeIngredients?: string;
  excludeIngredients?: string;
  type?: string;
  instructionsRequired?: boolean;
  fillIngredients?: boolean;
  addRecipeInformation?: boolean;
  addRecipeNutrition?: boolean;
  maxReadyTime?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minProtein?: number;
  maxProtein?: number;
  minCalories?: number;
  maxCalories?: number;
  minFat?: number;
  maxFat?: number;
  minSugar?: number;
  maxSugar?: number;
  minSodium?: number;
  maxSodium?: number;
  sort?: 'meta-score' | 'popularity' | 'healthiness' | 'price' | 'time' | 'random';
  sortDirection?: 'asc' | 'desc';
  number?: number;
  offset?: number;
}

interface ConvertedSpoonacularRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit?: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  tags: string[];
  imageUrl?: string;
  imagePrompt?: string;
  nutritionInfo?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  spoonacularData?: {
    sourceUrl: string;
    healthScore: number;
    aggregateLikes: number;
    pricePerServing: number;
    diets: string[];
    dishTypes: string[];
  };
}

class SpoonacularService {
  private apiKey: string;
  private baseUrl = 'https://api.spoonacular.com/recipes';
  private cache = new Map<string, any>();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Get API key from environment variables
    this.apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SPOONACULAR_API_KEY || 
                  process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Spoonacular API key not found. Please add EXPO_PUBLIC_SPOONACULAR_API_KEY to your environment variables.');
    }
  }

  // Search for recipes by ingredients in pantry
  async findRecipesByIngredients(
    pantryItems: string[], 
    options: {
      number?: number;
      maxReadyTime?: number;
      diet?: string;
      intolerances?: string;
    } = {}
  ): Promise<ConvertedSpoonacularRecipe[]> {
    if (!this.apiKey) {
      throw new Error('Spoonacular API key not configured');
    }

    const cacheKey = `ingredients-${pantryItems.join(',')}-${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log('📦 Using cached Spoonacular results');
      return cached;
    }

    try {
      const ingredients = pantryItems.join(',');
      const paramsObj: Record<string, string> = {
        apiKey: this.apiKey,
        ingredients,
        number: String(options.number || 6),
        limitLicense: 'true',
        ranking: '1', // Maximize used ingredients
        ignorePantry: 'true'
      };

      // Add optional parameters if they exist
      if (options.maxReadyTime) paramsObj.maxReadyTime = String(options.maxReadyTime);
      if (options.diet) paramsObj.diet = options.diet;
      if (options.intolerances) paramsObj.intolerances = options.intolerances;

      const params = new URLSearchParams(paramsObj);

      console.log('🔍 Searching Spoonacular for recipes with ingredients:', pantryItems);
      const response = await fetch(`${this.baseUrl}/findByIngredients?${params}`);
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
      }

      const recipes = await response.json();
      
      // Get detailed information for each recipe
      const detailedRecipes = await Promise.all(
        recipes.map((recipe: any) => this.getRecipeDetails(recipe.id))
      );

      // Convert to our recipe format
      const convertedRecipes = detailedRecipes
        .filter(recipe => recipe !== null)
        .map(recipe => this.convertSpoonacularRecipe(recipe!));

      // Cache the results
      this.setCachedResult(cacheKey, convertedRecipes);

      console.log(`✅ Found ${convertedRecipes.length} Spoonacular recipes`);
      return convertedRecipes;

    } catch (error: any) {
      // Handle 402 errors (payment required) silently since they're expected
      if (error.message?.includes('402')) {
        console.log('💳 Spoonacular API quota reached - using other recipe sources');
      } else {
        console.log('ℹ️ Spoonacular search temporarily unavailable:', error.message);
      }
      throw new Error(`Failed to search Spoonacular recipes: ${error.message}`);
    }
  }

  // Search for recipes by query (e.g., "pasta", "chicken curry")
  async searchRecipes(
    query: string,
    options: SpoonacularSearchParams = {}
  ): Promise<ConvertedSpoonacularRecipe[]> {
    if (!this.apiKey) {
      throw new Error('Spoonacular API key not configured');
    }

    const cacheKey = `search-${query}-${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log('📦 Using cached Spoonacular search results');
      return cached;
    }

    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        query,
        number: String(options.number || 6),
        addRecipeInformation: 'true',
        addRecipeNutrition: String(options.addRecipeNutrition || false),
        fillIngredients: String(options.fillIngredients || false),
        instructionsRequired: String(options.instructionsRequired || true),
        ...Object.fromEntries(
          Object.entries(options).filter(([_, value]) => value !== undefined)
        )
      });

      console.log('🔍 Searching Spoonacular for:', query);
      const response = await fetch(`${this.baseUrl}/complexSearch?${params}`);
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const recipes = data.results || [];

      // Convert to our recipe format
      const convertedRecipes = recipes.map((recipe: SpoonacularRecipe) => 
        this.convertSpoonacularRecipe(recipe)
      );

      // Cache the results
      this.setCachedResult(cacheKey, convertedRecipes);

      console.log(`✅ Found ${convertedRecipes.length} Spoonacular recipes for "${query}"`);
      return convertedRecipes;

    } catch (error: any) {
      // Handle 402 errors (payment required) silently since they're expected
      if (error.message?.includes('402')) {
        console.log('💳 Spoonacular API quota reached - using other recipe sources');
      } else {
        console.log('ℹ️ Spoonacular search temporarily unavailable:', error.message);
      }
      throw new Error(`Failed to search Spoonacular recipes: ${error.message}`);
    }
  }

  // Get detailed recipe information
  async getRecipeDetails(recipeId: number): Promise<SpoonacularRecipe | null> {
    if (!this.apiKey) {
      throw new Error('Spoonacular API key not configured');
    }

    const cacheKey = `recipe-${recipeId}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        includeNutrition: 'true'
      });

      const response = await fetch(`${this.baseUrl}/${recipeId}/information?${params}`);
      
      if (!response.ok) {
        console.log(`ℹ️ Recipe ${recipeId} unavailable: ${response.status}`);
        return null;
      }

      const recipe = await response.json();
      
      // Cache the result
      this.setCachedResult(cacheKey, recipe);

      return recipe;

    } catch (error: any) {
      console.log(`ℹ️ Recipe ${recipeId} temporarily unavailable`);
      return null;
    }
  }

  // Get random recipes
  async getRandomRecipes(options: {
    number?: number;
    limitLicense?: boolean;
    tags?: string;
    includeNutrition?: boolean;
  } = {}): Promise<ConvertedSpoonacularRecipe[]> {
    if (!this.apiKey) {
      throw new Error('Spoonacular API key not configured');
    }

    const cacheKey = `random-${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log('📦 Using cached random recipes');
      return cached;
    }

    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        number: String(options.number || 3),
        limitLicense: String(options.limitLicense || true),
        includeNutrition: String(options.includeNutrition || true),
        ...Object.fromEntries(
          Object.entries(options).filter(([_, value]) => value !== undefined)
        )
      });

      console.log('🎲 Getting random Spoonacular recipes');
      const response = await fetch(`${this.baseUrl}/random?${params}`);
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const recipes = data.recipes || [];

      // Convert to our recipe format
      const convertedRecipes = recipes.map((recipe: SpoonacularRecipe) => 
        this.convertSpoonacularRecipe(recipe)
      );

      // Cache the results
      this.setCachedResult(cacheKey, convertedRecipes);

      console.log(`✅ Got ${convertedRecipes.length} random Spoonacular recipes`);
      return convertedRecipes;

    } catch (error: any) {
      // Handle 402 errors (payment required) silently since they're expected
      if (error.message?.includes('402')) {
        console.log('💳 Spoonacular API quota reached - using other recipe sources');
      } else {
        console.log('ℹ️ Random recipes temporarily unavailable:', error.message);
      }
      throw new Error(`Failed to get random recipes: ${error.message}`);
    }
  }

  // Convert Spoonacular recipe to our format
  private convertSpoonacularRecipe(spoonacularRecipe: SpoonacularRecipe): ConvertedSpoonacularRecipe {
    // Convert ingredients
    const ingredients = spoonacularRecipe.extendedIngredients?.map(ingredient => ({
      name: ingredient.nameClean || ingredient.name,
      amount: ingredient.amount ? ingredient.amount.toString() : ingredient.measures?.us?.amount?.toString() || '1',
      unit: ingredient.unit || ingredient.measures?.us?.unitShort || ''
    })) || [];

    // Convert instructions
    let instructions: string[] = [];
    if (spoonacularRecipe.analyzedInstructions && spoonacularRecipe.analyzedInstructions.length > 0) {
      instructions = spoonacularRecipe.analyzedInstructions[0].steps
        .sort((a, b) => a.number - b.number)
        .map(step => step.step);
    } else if (spoonacularRecipe.instructions) {
      // Fallback to raw instructions and split them
      instructions = spoonacularRecipe.instructions
        .split(/\d+\.|\n/)
        .map(step => step.trim())
        .filter(step => step.length > 10);
    }

    // Determine difficulty based on cooking time and number of ingredients
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
    const ingredientCount = ingredients.length;
    const cookingTime = spoonacularRecipe.readyInMinutes || 30;
    
    if (ingredientCount > 10 || cookingTime > 60) {
      difficulty = 'Hard';
    } else if (ingredientCount > 6 || cookingTime > 30) {
      difficulty = 'Medium';
    }

    // Extract cuisine
    const cuisine = spoonacularRecipe.cuisines && spoonacularRecipe.cuisines.length > 0 
      ? spoonacularRecipe.cuisines[0] 
      : 'International';

    // Create tags
    const tags = [
      ...spoonacularRecipe.dishTypes || [],
      ...spoonacularRecipe.diets || [],
      'spoonacular',
      difficulty.toLowerCase()
    ].filter(Boolean);

    // Extract nutrition info
    let nutritionInfo;
    if (spoonacularRecipe.nutrition?.nutrients) {
      const nutrients = spoonacularRecipe.nutrition.nutrients;
      const calories = nutrients.find(n => n.name === 'Calories')?.amount || 0;
      const protein = nutrients.find(n => n.name === 'Protein')?.amount || 0;
      const carbs = nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
      const fat = nutrients.find(n => n.name === 'Fat')?.amount || 0;

      nutritionInfo = {
        calories: Math.round(calories),
        protein: `${Math.round(protein)}g`,
        carbs: `${Math.round(carbs)}g`,
        fat: `${Math.round(fat)}g`
      };
    }

    // Clean up HTML from summary for description
    const description = spoonacularRecipe.summary
      ? spoonacularRecipe.summary.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
      : `A delicious ${cuisine} recipe with ${ingredients.length} ingredients.`;

    return {
      id: `spoon-${spoonacularRecipe.id}`,
      title: spoonacularRecipe.title,
      description,
      ingredients,
      instructions,
      cookingTime: spoonacularRecipe.readyInMinutes || 30,
      servings: spoonacularRecipe.servings || 2,
      difficulty,
      cuisine,
      tags,
      imageUrl: spoonacularRecipe.image,
      imagePrompt: `Professional food photography of ${spoonacularRecipe.title}`,
      nutritionInfo,
      spoonacularData: {
        sourceUrl: spoonacularRecipe.sourceUrl || spoonacularRecipe.spoonacularSourceUrl,
        healthScore: spoonacularRecipe.healthScore || 0,
        aggregateLikes: spoonacularRecipe.aggregateLikes || 0,
        pricePerServing: spoonacularRecipe.pricePerServing || 0,
        diets: spoonacularRecipe.diets || [],
        dishTypes: spoonacularRecipe.dishTypes || []
      }
    };
  }

  // Cache management
  private getCachedResult(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCachedResult(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Spoonacular cache cleared');
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const spoonacularService = new SpoonacularService();
export type { ConvertedSpoonacularRecipe, SpoonacularSearchParams }; 