// ============================================
// Quick Onboarding - 初回3分体験ロジック
// 思考代行体験を最優先
// ============================================

import { Recipe } from '../types';
import { FoodPsychologyType, FOOD_TYPES } from './preferenceScoring';
import { MOCK_RECIPES } from './mockData';
import { classifyRecipe } from './userTypeLearning';

// ============================================
// 型定義
// ============================================

export type QuickAnswer = 'A' | 'B';

export interface QuickOnboardingAnswers {
  q1: QuickAnswer | null; // 疲れた夜
  q2: QuickAnswer | null; // 見知らぬ調味料
}

// 今日の献立の結果（画面表示用）
export interface TodayMealResult {
  mainDish: {
    name: string;
    emoji: string;
    cookTime: string;
    recipeId: string;
  };
  sideDish?: {
    name: string;
    emoji: string;
    recipeId: string;
  };
  // 内部用
  _mainRecipe?: Recipe;
  _sideRecipe?: Recipe;
}

// 週の雰囲気（画面表示用）
export interface DayVibe {
  emoji: string;
  vibe: string;
  isOffDay: boolean;
}

export interface WeekVibesResult {
  days: DayVibe[];
  summary: string;
}

// 旧互換用
export interface WeekVibes {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
}

// ============================================
// 暫定タイプ判定（2問から推測）
// ============================================

/**
 * 2問の回答から暫定的な心理タイプを推測
 * 精度は70%程度を目標（後で詳細診断で補正）
 */
export const inferQuickType = (answers: QuickOnboardingAnswers): FoodPsychologyType => {
  const { q1, q2 } = answers;

  // Q1: 疲れて帰った夜、どうしたい？
  //   A: とにかく早く終わらせたい → 機能重視（効率派）
  //   B: 美味しいもので回復したい → 快楽重視（体験派）
  //
  // Q2: 見たことない調味料があったら？
  //   A: 今回はスルー → 安定志向
  //   B: ちょっと気になる → 探求志向

  if (q1 === 'A' && q2 === 'A') {
    // 効率重視 & 安定志向 → スマート・バランサー
    return 'smart_balancer';
  }
  if (q1 === 'A' && q2 === 'B') {
    // 効率重視 & 探求志向 → バランス型（効率的だが新しいものも好き）
    return 'balanced';
  }
  if (q1 === 'B' && q2 === 'A') {
    // 回復重視 & 安定志向 → ヒーリング・グルマン
    return 'healing_gourmet';
  }
  if (q1 === 'B' && q2 === 'B') {
    // 回復重視 & 探求志向 → トレンド・ハンター
    return 'trend_hunter';
  }

  // デフォルト
  return 'balanced';
};

// ============================================
// 理由生成（1行）
// ============================================

/**
 * 回答に基づいて献立選択理由を生成（1行）
 */
export const generateQuickReason = (answers: QuickOnboardingAnswers): string => {
  const { q1, q2 } = answers;

  if (q1 === 'A' && q2 === 'A') {
    return '効率派っぽいから、パパッと作れるやつ';
  }
  if (q1 === 'A' && q2 === 'B') {
    return '時短だけど、ちょっと新鮮なやつ';
  }
  if (q1 === 'B' && q2 === 'A') {
    return '回復モードだね、安心の定番で';
  }
  if (q1 === 'B' && q2 === 'B') {
    return '元気出したいなら、ちょっと冒険もアリ';
  }

  return 'あなたに合いそうなやつ';
};

// ============================================
// 今日の献立生成
// ============================================

// レシピから絵文字を推測
const getRecipeEmoji = (recipe: Recipe): string => {
  const name = recipe.name.toLowerCase();
  if (name.includes('鶏') || name.includes('チキン')) return '🍗';
  if (name.includes('豚')) return '🥓';
  if (name.includes('牛')) return '🥩';
  if (name.includes('魚') || name.includes('鮭') || name.includes('サーモン')) return '🐟';
  if (name.includes('卵') || name.includes('たまご')) return '🥚';
  if (name.includes('野菜') || name.includes('サラダ')) return '🥗';
  if (name.includes('豆腐')) return '🧊';
  if (name.includes('パスタ')) return '🍝';
  if (name.includes('ご飯') || name.includes('丼')) return '🍚';
  if (name.includes('スープ') || name.includes('汁')) return '🥣';
  return '🍳';
};

/**
 * 今日の献立（主菜＋副菜）を生成
 */
export const generateTodayMeal = (
  inferredType: FoodPsychologyType,
  answers: QuickOnboardingAnswers
): TodayMealResult => {
  // レシピをフィルタリング
  const allRecipes = MOCK_RECIPES;

  // 主菜候補: 15分以内、難易度easy優先、ワンパン
  const mainCandidates = allRecipes
    .filter(r => r.cooking_time_minutes <= 20)
    .filter(r => r.difficulty === 'easy' || r.difficulty === 'medium')
    .filter(r => (r.pans_required || 1) === 1)
    .map(r => {
      const classification = classifyRecipe(r);
      const isUniversal = classification.audience === 'universal';
      const isTypeSpecific = classification.primaryTypes.includes(inferredType);
      const score = (isUniversal ? 10 : 0) + (isTypeSpecific ? 15 : 0) + (r.difficulty === 'easy' ? 5 : 0);
      return { recipe: r, score };
    })
    .sort((a, b) => b.score - a.score);

  // 上位5件からランダムに選択
  const mainPool = mainCandidates.slice(0, 5);
  const mainIndex = Math.floor(Math.random() * mainPool.length);
  const mainRecipe = mainPool[mainIndex]?.recipe || allRecipes[0];

  // 主菜で使う食材名を取得
  const mainIngredientNames = new Set(mainRecipe.ingredients.map(i => i.name.toLowerCase()));

  // 副菜候補: 10分以内、主菜と食材が被らない、野菜メイン
  const sideCandidates = allRecipes
    .filter(r => r.id !== mainRecipe.id)
    .filter(r => r.cooking_time_minutes <= 15)
    .filter(r => {
      // 主菜と食材が被らない
      const sideIngredients = r.ingredients.map(i => i.name.toLowerCase());
      const overlap = sideIngredients.filter(n => mainIngredientNames.has(n));
      return overlap.length <= 1; // 調味料程度の重複はOK
    })
    .map(r => {
      const veggieCount = r.ingredients.filter(i => i.category === 'vegetable').length;
      const score = veggieCount * 3 + (r.cooking_time_minutes <= 10 ? 5 : 0);
      return { recipe: r, score };
    })
    .sort((a, b) => b.score - a.score);

  // 上位3件からランダムに選択
  const sidePool = sideCandidates.slice(0, 3);
  const sideIndex = Math.floor(Math.random() * sidePool.length);
  const sideRecipe = sidePool[sideIndex]?.recipe || allRecipes[1];

  return {
    mainDish: {
      name: mainRecipe.name,
      emoji: getRecipeEmoji(mainRecipe),
      cookTime: `${mainRecipe.cooking_time_minutes}分`,
      recipeId: mainRecipe.id,
    },
    sideDish: sideRecipe ? {
      name: sideRecipe.name,
      emoji: getRecipeEmoji(sideRecipe),
      recipeId: sideRecipe.id,
    } : undefined,
    _mainRecipe: mainRecipe,
    _sideRecipe: sideRecipe,
  };
};

// ============================================
// 週の雰囲気生成
// ============================================

/**
 * 週の雰囲気を生成（詳細ではなく雰囲気のみ）
 */
export const generateWeekVibes = (inferredType: FoodPsychologyType): WeekVibesResult => {
  // タイプに応じて微妙にバリエーションを変える
  // ベースの雰囲気（月〜日）
  const baseVibes: { emoji: string; vibe: string }[] = [
    { emoji: '🍳', vibe: '定番ワンパン' },
    { emoji: '♻️', vibe: '余り活用' },
    { emoji: '✨', vibe: '気分転換' },
    { emoji: '😴', vibe: '超楽ちん' },
    { emoji: '🎉', vibe: 'おまかせ' },
    { emoji: '🍖', vibe: 'ゆっくり料理' },
    { emoji: '🛋️', vibe: 'お休み' },
  ];

  // タイプ別に微調整
  if (inferredType === 'smart_balancer') {
    baseVibes[0] = { emoji: '⚡', vibe: 'サクッと定番' };
    baseVibes[3] = { emoji: '😴', vibe: '超時短' };
  } else if (inferredType === 'healing_gourmet') {
    baseVibes[0] = { emoji: '🥰', vibe: 'ほっこり定番' };
    baseVibes[2] = { emoji: '✨', vibe: 'ちょっと贅沢' };
  } else if (inferredType === 'trend_hunter') {
    baseVibes[2] = { emoji: '🆕', vibe: '新しい味' };
    baseVibes[4] = { emoji: '🚀', vibe: 'チャレンジ枠' };
  } else if (inferredType === 'stoic_creator') {
    baseVibes[0] = { emoji: '💪', vibe: 'ヘルシー定番' };
    baseVibes[3] = { emoji: '🥗', vibe: '栄養バランス◎' };
  }

  // DayVibe形式に変換（日曜は必ずお休み）
  const days: DayVibe[] = baseVibes.map((v, index) => ({
    emoji: v.emoji,
    vibe: v.vibe,
    isOffDay: index === 6, // 日曜はお休み
  }));

  // サマリー生成
  const summaries: Record<FoodPsychologyType, string> = {
    smart_balancer: '効率重視で、毎日パパッと完了！',
    balanced: 'バランス良く、飽きない1週間！',
    healing_gourmet: '心も体も満たされる1週間！',
    trend_hunter: '新しい発見がある1週間！',
    stoic_creator: '体に優しい1週間！',
  };

  return {
    days,
    summary: summaries[inferredType] || 'あなたらしい1週間！',
  };
};

/**
 * 旧互換用: WeekVibes形式で生成
 */
export const generateWeekVibesLegacy = (inferredType: FoodPsychologyType): WeekVibes => {
  const result = generateWeekVibes(inferredType);
  return {
    mon: result.days[0].vibe,
    tue: result.days[1].vibe,
    wed: result.days[2].vibe,
    thu: result.days[3].vibe,
    fri: result.days[4].vibe,
  };
};

// ============================================
// ストレージ関連
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredWeeklyPlan, saveWeeklyPlan } from './storage';
import { DayOfWeek } from '../types';

const QUICK_ONBOARDING_KEY = '@onepan_quick_onboarding';

export interface QuickOnboardingData {
  completed: boolean;
  completedAt?: string;
  inferredType?: FoodPsychologyType;
  answers?: QuickOnboardingAnswers;
}

export interface QuickOnboardingResult {
  answers: QuickOnboardingAnswers;
  inferredType: FoodPsychologyType;
  reason: string;
  todayMeal: TodayMealResult;
  weekVibes: WeekVibesResult;
  completedAt: string;
}

/**
 * Quick Onboarding の完了状態を保存
 */
export const saveQuickOnboardingData = async (data: QuickOnboardingData): Promise<void> => {
  try {
    await AsyncStorage.setItem(QUICK_ONBOARDING_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save quick onboarding data:', error);
  }
};

/**
 * Quick Onboarding の完了状態を取得
 */
export const getQuickOnboardingData = async (): Promise<QuickOnboardingData | null> => {
  try {
    const data = await AsyncStorage.getItem(QUICK_ONBOARDING_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get quick onboarding data:', error);
    return null;
  }
};

/**
 * Quick Onboarding が完了しているかチェック
 */
export const isQuickOnboardingCompleted = async (): Promise<boolean> => {
  const data = await getQuickOnboardingData();
  return data?.completed ?? false;
};

/**
 * Quick Onboarding の結果を保存
 */
export const saveQuickOnboardingResult = async (result: QuickOnboardingResult): Promise<void> => {
  try {
    // 完了状態を保存
    await saveQuickOnboardingData({
      completed: true,
      completedAt: result.completedAt,
      inferredType: result.inferredType,
      answers: result.answers,
    });

    // 今日の献立を週間献立として保存
    if (result.todayMeal._mainRecipe && result.todayMeal._sideRecipe) {
      await saveTodayMealAsWeeklyPlan(
        result.todayMeal._mainRecipe,
        result.todayMeal._sideRecipe,
        result.reason,
        result.inferredType
      );
    }
  } catch (error) {
    console.error('Failed to save quick onboarding result:', error);
  }
};

/**
 * 今日の献立を週間献立として保存（内部用）
 */
const saveTodayMealAsWeeklyPlan = async (
  mainRecipe: Recipe,
  sideRecipe: Recipe,
  reason: string,
  inferredType: FoodPsychologyType
): Promise<void> => {
  // 今日の曜日を取得
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayKeys: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayKeys[dayOfWeek];

  // 今週の月曜日を計算
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekStart = monday.toISOString().split('T')[0];

  // 週間献立を作成（今日だけ）
  const plan: StoredWeeklyPlan = {
    id: `quick-${Date.now()}`,
    weekStart,
    plans: {
      [todayKey]: {
        recipeId: mainRecipe.id,
        recipe: mainRecipe,
        scaleFactor: 1.0,
        isForBento: false,
        reason: reason,
        slotType: 'type_specific',
        sideDish: {
          recipeId: sideRecipe.id,
          recipe: sideRecipe,
          reason: '主菜と相性◎',
        },
      },
    },
    sharedIngredients: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveWeeklyPlan(plan);
};

/**
 * 今日の献立を週間献立として保存（公開API）
 */
export const saveTodayMealAsPlan = async (
  meal: TodayMealResult,
  reason: string,
  inferredType: FoodPsychologyType
): Promise<void> => {
  if (meal._mainRecipe && meal._sideRecipe) {
    await saveTodayMealAsWeeklyPlan(meal._mainRecipe, meal._sideRecipe, reason, inferredType);
  }
};
