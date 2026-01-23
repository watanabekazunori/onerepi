// ============================================
// ワンパン・バディ - ユーザータイプ学習システム
// 5タイプ → 30パターンへの進化ロジック
// ============================================

import { Recipe } from '../types';
import { FoodPsychologyType, FOOD_TYPES, PsychologyTag } from './preferenceScoring';

// ============================================
// レシピのタイプ分類（共通 vs タイプ別）
// ============================================

/**
 * レシピの対象タイプ分類
 * - universal: 誰もが好む万人向けレシピ
 * - type_specific: 特定タイプ向けレシピ
 * - type_exclusive: 特定タイプに強く好まれるが他タイプには避けられがち
 */
export type RecipeAudience = 'universal' | 'type_specific' | 'type_exclusive';

export interface RecipeTypeClassification {
  recipeId: string;
  audience: RecipeAudience;
  primaryTypes: FoodPsychologyType[];  // メインターゲットタイプ
  secondaryTypes: FoodPsychologyType[]; // サブターゲットタイプ
  avoidTypes: FoodPsychologyType[];     // 避けた方がいいタイプ
  universalScore: number;               // 万人受け度（0-100）
  typeAffinityScores: Record<FoodPsychologyType, number>; // タイプ別親和性
}

/**
 * レシピを自動分類するロジック
 * タグ、カテゴリ、調理時間などからタイプ親和性を計算
 */
export const classifyRecipe = (recipe: Recipe): RecipeTypeClassification => {
  const typeScores: Record<FoodPsychologyType, number> = {
    smart_balancer: 0,
    stoic_creator: 0,
    healing_gourmet: 0,
    trend_hunter: 0,
    balanced: 50, // バランス型は常に中間
  };

  const tags = recipe.tags || [];
  const category = recipe.category;
  const time = recipe.cooking_time_minutes;
  const difficulty = recipe.difficulty;

  // ===== スマート・バランサー向け判定 =====
  // 時短・効率重視
  if (time <= 15) typeScores.smart_balancer += 30;
  else if (time <= 20) typeScores.smart_balancer += 20;
  else if (time > 40) typeScores.smart_balancer -= 20;

  if (difficulty === 'easy') typeScores.smart_balancer += 15;
  if (recipe.is_bento_friendly) typeScores.smart_balancer += 10;

  // タグチェック
  const smartTags = ['時短', '簡単', '作り置き', '定番', '節約', 'コスパ'];
  smartTags.forEach(t => {
    if (tags.some(tag => tag.includes(t))) typeScores.smart_balancer += 10;
  });

  // 和食・定番は加点
  if (category === 'japanese') typeScores.smart_balancer += 10;

  // ===== ストイック・クリエイター向け判定 =====
  // 健康・体づくり重視
  const stoicTags = ['高タンパク', 'ヘルシー', '低糖質', '低カロリー', '野菜たっぷり', 'ダイエット'];
  stoicTags.forEach(t => {
    if (tags.some(tag => tag.includes(t))) typeScores.stoic_creator += 15;
  });

  // タンパク質多めの食材チェック
  const proteinIngredients = recipe.ingredients.filter(i => i.category === 'protein');
  if (proteinIngredients.length >= 1) typeScores.stoic_creator += 10;

  // 難易度が高いと加点（チャレンジ好き）
  if (difficulty === 'hard') typeScores.stoic_creator += 5;

  // 創作・アレンジ系
  if (tags.some(tag => tag.includes('アレンジ'))) typeScores.stoic_creator += 10;

  // ===== ヒーリング・グルマン向け判定 =====
  // 癒し・家庭的重視
  const healingTags = ['ほっこり', '家庭料理', '定番', '煮物', 'がっつり', '濃厚', 'こってり'];
  healingTags.forEach(t => {
    if (tags.some(tag => tag.includes(t))) typeScores.healing_gourmet += 15;
  });

  // 和食・洋食は加点
  if (category === 'japanese' || category === 'western') {
    typeScores.healing_gourmet += 10;
  }

  // 煮込み時間が長いと加点
  if (time >= 30) typeScores.healing_gourmet += 10;

  // ===== トレンド・ハンター向け判定 =====
  // エンタメ・新しさ重視
  const trendTags = ['エスニック', 'アジアン', 'スパイシー', '映え', 'おしゃれ', 'カフェ風', 'ピリ辛'];
  trendTags.forEach(t => {
    if (tags.some(tag => tag.includes(t))) typeScores.trend_hunter += 15;
  });

  // アジアン・その他は加点
  if (category === 'asian' || category === 'other') {
    typeScores.trend_hunter += 15;
  }

  // 難易度が高いと加点（本格派好き）
  if (difficulty === 'hard') typeScores.trend_hunter += 10;

  // ===== 分類判定 =====
  const scores = Object.entries(typeScores)
    .filter(([type]) => type !== 'balanced')
    .sort((a, b) => b[1] - a[1]) as [FoodPsychologyType, number][];

  const maxScore = scores[0][1];
  const minScore = scores[scores.length - 1][1];
  const scoreRange = maxScore - minScore;

  // 万人受け度を計算（スコア差が小さいほど万人受け）
  const universalScore = Math.max(0, 100 - scoreRange * 2);

  // 分類決定
  let audience: RecipeAudience;
  let primaryTypes: FoodPsychologyType[] = [];
  let secondaryTypes: FoodPsychologyType[] = [];
  let avoidTypes: FoodPsychologyType[] = [];

  if (universalScore >= 70) {
    // 万人向け
    audience = 'universal';
    primaryTypes = scores.filter(([_, s]) => s >= 30).map(([t]) => t);
  } else if (scoreRange >= 50) {
    // 特定タイプ専用
    audience = 'type_exclusive';
    primaryTypes = scores.filter(([_, s]) => s >= maxScore - 10).map(([t]) => t);
    avoidTypes = scores.filter(([_, s]) => s <= minScore + 10).map(([t]) => t);
  } else {
    // タイプ別
    audience = 'type_specific';
    primaryTypes = scores.filter(([_, s]) => s >= maxScore - 15).map(([t]) => t);
    secondaryTypes = scores.filter(([_, s]) => s >= 20 && s < maxScore - 15).map(([t]) => t);
  }

  return {
    recipeId: recipe.id,
    audience,
    primaryTypes,
    secondaryTypes,
    avoidTypes,
    universalScore,
    typeAffinityScores: typeScores,
  };
};

// ============================================
// ユーザー学習データ（30パターン進化用）
// ============================================

/**
 * 学習対象の属性（30パターンへの細分化軸）
 */
export interface LearningDimensions {
  // 味の好み（詳細）
  tastePreferences: {
    sweetness: number;    // 甘さ好み: -100(苦手) ～ +100(好き)
    saltiness: number;    // 塩味好み
    sourness: number;     // 酸味好み
    spiciness: number;    // 辛さ好み
    umami: number;        // うま味（濃厚さ）好み
  };

  // 食材の好み
  ingredientPreferences: {
    meat: number;         // 肉好き度
    fish: number;         // 魚好き度
    vegetables: number;   // 野菜好き度
    tofu: number;         // 豆腐・大豆製品好き度
  };

  // 調理スタイル
  cookingStylePreferences: {
    quickMeals: number;   // 時短料理好き度
    slowCooking: number;  // じっくり調理好き度
    onePan: number;       // ワンパン料理好き度
    mealPrep: number;     // 作り置き好き度
  };

  // カテゴリ好み
  categoryPreferences: {
    japanese: number;
    western: number;
    chinese: number;
    asian: number;
    other: number;
  };

  // 体験志向
  experiencePreferences: {
    novelty: number;      // 新しさ好き度
    comfort: number;      // 安心感重視度
    health: number;       // 健康重視度
    indulgence: number;   // 贅沢・背徳感好き度
  };
}

/**
 * ユーザー学習プロファイル
 */
export interface UserLearningProfile {
  // 基本タイプ（5タイプ）
  baseType: FoodPsychologyType;

  // 詳細学習データ
  dimensions: LearningDimensions;

  // 学習メタデータ
  metadata: {
    totalInteractions: number;    // 総インタラクション数
    totalCookedRecipes: number;   // 作った料理数
    totalRatings: number;         // 評価した回数
    learningStartDate: string;    // 学習開始日
    lastUpdated: string;          // 最終更新日
    confidenceLevel: number;      // 学習信頼度 (0-100)
  };

  // 細分化タイプ（30パターン用）
  subTypeId?: string;             // 例: "smart_balancer_spicy_lover"
  subTypeLabel?: string;          // 例: "スマート・バランサー（辛いもの好き）"
}

/**
 * 学習に必要なインタラクション数の目安
 */
export const LEARNING_MILESTONES = {
  BASIC_UNDERSTANDING: 10,    // 基本理解（10回）
  MODERATE_CONFIDENCE: 30,    // 中程度の信頼度（30回）
  HIGH_CONFIDENCE: 50,        // 高い信頼度（50回）
  EXPERT_LEVEL: 100,          // エキスパートレベル（100回）
};

/**
 * 信頼度レベルの定義
 */
export const getConfidenceLevel = (interactions: number): {
  level: 'beginner' | 'learning' | 'moderate' | 'confident' | 'expert';
  percentage: number;
  label: string;
  description: string;
} => {
  if (interactions < LEARNING_MILESTONES.BASIC_UNDERSTANDING) {
    return {
      level: 'beginner',
      percentage: (interactions / LEARNING_MILESTONES.BASIC_UNDERSTANDING) * 25,
      label: '学習中',
      description: `あと${LEARNING_MILESTONES.BASIC_UNDERSTANDING - interactions}回の料理で基本理解に到達`,
    };
  } else if (interactions < LEARNING_MILESTONES.MODERATE_CONFIDENCE) {
    return {
      level: 'learning',
      percentage: 25 + ((interactions - 10) / 20) * 25,
      label: '理解深化中',
      description: `あと${LEARNING_MILESTONES.MODERATE_CONFIDENCE - interactions}回で中程度の精度に`,
    };
  } else if (interactions < LEARNING_MILESTONES.HIGH_CONFIDENCE) {
    return {
      level: 'moderate',
      percentage: 50 + ((interactions - 30) / 20) * 25,
      label: 'あなたを理解',
      description: `あと${LEARNING_MILESTONES.HIGH_CONFIDENCE - interactions}回で高精度に`,
    };
  } else if (interactions < LEARNING_MILESTONES.EXPERT_LEVEL) {
    return {
      level: 'confident',
      percentage: 75 + ((interactions - 50) / 50) * 20,
      label: 'かなり理解',
      description: `あと${LEARNING_MILESTONES.EXPERT_LEVEL - interactions}回でエキスパートに`,
    };
  } else {
    return {
      level: 'expert',
      percentage: Math.min(100, 95 + (interactions - 100) * 0.05),
      label: 'エキスパート',
      description: 'あなたの好みを熟知しています！',
    };
  }
};

/**
 * デフォルトの学習プロファイル
 */
export const createDefaultLearningProfile = (baseType: FoodPsychologyType): UserLearningProfile => {
  // タイプに応じた初期値を設定
  const typeDefaults: Record<FoodPsychologyType, Partial<LearningDimensions>> = {
    smart_balancer: {
      cookingStylePreferences: { quickMeals: 60, slowCooking: -20, onePan: 50, mealPrep: 50 },
      experiencePreferences: { novelty: -30, comfort: 40, health: 30, indulgence: -20 },
    },
    stoic_creator: {
      ingredientPreferences: { meat: 30, fish: 20, vegetables: 50, tofu: 30 },
      experiencePreferences: { novelty: 30, comfort: 0, health: 70, indulgence: -40 },
    },
    healing_gourmet: {
      tastePreferences: { sweetness: 20, saltiness: 20, sourness: 0, spiciness: -20, umami: 50 },
      experiencePreferences: { novelty: -30, comfort: 70, health: 0, indulgence: 40 },
    },
    trend_hunter: {
      tastePreferences: { sweetness: 0, saltiness: 0, sourness: 10, spiciness: 40, umami: 20 },
      experiencePreferences: { novelty: 70, comfort: -20, health: 0, indulgence: 30 },
    },
    balanced: {
      experiencePreferences: { novelty: 0, comfort: 0, health: 0, indulgence: 0 },
    },
  };

  const defaults = typeDefaults[baseType];

  return {
    baseType,
    dimensions: {
      tastePreferences: {
        sweetness: defaults.tastePreferences?.sweetness ?? 0,
        saltiness: defaults.tastePreferences?.saltiness ?? 0,
        sourness: defaults.tastePreferences?.sourness ?? 0,
        spiciness: defaults.tastePreferences?.spiciness ?? 0,
        umami: defaults.tastePreferences?.umami ?? 0,
      },
      ingredientPreferences: {
        meat: defaults.ingredientPreferences?.meat ?? 0,
        fish: defaults.ingredientPreferences?.fish ?? 0,
        vegetables: defaults.ingredientPreferences?.vegetables ?? 0,
        tofu: defaults.ingredientPreferences?.tofu ?? 0,
      },
      cookingStylePreferences: {
        quickMeals: defaults.cookingStylePreferences?.quickMeals ?? 0,
        slowCooking: defaults.cookingStylePreferences?.slowCooking ?? 0,
        onePan: defaults.cookingStylePreferences?.onePan ?? 0,
        mealPrep: defaults.cookingStylePreferences?.mealPrep ?? 0,
      },
      categoryPreferences: {
        japanese: 0,
        western: 0,
        chinese: 0,
        asian: 0,
        other: 0,
      },
      experiencePreferences: {
        novelty: defaults.experiencePreferences?.novelty ?? 0,
        comfort: defaults.experiencePreferences?.comfort ?? 0,
        health: defaults.experiencePreferences?.health ?? 0,
        indulgence: defaults.experiencePreferences?.indulgence ?? 0,
      },
    },
    metadata: {
      totalInteractions: 0,
      totalCookedRecipes: 0,
      totalRatings: 0,
      learningStartDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      confidenceLevel: 0,
    },
  };
};

// ============================================
// 学習更新ロジック
// ============================================

export type UserAction =
  | 'cooked'           // 料理した
  | 'rated_positive'   // 高評価（4-5点）
  | 'rated_neutral'    // 普通評価（3点）
  | 'rated_negative'   // 低評価（1-2点）
  | 'favorited'        // お気に入り追加
  | 'unfavorited'      // お気に入り解除
  | 'skipped'          // スキップした
  | 'replaced';        // 別のレシピに変更した

/**
 * ユーザーアクションから学習を更新
 */
export const updateLearningFromAction = (
  profile: UserLearningProfile,
  recipe: Recipe,
  action: UserAction,
  rating?: number
): UserLearningProfile => {
  const updated = { ...profile };
  const dims = { ...updated.dimensions };

  // アクションの重み
  const weights: Record<UserAction, number> = {
    cooked: 5,
    rated_positive: 10,
    rated_neutral: 2,
    rated_negative: -8,
    favorited: 15,
    unfavorited: -10,
    skipped: -3,
    replaced: -5,
  };

  const weight = weights[action];

  // カテゴリ好みを更新
  if (dims.categoryPreferences[recipe.category as keyof typeof dims.categoryPreferences] !== undefined) {
    dims.categoryPreferences[recipe.category as keyof typeof dims.categoryPreferences] += weight;
  }

  // タグから属性を更新
  const tags = recipe.tags || [];

  // 味の好み更新
  if (tags.some(t => t.includes('甘') || t.includes('照り焼き'))) {
    dims.tastePreferences.sweetness += weight * 0.5;
  }
  if (tags.some(t => t.includes('辛') || t.includes('スパイシー') || t.includes('ピリ辛'))) {
    dims.tastePreferences.spiciness += weight * 0.5;
  }
  if (tags.some(t => t.includes('さっぱり') || t.includes('酢'))) {
    dims.tastePreferences.sourness += weight * 0.5;
  }
  if (tags.some(t => t.includes('濃厚') || t.includes('こってり') || t.includes('がっつり'))) {
    dims.tastePreferences.umami += weight * 0.5;
  }

  // 調理スタイル更新
  if (recipe.cooking_time_minutes <= 15) {
    dims.cookingStylePreferences.quickMeals += weight * 0.3;
  } else if (recipe.cooking_time_minutes >= 40) {
    dims.cookingStylePreferences.slowCooking += weight * 0.3;
  }

  // 体験志向更新
  if (recipe.category === 'asian' || recipe.category === 'other') {
    dims.experiencePreferences.novelty += weight * 0.3;
  }
  if (tags.some(t => t.includes('ほっこり') || t.includes('家庭'))) {
    dims.experiencePreferences.comfort += weight * 0.3;
  }
  if (tags.some(t => t.includes('ヘルシー') || t.includes('低糖質') || t.includes('野菜'))) {
    dims.experiencePreferences.health += weight * 0.3;
  }
  if (tags.some(t => t.includes('背徳') || t.includes('こってり') || t.includes('濃厚'))) {
    dims.experiencePreferences.indulgence += weight * 0.3;
  }

  // 値を -100 ～ +100 にクランプ
  const clamp = (val: number) => Math.max(-100, Math.min(100, val));

  dims.tastePreferences = {
    sweetness: clamp(dims.tastePreferences.sweetness),
    saltiness: clamp(dims.tastePreferences.saltiness),
    sourness: clamp(dims.tastePreferences.sourness),
    spiciness: clamp(dims.tastePreferences.spiciness),
    umami: clamp(dims.tastePreferences.umami),
  };

  dims.cookingStylePreferences = {
    quickMeals: clamp(dims.cookingStylePreferences.quickMeals),
    slowCooking: clamp(dims.cookingStylePreferences.slowCooking),
    onePan: clamp(dims.cookingStylePreferences.onePan),
    mealPrep: clamp(dims.cookingStylePreferences.mealPrep),
  };

  dims.experiencePreferences = {
    novelty: clamp(dims.experiencePreferences.novelty),
    comfort: clamp(dims.experiencePreferences.comfort),
    health: clamp(dims.experiencePreferences.health),
    indulgence: clamp(dims.experiencePreferences.indulgence),
  };

  // メタデータ更新
  updated.metadata.totalInteractions += 1;
  if (action === 'cooked') updated.metadata.totalCookedRecipes += 1;
  if (action.startsWith('rated')) updated.metadata.totalRatings += 1;
  updated.metadata.lastUpdated = new Date().toISOString();
  updated.metadata.confidenceLevel = getConfidenceLevel(updated.metadata.totalInteractions).percentage;

  updated.dimensions = dims;

  // サブタイプの更新判定
  updated.subTypeId = determineSubType(updated);
  updated.subTypeLabel = getSubTypeLabel(updated);

  return updated;
};

// ============================================
// サブタイプ判定（30パターン用）
// ============================================

/**
 * 学習データからサブタイプを判定
 */
const determineSubType = (profile: UserLearningProfile): string => {
  const base = profile.baseType;
  const dims = profile.dimensions;
  const suffixes: string[] = [];

  // 際立った特徴を抽出
  if (dims.tastePreferences.spiciness >= 40) suffixes.push('spicy');
  if (dims.tastePreferences.sweetness >= 40) suffixes.push('sweet');
  if (dims.tastePreferences.umami >= 40) suffixes.push('rich');
  if (dims.cookingStylePreferences.quickMeals >= 50) suffixes.push('quick');
  if (dims.cookingStylePreferences.mealPrep >= 50) suffixes.push('mealprep');
  if (dims.experiencePreferences.health >= 50) suffixes.push('health');
  if (dims.experiencePreferences.novelty >= 50) suffixes.push('adventurous');
  if (dims.experiencePreferences.comfort >= 50) suffixes.push('comfort');

  if (suffixes.length === 0) {
    return `${base}_standard`;
  }

  return `${base}_${suffixes.slice(0, 2).join('_')}`;
};

/**
 * サブタイプの日本語ラベルを生成
 */
const getSubTypeLabel = (profile: UserLearningProfile): string => {
  const baseInfo = FOOD_TYPES[profile.baseType];
  const dims = profile.dimensions;
  const features: string[] = [];

  if (dims.tastePreferences.spiciness >= 40) features.push('辛いもの好き');
  if (dims.tastePreferences.sweetness >= 40) features.push('甘めが好き');
  if (dims.tastePreferences.umami >= 40) features.push('濃い味派');
  if (dims.cookingStylePreferences.quickMeals >= 50) features.push('時短重視');
  if (dims.experiencePreferences.health >= 50) features.push('健康志向');
  if (dims.experiencePreferences.novelty >= 50) features.push('冒険好き');

  if (features.length === 0) {
    return baseInfo.name;
  }

  return `${baseInfo.name}（${features.slice(0, 2).join('・')}）`;
};

// ============================================
// 週間献立のミックス提案ロジック
// ============================================

export interface WeeklyMixConfig {
  universalRatio: number;     // 万人向けレシピの割合 (0-1)
  typeSpecificRatio: number;  // タイプ別レシピの割合 (0-1)
  adventureRatio: number;     // 冒険枠の割合 (0-1)
}

/**
 * タイプに応じた週間ミックス設定を取得
 */
export const getWeeklyMixConfig = (
  psychologyType: FoodPsychologyType,
  confidenceLevel: number
): WeeklyMixConfig => {
  // 信頼度が低いうちは万人向けを多めに
  const baseUniversalRatio = confidenceLevel < 30 ? 0.5 : 0.3;

  // タイプ別の設定
  const typeConfigs: Record<FoodPsychologyType, WeeklyMixConfig> = {
    smart_balancer: {
      universalRatio: baseUniversalRatio + 0.1,  // 定番多め
      typeSpecificRatio: 0.5,
      adventureRatio: 0.1,  // 冒険少なめ
    },
    stoic_creator: {
      universalRatio: baseUniversalRatio,
      typeSpecificRatio: 0.5,
      adventureRatio: 0.2,  // 新しいもの好き
    },
    healing_gourmet: {
      universalRatio: baseUniversalRatio + 0.1,  // 定番多め
      typeSpecificRatio: 0.5,
      adventureRatio: 0.1,  // 冒険少なめ
    },
    trend_hunter: {
      universalRatio: baseUniversalRatio - 0.1,  // 定番少なめ
      typeSpecificRatio: 0.4,
      adventureRatio: 0.4,  // 冒険多め
    },
    balanced: {
      universalRatio: baseUniversalRatio + 0.1,
      typeSpecificRatio: 0.4,
      adventureRatio: 0.2,
    },
  };

  return typeConfigs[psychologyType];
};

/**
 * 7日分の提案枠を決定
 */
export const determineWeeklySlots = (
  config: WeeklyMixConfig
): ('universal' | 'type_specific' | 'adventure')[] => {
  const slots: ('universal' | 'type_specific' | 'adventure')[] = [];
  const totalDays = 7;

  // 各枠の数を計算
  const universalCount = Math.round(totalDays * config.universalRatio);
  const adventureCount = Math.round(totalDays * config.adventureRatio);
  const typeSpecificCount = totalDays - universalCount - adventureCount;

  // 枠を追加
  for (let i = 0; i < universalCount; i++) slots.push('universal');
  for (let i = 0; i < typeSpecificCount; i++) slots.push('type_specific');
  for (let i = 0; i < adventureCount; i++) slots.push('adventure');

  // シャッフル（週の中でバラけさせる）
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  return slots;
};

// ============================================
// マイタイプ画面用のデータ構造
// ============================================

export interface MyTypeDisplayData {
  // 基本情報
  baseType: {
    id: FoodPsychologyType;
    name: string;
    emoji: string;
    description: string;
    color: string;
  };

  // サブタイプ情報
  subType?: {
    id: string;
    label: string;
  };

  // 学習進捗
  learningProgress: {
    level: string;
    percentage: number;
    label: string;
    description: string;
    nextMilestone: number;
    currentCount: number;
  };

  // 好みの可視化（レーダーチャート用）
  preferences: {
    labels: string[];
    values: number[];  // 0-100 に正規化
  };

  // 統計
  stats: {
    totalCooked: number;
    favoriteCategory: string;
    preferredCookingTime: string;
    topTags: string[];
  };

  // おすすめキーワード
  recommendedKeywords: string[];

  // 相性の良いレシピカテゴリ
  affinityCategories: {
    category: string;
    affinity: number;  // 0-100
  }[];
}

/**
 * マイタイプ画面用のデータを生成
 */
export const generateMyTypeDisplayData = (
  profile: UserLearningProfile
): MyTypeDisplayData => {
  const baseTypeInfo = FOOD_TYPES[profile.baseType];
  const confidence = getConfidenceLevel(profile.metadata.totalInteractions);
  const dims = profile.dimensions;

  // 好みを 0-100 に正規化
  const normalize = (val: number) => Math.round((val + 100) / 2);

  return {
    baseType: {
      id: profile.baseType,
      name: baseTypeInfo.name,
      emoji: baseTypeInfo.emoji,
      description: baseTypeInfo.fullDescription,
      color: baseTypeInfo.color,
    },
    subType: profile.subTypeId ? {
      id: profile.subTypeId,
      label: profile.subTypeLabel || baseTypeInfo.name,
    } : undefined,
    learningProgress: {
      level: confidence.level,
      percentage: Math.round(confidence.percentage),
      label: confidence.label,
      description: confidence.description,
      nextMilestone: profile.metadata.totalInteractions < 10 ? 10 :
                     profile.metadata.totalInteractions < 30 ? 30 :
                     profile.metadata.totalInteractions < 50 ? 50 : 100,
      currentCount: profile.metadata.totalInteractions,
    },
    preferences: {
      labels: ['時短', '健康志向', '新しさ', '安心感', '辛さ', '濃厚さ'],
      values: [
        normalize(dims.cookingStylePreferences.quickMeals),
        normalize(dims.experiencePreferences.health),
        normalize(dims.experiencePreferences.novelty),
        normalize(dims.experiencePreferences.comfort),
        normalize(dims.tastePreferences.spiciness),
        normalize(dims.tastePreferences.umami),
      ],
    },
    stats: {
      totalCooked: profile.metadata.totalCookedRecipes,
      favoriteCategory: Object.entries(dims.categoryPreferences)
        .sort((a, b) => b[1] - a[1])[0][0],
      preferredCookingTime: dims.cookingStylePreferences.quickMeals > 30 ? '15分以内' :
                           dims.cookingStylePreferences.slowCooking > 30 ? '30分以上' : '20分程度',
      topTags: baseTypeInfo.keywords.slice(0, 3),
    },
    recommendedKeywords: baseTypeInfo.keywords,
    affinityCategories: Object.entries(dims.categoryPreferences)
      .map(([cat, val]) => ({
        category: cat,
        affinity: normalize(val),
      }))
      .sort((a, b) => b.affinity - a.affinity),
  };
};
