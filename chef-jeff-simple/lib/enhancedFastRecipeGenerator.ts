import { fastRecipeGenerator } from './fastRecipeGenerator';
import { spoonacularService, ConvertedSpoonacularRecipe } from './spoonacularService';
import { localRecipeDatabase } from './localRecipeDatabase';

interface EnhancedRecipeOptions {
  maxResults?: number;
  maxCookingTime?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
  includeSpoonacular?: boolean;
  includeAI?: boolean;
  spoonacularOnly?: boolean;
  diet?: string;
  intolerances?: string;
  excludeRecipeIds?: string[]; // IDs of recipes to exclude from results
}

interface RecipeSource {
  source: 'fast-generator' | 'spoonacular';
  recipe: any;
  matchScore?: number;
}

class EnhancedFastRecipeGenerator {
  
  // Get recipes from both your fast generator AND Spoonacular
  async findBestRecipes(
    pantryItems: string[], 
    options: EnhancedRecipeOptions = {}
  ): Promise<RecipeSource[]> {
    const {
      maxResults = 8,
      maxCookingTime = 60,
      difficulty,
      cuisine,
      includeSpoonacular = true,
      includeAI = true,
      spoonacularOnly = false,
      diet,
      intolerances
    } = options;

    console.log('🚀 Enhanced recipe search starting...');
    const startTime = performance.now();
    
    const results: RecipeSource[] = [];

    try {
      // Run both searches in parallel for maximum speed
      const promises: Promise<void>[] = [];

      // Fast AI-generated recipes (your existing system)
      if (includeAI && !spoonacularOnly) {
        promises.push(
          (async () => {
            try {
              console.log('🧠 Searching fast AI recipes...');
              const fastRecipes = fastRecipeGenerator.findRecipes(pantryItems, {
                maxResults: Math.ceil(maxResults / 2),
                minMatchScore: 0.3,
                maxCookingTime,
                difficulty,
                cuisine
              });

              results.push(...fastRecipes.map(recipe => ({
                source: 'fast-generator' as const,
                recipe,
                matchScore: recipe.matchScore
              })));

              console.log(`✅ Found ${fastRecipes.length} fast AI recipes`);
            } catch (error) {
              console.log('ℹ️ Fast AI recipes temporarily unavailable');
            }
          })()
        );
      }

      // Spoonacular professional recipes
      if (includeSpoonacular && spoonacularService.isConfigured()) {
        promises.push(
          (async () => {
            try {
              console.log('🥄 Searching Spoonacular recipes...');
              const spoonRecipes = await spoonacularService.findRecipesByIngredients(
                pantryItems,
                {
                  number: Math.ceil(maxResults / 2),
                  maxReadyTime: maxCookingTime,
                  diet,
                  intolerances
                }
              );

              results.push(...spoonRecipes.map(recipe => ({
                source: 'spoonacular' as const,
                recipe,
                matchScore: this.calculateSpoonacularMatchScore(recipe, pantryItems)
              })));

              console.log(`✅ Found ${spoonRecipes.length} Spoonacular recipes`);
            } catch (error) {
              console.log('ℹ️ Professional recipes temporarily unavailable (using local recipes)');
              // Don't fail the whole request if Spoonacular fails
            }
          })()
        );
      }

      // Wait for all searches to complete
      await Promise.all(promises);

      // Sort by match score and limit results
      const sortedResults = results
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, maxResults);

      const endTime = performance.now();
      console.log(`⚡ Enhanced search completed in ${Math.round(endTime - startTime)}ms`);
      console.log(`📊 Results: ${sortedResults.length} total (${sortedResults.filter(r => r.source === 'fast-generator').length} AI + ${sortedResults.filter(r => r.source === 'spoonacular').length} Spoonacular)`);

      return sortedResults;

    } catch (error) {
      console.log('ℹ️ Enhanced recipe search temporarily unavailable');
      // Fallback to just fast recipes if everything fails
      try {
        const fastRecipes = fastRecipeGenerator.findRecipes(pantryItems, {
          maxResults,
          maxCookingTime,
          difficulty,
          cuisine
        });
        return fastRecipes.map(recipe => ({
          source: 'fast-generator' as const,
          recipe,
          matchScore: recipe.matchScore
        }));
      } catch (fallbackError) {
        console.log('ℹ️ All recipe services temporarily unavailable');
        return [];
      }
    }
  }

  // Get instant recipes from local database + fast AI
  async getInstantRecipes(
    pantryItems: string[],
    options: EnhancedRecipeOptions = {}
  ): Promise<RecipeSource[]> {
    console.log('⚡ Getting instant recipes from local database...');
    const startTime = performance.now();
    
    const {
      maxResults = 5,
      maxCookingTime = 60,
      difficulty,
      cuisine,
      includeSpoonacular = true,
      includeAI = true,
      excludeRecipeIds = []
    } = options;

    const results: RecipeSource[] = [];

    try {
      // 1. Get professional recipes from local database (instant!)
      if (includeSpoonacular) {
        // Request more recipes if we're excluding some
        const requestCount = Math.max(
          Math.ceil(maxResults / 2), 
          excludeRecipeIds.length + 2
        );
        
        const localRecipes = await localRecipeDatabase.searchByIngredients(
          pantryItems,
          requestCount
        );

        // Filter by criteria AND exclude recently shown recipes
        const filteredLocalRecipes = localRecipes.filter(recipe => {
          if (excludeRecipeIds.includes(recipe.id)) {
            console.log(`🚫 Excluding recently shown recipe: ${recipe.title} (${recipe.id})`);
            return false;
          }
          if (maxCookingTime && recipe.cookingTime > maxCookingTime) return false;
          if (difficulty && recipe.difficulty !== difficulty) return false;
          if (cuisine && !recipe.cuisine.toLowerCase().includes(cuisine.toLowerCase())) return false;
          return true;
        });

        // If all recipes are excluded, clear the exclusion list and try again
        if (filteredLocalRecipes.length === 0 && excludeRecipeIds.length > 0) {
          console.log('🔄 All recipes were excluded, clearing exclusion list for variety');
          const allLocalRecipes = await localRecipeDatabase.searchByIngredients(
            pantryItems,
            Math.ceil(maxResults / 2)
          );
          
          const fallbackRecipes = allLocalRecipes.filter(recipe => {
            if (maxCookingTime && recipe.cookingTime > maxCookingTime) return false;
            if (difficulty && recipe.difficulty !== difficulty) return false;
            if (cuisine && !recipe.cuisine.toLowerCase().includes(cuisine.toLowerCase())) return false;
            return true;
          });
          
          results.push(...fallbackRecipes.map(recipe => ({
            source: 'spoonacular' as const,
            recipe,
            matchScore: this.calculateSpoonacularMatchScore(recipe, pantryItems)
          })));
          
          console.log(`📚 Found ${fallbackRecipes.length} professional recipes (fallback - cleared exclusions)`);
        } else {
          results.push(...filteredLocalRecipes.map(recipe => ({
            source: 'spoonacular' as const,
            recipe,
            matchScore: this.calculateSpoonacularMatchScore(recipe, pantryItems)
          })));

          console.log(`📚 Found ${filteredLocalRecipes.length} professional recipes from local database`);
        }
      }

      // 2. Fill remaining slots with fast AI recipes
      if (includeAI && results.length < maxResults) {
        const remainingSlots = maxResults - results.length;
        const fastRecipes = fastRecipeGenerator.findRecipes(pantryItems, {
          maxResults: remainingSlots,
          maxCookingTime,
          difficulty,
          cuisine
        });

        results.push(...fastRecipes.map(recipe => ({
          source: 'fast-generator' as const,
          recipe,
          matchScore: recipe.matchScore
        })));

        console.log(`🧠 Added ${fastRecipes.length} fast AI recipes`);
      }

      // Sort by match score and limit results
      const sortedResults = results
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, maxResults);

      // Add randomization to ensure variety - shuffle recipes with similar scores
      const finalResults = this.shuffleWithinScoreGroups(sortedResults);

      const endTime = performance.now();
      const professionalCount = finalResults.filter(r => r.source === 'spoonacular').length;
      const aiCount = finalResults.filter(r => r.source === 'fast-generator').length;
      
      console.log(`⚡ Instant recipes completed in ${Math.round(endTime - startTime)}ms`);
      console.log(`📊 Results: ${professionalCount} professional + ${aiCount} AI = ${finalResults.length} total`);

      return finalResults;

    } catch (error) {
      console.log('ℹ️ Instant recipes temporarily unavailable - using fast AI fallback');
      
      // Fallback to just fast AI recipes
      const fastRecipes = fastRecipeGenerator.findRecipes(pantryItems, {
        maxResults,
        maxCookingTime,
        difficulty,
        cuisine
      });
      
      return fastRecipes.map(recipe => ({
        source: 'fast-generator' as const,
        recipe,
        matchScore: recipe.matchScore
      }));
    }
  }

  // Generate creative recipe (programmatic + Spoonacular inspiration)
  async generateCreativeRecipe(
    pantryItems: string[],
    options: {
      cookingTime?: number;
      servings?: number;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
      inspireFromSpoonacular?: boolean;
    } = {}
  ): Promise<RecipeSource> {
    console.log('🎨 Generating creative recipe...');

    // Generate base creative recipe
    const creativeRecipe = fastRecipeGenerator.generateProgrammaticRecipe(pantryItems, {
      cookingTime: options.cookingTime || 30,
      servings: options.servings || 2,
      difficulty: options.difficulty || 'Easy'
    });

    // Optionally enhance with Spoonacular inspiration
    if (options.inspireFromSpoonacular && spoonacularService.isConfigured()) {
      try {
        // Get 1-2 Spoonacular recipes for inspiration
        const inspirationRecipes = await spoonacularService.findRecipesByIngredients(
          pantryItems.slice(0, 3), // Use fewer ingredients for broader inspiration
          { number: 2, maxReadyTime: options.cookingTime || 30 }
        );

        if (inspirationRecipes.length > 0) {
          // Enhance the creative recipe with Spoonacular insights
          creativeRecipe.description += ` Inspired by professional ${inspirationRecipes[0].cuisine} techniques.`;
          
          // Add a tag indicating Spoonacular inspiration
          creativeRecipe.tags.push('spoonacular-inspired');
          
          console.log('✨ Enhanced creative recipe with Spoonacular inspiration');
        }
      } catch (error) {
        console.log('🔔 Spoonacular inspiration unavailable, using pure AI creativity');
      }
    }

    return {
      source: 'fast-generator',
      recipe: creativeRecipe,
      matchScore: 1.0
    };
  }

  // Search Spoonacular by query (e.g., "Italian pasta", "healthy breakfast")
  async searchSpoonacularByQuery(
    query: string,
    options: {
      number?: number;
      maxReadyTime?: number;
      diet?: string;
      cuisine?: string;
    } = {}
  ): Promise<ConvertedSpoonacularRecipe[]> {
    if (!spoonacularService.isConfigured()) {
      throw new Error('Spoonacular API not configured');
    }

    return await spoonacularService.searchRecipes(query, {
      number: options.number || 6,
      maxReadyTime: options.maxReadyTime,
      diet: options.diet,
      cuisine: options.cuisine,
      instructionsRequired: true,
      addRecipeNutrition: true
    });
  }

  // Get random professional recipes for inspiration
  async getRandomRecipes(options: {
    number?: number;
    tags?: string;
    includeNutrition?: boolean;
  } = {}): Promise<ConvertedSpoonacularRecipe[]> {
    if (!spoonacularService.isConfigured()) {
      throw new Error('Spoonacular API not configured');
    }

    return await spoonacularService.getRandomRecipes({
      number: options.number || 3,
      tags: options.tags,
      includeNutrition: options.includeNutrition !== false
    });
  }

  // Calculate match score for Spoonacular recipes
  private calculateSpoonacularMatchScore(recipe: ConvertedSpoonacularRecipe, pantryItems: string[]): number {
    const normalizedPantry = pantryItems.map(item => item.toLowerCase().trim());
    const recipeIngredients = recipe.ingredients.map(ing => ing.name.toLowerCase());
    
    let matches = 0;
    for (const ingredient of recipeIngredients) {
      if (normalizedPantry.some(pantryItem => 
        pantryItem.includes(ingredient) || ingredient.includes(pantryItem)
      )) {
        matches++;
      }
    }
    
    const baseScore = recipeIngredients.length > 0 ? (matches / recipeIngredients.length) : 0;
    
    // Boost score for highly rated recipes
    const healthBoost = recipe.spoonacularData?.healthScore || 0 > 80 ? 0.1 : 0;
    const popularityBoost = recipe.spoonacularData?.aggregateLikes || 0 > 100 ? 0.1 : 0;
    
    return Math.min(baseScore + healthBoost + popularityBoost, 1.0);
  }

  // Try to get cached Spoonacular recipes without API call
  private async getCachedSpoonacularRecipes(pantryItems: string[]): Promise<ConvertedSpoonacularRecipe[]> {
    // This would ideally check internal cache first
    // For now, return empty array to avoid API calls in instant mode
    return [];
  }

  // Check if Spoonacular is available
  isSpoonacularAvailable(): boolean {
    return spoonacularService.isConfigured();
  }

  // Clear all caches
  clearCaches(): void {
    spoonacularService.clearCache();
    console.log('🧹 All recipe caches cleared');
  }

  // Helper method to shuffle recipes within score groups
  private shuffleWithinScoreGroups(recipes: RecipeSource[]): RecipeSource[] {
    const groups: RecipeSource[][] = [];
    let currentGroup: RecipeSource[] = [];

    recipes.forEach(recipe => {
      if (currentGroup.length === 0 || recipe.matchScore === currentGroup[0].matchScore) {
        currentGroup.push(recipe);
      } else {
        groups.push(currentGroup);
        currentGroup = [recipe];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    const shuffledRecipes: RecipeSource[] = [];
    groups.forEach(group => {
      shuffledRecipes.push(...this.shuffleArray(group));
    });

    return shuffledRecipes;
  }

  // Helper method to shuffle an array
  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export const enhancedFastRecipeGenerator = new EnhancedFastRecipeGenerator();
export type { EnhancedRecipeOptions, RecipeSource }; 