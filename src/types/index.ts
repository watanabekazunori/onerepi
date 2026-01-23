// ============================================
// ワンパン・バディ - Type Definitions
// Based on Final Requirements v2
// ============================================

// ============ User Profile ============

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  household_size: number;
  dislikes: string[]; // 苦手食材
  kitchen_equipment: KitchenEquipment;
  created_at: string;
  updated_at: string;
}

export interface KitchenEquipment {
  stove_count: number; // コンロ数
  has_microwave: boolean;
  has_oven: boolean;
  has_rice_cooker: boolean;
}

// ============ Recipe (Master DB) ============

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cooking_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: RecipeCategory;
  ingredients: Ingredient[];
  steps: CookingStep[];
  tags: string[];
  image_url?: string;
  servings: number; // 基本の人数分
  is_bento_friendly: boolean; // 弁当向きかどうか
  nutrition?: NutritionInfo; // 栄養情報（1人分）
  created_at: string;
}

export interface NutritionInfo {
  calories: number; // kcal
  protein: number; // g
  fat: number; // g
  carbohydrates: number; // g
  fiber?: number; // g
  sodium?: number; // mg
}

export type RecipeCategory =
  | 'japanese'   // 和食
  | 'western'    // 洋食
  | 'chinese'    // 中華
  | 'asian'      // アジアン
  | 'other';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  is_optional: boolean;
}

export type IngredientCategory =
  | 'protein'    // 肉・魚
  | 'vegetable'  // 野菜
  | 'seasoning'  // 調味料
  | 'grain'      // 米・麺
  | 'dairy'      // 乳製品
  | 'other';

export interface CookingStep {
  id: string;
  order: number;
  phase?: 'prep' | 'cook' | 'finish'; // 工程区分: 下準備/調理/仕上げ（オプショナル）
  title: string;
  description: string;
  details?: string[]; // 詳細手順（箇条書き）
  duration_seconds?: number;
  tips?: string;
  ingredientsUsed?: string[]; // このステップで使う材料
  advancePrep?: { // 先取り調理情報
    forRecipe: string; // レシピ名
    forDate: string; // 何曜日用か
    hint: string; // ヒント文
  };
}

// ============ Weekly Plan ============

export interface WeeklyPlan {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  recipe_id: string;
  recipe?: Recipe;
  meal_type: MealType;
  status: PlanStatus;
  scale_factor: number; // 1.0 = 通常, 2.0 = 倍量(作り置き)
  is_for_bento: boolean; // 弁当用フラグ
  created_at: string;
  // 副菜（オプション）
  sideDish?: {
    recipeId: string;
    recipe: Recipe;
    reason: string;
  };
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type PlanStatus = 'planned' | 'cooked' | 'skipped';

// ============ Shopping List ============

export interface ShoppingItem {
  id: string;
  user_id: string;
  item_name: string;
  quantity: string; // "400g" のような文字列
  category: IngredientCategory;
  is_checked: boolean; // 購入済み or 家にある
  is_manual_add: boolean; // 手動追加フラグ
  source_plans: string[]; // どの献立から来たか (plan_id[])
  created_at: string;
}

// ============ Pantry (在庫) ============

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category: IngredientCategory;
  quantity?: string;
  expiry_date?: string;
  added_at: string;
}

// ============ Cooking Log (自炊日記) ============

export interface CookingLog {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe?: Recipe;
  photo_url?: string;
  rating: number; // 1-5
  memo?: string;
  cooked_at: string;
  created_at: string;
}

// ============ Chat Types ============

export interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  options?: ChatOption[];
  recipes?: Recipe[]; // レシピ提案時
  isTyping?: boolean;
}

export interface ChatOption {
  id: string;
  label: string;
  value: string;
  emoji?: string;
}

export interface OnboardingState {
  step: OnboardingStep;
  householdSize?: number;
  dislikes?: string[];
  kitchenEquipment?: KitchenEquipment;
}

export type OnboardingStep =
  | 'welcome'        // 挨拶・名前入力
  | 'name_confirm'   // 名前確認後
  | 'household'      // 世帯人数
  | 'taste'          // 味の好み診断
  | 'health_goals'   // 健康目標
  | 'dislikes'       // 苦手食材
  | 'dislikes_detail' // 苦手食材詳細入力
  | 'allergy'        // アレルギー
  | 'allergy_detail' // アレルギー詳細入力
  | 'cooking_skill'  // 料理スキル
  | 'kitchen'        // キッチン設備
  | 'pantry_seasonings' // 常備調味料選択
  | 'plan_choice'    // 今日/1週間の選択
  | 'complete';      // 完了

// ============ Navigation Types ============

export type RootStackParamList = {
  Welcome: undefined;
  OnboardingSlides: undefined;
  Setup: undefined;
  Auth: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  DraftMeeting: { weekStart?: string }; // 週間献立ドラフト会議
  Cooking: { planId: string };
  RecipeDetail: { recipeId: string };
  RecipeList: undefined;
  AIChat: undefined;
  AIRecipe: undefined; // AI食材レシピ生成
  CookingFeedback: { recipeId: string; recipeName: string; recipeEmoji: string }; // 調理後フィードバック
  AddShoppingItem: undefined;
  CookingLog: undefined;
  CookingLogDetail: { logId: string };
  EditProfile: undefined;
  Inventory: undefined;
  Favorites: undefined;
  PreferenceDiagnosis: { isRetake?: boolean }; // 好み診断（再診断フラグ対応）
  MyType: undefined; // マイタイプ画面
};

export type MainTabParamList = {
  WeeklyPlan: undefined;
  ShoppingList: undefined;
  CookingLog: undefined;
  Profile: undefined;
};

// ============ Component Props ============

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'chip' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

export interface BadgeProps {
  count: number;
  size?: 'sm' | 'md';
  color?: string;
}

export interface ChatBubbleProps {
  message: ChatMessage;
  onOptionSelect?: (option: ChatOption) => void;
  onRecipeSelect?: (recipe: Recipe) => void;
}

export interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onCheck?: () => void;
}

// ============ Theme Types ============

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  white: string;
  black: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeTypography {
  fontFamily: string;
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

// ============ Utility Types ============

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WeekDay {
  key: DayOfWeek;
  label: string;
  date: Date;
  dateString: string; // YYYY-MM-DD
  isToday: boolean;
}

// ============ Category Labels ============

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  protein: '肉・魚',
  vegetable: '野菜',
  seasoning: '調味料',
  grain: '米・麺',
  dairy: '乳製品',
  other: 'その他',
};

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  japanese: '和食',
  western: '洋食',
  chinese: '中華',
  asian: 'アジアン',
  other: 'その他',
};
