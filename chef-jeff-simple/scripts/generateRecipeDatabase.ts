import { aiRecipeGenerator, AIRecipe, RecipeRequest } from '../lib/aiRecipeService';
import * as fs from 'fs';
import * as path from 'path';

// Check for OpenAI API key before starting
function validateApiKey(): boolean {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OpenAI API Key Missing!');
    console.error('\n🔑 To generate recipes, you need an OpenAI API key:');
    console.error('1. Visit https://platform.openai.com/api-keys');
    console.error('2. Create an API key');
    console.error('3. Set it as an environment variable:');
    console.error('   export OPENAI_API_KEY="your_api_key_here"');
    console.error('   OR');
    console.error('   export EXPO_PUBLIC_OPENAI_API_KEY="your_api_key_here"');
    console.error('\n🚀 Alternative: Run the script with inline API key:');
    console.error('   OPENAI_API_KEY="your_key" npm run generate-recipes-small');
    console.error('\n⚠️  Note: API costs ~$0.10-0.50 for 100 recipes');
    return false;
  }
  
  console.log('✅ OpenAI API key found!');
  return true;
}

interface RecipeDatabase {
  version: string;
  generatedAt: string;
  totalRecipes: number;
  recipes: AIRecipe[];
  ingredientCombinations: IngredientCombination[];
}

interface IngredientCombination {
  id: string;
  name: string;
  ingredients: string[];
  category: string;
  popularity: number; // 1-10 scale
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisineStyle: string[];
}

class RecipeDatabaseGenerator {
  private commonIngredientCombinations: IngredientCombination[] = [];
  private generatedRecipes: AIRecipe[] = [];
  private outputPath = path.join(__dirname, '../data/recipeDatabase.json');

  constructor() {
    this.initializeIngredientCombinations();
  }

  async generateRecipeDatabase(targetCount: number = 1000): Promise<void> {
    console.log(`🚀 Starting recipe database generation for ${targetCount} recipes...`);
    
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;
    
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(this.outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate recipes in batches of 50
    const batchSize = 50;
    const totalBatches = Math.ceil(targetCount / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, targetCount);
      const batchRecipeCount = batchEnd - batchStart;
      
      console.log(`\n📦 Batch ${batch + 1}/${totalBatches}: Generating ${batchRecipeCount} recipes...`);
      
      const batchPromises: Promise<void>[] = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        const combination = this.selectIngredientCombination();
        const request = this.createRecipeRequest(combination);
        
        batchPromises.push(
          this.generateSingleRecipe(request, combination.name, i + 1)
            .then(() => { successCount++; })
            .catch((error) => {
              console.error(`❌ Recipe ${i + 1} failed:`, error.message);
              failureCount++;
            })
        );
      }
      
      // Wait for batch to complete
      await Promise.allSettled(batchPromises);
      
      // Progress update
      const progress = ((batch + 1) / totalBatches * 100).toFixed(1);
      console.log(`✅ Batch ${batch + 1} complete. Progress: ${progress}% (${successCount} success, ${failureCount} failed)`);
      
      // Save intermediate results every 5 batches
      if ((batch + 1) % 5 === 0) {
        await this.saveIntermediateResults(batch + 1);
      }
      
      // Rate limiting: wait 2 seconds between batches to avoid OpenAI limits
      if (batch < totalBatches - 1) {
        console.log('⏳ Waiting 2 seconds to respect API limits...');
        await this.sleep(2000);
      }
    }
    
    // Final save
    await this.saveFinalDatabase();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 Recipe database generation complete!');
    console.log(`📊 Results: ${successCount} recipes generated, ${failureCount} failed`);
    console.log(`⏱️ Total time: ${duration}s (${(duration / 60).toFixed(1)} minutes)`);
    console.log(`💾 Database saved to: ${this.outputPath}`);
  }

  private async generateSingleRecipe(request: RecipeRequest, combinationName: string, index: number): Promise<void> {
    try {
      const recipe = await aiRecipeGenerator.generateRecipe(request);
      
      // Add metadata
      const enhancedRecipe: AIRecipe = {
        ...recipe,
        tags: [...recipe.tags, 'database-generated', combinationName.toLowerCase().replace(/\s+/g, '-')],
        id: `db_${Date.now()}_${index}`
      };
      
      this.generatedRecipes.push(enhancedRecipe);
      
      if (index % 10 === 0) {
        console.log(`  ✅ Recipe ${index}: "${recipe.title}"`);
      }
      
    } catch (error) {
      throw new Error(`Failed to generate recipe ${index}: ${error}`);
    }
  }

  private selectIngredientCombination(): IngredientCombination {
    // Weighted selection based on popularity
    const weightedCombinations: IngredientCombination[] = [];
    
    this.commonIngredientCombinations.forEach(combination => {
      // Add multiple copies based on popularity (1-10 scale)
      for (let i = 0; i < combination.popularity; i++) {
        weightedCombinations.push(combination);
      }
    });
    
    const randomIndex = Math.floor(Math.random() * weightedCombinations.length);
    return weightedCombinations[randomIndex];
  }

  private createRecipeRequest(combination: IngredientCombination): RecipeRequest {
    // Add some randomness to avoid duplicate recipes
    const cookingTimes = [15, 20, 25, 30, 35, 40, 45];
    const servings = [1, 2, 3, 4, 6];
    const cuisines = combination.cuisineStyle.length > 0 
      ? combination.cuisineStyle 
      : ['International', 'Fusion', 'Home-style'];
    
    return {
      pantryIngredients: combination.ingredients,
      cookingTime: cookingTimes[Math.floor(Math.random() * cookingTimes.length)],
      servings: servings[Math.floor(Math.random() * servings.length)],
      difficulty: combination.difficulty,
      cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
      specificRequest: `Create a unique ${combination.category.toLowerCase()} recipe focusing on ${combination.name.toLowerCase()}`
    };
  }

  private async saveIntermediateResults(batchNumber: number): Promise<void> {
    const intermediateData: RecipeDatabase = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalRecipes: this.generatedRecipes.length,
      recipes: this.generatedRecipes,
      ingredientCombinations: this.commonIngredientCombinations
    };
    
    const intermediatePath = this.outputPath.replace('.json', `_batch_${batchNumber}.json`);
    fs.writeFileSync(intermediatePath, JSON.stringify(intermediateData, null, 2));
    console.log(`💾 Intermediate save: ${this.generatedRecipes.length} recipes saved to batch file`);
  }

  private async saveFinalDatabase(): Promise<void> {
    const database: RecipeDatabase = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalRecipes: this.generatedRecipes.length,
      recipes: this.generatedRecipes,
      ingredientCombinations: this.commonIngredientCombinations
    };
    
    fs.writeFileSync(this.outputPath, JSON.stringify(database, null, 2));
    
    // Also create a minified version for production
    const minifiedPath = this.outputPath.replace('.json', '.min.json');
    fs.writeFileSync(minifiedPath, JSON.stringify(database));
    
    console.log(`💾 Final database saved: ${this.generatedRecipes.length} recipes`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeIngredientCombinations(): void {
    this.commonIngredientCombinations = [
      // Protein + Vegetable Combinations (High popularity)
      {
        id: 'chicken_broccoli',
        name: 'Chicken and Broccoli',
        ingredients: ['chicken breast', 'broccoli', 'garlic', 'olive oil'],
        category: 'Protein & Vegetables',
        popularity: 10,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'Asian', 'Mediterranean']
      },
      {
        id: 'beef_stir_fry',
        name: 'Beef Stir Fry',
        ingredients: ['ground beef', 'bell peppers', 'onions', 'soy sauce'],
        category: 'Protein & Vegetables',
        popularity: 9,
        difficulty: 'Easy',
        cuisineStyle: ['Asian', 'Chinese', 'Thai']
      },
      {
        id: 'salmon_asparagus',
        name: 'Salmon and Asparagus',
        ingredients: ['salmon', 'asparagus', 'lemon', 'garlic'],
        category: 'Protein & Vegetables',
        popularity: 8,
        difficulty: 'Medium',
        cuisineStyle: ['Mediterranean', 'American', 'French']
      },
      
      // Pasta Combinations (High popularity)
      {
        id: 'pasta_tomato_basil',
        name: 'Pasta with Tomato and Basil',
        ingredients: ['pasta', 'tomatoes', 'basil', 'garlic', 'olive oil'],
        category: 'Pasta Dishes',
        popularity: 10,
        difficulty: 'Easy',
        cuisineStyle: ['Italian', 'Mediterranean']
      },
      {
        id: 'pasta_chicken_alfredo',
        name: 'Chicken Alfredo Pasta',
        ingredients: ['pasta', 'chicken breast', 'heavy cream', 'parmesan cheese'],
        category: 'Pasta Dishes',
        popularity: 9,
        difficulty: 'Medium',
        cuisineStyle: ['Italian', 'American-Italian']
      },
      
      // Rice Combinations
      {
        id: 'fried_rice',
        name: 'Fried Rice',
        ingredients: ['rice', 'eggs', 'soy sauce', 'green onions', 'peas'],
        category: 'Rice Dishes',
        popularity: 9,
        difficulty: 'Easy',
        cuisineStyle: ['Chinese', 'Asian', 'Thai']
      },
      {
        id: 'chicken_rice_bowl',
        name: 'Chicken Rice Bowl',
        ingredients: ['chicken thighs', 'rice', 'broccoli', 'carrots'],
        category: 'Rice Dishes',
        popularity: 8,
        difficulty: 'Easy',
        cuisineStyle: ['Asian', 'Japanese', 'Korean']
      },
      
      // Breakfast Combinations
      {
        id: 'scrambled_eggs',
        name: 'Scrambled Eggs',
        ingredients: ['eggs', 'butter', 'milk', 'cheese'],
        category: 'Breakfast',
        popularity: 10,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'International']
      },
      {
        id: 'pancakes',
        name: 'Pancakes',
        ingredients: ['flour', 'eggs', 'milk', 'baking powder', 'sugar'],
        category: 'Breakfast',
        popularity: 8,
        difficulty: 'Medium',
        cuisineStyle: ['American', 'International']
      },
      
      // Soup Combinations
      {
        id: 'chicken_soup',
        name: 'Chicken Soup',
        ingredients: ['chicken breast', 'carrots', 'celery', 'onions', 'chicken broth'],
        category: 'Soups',
        popularity: 9,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'International', 'Comfort']
      },
      {
        id: 'tomato_soup',
        name: 'Tomato Soup',
        ingredients: ['tomatoes', 'onions', 'garlic', 'vegetable broth', 'basil'],
        category: 'Soups',
        popularity: 8,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'Italian', 'Mediterranean']
      },
      
      // Vegetarian Combinations
      {
        id: 'veggie_stir_fry',
        name: 'Vegetable Stir Fry',
        ingredients: ['bell peppers', 'broccoli', 'carrots', 'snap peas', 'soy sauce'],
        category: 'Vegetarian',
        popularity: 7,
        difficulty: 'Easy',
        cuisineStyle: ['Asian', 'Chinese', 'Healthy']
      },
      {
        id: 'caprese_salad',
        name: 'Caprese Salad',
        ingredients: ['tomatoes', 'mozzarella', 'basil', 'balsamic vinegar', 'olive oil'],
        category: 'Vegetarian',
        popularity: 7,
        difficulty: 'Easy',
        cuisineStyle: ['Italian', 'Mediterranean']
      },
      
      // Sandwich Combinations
      {
        id: 'grilled_cheese',
        name: 'Grilled Cheese',
        ingredients: ['bread', 'cheese', 'butter'],
        category: 'Sandwiches',
        popularity: 9,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'Comfort']
      },
      {
        id: 'chicken_sandwich',
        name: 'Chicken Sandwich',
        ingredients: ['chicken breast', 'bread', 'lettuce', 'tomato', 'mayonnaise'],
        category: 'Sandwiches',
        popularity: 8,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'International']
      },
      
      // Potato Combinations
      {
        id: 'roasted_potatoes',
        name: 'Roasted Potatoes',
        ingredients: ['potatoes', 'olive oil', 'rosemary', 'garlic', 'salt'],
        category: 'Side Dishes',
        popularity: 8,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'Mediterranean', 'European']
      },
      {
        id: 'mashed_potatoes',
        name: 'Mashed Potatoes',
        ingredients: ['potatoes', 'butter', 'milk', 'salt', 'pepper'],
        category: 'Side Dishes',
        popularity: 9,
        difficulty: 'Easy',
        cuisineStyle: ['American', 'Comfort', 'International']
      },
      
      // Additional combinations for variety
      {
        id: 'taco_filling',
        name: 'Taco Filling',
        ingredients: ['ground beef', 'onions', 'tomatoes', 'cheese', 'lettuce'],
        category: 'Mexican',
        popularity: 9,
        difficulty: 'Easy',
        cuisineStyle: ['Mexican', 'Tex-Mex', 'American']
      },
      {
        id: 'curry_dish',
        name: 'Curry',
        ingredients: ['chicken thighs', 'coconut milk', 'curry powder', 'onions', 'ginger'],
        category: 'International',
        popularity: 7,
        difficulty: 'Medium',
        cuisineStyle: ['Indian', 'Thai', 'Asian']
      },
      {
        id: 'fish_and_chips',
        name: 'Fish and Chips',
        ingredients: ['white fish', 'potatoes', 'flour', 'oil', 'malt vinegar'],
        category: 'Comfort Food',
        popularity: 6,
        difficulty: 'Medium',
        cuisineStyle: ['British', 'American', 'Pub Food']
      }
    ];
  }
}

// Export for use
export const recipeDatabaseGenerator = new RecipeDatabaseGenerator();

// CLI execution if run directly
if (require.main === module) {
  const targetCount = process.argv[2] ? parseInt(process.argv[2]) : 1000;
  
  // Validate API key before starting
  if (!validateApiKey()) {
    process.exit(1);
  }
  
  console.log(`🚀 Starting recipe database generation for ${targetCount} recipes...`);
  console.log('💰 Estimated cost: $' + (targetCount * 0.005).toFixed(2) + ' - $' + (targetCount * 0.01).toFixed(2));
  
  recipeDatabaseGenerator.generateRecipeDatabase(targetCount)
    .then(() => {
      console.log('✅ Recipe database generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Recipe database generation failed:', error);
      process.exit(1);
    });
} 