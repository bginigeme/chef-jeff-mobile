import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp,
  setDoc,
  increment
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { AIRecipe } from './aiRecipeService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  pantryItems: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  recipe: AIRecipe;
  isFavorite: boolean;
  userRating?: number;
  userNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  source: 'ai' | 'imported' | 'saved';
  sourceURL?: string;
}

export class FirebaseDatabaseService {
  // User Profile Operations
  static async createUserProfile(userId: string, profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    try {
      const docRef = doc(db, 'users', userId);
      const profileData = {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, profileData);
      
      return {
        id: userId,
        ...profile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    } catch (error) {
      console.log('❌ Firebase profile creation error details:', error);
      throw new Error('Failed to create user profile');
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: userId, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      throw new Error('Failed to get user profile');
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }

  private static async uploadImageIfRemote(userId: string, imageUrl?: string | null): Promise<string | undefined> {
    try {
      if (!imageUrl || imageUrl.length === 0) return undefined;
      // Upload only if it's a remote http(s) URL
      if (!/^https?:\/\//i.test(imageUrl)) return imageUrl;

      const response = await fetch(imageUrl);
      // Prefer blob upload in React Native/Expo
      const blob = await response.blob();
      const fileName = `users/${userId}/recipes/${Date.now()}/image.jpg`;
      const fileRef = ref(storage, fileName);

      // Let Storage infer content type
      await uploadBytes(fileRef, blob as any);
      const downloadURL = await getDownloadURL(fileRef);
      console.log('🖼️ Uploaded image to Storage:', fileName);
      return downloadURL;
    } catch (err: any) {
      console.log('⚠️ Image upload skipped (using original URL):', err?.code || err?.message || err);
      return undefined; // Fallback to original
    }
  }

  // Public helper for UI to upload an external image ahead of saving the recipe
  static async uploadExternalImage(userId: string, imageUrl: string): Promise<string | null> {
    const uploaded = await this.uploadImageIfRemote(userId, imageUrl);
    return uploaded ?? null;
  }

  // Recipe Operations
  static async saveRecipe(userId: string, recipe: AIRecipe, source: 'ai' | 'imported' | 'saved' = 'ai', sourceURL?: string): Promise<string> {
    try {
      // Attempt to upload image and replace with download URL
      let finalImageUrl = recipe.imageUrl;
      const uploaded = await this.uploadImageIfRemote(userId, recipe.imageUrl);
      if (uploaded) {
        finalImageUrl = uploaded;
      }

      const recipeToStore: AIRecipe = {
        ...recipe,
        imageUrl: finalImageUrl || recipe.imageUrl || '',
      };

      const recipeData: Omit<SavedRecipe, 'id'> = {
        userId,
        recipe: recipeToStore,
        isFavorite: false,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        source,
        sourceURL
      };
      
      const docRef = await addDoc(collection(db, 'recipes'), recipeData);
      console.log('🌩️ Saved recipe to Firestore:', { id: docRef.id, userId, source, title: recipe.title });
      return docRef.id;
    } catch (error) {
      console.log('❌ Firestore saveRecipe error:', error);
      throw new Error('Failed to save recipe');
    }
  }

  static async getUserRecipes(userId: string, limitCount: number = 50): Promise<SavedRecipe[]> {
    try {
      console.log('🔍 getUserRecipes: Starting query for userId:', userId);
      
      const q = query(
        collection(db, 'recipes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      console.log('🔍 getUserRecipes: Query created, executing...');
      const querySnapshot = await getDocs(q);
      console.log('🔍 getUserRecipes: Query result - docs count:', querySnapshot.docs.length);
      
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('🔍 getUserRecipes: Doc data:', { id: doc.id, userId: data.userId, title: data.title });
        return {
          id: doc.id,
          ...data
        };
      }) as SavedRecipe[];
      
      console.log('🔍 getUserRecipes: Returning results:', results.length);
      return results;
    } catch (error) {
      console.error('❌ getUserRecipes: Error details:', error);
      throw new Error('Failed to get user recipes');
    }
  }

  static async getFavoriteRecipes(userId: string): Promise<SavedRecipe[]> {
    try {
      const q = query(
        collection(db, 'recipes'),
        where('userId', '==', userId),
        where('isFavorite', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedRecipe[];
    } catch (error) {
      throw new Error('Failed to get favorite recipes');
    }
  }

  static async updateRecipe(recipeId: string, updates: Partial<SavedRecipe>): Promise<void> {
    try {
      const docRef = doc(db, 'recipes', recipeId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to update recipe');
    }
  }

  static async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const docRef = doc(db, 'recipes', recipeId);
      await deleteDoc(docRef);
    } catch (error) {
      throw new Error('Failed to delete recipe');
    }
  }

  static async toggleFavorite(recipeId: string, isFavorite: boolean): Promise<void> {
    try {
      const docRef = doc(db, 'recipes', recipeId);
      await updateDoc(docRef, { isFavorite, updatedAt: serverTimestamp() });
    } catch (error) {
      throw new Error('Failed to toggle favorite');
    }
  }

  static async rateRecipe(recipeId: string, rating: number): Promise<void> {
    try {
      const docRef = doc(db, 'recipes', recipeId);
      await updateDoc(docRef, { userRating: rating, updatedAt: serverTimestamp() });
    } catch (error) {
      throw new Error('Failed to rate recipe');
    }
  }

  static async searchRecipesByIngredients(userId: string, ingredients: string[]): Promise<SavedRecipe[]> {
    try {
      const q = query(
        collection(db, 'recipes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SavedRecipe[];
      return all.filter(r => r.recipe.ingredients.some(i => ingredients.some(q => i.name.toLowerCase().includes(q.toLowerCase()))));
    } catch (error) {
      throw new Error('Failed to search recipes');
    }
  }

  /**
   * Save a user rating in Firestore: users/{userId}/ratings/{recipeDocId}
   * Stores rating, timestamp, and lightweight recipe metadata for aggregation.
   */
  static async saveUserRating(userId: string, recipeDocId: string, recipe: AIRecipe, rating: 'like' | 'dislike'): Promise<void> {
    try {
      console.log('🔥 saveUserRating: Starting for user', userId, 'recipe', recipe.title)
      
      const ratingRef = doc(db, 'users', userId, 'ratings', recipeDocId);
      await setDoc(ratingRef, {
        rating,
        timestamp: serverTimestamp(),
        recipeId: recipe.id,
        title: recipe.title,
        ingredients: recipe.ingredients?.map(i => i.name) || [],
        difficulty: recipe.difficulty,
        cookingTime: recipe.cookingTime,
      }, { merge: true });

      // Maintain simple aggregates for profile display
      const prefRef = doc(db, 'users', userId, 'preferences', 'aggregates');
      
      try {
        // Try to update existing document
        await updateDoc(prefRef, {
          lastUpdated: serverTimestamp(),
          totalRated: increment(1),
          totalLikes: rating === 'like' ? increment(1) : increment(0),
          totalDislikes: rating === 'dislike' ? increment(1) : increment(0),
        });
        console.log('🔥 saveUserRating: Updated existing aggregates document')
      } catch (updateError) {
        // Document doesn't exist, create it
        console.log('🔥 saveUserRating: Creating new aggregates document')
        await setDoc(prefRef, {
          lastUpdated: serverTimestamp(),
          totalRated: 1,
          totalLikes: rating === 'like' ? 1 : 0,
          totalDislikes: rating === 'dislike' ? 1 : 0,
        });
        console.log('🔥 saveUserRating: Created new aggregates document')
      }
      
      console.log('🔥 saveUserRating: Successfully saved rating and updated aggregates')
    } catch (e) {
      console.log('⚠️ Failed to save user rating to Firestore:', e);
    }
  }
} 