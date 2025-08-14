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

// Get user profile with timeout protection
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    // Add timeout protection to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000); // 5 second timeout
    });

    const fetchPromise = supabase.from('profiles').select('*').eq('id', userId);
    
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const { data, error } = result;

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // Find the profile with matching id
    const profile = data?.[0];
    return profile || null;
  } catch (error) {
    console.error('Profile fetch failed (timeout or error):', error);
    return null;
  }
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
  console.log('🔍 updatePantryItems called with:')
  console.log('  - userId:', userId)
  console.log('  - pantryItems:', pantryItems)
  
  // First, check if the profile exists
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  console.log('🔍 Existing profile check:')
  console.log('  - existingProfile:', existingProfile)
  console.log('  - selectError:', selectError)
  
  if (selectError) {
    console.error('❌ Error checking existing profile:', selectError);
    throw selectError;
  }
  
  if (!existingProfile) {
    console.error('❌ No profile found for user:', userId);
    throw new Error('Profile not found');
  }
  
  // Now try the update
  const { data, error } = await supabase.from('profiles')
    .update({
      pantry_items: pantryItems,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(); // Add .select() to return the updated data

  console.log('🔍 Supabase update response:')
  console.log('  - data:', data)
  console.log('  - error:', error)

  if (error) {
    console.error('❌ Error updating pantry items:', error);
    throw error;
  }

  const result = data?.[0] || null;
  console.log('🔍 Returning profile:', result)
  return result;
}; 
 
 