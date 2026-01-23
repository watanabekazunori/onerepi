/**
 * Plus Subscription Management
 *
 * Plus プラン: ¥480/月
 * コンセプト: 「このアプリが"あなた専用"になる」
 *
 * 【UXルール - 絶対禁止】
 * - 機能ロック表示
 * - 「この機能はPlusです」
 * - Free vs Plus比較表
 * - 強制ポップアップ
 *
 * 【Plus訴求タイミング】
 * - 理解度％が70%に到達した時のみ
 * - 自然な流れで「さらに深く理解できます」を提示
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Type Definitions
// ============================================================================

export type SubscriptionTier = 'free' | 'plus';

export interface PlusSubscription {
  tier: SubscriptionTier;
  subscribedAt: string | null;       // ISO timestamp
  expiresAt: string | null;          // ISO timestamp
  priceYen: number;                  // 480
  autoRenew: boolean;
}

export interface PlusSubscriptionState {
  subscription: PlusSubscription;
  hasSeenPlusPrompt: boolean;        // 70%到達時のプロンプト表示済みか
  plusPromptShownAt: string | null;  // プロンプト表示日時
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Week Template Types (Plus Feature)
// ============================================================================

export type WeekTemplateType =
  | 'normal'      // 通常週
  | 'busy'        // 忙しい週 (時短・簡単料理優先)
  | 'budget'      // 節約週 (コスパ重視)
  | 'recovery';   // 体調悪い週 (消化良い・優しい料理)

export interface WeekTemplate {
  type: WeekTemplateType;
  label: string;
  description: string;
  icon: string;                      // Lucide icon name
  constraints: WeekTemplateConstraints;
}

export interface WeekTemplateConstraints {
  maxCookingTimeMinutes?: number;    // busy: 15分以下
  maxIngredientCount?: number;       // busy: 5個以下
  maxCostLevel?: number;             // budget: 1-2
  preferredFlavorProfiles?: string[]; // recovery: light, umami
  avoidFlavorProfiles?: string[];    // recovery: avoid spicy, rich
  difficultyMax?: number;            // busy: easy only
}

// ============================================================================
// Adventure Level Types (Plus Feature)
// ============================================================================

export type AdventureLevel = 1 | 2 | 3 | 4 | 5;

export interface AdventureSettings {
  level: AdventureLevel;             // 1=保守的, 5=冒険的
  lastUpdated: string;
}

// ============================================================================
// Constants
// ============================================================================

export const PLUS_CONSTANTS = {
  PRICE_YEN: 480,
  FREE_UNDERSTANDING_CAP: 70,
  PLUS_UNDERSTANDING_CAP: 100,

  // 被り防止精度
  FREE_REPEAT_PENALTY_MULTIPLIER: 0.8,   // Free: 80%精度
  PLUS_REPEAT_PENALTY_MULTIPLIER: 1.0,   // Plus: 100%精度

  // 冒険レベル
  DEFAULT_ADVENTURE_LEVEL: 3 as AdventureLevel,
  FREE_ADVENTURE_LEVEL: 3 as AdventureLevel,  // Freeは固定
} as const;

export const WEEK_TEMPLATES: WeekTemplate[] = [
  {
    type: 'normal',
    label: '通常',
    description: 'バランスの取れた1週間',
    icon: 'Calendar',
    constraints: {},
  },
  {
    type: 'busy',
    label: '忙しい週',
    description: '時短・簡単料理中心',
    icon: 'Zap',
    constraints: {
      maxCookingTimeMinutes: 15,
      maxIngredientCount: 5,
      difficultyMax: 1,
    },
  },
  {
    type: 'budget',
    label: '節約週',
    description: 'コスパ重視の献立',
    icon: 'PiggyBank',
    constraints: {
      maxCostLevel: 2,
    },
  },
  {
    type: 'recovery',
    label: '体調悪い週',
    description: '消化に優しい料理',
    icon: 'Heart',
    constraints: {
      preferredFlavorProfiles: ['light', 'umami', 'soy_based'],
      avoidFlavorProfiles: ['spicy', 'rich'],
      maxCookingTimeMinutes: 20,
    },
  },
];

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  SUBSCRIPTION_STATE: '@onepan_plus_subscription_state',
  ADVENTURE_SETTINGS: '@onepan_adventure_settings',
  SELECTED_WEEK_TEMPLATE: '@onepan_selected_week_template',
} as const;

// ============================================================================
// Default Values
// ============================================================================

const createDefaultSubscriptionState = (): PlusSubscriptionState => ({
  subscription: {
    tier: 'free',
    subscribedAt: null,
    expiresAt: null,
    priceYen: PLUS_CONSTANTS.PRICE_YEN,
    autoRenew: false,
  },
  hasSeenPlusPrompt: false,
  plusPromptShownAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createDefaultAdventureSettings = (): AdventureSettings => ({
  level: PLUS_CONSTANTS.DEFAULT_ADVENTURE_LEVEL,
  lastUpdated: new Date().toISOString(),
});

// ============================================================================
// Subscription State Management
// ============================================================================

/**
 * サブスクリプション状態を取得
 */
export const getSubscriptionState = async (): Promise<PlusSubscriptionState> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATE);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Plus] Failed to get subscription state:', error);
  }
  return createDefaultSubscriptionState();
};

/**
 * ユーザーがPlusプランか判定
 */
export const isUserPlus = async (): Promise<boolean> => {
  const state = await getSubscriptionState();

  if (state.subscription.tier !== 'plus') {
    return false;
  }

  // 有効期限チェック
  if (state.subscription.expiresAt) {
    const now = new Date();
    const expiry = new Date(state.subscription.expiresAt);
    if (now > expiry) {
      // 期限切れ - Freeに戻す
      await downgradeToFree();
      return false;
    }
  }

  return true;
};

/**
 * Plusにアップグレード（購入完了時に呼ぶ）
 */
export const upgradeToPlusSubscription = async (): Promise<PlusSubscriptionState> => {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 1ヶ月後

  const state = await getSubscriptionState();
  const newState: PlusSubscriptionState = {
    ...state,
    subscription: {
      tier: 'plus',
      subscribedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      priceYen: PLUS_CONSTANTS.PRICE_YEN,
      autoRenew: true,
    },
    updatedAt: now.toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATE, JSON.stringify(newState));
  console.log('[Plus] Upgraded to Plus subscription');
  return newState;
};

/**
 * Freeにダウングレード
 */
export const downgradeToFree = async (): Promise<PlusSubscriptionState> => {
  const state = await getSubscriptionState();
  const newState: PlusSubscriptionState = {
    ...state,
    subscription: {
      tier: 'free',
      subscribedAt: null,
      expiresAt: null,
      priceYen: PLUS_CONSTANTS.PRICE_YEN,
      autoRenew: false,
    },
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATE, JSON.stringify(newState));
  console.log('[Plus] Downgraded to Free');
  return newState;
};

// ============================================================================
// Plus Prompt Management (70%到達時のみ表示)
// ============================================================================

/**
 * Plusプロンプトを表示すべきか判定
 * 条件: 理解度70%到達 かつ 未表示 かつ Free
 */
export const shouldShowPlusPrompt = async (currentUnderstanding: number): Promise<boolean> => {
  const state = await getSubscriptionState();

  // すでにPlusなら表示しない
  if (state.subscription.tier === 'plus') {
    return false;
  }

  // すでに表示済みなら表示しない
  if (state.hasSeenPlusPrompt) {
    return false;
  }

  // 70%に到達していれば表示
  return currentUnderstanding >= PLUS_CONSTANTS.FREE_UNDERSTANDING_CAP;
};

/**
 * Plusプロンプト表示済みを記録
 */
export const markPlusPromptShown = async (): Promise<void> => {
  const state = await getSubscriptionState();
  const newState: PlusSubscriptionState = {
    ...state,
    hasSeenPlusPrompt: true,
    plusPromptShownAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATE, JSON.stringify(newState));
  console.log('[Plus] Plus prompt marked as shown');
};

// ============================================================================
// Adventure Level Management (Plus Feature)
// ============================================================================

/**
 * 冒険レベルを取得
 * Freeユーザーは固定値、Plusユーザーは設定値
 */
export const getAdventureLevel = async (): Promise<AdventureLevel> => {
  const isPlus = await isUserPlus();

  if (!isPlus) {
    return PLUS_CONSTANTS.FREE_ADVENTURE_LEVEL;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ADVENTURE_SETTINGS);
    if (stored) {
      const settings: AdventureSettings = JSON.parse(stored);
      return settings.level;
    }
  } catch (error) {
    console.error('[Plus] Failed to get adventure settings:', error);
  }

  return PLUS_CONSTANTS.DEFAULT_ADVENTURE_LEVEL;
};

/**
 * 冒険レベルを設定 (Plus only)
 */
export const setAdventureLevel = async (level: AdventureLevel): Promise<boolean> => {
  const isPlus = await isUserPlus();

  if (!isPlus) {
    console.warn('[Plus] Cannot set adventure level for Free users');
    return false;
  }

  const settings: AdventureSettings = {
    level,
    lastUpdated: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.ADVENTURE_SETTINGS, JSON.stringify(settings));
  console.log('[Plus] Adventure level set to:', level);
  return true;
};

// ============================================================================
// Week Template Management (Plus Feature)
// ============================================================================

/**
 * 選択中の週テンプレートを取得
 * Freeユーザーは常にnormal
 */
export const getSelectedWeekTemplate = async (): Promise<WeekTemplateType> => {
  const isPlus = await isUserPlus();

  if (!isPlus) {
    return 'normal';
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_WEEK_TEMPLATE);
    if (stored) {
      return stored as WeekTemplateType;
    }
  } catch (error) {
    console.error('[Plus] Failed to get week template:', error);
  }

  return 'normal';
};

/**
 * 週テンプレートを設定 (Plus only)
 */
export const setWeekTemplate = async (template: WeekTemplateType): Promise<boolean> => {
  const isPlus = await isUserPlus();

  if (!isPlus) {
    console.warn('[Plus] Cannot set week template for Free users');
    return false;
  }

  await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_WEEK_TEMPLATE, template);
  console.log('[Plus] Week template set to:', template);
  return true;
};

/**
 * テンプレートの制約を取得
 */
export const getWeekTemplateConstraints = async (): Promise<WeekTemplateConstraints> => {
  const templateType = await getSelectedWeekTemplate();
  const template = WEEK_TEMPLATES.find(t => t.type === templateType);
  return template?.constraints ?? {};
};

/**
 * 全週テンプレートを取得
 */
export const getAllWeekTemplates = (): WeekTemplate[] => {
  return WEEK_TEMPLATES;
};

// ============================================================================
// Precision Multipliers for Repeat Prevention
// ============================================================================

/**
 * 被り防止精度の乗数を取得
 * Free: 0.8 (80%精度 = たまに被る)
 * Plus: 1.0 (100%精度 = ほぼ被らない)
 */
export const getRepeatPenaltyMultiplier = async (): Promise<number> => {
  const isPlus = await isUserPlus();
  return isPlus
    ? PLUS_CONSTANTS.PLUS_REPEAT_PENALTY_MULTIPLIER
    : PLUS_CONSTANTS.FREE_REPEAT_PENALTY_MULTIPLIER;
};

// ============================================================================
// Debug / Development
// ============================================================================

/**
 * デバッグ用: 強制的にPlusにする
 */
export const debugSetPlusStatus = async (isPlus: boolean): Promise<void> => {
  if (isPlus) {
    await upgradeToPlusSubscription();
  } else {
    await downgradeToFree();
  }
};

/**
 * デバッグ用: Plusプロンプト表示状態をリセット
 */
export const debugResetPlusPromptState = async (): Promise<void> => {
  const state = await getSubscriptionState();
  const newState: PlusSubscriptionState = {
    ...state,
    hasSeenPlusPrompt: false,
    plusPromptShownAt: null,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATE, JSON.stringify(newState));
  console.log('[Plus] Plus prompt state reset');
};

/**
 * デバッグ用: 全Plus状態をリセット
 */
export const debugResetAllPlusState = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.SUBSCRIPTION_STATE,
    STORAGE_KEYS.ADVENTURE_SETTINGS,
    STORAGE_KEYS.SELECTED_WEEK_TEMPLATE,
  ]);
  console.log('[Plus] All Plus state reset');
};
