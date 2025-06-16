import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConvertedSpoonacularRecipe } from './spoonacularService';

interface LocalRecipeDatabase {
  version: string;
  lastUpdated: string;
  recipes: ConvertedSpoonacularRecipe[];
  ingredientIndex: { [ingredient: string]: string[] }; // Maps ingredients to recipe IDs
}

class LocalRecipeDatabaseService {
  private database: LocalRecipeDatabase | null = null;
  private isLoaded = false;
  private readonly STORAGE_KEY = 'local_recipe_database';
  private readonly CURRENT_VERSION = '1.0.0';

  // Initialize with sample professional recipes
  private readonly SAMPLE_RECIPES: ConvertedSpoonacularRecipe[] = [
    {
      id: 'local-1',
      title: 'Classic Chicken Alfredo',
      description: 'Rich and creamy pasta dish with tender chicken breast and fresh parmesan cheese.',
      ingredients: [
        { name: 'chicken breast', amount: '2', unit: 'pieces' },
        { name: 'fettuccine pasta', amount: '12', unit: 'oz' },
        { name: 'heavy cream', amount: '1', unit: 'cup' },
        { name: 'parmesan cheese', amount: '1', unit: 'cup' },
        { name: 'garlic', amount: '3', unit: 'cloves' },
        { name: 'butter', amount: '4', unit: 'tbsp' },
        { name: 'olive oil', amount: '2', unit: 'tbsp' }
      ],
      instructions: [
        'Season chicken breasts with salt and pepper',
        'Heat olive oil in a large skillet over medium-high heat',
        'Cook chicken until golden brown and cooked through, about 6-7 minutes per side',
        'Remove chicken and slice into strips',
        'Cook fettuccine according to package directions',
        'In the same skillet, melt butter and sauté minced garlic for 1 minute',
        'Add heavy cream and bring to a gentle simmer',
        'Stir in parmesan cheese until melted and smooth',
        'Add cooked pasta and chicken to the sauce',
        'Toss to combine and serve immediately'
      ],
      cookingTime: 25,
      servings: 4,
      difficulty: 'Medium',
      cuisine: 'Italian',
      tags: ['pasta', 'chicken', 'creamy', 'dinner', 'professional'],
      imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?ixlib=rb-4.0.3&w=400&q=80',
      nutritionInfo: {
        calories: 650,
        protein: '35g',
        carbs: '45g',
        fat: '35g'
      }
    },
    {
      id: 'local-2',
      title: 'Beef and Vegetable Stir Fry',
      description: 'Quick and healthy stir fry with tender beef strips and fresh vegetables.',
      ingredients: [
        { name: 'beef', amount: '1', unit: 'lb' },
        { name: 'broccoli', amount: '2', unit: 'cups' },
        { name: 'bell pepper', amount: '1', unit: 'piece' },
        { name: 'onion', amount: '1', unit: 'piece' },
        { name: 'garlic', amount: '3', unit: 'cloves' },
        { name: 'soy sauce', amount: '3', unit: 'tbsp' },
        { name: 'sesame oil', amount: '2', unit: 'tsp' },
        { name: 'vegetable oil', amount: '2', unit: 'tbsp' }
      ],
      instructions: [
        'Slice beef into thin strips against the grain',
        'Cut vegetables into bite-sized pieces',
        'Heat vegetable oil in a large wok or skillet over high heat',
        'Add beef and stir-fry for 2-3 minutes until browned',
        'Add garlic and onion, stir-fry for 1 minute',
        'Add broccoli and bell pepper, stir-fry for 3-4 minutes',
        'Add soy sauce and sesame oil',
        'Stir-fry for another 1-2 minutes until vegetables are crisp-tender',
        'Serve immediately over rice'
      ],
      cookingTime: 15,
      servings: 4,
      difficulty: 'Easy',
      cuisine: 'Asian',
      tags: ['beef', 'vegetables', 'stir-fry', 'quick', 'healthy', 'professional'],
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&w=400&q=80',
      nutritionInfo: {
        calories: 320,
        protein: '25g',
        carbs: '15g',
        fat: '18g'
      }
    },
    {
      id: 'local-3',
      title: 'Mediterranean Salmon with Rice',
      description: 'Herb-crusted salmon with Mediterranean flavors served over fluffy rice.',
      ingredients: [
        { name: 'salmon', amount: '4', unit: 'fillets' },
        { name: 'rice', amount: '1', unit: 'cup' },
        { name: 'olive oil', amount: '3', unit: 'tbsp' },
        { name: 'lemon', amount: '1', unit: 'piece' },
        { name: 'oregano', amount: '2', unit: 'tsp' },
        { name: 'garlic', amount: '3', unit: 'cloves' },
        { name: 'tomatoes', amount: '2', unit: 'pieces' }
      ],
      instructions: [
        'Preheat oven to 400°F (200°C)',
        'Cook rice according to package directions',
        'Season salmon fillets with salt, pepper, and oregano',
        'Heat olive oil in an oven-safe skillet',
        'Sear salmon skin-side up for 3-4 minutes',
        'Flip salmon and add minced garlic around the pan',
        'Add lemon slices and diced tomatoes',
        'Transfer skillet to oven and bake for 8-10 minutes',
        'Serve salmon over rice with pan juices'
      ],
      cookingTime: 25,
      servings: 4,
      difficulty: 'Medium',
      cuisine: 'Mediterranean',
      tags: ['salmon', 'fish', 'rice', 'healthy', 'mediterranean', 'professional'],
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&w=400&q=80',
      nutritionInfo: {
        calories: 450,
        protein: '35g',
        carbs: '35g',
        fat: '20g'
      }
    },
    {
      id: 'local-4',
      title: 'Vegetarian Pasta Primavera',
      description: 'Light and fresh pasta with seasonal vegetables and herbs.',
      ingredients: [
        { name: 'pasta', amount: '12', unit: 'oz' },
        { name: 'zucchini', amount: '1', unit: 'piece' },
        { name: 'bell pepper', amount: '1', unit: 'piece' },
        { name: 'cherry tomatoes', amount: '1', unit: 'cup' },
        { name: 'broccoli', amount: '1', unit: 'cup' },
        { name: 'olive oil', amount: '3', unit: 'tbsp' },
        { name: 'garlic', amount: '3', unit: 'cloves' },
        { name: 'basil', amount: '2', unit: 'tbsp' }
      ],
      instructions: [
        'Cook pasta according to package directions',
        'Cut all vegetables into bite-sized pieces',
        'Heat olive oil in a large skillet',
        'Sauté garlic for 30 seconds until fragrant',
        'Add harder vegetables (broccoli) first, cook 3 minutes',
        'Add remaining vegetables, cook 4-5 minutes',
        'Season with salt, pepper, and herbs',
        'Toss with cooked pasta and serve'
      ],
      cookingTime: 20,
      servings: 4,
      difficulty: 'Easy',
      cuisine: 'Italian',
      tags: ['pasta', 'vegetables', 'vegetarian', 'healthy', 'italian', 'professional'],
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d59a?ixlib=rb-4.0.3&w=400&q=80',
      nutritionInfo: {
        calories: 380,
        protein: '12g',
        carbs: '65g',
        fat: '12g'
      }
    },
    {
      id: 'local-5',
      title: 'Classic Chicken Rice Bowl',
      description: 'Seasoned chicken served over rice with vegetables.',
      ingredients: [
        { name: 'chicken breast', amount: '2', unit: 'pieces' },
        { name: 'rice', amount: '1', unit: 'cup' },
        { name: 'broccoli', amount: '1', unit: 'cup' },
        { name: 'carrots', amount: '2', unit: 'pieces' },
        { name: 'soy sauce', amount: '2', unit: 'tbsp' },
        { name: 'garlic', amount: '2', unit: 'cloves' },
        { name: 'olive oil', amount: '2', unit: 'tbsp' }
      ],
      instructions: [
        'Cook rice according to package directions',
        'Season chicken with salt and pepper',
        'Heat olive oil in a large pan',
        'Cook chicken until golden brown and cooked through',
        'Steam vegetables until tender-crisp',
        'Slice chicken and serve over rice',
        'Drizzle with soy sauce and serve with vegetables'
      ],
      cookingTime: 25,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Asian',
      tags: ['chicken', 'rice', 'healthy', 'bowl', 'easy', 'professional'],
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&w=400&q=80',
      nutritionInfo: {
        calories: 420,
        protein: '30g',
        carbs: '45g',
        fat: '12g'
      }
    }
  ];

  // Initialize the database
  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (stored) {
        this.database = JSON.parse(stored);
        console.log(`📚 Loaded ${this.database?.recipes.length || 0} recipes from local database`);
      } else {
        // First time setup - create database with sample recipes
        await this.createInitialDatabase();
      }
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to initialize recipe database:', error);
      // Fallback to sample recipes in memory
      await this.createInitialDatabase();
    }
  }

  // Create initial database with sample recipes
  private async createInitialDatabase(): Promise<void> {
    console.log('🔧 Creating initial recipe database...');
    
    this.database = {
      version: this.CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
      recipes: this.SAMPLE_RECIPES,
      ingredientIndex: this.buildIngredientIndex(this.SAMPLE_RECIPES)
    };

    await this.saveDatabase();
    console.log(`✅ Created local database with ${this.SAMPLE_RECIPES.length} professional recipes`);
  }

  // Build ingredient index for fast searching
  private buildIngredientIndex(recipes: ConvertedSpoonacularRecipe[]): { [ingredient: string]: string[] } {
    const index: { [ingredient: string]: string[] } = {};
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const normalizedName = ingredient.name.toLowerCase().trim();
        if (!index[normalizedName]) {
          index[normalizedName] = [];
        }
        if (!index[normalizedName].includes(recipe.id)) {
          index[normalizedName].push(recipe.id);
        }
      });
    });
    
    return index;
  }

  // Save database to storage
  private async saveDatabase(): Promise<void> {
    if (!this.database) return;
    
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.database));
    } catch (error) {
      console.error('Failed to save recipe database:', error);
    }
  }

  // Search recipes by ingredients (instant!)
  async searchByIngredients(ingredients: string[], maxResults = 10): Promise<ConvertedSpoonacularRecipe[]> {
    await this.initialize();
    
    if (!this.database) return [];

    const startTime = performance.now();
    const normalizedIngredients = ingredients.map(ing => ing.toLowerCase().trim());
    const recipeScores: { [recipeId: string]: number } = {};

    // Score recipes based on ingredient matches
    normalizedIngredients.forEach(ingredient => {
      // Exact matches
      if (this.database!.ingredientIndex[ingredient]) {
        this.database!.ingredientIndex[ingredient].forEach(recipeId => {
          recipeScores[recipeId] = (recipeScores[recipeId] || 0) + 2;
        });
      }

      // Partial matches (e.g., "chicken" matches "chicken breast")
      Object.keys(this.database!.ingredientIndex).forEach(indexedIngredient => {
        if (indexedIngredient.includes(ingredient) || ingredient.includes(indexedIngredient)) {
          this.database!.ingredientIndex[indexedIngredient].forEach(recipeId => {
            recipeScores[recipeId] = (recipeScores[recipeId] || 0) + 1;
          });
        }
      });
    });

    // Sort by score and return top results
    const sortedRecipeIds = Object.entries(recipeScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, maxResults)
      .map(([recipeId]) => recipeId);

    // Add randomization to results with similar scores
    const shuffledIds = this.shuffleWithinScoreGroups(
      Object.entries(recipeScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .slice(0, Math.min(maxResults * 2, this.database!.recipes.length)) // Get more recipes for shuffling
    ).slice(0, maxResults).map(([recipeId]) => recipeId);

    const results = shuffledIds
      .map(id => this.database!.recipes.find(recipe => recipe.id === id))
      .filter(recipe => recipe !== undefined) as ConvertedSpoonacularRecipe[];

    const endTime = performance.now();
    console.log(`⚡ Local database search completed in ${Math.round(endTime - startTime)}ms - found ${results.length} recipes`);

    return results;
  }

  // Helper method to shuffle recipe results within score groups
  private shuffleWithinScoreGroups(scoredRecipes: [string, number][]): [string, number][] {
    const groups: [string, number][][] = [];
    let currentGroup: [string, number][] = [];

    scoredRecipes.forEach(scoredRecipe => {
      if (currentGroup.length === 0 || scoredRecipe[1] === currentGroup[0][1]) {
        currentGroup.push(scoredRecipe);
      } else {
        groups.push(currentGroup);
        currentGroup = [scoredRecipe];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    const shuffledResults: [string, number][] = [];
    groups.forEach(group => {
      // Shuffle recipes within each score group
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
      shuffledResults.push(...group);
    });

    return shuffledResults;
  }

  // Get random recipes for inspiration
  async getRandomRecipes(count = 3): Promise<ConvertedSpoonacularRecipe[]> {
    await this.initialize();
    
    if (!this.database) return [];

    // Truly randomize the recipes every time
    const shuffled = [...this.database.recipes];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, count);
  }

  // Add new recipes to the database (for future expansion)
  async addRecipes(newRecipes: ConvertedSpoonacularRecipe[]): Promise<void> {
    await this.initialize();
    
    if (!this.database) return;

    // Add new recipes and update index
    this.database.recipes.push(...newRecipes);
    this.database.ingredientIndex = this.buildIngredientIndex(this.database.recipes);
    this.database.lastUpdated = new Date().toISOString();

    await this.saveDatabase();
    console.log(`📚 Added ${newRecipes.length} new recipes to local database`);
  }

  // Get database stats
  async getStats(): Promise<{ totalRecipes: number; lastUpdated: string }> {
    await this.initialize();
    
    return {
      totalRecipes: this.database?.recipes.length || 0,
      lastUpdated: this.database?.lastUpdated || 'Never'
    };
  }

  // Clear and rebuild database (for future use)
  async clearDatabase(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.database = null;
    this.isLoaded = false;
    console.log('🧹 Local recipe database cleared');
  }

  // Force refresh database with updated sample recipes
  async forceRefreshDatabase(): Promise<void> {
    console.log('🔄 Force refreshing local database with updated recipes...');
    await this.clearDatabase();
    await this.createInitialDatabase();
    console.log('✅ Database refreshed with updated image URLs');
  }
}

export const localRecipeDatabase = new LocalRecipeDatabaseService();
export type { LocalRecipeDatabase }; 