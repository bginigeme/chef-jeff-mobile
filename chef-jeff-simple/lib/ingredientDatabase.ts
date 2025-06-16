export interface IngredientInfo {
  name: string
  category: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'seasoning' | 'fat' | 'fruit' | 'herb' | 'condiment'
  aliases: string[] // Alternative names users might type
  isSubstantive: boolean // True for main ingredients, false for seasonings/enhancers
}

export class IngredientDatabase {
  private static ingredients: IngredientInfo[] = [
    // PROTEINS
    { name: 'Chicken breast', category: 'protein', aliases: ['chicken', 'chicken breasts'], isSubstantive: true },
    { name: 'Ground beef', category: 'protein', aliases: ['beef', 'ground meat', 'hamburger'], isSubstantive: true },
    { name: 'Salmon', category: 'protein', aliases: ['salmon fillet', 'fish'], isSubstantive: true },
    { name: 'Pork chops', category: 'protein', aliases: ['pork', 'pork chop'], isSubstantive: true },
    { name: 'Turkey', category: 'protein', aliases: ['turkey breast', 'ground turkey'], isSubstantive: true },
    { name: 'Shrimp', category: 'protein', aliases: ['prawns', 'shrimps'], isSubstantive: true },
    { name: 'Tofu', category: 'protein', aliases: ['soy protein'], isSubstantive: true },
    { name: 'Eggs', category: 'protein', aliases: ['egg'], isSubstantive: true },
    { name: 'Black beans', category: 'protein', aliases: ['beans', 'black bean'], isSubstantive: true },
    { name: 'Lentils', category: 'protein', aliases: ['red lentils', 'green lentils'], isSubstantive: true },
    { name: 'Chickpeas', category: 'protein', aliases: ['garbanzo beans', 'chickpea'], isSubstantive: true },

    // VEGETABLES
    { name: 'Onions', category: 'vegetable', aliases: ['onion', 'yellow onion', 'white onion'], isSubstantive: true },
    { name: 'Garlic', category: 'vegetable', aliases: ['garlic cloves', 'fresh garlic'], isSubstantive: true },
    { name: 'Tomatoes', category: 'vegetable', aliases: ['tomato', 'fresh tomatoes'], isSubstantive: true },
    { name: 'Bell peppers', category: 'vegetable', aliases: ['peppers', 'bell pepper', 'red pepper', 'green pepper'], isSubstantive: true },
    { name: 'Carrots', category: 'vegetable', aliases: ['carrot'], isSubstantive: true },
    { name: 'Broccoli', category: 'vegetable', aliases: ['broccoli florets'], isSubstantive: true },
    { name: 'Spinach', category: 'vegetable', aliases: ['fresh spinach', 'baby spinach'], isSubstantive: true },
    { name: 'Mushrooms', category: 'vegetable', aliases: ['mushroom', 'button mushrooms', 'cremini'], isSubstantive: true },
    { name: 'Zucchini', category: 'vegetable', aliases: ['zucchinis'], isSubstantive: true },
    { name: 'Potatoes', category: 'vegetable', aliases: ['potato', 'russet potatoes'], isSubstantive: true },
    { name: 'Sweet potatoes', category: 'vegetable', aliases: ['sweet potato'], isSubstantive: true },
    { name: 'Cauliflower', category: 'vegetable', aliases: ['cauliflower florets'], isSubstantive: true },

    // GRAINS & STARCHES
    { name: 'Rice', category: 'grain', aliases: ['white rice', 'brown rice', 'jasmine rice'], isSubstantive: true },
    { name: 'Pasta', category: 'grain', aliases: ['spaghetti', 'penne', 'noodles'], isSubstantive: true },
    { name: 'Bread', category: 'grain', aliases: ['sandwich bread', 'loaf bread'], isSubstantive: true },
    { name: 'Quinoa', category: 'grain', aliases: [], isSubstantive: true },
    { name: 'Oats', category: 'grain', aliases: ['rolled oats', 'oatmeal'], isSubstantive: true },
    { name: 'Flour', category: 'grain', aliases: ['all-purpose flour', 'wheat flour'], isSubstantive: true },

    // DAIRY
    { name: 'Milk', category: 'dairy', aliases: ['whole milk', '2% milk'], isSubstantive: true },
    { name: 'Cheese', category: 'dairy', aliases: ['cheddar cheese', 'mozzarella'], isSubstantive: true },
    { name: 'Butter', category: 'dairy', aliases: ['unsalted butter'], isSubstantive: false },
    { name: 'Greek yogurt', category: 'dairy', aliases: ['yogurt'], isSubstantive: true },
    { name: 'Cream cheese', category: 'dairy', aliases: [], isSubstantive: true },
    { name: 'Heavy cream', category: 'dairy', aliases: ['heavy whipping cream'], isSubstantive: false },

    // SEASONINGS & SPICES
    { name: 'Salt', category: 'seasoning', aliases: ['table salt', 'sea salt'], isSubstantive: false },
    { name: 'Black pepper', category: 'seasoning', aliases: ['pepper', 'ground black pepper'], isSubstantive: false },
    { name: 'Garlic powder', category: 'seasoning', aliases: [], isSubstantive: false },
    { name: 'Onion powder', category: 'seasoning', aliases: [], isSubstantive: false },
    { name: 'Paprika', category: 'seasoning', aliases: [], isSubstantive: false },
    { name: 'Cumin', category: 'seasoning', aliases: ['ground cumin'], isSubstantive: false },
    { name: 'Oregano', category: 'seasoning', aliases: ['dried oregano'], isSubstantive: false },
    { name: 'Thyme', category: 'seasoning', aliases: ['dried thyme'], isSubstantive: false },
    { name: 'Red pepper flakes', category: 'seasoning', aliases: ['chili flakes', 'crushed red pepper'], isSubstantive: false },
    { name: 'Lowry\'s Seasoned Salt', category: 'seasoning', aliases: ['lowrys', 'lowry\'s', 'lowrys seasoned salt', 'seasoned salt'], isSubstantive: false },
    { name: 'Italian seasoning', category: 'seasoning', aliases: ['italian herbs'], isSubstantive: false },
    { name: 'Cinnamon', category: 'seasoning', aliases: ['ground cinnamon'], isSubstantive: false },
    { name: 'Chili powder', category: 'seasoning', aliases: [], isSubstantive: false },

    // FRESH HERBS
    { name: 'Fresh basil', category: 'herb', aliases: ['basil'], isSubstantive: false },
    { name: 'Fresh parsley', category: 'herb', aliases: ['parsley'], isSubstantive: false },
    { name: 'Fresh cilantro', category: 'herb', aliases: ['cilantro'], isSubstantive: false },
    { name: 'Fresh rosemary', category: 'herb', aliases: ['rosemary'], isSubstantive: false },

    // FATS & OILS
    { name: 'Olive oil', category: 'fat', aliases: ['extra virgin olive oil', 'EVOO'], isSubstantive: false },
    { name: 'Vegetable oil', category: 'fat', aliases: ['cooking oil'], isSubstantive: false },
    { name: 'Coconut oil', category: 'fat', aliases: [], isSubstantive: false },

    // FRUITS
    { name: 'Apples', category: 'fruit', aliases: ['apple'], isSubstantive: true },
    { name: 'Bananas', category: 'fruit', aliases: ['banana'], isSubstantive: true },
    { name: 'Lemons', category: 'fruit', aliases: ['lemon'], isSubstantive: true },
    { name: 'Limes', category: 'fruit', aliases: ['lime'], isSubstantive: true },

    // CONDIMENTS
    { name: 'Soy sauce', category: 'condiment', aliases: [], isSubstantive: false },
    { name: 'Vinegar', category: 'condiment', aliases: ['white vinegar', 'apple cider vinegar'], isSubstantive: false },
    { name: 'Honey', category: 'condiment', aliases: [], isSubstantive: false },
    { name: 'Mustard', category: 'condiment', aliases: ['dijon mustard'], isSubstantive: false },
    { name: 'Hot sauce', category: 'condiment', aliases: [], isSubstantive: false },
  ]

  // Find ingredient by name or alias
  static findIngredient(input: string): IngredientInfo | null {
    const normalizedInput = input.toLowerCase().trim()
    
    // First try exact name match
    const exactMatch = this.ingredients.find(ing => 
      ing.name.toLowerCase() === normalizedInput
    )
    if (exactMatch) return exactMatch

    // Then try alias match
    const aliasMatch = this.ingredients.find(ing =>
      ing.aliases.some(alias => alias.toLowerCase() === normalizedInput)
    )
    if (aliasMatch) return aliasMatch

    // Finally try partial match (contains)
    const partialMatch = this.ingredients.find(ing =>
      ing.name.toLowerCase().includes(normalizedInput) ||
      ing.aliases.some(alias => alias.toLowerCase().includes(normalizedInput)) ||
      normalizedInput.includes(ing.name.toLowerCase())
    )
    
    return partialMatch || null
  }

  // Get suggestions for autocomplete
  static getSuggestions(input: string, limit = 5): IngredientInfo[] {
    if (!input || input.length < 2) return []
    
    const normalizedInput = input.toLowerCase().trim()
    const suggestions: IngredientInfo[] = []

    // Priority 1: Exact matches
    this.ingredients.forEach(ing => {
      if (ing.name.toLowerCase().startsWith(normalizedInput)) {
        suggestions.push(ing)
      }
    })

    // Priority 2: Alias matches
    this.ingredients.forEach(ing => {
      if (!suggestions.includes(ing)) {
        if (ing.aliases.some(alias => alias.toLowerCase().startsWith(normalizedInput))) {
          suggestions.push(ing)
        }
      }
    })

    // Priority 3: Contains matches
    this.ingredients.forEach(ing => {
      if (!suggestions.includes(ing)) {
        if (ing.name.toLowerCase().includes(normalizedInput) ||
            ing.aliases.some(alias => alias.toLowerCase().includes(normalizedInput))) {
          suggestions.push(ing)
        }
      }
    })

    return suggestions.slice(0, limit)
  }

  // Validate pantry composition
  static validatePantryItems(items: string[]): {
    valid: boolean
    substantiveCount: number
    enhancerCount: number
    missingCategories: string[]
    suggestions: string[]
  } {
    const substantiveIngredients = items.filter(item => {
      const ingredient = this.findIngredient(item)
      return ingredient?.isSubstantive
    })

    const enhancerIngredients = items.filter(item => {
      const ingredient = this.findIngredient(item)
      return ingredient && !ingredient.isSubstantive
    })

    // Check for missing essential categories
    const presentCategories = new Set(
      items.map(item => this.findIngredient(item)?.category).filter(Boolean)
    )

    const missingCategories: string[] = []
    const suggestions: string[] = []

    if (!presentCategories.has('protein')) {
      missingCategories.push('protein')
      suggestions.push('Add a protein like chicken, beef, or eggs')
    }

    if (!presentCategories.has('vegetable') && !presentCategories.has('grain')) {
      missingCategories.push('vegetable or grain')
      suggestions.push('Add vegetables like onions, peppers, or a grain like rice')
    }

    return {
      valid: substantiveIngredients.length >= 2,
      substantiveCount: substantiveIngredients.length,
      enhancerCount: enhancerIngredients.length,
      missingCategories,
      suggestions
    }
  }

  // Get category display info
  static getCategoryInfo(category: string) {
    const categoryMap = {
      protein: { emoji: '🥩', name: 'Proteins', color: '#EF4444' },
      vegetable: { emoji: '🥕', name: 'Vegetables', color: '#10B981' },
      grain: { emoji: '🌾', name: 'Grains & Starches', color: '#F59E0B' },
      dairy: { emoji: '🥛', name: 'Dairy', color: '#3B82F6' },
      seasoning: { emoji: '🧂', name: 'Seasonings', color: '#6B7280' },
      herb: { emoji: '🌿', name: 'Fresh Herbs', color: '#10B981' },
      fat: { emoji: '🫒', name: 'Oils & Fats', color: '#F59E0B' },
      fruit: { emoji: '🍎', name: 'Fruits', color: '#EC4899' },
      condiment: { emoji: '🍯', name: 'Condiments', color: '#8B5CF6' }
    }
    return categoryMap[category as keyof typeof categoryMap] || { emoji: '🥄', name: 'Other', color: '#6B7280' }
  }

  // Get all ingredients by category
  static getIngredientsByCategory(): { [category: string]: IngredientInfo[] } {
    const byCategory: { [category: string]: IngredientInfo[] } = {}
    
    this.ingredients.forEach(ingredient => {
      if (!byCategory[ingredient.category]) {
        byCategory[ingredient.category] = []
      }
      byCategory[ingredient.category].push(ingredient)
    })

    return byCategory
  }
} 