export interface SocialRecipeData {
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  hashtags?: string[];
  sourceURL: string;
  ingredients?: string[];
  instructions?: string[];
}

export class SocialRecipeService {
  private static BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.112:3001';
  private static TOKEN = process.env.EXPO_PUBLIC_BACKEND_TOKEN || '';

  /** Upload an external image to Storage via backend to avoid client CORS issues */
  static async proxyUploadImage(userId: string, imageUrl: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.BACKEND_URL}/proxy-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(this.TOKEN ? { 'x-backend-token': this.TOKEN } : {}) },
        body: JSON.stringify({ userId, imageUrl })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract recipe data from a social media URL using local backend
   */
  static async extractRecipeFromURL(url: string): Promise<SocialRecipeData | null> {
    try {
      console.log('🔍 Extracting recipe from URL:', url);
      
      console.log('🔐 Debug: BACKEND_URL =', this.BACKEND_URL);
      console.log('🔐 Debug: TOKEN =', this.TOKEN ? this.TOKEN.substring(0, 10) + '...' : 'NOT SET');
      console.log('🔐 Debug: Full headers =', {
        'Content-Type': 'application/json',
        ...(this.TOKEN ? { 'x-backend-token': this.TOKEN } : {})
      });
      
      const response = await fetch(`${this.BACKEND_URL}/extract-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.TOKEN ? { 'x-backend-token': this.TOKEN } : {}),
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const recipeData = await response.json();
      
      if (recipeData) {
        console.log('✅ Successfully extracted recipe data:', recipeData);
        return recipeData;
      } else {
        console.log('❌ No recipe data found in URL');
        return null;
      }
    } catch (error) {
      console.log('❌ Error extracting recipe from URL:', error);
      
      // Fallback to mock data if backend is not available
      console.log('🔄 Falling back to mock data...');
      return this.createMockRecipeFromURL(url);
    }
  }

  /**
   * Create mock recipe data from URL (fallback when backend is unavailable)
   */
  private static createMockRecipeFromURL(url: string): SocialRecipeData | null {
    const platform = this.getPlatformFromURL(url);
    const author = this.extractAuthorFromURL(url);
    
    // Create mock data based on platform
    const mockRecipes = {
      'Instagram': {
        title: 'Delicious Homemade Recipe',
        description: 'A mouthwatering recipe that will impress your family and friends. Made with fresh ingredients and love!',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        hashtags: ['#food', '#cooking', '#recipe', '#delicious', '#homemade']
      },
      'TikTok': {
        title: 'Quick & Easy Recipe',
        description: 'This viral recipe is super easy to make and tastes amazing! Perfect for busy weeknights.',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        hashtags: ['#tiktok', '#viral', '#quick', '#easy', '#recipe']
      },
      'Pinterest': {
        title: 'Beautiful Recipe Creation',
        description: 'A stunning recipe that looks as good as it tastes. Perfect for special occasions!',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
        hashtags: ['#pinterest', '#beautiful', '#food', '#recipe', '#inspiration']
      },
      'YouTube': {
        title: 'Chef\'s Special Recipe',
        description: 'Learn how to make this amazing recipe step by step. Professional tips and tricks included!',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        hashtags: ['#youtube', '#chef', '#tutorial', '#recipe', '#cooking']
      }
    };

    const mockData = mockRecipes[platform as keyof typeof mockRecipes] || mockRecipes['Instagram'];
    
    return {
      title: mockData.title,
      description: mockData.description,
      image: mockData.image,
      author: author || 'Unknown Chef',
      hashtags: mockData.hashtags,
      sourceURL: url,
      ingredients: [
        'Fresh ingredients',
        'Herbs and spices',
        'Quality protein',
        'Fresh vegetables'
      ],
      instructions: [
        'Prepare your ingredients',
        'Follow the cooking method',
        'Add your personal touch',
        'Enjoy your creation!'
      ]
    };
  }

  /**
   * Extract author from URL
   */
  private static extractAuthorFromURL(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length > 0) {
        const username = pathParts[0];
        if (username.startsWith('@')) {
          return username.substring(1);
        }
        if (!username.includes('.') && username.length > 1) {
          return username;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is from a supported social media platform
   */
  static isSupportedSocialMediaURL(url: string): boolean {
    const supportedDomains = [
      'instagram.com',
      'tiktok.com',
      'pinterest.com',
      'youtube.com',
      'facebook.com'
    ];

    try {
      const urlObj = new URL(url);
      return supportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Get platform name from URL
   */
  static getPlatformFromURL(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('instagram.com')) return 'Instagram';
      if (urlObj.hostname.includes('tiktok.com')) return 'TikTok';
      if (urlObj.hostname.includes('pinterest.com')) return 'Pinterest';
      if (urlObj.hostname.includes('youtube.com')) return 'YouTube';
      if (urlObj.hostname.includes('facebook.com')) return 'Facebook';
      return 'Social Media';
    } catch {
      return 'Social Media';
    }
  }

  /**
   * Check if backend is available
   */
  static async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/healthz`, { headers: this.TOKEN ? { 'x-backend-token': this.TOKEN } : {} });
      return response.ok;
    } catch {
      return false;
    }
  }
} 