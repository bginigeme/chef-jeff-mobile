import { AIRecipeGenerator } from './aiRecipeService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';
import { VideoAnalysisService } from './videoAnalysisService';

export interface SocialMediaRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount?: string;
    unit?: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sourceUrl: string;
  sourcePlatform: 'instagram' | 'tiktok' | 'twitter' | 'x' | 'shared';
  mediaUrl?: string;
  estimatedCost?: string;
  tags?: string[];
  createdAt: Date;
  originalText?: string; // Store the original social media text
  username?: string;
}

export interface SocialMediaAPIResponse {
  text: string;
  mediaUrl?: string;
  username?: string;
  platform: string;
  postId?: string;
  timestamp?: string;
}

export class SocialMediaRecipeService {
  private aiGenerator: AIRecipeGenerator;
  private videoAnalysisService: VideoAnalysisService;
  private apiKeys: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };

  constructor() {
    this.aiGenerator = new AIRecipeGenerator();
    this.videoAnalysisService = new VideoAnalysisService();
    this.apiKeys = {
      // In production, these would be loaded from environment variables
      instagram: process.env.EXPO_PUBLIC_INSTAGRAM_API_KEY,
      tiktok: process.env.EXPO_PUBLIC_TIKTOK_API_KEY,
      twitter: process.env.EXPO_PUBLIC_TWITTER_API_KEY,
    };
  }

  /**
   * Extract recipe information from a social media link
   */
  async extractRecipeFromLink(url: string): Promise<SocialMediaRecipe> {
    try {
      console.log('🔗 [SOCIAL] Processing URL:', url);
      
      // Validate and parse the URL
      const platform = this.detectPlatform(url);
      if (!platform) {
        throw new Error('Unsupported platform. Please share a link from Instagram, TikTok, or X (Twitter).');
      }

      // Check if this is a video URL that needs video analysis
      if (VideoAnalysisService.isVideoUrl(url)) {
        console.log('🎬 [SOCIAL] Detected video content, using video analysis...');
        return await this.extractRecipeFromVideo(url, platform);
      }

      // Extract content from the URL using real APIs (for text-based content)
      const content = await this.extractContentFromUrl(url, platform);
      
      // Generate recipe using AI
      const recipe = await this.generateRecipeFromContent(content, url, platform);
      
      return recipe;
    } catch (error) {
      console.error('❌ [SOCIAL] Error extracting recipe:', error);
      throw error;
    }
  }

  /**
   * Extract recipe from video using AI vision analysis
   */
  private async extractRecipeFromVideo(url: string, platform: string): Promise<SocialMediaRecipe> {
    try {
      console.log('🎬 [SOCIAL] Starting video analysis for:', url);
      
      // Use video analysis service to extract recipe from video
      const videoResult = await this.videoAnalysisService.extractRecipeFromVideo(url);
      
      // Convert video analysis result to SocialMediaRecipe format
      const recipe: SocialMediaRecipe = {
        id: this.generateRecipeId(url),
        title: videoResult.dishName,
        description: `Recipe extracted from ${platform} video using AI vision analysis`,
        ingredients: videoResult.ingredients,
        instructions: videoResult.cookingSteps,
        cookingTime: videoResult.cookingTime || 30,
        servings: videoResult.servings || 2,
        difficulty: 'Medium', // Default difficulty
        sourceUrl: url,
        sourcePlatform: platform as any,
        estimatedCost: VideoAnalysisService.getEstimatedCost(),
        tags: ['video-extracted', 'ai-vision'],
        createdAt: new Date(),
        originalText: `Video analysis confidence: ${Math.round(videoResult.confidence * 100)}%`,
        username: 'Video Analysis'
      };
      
      console.log('✅ [SOCIAL] Video analysis completed successfully');
      return recipe;
    } catch (error) {
      console.error('❌ [SOCIAL] Error in video analysis:', error);
      throw new Error('Failed to extract recipe from video. Please try a different link.');
    }
  }

  /**
   * Handle shared content from other apps (Share Extension)
   */
  async handleSharedContent(sharedText: string, sharedUrl?: string): Promise<SocialMediaRecipe> {
    try {
      console.log('📱 [SOCIAL] Handling shared content:', { sharedText, sharedUrl });
      
      let platform: string = 'shared';
      let sourceUrl = sharedUrl || 'shared-content';
      
      // If a URL was shared, try to detect the platform
      if (sharedUrl) {
        const detectedPlatform = this.detectPlatform(sharedUrl);
        if (detectedPlatform) {
          platform = detectedPlatform;
          sourceUrl = sharedUrl;
        }
      }
      
      // Create content object from shared text
      const content: SocialMediaAPIResponse = {
        text: sharedText,
        platform,
        username: 'shared_user',
        timestamp: new Date().toISOString(),
      };
      
      // Generate recipe from shared content
      const recipe = await this.generateRecipeFromContent(content, sourceUrl, platform);
      
      return recipe;
    } catch (error) {
      console.error('❌ [SOCIAL] Error handling shared content:', error);
      throw error;
    }
  }

  /**
   * Detect the platform from the URL
   */
  private detectPlatform(url: string): 'instagram' | 'tiktok' | 'twitter' | 'x' | null {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
      return 'instagram';
    } else if (lowerUrl.includes('tiktok.com')) {
      return 'tiktok';
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return 'twitter';
    }
    
    return null;
  }

  /**
   * Extract content from the social media URL using real APIs
   */
  private async extractContentFromUrl(url: string, platform: string): Promise<SocialMediaAPIResponse> {
    console.log(`🔗 [SOCIAL] Extracting content from ${platform} URL: ${url}`);
    
    try {
      switch (platform) {
        case 'instagram':
          return await this.extractInstagramContent(url);
        case 'tiktok':
          return await this.extractTikTokContent(url);
        case 'twitter':
        case 'x':
          return await this.extractTwitterContent(url);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`❌ [SOCIAL] Error extracting content from ${platform}:`, error);
      // Fallback to mock data if API fails
      return this.getMockContent(url, platform);
    }
  }

  /**
   * Extract content from Instagram using Instagram Basic Display API
   */
  private async extractInstagramContent(url: string): Promise<SocialMediaAPIResponse> {
    const postId = this.extractInstagramPostId(url);
    
    if (!this.apiKeys.instagram) {
      console.warn('⚠️ [SOCIAL] Instagram API key not configured, using fallback');
      return this.getMockContent(url, 'instagram');
    }

    try {
      // Instagram Basic Display API endpoint
      const apiUrl = `https://graph.instagram.com/${postId}?fields=id,caption,media_type,media_url,username,timestamp&access_token=${this.apiKeys.instagram}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Instagram API error: ${data.error.message}`);
      }
      
      return {
        text: data.caption || 'Instagram post',
        mediaUrl: data.media_url,
        username: data.username,
        platform: 'instagram',
        postId: data.id,
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error('❌ [SOCIAL] Instagram API error:', error);
      return this.getMockContent(url, 'instagram');
    }
  }

  /**
   * Extract content from TikTok using RapidAPI
   */
  private async extractTikTokContent(url: string): Promise<SocialMediaAPIResponse> {
    const videoId = this.extractTikTokVideoId(url);
    
    if (!this.apiKeys.tiktok) {
      console.warn('⚠️ [SOCIAL] TikTok API key not configured, using fallback');
      return this.getMockContent(url, 'tiktok');
    }

    try {
      // RapidAPI TikTok endpoint
      const apiUrl = `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}&hd=1`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKeys.tiktok,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
        },
      });
      
      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`TikTok API error: ${data.msg || 'Unknown error'}`);
      }
      
      // Log the TikTok data for debugging
      console.log('🎵 [TIKTOK] Raw API response:', {
        desc: data.data.desc,
        author: data.data.author?.unique_id,
        videoId: data.data.video_id,
        cover: data.data.cover,
      });
      
      // Enhance the text with more context for better recipe extraction
      const enhancedText = this.enhanceTikTokText(data.data.desc || '', data.data.author?.unique_id || '');
      
      return {
        text: enhancedText,
        mediaUrl: data.data.cover,
        username: data.data.author?.unique_id,
        platform: 'tiktok',
        postId: data.data.video_id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [SOCIAL] TikTok API error:', error);
      return this.getMockContent(url, 'tiktok');
    }
  }

  /**
   * Extract content from Twitter/X (URL only, no API calls)
   */
  private async extractTwitterContent(url: string): Promise<SocialMediaAPIResponse> {
    const tweetId = this.extractTwitterTweetId(url);
    
    console.log('🐦 [SOCIAL] Twitter/X URL detected, extracting URL only');
    
    // For Twitter/X, we'll use mock content since API has pricing
    // In the future, you could implement web scraping or use a free alternative
    return {
      text: `Recipe shared on X (Twitter)! Check out this delicious recipe I found. 
      
This recipe was shared on X (Twitter) and looks amazing! I've extracted the basic information, but for the full recipe details, you can visit the original post.

#recipe #cooking #delicious #foodie`,
      mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
      username: 'twitter_user',
      platform: 'twitter',
      postId: tweetId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fallback mock content when APIs are not available
   */
  private getMockContent(url: string, platform: string): SocialMediaAPIResponse {
    console.log(`🎭 [SOCIAL] Using mock content for ${platform}`);
    
    const hash = this.hashString(url);
    const recipeIndex = hash % 5;
    
    const mockRecipes = [
      {
        text: `🔥 Hot Honey Garlic Chicken Tenders! These crispy chicken tenders are coated in a sweet and spicy honey garlic glaze that's absolutely addictive. Perfect for game day, parties, or just because! 

Ingredients: Chicken tenders, flour, eggs, breadcrumbs, honey, garlic, hot sauce, butter, salt, pepper

Instructions: 
1. Season chicken tenders with salt and pepper
2. Dredge in flour, dip in eggs, then coat with breadcrumbs
3. Fry until golden and crispy
4. Make the hot honey garlic sauce with honey, garlic, hot sauce, and butter
5. Toss the tenders in the sauce and serve hot!

#hothoneygarlic #chickentenders #recipe #foodie #delicious #cooking #instafood`,
        mediaUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop',
        username: 'aflavorfulbite'
      },
      {
        text: `🍝 Creamy Garlic Parmesan Pasta! This restaurant-quality pasta is loaded with flavor and ready in just 20 minutes. The creamy sauce with parmesan and garlic is absolutely divine!

Ingredients: Fettuccine pasta, heavy cream, parmesan cheese, garlic, butter, olive oil, salt, pepper, parsley

Instructions:
1. Cook pasta according to package directions
2. In a large pan, melt butter and sauté minced garlic
3. Add heavy cream and simmer until slightly thickened
4. Stir in grated parmesan cheese until melted
5. Toss with cooked pasta and garnish with parsley

#pasta #parmesan #garlic #creamy #recipe #foodie #delicious`,
        mediaUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&h=600&fit=crop',
        username: 'pasta_lover'
      },
      {
        text: `🥘 One-Pan Mexican Rice! This flavorful rice dish is packed with authentic Mexican flavors and comes together in just one pan. Perfect for meal prep or a quick dinner!

Ingredients: Long grain rice, black beans, corn, bell peppers, onion, garlic, tomato sauce, chicken broth, cumin, chili powder, salt, pepper

Instructions:
1. Sauté diced onion and bell peppers in oil
2. Add rice and toast for 2 minutes
3. Stir in spices, tomato sauce, and broth
4. Add beans and corn, bring to boil
5. Reduce heat and simmer until rice is tender

#mexicanrice #onepan #recipe #foodie #delicious #mexicanfood`,
        mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
        username: 'mexican_chef'
      },
      {
        text: `🍕 Homemade Margherita Pizza! Nothing beats a fresh, homemade pizza with simple, quality ingredients. This classic margherita is perfect for pizza night!

Ingredients: Pizza dough, fresh mozzarella, tomato sauce, fresh basil, olive oil, salt, pepper

Instructions:
1. Preheat oven to 500°F with pizza stone
2. Roll out dough and add tomato sauce
3. Top with fresh mozzarella slices
4. Bake for 12-15 minutes until crispy
5. Add fresh basil and drizzle with olive oil

#pizza #margherita #homemade #recipe #foodie #delicious`,
        mediaUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
        username: 'pizza_master'
      },
      {
        text: `🥗 Mediterranean Quinoa Bowl! This healthy and colorful bowl is packed with protein and fresh Mediterranean flavors. Perfect for lunch or a light dinner!

Ingredients: Quinoa, cherry tomatoes, cucumber, red onion, kalamata olives, feta cheese, lemon, olive oil, oregano, salt, pepper

Instructions:
1. Cook quinoa according to package directions
2. Chop vegetables and mix in a bowl
3. Add cooked quinoa and crumbled feta
4. Dress with lemon juice, olive oil, and oregano
5. Season with salt and pepper to taste

#quinoa #mediterranean #healthy #bowl #recipe #foodie`,
        mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
        username: 'healthy_eats'
      }
    ];
    
    return {
      ...mockRecipes[recipeIndex],
      platform,
      postId: this.extractPostId(url, platform),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Enhance TikTok text for better recipe extraction
   */
  private enhanceTikTokText(originalText: string, username: string): string {
    // If the original text is very short or doesn't contain recipe keywords,
    // enhance it with more context for better AI extraction
    const recipeKeywords = ['recipe', 'ingredients', 'cook', 'make', 'food', 'dish', 'meal', 'dinner', 'lunch', 'breakfast'];
    const hasRecipeContent = recipeKeywords.some(keyword => 
      originalText.toLowerCase().includes(keyword)
    );
    
    if (originalText.length < 50 || !hasRecipeContent) {
      // Enhance with more context
      return `TikTok Recipe Video by @${username}

Original Description: "${originalText}"

This TikTok video shows a recipe being made. The creator demonstrates the cooking process and ingredients used. Please extract the recipe information from the video content and description.

Look for:
- Ingredients mentioned or shown
- Cooking steps demonstrated
- Dish name or type
- Any cooking tips or techniques shown

#recipe #cooking #tiktok #food`;
    }
    
    // If the text already has good recipe content, return as is
    return originalText;
  }

  /**
   * Extract post IDs from different platforms
   */
  private extractPostId(url: string, platform: string): string {
    switch (platform) {
      case 'instagram':
        return this.extractInstagramPostId(url);
      case 'tiktok':
        return this.extractTikTokVideoId(url);
      case 'twitter':
      case 'x':
        return this.extractTwitterTweetId(url);
      default:
        return 'unknown';
    }
  }

  /**
   * Extract Instagram post ID from URL
   */
  private extractInstagramPostId(url: string): string {
    const match = url.match(/\/p\/([^\/\?]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract TikTok video ID from URL
   */
  private extractTikTokVideoId(url: string): string {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract Twitter tweet ID from URL
   */
  private extractTwitterTweetId(url: string): string {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Simple hash function to generate consistent recipe selection
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate a unique recipe ID from URL
   */
  private generateRecipeId(url: string): string {
    const hash = this.hashString(url);
    return `social_${hash}_${Date.now()}`;
  }

  /**
   * Generate recipe from extracted content using AI
   */
  private async generateRecipeFromContent(
    content: SocialMediaAPIResponse,
    sourceUrl: string,
    platform: string
  ): Promise<SocialMediaRecipe> {
    try {
      console.log('🤖 [SOCIAL] Generating recipe from content using AI');
      
      // Create a RecipeRequest with the social media content as a specific request
      const request = {
        pantryIngredients: [], // We don't have pantry context for social media recipes
        dietaryRestrictions: [],
        cookingTime: 30,
        servings: 2,
        specificRequest: `Extract recipe information from this social media post:
        
Text: "${content.text}"
Platform: ${platform}
Source: ${sourceUrl}
Username: ${content.username || 'unknown'}

CRITICAL INSTRUCTIONS:
1. ONLY extract recipe information that is EXPLICITLY mentioned in the text above
2. If the text contains ingredients, cooking steps, or dish names, use those EXACTLY
3. If the text is too vague (like just hashtags or "check out this recipe"), DO NOT create a recipe
4. For TikTok videos: Only create a recipe if the description actually contains recipe details
5. If insufficient information is provided, respond with a message asking for more details

DO NOT create generic recipes. Only extract what's actually in the text. If the text doesn't contain enough recipe information, say so.`,
      };

      // Use the existing AI service to generate the recipe
      const aiRecipe = await this.aiGenerator.generateSingleRecipe(request, 'enhanced');
      
      // Check if the AI was able to extract meaningful recipe information
      const hasMeaningfulContent = aiRecipe.title && 
        aiRecipe.title !== 'Recipe from Social Media' && 
        aiRecipe.ingredients && 
        aiRecipe.ingredients.length > 0;
      
      if (!hasMeaningfulContent) {
        throw new Error(`Unable to extract recipe information from this ${platform} post. The content doesn't contain enough recipe details. Please try sharing a post with more detailed recipe information.`);
      }
      
      // Convert to SocialMediaRecipe format
      const socialMediaRecipe: SocialMediaRecipe = {
        id: `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: aiRecipe.title || 'Recipe from Social Media',
        description: aiRecipe.description || 'A delicious recipe shared on social media',
        ingredients: aiRecipe.ingredients || [],
        instructions: aiRecipe.instructions || [],
        cookingTime: aiRecipe.cookingTime || 30,
        servings: aiRecipe.servings || 2,
        difficulty: aiRecipe.difficulty || 'Medium',
        sourceUrl,
        sourcePlatform: platform as 'instagram' | 'tiktok' | 'twitter' | 'x' | 'shared',
        mediaUrl: content.mediaUrl,
        estimatedCost: undefined,
        tags: aiRecipe.tags,
        createdAt: new Date(),
        originalText: content.text,
        username: content.username,
      };

      return socialMediaRecipe;
    } catch (error) {
      console.error('❌ [SOCIAL] Error generating recipe from content:', error);
      throw new Error('Failed to generate recipe from social media content');
    }
  }

  /**
   * Save a social media recipe to AsyncStorage
   */
  async saveSocialMediaRecipe(recipe: SocialMediaRecipe): Promise<void> {
    try {
      // Get existing recipes
      const existingRecipes = await this.getSocialMediaRecipes();
      
      // Add new recipe
      const updatedRecipes = [recipe, ...existingRecipes];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('socialMediaRecipes', JSON.stringify(updatedRecipes));
      console.log('💾 [SOCIAL] Saved social media recipe:', recipe.title);
    } catch (error) {
      console.error('❌ [SOCIAL] Error saving social media recipe:', error);
      throw error;
    }
  }

  /**
   * Get all saved social media recipes from AsyncStorage
   */
  async getSocialMediaRecipes(): Promise<SocialMediaRecipe[]> {
    try {
      const recipesJson = await AsyncStorage.getItem('socialMediaRecipes');
      if (recipesJson) {
        const recipes = JSON.parse(recipesJson);
        // Convert date strings back to Date objects
        return recipes.map((recipe: any) => ({
          ...recipe,
          createdAt: new Date(recipe.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ [SOCIAL] Error loading social media recipes:', error);
      return [];
    }
  }

  /**
   * Delete a social media recipe
   */
  async deleteSocialMediaRecipe(recipeId: string): Promise<void> {
    try {
      const recipes = await this.getSocialMediaRecipes();
      const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeId);
      await AsyncStorage.setItem('socialMediaRecipes', JSON.stringify(updatedRecipes));
      console.log('🗑️ [SOCIAL] Deleted social media recipe:', recipeId);
    } catch (error) {
      console.error('❌ [SOCIAL] Error deleting social media recipe:', error);
      throw error;
    }
  }

  /**
   * Share a recipe to other apps
   */
  async shareRecipe(recipe: SocialMediaRecipe): Promise<void> {
    try {
      const shareText = `Check out this amazing recipe: ${recipe.title}\n\nIngredients: ${recipe.ingredients.map(ing => ing.name).join(', ')}\n\nCooking time: ${recipe.cookingTime} minutes\n\nShared from Chef Jeff app!`;
      
      await Share.share({
        message: shareText,
        title: recipe.title,
      });
    } catch (error) {
      console.error('❌ [SOCIAL] Error sharing recipe:', error);
      throw error;
    }
  }

  /**
   * Validate if a URL is a valid social media link
   */
  static isValidSocialMediaUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes('instagram.com') ||
      lowerUrl.includes('instagr.am') ||
      lowerUrl.includes('tiktok.com') ||
      lowerUrl.includes('twitter.com') ||
      lowerUrl.includes('x.com')
    );
  }

  /**
   * Handle deep links for social media content
   */
  static handleDeepLink(url: string): { platform: string; postId: string } | null {
    const platform = new SocialMediaRecipeService().detectPlatform(url);
    if (!platform) return null;

    const postId = new SocialMediaRecipeService().extractPostId(url, platform);
    return { platform, postId };
  }
} 