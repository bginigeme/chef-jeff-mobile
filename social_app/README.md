# Chef Jeff - Social Cooking App

A React-based social cooking application that helps users create recipes based on the ingredients they have in their pantry, with a unique "remix" feature for personalizing recipes.

## Features

- **User Authentication**: Sign up and sign in with Supabase Auth
- **Profile Creation**: Set up user profiles with dietary restrictions and cooking skill level
- **Pantry Management**: Add and manage pantry ingredients
- **Recipe Discovery**: Get real recipes from Spoonacular API based on available ingredients
- **Recipe Remix**: Personalize and save modified versions of recipes to your profile
- **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack

- React 18 with TypeScript
- Supabase (Authentication & PostgreSQL Database)
- Spoonacular API for recipe data
- Tailwind CSS for styling
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase project
- A Spoonacular API key

### Supabase Setup

1. Create a new Supabase project at [https://app.supabase.com/](https://app.supabase.com/)

2. Enable Authentication:
   - Go to Authentication > Settings
   - Enable "Email" provider
   - Configure any additional settings as needed

3. Create the profiles table in your database:
   ```sql
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
     email TEXT NOT NULL,
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     dietary_restrictions TEXT[] DEFAULT '{}',
     cooking_skill_level TEXT NOT NULL DEFAULT 'beginner',
     pantry_items TEXT[] DEFAULT '{}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create remixed recipes table
   CREATE TABLE remixed_recipes (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
     original_recipe_id INTEGER NOT NULL,
     title TEXT NOT NULL,
     ingredients TEXT[] NOT NULL,
     instructions TEXT NOT NULL,
     notes TEXT DEFAULT '',
     servings INTEGER NOT NULL DEFAULT 4,
     cook_time INTEGER NOT NULL DEFAULT 30,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE remixed_recipes ENABLE ROW LEVEL SECURITY;

   -- Create policies for profiles
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can insert own profile" ON profiles
     FOR INSERT WITH CHECK (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);

   -- Create policies for remixed recipes
   CREATE POLICY "Users can view own remixed recipes" ON remixed_recipes
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own remixed recipes" ON remixed_recipes
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own remixed recipes" ON remixed_recipes
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own remixed recipes" ON remixed_recipes
     FOR DELETE USING (auth.uid() = user_id);
   ```

4. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy the Project URL and anon public key

5. Update Supabase configuration:
   - Update the values in `src/supabase/config.ts` with your actual Supabase credentials

### Spoonacular API Setup

1. Create a free account at [https://spoonacular.com/food-api](https://spoonacular.com/food-api)

2. Get your API key from the dashboard

3. Update the API key in `src/services/recipeService.ts`:
   ```javascript
   const SPOONACULAR_API_KEY = 'your-actual-api-key-here';
   ```

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chef-jeff
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update configuration files:
   - Update Supabase config in `src/supabase/config.ts`
   - Update Spoonacular API key in `src/services/recipeService.ts`

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Create Profile**: Fill in your personal information, dietary restrictions, and cooking skill level
3. **Setup Pantry**: Add ingredients you have available in your pantry
4. **Discover Recipes**: View recipe suggestions from Spoonacular based on your pantry items
5. **Remix Recipes**: Click "Remix" on any recipe to personalize it and save to your profile

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── SignIn.tsx
│   │   └── SignUp.tsx
│   ├── Profile/
│   │   └── CreateProfile.tsx
│   ├── Pantry/
│   │   └── PantrySetup.tsx
│   ├── Recipe/
│   │   └── RecipeCard.tsx
│   └── Dashboard/
│       └── Dashboard.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   └── recipeService.ts
├── supabase/
│   ├── config.ts
│   └── database.ts
├── types/
│   └── auth.ts
├── App.tsx
├── index.tsx
└── index.css
```

## API Usage

### Spoonacular API
- **Free Tier**: 150 requests per day
- **findByIngredients**: Finds recipes based on available ingredients
- **Recipe Information**: Gets detailed recipe instructions and information

### Rate Limiting
The app includes fallback recipes when the Spoonacular API limit is reached or unavailable.

## Database Schema

### Profiles Table
- `id`: UUID (references auth.users)
- `email`: User's email address
- `first_name`: User's first name  
- `last_name`: User's last name
- `dietary_restrictions`: Array of dietary restrictions
- `cooking_skill_level`: beginner | intermediate | advanced
- `pantry_items`: Array of available ingredients
- `created_at`: Profile creation timestamp
- `updated_at`: Last update timestamp

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (not recommended)

## Future Enhancements

- **Recipe Remix System**: Save and share personalized recipe modifications
- **Social Features**: Follow other users and share recipes
- **Shopping List Generation**: Create shopping lists from missing ingredients
- **Meal Planning**: Plan meals for the week
- **Recipe Rating & Reviews**: Rate and review recipes
- **Advanced Search & Filtering**: Filter by cuisine, cook time, difficulty
- **Recipe Collections**: Create and share recipe collections

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 