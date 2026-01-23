// ============================================
// Weekly Plan Generator - 1週間献立自動生成
// 重複なし、バランス考慮の献立作成
// ============================================

import { Recipe, RecipeCategory, DayOfWeek } from '../types';
import { MOCK_RECIPES } from './mockData';
import { UserPreferences } from './storage';
import {
  getLearnedPreferences,
  calculateRecipePreferenceScore,
  LearnedPreferences,
} from './preferenceLearner';
import {
  FoodPsychologyType,
  FOOD_TYPES,
  scoreRecipeByType,
  extractPsychologyTags,
  RecipeScore,
} from './preferenceScoring';
import {
  classifyRecipe,
  RecipeTypeClassification,
  RecipeAudience,
  getWeeklyMixConfig,
  determineWeeklySlots,
  WeeklyMixConfig,
  UserLearningProfile,
  getConfidenceLevel,
} from './userTypeLearning';
import {
  generateRecipeSignature,
  getCachedSignature,
  calculateRepeatPreventionScore,
  generateDefaultWeeklySlots,
  createEmptySlotTracker,
  updateSlotTracker,
  selectFromTopCandidates,
  logSelectedRecipeFeatures,
  logTopCandidates,
  SelectedRecipeInfo,
  WeeklySlotConfig,
  WeeklySlotTracker,
  ScoreBreakdown,
  PENALTY_CONSTANTS,
} from './recipeRepeatPrevention';

// 1日の献立
export interface DayPlan {
  dayOfWeek: DayOfWeek;
  recipe: Recipe;
  scaleFactor: number;
  isForBento: boolean;
}

// 週間献立
export interface GeneratedWeeklyPlan {
  id: string;
  weekStart: string;
  plans: DayPlan[];
  totalCookingTime: number;
  categoryBalance: Record<RecipeCategory, number>;
  sharedIngredients: string[];
}

// 生成オプション
export interface WeeklyPlanOptions {
  // 基本設定
  servings: number;               // 人数
  daysToGenerate: DayOfWeek[];    // 生成する曜日
  maxCookingTimePerDay?: number;  // 1日の最大調理時間

  // 好み
  preferredCategories?: RecipeCategory[];  // 好みのカテゴリ
  excludeCategories?: RecipeCategory[];    // 除外カテゴリ
  preferredTags?: string[];                // 好みのタグ
  excludeTags?: string[];                  // 除外タグ

  // 制約
  excludeIngredients?: string[];   // 除外食材（アレルギー等）
  includeIngredients?: string[];   // 必ず使いたい食材

  // バランス設定
  balanceCategories?: boolean;     // カテゴリをバランスよく
  balanceProteins?: boolean;       // タンパク質源をバランスよく
  avoidConsecutiveSimilar?: boolean; // 連続で似た料理を避ける

  // 最近作った料理を除外
  recentRecipeIds?: string[];
}

// デフォルトオプション
const DEFAULT_OPTIONS: WeeklyPlanOptions = {
  servings: 2,
  daysToGenerate: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  maxCookingTimePerDay: 30,
  balanceCategories: true,
  balanceProteins: true,
  avoidConsecutiveSimilar: true,
};

// カテゴリの日本語ラベル
const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  japanese: '和食',
  western: '洋食',
  chinese: '中華',
  asian: 'アジアン',
  other: 'その他',
};

// タンパク質グループ分類
const PROTEIN_GROUPS: Record<string, string[]> = {
  chicken: ['鶏', 'ささみ', '手羽'],
  pork: ['豚'],
  beef: ['牛'],
  fish: ['鮭', 'サバ', 'ブリ', 'タラ', 'マグロ', 'カツオ', 'アジ', 'サンマ', 'イワシ', 'ホッケ'],
  seafood: ['エビ', 'イカ', 'タコ', 'アサリ', 'ホタテ', 'カニカマ'],
  egg: ['卵', '温泉卵'],
  tofu: ['豆腐', '厚揚げ', '油揚げ', '納豆'],
  processed: ['ベーコン', 'ソーセージ', 'ハム', 'ちくわ', 'かまぼこ', 'はんぺん', 'ツナ缶', 'サバ缶'],
};

/**
 * レシピのタンパク質グループを判定
 */
const getProteinGroup = (recipe: Recipe): string | null => {
  const ingredientNames = recipe.ingredients.map(i => i.name);

  for (const [group, keywords] of Object.entries(PROTEIN_GROUPS)) {
    if (ingredientNames.some(name => keywords.some(kw => name.includes(kw)))) {
      return group;
    }
  }
  return null;
};

/**
 * レシピをスコアリング（選択優先度）
 */
const scoreRecipe = (
  recipe: Recipe,
  options: WeeklyPlanOptions,
  selectedRecipes: Recipe[],
  previousRecipe: Recipe | null
): number => {
  let score = 100; // ベーススコア

  // === 減点要素 ===

  // 1. 既に選択済みのレシピは除外（-1000）
  if (selectedRecipes.some(r => r.id === recipe.id)) {
    return -1000;
  }

  // 2. 最近作った料理は除外（-1000）
  if (options.recentRecipeIds?.includes(recipe.id)) {
    return -1000;
  }

  // 3. 除外カテゴリ（-1000）
  if (options.excludeCategories?.includes(recipe.category)) {
    return -1000;
  }

  // 4. 除外食材が含まれている（-1000）
  if (options.excludeIngredients?.length) {
    const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
    if (options.excludeIngredients.some(excl =>
      ingredientNames.some(name => name.includes(excl.toLowerCase()))
    )) {
      return -1000;
    }
  }

  // 5. 調理時間が上限を超える（-500）
  if (options.maxCookingTimePerDay && recipe.cooking_time_minutes > options.maxCookingTimePerDay) {
    score -= 500;
  }

  // 6. 連続で同じカテゴリ（-50）
  if (options.avoidConsecutiveSimilar && previousRecipe) {
    if (recipe.category === previousRecipe.category) {
      score -= 50;
    }

    // 連続で同じタンパク質グループ（-80）
    const prevProtein = getProteinGroup(previousRecipe);
    const currentProtein = getProteinGroup(recipe);
    if (prevProtein && currentProtein && prevProtein === currentProtein) {
      score -= 80;
    }
  }

  // 7. 同じタンパク質グループが既に多い（-30 per duplicate）
  if (options.balanceProteins) {
    const currentProtein = getProteinGroup(recipe);
    if (currentProtein) {
      const sameProteinCount = selectedRecipes.filter(r => getProteinGroup(r) === currentProtein).length;
      score -= sameProteinCount * 30;
    }
  }

  // 8. 同じカテゴリが既に多い（-20 per duplicate）
  if (options.balanceCategories) {
    const sameCategoryCount = selectedRecipes.filter(r => r.category === recipe.category).length;
    score -= sameCategoryCount * 20;
  }

  // === 加点要素 ===

  // 1. 好みのカテゴリ（+30）
  if (options.preferredCategories?.includes(recipe.category)) {
    score += 30;
  }

  // 2. 好みのタグにマッチ（+15 per tag）
  if (options.preferredTags?.length) {
    const matchedTags = recipe.tags.filter(tag =>
      options.preferredTags!.some(pref => tag.includes(pref) || pref.includes(tag))
    );
    score += matchedTags.length * 15;
  }

  // 3. 使いたい食材が含まれている（+40 per ingredient）
  if (options.includeIngredients?.length) {
    const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
    const matchedIngredients = options.includeIngredients.filter(incl =>
      ingredientNames.some(name => name.includes(incl.toLowerCase()))
    );
    score += matchedIngredients.length * 40;
  }

  // 4. 簡単なレシピにボーナス（+10）
  if (recipe.difficulty === 'easy') {
    score += 10;
  }

  // 5. 時短レシピにボーナス（+15）
  if (recipe.cooking_time_minutes <= 15) {
    score += 15;
  }

  // 6. 弁当向きの日はボーナス（後で実装可能）

  // ランダム要素（-20 ~ +20）
  score += Math.random() * 40 - 20;

  return score;
};

/**
 * 共通食材を検出
 */
const findSharedIngredients = (recipes: Recipe[]): string[] => {
  if (recipes.length < 2) return [];

  const ingredientCounts = new Map<string, number>();

  recipes.forEach(recipe => {
    const uniqueIngredients = new Set(recipe.ingredients.map(i => i.name));
    uniqueIngredients.forEach(name => {
      ingredientCounts.set(name, (ingredientCounts.get(name) || 0) + 1);
    });
  });

  // 2回以上使われる食材
  return Array.from(ingredientCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([name, _]) => name)
    .slice(0, 10); // 最大10個
};

/**
 * 週間献立を自動生成
 */
export const generateWeeklyPlan = (
  options: Partial<WeeklyPlanOptions> = {}
): GeneratedWeeklyPlan => {
  const opts: WeeklyPlanOptions = { ...DEFAULT_OPTIONS, ...options };

  const selectedRecipes: Recipe[] = [];
  const plans: DayPlan[] = [];

  // 全レシピをコピー
  const allRecipes = [...MOCK_RECIPES];

  // 各曜日について選択
  opts.daysToGenerate.forEach((day, index) => {
    const previousRecipe = index > 0 ? selectedRecipes[index - 1] : null;

    // スコア計算
    const scoredRecipes = allRecipes.map(recipe => ({
      recipe,
      score: scoreRecipe(recipe, opts, selectedRecipes, previousRecipe),
    }));

    // スコア順にソート
    scoredRecipes.sort((a, b) => b.score - a.score);

    // 上位から有効なレシピを選択
    const validRecipes = scoredRecipes.filter(sr => sr.score > 0);

    if (validRecipes.length > 0) {
      // 上位10件からランダムに選択（変化をつける）
      const topRecipes = validRecipes.slice(0, Math.min(10, validRecipes.length));
      const selectedIndex = Math.floor(Math.random() * topRecipes.length);
      const selected = topRecipes[selectedIndex].recipe;

      selectedRecipes.push(selected);
      plans.push({
        dayOfWeek: day,
        recipe: selected,
        scaleFactor: opts.servings / selected.servings,
        isForBento: false,
      });
    }
  });

  // カテゴリバランスを集計
  const categoryBalance: Record<RecipeCategory, number> = {
    japanese: 0,
    western: 0,
    chinese: 0,
    asian: 0,
    other: 0,
  };
  selectedRecipes.forEach(r => {
    categoryBalance[r.category]++;
  });

  // 合計調理時間
  const totalCookingTime = selectedRecipes.reduce(
    (sum, r) => sum + r.cooking_time_minutes,
    0
  );

  // 共通食材を検出
  const sharedIngredients = findSharedIngredients(selectedRecipes);

  // 週の開始日を計算（今週の月曜日）
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekStart = monday.toISOString().split('T')[0];

  return {
    id: `weekly-plan-${Date.now()}`,
    weekStart,
    plans,
    totalCookingTime,
    categoryBalance,
    sharedIngredients,
  };
};

/**
 * ユーザー設定から生成オプションを作成
 */
export const createOptionsFromPreferences = (
  prefs: UserPreferences | null,
  recentRecipeIds: string[] = []
): Partial<WeeklyPlanOptions> => {
  if (!prefs) return { recentRecipeIds };

  const options: Partial<WeeklyPlanOptions> = {
    servings: prefs.household || 2,
    recentRecipeIds,
  };

  // 苦手食材を除外
  if (prefs.dislikes?.length) {
    options.excludeIngredients = prefs.dislikes;
  }

  // アレルギー食材を除外
  if (prefs.allergies?.length) {
    options.excludeIngredients = [
      ...(options.excludeIngredients || []),
      ...prefs.allergies,
    ];
  }

  // 好みのタグを設定
  if (prefs.tastePreferences?.length) {
    options.preferredTags = prefs.tastePreferences;
  }

  // 健康目標からタグを追加
  if (prefs.healthGoals?.length) {
    const healthTags: string[] = [];
    prefs.healthGoals.forEach(goal => {
      if (goal.includes('ダイエット') || goal.includes('減量')) {
        healthTags.push('低カロリー', 'ヘルシー', 'ダイエット向け');
      }
      if (goal.includes('筋肉') || goal.includes('タンパク質')) {
        healthTags.push('高タンパク', 'タンパク質豊富');
      }
      if (goal.includes('野菜')) {
        healthTags.push('野菜たっぷり', '野菜不足解消');
      }
    });
    options.preferredTags = [...(options.preferredTags || []), ...healthTags];
  }

  // 料理スキルに応じた調理時間
  if (prefs.cookingSkill === '初心者') {
    options.maxCookingTimePerDay = 20;
  } else if (prefs.cookingSkill === '中級者') {
    options.maxCookingTimePerDay = 30;
  } else {
    options.maxCookingTimePerDay = 45;
  }

  return options;
};

/**
 * 特定の日のレシピを再生成（入れ替え）
 */
export const regenerateForDay = (
  currentPlan: GeneratedWeeklyPlan,
  dayToRegenerate: DayOfWeek,
  options: Partial<WeeklyPlanOptions> = {}
): GeneratedWeeklyPlan => {
  const opts: WeeklyPlanOptions = { ...DEFAULT_OPTIONS, ...options };

  // 現在のプランから、再生成対象以外のレシピを取得
  const otherRecipes = currentPlan.plans
    .filter(p => p.dayOfWeek !== dayToRegenerate)
    .map(p => p.recipe);

  // 現在のその日のレシピも除外に追加
  const currentDayPlan = currentPlan.plans.find(p => p.dayOfWeek === dayToRegenerate);
  const excludeIds = currentDayPlan ? [currentDayPlan.recipe.id] : [];

  // 再生成対象日のインデックスを見つける
  const dayIndex = currentPlan.plans.findIndex(p => p.dayOfWeek === dayToRegenerate);
  const previousRecipe = dayIndex > 0 ? currentPlan.plans[dayIndex - 1].recipe : null;

  // スコア計算（既存の他のレシピを考慮）
  const allRecipes = [...MOCK_RECIPES];
  const scoredRecipes = allRecipes.map(recipe => ({
    recipe,
    score: excludeIds.includes(recipe.id)
      ? -1000
      : scoreRecipe(recipe, opts, otherRecipes, previousRecipe),
  }));

  scoredRecipes.sort((a, b) => b.score - a.score);

  const validRecipes = scoredRecipes.filter(sr => sr.score > 0);

  if (validRecipes.length === 0) {
    return currentPlan; // 変更なし
  }

  // 上位から選択
  const topRecipes = validRecipes.slice(0, Math.min(10, validRecipes.length));
  const selectedIndex = Math.floor(Math.random() * topRecipes.length);
  const newRecipe = topRecipes[selectedIndex].recipe;

  // プランを更新
  const newPlans = currentPlan.plans.map(p => {
    if (p.dayOfWeek === dayToRegenerate) {
      return {
        ...p,
        recipe: newRecipe,
        scaleFactor: opts.servings / newRecipe.servings,
      };
    }
    return p;
  });

  // カテゴリバランスを再集計
  const categoryBalance: Record<RecipeCategory, number> = {
    japanese: 0,
    western: 0,
    chinese: 0,
    asian: 0,
    other: 0,
  };
  newPlans.forEach(p => {
    categoryBalance[p.recipe.category]++;
  });

  // 合計調理時間
  const totalCookingTime = newPlans.reduce(
    (sum, p) => sum + p.recipe.cooking_time_minutes,
    0
  );

  // 共通食材を再検出
  const sharedIngredients = findSharedIngredients(newPlans.map(p => p.recipe));

  return {
    ...currentPlan,
    plans: newPlans,
    totalCookingTime,
    categoryBalance,
    sharedIngredients,
  };
};

/**
 * 献立のサマリーを生成
 */
export const getWeeklyPlanSummary = (plan: GeneratedWeeklyPlan): string => {
  const categoryNames = Object.entries(plan.categoryBalance)
    .filter(([_, count]) => count > 0)
    .map(([cat, count]) => `${CATEGORY_LABELS[cat as RecipeCategory]}${count}品`)
    .join('、');

  const avgTime = Math.round(plan.totalCookingTime / plan.plans.length);

  let summary = `今週の献立: ${plan.plans.length}品\n`;
  summary += `${categoryNames}\n`;
  summary += `平均調理時間: ${avgTime}分\n`;

  if (plan.sharedIngredients.length > 0) {
    summary += `共通食材: ${plan.sharedIngredients.slice(0, 5).join('、')}`;
  }

  return summary;
};

// ============================================
// お気に入りベースの献立提案機能
// ユーザーの好みを学習した結果を反映
// ============================================

/**
 * お気に入りスコア付きでレシピを評価
 */
const scoreRecipeWithPreferences = (
  recipe: Recipe,
  options: WeeklyPlanOptions,
  selectedRecipes: Recipe[],
  previousRecipe: Recipe | null,
  learnedPrefs: LearnedPreferences | null
): number => {
  // 基本スコアを取得
  let score = scoreRecipe(recipe, options, selectedRecipes, previousRecipe);

  // 既に除外されているレシピはそのまま返す
  if (score <= -1000) {
    return score;
  }

  // 学習済み好みがない場合は基本スコアを返す
  if (!learnedPrefs) {
    return score;
  }

  // === お気に入りベースの加点 ===

  // 1. お気に入りレシピは大幅加点（+150）
  if (learnedPrefs.favoriteRecipeIds.includes(recipe.id)) {
    score += 150;
  }

  // 2. また作りたいレシピも加点（+100）
  if (learnedPrefs.wouldMakeAgainIds.includes(recipe.id)) {
    score += 100;
  }

  // 3. 嫌いなレシピは大幅減点（-200）
  if (learnedPrefs.dislikedRecipeIds.includes(recipe.id)) {
    score -= 200;
  }

  // 4. 好みのカテゴリスコアを反映（-50 ~ +50）
  const categoryScore = learnedPrefs.categoryScores[recipe.category] || 0;
  score += categoryScore * 5;

  // 5. 好みの食材スコアを反映
  recipe.ingredients.forEach(ing => {
    const ingScore = learnedPrefs.ingredientScores[ing.name] || 0;
    score += ingScore * 3;
  });

  // 6. 好みのタグスコアを反映
  recipe.tags.forEach(tag => {
    const tagScore = learnedPrefs.tagScores[tag] || 0;
    score += tagScore * 4;
  });

  // 7. 料理スキルに合った難易度を優先
  if (learnedPrefs.estimatedSkillLevel === 'beginner') {
    if (recipe.difficulty === 'easy') {
      score += 30;
    } else if (recipe.difficulty === 'hard') {
      score -= 40;
    }
  } else if (learnedPrefs.estimatedSkillLevel === 'advanced') {
    if (recipe.difficulty === 'hard') {
      score += 20;
    }
  }

  // 8. 味の好みを反映
  // saltiness < 0 の場合は薄味好み
  if (learnedPrefs.tastePreferences.saltiness < -2) {
    // 塩分控えめタグがあれば加点
    if (recipe.tags.some(t => t.includes('塩分控えめ') || t.includes('減塩'))) {
      score += 20;
    }
  }
  // spiciness < 0 の場合は辛いの苦手
  if (learnedPrefs.tastePreferences.spiciness < -2) {
    // 辛くないタグがあれば加点
    if (recipe.tags.some(t => t.includes('辛くない') || t.includes('マイルド'))) {
      score += 20;
    }
    // 辛いタグがあれば減点
    if (recipe.tags.some(t => t.includes('辛い') || t.includes('ピリ辛') || t.includes('激辛'))) {
      score -= 50;
    }
  }

  // 同じお気に入りレシピが連続しないように調整
  if (previousRecipe && learnedPrefs.favoriteRecipeIds.includes(recipe.id)) {
    if (learnedPrefs.favoriteRecipeIds.includes(previousRecipe.id)) {
      // お気に入り同士が連続する場合は少し減点
      score -= 30;
    }
  }

  return score;
};

/**
 * お気に入りベースの週間献立を生成
 * 学習した好みを反映して、お気に入りレシピを優先的に提案
 */
export const generateFavoriteBasedWeeklyPlan = async (
  options: Partial<WeeklyPlanOptions> = {}
): Promise<GeneratedWeeklyPlan> => {
  const opts: WeeklyPlanOptions = { ...DEFAULT_OPTIONS, ...options };

  // 学習済み好みを取得
  const learnedPrefs = await getLearnedPreferences();

  const selectedRecipes: Recipe[] = [];
  const plans: DayPlan[] = [];

  // お気に入りレシピを優先的に入れる戦略:
  // - お気に入りレシピを週の半分程度に配置
  // - 残りは通常のバランス考慮

  // お気に入りレシピのリストを作成
  const favoriteRecipes: Recipe[] = [];
  if (learnedPrefs) {
    const allFavoriteIds = [
      ...learnedPrefs.favoriteRecipeIds,
      ...learnedPrefs.wouldMakeAgainIds.filter(
        id => !learnedPrefs.favoriteRecipeIds.includes(id)
      ),
    ];

    allFavoriteIds.forEach(id => {
      const recipe = MOCK_RECIPES.find(r => r.id === id);
      if (recipe && !opts.recentRecipeIds?.includes(id)) {
        favoriteRecipes.push(recipe);
      }
    });
  }

  // お気に入りをシャッフル
  const shuffledFavorites = [...favoriteRecipes].sort(() => Math.random() - 0.5);

  // 全レシピをコピー
  const allRecipes = [...MOCK_RECIPES];

  // 各曜日について選択
  opts.daysToGenerate.forEach((day, index) => {
    const previousRecipe = index > 0 ? selectedRecipes[index - 1] : null;

    // スコア計算（好みを反映）
    const scoredRecipes = allRecipes.map(recipe => ({
      recipe,
      score: scoreRecipeWithPreferences(
        recipe,
        opts,
        selectedRecipes,
        previousRecipe,
        learnedPrefs
      ),
    }));

    // スコア順にソート
    scoredRecipes.sort((a, b) => b.score - a.score);

    // 上位から有効なレシピを選択
    const validRecipes = scoredRecipes.filter(sr => sr.score > 0);

    if (validRecipes.length > 0) {
      // 上位5件からランダムに選択（お気に入りが上位に来やすい）
      const topRecipes = validRecipes.slice(0, Math.min(5, validRecipes.length));
      const selectedIndex = Math.floor(Math.random() * topRecipes.length);
      const selected = topRecipes[selectedIndex].recipe;

      selectedRecipes.push(selected);
      plans.push({
        dayOfWeek: day,
        recipe: selected,
        scaleFactor: opts.servings / selected.servings,
        isForBento: false,
      });
    }
  });

  // カテゴリバランスを集計
  const categoryBalance: Record<RecipeCategory, number> = {
    japanese: 0,
    western: 0,
    chinese: 0,
    asian: 0,
    other: 0,
  };
  selectedRecipes.forEach(r => {
    categoryBalance[r.category]++;
  });

  // 合計調理時間
  const totalCookingTime = selectedRecipes.reduce(
    (sum, r) => sum + r.cooking_time_minutes,
    0
  );

  // 共通食材を検出
  const sharedIngredients = findSharedIngredients(selectedRecipes);

  // 週の開始日を計算（今週の月曜日）
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekStart = monday.toISOString().split('T')[0];

  return {
    id: `weekly-plan-fav-${Date.now()}`,
    weekStart,
    plans,
    totalCookingTime,
    categoryBalance,
    sharedIngredients,
  };
};

/**
 * お気に入り献立のサマリーを生成（お気に入り数を表示）
 */
export const getFavoriteBasedPlanSummary = async (
  plan: GeneratedWeeklyPlan
): Promise<string> => {
  const learnedPrefs = await getLearnedPreferences();
  const baseSummary = getWeeklyPlanSummary(plan);

  if (!learnedPrefs) {
    return baseSummary;
  }

  // お気に入りレシピの数をカウント
  const favoriteCount = plan.plans.filter(p =>
    learnedPrefs.favoriteRecipeIds.includes(p.recipe.id) ||
    learnedPrefs.wouldMakeAgainIds.includes(p.recipe.id)
  ).length;

  if (favoriteCount > 0) {
    return `${baseSummary}\n⭐ お気に入りレシピ: ${favoriteCount}品`;
  }

  return baseSummary;
};

/**
 * 今週のおすすめお気に入りレシピを取得
 */
export const getRecommendedFavorites = async (
  count: number = 5,
  excludeRecipeIds: string[] = []
): Promise<Recipe[]> => {
  const learnedPrefs = await getLearnedPreferences();

  if (!learnedPrefs) {
    // 好みがない場合は人気レシピを返す
    return MOCK_RECIPES
      .filter(r => !excludeRecipeIds.includes(r.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  // お気に入りと「また作りたい」レシピを優先
  const priorityIds = [
    ...learnedPrefs.favoriteRecipeIds,
    ...learnedPrefs.wouldMakeAgainIds,
  ];

  const scoredRecipes = MOCK_RECIPES
    .filter(r => !excludeRecipeIds.includes(r.id))
    .map(recipe => ({
      recipe,
      score: calculateRecipePreferenceScore(recipe, learnedPrefs),
      isFavorite: priorityIds.includes(recipe.id),
    }));

  // お気に入り優先、その後スコア順
  scoredRecipes.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.score - a.score;
  });

  return scoredRecipes.slice(0, count).map(sr => sr.recipe);
};

/**
 * 好みに基づいたレシピ提案（新しいレシピの発見用）
 * お気に入りではないが、好みに合いそうなレシピを提案
 */
export const suggestNewRecipesBasedOnTaste = async (
  count: number = 5,
  excludeRecipeIds: string[] = []
): Promise<Recipe[]> => {
  const learnedPrefs = await getLearnedPreferences();

  if (!learnedPrefs) {
    // 好みがない場合はランダムに返す
    return MOCK_RECIPES
      .filter(r => !excludeRecipeIds.includes(r.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  // 既に作ったことがあるレシピを除外
  const knownRecipeIds = [
    ...learnedPrefs.favoriteRecipeIds,
    ...learnedPrefs.wouldMakeAgainIds,
    ...learnedPrefs.dislikedRecipeIds,
  ];

  const newRecipes = MOCK_RECIPES.filter(
    r => !excludeRecipeIds.includes(r.id) && !knownRecipeIds.includes(r.id)
  );

  // 好みスコアで評価
  const scoredRecipes = newRecipes.map(recipe => ({
    recipe,
    score: calculateRecipePreferenceScore(recipe, learnedPrefs),
  }));

  // スコア順にソートしつつランダム性を加える
  scoredRecipes.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    // 上位グループ内ではランダム性を加える
    if (Math.abs(scoreDiff) < 20) {
      return Math.random() - 0.5;
    }
    return scoreDiff;
  });

  return scoredRecipes.slice(0, count).map(sr => sr.recipe);
};

// ============================================
// 心理タイプ別 週間献立生成
// 共通レシピ + タイプ別レシピのミックス提案
// ============================================

// レシピ分類キャッシュ
let recipeClassificationCache: Map<string, RecipeTypeClassification> = new Map();

/**
 * レシピの分類結果をキャッシュから取得、なければ計算
 */
const getRecipeClassification = (recipe: Recipe): RecipeTypeClassification => {
  if (recipeClassificationCache.has(recipe.id)) {
    return recipeClassificationCache.get(recipe.id)!;
  }
  const classification = classifyRecipe(recipe);
  recipeClassificationCache.set(recipe.id, classification);
  return classification;
};

/**
 * 全レシピの分類を初期化
 */
export const initializeRecipeClassifications = (): void => {
  recipeClassificationCache.clear();
  MOCK_RECIPES.forEach(recipe => {
    const classification = classifyRecipe(recipe);
    recipeClassificationCache.set(recipe.id, classification);
  });
};

/**
 * 特定タイプのレシピをフィルタリング
 */
export const getRecipesByAudience = (
  audience: RecipeAudience,
  psychologyType?: FoodPsychologyType
): Recipe[] => {
  return MOCK_RECIPES.filter(recipe => {
    const classification = getRecipeClassification(recipe);

    if (classification.audience !== audience) {
      return false;
    }

    // type_specific/type_exclusive の場合、タイプ一致をチェック
    if (audience !== 'universal' && psychologyType) {
      return classification.primaryTypes.includes(psychologyType) ||
             classification.secondaryTypes.includes(psychologyType);
    }

    return true;
  });
};

/**
 * 週テンプレートの制約（Plus機能）
 */
export interface WeekTemplateConstraints {
  maxCookingTimeMinutes?: number;    // 最大調理時間
  maxIngredientCount?: number;       // 最大材料数
  maxCostLevel?: number;             // 最大コストレベル
  preferredFlavorProfiles?: string[]; // 優先味プロファイル
  avoidFlavorProfiles?: string[];    // 避ける味プロファイル
  difficultyMax?: number;            // 最大難易度
}

/**
 * 心理タイプ別週間献立生成オプション
 */
export interface PsychologyBasedPlanOptions extends WeeklyPlanOptions {
  psychologyType: FoodPsychologyType;
  confidenceLevel?: number;  // 学習信頼度（0-100）
  mixConfig?: WeeklyMixConfig;  // カスタムミックス設定

  // Plus機能
  penaltyMultiplier?: number;         // 被り防止精度 (Free: 0.8, Plus: 1.0)
  weekTemplateConstraints?: WeekTemplateConstraints; // 週テンプレート制約
  adventureLevel?: number;            // 冒険レベル (1-5, Plus only)
}

/**
 * 心理タイプ別のレシピスコアリング（週間献立用）
 */
const scoreRecipeForPsychologyType = (
  recipe: Recipe,
  options: PsychologyBasedPlanOptions,
  selectedRecipes: Recipe[],
  previousRecipe: Recipe | null,
  slotType: 'universal' | 'type_specific' | 'adventure'
): number => {
  // 基本スコア
  let score = scoreRecipe(recipe, options, selectedRecipes, previousRecipe);

  if (score <= -1000) return score;

  const classification = getRecipeClassification(recipe);
  const psychologyScore = scoreRecipeByType(recipe, options.psychologyType);

  // === スロットタイプ別の加点 ===

  if (slotType === 'universal') {
    // 万人向けスロット: universal レシピを優先
    if (classification.audience === 'universal') {
      score += 50;
    } else if (classification.audience === 'type_specific') {
      score -= 20;
    } else {
      score -= 50;  // type_exclusive は避ける
    }
  } else if (slotType === 'type_specific') {
    // タイプ別スロット: そのタイプ向けのレシピを優先
    if (classification.primaryTypes.includes(options.psychologyType)) {
      score += 60;
    } else if (classification.secondaryTypes.includes(options.psychologyType)) {
      score += 30;
    }

    // 避けるタイプに入っていたら減点
    if (classification.avoidTypes.includes(options.psychologyType)) {
      score -= 80;
    }

    // 心理スコアも加算
    score += psychologyScore.totalScore * 0.5;
  } else if (slotType === 'adventure') {
    // 冒険スロット: 普段と違うものを提案
    const typeInfo = FOOD_TYPES[options.psychologyType];

    // 普段選ばないカテゴリにボーナス
    if (options.psychologyType === 'smart_balancer') {
      // スマートバランサーには時間がかかるがご褒美系を
      if (recipe.cooking_time_minutes >= 25) score += 20;
      if (['asian', 'other'].includes(recipe.category)) score += 30;
    } else if (options.psychologyType === 'healing_gourmet') {
      // ヒーリンググルマンには健康系を
      if (recipe.tags.some(t => t.includes('ヘルシー') || t.includes('野菜'))) {
        score += 30;
      }
      if (recipe.category === 'asian') score += 20;
    } else if (options.psychologyType === 'stoic_creator') {
      // ストイッククリエイターには癒し系を
      if (recipe.tags.some(t => t.includes('ほっこり') || t.includes('がっつり'))) {
        score += 30;
      }
    } else if (options.psychologyType === 'trend_hunter') {
      // トレンドハンターにはド定番を
      if (recipe.category === 'japanese' && classification.audience === 'universal') {
        score += 30;
      }
    }

    // 新しさにボーナス（まだ作っていないレシピ）
    score += 15;
  }

  return score;
};

/**
 * 心理タイプ別 週間献立を生成（被り防止ロジック統合版）
 * 3層構造の被り防止を適用:
 * - Layer 1: Hard Constraint（同一レシピ/signatureKey禁止）
 * - Layer 2: Soft Constraint（直前日・前々日との類似ペナルティ）
 * - Layer 3: Weekly Diversity（週枠構成によるバランス）
 */
export const generatePsychologyBasedWeeklyPlan = (
  options: Partial<PsychologyBasedPlanOptions>,
  enableDebugLog: boolean = false
): GeneratedWeeklyPlan => {
  const psychologyType = options.psychologyType || 'balanced';
  const confidenceLevel = options.confidenceLevel ?? 0;

  // Plus機能のデフォルト値
  const penaltyMultiplier = options.penaltyMultiplier ?? 1.0; // デフォルトは100%精度
  const weekTemplateConstraints = options.weekTemplateConstraints ?? {};

  const opts: PsychologyBasedPlanOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    psychologyType,
    confidenceLevel,
    penaltyMultiplier,
    weekTemplateConstraints,
  };

  // ミックス設定を取得
  const mixConfig = opts.mixConfig || getWeeklyMixConfig(psychologyType, confidenceLevel);

  // 7日分のスロットタイプを決定
  const slotTypes = determineWeeklySlots(mixConfig);

  // === 被り防止用の初期化 ===
  const slotConfig = generateDefaultWeeklySlots();
  let slotTracker = createEmptySlotTracker();
  const selectedRecipeInfos: SelectedRecipeInfo[] = [];

  const selectedRecipes: Recipe[] = [];
  const plans: DayPlan[] = [];

  if (enableDebugLog) {
    console.log('[WeeklyPlan] 生成開始 - psychologyType:', psychologyType);
  }

  // 各曜日について選択
  opts.daysToGenerate.forEach((day, index) => {
    const previousRecipe = index > 0 ? selectedRecipes[index - 1] : null;
    const slotType = slotTypes[index] || 'type_specific';

    // === 統合スコアリング ===
    const scoredCandidates: ScoreBreakdown[] = MOCK_RECIPES.map(recipe => {
      // 0. 週テンプレート制約チェック（Plus機能）
      const templateConstraints = opts.weekTemplateConstraints || {};
      let templatePenalty = 0;
      const templatePenaltyReasons: string[] = [];

      // 調理時間制約
      if (templateConstraints.maxCookingTimeMinutes &&
          recipe.cooking_time_minutes > templateConstraints.maxCookingTimeMinutes) {
        templatePenalty = -1000;
        templatePenaltyReasons.push(`調理時間超過(${recipe.cooking_time_minutes}分 > ${templateConstraints.maxCookingTimeMinutes}分)`);
      }

      // 材料数制約
      if (templateConstraints.maxIngredientCount &&
          recipe.ingredients.length > templateConstraints.maxIngredientCount) {
        templatePenalty = -1000;
        templatePenaltyReasons.push(`材料数超過(${recipe.ingredients.length} > ${templateConstraints.maxIngredientCount})`);
      }

      // 難易度制約
      if (templateConstraints.difficultyMax !== undefined) {
        const difficultyMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
        const recipeDifficulty = difficultyMap[recipe.difficulty] || 2;
        if (recipeDifficulty > templateConstraints.difficultyMax) {
          templatePenalty = -1000;
          templatePenaltyReasons.push(`難易度超過(${recipe.difficulty})`);
        }
      }

      // 避ける味プロファイル
      if (templateConstraints.avoidFlavorProfiles?.length) {
        const signature = getCachedSignature(recipe);
        if (templateConstraints.avoidFlavorProfiles.includes(signature.flavorProfile)) {
          templatePenalty = -500; // 完全除外ではなく大幅減点
          templatePenaltyReasons.push(`避けたい味(${signature.flavorProfile})`);
        }
      }

      // テンプレート制約で除外
      if (templatePenalty <= -1000) {
        return {
          recipeId: recipe.id,
          recipeName: recipe.name,
          baseScore: templatePenalty,
          hardConstraintPenalty: 0,
          softConstraintPenalty: 0,
          diversityBonus: 0,
          totalScore: templatePenalty,
          details: {
            signature: getCachedSignature(recipe),
            penalties: templatePenaltyReasons,
            bonuses: [],
          },
        };
      }

      // 1. 心理タイプ別の基本スコア
      const psychologyScore = scoreRecipeForPsychologyType(
        recipe,
        opts,
        selectedRecipes,
        previousRecipe,
        slotType
      );

      // 既に除外されているレシピはスキップ
      if (psychologyScore <= -1000) {
        return {
          recipeId: recipe.id,
          recipeName: recipe.name,
          baseScore: psychologyScore,
          hardConstraintPenalty: 0,
          softConstraintPenalty: 0,
          diversityBonus: 0,
          totalScore: psychologyScore,
          details: {
            signature: getCachedSignature(recipe),
            penalties: ['基本スコアで除外'],
            bonuses: [],
          },
        };
      }

      // 優先味プロファイルボーナス
      let templateBonus = 0;
      if (templateConstraints.preferredFlavorProfiles?.length) {
        const signature = getCachedSignature(recipe);
        if (templateConstraints.preferredFlavorProfiles.includes(signature.flavorProfile)) {
          templateBonus = 20;
        }
      }

      // 2. 被り防止スコアを計算（penaltyMultiplierを適用）
      // ベーススコアにテンプレートボーナスとペナルティを加算
      const adjustedBaseScore = psychologyScore + templateBonus + templatePenalty;

      const repeatPreventionScore = calculateRepeatPreventionScore(
        recipe,
        selectedRecipeInfos,
        slotConfig,
        slotTracker,
        adjustedBaseScore, // 心理タイプスコア + テンプレート調整
        penaltyMultiplier // Free: 0.8, Plus: 1.0
      );

      // テンプレート関連の情報を追加
      if (templateBonus > 0) {
        repeatPreventionScore.details.bonuses.push(`週テンプレート優先味: +${templateBonus}`);
      }

      return repeatPreventionScore;
    });

    // スコア順にソート
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

    // デバッグログ
    if (enableDebugLog) {
      console.log(`\n[WeeklyPlan] ${day}曜日 (index: ${index})`);
      logTopCandidates(scoredCandidates, 5);
    }

    // 上位5件からランダム抽選
    const selected = selectFromTopCandidates(scoredCandidates, 5);

    if (selected) {
      const selectedRecipe = MOCK_RECIPES.find(r => r.id === selected.recipeId)!;
      const signature = getCachedSignature(selectedRecipe);

      // 選択情報を記録
      selectedRecipeInfos.push({
        recipe: selectedRecipe,
        signature,
        dayIndex: index,
      });

      // 週枠トラッカーを更新
      slotTracker = updateSlotTracker(slotTracker, selectedRecipe, signature);

      selectedRecipes.push(selectedRecipe);
      plans.push({
        dayOfWeek: day,
        recipe: selectedRecipe,
        scaleFactor: opts.servings / selectedRecipe.servings,
        isForBento: false,
      });

      // デバッグログ
      if (enableDebugLog) {
        logSelectedRecipeFeatures(selectedRecipe, signature, index);
      }
    }
  });

  // カテゴリバランスを集計
  const categoryBalance: Record<RecipeCategory, number> = {
    japanese: 0,
    western: 0,
    chinese: 0,
    asian: 0,
    other: 0,
  };
  selectedRecipes.forEach(r => {
    categoryBalance[r.category]++;
  });

  // 合計調理時間
  const totalCookingTime = selectedRecipes.reduce(
    (sum, r) => sum + r.cooking_time_minutes,
    0
  );

  // 共通食材を検出
  const sharedIngredients = findSharedIngredients(selectedRecipes);

  // 週の開始日
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekStart = monday.toISOString().split('T')[0];

  if (enableDebugLog) {
    console.log('\n[WeeklyPlan] 生成完了');
    console.log('  カテゴリバランス:', categoryBalance);
    console.log('  共通食材:', sharedIngredients);
  }

  return {
    id: `weekly-plan-psych-${Date.now()}`,
    weekStart,
    plans,
    totalCookingTime,
    categoryBalance,
    sharedIngredients,
  };
};

/**
 * 被り防止の強度を調整するためのプリセット
 */
export const REPEAT_PREVENTION_PRESETS = {
  // 厳格モード: 被りを最小限に
  strict: {
    topN: 3,
    enableHardConstraint: true,
    enableSoftConstraint: true,
    enableDiversity: true,
  },
  // バランスモード（デフォルト）
  balanced: {
    topN: 5,
    enableHardConstraint: true,
    enableSoftConstraint: true,
    enableDiversity: true,
  },
  // 緩めモード: バリエーション重視
  relaxed: {
    topN: 8,
    enableHardConstraint: true,
    enableSoftConstraint: true,
    enableDiversity: false,
  },
  // 最低限モード: 直近2日のみチェック
  minimal: {
    topN: 10,
    enableHardConstraint: true,
    enableSoftConstraint: true,
    enableDiversity: false,
  },
} as const;

/**
 * 心理タイプ別献立のサマリーを生成
 */
export const getPsychologyPlanSummary = (
  plan: GeneratedWeeklyPlan,
  psychologyType: FoodPsychologyType
): string => {
  const typeInfo = FOOD_TYPES[psychologyType];
  const baseSummary = getWeeklyPlanSummary(plan);

  // 各レシピの分類を集計
  let universalCount = 0;
  let typeSpecificCount = 0;
  let adventureCount = 0;

  plan.plans.forEach(p => {
    const classification = getRecipeClassification(p.recipe);
    if (classification.audience === 'universal') {
      universalCount++;
    } else if (classification.primaryTypes.includes(psychologyType)) {
      typeSpecificCount++;
    } else {
      adventureCount++;
    }
  });

  let summary = `${typeInfo.emoji} ${typeInfo.name}タイプの今週の献立\n`;
  summary += baseSummary;
  summary += `\n\n`;
  summary += `📊 構成: 定番${universalCount}品 / あなた向け${typeSpecificCount}品`;
  if (adventureCount > 0) {
    summary += ` / 冒険${adventureCount}品`;
  }

  return summary;
};

/**
 * タイプ別のおすすめ度を表示するヘルパー
 */
export const getRecipeTypeMatchDescription = (
  recipe: Recipe,
  psychologyType: FoodPsychologyType
): { label: string; emoji: string; color: string } => {
  const classification = getRecipeClassification(recipe);
  const score = scoreRecipeByType(recipe, psychologyType);

  if (classification.audience === 'universal') {
    return {
      label: 'みんなの定番',
      emoji: '👍',
      color: '#666',
    };
  }

  if (classification.primaryTypes.includes(psychologyType)) {
    return {
      label: 'あなた向け！',
      emoji: '⭐',
      color: FOOD_TYPES[psychologyType].color,
    };
  }

  if (classification.secondaryTypes.includes(psychologyType)) {
    return {
      label: '相性◎',
      emoji: '✨',
      color: '#4CAF50',
    };
  }

  if (classification.avoidTypes.includes(psychologyType)) {
    return {
      label: '冒険メニュー',
      emoji: '🌟',
      color: '#FF9800',
    };
  }

  return {
    label: '',
    emoji: '',
    color: 'transparent',
  };
};

// ============================================
// レシピ選択理由の生成（納得感の可視化）
// ============================================

/**
 * レシピの選択理由を生成
 * @param recipe 選択されたレシピ
 * @param psychologyType ユーザーの心理タイプ
 * @param slotType スロットタイプ（universal/type_specific/adventure）
 * @param sharedIngredients 週間の共通食材リスト
 * @param weekIndex 週の何日目か（0-6）
 */
export const generateRecipeReason = (
  recipe: Recipe,
  psychologyType: FoodPsychologyType,
  slotType: 'universal' | 'type_specific' | 'adventure',
  sharedIngredients: string[] = [],
  weekIndex: number = 0
): string => {
  const typeInfo = FOOD_TYPES[psychologyType];
  const classification = getRecipeClassification(recipe);
  const reasonParts: string[] = [];

  // === スロットタイプに基づく主理由 ===
  if (slotType === 'universal') {
    // 万人向けスロット
    reasonParts.push('みんな大好き定番');
  } else if (slotType === 'type_specific') {
    // タイプ別スロット
    if (classification.primaryTypes.includes(psychologyType)) {
      reasonParts.push(`${typeInfo.name}のあなた向け`);
    } else if (classification.secondaryTypes.includes(psychologyType)) {
      reasonParts.push(`${typeInfo.name}と相性◎`);
    } else {
      // タイプスコアからキーワードを抽出
      const score = scoreRecipeByType(recipe, psychologyType);
      if (score.totalScore >= 30) {
        reasonParts.push(`${typeInfo.name}におすすめ`);
      } else {
        reasonParts.push('バランス重視');
      }
    }
  } else if (slotType === 'adventure') {
    // 冒険スロット
    const adventureReasons = [
      '今週の冒険枠',
      '新しい味にチャレンジ',
      'いつもと違う一品',
    ];
    reasonParts.push(adventureReasons[weekIndex % adventureReasons.length]);
  }

  // === 副理由（共通食材の活用） ===
  if (sharedIngredients.length > 0) {
    // このレシピで使う共通食材を探す
    const ingredientNames = recipe.ingredients.map(i => i.name);
    const usedSharedIngredients = sharedIngredients.filter(shared =>
      ingredientNames.some(name => name.includes(shared) || shared.includes(name))
    );

    if (usedSharedIngredients.length > 0) {
      const sharedName = usedSharedIngredients[0];
      reasonParts.push(`${sharedName}を使い回し`);
    }
  }

  // === レシピ特性に基づく追加理由 ===
  const tags = recipe.tags || [];

  // 時短レシピ
  if (recipe.cooking_time_minutes <= 15) {
    if (!reasonParts.some(r => r.includes('時短'))) {
      reasonParts.push('⏱ 時短');
    }
  }

  // ヘルシー系
  if (tags.some(t => t.includes('ヘルシー') || t.includes('野菜たっぷり') || t.includes('低カロリー'))) {
    if (!reasonParts.some(r => r.includes('ヘルシー'))) {
      reasonParts.push('ヘルシー');
    }
  }

  // 定番・家庭料理
  if (tags.some(t => t.includes('定番') || t.includes('家庭料理')) && slotType !== 'universal') {
    if (!reasonParts.some(r => r.includes('定番'))) {
      reasonParts.push('安心の定番');
    }
  }

  // 最大2つの理由を結合
  const selectedReasons = reasonParts.slice(0, 2);
  return selectedReasons.join('＋');
};

/**
 * スロットタイプから表示用ラベルを取得
 */
export const getSlotTypeLabel = (
  slotType: 'universal' | 'type_specific' | 'adventure'
): { label: string; emoji: string; color: string } => {
  switch (slotType) {
    case 'universal':
      return { label: '定番', emoji: '👍', color: '#666666' };
    case 'type_specific':
      return { label: 'あなた向け', emoji: '⭐', color: '#D4490F' };
    case 'adventure':
      return { label: '冒険', emoji: '🌟', color: '#FF9800' };
    default:
      return { label: '', emoji: '', color: 'transparent' };
  }
};

/**
 * 分類統計を取得（デバッグ・分析用）
 */
export const getRecipeClassificationStats = (): {
  total: number;
  byAudience: Record<RecipeAudience, number>;
  byPrimaryType: Record<FoodPsychologyType, number>;
} => {
  const stats = {
    total: MOCK_RECIPES.length,
    byAudience: {
      universal: 0,
      type_specific: 0,
      type_exclusive: 0,
    },
    byPrimaryType: {
      smart_balancer: 0,
      stoic_creator: 0,
      healing_gourmet: 0,
      trend_hunter: 0,
      balanced: 0,
    },
  };

  MOCK_RECIPES.forEach(recipe => {
    const classification = getRecipeClassification(recipe);
    stats.byAudience[classification.audience]++;
    classification.primaryTypes.forEach(type => {
      stats.byPrimaryType[type]++;
    });
  });

  return stats;
};
