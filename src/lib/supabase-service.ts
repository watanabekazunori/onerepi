// ============================================
// Onerepi - Supabase Service Layer
// All database operations with offline fallback
// ============================================

import { supabase, getCurrentUser } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ Types ============

export interface UserProfile {
  id?: string;
  user_id?: string;
  name: string;
  cooking_skill: 'beginner' | 'normal' | 'expert';
  cooking_time_preference: string;
  interests: string[];
  seasonings: string[];
  dislikes?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CookingFeedback {
  id?: string;
  user_id?: string;
  recipe_id: string;
  rating: number; // 1-5
  taste_rating?: number; // 1-5
  difficulty_rating?: number; // 1-5
  would_make_again: boolean;
  notes?: string;
  photo_url?: string;
  cooked_at: string;
  created_at?: string;
}

export interface UserPreference {
  id?: string;
  user_id?: string;
  preference_type: 'like' | 'dislike' | 'favorite' | 'avoid';
  category: 'ingredient' | 'cuisine' | 'cooking_method' | 'flavor';
  value: string;
  strength: number; // 1-10
  source: 'explicit' | 'inferred'; // explicit = user said it, inferred = learned from feedback
  created_at?: string;
}

export interface AIGeneratedRecipe {
  id?: string;
  user_id?: string;
  input_ingredients: string[];
  generated_recipe: {
    name: string;
    emoji: string;
    description: string;
    ingredients: { name: string; amount: string; unit: string }[];
    steps: { step: number; instruction: string; time?: number; tip?: string }[];
    cooking_time: number;
    difficulty: string;
    nutrition?: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  };
  was_cooked: boolean;
  feedback_id?: string;
  created_at?: string;
}

// ============ Storage Keys ============

const STORAGE_KEYS = {
  USER_PROFILE: 'onerepi_user_profile',
  COOKING_FEEDBACK: 'onerepi_cooking_feedback',
  USER_PREFERENCES: 'onerepi_user_preferences',
  AI_RECIPES: 'onerepi_ai_recipes',
  ONBOARDING_COMPLETED: 'onerepi_onboarding_completed',
};

// ============ Supabase Service ============

class SupabaseService {
  // --------- User Profile ---------

  async saveUserProfile(profile: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    try {
      const user = await getCurrentUser();

      if (user) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            ...profile,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        // Also save locally for offline access
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data));
        return data;
      } else {
        // Not logged in - save locally only
        const localProfile: UserProfile = {
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localProfile));
        return localProfile;
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      // Fallback to local storage
      const localProfile: UserProfile = {
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localProfile));
      return localProfile;
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await getCurrentUser();

      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data));
          return data;
        }
      }

      // Fallback to local storage
      const localData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      const localData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return localData ? JSON.parse(localData) : null;
    }
  }

  // --------- Cooking Feedback ---------

  async saveCookingFeedback(feedback: Omit<CookingFeedback, 'id' | 'user_id' | 'created_at'>): Promise<CookingFeedback> {
    try {
      const user = await getCurrentUser();
      const feedbackWithMeta: CookingFeedback = {
        ...feedback,
        user_id: user?.id,
        created_at: new Date().toISOString(),
      };

      if (user) {
        const { data, error } = await supabase
          .from('cooking_feedback')
          .insert({
            ...feedbackWithMeta,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local cache
        await this.updateLocalFeedbackCache(data);

        // Learn from feedback
        await this.learnFromFeedback(data);

        return data;
      } else {
        // Save locally
        await this.updateLocalFeedbackCache(feedbackWithMeta);
        await this.learnFromFeedback(feedbackWithMeta);
        return feedbackWithMeta;
      }
    } catch (error) {
      console.error('Error saving cooking feedback:', error);
      const feedbackWithMeta: CookingFeedback = {
        ...feedback,
        created_at: new Date().toISOString(),
      };
      await this.updateLocalFeedbackCache(feedbackWithMeta);
      return feedbackWithMeta;
    }
  }

  private async updateLocalFeedbackCache(feedback: CookingFeedback): Promise<void> {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.COOKING_FEEDBACK);
    const feedbackList: CookingFeedback[] = existing ? JSON.parse(existing) : [];
    feedbackList.push(feedback);
    await AsyncStorage.setItem(STORAGE_KEYS.COOKING_FEEDBACK, JSON.stringify(feedbackList));
  }

  async getCookingHistory(): Promise<CookingFeedback[]> {
    try {
      const user = await getCurrentUser();

      if (user) {
        const { data, error } = await supabase
          .from('cooking_feedback')
          .select('*')
          .eq('user_id', user.id)
          .order('cooked_at', { ascending: false });

        if (data) {
          await AsyncStorage.setItem(STORAGE_KEYS.COOKING_FEEDBACK, JSON.stringify(data));
          return data;
        }
      }

      const localData = await AsyncStorage.getItem(STORAGE_KEYS.COOKING_FEEDBACK);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Error getting cooking history:', error);
      const localData = await AsyncStorage.getItem(STORAGE_KEYS.COOKING_FEEDBACK);
      return localData ? JSON.parse(localData) : [];
    }
  }

  // --------- Preference Learning ---------

  private async learnFromFeedback(feedback: CookingFeedback): Promise<void> {
    // This is where the magic happens - learning user preferences from feedback
    try {
      // If rating is high (4-5), learn positive preferences
      if (feedback.rating >= 4) {
        // TODO: Extract recipe details and save as positive preferences
        // For example: if user liked a spicy dish, increase preference for spicy
      }

      // If rating is low (1-2), learn negative preferences
      if (feedback.rating <= 2) {
        // TODO: Extract what they didn't like and save as negative preferences
      }

      // If would_make_again is true, mark as favorite
      if (feedback.would_make_again) {
        await this.addUserPreference({
          preference_type: 'favorite',
          category: 'ingredient', // This would be determined by recipe analysis
          value: feedback.recipe_id,
          strength: feedback.rating * 2,
          source: 'inferred',
        });
      }
    } catch (error) {
      console.error('Error learning from feedback:', error);
    }
  }

  async addUserPreference(
    preference: Omit<UserPreference, 'id' | 'user_id' | 'created_at'>
  ): Promise<void> {
    try {
      const user = await getCurrentUser();

      if (user) {
        await supabase.from('user_preferences').insert({
          ...preference,
          user_id: user.id,
        });
      }

      // Also save locally
      const existing = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const preferences: UserPreference[] = existing ? JSON.parse(existing) : [];
      preferences.push({
        ...preference,
        created_at: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error adding user preference:', error);
    }
  }

  async getUserPreferences(): Promise<UserPreference[]> {
    try {
      const user = await getCurrentUser();

      if (user) {
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id);

        if (data) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data));
          return data;
        }
      }

      const localData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      const localData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return localData ? JSON.parse(localData) : [];
    }
  }

  // --------- AI Generated Recipes ---------

  async saveAIRecipe(recipe: Omit<AIGeneratedRecipe, 'id' | 'user_id' | 'created_at'>): Promise<AIGeneratedRecipe> {
    try {
      const user = await getCurrentUser();
      const recipeWithMeta: AIGeneratedRecipe = {
        ...recipe,
        user_id: user?.id,
        created_at: new Date().toISOString(),
      };

      if (user) {
        const { data, error } = await supabase
          .from('ai_generated_recipes')
          .insert({
            ...recipeWithMeta,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        await this.updateLocalAIRecipeCache(data);
        return data;
      } else {
        await this.updateLocalAIRecipeCache(recipeWithMeta);
        return recipeWithMeta;
      }
    } catch (error) {
      console.error('Error saving AI recipe:', error);
      const recipeWithMeta: AIGeneratedRecipe = {
        ...recipe,
        created_at: new Date().toISOString(),
      };
      await this.updateLocalAIRecipeCache(recipeWithMeta);
      return recipeWithMeta;
    }
  }

  private async updateLocalAIRecipeCache(recipe: AIGeneratedRecipe): Promise<void> {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.AI_RECIPES);
    const recipes: AIGeneratedRecipe[] = existing ? JSON.parse(existing) : [];
    recipes.push(recipe);
    await AsyncStorage.setItem(STORAGE_KEYS.AI_RECIPES, JSON.stringify(recipes));
  }

  async getAIRecipeHistory(): Promise<AIGeneratedRecipe[]> {
    try {
      const user = await getCurrentUser();

      if (user) {
        const { data } = await supabase
          .from('ai_generated_recipes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          await AsyncStorage.setItem(STORAGE_KEYS.AI_RECIPES, JSON.stringify(data));
          return data;
        }
      }

      const localData = await AsyncStorage.getItem(STORAGE_KEYS.AI_RECIPES);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      const localData = await AsyncStorage.getItem(STORAGE_KEYS.AI_RECIPES);
      return localData ? JSON.parse(localData) : [];
    }
  }

  // --------- Sync & Migration ---------

  async syncLocalDataToCloud(): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Sync profile
      const localProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (localProfile) {
        const profile = JSON.parse(localProfile);
        await supabase.from('user_profiles').upsert({
          ...profile,
          user_id: user.id,
        });
      }

      // Sync feedback
      const localFeedback = await AsyncStorage.getItem(STORAGE_KEYS.COOKING_FEEDBACK);
      if (localFeedback) {
        const feedbackList: CookingFeedback[] = JSON.parse(localFeedback);
        for (const feedback of feedbackList) {
          if (!feedback.user_id) {
            await supabase.from('cooking_feedback').insert({
              ...feedback,
              user_id: user.id,
            });
          }
        }
      }

      // Sync preferences
      const localPrefs = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (localPrefs) {
        const prefsList: UserPreference[] = JSON.parse(localPrefs);
        for (const pref of prefsList) {
          if (!pref.user_id) {
            await supabase.from('user_preferences').insert({
              ...pref,
              user_id: user.id,
            });
          }
        }
      }

      console.log('Local data synced to cloud');
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }

  // --------- Onboarding State ---------

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
  }

  async isOnboardingCompleted(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return value ? JSON.parse(value) : false;
  }
}

export const supabaseService = new SupabaseService();
