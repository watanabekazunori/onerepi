// ============================================
// Preference Learner - 好み学習システム
// 料理の感想からユーザーの好みを学習
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, RecipeCategory } from '../types';

// ============================================
// 型定義
// ============================================

// 料理フィードバック
export interface CookingFeedback {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeEmoji: string;
  category: RecipeCategory;
  tags: string[];
  mainIngredients: string[];  // 主要食材
  rating: number;             // 1-5
  wouldMakeAgain: boolean;    // また作りたい
  tasteComment?: 'perfect' | 'too_salty' | 'too_bland' | 'too_spicy' | 'too_sweet';
  difficultyComment?: 'easy' | 'just_right' | 'difficult';
  portionComment?: 'too_little' | 'just_right' | 'too_much';
  freeComment?: string;
  cookedAt: string;
}

// 学習された好み
export interface LearnedPreferences {
  // カテゴリ好み（スコア: -10 〜 +10）
  categoryScores: Record<RecipeCategory, number>;

  // 食材好み（スコア: -10 〜 +10）
  ingredientScores: Record<string, number>;

  // タグ好み（スコア: -10 〜 +10）
  tagScores: Record<string, number>;

  // 調理スキル推定
  estimatedSkillLevel: 'beginner' | 'intermediate' | 'advanced';

  // 味の好み
  tastePreferences: {
    saltiness: number;  // -5(薄味好み) 〜 +5(濃い味好み)
    spiciness: number;  // -5(辛いの苦手) 〜 +5(辛いの好き)
    sweetness: number;  // -5 〜 +5
  };

  // お気に入りレシピID
  favoriteRecipeIds: string[];

  // また作りたいレシピID
  wouldMakeAgainIds: string[];

  // 作らないレシピID（低評価）
  dislikedRecipeIds: string[];

  // 統計
  totalFeedbackCount: number;
  lastUpdated: string;
}

// デフォルト設定
const DEFAULT_PREFERENCES: LearnedPreferences = {
  categoryScores: {
    japanese: 0,
    western: 0,
    chinese: 0,
    asian: 0,
    other: 0,
  },
  ingredientScores: {},
  tagScores: {},
  estimatedSkillLevel: 'intermediate',
  tastePreferences: {
    saltiness: 0,
    spiciness: 0,
    sweetness: 0,
  },
  favoriteRecipeIds: [],
  wouldMakeAgainIds: [],
  dislikedRecipeIds: [],
  totalFeedbackCount: 0,
  lastUpdated: new Date().toISOString(),
};

// ストレージキー
const STORAGE_KEYS = {
  FEEDBACKS: '@onepan_cooking_feedbacks',
  LEARNED_PREFS: '@onepan_learned_preferences',
};

// ============================================
// フィードバック保存・取得
// ============================================

/**
 * フィードバックを保存
 */
export const saveFeedback = async (feedback: CookingFeedback): Promise<void> => {
  try {
    const feedbacks = await getAllFeedbacks();
    feedbacks.unshift(feedback);

    // 最大100件保持
    const trimmedFeedbacks = feedbacks.slice(0, 100);

    await AsyncStorage.setItem(
      STORAGE_KEYS.FEEDBACKS,
      JSON.stringify(trimmedFeedbacks)
    );

    // 好みを再学習
    await updateLearnedPreferences(trimmedFeedbacks);
  } catch (error) {
    console.error('Failed to save feedback:', error);
    throw error;
  }
};

/**
 * すべてのフィードバックを取得
 */
export const getAllFeedbacks = async (): Promise<CookingFeedback[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FEEDBACKS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get feedbacks:', error);
    return [];
  }
};

/**
 * 特定レシピのフィードバックを取得
 */
export const getFeedbackForRecipe = async (
  recipeId: string
): Promise<CookingFeedback | null> => {
  const feedbacks = await getAllFeedbacks();
  return feedbacks.find(f => f.recipeId === recipeId) || null;
};

// ============================================
// 好み学習
// ============================================

/**
 * フィードバックから好みを学習・更新
 */
export const updateLearnedPreferences = async (
  feedbacks: CookingFeedback[]
): Promise<void> => {
  const prefs: LearnedPreferences = { ...DEFAULT_PREFERENCES };

  // カテゴリスコア計算
  const categoryCount: Record<RecipeCategory, { total: number; sum: number }> = {
    japanese: { total: 0, sum: 0 },
    western: { total: 0, sum: 0 },
    chinese: { total: 0, sum: 0 },
    asian: { total: 0, sum: 0 },
    other: { total: 0, sum: 0 },
  };

  // 食材スコア計算用
  const ingredientData: Record<string, { total: number; sum: number }> = {};

  // タグスコア計算用
  const tagData: Record<string, { total: number; sum: number }> = {};

  // 難易度コメント集計
  let easyCount = 0;
  let justRightCount = 0;
  let difficultCount = 0;

  // 味コメント集計
  let tooSaltyCount = 0;
  let tooBlandCount = 0;
  let tooSpicyCount = 0;

  feedbacks.forEach(feedback => {
    const score = (feedback.rating - 3) * 2; // 1-5 → -4 〜 +4

    // カテゴリ
    categoryCount[feedback.category].total++;
    categoryCount[feedback.category].sum += score;

    // 食材
    feedback.mainIngredients.forEach(ing => {
      if (!ingredientData[ing]) {
        ingredientData[ing] = { total: 0, sum: 0 };
      }
      ingredientData[ing].total++;
      ingredientData[ing].sum += score;
    });

    // タグ
    feedback.tags.forEach(tag => {
      if (!tagData[tag]) {
        tagData[tag] = { total: 0, sum: 0 };
      }
      tagData[tag].total++;
      tagData[tag].sum += score;
    });

    // 難易度
    if (feedback.difficultyComment === 'easy') easyCount++;
    if (feedback.difficultyComment === 'just_right') justRightCount++;
    if (feedback.difficultyComment === 'difficult') difficultCount++;

    // 味の好み
    if (feedback.tasteComment === 'too_salty') tooSaltyCount++;
    if (feedback.tasteComment === 'too_bland') tooBlandCount++;
    if (feedback.tasteComment === 'too_spicy') tooSpicyCount++;

    // お気に入り・また作りたい・低評価
    if (feedback.rating >= 4 && feedback.wouldMakeAgain) {
      if (!prefs.wouldMakeAgainIds.includes(feedback.recipeId)) {
        prefs.wouldMakeAgainIds.push(feedback.recipeId);
      }
    }
    if (feedback.rating === 5) {
      if (!prefs.favoriteRecipeIds.includes(feedback.recipeId)) {
        prefs.favoriteRecipeIds.push(feedback.recipeId);
      }
    }
    if (feedback.rating <= 2) {
      if (!prefs.dislikedRecipeIds.includes(feedback.recipeId)) {
        prefs.dislikedRecipeIds.push(feedback.recipeId);
      }
    }
  });

  // カテゴリスコア正規化（-10 〜 +10）
  Object.entries(categoryCount).forEach(([cat, data]) => {
    if (data.total > 0) {
      prefs.categoryScores[cat as RecipeCategory] = Math.round(
        (data.sum / data.total) * 2.5
      );
    }
  });

  // 食材スコア正規化（上位30件のみ保持）
  const sortedIngredients = Object.entries(ingredientData)
    .filter(([_, data]) => data.total >= 2)
    .sort((a, b) => Math.abs(b[1].sum / b[1].total) - Math.abs(a[1].sum / a[1].total))
    .slice(0, 30);

  sortedIngredients.forEach(([ing, data]) => {
    prefs.ingredientScores[ing] = Math.round((data.sum / data.total) * 2.5);
  });

  // タグスコア正規化（上位20件のみ保持）
  const sortedTags = Object.entries(tagData)
    .filter(([_, data]) => data.total >= 2)
    .sort((a, b) => Math.abs(b[1].sum / b[1].total) - Math.abs(a[1].sum / a[1].total))
    .slice(0, 20);

  sortedTags.forEach(([tag, data]) => {
    prefs.tagScores[tag] = Math.round((data.sum / data.total) * 2.5);
  });

  // 調理スキル推定
  const totalDiffComments = easyCount + justRightCount + difficultCount;
  if (totalDiffComments >= 3) {
    if (difficultCount > totalDiffComments * 0.4) {
      prefs.estimatedSkillLevel = 'beginner';
    } else if (easyCount > totalDiffComments * 0.6) {
      prefs.estimatedSkillLevel = 'advanced';
    } else {
      prefs.estimatedSkillLevel = 'intermediate';
    }
  }

  // 味の好み推定
  const totalTasteComments = tooSaltyCount + tooBlandCount + tooSpicyCount;
  if (totalTasteComments >= 3) {
    if (tooSaltyCount > tooBlandCount) {
      prefs.tastePreferences.saltiness = -Math.min(5, tooSaltyCount);
    } else if (tooBlandCount > tooSaltyCount) {
      prefs.tastePreferences.saltiness = Math.min(5, tooBlandCount);
    }
    if (tooSpicyCount >= 2) {
      prefs.tastePreferences.spiciness = -Math.min(5, tooSpicyCount);
    }
  }

  prefs.totalFeedbackCount = feedbacks.length;
  prefs.lastUpdated = new Date().toISOString();

  await AsyncStorage.setItem(STORAGE_KEYS.LEARNED_PREFS, JSON.stringify(prefs));
};

/**
 * 学習された好みを取得
 */
export const getLearnedPreferences = async (): Promise<LearnedPreferences> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNED_PREFS);
    if (!data) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to get learned preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

// ============================================
// レシピスコアリング（好みを反映）
// ============================================

/**
 * レシピに対するユーザーの好みスコアを計算
 * @returns スコア（-100 〜 +100）
 */
export const calculateRecipePreferenceScore = (
  recipe: Recipe,
  prefs: LearnedPreferences
): number => {
  let score = 0;

  // カテゴリスコア（重み: 2）
  score += (prefs.categoryScores[recipe.category] || 0) * 2;

  // 食材スコア（重み: 1.5）
  recipe.ingredients.forEach(ing => {
    if (prefs.ingredientScores[ing.name]) {
      score += prefs.ingredientScores[ing.name] * 1.5;
    }
  });

  // タグスコア（重み: 1）
  recipe.tags.forEach(tag => {
    if (prefs.tagScores[tag]) {
      score += prefs.tagScores[tag];
    }
  });

  // お気に入り・また作りたいボーナス
  if (prefs.favoriteRecipeIds.includes(recipe.id)) {
    score += 30;
  } else if (prefs.wouldMakeAgainIds.includes(recipe.id)) {
    score += 20;
  }

  // 低評価ペナルティ
  if (prefs.dislikedRecipeIds.includes(recipe.id)) {
    score -= 50;
  }

  // 難易度調整
  if (prefs.estimatedSkillLevel === 'beginner' && recipe.difficulty === 'hard') {
    score -= 15;
  } else if (prefs.estimatedSkillLevel === 'advanced' && recipe.difficulty === 'easy') {
    score += 5; // 簡単なのは悪くない
  }

  // -100 〜 +100 に正規化
  return Math.max(-100, Math.min(100, score));
};

/**
 * レシピ配列を好みスコア順にソート
 */
export const sortRecipesByPreference = async (
  recipes: Recipe[]
): Promise<Recipe[]> => {
  const prefs = await getLearnedPreferences();

  if (prefs.totalFeedbackCount < 3) {
    // フィードバックが少ない場合はそのまま返す
    return recipes;
  }

  return [...recipes].sort((a, b) => {
    const scoreA = calculateRecipePreferenceScore(a, prefs);
    const scoreB = calculateRecipePreferenceScore(b, prefs);
    return scoreB - scoreA;
  });
};

// ============================================
// フィードバック作成ヘルパー
// ============================================

/**
 * レシピからフィードバック用のデータを抽出
 */
export const createFeedbackFromRecipe = (
  recipe: Recipe,
  rating: number,
  wouldMakeAgain: boolean
): CookingFeedback => {
  // 主要食材（タンパク質と野菜）を抽出
  const mainIngredients = recipe.ingredients
    .filter(ing => ing.category === 'protein' || ing.category === 'vegetable')
    .map(ing => ing.name)
    .slice(0, 5);

  return {
    id: `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    recipeId: recipe.id,
    recipeName: recipe.name,
    recipeEmoji: recipe.emoji,
    category: recipe.category,
    tags: recipe.tags.slice(0, 5),
    mainIngredients,
    rating,
    wouldMakeAgain,
    cookedAt: new Date().toISOString(),
  };
};

// ============================================
// 統計・サマリー
// ============================================

/**
 * 好みのサマリーを取得（UI表示用）
 */
export const getPreferenceSummary = async (): Promise<{
  favoriteCategory: string | null;
  favoriteIngredients: string[];
  dislikedIngredients: string[];
  skillLevel: string;
  totalCooked: number;
}> => {
  const prefs = await getLearnedPreferences();

  // 最高評価カテゴリ
  let favoriteCategory: string | null = null;
  let maxCatScore = -Infinity;
  Object.entries(prefs.categoryScores).forEach(([cat, score]) => {
    if (score > maxCatScore && score > 0) {
      maxCatScore = score;
      favoriteCategory = cat;
    }
  });

  // 好きな食材トップ3
  const favoriteIngredients = Object.entries(prefs.ingredientScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ing]) => ing);

  // 苦手な食材トップ3
  const dislikedIngredients = Object.entries(prefs.ingredientScores)
    .filter(([_, score]) => score < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([ing]) => ing);

  const skillLabels = {
    beginner: '初心者',
    intermediate: '中級者',
    advanced: '上級者',
  };

  return {
    favoriteCategory,
    favoriteIngredients,
    dislikedIngredients,
    skillLevel: skillLabels[prefs.estimatedSkillLevel],
    totalCooked: prefs.totalFeedbackCount,
  };
};
