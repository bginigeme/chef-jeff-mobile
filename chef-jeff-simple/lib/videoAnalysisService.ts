import { AIRecipeGenerator } from './aiRecipeService';

export interface VideoFrame {
  timestamp: number;
  imageUrl: string;
  description?: string;
}

export interface VideoAnalysisResult {
  ingredients: Array<{ name: string; amount: string; unit?: string }>;
  cookingSteps: string[];
  dishName: string;
  cookingTime?: number;
  servings?: number;
  confidence: number;
  framesAnalyzed: number;
}

export class VideoAnalysisService {
  private aiGenerator: AIRecipeGenerator;

  constructor() {
    this.aiGenerator = new AIRecipeGenerator();
  }

  /**
   * Extract recipe from social media video automatically
   */
  async extractRecipeFromVideo(url: string): Promise<VideoAnalysisResult> {
    try {
      console.log('🎬 [VIDEO] Starting video analysis for:', url);
      
      // Step 1: Download video
      const videoBuffer = await this.downloadVideo(url);
      
      // Step 2: Extract key frames
      const frames = await this.extractKeyFrames(videoBuffer);
      
      // Step 3: Analyze frames with AI vision
      const analysis = await this.analyzeFramesWithAI(frames, url);
      
      // Step 4: Generate recipe from analysis
      const recipe = await this.generateRecipeFromAnalysis(analysis, url);
      
      return recipe;
    } catch (error) {
      console.error('❌ [VIDEO] Error in video analysis:', error);
      throw new Error('Failed to extract recipe from video. Please try a different link.');
    }
  }

  /**
   * Download video from social media URL
   */
  private async downloadVideo(url: string): Promise<ArrayBuffer> {
    try {
      console.log('📥 [VIDEO] Downloading video...');
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      console.log('✅ [VIDEO] Video downloaded successfully');
      return buffer;
    } catch (error) {
      console.error('❌ [VIDEO] Error downloading video:', error);
      throw new Error('Could not download video from this link');
    }
  }

  /**
   * Extract key frames from video (every 2-3 seconds)
   */
  private async extractKeyFrames(videoBuffer: ArrayBuffer): Promise<VideoFrame[]> {
    try {
      console.log('🎞️ [VIDEO] Extracting key frames...');
      
      // For now, we'll use a simplified approach
      // In production, you'd use a video processing library
      const frames: VideoFrame[] = [];
      
      // Simulate frame extraction (replace with actual video processing)
      for (let i = 0; i < 5; i++) {
        frames.push({
          timestamp: i * 2,
          imageUrl: `frame_${i}.jpg`, // This would be actual frame data
        });
      }
      
      console.log(`✅ [VIDEO] Extracted ${frames.length} key frames`);
      return frames;
    } catch (error) {
      console.error('❌ [VIDEO] Error extracting frames:', error);
      throw new Error('Failed to process video frames');
    }
  }

  /**
   * Analyze video frames using AI vision
   */
  private async analyzeFramesWithAI(frames: VideoFrame[], sourceUrl: string): Promise<any> {
    try {
      console.log('🤖 [VIDEO] Analyzing frames with AI vision...');
      
      // Use GPT-4V or similar multimodal AI to analyze frames
      const analysisPrompts = frames.map((frame, index) => ({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this frame from a cooking video and identify:
1. Any ingredients visible (with measurements if shown)
2. Cooking steps or techniques being performed
3. Kitchen tools or equipment being used
4. Any text overlays or captions
5. The dish being prepared

Frame ${index + 1} of ${frames.length} (timestamp: ${frame.timestamp}s)`
          },
          {
            type: 'image_url',
            image_url: {
              url: frame.imageUrl // This would be base64 encoded image data
            }
          }
        ]
      }));

      // For now, we'll simulate AI analysis
      // In production, you'd call GPT-4V API here
      const mockAnalysis = {
        ingredients: ['2 cups flour', '3 eggs', '1 cup milk'],
        steps: ['Mix flour and eggs', 'Add milk gradually', 'Cook on medium heat'],
        dishName: 'Pancakes',
        tools: ['mixing bowl', 'whisk', 'pan'],
        confidence: 0.85
      };

      console.log('✅ [VIDEO] AI analysis completed');
      return mockAnalysis;
    } catch (error) {
      console.error('❌ [VIDEO] Error in AI analysis:', error);
      throw new Error('Failed to analyze video content');
    }
  }

  /**
   * Generate recipe from video analysis
   */
  private async generateRecipeFromAnalysis(analysis: any, sourceUrl: string): Promise<VideoAnalysisResult> {
    try {
      console.log('📝 [VIDEO] Generating recipe from analysis...');
      
      const request = {
        pantryIngredients: [],
        dietaryRestrictions: [],
        cookingTime: 30,
        servings: 2,
        specificRequest: `Create a recipe based on this video analysis:

Dish: ${analysis.dishName}
Ingredients Found: ${analysis.ingredients.join(', ')}
Steps Observed: ${analysis.steps.join(', ')}
Tools Used: ${analysis.tools.join(', ')}
Confidence: ${analysis.confidence}

Create a complete recipe with:
1. Exact ingredients and measurements from the video
2. Step-by-step instructions based on what was observed
3. Cooking time and serving size
4. Any tips or notes from the video

Source: ${sourceUrl}
Analysis Method: AI Video Analysis`
      };

      const aiRecipe = await this.aiGenerator.generateSingleRecipe(request, 'enhanced');
      
      return {
        ingredients: aiRecipe.ingredients || [],
        cookingSteps: aiRecipe.instructions || [],
        dishName: aiRecipe.title || analysis.dishName,
        cookingTime: aiRecipe.cookingTime,
        servings: aiRecipe.servings,
        confidence: analysis.confidence,
        framesAnalyzed: 5
      };
    } catch (error) {
      console.error('❌ [VIDEO] Error generating recipe:', error);
      throw new Error('Failed to generate recipe from video analysis');
    }
  }

  /**
   * Check if URL contains video content
   */
  static isVideoUrl(url: string): boolean {
    const videoPlatforms = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be'];
    return videoPlatforms.some(platform => url.includes(platform));
  }

  /**
   * Get estimated cost for video analysis
   */
  static getEstimatedCost(): string {
    return '$0.50-2.00 per video (depending on length)';
  }
} 