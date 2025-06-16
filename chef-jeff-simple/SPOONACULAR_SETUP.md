# 🥄 Spoonacular API Integration Setup

Chef Jeff now supports **Spoonacular API** integration for access to over 5,000 professional recipes! This gives you the best of both worlds: Chef Jeff's AI creativity + real professional recipes.

## ✨ What You Get

- **5,000+ Professional Recipes** from real chefs and food blogs
- **Professional Food Photos** instead of AI-generated images
- **Detailed Nutritional Information** calculated by professionals
- **Recipe Ratings & Reviews** from real users
- **Ingredient Substitutions** and cooking tips
- **Dietary Filters** (vegan, gluten-free, keto, etc.)
- **Lightning Fast Search** by ingredients in your pantry

## 🔑 Get Your API Key (FREE!)

1. **Visit**: https://spoonacular.com/food-api
2. **Sign Up** for a free account
3. **Choose the FREE plan**: 150 requests/day (perfect for testing)
4. **Copy your API key** from the dashboard

## 📱 Add to Chef Jeff

### Step 1: Add to Environment Variables

Add this line to your `.env` file:
```bash
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_actual_api_key_here
```

### Step 2: Restart Expo
```bash
npx expo start --clear
```

## 🚀 How It Works

The enhanced recipe system gives you **multiple options**:

### 1. **Instant Recipes** (5-20ms) ⚡
```javascript
// Your existing fast AI recipes + cached Spoonacular
const instantRecipes = await enhancedFastRecipeGenerator.getInstantRecipes(
  ['chicken', 'rice', 'vegetables'], 
  { maxResults: 5, maxCookingTime: 30 }
);
```

### 2. **Best of Both Worlds** (1-3s) 🌟
```javascript
// AI creativity + professional recipes
const allRecipes = await enhancedFastRecipeGenerator.findBestRecipes(
  ['chicken', 'rice', 'vegetables'],
  { 
    maxResults: 8,
    includeSpoonacular: true,
    includeAI: true,
    diet: 'vegetarian',
    maxCookingTime: 45
  }
);
```

### 3. **Professional Only** 👨‍🍳
```javascript
// Only Spoonacular professional recipes
const professionalRecipes = await enhancedFastRecipeGenerator.findBestRecipes(
  ['pasta', 'tomatoes', 'basil'],
  { 
    spoonacularOnly: true,
    cuisine: 'italian',
    diet: 'vegetarian'
  }
);
```

### 4. **Recipe Search** 🔍
```javascript
// Search by query instead of ingredients
const pastaRecipes = await enhancedFastRecipeGenerator.searchSpoonacularByQuery(
  'healthy pasta recipes',
  { number: 6, maxReadyTime: 30, diet: 'vegetarian' }
);
```

### 5. **Random Inspiration** 🎲
```javascript
// Get random professional recipes for inspiration
const randomRecipes = await enhancedFastRecipeGenerator.getRandomRecipes({
  number: 3,
  tags: 'healthy,quick',
  includeNutrition: true
});
```

## 🎯 Features

### Recipe Sources
- **AI Generated**: Your creative fast recipes (5-20ms)
- **Spoonacular**: Professional recipes with photos (1-2s)
- **Hybrid**: AI creativity enhanced with professional inspiration

### Smart Filtering
- **Dietary Restrictions**: Vegan, vegetarian, gluten-free, keto, etc.
- **Cooking Time**: Filter by preparation time
- **Difficulty Level**: Easy, medium, hard
- **Cuisine Type**: Italian, Asian, Mexican, etc.
- **Health Score**: Spoonacular's nutritional rating
- **Popularity**: Based on user likes and ratings

### Enhanced Recipe Data
```javascript
// Each Spoonacular recipe includes:
{
  // Standard recipe format
  title: "Professional Recipe Name",
  ingredients: [...],
  instructions: [...],
  
  // Enhanced Spoonacular data
  imageUrl: "https://spoonacular.com/recipe-image.jpg",
  nutritionInfo: {
    calories: 350,
    protein: "25g",
    carbs: "30g", 
    fat: "12g"
  },
  spoonacularData: {
    sourceUrl: "https://original-recipe-blog.com",
    healthScore: 85,
    aggregateLikes: 156,
    pricePerServing: 2.45,
    diets: ["vegetarian", "gluten-free"],
    dishTypes: ["main course", "dinner"]
  }
}
```

## 🔧 Integration in Chef Jeff

The enhanced system automatically:

1. **Checks your pantry items** against both AI and Spoonacular
2. **Ranks recipes** by ingredient match score
3. **Boosts highly-rated** professional recipes
4. **Provides fallbacks** if APIs fail
5. **Caches results** for faster subsequent searches

## 💡 Usage Tips

### For Speed
- Use `getInstantRecipes()` for immediate results
- AI recipes generate in 5-20ms
- Cached Spoonacular results are instant

### For Quality  
- Use `findBestRecipes()` for the best mix
- Professional recipes have tested instructions
- Real food photos look amazing

### For Variety
- Combine both sources for maximum options
- Use random recipes for cooking inspiration
- Search by cuisine for themed meals

## 🛡️ Error Handling

The system gracefully handles:
- **API failures**: Falls back to AI recipes
- **Rate limits**: Uses cached results
- **Network issues**: Continues with available sources
- **Missing keys**: Works without Spoonacular (AI only)

## 📊 Performance

- **AI Only**: 5-20ms (your existing system)
- **Spoonacular Only**: 1-3 seconds
- **Hybrid Mode**: 1-3 seconds (parallel processing)
- **Cached Results**: Instant

## 🎉 Ready to Cook!

Once you add your API key, Chef Jeff will automatically start using both AI creativity and professional recipes to give you the ultimate cooking experience!

**Free Tier Limits**:
- 150 requests/day
- Perfect for personal use
- Upgrade available for production apps 