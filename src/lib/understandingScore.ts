// ============================================
// Understanding Score System
// ユーザー好み理解度の計算・管理
//
// 目的: アプリがユーザーの好みをどれだけ理解しているかを数値化
// 用途: UX向上、学習促進、マネタイズ（Plus）
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeSignature } from './recipeRepeatPrevention';

// ============================================
// 定数定義
// ============================================

/**
 * Learning Point (LP) 付与定数
 * イベント種別ごとのLP値
 */
export const LP_POINTS = {
  plan_accepted: 2,    // 提案を受け入れた
  cooked: 4,           // 実際に調理した
  skipped: 1,          // スキップした（消極的なフィードバック）
  replaced: 3,         // 別のレシピに変更した
  rated_thumbs: 5,     // 👍👎 で評価した
  rated_star: 6,       // ⭐️ で評価した
  replaced_with_reason: 6, // 理由付きで変更した
} as const;

/**
 * 理解度計算の定数
 */
export const UNDERSTANDING_CONSTANTS = {
  // LP → base% 変換係数
  LP_BASE_COEFFICIENT: 0.8,
  LP_BASE_MAX: 80,

  // 放置減衰
  DECAY_7_DAYS: 5,    // 7日経過で-5%
  DECAY_14_DAYS: 10,  // 14日経過で-10%
  DECAY_THRESHOLD_7: 7 * 24 * 60 * 60 * 1000,   // 7日 (ms)
  DECAY_THRESHOLD_14: 14 * 24 * 60 * 60 * 1000, // 14日 (ms)

  // 一貫性係数
  CONSISTENCY_THRESHOLD: 0.65, // 65%以上で「一貫性あり」
  CONSISTENCY_RECENT_COUNT: 10, // 直近10イベント
  CONSISTENCY_BOOST: 1.1,      // 一貫性ありの場合のブースト

  // 信号強度係数
  SIGNAL_MIN: 0.85,
  SIGNAL_MAX: 1.15,

  // Free/Plus制限
  FREE_MAX_PERCENTAGE: 70,
  PLUS_MAX_PERCENTAGE: 100,
} as const;

/**
 * AsyncStorageキー
 */
const STORAGE_KEYS = {
  UNDERSTANDING_STATE: '@understanding_state',
  LEARNING_EVENTS: '@learning_events',
} as const;

// ============================================
// 型定義
// ============================================

/**
 * 学習イベントの種類
 */
export type LearningEventType = keyof typeof LP_POINTS;

/**
 * レシピの特徴（イベント記録用）
 * recipeRepeatPrevention.ts の RecipeSignature を再利用
 */
export interface RecipeFeatures {
  recipeId: string;
  category: string;      // japanese / western / chinese / asian / other
  mainProtein: string;   // chicken / pork / beef / fish / etc.
  cookingMethod: string; // stirfry / grill / boil / etc.
  flavorProfile: string; // sweet_savory / salty / spicy / etc.
}

/**
 * 学習イベント
 * ユーザーの各アクションを記録
 */
export interface LearningEvent {
  id: string;                    // ユニークID
  type: LearningEventType;       // イベント種別
  recipeId: string;              // 対象レシピID
  recipeFeatures: RecipeFeatures; // レシピの特徴
  lp: number;                    // 付与されたLP
  timestamp: string;             // ISO 8601形式
  metadata?: {
    rating?: number;             // 評価値（1-5）
    replaceReason?: string;      // 変更理由
    originalRecipeId?: string;   // 変更前のレシピID
  };
}

/**
 * 理解度の状態
 * 永続化する主要データ
 */
export interface UnderstandingState {
  totalLP: number;               // 累積LP（減らない）
  lastEventTimestamp: string | null; // 最後のイベント日時
  eventCount: number;            // 総イベント数
  ratedEventCount: number;       // 評価イベント数
  createdAt: string;             // 初回作成日時
  updatedAt: string;             // 最終更新日時
}

/**
 * 理解度計算結果
 * UI表示用
 */
export interface UnderstandingResult {
  percentage: number;            // 最終理解度％ (0-100)
  percentageCapped: number;      // Free制限適用後の％
  isPlus: boolean;               // Plusユーザーかどうか

  // デバッグ用内訳（optional）
  breakdown?: UnderstandingBreakdown;
}

/**
 * 理解度の内訳（デバッグ用）
 */
export interface UnderstandingBreakdown {
  totalLP: number;
  basePercentage: number;        // LP → base%
  decayPercentage: number;       // 放置減衰
  consistencyCoefficient: number; // 一貫性係数
  signalStrengthCoefficient: number; // 信号強度係数
  rawPercentage: number;         // 最終計算値（上限適用前）
  appliedCap: number;            // 適用された上限
  daysSinceLastEvent: number;    // 最後のイベントからの経過日数
  consistencyDetails: {
    isConsistent: boolean;
    dominantFeature: string | null;
    dominantRatio: number;
  };
}

/**
 * 特徴の集計結果
 */
interface FeatureCount {
  feature: string;
  count: number;
  ratio: number;
}

// ============================================
// LP更新関数
// ============================================

/**
 * 学習イベントを追加し、LPを付与する
 *
 * @param state 現在の理解度状態
 * @param eventType イベント種別
 * @param recipeId レシピID
 * @param recipeFeatures レシピの特徴
 * @param metadata 追加情報（評価値、変更理由など）
 * @returns 更新後の状態と新しいイベント
 */
export const addLearningEvent = (
  state: UnderstandingState,
  eventType: LearningEventType,
  recipeId: string,
  recipeFeatures: RecipeFeatures,
  metadata?: LearningEvent['metadata']
): { state: UnderstandingState; event: LearningEvent } => {
  const now = new Date().toISOString();
  const lp = LP_POINTS[eventType];

  // 新しいイベントを作成
  const event: LearningEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: eventType,
    recipeId,
    recipeFeatures,
    lp,
    timestamp: now,
    metadata,
  };

  // 評価イベントかどうかを判定
  const isRatedEvent = eventType === 'rated_thumbs' || eventType === 'rated_star';

  // 状態を更新
  const newState: UnderstandingState = {
    ...state,
    totalLP: state.totalLP + lp,
    lastEventTimestamp: now,
    eventCount: state.eventCount + 1,
    ratedEventCount: state.ratedEventCount + (isRatedEvent ? 1 : 0),
    updatedAt: now,
  };

  return { state: newState, event };
};

/**
 * 初期状態を生成
 */
export const createInitialUnderstandingState = (): UnderstandingState => {
  const now = new Date().toISOString();
  return {
    totalLP: 0,
    lastEventTimestamp: null,
    eventCount: 0,
    ratedEventCount: 0,
    createdAt: now,
    updatedAt: now,
  };
};

// ============================================
// 理解度計算関数
// ============================================

/**
 * LP → base% 変換
 * base% = min(80, sqrt(LP) × 0.8)
 */
const calculateBasePercentage = (totalLP: number): number => {
  const { LP_BASE_COEFFICIENT, LP_BASE_MAX } = UNDERSTANDING_CONSTANTS;
  const raw = Math.sqrt(totalLP) * LP_BASE_COEFFICIENT;
  return Math.min(LP_BASE_MAX, raw);
};

/**
 * 放置減衰を計算
 * 最後の行動から7日経過：-5%
 * 14日経過：-10%
 * ※ LP自体は減らさない、%のみ減少
 */
const calculateDecay = (lastEventTimestamp: string | null): number => {
  if (!lastEventTimestamp) {
    return 0; // イベントがない場合は減衰なし
  }

  const { DECAY_7_DAYS, DECAY_14_DAYS, DECAY_THRESHOLD_7, DECAY_THRESHOLD_14 } = UNDERSTANDING_CONSTANTS;

  const now = Date.now();
  const lastEvent = new Date(lastEventTimestamp).getTime();
  const elapsed = now - lastEvent;

  if (elapsed >= DECAY_THRESHOLD_14) {
    return DECAY_14_DAYS;
  } else if (elapsed >= DECAY_THRESHOLD_7) {
    return DECAY_7_DAYS;
  }

  return 0;
};

/**
 * 最後のイベントからの経過日数を計算
 */
const getDaysSinceLastEvent = (lastEventTimestamp: string | null): number => {
  if (!lastEventTimestamp) {
    return 0;
  }

  const now = Date.now();
  const lastEvent = new Date(lastEventTimestamp).getTime();
  const elapsed = now - lastEvent;

  return Math.floor(elapsed / (24 * 60 * 60 * 1000));
};

/**
 * 特徴の頻度を集計
 * @param events 直近のイベントリスト
 * @param featureKey 集計する特徴キー
 * @returns 特徴ごとのカウントと比率
 */
const countFeatures = (
  events: LearningEvent[],
  featureKey: keyof RecipeFeatures
): FeatureCount[] => {
  const counts = new Map<string, number>();

  events.forEach(event => {
    const value = event.recipeFeatures[featureKey];
    if (value) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  });

  const total = events.length || 1;

  return Array.from(counts.entries())
    .map(([feature, count]) => ({
      feature,
      count,
      ratio: count / total,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * 一貫性（Consistency）係数を計算
 * 直近10イベントの recipeFeatures を集計
 * 最頻傾向が65%以上なら「一貫性あり」
 *
 * @returns 係数と詳細情報
 */
const calculateConsistencyCoefficient = (
  recentEvents: LearningEvent[]
): { coefficient: number; details: UnderstandingBreakdown['consistencyDetails'] } => {
  const { CONSISTENCY_THRESHOLD, CONSISTENCY_BOOST } = UNDERSTANDING_CONSTANTS;

  if (recentEvents.length === 0) {
    return {
      coefficient: 1.0,
      details: {
        isConsistent: false,
        dominantFeature: null,
        dominantRatio: 0,
      },
    };
  }

  // 各特徴の最頻値を取得
  const featureKeys: (keyof RecipeFeatures)[] = ['category', 'mainProtein', 'cookingMethod', 'flavorProfile'];

  let maxRatio = 0;
  let dominantFeature: string | null = null;

  for (const key of featureKeys) {
    const counts = countFeatures(recentEvents, key);
    if (counts.length > 0 && counts[0].ratio > maxRatio) {
      maxRatio = counts[0].ratio;
      dominantFeature = `${key}:${counts[0].feature}`;
    }
  }

  const isConsistent = maxRatio >= CONSISTENCY_THRESHOLD;
  const coefficient = isConsistent ? CONSISTENCY_BOOST : 1.0;

  return {
    coefficient,
    details: {
      isConsistent,
      dominantFeature,
      dominantRatio: maxRatio,
    },
  };
};

/**
 * 信号強度（Signal Strength）係数を計算
 * signalStrength = 0.85 + (ratedRatio × 0.3)
 * ratedRatio = 評価イベント数 / 総イベント数
 *
 * @returns 0.85 ~ 1.15 の範囲の係数
 */
const calculateSignalStrengthCoefficient = (
  eventCount: number,
  ratedEventCount: number
): number => {
  const { SIGNAL_MIN, SIGNAL_MAX } = UNDERSTANDING_CONSTANTS;

  if (eventCount === 0) {
    return SIGNAL_MIN;
  }

  const ratedRatio = ratedEventCount / eventCount;
  const coefficient = SIGNAL_MIN + (ratedRatio * 0.3);

  return Math.min(SIGNAL_MAX, Math.max(SIGNAL_MIN, coefficient));
};

/**
 * 理解度を計算（メイン関数）
 *
 * 最終理解度％ = (base% - decay) × consistency × signalStrength
 *
 * @param state 理解度状態
 * @param recentEvents 直近のイベントリスト（一貫性計算用）
 * @param isPlus Plusユーザーかどうか
 * @param includeBreakdown 内訳を含めるか
 * @returns 計算結果
 */
export const calculateUnderstanding = (
  state: UnderstandingState,
  recentEvents: LearningEvent[],
  isPlus: boolean = false,
  includeBreakdown: boolean = false
): UnderstandingResult => {
  const { FREE_MAX_PERCENTAGE, PLUS_MAX_PERCENTAGE, CONSISTENCY_RECENT_COUNT } = UNDERSTANDING_CONSTANTS;

  // 1. LP → base% 変換
  const basePercentage = calculateBasePercentage(state.totalLP);

  // 2. 放置減衰
  const decayPercentage = calculateDecay(state.lastEventTimestamp);

  // 3. 一貫性係数（直近10イベント）
  const recentForConsistency = recentEvents.slice(-CONSISTENCY_RECENT_COUNT);
  const { coefficient: consistencyCoefficient, details: consistencyDetails } =
    calculateConsistencyCoefficient(recentForConsistency);

  // 4. 信号強度係数
  const signalStrengthCoefficient = calculateSignalStrengthCoefficient(
    state.eventCount,
    state.ratedEventCount
  );

  // 5. 最終計算
  // 最終理解度％ = (base% - decay) × consistency × signalStrength
  const adjustedBase = Math.max(0, basePercentage - decayPercentage);
  const rawPercentage = adjustedBase * consistencyCoefficient * signalStrengthCoefficient;

  // 6. 上限適用
  const cap = isPlus ? PLUS_MAX_PERCENTAGE : FREE_MAX_PERCENTAGE;
  const percentage = Math.min(cap, Math.max(0, Math.round(rawPercentage)));
  const percentageCapped = percentage;

  // 結果を構築
  const result: UnderstandingResult = {
    percentage: Math.round(rawPercentage), // 上限適用前の実際の値
    percentageCapped,
    isPlus,
  };

  // デバッグ用内訳
  if (includeBreakdown) {
    result.breakdown = {
      totalLP: state.totalLP,
      basePercentage,
      decayPercentage,
      consistencyCoefficient,
      signalStrengthCoefficient,
      rawPercentage,
      appliedCap: cap,
      daysSinceLastEvent: getDaysSinceLastEvent(state.lastEventTimestamp),
      consistencyDetails,
    };
  }

  return result;
};

// ============================================
// AsyncStorage保存・復元処理
// ============================================

/**
 * 理解度状態を保存
 */
export const saveUnderstandingState = async (state: UnderstandingState): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.UNDERSTANDING_STATE,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error('[UnderstandingScore] Failed to save state:', error);
    throw error;
  }
};

/**
 * 理解度状態を読み込み
 * 存在しない場合は初期状態を返す
 */
export const loadUnderstandingState = async (): Promise<UnderstandingState> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.UNDERSTANDING_STATE);
    if (json) {
      return JSON.parse(json) as UnderstandingState;
    }
    return createInitialUnderstandingState();
  } catch (error) {
    console.error('[UnderstandingScore] Failed to load state:', error);
    return createInitialUnderstandingState();
  }
};

/**
 * 学習イベントを保存（追記）
 * 最大1000件まで保持、超えたら古いものを削除
 */
export const saveLearningEvent = async (event: LearningEvent): Promise<void> => {
  try {
    const events = await loadLearningEvents();
    events.push(event);

    // 1000件を超えたら古いものを削除
    const MAX_EVENTS = 1000;
    const trimmedEvents = events.length > MAX_EVENTS
      ? events.slice(-MAX_EVENTS)
      : events;

    await AsyncStorage.setItem(
      STORAGE_KEYS.LEARNING_EVENTS,
      JSON.stringify(trimmedEvents)
    );
  } catch (error) {
    console.error('[UnderstandingScore] Failed to save event:', error);
    throw error;
  }
};

/**
 * 学習イベントを読み込み
 */
export const loadLearningEvents = async (): Promise<LearningEvent[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_EVENTS);
    if (json) {
      return JSON.parse(json) as LearningEvent[];
    }
    return [];
  } catch (error) {
    console.error('[UnderstandingScore] Failed to load events:', error);
    return [];
  }
};

/**
 * 直近N件のイベントを取得
 */
export const getRecentEvents = async (count: number = 10): Promise<LearningEvent[]> => {
  const events = await loadLearningEvents();
  return events.slice(-count);
};

/**
 * 全データをリセット（デバッグ用）
 */
export const resetUnderstandingData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.UNDERSTANDING_STATE,
      STORAGE_KEYS.LEARNING_EVENTS,
    ]);
  } catch (error) {
    console.error('[UnderstandingScore] Failed to reset data:', error);
    throw error;
  }
};

// ============================================
// 統合API（便利関数）
// ============================================

/**
 * イベントを記録し、状態を更新・保存する
 * UIから呼び出す主要関数
 */
export const recordLearningEvent = async (
  eventType: LearningEventType,
  recipeId: string,
  recipeFeatures: RecipeFeatures,
  metadata?: LearningEvent['metadata']
): Promise<{ state: UnderstandingState; event: LearningEvent }> => {
  // 現在の状態を読み込み
  const currentState = await loadUnderstandingState();

  // イベントを追加
  const { state: newState, event } = addLearningEvent(
    currentState,
    eventType,
    recipeId,
    recipeFeatures,
    metadata
  );

  // 状態とイベントを保存
  await saveUnderstandingState(newState);
  await saveLearningEvent(event);

  return { state: newState, event };
};

/**
 * 現在の理解度を取得
 * MyTypeScreenなどから呼び出す
 */
export const getCurrentUnderstanding = async (
  isPlus: boolean = false,
  includeBreakdown: boolean = false
): Promise<UnderstandingResult> => {
  const state = await loadUnderstandingState();
  const recentEvents = await getRecentEvents(UNDERSTANDING_CONSTANTS.CONSISTENCY_RECENT_COUNT);

  return calculateUnderstanding(state, recentEvents, isPlus, includeBreakdown);
};

// ============================================
// MyTypeScreen用 Selector
// ============================================

/**
 * MyTypeScreen用の理解度データ
 */
export interface UnderstandingForMyType {
  percentage: number;         // 表示用％
  percentageRaw: number;      // 実際の％（Plus広告用）
  isAtFreeCap: boolean;       // Free上限に達しているか
  canUnlockMore: boolean;     // Plus契約で更に上がるか
  displayMessage: string;     // 表示メッセージ
  progressColor: string;      // プログレスバーの色
}

/**
 * MyTypeScreen用のselector
 * 理解度データをUI表示用に整形する
 */
export const selectUnderstandingForMyType = async (
  isPlus: boolean = false
): Promise<UnderstandingForMyType> => {
  const result = await getCurrentUnderstanding(isPlus, true);
  const { FREE_MAX_PERCENTAGE } = UNDERSTANDING_CONSTANTS;

  const isAtFreeCap = !isPlus && result.percentage >= FREE_MAX_PERCENTAGE;
  const canUnlockMore = !isPlus && result.percentage > result.percentageCapped;

  // 理解度に応じたメッセージ
  let displayMessage: string;
  if (result.percentageCapped < 20) {
    displayMessage = 'まだ様子見中。これから分かってくよ';
  } else if (result.percentageCapped < 40) {
    displayMessage = '少しずつ好みが見えてきた';
  } else if (result.percentageCapped < 60) {
    displayMessage = 'だいぶ好みが見えてきた';
  } else if (result.percentageCapped < 80) {
    displayMessage = 'かなり理解できてるよ';
  } else {
    displayMessage = 'あなたの好み、ほぼ完璧に理解してる！';
  }

  // Free上限の場合の特別メッセージ
  if (isAtFreeCap) {
    displayMessage = 'Freeプランの上限に達しました';
  }

  // プログレスバーの色（理解度に応じて変化）
  let progressColor: string;
  if (result.percentageCapped < 30) {
    progressColor = '#FFC107'; // 黄色（まだこれから）
  } else if (result.percentageCapped < 60) {
    progressColor = '#4CAF50'; // 緑（順調）
  } else if (result.percentageCapped < 80) {
    progressColor = '#2196F3'; // 青（良好）
  } else {
    progressColor = '#FF6B35'; // オレンジ（ブランドカラー、完璧）
  }

  return {
    percentage: result.percentageCapped,
    percentageRaw: result.percentage,
    isAtFreeCap,
    canUnlockMore,
    displayMessage,
    progressColor,
  };
};

// ============================================
// デバッグ・テスト用ヘルパー
// ============================================

/**
 * 理解度の詳細をコンソール出力（デバッグ用）
 */
export const debugUnderstanding = async (): Promise<void> => {
  const result = await getCurrentUnderstanding(false, true);

  console.log('=== Understanding Score Debug ===');
  console.log(`Final: ${result.percentageCapped}% (raw: ${result.percentage}%)`);

  if (result.breakdown) {
    const b = result.breakdown;
    console.log(`\nBreakdown:`);
    console.log(`  Total LP: ${b.totalLP}`);
    console.log(`  Base %: ${b.basePercentage.toFixed(2)}%`);
    console.log(`  Decay: -${b.decayPercentage}%`);
    console.log(`  Consistency: ×${b.consistencyCoefficient.toFixed(2)}`);
    console.log(`    - isConsistent: ${b.consistencyDetails.isConsistent}`);
    console.log(`    - dominantFeature: ${b.consistencyDetails.dominantFeature}`);
    console.log(`    - dominantRatio: ${(b.consistencyDetails.dominantRatio * 100).toFixed(1)}%`);
    console.log(`  Signal Strength: ×${b.signalStrengthCoefficient.toFixed(2)}`);
    console.log(`  Raw %: ${b.rawPercentage.toFixed(2)}%`);
    console.log(`  Applied Cap: ${b.appliedCap}%`);
    console.log(`  Days since last event: ${b.daysSinceLastEvent}`);
  }
  console.log('================================');
};

/**
 * テスト用：ダミーイベントを追加
 */
export const addTestEvent = async (
  eventType: LearningEventType = 'cooked'
): Promise<void> => {
  const testFeatures: RecipeFeatures = {
    recipeId: 'test-recipe-1',
    category: 'japanese',
    mainProtein: 'chicken',
    cookingMethod: 'grill',
    flavorProfile: 'sweet_savory',
  };

  await recordLearningEvent(eventType, 'test-recipe-1', testFeatures);
  console.log(`[Test] Added ${eventType} event, LP: +${LP_POINTS[eventType]}`);
};

// ============================================
// Plus統合API
// ============================================

/**
 * Plus統合: 理解度がFree上限（70%）に達したかチェック
 * Plus訴求のトリガーに使用
 */
export const hasReachedFreeCap = async (): Promise<boolean> => {
  const result = await getCurrentUnderstanding(false, false);
  return result.percentage >= UNDERSTANDING_CONSTANTS.FREE_MAX_PERCENTAGE;
};

/**
 * Plus統合: 理解度上限を取得
 */
export const getUnderstandingCap = (isPlus: boolean): number => {
  return isPlus
    ? UNDERSTANDING_CONSTANTS.PLUS_MAX_PERCENTAGE
    : UNDERSTANDING_CONSTANTS.FREE_MAX_PERCENTAGE;
};
