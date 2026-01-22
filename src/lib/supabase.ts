// ============================================
// ワンパン・バディ - Supabase Client
// ============================================

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============ Database Types ============

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          household_size: number;
          dislikes: string[];
          kitchen_equipment: {
            stove_count: number;
            has_microwave: boolean;
            has_oven: boolean;
            has_rice_cooker: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          description: string;
          cooking_time_minutes: number;
          difficulty: 'easy' | 'medium' | 'hard';
          category: 'japanese' | 'western' | 'chinese' | 'asian' | 'other';
          ingredients: unknown; // JSONB
          steps: unknown; // JSONB
          tags: string[];
          image_url: string | null;
          servings: number;
          is_bento_friendly: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>;
      };
      weekly_plans: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          recipe_id: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner';
          status: 'planned' | 'cooked' | 'skipped';
          scale_factor: number;
          is_for_bento: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weekly_plans']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['weekly_plans']['Insert']>;
      };
      shopping_list: {
        Row: {
          id: string;
          user_id: string;
          item_name: string;
          quantity: string;
          category: string;
          is_checked: boolean;
          is_manual_add: boolean;
          source_plans: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shopping_list']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['shopping_list']['Insert']>;
      };
      pantry: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          quantity: string | null;
          expiry_date: string | null;
          added_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pantry']['Row'], 'id' | 'added_at'>;
        Update: Partial<Database['public']['Tables']['pantry']['Insert']>;
      };
      cooking_logs: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          photo_url: string | null;
          rating: number;
          memo: string | null;
          cooked_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cooking_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cooking_logs']['Insert']>;
      };
    };
  };
};

// ============ Helper Functions ============

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
