import { supabase } from './config';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  dietary_restrictions: string[];
  cooking_skill_level: string;
  pantry_items: string[];
  created_at: string;
  updated_at: string;
}

export interface RemixedRecipe {
  id?: string;
  user_id: string;
  original_recipe_id: number;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  servings: number;
  cook_time: number;
  created_at?: string;
  updated_at?: string;
}

// Get user profile
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

// Create user profile
export const createProfile = async (
  userId: string,
  email: string,
  profileData: {
    first_name: string;
    last_name: string;
    dietary_restrictions: string[];
    cooking_skill_level: string;
  }
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      ...profileData,
      pantry_items: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data;
};

// Update user profile
export const updateProfile = async (
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>>
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
};

// Update pantry items
export const updatePantryItems = async (
  userId: string,
  pantryItems: string[]
): Promise<Profile | null> => {
  return updateProfile(userId, { pantry_items: pantryItems });
};

// Save remixed recipe
export const saveRemixedRecipe = async (
  userId: string,
  recipeData: Omit<RemixedRecipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<RemixedRecipe | null> => {
  const { data, error } = await supabase
    .from('remixed_recipes')
    .insert({
      user_id: userId,
      ...recipeData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving remixed recipe:', error);
    throw error;
  }

  return data;
};

// Get user's remixed recipes
export const getUserRemixedRecipes = async (userId: string): Promise<RemixedRecipe[]> => {
  const { data, error } = await supabase
    .from('remixed_recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching remixed recipes:', error);
    return [];
  }

  return data || [];
};

// Delete remixed recipe
export const deleteRemixedRecipe = async (recipeId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('remixed_recipes')
    .delete()
    .eq('id', recipeId);

  if (error) {
    console.error('Error deleting remixed recipe:', error);
    return false;
  }

  return true;
}; 