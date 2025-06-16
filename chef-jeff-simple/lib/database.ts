import { supabaseDb } from './supabase'

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
export const getProfile = async (userId: string, accessToken?: string): Promise<Profile | null> => {
  const { data, error } = await supabaseDb.from('profiles').select('*', accessToken)

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  // Find the profile with matching id
  const profile = data?.find((p: Profile) => p.id === userId);
  return profile || null;
};

// Create user profile
export const createProfile = async (
  userId: string,
  email: string,
  profileData: {
    first_name: string;
    last_name: string;
  },
  accessToken?: string
): Promise<Profile | null> => {
  const { data, error } = await supabaseDb.from('profiles').insert({
    id: userId,
    email,
    ...profileData,
    pantry_items: [],
  }, accessToken);

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data?.[0] || null;
};

// Update pantry items
export const updatePantryItems = async (
  userId: string,
  pantryItems: string[],
  accessToken?: string
): Promise<Profile | null> => {
  const { data, error } = await supabaseDb.from('profiles').update({
    pantry_items: pantryItems,
    updated_at: new Date().toISOString(),
  }, `id=eq.${userId}`, accessToken);

  if (error) {
    console.error('Error updating pantry items:', error);
    throw error;
  }

  return data?.[0] || null;
}; 
 
 