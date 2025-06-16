import * as fs from 'fs';
import * as path from 'path';

interface MockRecipe {
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
  cuisine?: string;
  tags: string[];
}

interface RecipeDatabase {
  version: string;
  generatedAt: string;
  totalRecipes: number;
  recipes: MockRecipe[];
  ingredientCombinations: any[];
}

class TestRecipeDatabaseGenerator {
  private outputPath = path.join(__dirname, '../data/testRecipeDatabase.json');

  async generateTestDatabase(targetCount: number = 50): Promise<void> {
    console.log(`🧪 Generating ${targetCount} test recipes (no OpenAI required)...`);
    
    const startTime = Date.now();
    const recipes: MockRecipe[] = [];
    
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(this.outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate mock recipes
    for (let i = 1; i <= targetCount; i++) {
      const recipe = this.generateMockRecipe(i);
      recipes.push(recipe);
      
      if (i % 10 === 0) {
        console.log(`✅ Generated ${i}/${targetCount} test recipes...`);
      }
    }

    // Save to database
    const database: RecipeDatabase = {
      version: '1.0.0-test',
      generatedAt: new Date().toISOString(),
      totalRecipes: recipes.length,
      recipes,
      ingredientCombinations: []
    };

    fs.writeFileSync(this.outputPath, JSON.stringify(database, null, 2));
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 Test recipe database generated!');
    console.log(`📊 Generated: ${recipes.length} recipes`);
    console.log(`⏱️ Time: ${duration}s`);
    console.log(`💾 Saved to: ${this.outputPath}`);
  }

  private generateMockRecipe(index: number): MockRecipe {
    const proteins = ['chicken', 'beef', 'fish', 'tofu', 'eggs'];
    const vegetables = ['broccoli', 'carrots', 'onions', 'peppers', 'mushrooms'];
    const grains = ['rice', 'pasta', 'quinoa', 'bread'];
    const cuisines = ['Italian', 'Asian', 'Mexican', 'American', 'Mediterranean'];
    const difficulties: Array<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];
    
    const protein = proteins[index % proteins.length];
    const vegetable = vegetables[index % vegetables.length];
    const grain = grains[index % grains.length];
    const cuisine = cuisines[index % cuisines.length];
    const difficulty = difficulties[index % difficulties.length];
    
    return {
      id: `test_recipe_${index}`,
      title: `${cuisine} ${protein} with ${vegetable}`,
      description: `A delicious ${difficulty.toLowerCase()} recipe featuring ${protein} and ${vegetable}.`,
      ingredients: [
        { name: protein, amount: '1', unit: 'lb' },
        { name: vegetable, amount: '2', unit: 'cups' },
        { name: grain, amount: '1', unit: 'cup' },
        { name: 'olive oil', amount: '2', unit: 'tbsp' },
        { name: 'salt', amount: 'to taste' },
        { name: 'pepper', amount: 'to taste' }
      ],
      instructions: [
        `Prepare ${protein} by seasoning with salt and pepper`,
        `Heat olive oil in a large pan over medium heat`,
        `Cook ${protein} until golden brown, about 5-7 minutes`,
        `Add ${vegetable} and cook until tender, 3-5 minutes`,
        `Serve over cooked ${grain}`,
        'Enjoy your delicious meal!'
      ],
      cookingTime: 20 + (index % 25), // 20-45 minutes
      servings: 2 + (index % 4), // 2-6 servings
      difficulty,
      cuisine,
      tags: ['test-recipe', difficulty.toLowerCase(), cuisine.toLowerCase()]
    };
  }
}

// Export for use
export const testRecipeDatabaseGenerator = new TestRecipeDatabaseGenerator();

// CLI execution if run directly
if (require.main === module) {
  const targetCount = process.argv[2] ? parseInt(process.argv[2]) : 50;
  
  testRecipeDatabaseGenerator.generateTestDatabase(targetCount)
    .then(() => {
      console.log('✅ Test database generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test database generation failed:', error);
      process.exit(1);
    });
} 