// ============================================
// Recipe Repeat Prevention System
// 3層構造の被り防止ロジック
// Layer 1: Hard Constraint（絶対禁止）
// Layer 2: Soft Constraint（スコアペナルティ）
// Layer 3: Weekly Diversity（週全体のバランス）
// ============================================

import { Recipe, RecipeCategory } from '../types';

// ============================================
// 型定義
// ============================================

/**
 * メインタンパク質の種類
 */
export type MainProtein =
  | 'chicken'   // 鶏肉
  | 'pork'      // 豚肉
  | 'beef'      // 牛肉
  | 'fish'      // 魚
  | 'seafood'   // 魚介類（エビ・イカ等）
  | 'egg'       // 卵
  | 'tofu'      // 豆腐・大豆製品
  | 'processed' // 加工肉（ベーコン・ハム等）
  | 'none';     // タンパク質なし/不明

/**
 * 調理方法の種類
 */
export type CookingMethod =
  | 'stirfry'   // 炒める
  | 'grill'     // 焼く（フライパン/グリル）
  | 'boil'      // 煮る
  | 'steam'     // 蒸す
  | 'fry'       // 揚げる
  | 'simmer'    // 煮込む
  | 'microwave' // レンジ調理
  | 'raw'       // 生/和える
  | 'mixed';    // 複合

/**
 * 味のプロファイル
 */
export type FlavorProfile =
  | 'sweet_savory' // 甘辛い（照り焼き系）
  | 'salty'        // 塩味ベース
  | 'soy_based'    // 醤油ベース
  | 'miso_based'   // 味噌ベース
  | 'spicy'        // 辛い
  | 'light'        // あっさり
  | 'rich'         // こってり/クリーミー
  | 'sour'         // 酸味
  | 'umami';       // 旨味ベース

/**
 * 炭水化物タイプ
 */
export type CarbType =
  | 'rice'       // ご飯物
  | 'noodle'     // 麺類
  | 'bread'      // パン系
  | 'bowl'       // 丼物
  | 'none';      // 炭水化物なし

/**
 * レシピの特徴シグネチャ
 */
export interface RecipeSignature {
  mainProtein: MainProtein;
  cookingMethod: CookingMethod;
  flavorProfile: FlavorProfile;
  carbType: CarbType;
  signatureKey: string; // 例: "chicken_grill_sweet_savory"
}

/**
 * 選択済みレシピの情報（ペナルティ計算用）
 */
export interface SelectedRecipeInfo {
  recipe: Recipe;
  signature: RecipeSignature;
  dayIndex: number; // 0-6 (月-日)
}

/**
 * スコア内訳（デバッグ用）
 */
export interface ScoreBreakdown {
  recipeId: string;
  recipeName: string;
  baseScore: number;
  hardConstraintPenalty: number;
  softConstraintPenalty: number;
  diversityBonus: number;
  totalScore: number;
  details: {
    signature: RecipeSignature;
    penalties: string[];
    bonuses: string[];
  };
}

/**
 * 週枠構成
 */
export interface WeeklySlotConfig {
  categorySlots: Map<RecipeCategory, number>;  // カテゴリごとの枠数
  proteinSlots: Map<MainProtein, number>;       // タンパク質ごとの枠数
  cookingTimeSlots: {
    quick: number;    // 15分以下
    normal: number;   // 16-25分
    elaborate: number; // 26分以上
  };
}

// ============================================
// 定数（スコアペナルティ・ボーナス）
// ============================================

/**
 * ペナルティ定数（後から調整可能）
 */
export const PENALTY_CONSTANTS = {
  // Layer 1: Hard Constraint
  HARD_SAME_RECIPE: -10000,        // 同一レシピ
  HARD_SAME_SIGNATURE: -5000,      // 同一signatureKey

  // Layer 2: Soft Constraint - 直前日との比較
  PREV_SAME_CATEGORY: -10,
  PREV_SAME_PROTEIN: -12,
  PREV_SAME_COOKING_METHOD: -8,
  PREV_SAME_FLAVOR: -8,
  PREV_SAME_CARB_TYPE: -10,

  // Layer 2: Soft Constraint - 前々日との比較
  PREV2_SAME_PROTEIN: -6,

  // Layer 3: Weekly Diversity ボーナス/ペナルティ
  SLOT_MATCH_BONUS: 15,            // 週枠にマッチ
  SLOT_EXCEED_PENALTY: -20,        // 週枠超過
  DIVERSITY_CATEGORY_BONUS: 5,     // 未使用カテゴリ
  DIVERSITY_PROTEIN_BONUS: 8,      // 未使用タンパク質
} as const;

// ============================================
// タンパク質検出キーワード
// ============================================

const PROTEIN_KEYWORDS: Record<MainProtein, string[]> = {
  chicken: ['鶏', 'チキン', 'ささみ', '手羽', '鶏肉', '鶏むね', '鶏もも', '鶏ひき肉', '鶏挽き肉'],
  pork: ['豚', 'ポーク', '豚肉', '豚バラ', '豚こま', '豚ひき肉', '豚挽き肉', '豚ロース'],
  beef: ['牛', 'ビーフ', '牛肉', '牛バラ', '牛こま', '牛ひき肉', '合い挽き', '合挽き'],
  fish: ['鮭', 'サバ', '鯖', 'ブリ', 'タラ', 'マグロ', 'カツオ', 'アジ', 'サンマ', 'イワシ', 'ホッケ', '鱈', '鰹', '魚'],
  seafood: ['エビ', 'えび', '海老', 'イカ', 'いか', 'タコ', 'たこ', 'アサリ', 'あさり', 'ホタテ', 'カニカマ', 'シーフード'],
  egg: ['卵', 'たまご', '玉子', '温泉卵'],
  tofu: ['豆腐', '厚揚げ', '油揚げ', '納豆', '大豆', '豆乳'],
  processed: ['ベーコン', 'ソーセージ', 'ハム', 'ちくわ', 'かまぼこ', 'はんぺん', 'ツナ缶', 'サバ缶', 'ウインナー'],
  none: [],
};

// ============================================
// 調理方法検出キーワード
// ============================================

const COOKING_METHOD_KEYWORDS: Record<CookingMethod, string[]> = {
  stirfry: ['炒め', '炒める', 'チャンプル', '野菜炒め', 'きんぴら'],
  grill: ['焼き', '焼く', 'ソテー', 'グリル', 'ステーキ', 'ムニエル', '照り焼き', 'ハンバーグ'],
  boil: ['茹で', '湯がく', 'おひたし', 'ゆで'],
  steam: ['蒸し', '蒸す', 'レンジ蒸し'],
  fry: ['揚げ', 'フライ', '唐揚げ', '天ぷら', 'カツ', 'から揚げ'],
  simmer: ['煮込み', '煮物', '煮る', 'シチュー', 'カレー', '肉じゃが', '煮付け', '角煮'],
  microwave: ['レンジ', '電子レンジ', 'チン'],
  raw: ['和え', 'サラダ', '漬け', 'マリネ', 'カルパッチョ', 'たたき'],
  mixed: [],
};

// ============================================
// 味プロファイル検出キーワード
// ============================================

const FLAVOR_KEYWORDS: Record<FlavorProfile, string[]> = {
  sweet_savory: ['照り焼き', '甘辛', '生姜焼き', '蒲焼', '甘酢', '酢豚', '肉じゃが', '煮物', 'すき焼き', 'テリヤキ'],
  salty: ['塩', '塩味', '塩焼き', 'ペペロンチーノ', '塩麹', 'アヒージョ'],
  soy_based: ['醤油', '煮付け', '和風', '炒め物', 'きんぴら', '肉豆腐'],
  miso_based: ['味噌', 'みそ', '味噌炒め', '味噌汁', 'ホイコーロー', '回鍋肉'],
  spicy: ['辛い', 'ピリ辛', '麻婆', 'キムチ', 'カレー', 'ラー油', '豆板醤', 'チリ', '激辛', 'タバスコ'],
  light: ['あっさり', 'さっぱり', '出汁', 'だし', 'ポン酢', 'おひたし', '浅漬け', '酢の物'],
  rich: ['クリーム', 'チーズ', 'マヨネーズ', 'バター', 'こってり', 'グラタン', 'シチュー', 'カルボナーラ'],
  sour: ['酸味', '梅', '酢', 'レモン', 'ビネガー', '南蛮'],
  umami: ['旨味', 'だし', '出汁', 'コンソメ', 'ブイヨン', '中華風'],
};

// ============================================
// 炭水化物タイプ検出キーワード
// ============================================

const CARB_KEYWORDS: Record<CarbType, string[]> = {
  rice: ['ご飯', 'ライス', '炊き込み', 'チャーハン', 'ガパオ', 'オムライス', 'リゾット'],
  noodle: ['麺', 'うどん', 'そば', 'パスタ', 'ラーメン', 'そうめん', '焼きそば'],
  bread: ['パン', 'サンドイッチ', 'トースト', 'ピザ'],
  bowl: ['丼', 'どんぶり', '〜丼', 'カツ丼', '親子丼', '牛丼', '豚丼', '天丼', '海鮮丼', 'そぼろ丼'],
  none: [],
};

// ============================================
// Layer 1: signatureKey 生成関数
// ============================================

/**
 * レシピからメインタンパク質を検出
 */
export const detectMainProtein = (recipe: Recipe): MainProtein => {
  const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
  const recipeName = recipe.name.toLowerCase();
  const allText = [...ingredientNames, recipeName, ...recipe.tags].join(' ');

  // 優先度順にチェック（より具体的なものを先に）
  const proteinPriority: MainProtein[] = [
    'beef', 'pork', 'chicken', 'fish', 'seafood', 'egg', 'tofu', 'processed'
  ];

  for (const protein of proteinPriority) {
    const keywords = PROTEIN_KEYWORDS[protein];
    if (keywords.some(kw => allText.includes(kw.toLowerCase()))) {
      return protein;
    }
  }

  return 'none';
};

/**
 * レシピから調理方法を検出
 */
export const detectCookingMethod = (recipe: Recipe): CookingMethod => {
  const recipeName = recipe.name.toLowerCase();
  const stepsText = recipe.steps.map(s => s.description.toLowerCase()).join(' ');
  const allText = [recipeName, stepsText, ...recipe.tags].join(' ');

  // 優先度順にチェック
  const methodPriority: CookingMethod[] = [
    'fry', 'simmer', 'grill', 'stirfry', 'steam', 'boil', 'microwave', 'raw'
  ];

  for (const method of methodPriority) {
    const keywords = COOKING_METHOD_KEYWORDS[method];
    if (keywords.some(kw => allText.includes(kw.toLowerCase()))) {
      return method;
    }
  }

  // デフォルト: 炒めものと推定
  return 'stirfry';
};

/**
 * レシピから味プロファイルを検出
 */
export const detectFlavorProfile = (recipe: Recipe): FlavorProfile => {
  const recipeName = recipe.name.toLowerCase();
  const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
  const allText = [recipeName, ...ingredientNames, ...recipe.tags].join(' ');

  // 優先度順にチェック
  const flavorPriority: FlavorProfile[] = [
    'spicy', 'sweet_savory', 'miso_based', 'rich', 'sour', 'salty', 'light', 'soy_based', 'umami'
  ];

  for (const flavor of flavorPriority) {
    const keywords = FLAVOR_KEYWORDS[flavor];
    if (keywords.some(kw => allText.includes(kw.toLowerCase()))) {
      return flavor;
    }
  }

  // デフォルト: 醤油ベース
  return 'soy_based';
};

/**
 * レシピから炭水化物タイプを検出
 */
export const detectCarbType = (recipe: Recipe): CarbType => {
  const recipeName = recipe.name.toLowerCase();
  const tags = recipe.tags.map(t => t.toLowerCase());
  const allText = [recipeName, ...tags].join(' ');

  // 丼物を先にチェック
  if (CARB_KEYWORDS.bowl.some(kw => allText.includes(kw.toLowerCase()))) {
    return 'bowl';
  }

  // その他のチェック
  for (const carbType of ['noodle', 'rice', 'bread'] as CarbType[]) {
    const keywords = CARB_KEYWORDS[carbType];
    if (keywords.some(kw => allText.includes(kw.toLowerCase()))) {
      return carbType;
    }
  }

  return 'none';
};

/**
 * レシピからシグネチャを生成
 */
export const generateRecipeSignature = (recipe: Recipe): RecipeSignature => {
  const mainProtein = detectMainProtein(recipe);
  const cookingMethod = detectCookingMethod(recipe);
  const flavorProfile = detectFlavorProfile(recipe);
  const carbType = detectCarbType(recipe);

  // signatureKey: mainProtein_cookingMethod_flavorProfile
  const signatureKey = `${mainProtein}_${cookingMethod}_${flavorProfile}`;

  return {
    mainProtein,
    cookingMethod,
    flavorProfile,
    carbType,
    signatureKey,
  };
};

// ============================================
// Layer 2: Soft Constraint ペナルティ計算
// ============================================

/**
 * 直前日との比較ペナルティを計算
 */
export const calculatePreviousDayPenalty = (
  current: RecipeSignature,
  previous: RecipeSignature | null
): { penalty: number; details: string[] } => {
  if (!previous) {
    return { penalty: 0, details: [] };
  }

  let penalty = 0;
  const details: string[] = [];

  if (current.mainProtein === previous.mainProtein && current.mainProtein !== 'none') {
    penalty += PENALTY_CONSTANTS.PREV_SAME_PROTEIN;
    details.push(`直前日と同じタンパク質(${current.mainProtein}): ${PENALTY_CONSTANTS.PREV_SAME_PROTEIN}`);
  }

  if (current.cookingMethod === previous.cookingMethod) {
    penalty += PENALTY_CONSTANTS.PREV_SAME_COOKING_METHOD;
    details.push(`直前日と同じ調理法(${current.cookingMethod}): ${PENALTY_CONSTANTS.PREV_SAME_COOKING_METHOD}`);
  }

  if (current.flavorProfile === previous.flavorProfile) {
    penalty += PENALTY_CONSTANTS.PREV_SAME_FLAVOR;
    details.push(`直前日と同じ味(${current.flavorProfile}): ${PENALTY_CONSTANTS.PREV_SAME_FLAVOR}`);
  }

  if (current.carbType === previous.carbType && current.carbType !== 'none') {
    penalty += PENALTY_CONSTANTS.PREV_SAME_CARB_TYPE;
    details.push(`直前日と同じ炭水化物(${current.carbType}): ${PENALTY_CONSTANTS.PREV_SAME_CARB_TYPE}`);
  }

  return { penalty, details };
};

/**
 * 前々日との比較ペナルティを計算
 */
export const calculateTwoDaysAgoPenalty = (
  current: RecipeSignature,
  twoDaysAgo: RecipeSignature | null
): { penalty: number; details: string[] } => {
  if (!twoDaysAgo) {
    return { penalty: 0, details: [] };
  }

  let penalty = 0;
  const details: string[] = [];

  if (current.mainProtein === twoDaysAgo.mainProtein && current.mainProtein !== 'none') {
    penalty += PENALTY_CONSTANTS.PREV2_SAME_PROTEIN;
    details.push(`2日前と同じタンパク質(${current.mainProtein}): ${PENALTY_CONSTANTS.PREV2_SAME_PROTEIN}`);
  }

  return { penalty, details };
};

/**
 * カテゴリ被りペナルティを計算
 */
export const calculateCategoryPenalty = (
  recipe: Recipe,
  previousRecipe: Recipe | null
): { penalty: number; details: string[] } => {
  if (!previousRecipe) {
    return { penalty: 0, details: [] };
  }

  let penalty = 0;
  const details: string[] = [];

  if (recipe.category === previousRecipe.category) {
    penalty += PENALTY_CONSTANTS.PREV_SAME_CATEGORY;
    details.push(`直前日と同じカテゴリ(${recipe.category}): ${PENALTY_CONSTANTS.PREV_SAME_CATEGORY}`);
  }

  return { penalty, details };
};

// ============================================
// Layer 3: Weekly Diversity（週枠構成）
// ============================================

/**
 * デフォルトの週枠構成を生成
 */
export const generateDefaultWeeklySlots = (): WeeklySlotConfig => {
  return {
    categorySlots: new Map<RecipeCategory, number>([
      ['japanese', 2],
      ['western', 2],
      ['chinese', 1],
      ['asian', 1],
      ['other', 1],
    ]),
    proteinSlots: new Map<MainProtein, number>([
      ['chicken', 2],
      ['pork', 1],
      ['beef', 1],
      ['fish', 1],
      ['egg', 1],
      ['tofu', 1],
    ]),
    cookingTimeSlots: {
      quick: 4,    // 15分以下: 4枠
      normal: 2,   // 16-25分: 2枠
      elaborate: 1, // 26分以上: 1枠
    },
  };
};

/**
 * 週枠の消費状況を追跡
 */
export interface WeeklySlotTracker {
  categoryUsed: Map<RecipeCategory, number>;
  proteinUsed: Map<MainProtein, number>;
  cookingTimeUsed: {
    quick: number;
    normal: number;
    elaborate: number;
  };
}

/**
 * 空の週枠トラッカーを生成
 */
export const createEmptySlotTracker = (): WeeklySlotTracker => ({
  categoryUsed: new Map(),
  proteinUsed: new Map(),
  cookingTimeUsed: {
    quick: 0,
    normal: 0,
    elaborate: 0,
  },
});

/**
 * 週枠トラッカーを更新
 */
export const updateSlotTracker = (
  tracker: WeeklySlotTracker,
  recipe: Recipe,
  signature: RecipeSignature
): WeeklySlotTracker => {
  const newTracker = { ...tracker };

  // カテゴリをカウント
  const categoryCount = newTracker.categoryUsed.get(recipe.category) || 0;
  newTracker.categoryUsed.set(recipe.category, categoryCount + 1);

  // タンパク質をカウント
  const proteinCount = newTracker.proteinUsed.get(signature.mainProtein) || 0;
  newTracker.proteinUsed.set(signature.mainProtein, proteinCount + 1);

  // 調理時間をカウント
  if (recipe.cooking_time_minutes <= 15) {
    newTracker.cookingTimeUsed.quick++;
  } else if (recipe.cooking_time_minutes <= 25) {
    newTracker.cookingTimeUsed.normal++;
  } else {
    newTracker.cookingTimeUsed.elaborate++;
  }

  return newTracker;
};

/**
 * 週枠に基づくボーナス/ペナルティを計算
 */
export const calculateDiversityScore = (
  recipe: Recipe,
  signature: RecipeSignature,
  slotConfig: WeeklySlotConfig,
  tracker: WeeklySlotTracker
): { score: number; details: string[] } => {
  let score = 0;
  const details: string[] = [];

  // カテゴリチェック
  const categoryLimit = slotConfig.categorySlots.get(recipe.category) || 0;
  const categoryUsed = tracker.categoryUsed.get(recipe.category) || 0;

  if (categoryUsed < categoryLimit) {
    score += PENALTY_CONSTANTS.SLOT_MATCH_BONUS;
    details.push(`カテゴリ枠内(${recipe.category}): +${PENALTY_CONSTANTS.SLOT_MATCH_BONUS}`);
  } else if (categoryUsed >= categoryLimit) {
    score += PENALTY_CONSTANTS.SLOT_EXCEED_PENALTY;
    details.push(`カテゴリ枠超過(${recipe.category}): ${PENALTY_CONSTANTS.SLOT_EXCEED_PENALTY}`);
  }

  // タンパク質チェック
  const proteinLimit = slotConfig.proteinSlots.get(signature.mainProtein) || 0;
  const proteinUsed = tracker.proteinUsed.get(signature.mainProtein) || 0;

  if (proteinUsed === 0) {
    score += PENALTY_CONSTANTS.DIVERSITY_PROTEIN_BONUS;
    details.push(`未使用タンパク質(${signature.mainProtein}): +${PENALTY_CONSTANTS.DIVERSITY_PROTEIN_BONUS}`);
  } else if (proteinUsed >= proteinLimit) {
    score += PENALTY_CONSTANTS.SLOT_EXCEED_PENALTY;
    details.push(`タンパク質枠超過(${signature.mainProtein}): ${PENALTY_CONSTANTS.SLOT_EXCEED_PENALTY}`);
  }

  // 調理時間チェック
  let timeCategory: 'quick' | 'normal' | 'elaborate';
  if (recipe.cooking_time_minutes <= 15) {
    timeCategory = 'quick';
  } else if (recipe.cooking_time_minutes <= 25) {
    timeCategory = 'normal';
  } else {
    timeCategory = 'elaborate';
  }

  const timeLimit = slotConfig.cookingTimeSlots[timeCategory];
  const timeUsed = tracker.cookingTimeUsed[timeCategory];

  if (timeUsed < timeLimit) {
    score += 5; // 小さなボーナス
    details.push(`調理時間枠内(${timeCategory}): +5`);
  }

  return { score, details };
};

// ============================================
// 統合スコアリング関数
// ============================================

/**
 * レシピの総合スコアを計算
 *
 * @param penaltyMultiplier ペナルティ乗数 (Free: 0.8, Plus: 1.0)
 *   - Free: ペナルティが80%に軽減 → たまに被りが発生
 *   - Plus: ペナルティ100% → ほぼ被らない
 */
export const calculateRepeatPreventionScore = (
  recipe: Recipe,
  selectedRecipes: SelectedRecipeInfo[],
  slotConfig: WeeklySlotConfig,
  slotTracker: WeeklySlotTracker,
  baseScore: number = 100,
  penaltyMultiplier: number = 1.0
): ScoreBreakdown => {
  const signature = generateRecipeSignature(recipe);
  let totalScore = baseScore;
  const penalties: string[] = [];
  const bonuses: string[] = [];

  // === Layer 1: Hard Constraint ===
  // Note: Hard constraintはmultiplierの影響を受けない（常に100%）
  let hardPenalty = 0;

  // 同一レシピID チェック
  if (selectedRecipes.some(sr => sr.recipe.id === recipe.id)) {
    hardPenalty += PENALTY_CONSTANTS.HARD_SAME_RECIPE;
    penalties.push(`同一レシピ: ${PENALTY_CONSTANTS.HARD_SAME_RECIPE}`);
  }

  // 同一signatureKey チェック
  if (selectedRecipes.some(sr => sr.signature.signatureKey === signature.signatureKey)) {
    hardPenalty += PENALTY_CONSTANTS.HARD_SAME_SIGNATURE;
    penalties.push(`同一signatureKey(${signature.signatureKey}): ${PENALTY_CONSTANTS.HARD_SAME_SIGNATURE}`);
  }

  // === Layer 2: Soft Constraint ===
  let softPenalty = 0;

  // 直前日（配列の最後）
  const previousRecipe = selectedRecipes.length > 0
    ? selectedRecipes[selectedRecipes.length - 1]
    : null;

  if (previousRecipe) {
    // カテゴリペナルティ
    const categoryPenalty = calculateCategoryPenalty(recipe, previousRecipe.recipe);
    softPenalty += categoryPenalty.penalty;
    penalties.push(...categoryPenalty.details);

    // シグネチャベースのペナルティ
    const prevDayPenalty = calculatePreviousDayPenalty(signature, previousRecipe.signature);
    softPenalty += prevDayPenalty.penalty;
    penalties.push(...prevDayPenalty.details);
  }

  // 前々日
  const twoDaysAgoRecipe = selectedRecipes.length > 1
    ? selectedRecipes[selectedRecipes.length - 2]
    : null;

  if (twoDaysAgoRecipe) {
    const twoDaysAgoPenalty = calculateTwoDaysAgoPenalty(signature, twoDaysAgoRecipe.signature);
    softPenalty += twoDaysAgoPenalty.penalty;
    penalties.push(...twoDaysAgoPenalty.details);
  }

  // === Layer 3: Weekly Diversity ===
  // Note: Diversityボーナスはmultiplierの影響を受けない
  const diversityResult = calculateDiversityScore(recipe, signature, slotConfig, slotTracker);
  const diversityBonus = diversityResult.score;
  bonuses.push(...diversityResult.details);

  // === 最終スコア計算 ===
  // Soft penaltyにのみmultiplierを適用
  // Free (0.8): ペナルティが軽減 → たまに被りが発生する
  // Plus (1.0): ペナルティ100% → ほぼ被らない
  const adjustedSoftPenalty = Math.round(softPenalty * penaltyMultiplier);
  totalScore += hardPenalty + adjustedSoftPenalty + diversityBonus;

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    baseScore,
    hardConstraintPenalty: hardPenalty,
    softConstraintPenalty: adjustedSoftPenalty,
    diversityBonus,
    totalScore,
    details: {
      signature,
      penalties: [
        ...penalties,
        penaltyMultiplier < 1.0 ? `ペナルティ軽減(Free): ×${penaltyMultiplier}` : '',
      ].filter(Boolean),
      bonuses,
    },
  };
};

// ============================================
// デバッグ・ログ機能
// ============================================

/**
 * 選択されたレシピの特徴をログ出力
 */
export const logSelectedRecipeFeatures = (
  recipe: Recipe,
  signature: RecipeSignature,
  dayIndex: number
): void => {
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  console.log(`[RepeatPrevention] ${dayNames[dayIndex]}曜日: ${recipe.emoji} ${recipe.name}`);
  console.log(`  category: ${recipe.category}`);
  console.log(`  protein: ${signature.mainProtein}`);
  console.log(`  method: ${signature.cookingMethod}`);
  console.log(`  flavor: ${signature.flavorProfile}`);
  console.log(`  carbType: ${signature.carbType}`);
  console.log(`  signatureKey: ${signature.signatureKey}`);
};

/**
 * 候補Top5のスコア内訳をログ出力
 */
export const logTopCandidates = (
  candidates: ScoreBreakdown[],
  count: number = 5
): void => {
  console.log(`[RepeatPrevention] 候補Top${count}のスコア内訳:`);
  candidates.slice(0, count).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.recipeName} (${c.recipeId})`);
    console.log(`     base: ${c.baseScore}, hard: ${c.hardConstraintPenalty}, soft: ${c.softConstraintPenalty}, diversity: ${c.diversityBonus}`);
    console.log(`     total: ${c.totalScore}`);
    console.log(`     signature: ${c.details.signature.signatureKey}`);
    if (c.details.penalties.length > 0) {
      console.log(`     penalties: ${c.details.penalties.join(', ')}`);
    }
    if (c.details.bonuses.length > 0) {
      console.log(`     bonuses: ${c.details.bonuses.join(', ')}`);
    }
  });
};

// ============================================
// ユーティリティ関数
// ============================================

/**
 * シグネチャキャッシュ（パフォーマンス向上用）
 */
const signatureCache = new Map<string, RecipeSignature>();

/**
 * キャッシュ付きシグネチャ取得
 */
export const getCachedSignature = (recipe: Recipe): RecipeSignature => {
  if (signatureCache.has(recipe.id)) {
    return signatureCache.get(recipe.id)!;
  }
  const signature = generateRecipeSignature(recipe);
  signatureCache.set(recipe.id, signature);
  return signature;
};

/**
 * シグネチャキャッシュをクリア
 */
export const clearSignatureCache = (): void => {
  signatureCache.clear();
};

/**
 * 上位N件からランダム抽選（完全固定化を避ける）
 */
export const selectFromTopCandidates = (
  scoredCandidates: ScoreBreakdown[],
  topN: number = 5
): ScoreBreakdown | null => {
  const validCandidates = scoredCandidates.filter(c => c.totalScore > 0);

  if (validCandidates.length === 0) {
    return null;
  }

  // 上位N件を取得
  const topCandidates = validCandidates.slice(0, Math.min(topN, validCandidates.length));

  // ランダム選択
  const selectedIndex = Math.floor(Math.random() * topCandidates.length);
  return topCandidates[selectedIndex];
};

// ============================================
// 最低限版との差分説明
// ============================================

/**
 * 最低限版（直近2日ペナルティのみ）との差分:
 *
 * 【最低限版】
 * - 直前日との同一タンパク質ペナルティ (-12)
 * - 直前日との同一カテゴリペナルティ (-10)
 * - 前々日との同一タンパク質ペナルティ (-6)
 * → 合計3つのペナルティのみ
 *
 * 【フル版（この実装）】
 * Layer 1 (Hard Constraint):
 * - 同一レシピID 禁止
 * - 同一signatureKey 禁止（実質被り防止）
 *
 * Layer 2 (Soft Constraint):
 * - 直前日との同一カテゴリ (-10)
 * - 直前日との同一タンパク質 (-12)
 * - 直前日との同一調理法 (-8)
 * - 直前日との同一味プロファイル (-8)
 * - 直前日との同一炭水化物タイプ (-10)
 * - 前々日との同一タンパク質 (-6)
 *
 * Layer 3 (Weekly Diversity):
 * - カテゴリ枠の管理（和2/洋2/中1/アジアン1/他1）
 * - タンパク質枠の管理（鶏2/豚1/牛1/魚1/卵1/豆1）
 * - 調理時間枠の管理（時短4/普通2/手間1）
 * - 未使用カテゴリ・タンパク質へのボーナス
 *
 * 【効果の違い】
 * - 最低限版: 連続する2-3日の体験重複を防ぐ
 * - フル版: 週全体でバランスの取れた献立を実現
 *          + 「照り焼きチキン」と「甘辛チキンソテー」のような
 *            実質同じ体験（signatureKey被り）も防止
 */
