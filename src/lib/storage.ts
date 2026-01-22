// ============================================
// ワンパン・バディ - Storage Utilities
// AsyncStorage を使ったデータ永続化
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyPlan, Recipe, DayOfWeek, IngredientCategory, Ingredient } from '../types';

// Storage Keys
const STORAGE_KEYS = {
  WEEKLY_PLANS: '@onepan_weekly_plans',
  USER_PREFERENCES: '@onepan_user_preferences',
  ONBOARDING_COMPLETED: '@onepan_onboarding_completed',
  SHOPPING_LIST: '@onepan_shopping_list',
  INVENTORY: '@onepan_inventory',
  FAVORITES: '@onepan_favorites',
  COOKING_LOG: '@onepan_cooking_log',
  RECIPE_NOTES: '@onepan_recipe_notes',
  USER_STATS: '@onepan_user_stats',
};

// 週間献立の型
export interface StoredWeeklyPlan {
  id: string;
  weekStart: string; // YYYY-MM-DD
  plans: {
    [key in DayOfWeek]?: {
      recipeId: string;
      recipe: Recipe;
      scaleFactor: number;
      isForBento: boolean;
    };
  };
  sharedIngredients: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 週間献立の保存・読み込み
// ============================================

/**
 * 週間献立を保存
 */
export const saveWeeklyPlan = async (plan: StoredWeeklyPlan): Promise<void> => {
  try {
    // 既存のプランを取得
    const existingPlans = await getWeeklyPlans();

    // 同じ週のプランがあれば更新、なければ追加
    const existingIndex = existingPlans.findIndex(p => p.weekStart === plan.weekStart);

    if (existingIndex >= 0) {
      existingPlans[existingIndex] = {
        ...plan,
        updatedAt: new Date().toISOString(),
      };
    } else {
      existingPlans.push({
        ...plan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLANS, JSON.stringify(existingPlans));
  } catch (error) {
    console.error('Failed to save weekly plan:', error);
    throw error;
  }
};

/**
 * すべての週間献立を取得
 */
export const getWeeklyPlans = async (): Promise<StoredWeeklyPlan[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_PLANS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get weekly plans:', error);
    return [];
  }
};

/**
 * 特定の週の献立を取得
 */
export const getWeeklyPlanByWeekStart = async (weekStart: string): Promise<StoredWeeklyPlan | null> => {
  try {
    const plans = await getWeeklyPlans();
    return plans.find(p => p.weekStart === weekStart) || null;
  } catch (error) {
    console.error('Failed to get weekly plan:', error);
    return null;
  }
};

/**
 * 現在の週の献立を取得
 */
export const getCurrentWeekPlan = async (): Promise<StoredWeeklyPlan | null> => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekStart = monday.toISOString().split('T')[0];

  return getWeeklyPlanByWeekStart(weekStart);
};

/**
 * 週間献立を削除
 */
export const deleteWeeklyPlan = async (weekStart: string): Promise<void> => {
  try {
    const plans = await getWeeklyPlans();
    const filteredPlans = plans.filter(p => p.weekStart !== weekStart);
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLANS, JSON.stringify(filteredPlans));
  } catch (error) {
    console.error('Failed to delete weekly plan:', error);
    throw error;
  }
};

// ============================================
// WeeklyPlan 型への変換（既存の型との互換性）
// ============================================

/**
 * StoredWeeklyPlan を WeeklyPlan[] に変換
 */
export const convertToWeeklyPlans = (stored: StoredWeeklyPlan): WeeklyPlan[] => {
  const plans: WeeklyPlan[] = [];
  const dayOrder: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // weekStart から各曜日の日付を計算
  const mondayDate = new Date(stored.weekStart);

  dayOrder.forEach((day, index) => {
    const planForDay = stored.plans[day];
    if (planForDay) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + index);
      const dateString = date.toISOString().split('T')[0];

      plans.push({
        id: `${stored.id}-${day}`,
        user_id: 'local_user',
        date: dateString,
        meal_type: 'dinner',
        recipe_id: planForDay.recipeId,
        recipe: planForDay.recipe,
        status: 'planned',
        scale_factor: planForDay.scaleFactor,
        is_for_bento: planForDay.isForBento,
        created_at: stored.createdAt,
      });
    }
  });

  return plans;
};

// ============================================
// ユーザー設定
// ============================================

export interface UserPreferences {
  name: string;
  household: number;
  tastePreferences: string[];
  healthGoals: string[];
  dislikes: string[];
  allergies: string[];
  cookingSkill: string;
  kitchenEquipment: string[];
  pantrySeasonings: string[]; // 常備調味料リスト
}

// デフォルトの常備調味料リスト（オンボーディングで選択肢として表示）
export const DEFAULT_SEASONINGS = {
  basic: [
    { name: '醤油', emoji: '🫗' },
    { name: '塩', emoji: '🧂' },
    { name: '砂糖', emoji: '🍬' },
    { name: 'みりん', emoji: '🍶' },
    { name: '酒', emoji: '🍶' },
    { name: '味噌', emoji: '🥣' },
    { name: '酢', emoji: '🫙' },
  ],
  oils: [
    { name: 'サラダ油', emoji: '🫒' },
    { name: 'ごま油', emoji: '🥜' },
    { name: 'オリーブオイル', emoji: '🫒' },
  ],
  chinese: [
    { name: '鶏がらスープの素', emoji: '🍲' },
    { name: '豆板醤', emoji: '🌶️' },
    { name: 'オイスターソース', emoji: '🦪' },
  ],
  western: [
    { name: 'ケチャップ', emoji: '🍅' },
    { name: 'マヨネーズ', emoji: '🥚' },
    { name: 'コンソメ', emoji: '🧊' },
    { name: 'バター', emoji: '🧈' },
  ],
  other: [
    { name: 'にんにく', emoji: '🧄' },
    { name: '生姜', emoji: '🫚' },
    { name: '塩こしょう', emoji: '🧂' },
    { name: 'ナンプラー', emoji: '🐟' },
    { name: '小麦粉', emoji: '🌾' },
    { name: '片栗粉', emoji: '🥔' },
  ],
};

// 全調味料をフラットなリストで取得
export const getAllSeasoningOptions = (): { name: string; emoji: string; category: string }[] => {
  const result: { name: string; emoji: string; category: string }[] = [];
  Object.entries(DEFAULT_SEASONINGS).forEach(([category, items]) => {
    items.forEach(item => {
      result.push({ ...item, category });
    });
  });
  return result;
};

export const saveUserPreferences = async (prefs: UserPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw error;
  }
};

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return null;
  }
};

// ============================================
// オンボーディング状態
// ============================================

export const setOnboardingCompleted = async (completed: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
  } catch (error) {
    console.error('Failed to save onboarding status:', error);
    throw error;
  }
};

export const isOnboardingCompleted = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    if (!data) return false;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get onboarding status:', error);
    return false;
  }
};

// ============================================
// 買い物リスト
// ============================================

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: string;
  checked: boolean;
  recipeIds: string[];
}

export const saveShoppingList = async (items: ShoppingItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save shopping list:', error);
    throw error;
  }
};

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get shopping list:', error);
    return [];
  }
};

// ============================================
// 在庫管理
// ============================================

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity?: string;
  unit?: string;
  expiryDate?: string;
  addedAt: string;
}

export const saveInventory = async (items: InventoryItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save inventory:', error);
    throw error;
  }
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get inventory:', error);
    return [];
  }
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'addedAt'>): Promise<void> => {
  const items = await getInventory();
  const newItem: InventoryItem = {
    ...item,
    id: `inv-${Date.now()}-${Math.random()}`,
    addedAt: new Date().toISOString(),
  };
  items.push(newItem);
  await saveInventory(items);
};

export const removeInventoryItem = async (itemId: string): Promise<void> => {
  const items = await getInventory();
  const filtered = items.filter(i => i.id !== itemId);
  await saveInventory(filtered);
};

// ============================================
// お気に入りレシピ
// ============================================

export const saveFavorites = async (recipeIds: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(recipeIds));
  } catch (error) {
    console.error('Failed to save favorites:', error);
    throw error;
  }
};

export const getFavorites = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
};

export const toggleFavorite = async (recipeId: string): Promise<boolean> => {
  const favorites = await getFavorites();
  const index = favorites.indexOf(recipeId);
  if (index >= 0) {
    favorites.splice(index, 1);
    await saveFavorites(favorites);
    return false;
  } else {
    favorites.push(recipeId);
    await saveFavorites(favorites);
    return true;
  }
};

export const isFavorite = async (recipeId: string): Promise<boolean> => {
  const favorites = await getFavorites();
  return favorites.includes(recipeId);
};

// ============================================
// 料理ログ・履歴
// ============================================

export interface CookingLogEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeEmoji: string;
  cookedAt: string;
  rating?: number; // 1-5
  notes?: string;
  photoUri?: string;
  savedAmount?: number; // 節約額
}

export const saveCookingLog = async (logs: CookingLogEntry[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COOKING_LOG, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save cooking log:', error);
    throw error;
  }
};

export const getCookingLog = async (): Promise<CookingLogEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COOKING_LOG);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get cooking log:', error);
    return [];
  }
};

export const addCookingLogEntry = async (entry: Omit<CookingLogEntry, 'id' | 'cookedAt'>): Promise<void> => {
  const logs = await getCookingLog();
  const newEntry: CookingLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random()}`,
    cookedAt: new Date().toISOString(),
  };
  logs.unshift(newEntry); // 新しいものを先頭に
  await saveCookingLog(logs);

  // 統計も更新
  await updateStatsOnCook(entry.savedAmount);
};

// ============================================
// レシピメモ・評価
// ============================================

export interface RecipeNote {
  recipeId: string;
  rating?: number; // 1-5
  notes?: string;
  updatedAt: string;
}

export const saveRecipeNotes = async (notes: Record<string, RecipeNote>): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECIPE_NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to save recipe notes:', error);
    throw error;
  }
};

export const getRecipeNotes = async (): Promise<Record<string, RecipeNote>> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECIPE_NOTES);
    if (!data) return {};
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get recipe notes:', error);
    return {};
  }
};

export const updateRecipeNote = async (recipeId: string, update: Partial<RecipeNote>): Promise<void> => {
  const notes = await getRecipeNotes();
  notes[recipeId] = {
    ...notes[recipeId],
    recipeId,
    ...update,
    updatedAt: new Date().toISOString(),
  };
  await saveRecipeNotes(notes);
};

export const getRecipeNote = async (recipeId: string): Promise<RecipeNote | null> => {
  const notes = await getRecipeNotes();
  return notes[recipeId] || null;
};

// ============================================
// ユーザー統計・実績
// ============================================

export interface UserStats {
  totalCookedCount: number;
  currentStreak: number; // 連続自炊日数
  longestStreak: number;
  lastCookedDate?: string;
  totalSavedAmount: number; // 累計節約額
  weeklyGoal: number; // 週間目標（回数）
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earnedAt: string;
}

const DEFAULT_STATS: UserStats = {
  totalCookedCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalSavedAmount: 0,
  weeklyGoal: 5,
  badges: [],
};

export const saveUserStats = async (stats: UserStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save user stats:', error);
    throw error;
  }
};

export const getUserStats = async (): Promise<UserStats> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATS);
    if (!data) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return DEFAULT_STATS;
  }
};

// 料理完了時に統計を更新
const updateStatsOnCook = async (savedAmount?: number): Promise<void> => {
  const stats = await getUserStats();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  stats.totalCookedCount += 1;

  if (savedAmount) {
    stats.totalSavedAmount += savedAmount;
  }

  // ストリーク計算
  if (stats.lastCookedDate === yesterday) {
    stats.currentStreak += 1;
  } else if (stats.lastCookedDate !== today) {
    stats.currentStreak = 1;
  }

  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  stats.lastCookedDate = today;

  // バッジチェック
  checkAndAwardBadges(stats);

  await saveUserStats(stats);
};

// バッジ獲得チェック
const checkAndAwardBadges = (stats: UserStats): void => {
  const badges = stats.badges;
  const earnedIds = new Set(badges.map(b => b.id));

  const possibleBadges: Omit<Badge, 'earnedAt'>[] = [
    { id: 'first_cook', name: '初めての一歩', emoji: '👶', description: '初めて料理を記録した' },
    { id: 'cook_10', name: '料理人見習い', emoji: '🍳', description: '10回料理した' },
    { id: 'cook_50', name: '料理人', emoji: '👨‍🍳', description: '50回料理した' },
    { id: 'cook_100', name: 'マスターシェフ', emoji: '🏆', description: '100回料理した' },
    { id: 'streak_3', name: '3日坊主突破', emoji: '🔥', description: '3日連続で自炊した' },
    { id: 'streak_7', name: '1週間の習慣', emoji: '💪', description: '7日連続で自炊した' },
    { id: 'streak_30', name: '自炊マスター', emoji: '🌟', description: '30日連続で自炊した' },
    { id: 'saved_1000', name: '節約の達人', emoji: '💰', description: '1,000円節約した' },
    { id: 'saved_10000', name: '倹約家', emoji: '💎', description: '10,000円節約した' },
  ];

  possibleBadges.forEach(badge => {
    if (earnedIds.has(badge.id)) return;

    let earned = false;
    switch (badge.id) {
      case 'first_cook': earned = stats.totalCookedCount >= 1; break;
      case 'cook_10': earned = stats.totalCookedCount >= 10; break;
      case 'cook_50': earned = stats.totalCookedCount >= 50; break;
      case 'cook_100': earned = stats.totalCookedCount >= 100; break;
      case 'streak_3': earned = stats.currentStreak >= 3; break;
      case 'streak_7': earned = stats.currentStreak >= 7; break;
      case 'streak_30': earned = stats.currentStreak >= 30; break;
      case 'saved_1000': earned = stats.totalSavedAmount >= 1000; break;
      case 'saved_10000': earned = stats.totalSavedAmount >= 10000; break;
    }

    if (earned) {
      stats.badges.push({
        ...badge,
        earnedAt: new Date().toISOString(),
      });
    }
  });
};

// 今週の料理回数を取得
export const getWeeklyCookCount = async (): Promise<number> => {
  const logs = await getCookingLog();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  return logs.filter(log => new Date(log.cookedAt) >= monday).length;
};

// ============================================
// 買い物リスト自動生成
// ============================================

export interface GeneratedShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  checked: boolean;
  recipeIds: string[];
  recipeNames: string[];
}

/**
 * 週間献立から買い物リストを自動生成
 * - 常備調味料は除外
 * - 在庫にある材料はチェック済みにする
 * - 同じ材料は合算
 */
export const generateShoppingListFromPlan = async (): Promise<GeneratedShoppingItem[]> => {
  const storedPlan = await getCurrentWeekPlan();
  if (!storedPlan) return [];

  const inventory = await getInventory();
  const inventoryNames = new Set(inventory.map(i => i.name.toLowerCase()));

  // 常備調味料を取得
  const userPrefs = await getUserPreferences();
  const pantrySeasonings = new Set(
    (userPrefs?.pantrySeasonings || []).map(s => s.toLowerCase())
  );

  // 材料を集約するためのマップ
  const ingredientMap = new Map<string, GeneratedShoppingItem>();

  // 各日の献立からの材料を収集
  const dayKeys: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  dayKeys.forEach(day => {
    const planForDay = storedPlan.plans[day];
    if (!planForDay?.recipe) return;

    const recipe = planForDay.recipe;
    const scaleFactor = planForDay.scaleFactor || 1;

    recipe.ingredients.forEach((ingredient: Ingredient) => {
      // 常備調味料は買い物リストから完全除外
      if (pantrySeasonings.has(ingredient.name.toLowerCase())) {
        return;
      }

      const key = `${ingredient.name}-${ingredient.unit}`;
      const existing = ingredientMap.get(key);

      if (existing) {
        // 既存の材料に追加
        existing.amount += ingredient.amount * scaleFactor;
        if (!existing.recipeIds.includes(recipe.id)) {
          existing.recipeIds.push(recipe.id);
          existing.recipeNames.push(recipe.name);
        }
      } else {
        // 新しい材料を追加
        const isInInventory = inventoryNames.has(ingredient.name.toLowerCase());
        ingredientMap.set(key, {
          id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: ingredient.name,
          amount: ingredient.amount * scaleFactor,
          unit: ingredient.unit,
          category: ingredient.category,
          checked: isInInventory,
          recipeIds: [recipe.id],
          recipeNames: [recipe.name],
        });
      }
    });
  });

  // マップから配列に変換してソート
  const items = Array.from(ingredientMap.values());

  // カテゴリ順でソート（protein > vegetable > grain > dairy > seasoning > other）
  const categoryOrder: Record<IngredientCategory, number> = {
    protein: 0,
    vegetable: 1,
    grain: 2,
    dairy: 3,
    seasoning: 4,
    other: 5,
  };

  items.sort((a, b) => {
    const orderA = categoryOrder[a.category] ?? 99;
    const orderB = categoryOrder[b.category] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, 'ja');
  });

  return items;
};

/**
 * 買い物リストのチェック状態を保存
 */
export const saveShoppingListCheckedState = async (
  checkedItems: Record<string, boolean>
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.SHOPPING_LIST}_checked`,
      JSON.stringify(checkedItems)
    );
  } catch (error) {
    console.error('Failed to save shopping list checked state:', error);
  }
};

/**
 * 買い物リストのチェック状態を取得
 */
export const getShoppingListCheckedState = async (): Promise<Record<string, boolean>> => {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.SHOPPING_LIST}_checked`);
    if (!data) return {};
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get shopping list checked state:', error);
    return {};
  }
};

// ============================================
// ストレージクリア（デバッグ用）
// ============================================

export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
};

// ============================================
// 先取り調理ヒント機能
// ============================================

export interface AdvancePrepHint {
  ingredientName: string;
  ingredientEmoji: string;
  todayRecipe: string;
  tomorrowRecipe: string;
  hint: string;
  category: IngredientCategory;
}

/**
 * 今日と明日で共通の材料を検出し、先取り調理のヒントを返す
 * @param weekStart 週の開始日（YYYY-MM-DD形式）
 * @param todayDayKey 今日の曜日キー（mon, tue, ...）
 */
export const getAdvancePrepHints = async (
  weekStart: string,
  todayDayKey: DayOfWeek
): Promise<AdvancePrepHint[]> => {
  const storedPlan = await getWeeklyPlanByWeekStart(weekStart);
  if (!storedPlan) return [];

  const dayOrder: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const todayIndex = dayOrder.indexOf(todayDayKey);

  // 日曜日は翌日がないので空配列を返す
  if (todayIndex === -1 || todayIndex === 6) return [];

  const tomorrowDayKey = dayOrder[todayIndex + 1];

  const todayPlan = storedPlan.plans[todayDayKey];
  const tomorrowPlan = storedPlan.plans[tomorrowDayKey];

  if (!todayPlan?.recipe || !tomorrowPlan?.recipe) return [];

  // 今日と明日のレシピから材料を取得（肉・魚・野菜のみ対象）
  const todayIngredients = todayPlan.recipe.ingredients.filter(
    i => i.category === 'protein' || i.category === 'vegetable'
  );
  const tomorrowIngredients = tomorrowPlan.recipe.ingredients.filter(
    i => i.category === 'protein' || i.category === 'vegetable'
  );

  // 明日の材料名をSetに
  const tomorrowIngredientNames = new Set(
    tomorrowIngredients.map(i => i.name.toLowerCase())
  );

  // 共通材料を検出
  const hints: AdvancePrepHint[] = [];

  todayIngredients.forEach(todayIng => {
    if (tomorrowIngredientNames.has(todayIng.name.toLowerCase())) {
      const emoji = getIngredientEmoji(todayIng.name, todayIng.category);
      hints.push({
        ingredientName: todayIng.name,
        ingredientEmoji: emoji,
        todayRecipe: todayPlan.recipe!.name,
        tomorrowRecipe: tomorrowPlan.recipe!.name,
        hint: `明日の「${tomorrowPlan.recipe!.name}」でも使います。2日分まとめて切ると楽！`,
        category: todayIng.category,
      });
    }
  });

  return hints;
};

/**
 * モックデータ用: 今日と明日の献立から先取りヒントを取得
 */
export const getAdvancePrepHintsFromMockPlans = (
  todayRecipe: { name: string; ingredients: Ingredient[] } | null,
  tomorrowRecipe: { name: string; ingredients: Ingredient[] } | null
): AdvancePrepHint[] => {
  if (!todayRecipe || !tomorrowRecipe) return [];

  // 今日と明日のレシピから材料を取得（肉・魚・野菜のみ対象）
  const todayIngredients = todayRecipe.ingredients.filter(
    i => i.category === 'protein' || i.category === 'vegetable'
  );
  const tomorrowIngredients = tomorrowRecipe.ingredients.filter(
    i => i.category === 'protein' || i.category === 'vegetable'
  );

  // 明日の材料名をSetに
  const tomorrowIngredientNames = new Set(
    tomorrowIngredients.map(i => i.name.toLowerCase())
  );

  // 共通材料を検出
  const hints: AdvancePrepHint[] = [];

  todayIngredients.forEach(todayIng => {
    if (tomorrowIngredientNames.has(todayIng.name.toLowerCase())) {
      const emoji = getIngredientEmoji(todayIng.name, todayIng.category);
      hints.push({
        ingredientName: todayIng.name,
        ingredientEmoji: emoji,
        todayRecipe: todayRecipe.name,
        tomorrowRecipe: tomorrowRecipe.name,
        hint: `明日の「${tomorrowRecipe.name}」でも使います。2日分まとめて切ると楽！`,
        category: todayIng.category,
      });
    }
  });

  return hints;
};

/**
 * 材料名からそれっぽい絵文字を返す
 */
const getIngredientEmoji = (name: string, category: IngredientCategory): string => {
  // 材料名に基づいて絵文字を決定
  const emojiMap: Record<string, string> = {
    '鶏': '🐔',
    '豚': '🐷',
    '牛': '🐮',
    '肉': '🥩',
    'キャベツ': '🥬',
    '玉ねぎ': '🧅',
    'にんじん': '🥕',
    'もやし': '🌱',
    'ピーマン': '🫑',
    'なす': '🍆',
    'トマト': '🍅',
    '卵': '🥚',
    '豆腐': '🧊',
    '鮭': '🐟',
    'サバ': '🐠',
    'にんにく': '🧄',
    '生姜': '🫚',
    'ニラ': '🌿',
    'きのこ': '🍄',
    'ほうれん草': '🥬',
    'ねぎ': '🧅',
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.includes(key)) return emoji;
  }

  // カテゴリに基づくデフォルト
  if (category === 'protein') return '🥩';
  if (category === 'vegetable') return '🥬';
  return '🍽️';
};
