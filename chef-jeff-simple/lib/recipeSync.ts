import { spoonacularService } from './spoonacularService';
import { localRecipeDatabase } from './localRecipeDatabase';

class RecipeSyncService {
  private isSyncing = false;
  
  // Common ingredients to fetch popular recipes
  private readonly POPULAR_INGREDIENTS = [
    ['chicken', 'rice'],
    ['beef', 'onion'],
    ['pasta', 'tomatoes'],
    ['salmon', 'lemon'],
    ['broccoli', 'garlic'],
    ['potatoes', 'cheese'],
    ['eggs', 'bread'],
    ['spinach', 'feta'],
    ['mushrooms', 'herbs'],
    ['avocado', 'lime']
  ];

  // Sync recipes in the background (call this when app starts)
  async syncInBackground(): Promise<void> {
    if (this.isSyncing || !spoonacularService.isConfigured()) {
      console.log('⏭️ Skipping background sync - already running or no API key');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starting background recipe sync...');

    try {
      const stats = await localRecipeDatabase.getStats();
      console.log(`📊 Current database: ${stats.totalRecipes} recipes`);

      // If we already have a good number of recipes, skip sync
      if (stats.totalRecipes >= 20) {
        console.log('✅ Database already well-populated, skipping sync');
        this.isSyncing = false;
        return;
      }

      let totalFetched = 0;
      const batchSize = 3; // Fetch 3 recipes per ingredient combination

      for (const ingredients of this.POPULAR_INGREDIENTS) {
        try {
          console.log(`🔍 Fetching recipes for: ${ingredients.join(', ')}`);
          
          const recipes = await spoonacularService.findRecipesByIngredients(
            ingredients,
            { 
              number: batchSize,
              maxReadyTime: 60
            }
          );

          if (recipes.length > 0) {
            await localRecipeDatabase.addRecipes(recipes);
            totalFetched += recipes.length;
            console.log(`✅ Added ${recipes.length} recipes for ${ingredients.join(', ')}`);
          }

          // Small delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          console.log(`ℹ️ Failed to fetch recipes for ${ingredients.join(', ')}: API temporarily unavailable`);
        }
      }

      console.log(`🎉 Background sync completed! Added ${totalFetched} new recipes`);

    } catch (error) {
      console.log('ℹ️ Background sync temporarily unavailable');
    } finally {
      this.isSyncing = false;
    }
  }

  // Manually trigger a sync (for testing or manual refresh)
  async forceSyncNow(maxRecipes = 10): Promise<number> {
    if (!spoonacularService.isConfigured()) {
      throw new Error('Spoonacular API not configured');
    }

    console.log('🔄 Starting manual recipe sync...');
    let totalFetched = 0;

    try {
      for (const ingredients of this.POPULAR_INGREDIENTS.slice(0, 3)) {
        const recipes = await spoonacularService.findRecipesByIngredients(
          ingredients,
          { number: Math.min(maxRecipes - totalFetched, 3) }
        );

        if (recipes.length > 0) {
          await localRecipeDatabase.addRecipes(recipes);
          totalFetched += recipes.length;
        }

        if (totalFetched >= maxRecipes) break;
      }

      console.log(`✅ Manual sync completed! Added ${totalFetched} recipes`);
      return totalFetched;

    } catch (error) {
      console.log('ℹ️ Manual sync temporarily unavailable');
      throw error;
    }
  }

  // Get sync status
  getSyncStatus(): { isSyncing: boolean } {
    return { isSyncing: this.isSyncing };
  }

  // Smart sync - only fetch what we don't have
  async smartSync(): Promise<void> {
    if (!spoonacularService.isConfigured()) return;

    const stats = await localRecipeDatabase.getStats();
    
    // If database is new or small, do a background sync
    if (stats.totalRecipes < 10) {
      await this.syncInBackground();
    } else {
      console.log('📚 Database already populated, skipping sync');
    }
  }
}

export const recipeSyncService = new RecipeSyncService();