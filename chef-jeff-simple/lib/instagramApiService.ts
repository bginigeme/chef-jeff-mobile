/**
 * Instagram API Service - Production Implementation
 * 
 * This service demonstrates how to integrate with Instagram's Basic Display API
 * for real content extraction. In production, you would:
 * 1. Set up Instagram App in Meta Developer Console
 * 2. Implement OAuth flow for user authorization
 * 3. Use the Instagram Basic Display API to fetch post content
 * 4. Handle rate limiting and error cases
 */

export interface InstagramPost {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  username: string;
}

export interface InstagramApiConfig {
  accessToken: string;
  appId: string;
  appSecret: string;
}

export class InstagramApiService {
  private config: InstagramApiConfig;
  private baseUrl = 'https://graph.instagram.com/v12.0';

  constructor(config: InstagramApiConfig) {
    this.config = config;
  }

  /**
   * Extract Instagram post ID from URL
   * Supports various Instagram URL formats
   */
  extractPostId(url: string): string | null {
    // Handle different Instagram URL formats
    const patterns = [
      /instagram\.com\/p\/([^\/\?]+)/, // Standard post
      /instagram\.com\/reel\/([^\/\?]+)/, // Reel
      /instagram\.com\/tv\/([^\/\?]+)/, // IGTV
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Fetch Instagram post data using the Basic Display API
   */
  async getPostData(postId: string): Promise<InstagramPost> {
    try {
      console.log(`📷 [INSTAGRAM] Fetching post data for ID: ${postId}`);
      
      const url = `${this.baseUrl}/${postId}?fields=id,caption,media_type,media_url,permalink,timestamp,username&access_token=${this.config.accessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`✅ [INSTAGRAM] Successfully fetched post data`);
      
      return {
        id: data.id,
        caption: data.caption || '',
        media_type: data.media_type,
        media_url: data.media_url,
        permalink: data.permalink,
        timestamp: data.timestamp,
        username: data.username || 'unknown'
      };
    } catch (error: any) {
      console.error(`❌ [INSTAGRAM] Error fetching post data:`, error);
      throw new Error(`Failed to fetch Instagram post: ${error.message}`);
    }
  }

  /**
   * Get user's Instagram posts (requires user authorization)
   */
  async getUserPosts(userId: string, limit: number = 10): Promise<InstagramPost[]> {
    try {
      console.log(`📷 [INSTAGRAM] Fetching posts for user: ${userId}`);
      
      const url = `${this.baseUrl}/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}&access_token=${this.config.accessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`✅ [INSTAGRAM] Successfully fetched ${data.data.length} posts`);
      
      return data.data.map((post: any) => ({
        id: post.id,
        caption: post.caption || '',
        media_type: post.media_type,
        media_url: post.media_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        username: userId
      }));
    } catch (error: any) {
      console.error(`❌ [INSTAGRAM] Error fetching user posts:`, error);
      throw new Error(`Failed to fetch user posts: ${error.message}`);
    }
  }

  /**
   * Check if a post contains recipe-related content
   */
  isRecipePost(post: InstagramPost): boolean {
    const caption = post.caption.toLowerCase();
    const recipeKeywords = [
      'recipe', 'ingredients', 'instructions', 'directions', 'cook', 'bake', 'fry',
      'prep', 'serves', 'cups', 'tablespoons', 'teaspoons', 'ounces', 'pounds',
      'preheat', 'season', 'mix', 'combine', 'stir', 'whisk', 'fold', 'knead'
    ];
    
    return recipeKeywords.some(keyword => caption.includes(keyword));
  }

  /**
   * Extract recipe information from Instagram post caption
   */
  extractRecipeFromCaption(caption: string): {
    title?: string;
    ingredients?: string[];
    instructions?: string[];
    cookingTime?: number;
    servings?: number;
  } {
    const lines = caption.split('\n').map(line => line.trim()).filter(line => line);
    
    let title: string | undefined;
    let ingredients: string[] = [];
    let instructions: string[] = [];
    let cookingTime: number | undefined;
    let servings: number | undefined;

    // Extract title (usually the first line or line with emojis)
    const titleLine = lines.find(line => 
      line.includes('🔥') || line.includes('🍝') || line.includes('🥘') || 
      line.includes('🍕') || line.includes('🥗') || line.includes('✨')
    );
    if (titleLine) {
      title = titleLine.replace(/[🔥🍝🥘🍕🥗✨]/g, '').trim();
    }

    // Extract ingredients (look for "Ingredients:" section)
    const ingredientsIndex = lines.findIndex(line => 
      line.toLowerCase().includes('ingredients:') || line.toLowerCase().includes('ingredients')
    );
    if (ingredientsIndex !== -1) {
      let i = ingredientsIndex + 1;
      while (i < lines.length && !lines[i].toLowerCase().includes('instructions')) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#')) {
          ingredients.push(line.replace(/^[-•*]\s*/, ''));
        }
        i++;
      }
    }

    // Extract instructions (look for numbered steps or "Instructions:" section)
    const instructionsIndex = lines.findIndex(line => 
      line.toLowerCase().includes('instructions:') || line.toLowerCase().includes('directions:')
    );
    if (instructionsIndex !== -1) {
      let i = instructionsIndex + 1;
      while (i < lines.length && !lines[i].startsWith('#')) {
        const line = lines[i].trim();
        if (line && (line.match(/^\d+\./) || line.match(/^[-•*]/))) {
          instructions.push(line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, ''));
        }
        i++;
      }
    }

    // Extract cooking time
    const timeMatch = caption.match(/(\d+)\s*(min|minutes|mins)/i);
    if (timeMatch) {
      cookingTime = parseInt(timeMatch[1]);
    }

    // Extract servings
    const servingsMatch = caption.match(/serves\s*(\d+)/i);
    if (servingsMatch) {
      servings = parseInt(servingsMatch[1]);
    }

    return {
      title,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
      instructions: instructions.length > 0 ? instructions : undefined,
      cookingTime,
      servings
    };
  }
}

/**
 * Example usage in production:
 * 
 * 1. Set up Instagram App in Meta Developer Console
 * 2. Implement OAuth flow to get user access token
 * 3. Use the service to fetch real Instagram content
 * 
 * const instagramService = new InstagramApiService({
 *   accessToken: 'user_access_token_here',
 *   appId: 'your_app_id',
 *   appSecret: 'your_app_secret'
 * });
 * 
 * const postId = instagramService.extractPostId(instagramUrl);
 * const postData = await instagramService.getPostData(postId);
 * const recipeInfo = instagramService.extractRecipeFromCaption(postData.caption);
 */ 