import { AIRecipeGenerator } from './aiRecipeService';

export interface ScrapedContent {
  text: string;
  mediaUrl?: string;
  username?: string;
  platform: string;
  postId?: string;
  timestamp?: string;
  comments?: string[];
  hashtags?: string[];
}

export class WebScrapingService {
  private aiGenerator: AIRecipeGenerator;

  constructor() {
    this.aiGenerator = new AIRecipeGenerator();
  }

  /**
   * Extract recipe content from any social media URL
   */
  async extractRecipeFromUrl(url: string): Promise<ScrapedContent> {
    try {
      console.log('🌐 [SCRAPING] Extracting content from URL:', url);
      
      const platform = this.detectPlatform(url);
      if (!platform) {
        throw new Error('Unsupported platform');
      }

      // Fetch the webpage content
      const htmlContent = await this.fetchWebpage(url);
      
      // Extract content based on platform
      const content = await this.extractPlatformContent(htmlContent, platform, url);
      
      return content;
    } catch (error) {
      console.error('❌ [SCRAPING] Error extracting content:', error);
      throw error;
    }
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string | null {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
      return 'instagram';
    } else if (lowerUrl.includes('tiktok.com')) {
      return 'tiktok';
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return 'twitter';
    } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return 'youtube';
    } else if (lowerUrl.includes('pinterest.com')) {
      return 'pinterest';
    } else if (lowerUrl.includes('facebook.com')) {
      return 'facebook';
    }
    
    return null;
  }

  /**
   * Fetch webpage content
   */
  private async fetchWebpage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log('🌐 [SCRAPING] Successfully fetched webpage');
      return html;
    } catch (error) {
      console.error('❌ [SCRAPING] Error fetching webpage:', error);
      throw new Error('Failed to fetch webpage content');
    }
  }

  /**
   * Extract content based on platform
   */
  private async extractPlatformContent(html: string, platform: string, url: string): Promise<ScrapedContent> {
    switch (platform) {
      case 'instagram':
        return this.extractInstagramContent(html, url);
      case 'tiktok':
        return this.extractTikTokContent(html, url);
      case 'twitter':
        return this.extractTwitterContent(html, url);
      case 'youtube':
        return this.extractYouTubeContent(html, url);
      case 'pinterest':
        return this.extractPinterestContent(html, url);
      default:
        return this.extractGenericContent(html, platform, url);
    }
  }

  /**
   * Extract Instagram content
   */
  private async extractInstagramContent(html: string, url: string): Promise<ScrapedContent> {
    console.log('📷 [SCRAPING] Extracting Instagram content');
    
    // Look for Instagram-specific patterns
    const patterns = {
      description: /"caption":"([^"]+)"/g,
      username: /"username":"([^"]+)"/g,
      mediaUrl: /"display_url":"([^"]+)"/g,
      postId: /"shortcode":"([^"]+)"/g,
    };

    const extracted = this.extractFromPatterns(html, patterns);
    
    return {
      text: extracted.description || 'Instagram post',
      mediaUrl: extracted.mediaUrl,
      username: extracted.username,
      platform: 'instagram',
      postId: extracted.postId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract TikTok content
   */
  private async extractTikTokContent(html: string, url: string): Promise<ScrapedContent> {
    console.log('🎵 [SCRAPING] Extracting TikTok content');
    
    // Look for TikTok-specific patterns
    const patterns = {
      description: /"desc":"([^"]+)"/g,
      username: /"uniqueId":"([^"]+)"/g,
      mediaUrl: /"cover":"([^"]+)"/g,
      videoId: /"id":"([^"]+)"/g,
    };

    const extracted = this.extractFromPatterns(html, patterns);
    
    return {
      text: extracted.description || 'TikTok video',
      mediaUrl: extracted.mediaUrl,
      username: extracted.username,
      platform: 'tiktok',
      postId: extracted.videoId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract Twitter content
   */
  private async extractTwitterContent(html: string, url: string): Promise<ScrapedContent> {
    console.log('🐦 [SCRAPING] Extracting Twitter content');
    
    // Look for Twitter-specific patterns
    const patterns = {
      text: /"text":"([^"]+)"/g,
      username: /"screen_name":"([^"]+)"/g,
      tweetId: /"id_str":"([^"]+)"/g,
    };

    const extracted = this.extractFromPatterns(html, patterns);
    
    return {
      text: extracted.text || 'Twitter post',
      username: extracted.username,
      platform: 'twitter',
      postId: extracted.tweetId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract YouTube content
   */
  private async extractYouTubeContent(html: string, url: string): Promise<ScrapedContent> {
    console.log('📺 [SCRAPING] Extracting YouTube content');
    
    // Look for YouTube-specific patterns
    const patterns = {
      title: /"title":"([^"]+)"/g,
      description: /"description":"([^"]+)"/g,
      channelName: /"name":"([^"]+)"/g,
      videoId: /"videoId":"([^"]+)"/g,
    };

    const extracted = this.extractFromPatterns(html, patterns);
    
    return {
      text: `${extracted.title || 'YouTube video'}\n\n${extracted.description || ''}`,
      username: extracted.channelName,
      platform: 'youtube',
      postId: extracted.videoId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract Pinterest content
   */
  private async extractPinterestContent(html: string, url: string): Promise<ScrapedContent> {
    console.log('📌 [SCRAPING] Extracting Pinterest content');
    
    // Look for Pinterest-specific patterns
    const patterns = {
      description: /"description":"([^"]+)"/g,
      username: /"username":"([^"]+)"/g,
      imageUrl: /"image":"([^"]+)"/g,
    };

    const extracted = this.extractFromPatterns(html, patterns);
    
    return {
      text: extracted.description || 'Pinterest pin',
      mediaUrl: extracted.imageUrl,
      username: extracted.username,
      platform: 'pinterest',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract generic content (fallback)
   */
  private async extractGenericContent(html: string, platform: string, url: string): Promise<ScrapedContent> {
    console.log(`🌐 [SCRAPING] Extracting generic content for ${platform}`);
    
    // Look for common patterns
    const patterns = {
      title: /<title[^>]*>([^<]+)<\/title>/gi,
      description: /<meta[^>]*name="description"[^>]*content="([^"]+)"/gi,
      ogDescription: /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/gi,
    };

    const extracted = this.extractFromPatterns(html, patterns);
    
    return {
      text: extracted.description || extracted.ogDescription || extracted.title || `${platform} content`,
      platform,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract content using regex patterns
   */
  private extractFromPatterns(html: string, patterns: Record<string, RegExp>): Record<string, string> {
    const extracted: Record<string, string> = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = html.match(pattern);
      if (match && match[1]) {
        extracted[key] = this.cleanText(match[1]);
      }
    }
    
    return extracted;
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Generate recipe from scraped content
   */
  async generateRecipeFromScrapedContent(content: ScrapedContent, sourceUrl: string): Promise<any> {
    try {
      console.log('🤖 [SCRAPING] Generating recipe from scraped content');
      
      const request = {
        pantryIngredients: [],
        dietaryRestrictions: [],
        cookingTime: 30,
        servings: 2,
        specificRequest: `Extract recipe information from this scraped social media content:
        
Text: "${content.text}"
Platform: ${content.platform}
Source: ${sourceUrl}
Username: ${content.username || 'unknown'}

IMPORTANT: Analyze the scraped content for recipe information. Look for:
- Ingredients mentioned
- Cooking steps or instructions
- Dish names or descriptions
- Cooking times or serving sizes
- Any recipe-related hashtags or keywords

If the content contains recipe information, extract it precisely. If not, indicate that no recipe information was found.`,
      };

      const aiRecipe = await this.aiGenerator.generateSingleRecipe(request, 'enhanced');
      return aiRecipe;
    } catch (error) {
      console.error('❌ [SCRAPING] Error generating recipe:', error);
      throw error;
    }
  }
} 