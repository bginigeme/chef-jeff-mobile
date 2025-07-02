import OpenAI from 'openai'
import { UserPreferencesService } from './userPreferences'
import { RecipeHistoryService } from './recipeHistory'
import { IngredientDatabase } from './ingredientDatabase'
import Constants from 'expo-constants'

// Development mode check
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development'

// Get API key from environment variables or constants
const getOpenAIKey = () => {
  // Try expo-constants first (for production builds)
  if (Constants.expoConfig?.extra?.openaiApiKey) {
    return Constants.expoConfig.extra.openaiApiKey
  }
  
  // Fallback to process.env (for development)
  if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    return process.env.EXPO_PUBLIC_OPENAI_API_KEY
  }
  
  // Final fallback for development
  if (isDevelopment) {
    return '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'
  }
  
  throw new Error('OpenAI API key not found. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment or configure it in app.json')
}

const openai = new OpenAI({
  apiKey: getOpenAIKey(),
})

export interface AIRecipe {
  id: string
  title: string
  description: string
  ingredients: Array<{
    name: string
    amount: string
    unit?: string
  }>
  instructions: string[]
  cookingTime: number
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisine?: string
  tags: string[]
  imageUrl?: string
  imagePrompt?: string
  nutritionInfo?: {
    calories?: number
    protein?: string
    carbs?: string
    fat?: string
  }
}

export interface RecipeRequest {
  pantryIngredients: string[]
  dietaryRestrictions?: string[]
  cookingTime?: number
  servings?: number
  cuisine?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  cookingMethod?: string
  avoidIngredients?: string[]
  specificRequest?: string
  mealType?: string
}

export class AIRecipeGenerator {
  // Smart ingredient filtering and organization
  private organizeIngredientsForRecipe(pantryIngredients: string[]): {
    substantiveIngredients: string[]
    seasoningsAndEnhancers: string[]
    ingredientsByCategory: { [category: string]: string[] }
    prioritizedIngredients: string[]
  } {
    const substantiveIngredients: string[] = []
    const seasoningsAndEnhancers: string[] = []
    const ingredientsByCategory: { [category: string]: string[] } = {}
    
    pantryIngredients.forEach(item => {
      const ingredient = IngredientDatabase.findIngredient(item)
      
      if (ingredient) {
        // Categorize ingredients
        if (!ingredientsByCategory[ingredient.category]) {
          ingredientsByCategory[ingredient.category] = []
        }
        ingredientsByCategory[ingredient.category].push(ingredient.name)
        
        // Separate substantive vs enhancement ingredients
        if (ingredient.isSubstantive) {
          substantiveIngredients.push(ingredient.name)
        } else {
          seasoningsAndEnhancers.push(ingredient.name)
        }
      } else {
        // Unknown ingredient - treat as substantive by default
        substantiveIngredients.push(item)
        if (!ingredientsByCategory['other']) ingredientsByCategory['other'] = []
        ingredientsByCategory['other'].push(item)
      }
    })
    
    // Create prioritized list: proteins first, then vegetables, then grains, then others
    const priorityOrder = ['protein', 'vegetable', 'grain', 'dairy', 'fruit', 'other']
    const prioritizedIngredients: string[] = []
    
    priorityOrder.forEach(category => {
      if (ingredientsByCategory[category]) {
        prioritizedIngredients.push(...ingredientsByCategory[category])
      }
    })
    
    return {
      substantiveIngredients,
      seasoningsAndEnhancers,
      ingredientsByCategory,
      prioritizedIngredients
    }
  }

  private logError(context: string, error: any, silent: boolean = false) {
    if (!silent) {
      console.log(`ℹ️ ${context}: Using fallback due to: ${error.message || error}`)
    }
    // Only log detailed errors in development mode for debugging
    if (isDevelopment && !error.message?.includes('quota') && !error.message?.includes('billing')) {
      console.log(`🔧 Debug (${context}):`, error.message || error)
    }
  }

  // Image generation methods
  private async generateRecipeImage(recipe: Partial<AIRecipe>): Promise<{
    imageUrl?: string
    imagePrompt?: string
  }> {
    try {
      const imagePrompt = this.createImagePrompt(recipe)
      console.log('🎨 Generating recipe image...')
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      })

      const imageUrl = response.data?.[0]?.url
      
      if (imageUrl) {
        console.log('✅ Recipe image generated!')
        return { imageUrl, imagePrompt }
      } else {
        return { imagePrompt }
      }
      
    } catch (error: any) {
      // Silently handle common API issues
      if (error.message?.includes('billing') || error.message?.includes('quota')) {
        console.log('💳 Image generation unavailable - continuing without images')
      } else {
        this.logError('Image generation failed', error, true)
      }
      
      return { imagePrompt: this.createImagePrompt(recipe) }
    }
  }

  private createImagePrompt(recipe: Partial<AIRecipe>): string {
    const { title, cuisine, tags = [], ingredients = [] } = recipe
    
    const mainIngredients = ingredients.slice(0, 3).map(ing => ing.name?.toLowerCase()).join(', ')
    const cuisineStyle = cuisine ? ` in ${cuisine} style` : ''
    const isHealthy = tags.some(tag => ['healthy', 'light', 'nutritious'].includes(tag.toLowerCase()))
    const isComfort = tags.some(tag => ['comfort', 'cozy', 'hearty'].includes(tag.toLowerCase()))
    
    let styleDescriptor = ''
    if (isHealthy) {
      styleDescriptor = ', fresh and vibrant yet savory, colorful vegetables with rich flavors, appetizing presentation'
    } else if (isComfort) {
      styleDescriptor = ', warm and hearty, steaming hot, savory aromas visible, cozy and indulgent atmosphere'
    } else {
      styleDescriptor = ', incredibly savory and appetizing, perfectly seasoned, rich golden-brown colors'
    }
    
    return `A beautifully plated, ultra-realistic, high-resolution close-up photo of ${title?.toLowerCase() || 'delicious savory food'}${cuisineStyle}, featuring ${mainIngredients}. Professional food photography, shot with a DSLR camera, shallow depth of field, soft natural lighting, elegant presentation${styleDescriptor}, high quality, restaurant-style plating, white or neutral background. Perfectly cooked, fresh ingredients, appetizing textures, vibrant colors, golden-brown searing marks, rich savory colors, steam rising, mouth-watering and irresistible. No text, no hands, no utensils, no logos, no overlays. In the style of Bon Appétit magazine.`
  }

  // Recipe generation with images
  async generateRecipeWithImage(request: RecipeRequest, type: 'strict' | 'enhanced' = 'strict', userId?: string, enableImages: boolean = true): Promise<AIRecipe> {
    try {
      // Generate the recipe first
      const recipe = await this.generateSingleRecipe(request, type, userId)
      
      // Generate image if enabled
      if (enableImages) {
        const { imageUrl, imagePrompt } = await this.generateRecipeImage(recipe)
        recipe.imageUrl = imageUrl
        recipe.imagePrompt = imagePrompt
      }
      
      return recipe
    } catch (error) {
      this.logError('Error generating recipe with image', error, true)
      throw error
    }
  }

  // Placeholder for other methods - will add in next chunk
  async generateSingleRecipe(request: RecipeRequest, type: 'strict' | 'enhanced', userId?: string): Promise<AIRecipe> {
    try {
      // Debug logging for pantry-only recipes
      if (type === 'strict') {
        console.log('🥄 Generating pantry-only recipe...')
      }
      
      const prompt = type === 'strict' 
        ? await this.buildStrictPrompt(request, userId)
        : await this.buildEnhancedPrompt(request, userId)
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: `You are Chef Jeff, a warm and friendly AI cooking assistant with 20+ years of culinary expertise! Always respond with valid JSON only. ${type === 'strict' ? 'CRITICAL: For pantry-only recipes, you can ONLY use ingredients from the provided pantry list. NO EXCEPTIONS!' : ''}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 1.0,
        max_tokens: 1500,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response with better error handling
      let recipeData
      try {
        let cleanedResponse = response.trim()
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '')
        
        const jsonStart = cleanedResponse.indexOf('{')
        const jsonEnd = cleanedResponse.lastIndexOf('}')
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1)
        }
        
        recipeData = JSON.parse(cleanedResponse)
        
        if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
          throw new Error('Missing required recipe fields')
        }
        
      } catch (parseError: any) {
        this.logError(`JSON parsing failed for ${type} recipe`, parseError, true)
        return this.getFallbackRecipe(request, type, `Chef Jeff's ${type === 'strict' ? 'Pantry' : 'Enhanced'} Recipe`)
      }
      
      const recipe: AIRecipe = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + `_${type}`,
        ...recipeData,
        tags: [...(recipeData.tags || []), type === 'strict' ? 'pantry-only' : 'enhanced']
      }

      // Validate pantry-only recipes
      if (type === 'strict') {
        const pantryIngredients = request.pantryIngredients || []
        const normalizedPantry = pantryIngredients.map(item => item.toLowerCase().trim())
        
        // Common kitchen staples that Chef Jeff can use as enhancements
        const allowedEnhancements = [
          'salt', 'black pepper', 'white pepper', 'pepper', 'garlic powder', 'onion powder',
          'olive oil', 'vegetable oil', 'cooking oil', 'oil', 'butter',
          'lemon juice', 'lime juice', 'vinegar', 'white vinegar', 'apple cider vinegar',
          'oregano', 'thyme', 'paprika', 'cumin', 'red pepper flakes', 'chili flakes',
          'garlic', 'onion', 'parsley', 'basil', 'rosemary'
        ]
        
        const extraIngredients = recipe.ingredients.filter(ingredient => {
          const ingredientName = ingredient.name.toLowerCase()
          
          const isInPantry = normalizedPantry.some(pantryItem => 
            pantryItem.includes(ingredientName) || ingredientName.includes(pantryItem)
          )
          
          const isAllowedEnhancement = allowedEnhancements.some(enhancement =>
            ingredientName.includes(enhancement) || enhancement.includes(ingredientName)
          )
          
          return !isInPantry && !isAllowedEnhancement
        })
        
        if (extraIngredients.length > 0) {
          console.log('🔄 Adjusting recipe to use only pantry ingredients...')
          return this.getFallbackRecipe(request, type, `Chef Jeff's ${recipeData.title || 'Pantry Recipe'}`)
        } else {
          console.log('✅ Recipe validated - using only pantry ingredients!')
        }
      }

      return recipe
    } catch (error: any) {
      // Handle different types of errors gracefully
      if (error.message?.includes('quota') || error.message?.includes('billing')) {
        console.log('💳 API quota reached - using local recipes')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        console.log('🌐 Network issue - using local recipes')
      } else {
        this.logError(`${type} recipe generation failed`, error, true)
      }
      
      return this.getFallbackRecipe(request, type, `Chef Jeff's ${type === 'strict' ? 'Pantry' : 'Enhanced'} Recipe`)
    }
  }

  async generateDualRecipesProgressive(
    request: RecipeRequest, 
    userId?: string,
    onRecipeReady?: (recipeType: 'pantryOnly' | 'enhanced', recipe: AIRecipe) => void
  ): Promise<{
    pantryOnly: AIRecipe
    enhanced: AIRecipe
  }> {
    console.log('Generating dual recipes with progressive loading...')
    
    const pantryOnlyPromise = this.generateSingleRecipe(request, 'strict', userId)
      .then(recipe => {
        console.log('✅ Pantry-only recipe ready!')
        onRecipeReady?.('pantryOnly', recipe)
        return recipe
      })
      .catch(error => {
        this.logError('Pantry-only recipe failed', error, true)
        const fallback = this.getFallbackRecipe(request, 'strict', 'Pantry Fallback Recipe')
        onRecipeReady?.('pantryOnly', fallback)
        return fallback
      })

    const enhancedPromise = this.generateSingleRecipe(request, 'enhanced', userId)
      .then(recipe => {
        console.log('✅ Enhanced recipe ready!')
        onRecipeReady?.('enhanced', recipe)
        return recipe
      })
      .catch(error => {
        this.logError('Enhanced recipe failed', error, true)
        const fallback = this.getFallbackRecipe(request, 'enhanced', 'Enhanced Fallback Recipe')
        onRecipeReady?.('enhanced', fallback)
        return fallback
      })

    const [pantryOnlyRecipe, enhancedRecipe] = await Promise.all([
      pantryOnlyPromise,
      enhancedPromise
    ])

    return {
      pantryOnly: pantryOnlyRecipe,
      enhanced: enhancedRecipe
    }
  }

  async generateDualPantryRecipesProgressive(
    request: RecipeRequest, 
    userId?: string,
    onRecipeReady?: (recipeType: 'recipe1' | 'recipe2', recipe: AIRecipe) => void
  ): Promise<{
    recipe1: AIRecipe
    recipe2: AIRecipe
  }> {
    console.log('🍽️ Generating two unique pantry recipes...')
    
    const pantryIngredients = Array.isArray(request.pantryIngredients) ? request.pantryIngredients : []
    
    let subset1: string[]
    let subset2: string[]
    
    if (pantryIngredients.length < 2) {
      subset1 = subset2 = pantryIngredients
    } else {
      const shuffledIngredients = [...pantryIngredients].sort(() => Math.random() - 0.5)
      const midPoint = Math.ceil(shuffledIngredients.length / 2)
      
      subset1 = shuffledIngredients.slice(0, midPoint)
      if (shuffledIngredients.length > 3) {
        subset1.push(...shuffledIngredients.slice(midPoint, midPoint + Math.min(2, shuffledIngredients.length - midPoint)))
      }
      
      subset2 = shuffledIngredients.slice(midPoint)
      if (shuffledIngredients.length > 3) {
        subset2.push(...shuffledIngredients.slice(0, Math.min(2, midPoint)))
      }
    }
    
    const recipe1Promise = this.generateRecipeWithImage({
      ...request,
      pantryIngredients: subset1,
      specificRequest: `${request.specificRequest || ''} Create Recipe Option 1: Focus on ${subset1.join(', ')}. You don't need to use every ingredient - just the ones that work best together! MAKE IT SAVORY AND IRRESISTIBLE!`.trim()
    }, 'strict', userId, true)
      .then(recipe => {
        console.log('✅ First savory pantry recipe with image ready!')
        onRecipeReady?.('recipe1', recipe)
        return recipe
      })
      .catch(error => {
        this.logError('First pantry recipe failed', error, true)
        const fallback = this.getFallbackRecipe(request, 'strict', 'Savory Pantry Recipe Option 1')
        onRecipeReady?.('recipe1', fallback)
        return fallback
      })

    const recipe2Promise = this.generateRecipeWithImage({
      ...request,
      pantryIngredients: subset2,
      specificRequest: `${request.specificRequest || ''} Create Recipe Option 2: Focus on ${subset2.join(', ')} with a completely different cooking method or flavor profile! MAKE IT SAVORY AND MOUTH-WATERING!`.trim()
    }, 'strict', userId, true)
      .then(recipe => {
        console.log('✅ Second savory pantry recipe with image ready!')
        onRecipeReady?.('recipe2', recipe)
        return recipe
      })
      .catch(error => {
        this.logError('Second pantry recipe failed', error, true)
        const fallback = this.getFallbackRecipe(request, 'strict', 'Savory Pantry Recipe Option 2')
        onRecipeReady?.('recipe2', fallback)
        return fallback
      })

    const [recipe1, recipe2] = await Promise.all([
      recipe1Promise,
      recipe2Promise
    ])

    return { recipe1, recipe2 }
  }

  private async buildStrictPrompt(request: RecipeRequest, userId?: string): Promise<string> {
    const {
      pantryIngredients = [],
      dietaryRestrictions = [],
      cookingTime = 30,
      servings = 2,
      cuisine,
      difficulty = 'Easy',
      cookingMethod,
      avoidIngredients = [],
      specificRequest,
      mealType
    } = request

    const safeIngredients = Array.isArray(pantryIngredients) ? pantryIngredients : []
    
    // Intelligently organize ingredients using our database
    const {
      substantiveIngredients,
      seasoningsAndEnhancers,
      ingredientsByCategory,
      prioritizedIngredients
    } = this.organizeIngredientsForRecipe(safeIngredients)

    // Add creativity boosters and unique constraints
    const cookingStyles = [
      'stir-fry', 'one-pot', 'sheet pan', 'skillet', 'soup/stew', 'salad', 'bowl', 'wrap/sandwich', 
      'pasta', 'rice dish', 'grain bowl', 'casserole', 'curry', 'tacos/burrito', 'breakfast style'
    ]
    
    const flavorProfiles = [
      'Mediterranean', 'Asian-inspired', 'Mexican/Southwest', 'Indian spiced', 'Middle Eastern', 
      'Italian', 'Thai-style', 'Moroccan', 'Caribbean', 'Cajun/Creole', 'Greek', 'Japanese', 
      'Korean-inspired', 'Spanish', 'French rustic', 'American comfort', 'Nordic', 'Peruvian'
    ]
    
    const uniqueApproaches = [
      'Focus on umami-rich flavors', 'Create contrasting textures', 'Build layers of spice',
      'Emphasize fresh herb finish', 'Use acid to brighten flavors', 'Create temperature contrast',
      'Feature caramelized elements', 'Highlight natural sweetness', 'Add unexpected crunch',
      'Focus on aromatic appeal', 'Create colorful presentation', 'Emphasize comfort factor'
    ]

    // Randomly select creative constraints
    const randomStyle = cookingStyles[Math.floor(Math.random() * cookingStyles.length)]
    const randomFlavor = flavorProfiles[Math.floor(Math.random() * flavorProfiles.length)]
    const randomApproach = uniqueApproaches[Math.floor(Math.random() * uniqueApproaches.length)]
    
    // Add timestamp-based uniqueness
    const timeBasedSeed = Date.now().toString().slice(-3)
    const creativityModifier = parseInt(timeBasedSeed) % 5

    // Build intelligent ingredient sections for the AI
    const buildIngredientSection = () => {
      if (substantiveIngredients.length === 0) {
        return 'No main ingredients available - Please add proteins, vegetables, or grains to your pantry.'
      }
      
      let section = '🥩 MAIN INGREDIENTS (Build the recipe around these):\n'
      substantiveIngredients.forEach((item, index) => {
        const ingredient = IngredientDatabase.findIngredient(item)
        const categoryInfo = ingredient ? IngredientDatabase.getCategoryInfo(ingredient.category) : { emoji: '🥄', name: 'Other' }
        section += `${index + 1}. ${categoryInfo.emoji} ${item} (${categoryInfo.name})\n`
      })
      
      if (seasoningsAndEnhancers.length > 0) {
        section += '\n🧂 AVAILABLE SEASONINGS & ENHANCERS (Use to elevate flavors):\n'
        seasoningsAndEnhancers.forEach((item, index) => {
          section += `• ${item}\n`
        })
      }
      
      return section
    }

    let prompt = `You are Chef Jeff! With my 20+ years of culinary expertise, I'll create an INCREDIBLY SAVORY and MOUTH-WATERING recipe using your MAIN INGREDIENTS as the stars, enhanced with available seasonings and professional techniques. Let's make something that will make everyone SALIVATE!

${buildIngredientSection()}

⚡ CHEF JEFF'S ENHANCEMENT TOOLKIT (Optional but recommended):
- Basic seasonings: salt, black pepper, garlic powder, onion powder
- Cooking oils: olive oil, vegetable oil, butter
- Common acids: lemon juice, vinegar
- Basic dried herbs: oregano, thyme, paprika, cumin
- Heat: red pepper flakes, black pepper

🎯 MY INTELLIGENT SAVORY CULINARY APPROACH:
- Your MAIN INGREDIENTS (proteins, vegetables, grains) are the FOUNDATION of this SAVORY masterpiece
- Available seasonings and enhancers will ELEVATE these main ingredients to restaurant quality
- I'll build the recipe AROUND your main ingredients, using seasonings as flavor enhancers only
- I'll use professional techniques to create deep, rich, savory flavors that maximize each ingredient
- I'll create umami-rich, mouth-watering dishes that are hearty, satisfying, and irresistible
- FOCUS: Main ingredients are STARS, seasonings are SUPPORTING CAST for perfect savory harmony

⚡ PROFESSIONAL SAVORY TECHNIQUES I'LL USE:
- Proper searing and caramelization for deep, rich flavors
- Strategic seasoning at multiple cooking stages for savory depth
- Temperature control for perfect texture and maximum flavor extraction
- Flavor building through browning, deglazing, and umami enhancement
- Professional timing and mise en place for savory perfection
- Restaurant-style plating that showcases the savory appeal

RECIPE GUIDELINES:
- Cooking Time: Maximum ${cookingTime} minutes
- Servings: ${servings}
- Difficulty: ${difficulty}
${cuisine ? `- Cuisine Style: ${cuisine}` : ''}
${cookingMethod ? `- Preferred Method: ${cookingMethod}` : ''}
${dietaryRestrictions.length > 0 ? `- Dietary Restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${specificRequest ? `- Special Request: ${specificRequest}` : ''}

CHEF JEFF'S INTELLIGENT SAVORY PROMISE:
🍽️ I'll create a SAVORY dish that showcases your MAIN INGREDIENTS as the heroes of the plate
🧂 I'll use your available seasonings strategically to enhance and elevate the main ingredients
🔥 I'll apply professional techniques to maximize the natural flavors of your proteins, vegetables, and grains
✨ I'll make something SO SAVORY and irresistible that highlights why each main ingredient is essential
🤤 This will be a properly balanced dish where seasonings enhance, not overpower, the main ingredients!

⚠️ CRITICAL RULE: The recipe MUST be built around the MAIN INGREDIENTS listed above. Seasonings are only for enhancement and flavor development. NO recipe should be centered around just seasonings!

Please respond with a JSON object:
{
  "title": "Creative, appetizing name that highlights the main pantry ingredients",
  "description": "Enthusiastic description of the delicious dish and what makes it special",
  "ingredients": [
    {
      "name": "Main pantry ingredient or enhancement",
      "amount": "precise quantity",
      "unit": "measurement unit"
    }
  ],
  "instructions": [
    "Professional step with technique details and chef tips",
    "Flavor-building step with seasoning guidance",
    "Final step with presentation and serving suggestions"
  ],
  "cookingTime": ${cookingTime},
  "servings": ${servings},
  "difficulty": "${difficulty}",
  "cuisine": "Chef Jeff's Style",
  "tags": ["chef-created", "flavorful", "professional"],
  "nutritionInfo": {
    "calories": estimated_calories_per_serving,
    "protein": "protein content",
    "carbs": "carb content", 
    "fat": "fat content"
  }
}

CHEF JEFF'S PHILOSOPHY:
"Great cooking is about making ingredients taste like the best version of themselves. I'll use your pantry ingredients as the foundation and enhance them with professional techniques and strategic seasonings to create something truly delicious. No bland food in my kitchen!"

Make it AMAZING, Chef Jeff! 🔥`

    // Add user personalization if available
    if (userId) {
      try {
        const personalizationPrompt = await UserPreferencesService.getPersonalizationPrompt(userId)
        if (personalizationPrompt) {
          prompt += personalizationPrompt
        }
      } catch (error) {
        console.log('ℹ️ Personalization unavailable, using base prompt')
      }
    }

    return prompt
  }

  private async buildEnhancedPrompt(request: RecipeRequest, userId?: string): Promise<string> {
    const strictPrompt = await this.buildStrictPrompt(request, userId)
    return strictPrompt
      .replace('COMPLETELY UNIQUE PANTRY-ONLY', 'COMPLETELY UNIQUE ENHANCED')
      .replace('basic kitchen essentials: salt, pepper, oil, butter', 'basic essentials PLUS fresh herbs, spices, and common ingredients like lemon, garlic, onions')
      .replace('CHEF JEFF\'S CREATIVITY RULES:', 'CHEF JEFF\'S ENHANCED CREATIVITY RULES:\n0. I can add 3-5 fresh ingredients to make this amazing (herbs, spices, aromatics, acids)\n')
  }

  private getFallbackRecipe(request: RecipeRequest, type: 'strict' | 'enhanced', title: string): AIRecipe {
    const { pantryIngredients = [], cookingTime = 30, servings = 2 } = request
    const safeIngredients = Array.isArray(pantryIngredients) ? pantryIngredients : []
    
    // Intelligently organize ingredients for fallback recipe
    const {
      substantiveIngredients,
      seasoningsAndEnhancers,
      prioritizedIngredients
    } = this.organizeIngredientsForRecipe(safeIngredients)
    
    // Build recipe ingredients intelligently - main ingredients first, then seasonings
    const recipeIngredients = []
    
    // Add main ingredients with proper portions
    substantiveIngredients.forEach(ing => {
      const ingredient = IngredientDatabase.findIngredient(ing)
      recipeIngredients.push({
        name: ing,
        amount: ingredient?.category === 'protein' ? '1 lb' : 
                ingredient?.category === 'grain' ? '1 cup' :
                ingredient?.category === 'vegetable' ? '2 cups' : '1',
        unit: ingredient?.category === 'protein' ? '' : 
              ingredient?.category === 'grain' ? '' :
              ingredient?.category === 'vegetable' ? '' : 'portion'
      })
    })
    
    // Add available seasonings and enhancers
    seasoningsAndEnhancers.forEach(ing => {
      recipeIngredients.push({
        name: ing,
        amount: 'to taste',
        unit: ''
      })
    })
    
    // For enhanced recipes, add basic cooking essentials if not already present
    if (type === 'enhanced' && !seasoningsAndEnhancers.some(s => s.toLowerCase().includes('oil'))) {
      recipeIngredients.push({ name: 'Olive oil', amount: '2', unit: 'tbsp' })
    }
    if (type === 'enhanced' && !seasoningsAndEnhancers.some(s => s.toLowerCase().includes('salt'))) {
      recipeIngredients.push({ name: 'Salt', amount: 'to taste', unit: '' })
    }
    if (type === 'enhanced' && !seasoningsAndEnhancers.some(s => s.toLowerCase().includes('pepper'))) {
      recipeIngredients.push({ name: 'Black pepper', amount: 'to taste', unit: '' })
    }
    
    // Add default ingredients if none are present
    if (recipeIngredients.length === 0) {
      recipeIngredients.push({ name: 'Salt', amount: 'to taste', unit: '' })
      recipeIngredients.push({ name: 'Black pepper', amount: 'to taste', unit: '' })
    }
    
    // Create realistic instructions based on ingredients available
    const instructions = type === 'strict'
      ? safeIngredients.length === 1
        ? [
            `Prepare your ${safeIngredients[0].toLowerCase()} using proper knife work for even cooking`,
            `Heat your cooking surface to medium-high for optimal searing`,
            `Cook using professional technique - sear for color, then finish with gentle heat`,
            `Rest briefly before serving to retain juices - plate with restaurant-style presentation`
          ]
        : safeIngredients.length === 2
        ? [
            `Prepare your ingredients: ${safeIngredients.join(' and ')} with precise cuts for even cooking`,
            `Apply professional timing - start with the ingredient that takes longer to cook`,
            `Combine using proper heat control and chef techniques for maximum flavor`,
            `Plate thoughtfully and serve with professional presentation`
          ]
        : [
            `Mise en place: Prepare all pantry ingredients ${safeIngredients.join(', ')} with proper knife work`,
            `Apply professional cooking sequence - build flavors through proper timing`,
            `Use restaurant techniques to develop depth and texture from your ingredients`,
            `Finish with chef-level plating and serve with pride!`
          ]
      : [
          `Prepare your ingredients: ${safeIngredients.join(', ')}`,
          `Heat olive oil in a large pan over medium heat`,
          `Add ingredients and cook for 10-15 minutes`,
          `Season with salt and pepper to taste`,
          `Serve hot and enjoy!`
        ]
    
    // Create intelligent title based on main ingredients
    const createSmartTitle = () => {
      if (substantiveIngredients.length === 0) {
        return 'Chef Jeff\'s Simple Seasoning Guide'
      }
      
      if (substantiveIngredients.length === 1) {
        return `Savory ${substantiveIngredients[0]} Delight`
      }
      
      if (substantiveIngredients.length === 2) {
        return `${substantiveIngredients[0]} and ${substantiveIngredients[1]} Harmony`
      }
      
      // For multiple ingredients, highlight the protein if available, otherwise first two
      const proteins = substantiveIngredients.filter(ing => {
        const ingredient = IngredientDatabase.findIngredient(ing)
        return ingredient?.category === 'protein'
      })
      
      if (proteins.length > 0) {
        const otherIngredients = substantiveIngredients.filter(ing => !proteins.includes(ing)).slice(0, 2)
        return `Savory ${proteins[0]}${otherIngredients.length > 0 ? ` with ${otherIngredients.join(' and ')}` : ''} Masterpiece`
      }
      
      return `Chef Jeff's ${substantiveIngredients.slice(0, 2).join(' and ')} Creation`
    }
    
    const realisticTitle = createSmartTitle()
    
    return {
      id: Date.now().toString(),
      title: realisticTitle,
      description: (() => {
        if (substantiveIngredients.length === 0) {
          return 'A guide to using seasonings effectively. Please add main ingredients like proteins, vegetables, or grains to create a complete recipe.'
        }
        
        if (substantiveIngredients.length === 1) {
          return `A deliciously savory preparation showcasing ${substantiveIngredients[0].toLowerCase()} as the star ingredient, enhanced with proper seasoning and technique.`
        }
        
        return `A mouth-watering savory dish featuring ${substantiveIngredients.slice(0, 2).join(' and ')}${substantiveIngredients.length > 2 ? ` plus ${substantiveIngredients.length - 2} more ingredients` : ''}, perfectly seasoned and cooked to bring out maximum flavor.`
      })(),
      ingredients: recipeIngredients,
      instructions,
      cookingTime,
      servings,
      difficulty: 'Easy',
      cuisine: 'Simple',
      tags: type === 'strict' ? ['pantry-only', 'simple', 'realistic'] : ['quick', 'easy', 'pantry-friendly'],
      nutritionInfo: {
        calories: 300,
        protein: '15g',
        carbs: '20g',
        fat: '12g'
      }
    }
  }

  // Keep the original method for backward compatibility
  async generateRecipe(request: RecipeRequest, userId?: string): Promise<AIRecipe> {
    return this.generateSingleRecipe(request, 'strict', userId)
  }
}

export const aiRecipeGenerator = new AIRecipeGenerator() 
 