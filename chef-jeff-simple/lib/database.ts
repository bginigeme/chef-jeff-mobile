import { supabase } from './supabase'

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  pantry_items: string[];
  created_at: string;
  updated_at: string;
}

// Get user profile
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId)

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  // Find the profile with matching id
  const profile = data?.[0];
  return profile || null;
};

// Create user profile
export const createProfile = async (
  userId: string,
  email: string,
  profileData: {
    first_name: string;
    last_name: string;
  }
): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').insert([
    {
      id: userId,
      email,
      ...profileData,
      pantry_items: [],
    }
  ]);

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data?.[0] || null;
};

// Update pantry items
export const updatePantryItems = async (
  userId: string,
  pantryItems: string[]
): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles')
    .update({
      pantry_items: pantryItems,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating pantry items:', error);
    throw error;
  }

  return data?.[0] || null;
}; 
 
 