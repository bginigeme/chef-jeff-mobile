# 🍳 Chef Jeff - AI-Powered Cooking Assistant

Chef Jeff is an intelligent React Native mobile app that generates personalized recipes using GPT-4 based on your pantry ingredients and mood preferences.

## ✨ Features

### 🤖 AI Recipe Generation
- **GPT-4 Powered**: Uses OpenAI's GPT-4 to create custom recipes
- **Mood-Based Cooking**: Select your mood to get recipes that match your feelings
- **Pantry-First**: Recipes are generated based on ingredients you actually have
- **Nutritional Info**: Get estimated calories, protein, carbs, and fat content

### 🧘‍♀️ Mood Selection
Choose from 8 different moods to personalize your cooking experience:
- 🫂 **Comfort**: Cozy, warm, and satisfying dishes
- ⚡ **Energized**: Fresh, vibrant, and invigorating meals
- 💕 **Romantic**: Elegant, intimate, and special recipes
- 🎯 **Focused**: Simple, nutritious, and brain-boosting foods
- 🌟 **Adventurous**: Bold, exotic, and experimental cuisine
- 📸 **Nostalgic**: Classic, familiar, and heartwarming dishes
- 🥗 **Healthy**: Light, nutritious, and clean eating
- 🍰 **Indulgent**: Rich, decadent, and treat-yourself recipes

### 👤 User Profiles
- **Personalized Pantry**: Store and manage your ingredients
- **Preference Learning**: The app learns your taste preferences over time
- **Recipe History**: Track your generated recipes and favorites

### 🎨 Beautiful UI
- **Animated Splash Screen**: Custom Chef Jeff logo animation
- **Modern Design**: Clean, intuitive interface with Chef Jeff branding
- **Responsive**: Smooth animations and user interactions

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- React Native development environment
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd chef-jeff-simple
   npm install
   ```

2. **Set up OpenAI API Key:**
   - Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Configure Supabase:**
   - The app uses Supabase for user authentication and data storage
   - Update `lib/supabase.ts` with your Supabase credentials if needed

4. **Run the app:**
   ```bash
   npx expo start
   ```

### Database Schema

The app uses the following Supabase tables:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  pantry_items TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 How It Works

1. **User Authentication**: Sign up/sign in with email and password
2. **Profile Setup**: Add your name and pantry ingredients
3. **Mood Selection**: Choose how you're feeling (optional)
4. **AI Generation**: Chef Jeff creates a personalized recipe using GPT-4
5. **Recipe Display**: View detailed recipe with ingredients, instructions, and nutrition
6. **Continuous Learning**: The system learns from your preferences over time

## 🛠 Technical Architecture

### AI Recipe Generation
- **OpenAI Integration**: Uses GPT-4 with structured prompts
- **Fallback System**: Provides backup recipes if AI fails
- **JSON Parsing**: Structured recipe data format
- **Error Handling**: Graceful degradation for network issues

### State Management
- **React Hooks**: Local state with useState and useEffect
- **AsyncStorage**: Persistent session storage
- **Real-time Updates**: Automatic recipe regeneration on pantry/mood changes

### Components
- `AIRecipeCard`: Displays generated recipes with mood indicators
- `MoodSelector`: Horizontal mood selection interface
- `AIRecipeDetailModal`: Full recipe view with ingredients and instructions
- `SplashScreen`: Animated Chef Jeff logo on app launch

### API Structure
- **REST Integration**: Direct API calls to Supabase and OpenAI
- **Session Management**: JWT token handling for authentication
- **Network Resilience**: Retry logic and offline handling

## 🎯 Future Features

- **Recipe Rating System**: Learn from user feedback
- **Dietary Restrictions**: Filter recipes by allergies/preferences
- **Shopping Lists**: Generate grocery lists from recipes
- **Meal Planning**: Weekly meal planning with AI suggestions
- **Social Features**: Share recipes with friends
- **Voice Interface**: "Hey Chef Jeff, what can I make?"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📱 Screenshots

- **Splash Screen**: Animated Chef Jeff logo
- **Sign-in**: Beautiful onboarding experience
- **Mood Selection**: Interactive mood picker
- **Recipe Generation**: AI loading states
- **Recipe Details**: Comprehensive recipe view

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **OpenAI**: For providing the GPT-4 API
- **Supabase**: For backend infrastructure
- **Expo**: For React Native development platform
- **React Native**: For cross-platform mobile framework

---

**Chef Jeff** - Your personal AI cooking assistant! 🧑‍🍳✨ 
 
 