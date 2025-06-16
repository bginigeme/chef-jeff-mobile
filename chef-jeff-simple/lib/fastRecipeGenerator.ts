interface FastRecipe {
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
  requiredIngredients: string[]; // Core ingredients needed
  optionalIngredients: string[]; // Nice-to-have ingredients
  matchScore?: number; // Calculated based on available ingredients
}

interface RecipeTemplate {
  id: string;
  name: string;
  baseIngredients: string[]; // Required base (e.g., ['protein', 'vegetable'])
  cookingMethod: 'sauté' | 'bake' | 'grill' | 'boil' | 'steam' | 'fry';
  instructionTemplate: string[];
  timeRange: [number, number]; // [min, max] minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisineStyles: string[];
}

import { IngredientDatabase } from './ingredientDatabase'

class FastRecipeGenerator {
  private preGeneratedRecipes: FastRecipe[] = [];
  private recipeTemplates: RecipeTemplate[] = [];
  
  constructor() {
    this.initializeTemplates();
    this.generateRecipeBank();
  }

  // Ultra-fast recipe matching (5-20ms)
  findRecipes(pantryItems: string[], options?: {
    maxResults?: number;
    minMatchScore?: number;
    maxCookingTime?: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    cuisine?: string;
  }): FastRecipe[] {
    const startTime = performance.now();
    
    const {
      maxResults = 5,
      minMatchScore = 0.3,
      maxCookingTime = 60,
      difficulty,
      cuisine
    } = options || {};

    // Normalize pantry items for matching
    const normalizedPantry = pantryItems.map(item => item.toLowerCase().trim());
    
    // Validate pantry composition - prevent seasoning-only recipe generation
    const pantryAnalysis = this.analyzeIngredients(pantryItems);
    if (pantryAnalysis.substantiveIngredients.length === 0) {
      console.log('⚠️ No main ingredients found in pantry - cannot generate recipes');
      return [];
    }
    
    // Score and filter recipes
    const scoredRecipes = this.preGeneratedRecipes
      .map(recipe => ({
        ...recipe,
        matchScore: this.calculateMatchScore(recipe, normalizedPantry)
      }))
      .filter(recipe => {
        // Apply filters
        if (recipe.matchScore < minMatchScore) return false;
        if (recipe.cookingTime > maxCookingTime) return false;
        if (difficulty && recipe.difficulty !== difficulty) return false;
        if (cuisine && recipe.cuisine !== cuisine) return false;
        return true;
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, maxResults);

    const endTime = performance.now();
    console.log(`⚡ Fast recipe search took ${endTime - startTime}ms`);
    
    return scoredRecipes;
  }

  // Programmatic recipe generation (1-10ms)
  generateProgrammaticRecipe(pantryItems: string[], options?: {
    cookingTime?: number;
    servings?: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
  }): FastRecipe {
    const startTime = performance.now();
    
    const {
      cookingTime = 30,
      servings = 2,
      difficulty = 'Easy'
    } = options || {};

    // Analyze available ingredients
    const analysis = this.analyzeIngredients(pantryItems);
    
    // Validate that we have substantive ingredients for recipe creation
    if (analysis.substantiveIngredients.length === 0) {
      console.log('⚠️ Cannot generate recipe - no main ingredients available');
      // Return a helpful "recipe" that guides users to add main ingredients
      return {
        id: `guidance_${Date.now()}`,
        title: 'Add Main Ingredients Needed',
        description: 'Please add proteins, vegetables, or grains to your pantry to generate recipes. Seasonings alone cannot make a complete meal.',
        ingredients: analysis.enhancers.map(enhancer => ({
          name: enhancer,
          amount: 'available',
          unit: ''
        })),
        instructions: [
          'Add main ingredients like chicken, vegetables, rice, or pasta to your pantry',
          'Main ingredients form the foundation of any great recipe',
          'Your available seasonings will enhance these main ingredients perfectly',
          'Try adding at least 2-3 different types of main ingredients for the best recipes'
        ],
        cookingTime,
        servings,
        difficulty: 'Easy',
        cuisine: 'Educational',
        tags: ['guidance', 'pantry-help'],
        requiredIngredients: ['main ingredients needed'],
        optionalIngredients: analysis.enhancers
      };
    }
    
    // Generate a unique, creative recipe
    const recipe = this.generateCreativeRecipe(analysis, {
      cookingTime,
      servings,
      difficulty
    });

    const endTime = performance.now();
    console.log(`⚡ Creative generation took ${endTime - startTime}ms`);
    
    return recipe;
  }

  private calculateMatchScore(recipe: FastRecipe, pantryItems: string[]): number {
    const required = recipe.requiredIngredients.length;
    const optional = recipe.optionalIngredients.length;
    
    let requiredMatches = 0;
    let optionalMatches = 0;
    let substantiveMatches = 0;
    let enhancerMatches = 0;
    
    // Analyze pantry composition
    const pantryAnalysis = this.analyzeIngredients(pantryItems);
    const totalSubstantive = pantryAnalysis.substantiveIngredients.length;
    const totalEnhancers = pantryAnalysis.enhancers.length;
    
    // Check required ingredients with substantive ingredient priority
    for (const ingredient of recipe.requiredIngredients) {
      const isMatched = pantryItems.some(pantryItem => 
        pantryItem.toLowerCase().includes(ingredient.toLowerCase()) || 
        ingredient.toLowerCase().includes(pantryItem.toLowerCase())
      );
      
      if (isMatched) {
        requiredMatches++;
        
        // Bonus scoring for substantive ingredients
        const ingredientInfo = IngredientDatabase.findIngredient(ingredient);
        if (ingredientInfo && ingredientInfo.isSubstantive) {
          substantiveMatches++;
        } else {
          enhancerMatches++;
        }
      }
    }
    
    // Check optional ingredients
    for (const ingredient of recipe.optionalIngredients) {
      if (pantryItems.some(pantryItem => 
        pantryItem.toLowerCase().includes(ingredient.toLowerCase()) || 
        ingredient.toLowerCase().includes(pantryItem.toLowerCase())
      )) {
        optionalMatches++;
      }
    }
    
    // Calculate intelligent weighted score
    const requiredScore = required > 0 ? (requiredMatches / required) * 0.7 : 0;
    const optionalScore = optional > 0 ? (optionalMatches / optional) * 0.1 : 0;
    
    // Bonus for having substantive ingredients (this prevents "seasoning-only" recipes)
    const substantiveBonus = totalSubstantive >= 2 ? 0.2 : totalSubstantive >= 1 ? 0.1 : 0;
    
    // Penalty for recipes that match mostly on seasonings/enhancers
    const enhancerPenalty = (enhancerMatches > substantiveMatches && substantiveMatches === 0) ? -0.3 : 0;
    
    return Math.max(0, requiredScore + optionalScore + substantiveBonus + enhancerPenalty);
  }

  private analyzeIngredients(pantryItems: string[]) {
    // Use our intelligent ingredient database for better categorization
    const analysis = {
      proteins: [] as string[],
      vegetables: [] as string[],
      grains: [] as string[],
      dairy: [] as string[],
      seasonings: [] as string[],
      other: [] as string[],
      substantiveIngredients: [] as string[],
      enhancers: [] as string[]
    };

    pantryItems.forEach(item => {
      const ingredient = IngredientDatabase.findIngredient(item);
      
      if (ingredient) {
        // Categorize using our database
        switch (ingredient.category) {
          case 'protein':
            analysis.proteins.push(ingredient.name);
            analysis.substantiveIngredients.push(ingredient.name);
            break;
          case 'vegetable':
            analysis.vegetables.push(ingredient.name);
            analysis.substantiveIngredients.push(ingredient.name);
            break;
          case 'grain':
            analysis.grains.push(ingredient.name);
            analysis.substantiveIngredients.push(ingredient.name);
            break;
          case 'dairy':
            analysis.dairy.push(ingredient.name);
            analysis.substantiveIngredients.push(ingredient.name);
            break;
          case 'seasoning':
          case 'herb':
          case 'condiment':
            analysis.seasonings.push(ingredient.name);
            analysis.enhancers.push(ingredient.name);
            break;
          default:
            analysis.other.push(ingredient.name);
            // Treat unknown as substantive by default
            analysis.substantiveIngredients.push(ingredient.name);
        }
      } else {
        // Unknown ingredient - treat as substantive by default
        analysis.other.push(item);
        analysis.substantiveIngredients.push(item);
      }
    });

    return analysis;
  }

  private selectTemplate(analysis: any, difficulty: string): RecipeTemplate {
    // Smart template selection based on available ingredients
    const availableCategories: string[] = [];
    if (analysis.proteins.length > 0) availableCategories.push('protein');
    if (analysis.vegetables.length > 0) availableCategories.push('vegetables');
    if (analysis.grains.length > 0) availableCategories.push('grains');
    if (analysis.dairy.length > 0) availableCategories.push('dairy');
    
    // Find best matching template
    const suitableTemplates = this.recipeTemplates.filter(template => 
      template.difficulty === difficulty &&
      template.baseIngredients.every(required => availableCategories.includes(required))
    );
    
    // Return random suitable template or fallback
    return suitableTemplates.length > 0 
      ? suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)]
      : this.recipeTemplates[0]; // Fallback template
  }

  private buildRecipeFromTemplate(template: RecipeTemplate, analysis: any, options: any): FastRecipe {
    const { cookingTime, servings, difficulty } = options;
    
    // Select specific ingredients from analysis
    const selectedProtein = analysis.proteins[0] || 'protein substitute';
    const selectedVegetables = analysis.vegetables.slice(0, 2);
    const selectedGrain = analysis.grains[0] || 'rice';
    
    // Build ingredient list
    const ingredients = [
      { name: selectedProtein, amount: servings.toString(), unit: 'portion' },
      ...selectedVegetables.map((veg: string) => ({ name: veg, amount: '1', unit: 'cup' })),
      { name: selectedGrain, amount: (servings * 0.5).toString(), unit: 'cup' },
      { name: 'olive oil', amount: '2', unit: 'tbsp' },
      { name: 'salt', amount: 'to taste', unit: '' },
      { name: 'pepper', amount: 'to taste', unit: '' }
    ];
    
    // Generate instructions from template
    const instructions = template.instructionTemplate.map(step => 
      step
        .replace('{protein}', selectedProtein)
        .replace('{vegetables}', selectedVegetables.join(' and '))
        .replace('{grain}', selectedGrain)
        .replace('{cookingTime}', Math.floor(cookingTime * 0.6).toString())
    );
    
    // Generate creative title
    const cuisinePrefix = template.cuisineStyles[0] || 'Classic';
    const title = `${cuisinePrefix} ${selectedProtein} with ${selectedVegetables[0] || 'vegetables'}`;
    
    return {
      id: `programmatic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: `A delicious ${difficulty.toLowerCase()} ${template.cookingMethod} recipe using your available ingredients.`,
      ingredients,
      instructions,
      cookingTime,
      servings,
      difficulty,
      cuisine: template.cuisineStyles[0] || 'International',
      tags: ['quick', 'programmatic', template.cookingMethod],
      requiredIngredients: [selectedProtein, ...selectedVegetables],
      optionalIngredients: [selectedGrain, 'herbs', 'spices']
    };
  }

  private initializeTemplates() {
    this.recipeTemplates = [
      {
        id: 'stir_fry',
        name: 'Stir Fry',
        baseIngredients: ['protein', 'vegetables'],
        cookingMethod: 'sauté',
        instructionTemplate: [
          'Heat olive oil in a large pan or wok over medium-high heat',
          'Add {protein} and cook until golden brown, about {cookingTime} minutes',
          'Add {vegetables} and stir-fry for 3-5 minutes until tender-crisp',
          'Season with salt, pepper, and any available spices',
          'Serve hot over {grain} or enjoy on its own'
        ],
        timeRange: [15, 25],
        difficulty: 'Easy',
        cuisineStyles: ['Asian-inspired', 'International']
      },
      {
        id: 'pasta_dish',
        name: 'Pasta Dish',
        baseIngredients: ['grains', 'vegetables'],
        cookingMethod: 'boil',
        instructionTemplate: [
          'Bring a large pot of salted water to boil',
          'Cook {grain} according to package directions',
          'Meanwhile, heat olive oil in a large pan',
          'Sauté {vegetables} until tender, about 5-7 minutes',
          'Drain pasta and toss with vegetables',
          'Add {protein} if available and season to taste'
        ],
        timeRange: [20, 30],
        difficulty: 'Easy',
        cuisineStyles: ['Italian-inspired', 'Mediterranean']
      },
      {
        id: 'baked_dish',
        name: 'Baked Dish',
        baseIngredients: ['protein'],
        cookingMethod: 'bake',
        instructionTemplate: [
          'Preheat oven to 375°F (190°C)',
          'Season {protein} with salt, pepper, and available herbs',
          'Place in baking dish with {vegetables} around it',
          'Drizzle with olive oil',
          'Bake for {cookingTime} minutes until cooked through',
          'Serve with {grain} or bread'
        ],
        timeRange: [25, 45],
        difficulty: 'Medium',
        cuisineStyles: ['Classic', 'Home-style']
      }
    ];
  }

  private generateRecipeBank() {
    // For now, use programmatic generation as the main approach
    // In the future, we can pre-load recipes into the app bundle
    console.log('⚡ Using programmatic recipe generation (ultra-fast!)');
    
    // Create a few example recipes for fallback matching
    this.preGeneratedRecipes = [
      {
        id: 'quick_chicken_stir_fry',
        title: 'Quick Chicken Stir Fry',
        description: 'A fast and delicious stir fry perfect for busy weeknights',
        ingredients: [
          { name: 'chicken breast', amount: '1', unit: 'lb' },
          { name: 'mixed vegetables', amount: '2', unit: 'cups' },
          { name: 'soy sauce', amount: '2', unit: 'tbsp' },
          { name: 'olive oil', amount: '2', unit: 'tbsp' }
        ],
        instructions: [
          'Heat oil in large pan over high heat',
          'Add chicken and cook 5-6 minutes until golden',
          'Add vegetables and stir-fry 3-4 minutes',
          'Add soy sauce and toss to combine',
          'Serve immediately over rice'
        ],
        cookingTime: 15,
        servings: 2,
        difficulty: 'Easy',
        cuisine: 'Asian',
        tags: ['quick', 'healthy', 'protein'],
        requiredIngredients: ['chicken', 'vegetables'],
        optionalIngredients: ['soy sauce', 'rice', 'garlic']
      },
      {
        id: 'pasta_marinara',
        title: 'Simple Pasta Marinara',
        description: 'Classic Italian comfort food with a homemade touch',
        ingredients: [
          { name: 'pasta', amount: '8', unit: 'oz' },
          { name: 'tomatoes', amount: '2', unit: 'cups' },
          { name: 'garlic', amount: '3', unit: 'cloves' },
          { name: 'olive oil', amount: '2', unit: 'tbsp' }
        ],
        instructions: [
          'Cook pasta according to package directions',
          'Heat olive oil and sauté minced garlic',
          'Add tomatoes and simmer 10 minutes',
          'Toss with drained pasta',
          'Season with salt and pepper'
        ],
        cookingTime: 20,
        servings: 3,
        difficulty: 'Easy',
        cuisine: 'Italian',
        tags: ['pasta', 'vegetarian', 'classic'],
        requiredIngredients: ['pasta', 'tomatoes'],
        optionalIngredients: ['garlic', 'herbs', 'cheese']
      },
      {
        id: 'scrambled_eggs',
        title: 'Perfect Scrambled Eggs',
        description: 'Creamy, fluffy eggs for the perfect breakfast',
        ingredients: [
          { name: 'eggs', amount: '4', unit: 'large' },
          { name: 'butter', amount: '2', unit: 'tbsp' },
          { name: 'milk', amount: '2', unit: 'tbsp' }
        ],
        instructions: [
          'Crack eggs into bowl and whisk with milk',
          'Heat butter in non-stick pan over low heat',
          'Add eggs and stir gently as they cook',
          'Remove from heat while slightly underdone',
          'Season with salt and pepper'
        ],
        cookingTime: 5,
        servings: 2,
        difficulty: 'Easy',
        cuisine: 'American',
        tags: ['breakfast', 'protein', 'quick'],
        requiredIngredients: ['eggs'],
        optionalIngredients: ['butter', 'milk', 'cheese']
      }
    ];
    
    console.log(`✅ Fast recipe system ready with ${this.preGeneratedRecipes.length} example recipes + programmatic generation`);
  }

  private generateCreativeRecipe(analysis: any, options: any): FastRecipe {
    const { cookingTime, servings, difficulty } = options;
    
    // Creative recipe generation with lots of variety
    const recipeStyles = this.getCreativeRecipeStyles();
    const selectedStyle = recipeStyles[Math.floor(Math.random() * recipeStyles.length)];
    
    // Build ingredients creatively
    const ingredients = this.buildCreativeIngredients(analysis, servings, selectedStyle);
    
    // Generate creative instructions
    const instructions = this.generateCreativeInstructions(analysis, selectedStyle, cookingTime);
    
    // Create unique title with personality
    const title = this.generateCreativeTitle(analysis, selectedStyle);
    
    // Add Chef Jeff's personality to description
    const description = this.generateEngagingDescription(selectedStyle, analysis);
    
    return {
      id: `creative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      ingredients,
      instructions,
      cookingTime,
      servings,
      difficulty,
      cuisine: selectedStyle.cuisine,
      tags: [...selectedStyle.tags, 'chef-jeff-special', 'pantry-magic'],
      requiredIngredients: this.extractMainIngredients(analysis),
      optionalIngredients: ['herbs', 'spices', 'love']
    };
  }

  private getCreativeRecipeStyles() {
    return [
      {
        name: 'Fusion Magic',
        cuisine: 'Fusion',
        cookingStyle: 'creative-fusion',
        tags: ['innovative', 'fusion', 'creative'],
        flavor: 'bold and unexpected',
        technique: 'fusion techniques'
      },
      {
        name: 'Comfort Elevated',
        cuisine: 'American',
        cookingStyle: 'elevated-comfort',
        tags: ['comfort', 'elevated', 'cozy'],
        flavor: 'familiar yet special',
        technique: 'comfort food mastery'
      },
      {
        name: 'Mediterranean Fresh',
        cuisine: 'Mediterranean',
        cookingStyle: 'fresh-mediterranean',
        tags: ['fresh', 'healthy', 'bright'],
        flavor: 'bright and herbaceous',
        technique: 'Mediterranean simplicity'
      },
      {
        name: 'Asian Inspired',
        cuisine: 'Asian',
        cookingStyle: 'asian-fusion',
        tags: ['umami', 'balanced', 'aromatic'],
        flavor: 'umami-rich and balanced',
        technique: 'Asian cooking principles'
      },
      {
        name: 'Rustic Italian',
        cuisine: 'Italian',
        cookingStyle: 'rustic-italian',
        tags: ['rustic', 'authentic', 'soul-warming'],
        flavor: 'rustic and soul-warming',
        technique: 'traditional Italian methods'
      },
      {
        name: 'Modern Bistro',
        cuisine: 'French',
        cookingStyle: 'modern-bistro',
        tags: ['sophisticated', 'bistro', 'refined'],
        flavor: 'refined yet approachable',
        technique: 'French bistro techniques'
      },
      {
        name: 'Spicy Adventure',
        cuisine: 'Mexican',
        cookingStyle: 'spicy-mexican',
        tags: ['spicy', 'vibrant', 'bold'],
        flavor: 'bold and vibrant',
        technique: 'Mexican spice mastery'
      },
      {
        name: 'Garden Fresh',
        cuisine: 'Vegetarian',
        cookingStyle: 'garden-fresh',
        tags: ['fresh', 'vegetarian', 'garden'],
        flavor: 'garden-fresh and pure',
        technique: 'vegetable-forward cooking'
      }
    ];
  }

  private buildCreativeIngredients(analysis: any, servings: number, style: any): Array<{name: string, amount: string, unit?: string}> {
    const ingredients: Array<{name: string, amount: string, unit?: string}> = [];
    
    // Add main protein creatively
    if (analysis.proteins.length > 0) {
      const protein = analysis.proteins[0];
      const amount = this.getCreativeAmount(protein, servings);
      ingredients.push({ name: protein, amount: amount.amount, unit: amount.unit });
    }
    
    // Add vegetables with flair
    analysis.vegetables.slice(0, 2).forEach((veg: string) => {
      const amount = this.getCreativeAmount(veg, servings);
      ingredients.push({ name: veg, amount: amount.amount, unit: amount.unit });
    });
    
    // Add grains/bases
    if (analysis.grains.length > 0) {
      const grain = analysis.grains[0];
      const amount = this.getCreativeAmount(grain, servings);
      ingredients.push({ name: grain, amount: amount.amount, unit: amount.unit });
    }
    
    // Add creative flavor enhancers based on style
    const flavorEnhancers = this.getStyleSpecificEnhancers(style);
    flavorEnhancers.forEach(enhancer => {
      ingredients.push(enhancer);
    });
    
    // Always add cooking essentials
    ingredients.push({ name: 'olive oil', amount: '2', unit: 'tbsp' });
    ingredients.push({ name: 'salt', amount: 'to taste' });
    ingredients.push({ name: 'black pepper', amount: 'to taste' });
    
    return ingredients;
  }

  private getCreativeAmount(ingredient: string, servings: number): {amount: string, unit?: string} {
    const ingredient_lower = ingredient.toLowerCase();
    
    // Protein amounts
    if (['chicken', 'beef', 'pork', 'fish', 'salmon'].some(p => ingredient_lower.includes(p))) {
      return { amount: (servings * 0.25).toString(), unit: 'lb' };
    }
    
    // Vegetable amounts with variety
    if (['onion', 'bell pepper', 'carrot'].some(v => ingredient_lower.includes(v))) {
      return { amount: Math.max(1, Math.floor(servings/2)).toString(), unit: 'large' };
    }
    
    if (['broccoli', 'spinach', 'mushroom'].some(v => ingredient_lower.includes(v))) {
      return { amount: servings.toString(), unit: 'cups' };
    }
    
    // Grain amounts
    if (['rice', 'pasta', 'quinoa'].some(g => ingredient_lower.includes(g))) {
      return { amount: (servings * 0.5).toString(), unit: 'cups' };
    }
    
    // Default fallback
    return { amount: servings.toString(), unit: 'portions' };
  }

  private getStyleSpecificEnhancers(style: any): Array<{name: string, amount: string, unit?: string}> {
    const enhancers: Array<{name: string, amount: string, unit?: string}> = [];
    
    switch (style.cookingStyle) {
      case 'creative-fusion':
        enhancers.push({ name: 'ginger', amount: '1', unit: 'tsp' });
        enhancers.push({ name: 'soy sauce', amount: '1', unit: 'tbsp' });
        break;
      case 'elevated-comfort':
        enhancers.push({ name: 'butter', amount: '2', unit: 'tbsp' });
        enhancers.push({ name: 'thyme', amount: '1', unit: 'tsp' });
        break;
      case 'fresh-mediterranean':
        enhancers.push({ name: 'lemon juice', amount: '2', unit: 'tbsp' });
        enhancers.push({ name: 'oregano', amount: '1', unit: 'tsp' });
        break;
      case 'asian-fusion':
        enhancers.push({ name: 'garlic', amount: '2', unit: 'cloves' });
        enhancers.push({ name: 'sesame oil', amount: '1', unit: 'tsp' });
        break;
      case 'rustic-italian':
        enhancers.push({ name: 'garlic', amount: '3', unit: 'cloves' });
        enhancers.push({ name: 'basil', amount: '1', unit: 'tbsp' });
        break;
      default:
        enhancers.push({ name: 'garlic powder', amount: '1', unit: 'tsp' });
    }
    
    return enhancers;
  }

  private generateCreativeInstructions(analysis: any, style: any, cookingTime: number): string[] {
    const instructions: string[] = [];
    const mainProtein = analysis.proteins[0] || 'your main ingredient';
    const vegetables = analysis.vegetables.slice(0, 2);
    const cookTime = Math.floor(cookingTime * 0.6);
    
    // Opening with Chef Jeff's personality
    instructions.push(`Chef Jeff here! Let's create some ${style.flavor} magic with your pantry treasures!`);
    
    // Prep phase
    instructions.push(`Prep all ingredients with love - dice vegetables, season ${mainProtein} generously`);
    
    // Cooking techniques based on style
    switch (style.cookingStyle) {
      case 'creative-fusion':
        instructions.push(`Heat oil in your largest pan until shimmering - we're going bold!`);
        instructions.push(`Sear ${mainProtein} until golden perfection, about ${cookTime} minutes`);
        instructions.push(`Add ${vegetables.join(' and ')} - let them dance together for 3-4 minutes`);
        instructions.push(`Drizzle in soy sauce and ginger - watch the magic happen!`);
        break;
        
      case 'elevated-comfort':
        instructions.push(`Warm butter in pan over medium heat until it smells nutty and divine`);
        instructions.push(`Gently cook ${mainProtein} until beautifully browned, ${cookTime} minutes`);
        instructions.push(`Nestle in ${vegetables.join(' and ')}, cooking until tender with love`);
        instructions.push(`Finish with fresh thyme - comfort food elevated!`);
        break;
        
      case 'fresh-mediterranean':
        instructions.push(`Heat olive oil gently - let's keep this bright and fresh!`);
        instructions.push(`Cook ${mainProtein} just until perfect, about ${cookTime} minutes`);
        instructions.push(`Toss in ${vegetables.join(' and ')} for a quick, vibrant sauté`);
        instructions.push(`Finish with a squeeze of lemon and oregano - pure Mediterranean sunshine!`);
        break;
        
      default:
        instructions.push(`Heat oil in a large pan with confidence - you've got this!`);
        instructions.push(`Cook ${mainProtein} until golden and gorgeous, ${cookTime} minutes`);
        instructions.push(`Add ${vegetables.join(' and ')} and cook until perfectly tender`);
        instructions.push(`Season generously and serve with pride!`);
    }
    
    // Chef Jeff's encouraging finish
    instructions.push(`🌟 Taste and adjust seasoning - trust your palate, it knows best!`);
    instructions.push(`Serve immediately and enjoy your ${style.name.toLowerCase()} masterpiece! ✨`);
    
    return instructions;
  }

  private generateCreativeTitle(analysis: any, style: any): string {
    const mainProtein = analysis.proteins[0] || 'Pantry';
    const mainVeggie = analysis.vegetables[0] || 'Garden';
    
    const titleTemplates = [
      `${style.name} ${mainProtein} Delight`,
      `Chef Jeff's ${mainProtein} & ${mainVeggie} ${style.name}`,
      `${style.cuisine} ${mainProtein} Magic`,
      `${mainProtein} ${mainVeggie} ${style.name}`,
      `Pantry ${style.name}: ${mainProtein} Edition`,
      `${style.name} ${mainProtein} Adventure`,
      `${mainProtein} & ${mainVeggie} ${style.cuisine} Style`
    ];
    
    return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  }

  private generateEngagingDescription(style: any, analysis: any): string {
    const descriptors = [
      `A ${style.flavor} creation that transforms your pantry ingredients into pure magic!`,
      `Chef Jeff's special touch makes this ${style.flavor} dish absolutely irresistible.`,
      `Using ${style.technique}, we're turning simple ingredients into something extraordinary!`,
      `This ${style.flavor} masterpiece proves that the best meals come from the heart (and your pantry)!`,
      `Get ready for ${style.flavor} flavors that'll make your taste buds dance with joy!`
    ];
    
    return descriptors[Math.floor(Math.random() * descriptors.length)];
  }

  private extractMainIngredients(analysis: any): string[] {
    return [
      ...analysis.proteins.slice(0, 1),
      ...analysis.vegetables.slice(0, 2),
      ...analysis.grains.slice(0, 1)
    ].filter(Boolean);
  }
}

export const fastRecipeGenerator = new FastRecipeGenerator(); 