// ============================================
// ワンパン・バディ - 心理タイプ別好み診断スコアリング
// 2軸マトリクス（機能/快楽 × 安定/探求）によるタイプ分類
// ============================================

import { Recipe } from '../types';

// ============================================
// 心理タイプ定義
// ============================================

/**
 * 5つの心理タイプ
 * 2軸マトリクス: 機能/快楽 × 安定/探求
 */
export type FoodPsychologyType =
  | 'smart_balancer'      // スマート・バランサー（機能×安定）
  | 'stoic_creator'       // ストイック・クリエイター（機能×探求）
  | 'healing_gourmet'     // ヒーリング・グルマン（快楽×安定）
  | 'trend_hunter'        // トレンド・ハンター（快楽×探求）
  | 'balanced';           // バランス型（中央）

export interface FoodTypeInfo {
  id: FoodPsychologyType;
  name: string;
  emoji: string;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  color: string;
}

export const FOOD_TYPES: Record<FoodPsychologyType, FoodTypeInfo> = {
  smart_balancer: {
    id: 'smart_balancer',
    name: 'スマート・バランサー',
    emoji: '⚖️',
    shortDescription: '効率よく、確実に',
    fullDescription: '食事はルーティン。失敗せず、効率よく栄養を摂りたい。無駄を嫌う合理派。',
    keywords: ['時短', '作り置き', '栄養バランス', '定番', '節約'],
    color: '#4A90D9',
  },
  stoic_creator: {
    id: 'stoic_creator',
    name: 'ストイック・クリエイター',
    emoji: '💪',
    shortDescription: '体づくりに、新しい挑戦を',
    fullDescription: '体作りや健康オタク。新しいスーパーフードやダイエット法を試したい自己実現派。',
    keywords: ['高タンパク', '低糖質', '最新健康法', '独自アレンジ', 'ヘルシー'],
    color: '#34A853',
  },
  healing_gourmet: {
    id: 'healing_gourmet',
    name: 'ヒーリング・グルマン',
    emoji: '🍲',
    shortDescription: '心に寄り添う、いつもの味',
    fullDescription: '食は心の安定剤。疲れた時に「いつものあの味」で癒やされたい。家庭的で温かいものを好む。',
    keywords: ['ほっこり', 'がっつり', '家庭料理', '懐かしい味', '背徳飯'],
    color: '#F5A623',
  },
  trend_hunter: {
    id: 'trend_hunter',
    name: 'トレンド・ハンター',
    emoji: '✨',
    shortDescription: '食は最高のエンタメ',
    fullDescription: '食はエンタメ。映えや話題性を重視。週末に凝った料理を作ったり、珍しい調味料を使いたい。',
    keywords: ['映え', 'エスニック', 'スパイス', 'パーティー', 'カフェ風'],
    color: '#E91E63',
  },
  balanced: {
    id: 'balanced',
    name: 'フレキシブル・フーディー',
    emoji: '🎭',
    shortDescription: 'その日の気分で自由に',
    fullDescription: '状況に応じて食のスタイルを使い分けられる柔軟派。平日は効率重視、週末は楽しみ重視など。',
    keywords: ['臨機応変', 'バランス', '柔軟', 'オールラウンド'],
    color: '#9B59B6',
  },
};

// ============================================
// 診断質問定義（5問A/B形式）
// ============================================

export interface DiagnosisQuestion {
  id: string;
  situation: string;  // シチュエーション
  question: string;   // 質問文
  optionA: {
    text: string;
    axis: 'functional' | 'hedonic';  // 機能重視 or 快楽重視
  };
  optionB: {
    text: string;
    axis: 'functional' | 'hedonic';
  };
  dimension: 'purpose' | 'adventure';  // 目的軸 or 冒険度軸
}

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: 'q1_stress',
    situation: 'すごく疲れて帰宅しました。',
    question: '夕食はどうしたい？',
    optionA: {
      text: 'とにかく早く食べて、早く寝たい',
      axis: 'functional',
    },
    optionB: {
      text: '美味しいものを食べて、ストレスを発散したい',
      axis: 'hedonic',
    },
    dimension: 'purpose',
  },
  {
    id: 'q2_new_seasoning',
    situation: '見たことのない国の調味料が売っています。',
    question: 'どう思う？',
    optionA: {
      text: '使い方が分からないから買わない',
      axis: 'functional',  // 安定（ここではfunctionalを安定として再利用）
    },
    optionB: {
      text: 'どんな味がするかワクワクするから試したい',
      axis: 'hedonic',     // 探求
    },
    dimension: 'adventure',
  },
  {
    id: 'q3_cooking_style',
    situation: '料理中のあなたに近いのは？',
    question: '',
    optionA: {
      text: 'レシピ通りに計量して、確実に作りたい',
      axis: 'functional',
    },
    optionB: {
      text: '味見しながら、自分好みにアレンジしたい',
      axis: 'hedonic',
    },
    dimension: 'adventure',
  },
  {
    id: 'q4_value',
    situation: '今日の食事で重視するのは？',
    question: '',
    optionA: {
      text: '明日の体のコンディション（健康・美容）',
      axis: 'functional',
    },
    optionB: {
      text: '今この瞬間の心の満足度（味・幸福感）',
      axis: 'hedonic',
    },
    dimension: 'purpose',
  },
  {
    id: 'q5_holiday',
    situation: '時間がある休日のランチは？',
    question: '',
    optionA: {
      text: '手間のかからない麺類や丼もので済ませたい',
      axis: 'functional',
    },
    optionB: {
      text: '時間をかけて煮込み料理やパン作りに挑戦したい',
      axis: 'hedonic',
    },
    dimension: 'adventure',
  },
];

// ============================================
// 診断回答と結果の型定義
// ============================================

export interface DiagnosisAnswer {
  questionId: string;
  selectedOption: 'A' | 'B';
}

export interface DiagnosisResult {
  type: FoodPsychologyType;
  typeInfo: FoodTypeInfo;
  scores: {
    purposeAxis: number;    // -100 (機能) ～ +100 (快楽)
    adventureAxis: number;  // -100 (安定) ～ +100 (探求)
  };
  answeredAt: string;
}

// 旧形式との互換性のため
export interface DiagnosisAnswers {
  psychologyType?: FoodPsychologyType;
  rawAnswers?: DiagnosisAnswer[];
  purposeScore?: number;
  adventureScore?: number;
  // 旧形式（後方互換性）
  taste_preference?: string[];
  texture_preference?: string[];
  cooking_style?: string[];
  new_recipe_attitude?: string[];
  meal_pattern?: string[];
}

// ============================================
// 診断結果計算ロジック
// ============================================

/**
 * 診断回答から心理タイプを判定
 */
export const calculateDiagnosisResult = (answers: DiagnosisAnswer[]): DiagnosisResult => {
  let purposeScore = 0;    // 機能(-) vs 快楽(+)
  let adventureScore = 0;  // 安定(-) vs 探求(+)

  answers.forEach(answer => {
    const question = DIAGNOSIS_QUESTIONS.find(q => q.id === answer.questionId);
    if (!question) return;

    const selectedOption = answer.selectedOption === 'A' ? question.optionA : question.optionB;
    const scoreChange = selectedOption.axis === 'hedonic' ? 40 : -40;

    if (question.dimension === 'purpose') {
      purposeScore += scoreChange;
    } else {
      adventureScore += scoreChange;
    }
  });

  // スコアを-100～+100にクランプ
  purposeScore = Math.max(-100, Math.min(100, purposeScore));
  adventureScore = Math.max(-100, Math.min(100, adventureScore));

  // タイプ判定
  const type = determineType(purposeScore, adventureScore);

  return {
    type,
    typeInfo: FOOD_TYPES[type],
    scores: {
      purposeAxis: purposeScore,
      adventureAxis: adventureScore,
    },
    answeredAt: new Date().toISOString(),
  };
};

/**
 * 2軸スコアからタイプを判定
 */
const determineType = (purposeScore: number, adventureScore: number): FoodPsychologyType => {
  // 中央領域（バランス型）の判定閾値
  const threshold = 30;

  // バランス型: 両軸とも中央付近
  if (Math.abs(purposeScore) < threshold && Math.abs(adventureScore) < threshold) {
    return 'balanced';
  }

  // 4象限の判定
  const isFunctional = purposeScore < 0;
  const isConservative = adventureScore < 0;

  if (isFunctional && isConservative) {
    return 'smart_balancer';      // 機能×安定
  } else if (isFunctional && !isConservative) {
    return 'stoic_creator';       // 機能×探求
  } else if (!isFunctional && isConservative) {
    return 'healing_gourmet';     // 快楽×安定
  } else {
    return 'trend_hunter';        // 快楽×探求
  }
};

// ============================================
// レシピ用心理タグ定義
// ============================================

export type PsychologyTag =
  // スマート・バランサー向け
  | 'quick'           // 時短・10分以内
  | 'meal_prep'       // 作り置き向き
  | 'budget'          // 節約
  | 'staple'          // 定番
  | 'balanced_nutrition' // 栄養バランス◎
  // ストイック・クリエイター向け
  | 'high_protein'    // 高タンパク
  | 'low_carb'        // 低糖質
  | 'superfood'       // スーパーフード系
  | 'health_conscious' // 健康志向
  // ヒーリング・グルマン向け
  | 'comfort'         // ほっこり・癒し系
  | 'hearty'          // がっつり・満足感
  | 'nostalgic'       // 懐かしい味
  | 'indulgent'       // 背徳飯
  // トレンド・ハンター向け
  | 'photogenic'      // 映え
  | 'ethnic'          // エスニック
  | 'spicy'           // スパイシー
  | 'trendy'          // トレンド
  | 'creative';       // 創作・アレンジ

// タイプ別の好みタグマッピング
export const TYPE_TAG_PREFERENCES: Record<FoodPsychologyType, {
  preferred: PsychologyTag[];
  avoided: PsychologyTag[];
  neutral: PsychologyTag[];
}> = {
  smart_balancer: {
    preferred: ['quick', 'meal_prep', 'budget', 'staple', 'balanced_nutrition'],
    avoided: ['indulgent', 'creative', 'ethnic'],
    neutral: ['high_protein', 'comfort', 'hearty'],
  },
  stoic_creator: {
    preferred: ['high_protein', 'low_carb', 'superfood', 'health_conscious', 'creative'],
    avoided: ['indulgent', 'hearty', 'nostalgic'],
    neutral: ['quick', 'ethnic', 'trendy'],
  },
  healing_gourmet: {
    preferred: ['comfort', 'hearty', 'nostalgic', 'indulgent', 'staple'],
    avoided: ['low_carb', 'superfood', 'ethnic'],
    neutral: ['quick', 'budget', 'photogenic'],
  },
  trend_hunter: {
    preferred: ['photogenic', 'ethnic', 'spicy', 'trendy', 'creative'],
    avoided: ['staple', 'nostalgic', 'budget'],
    neutral: ['high_protein', 'comfort', 'hearty'],
  },
  balanced: {
    preferred: ['balanced_nutrition', 'staple'],
    avoided: [],
    neutral: ['quick', 'comfort', 'ethnic', 'high_protein', 'photogenic'],
  },
};

// ============================================
// 既存タグから心理タグへのマッピング
// ============================================

export const TAG_TO_PSYCHOLOGY_MAP: Record<string, PsychologyTag[]> = {
  // 時間関連
  '時短': ['quick'],
  'スピード': ['quick'],
  '簡単': ['quick'],
  'パパッと': ['quick'],
  '10分': ['quick'],
  '15分': ['quick'],
  '作り置き': ['meal_prep'],

  // 健康関連
  'ヘルシー': ['health_conscious', 'low_carb'],
  '低カロリー': ['health_conscious', 'low_carb'],
  '低糖質': ['low_carb'],
  'ロカボ': ['low_carb'],
  '高タンパク': ['high_protein'],
  '筋トレ': ['high_protein'],
  '野菜たっぷり': ['health_conscious', 'balanced_nutrition'],
  '栄養満点': ['balanced_nutrition'],

  // 満足感関連
  'がっつり': ['hearty', 'indulgent'],
  'ボリューム': ['hearty'],
  'スタミナ': ['hearty'],
  '濃厚': ['indulgent', 'comfort'],
  'こってり': ['indulgent'],

  // 癒し関連
  'ほっこり': ['comfort', 'nostalgic'],
  '家庭の味': ['nostalgic', 'comfort', 'staple'],
  '定番': ['staple', 'nostalgic'],
  '優しい味': ['comfort'],

  // トレンド関連
  'エスニック': ['ethnic', 'trendy'],
  'アジアン': ['ethnic'],
  'スパイシー': ['spicy', 'ethnic'],
  'ピリ辛': ['spicy'],
  'カフェ風': ['photogenic', 'trendy'],
  '映え': ['photogenic'],
  'おしゃれ': ['photogenic', 'trendy'],

  // 節約関連
  '節約': ['budget'],
  'コスパ': ['budget'],
};

// カテゴリから心理タグへのマッピング
export const CATEGORY_TO_PSYCHOLOGY_MAP: Record<string, PsychologyTag[]> = {
  japanese: ['staple', 'nostalgic', 'comfort'],
  western: ['hearty', 'comfort'],
  chinese: ['hearty', 'spicy'],
  asian: ['ethnic', 'spicy', 'trendy'],
  other: ['creative', 'trendy'],
};

// ============================================
// レシピスコアリング
// ============================================

export interface RecipeScore {
  recipe: Recipe;
  totalScore: number;
  breakdown: {
    tagScore: number;
    categoryScore: number;
    timeScore: number;
    difficultyScore: number;
  };
  matchReasons: string[];
  psychologyTags: PsychologyTag[];
}

/**
 * レシピから心理タグを抽出
 */
export const extractPsychologyTags = (recipe: Recipe): PsychologyTag[] => {
  const tags = new Set<PsychologyTag>();

  // 既存タグからマッピング
  recipe.tags.forEach(tag => {
    const mappedTags = TAG_TO_PSYCHOLOGY_MAP[tag];
    if (mappedTags) {
      mappedTags.forEach(t => tags.add(t));
    }
  });

  // カテゴリからマッピング
  const categoryTags = CATEGORY_TO_PSYCHOLOGY_MAP[recipe.category];
  if (categoryTags) {
    categoryTags.forEach(t => tags.add(t));
  }

  // 調理時間から推測
  if (recipe.cooking_time_minutes <= 15) {
    tags.add('quick');
  }

  // 難易度から推測
  if (recipe.difficulty === 'easy') {
    tags.add('staple');
  } else if (recipe.difficulty === 'hard') {
    tags.add('creative');
  }

  // 弁当向きは作り置きと相性◎
  if (recipe.is_bento_friendly) {
    tags.add('meal_prep');
  }

  return Array.from(tags);
};

/**
 * 心理タイプに基づいてレシピをスコアリング
 */
export const scoreRecipeByType = (
  recipe: Recipe,
  psychologyType: FoodPsychologyType
): RecipeScore => {
  const preferences = TYPE_TAG_PREFERENCES[psychologyType];
  const psychologyTags = extractPsychologyTags(recipe);
  const matchReasons: string[] = [];

  let tagScore = 0;
  let categoryScore = 0;
  let timeScore = 0;
  let difficultyScore = 0;

  // タグスコア計算
  psychologyTags.forEach(tag => {
    if (preferences.preferred.includes(tag)) {
      tagScore += 20;
      // マッチ理由を追加
      const reasonMap: Partial<Record<PsychologyTag, string>> = {
        quick: '時短で効率的',
        meal_prep: '作り置きOK',
        high_protein: '高タンパク',
        low_carb: '低糖質',
        comfort: 'ほっこり癒し系',
        hearty: 'がっつり満足',
        nostalgic: '懐かしい味',
        photogenic: '映え◎',
        ethnic: 'エスニック',
        trendy: 'トレンド',
        budget: '節約◎',
        balanced_nutrition: '栄養バランス◎',
      };
      if (reasonMap[tag]) matchReasons.push(reasonMap[tag]);
    } else if (preferences.avoided.includes(tag)) {
      tagScore -= 15;
    } else if (preferences.neutral.includes(tag)) {
      tagScore += 5;
    }
  });

  // カテゴリスコア
  const typeInfo = FOOD_TYPES[psychologyType];
  if (psychologyType === 'smart_balancer' && recipe.category === 'japanese') {
    categoryScore += 10;
  } else if (psychologyType === 'trend_hunter' && ['asian', 'other'].includes(recipe.category)) {
    categoryScore += 15;
  } else if (psychologyType === 'healing_gourmet' && ['japanese', 'western'].includes(recipe.category)) {
    categoryScore += 10;
  }

  // 時間スコア（タイプ別の重み付け）
  if (psychologyType === 'smart_balancer') {
    // 時短重視
    if (recipe.cooking_time_minutes <= 15) {
      timeScore += 25;
      matchReasons.push('15分以内');
    } else if (recipe.cooking_time_minutes <= 20) {
      timeScore += 15;
    } else if (recipe.cooking_time_minutes > 30) {
      timeScore -= 10;
    }
  } else if (psychologyType === 'trend_hunter' || psychologyType === 'stoic_creator') {
    // 時間はあまり気にしない、ただし極端に長いのは避ける
    if (recipe.cooking_time_minutes > 60) {
      timeScore -= 5;
    }
  } else if (psychologyType === 'healing_gourmet') {
    // 煮込み料理など時間がかかるものも好き
    if (recipe.cooking_time_minutes >= 30) {
      timeScore += 5;
      matchReasons.push('じっくり調理');
    }
  }

  // 難易度スコア
  if (psychologyType === 'smart_balancer' && recipe.difficulty === 'easy') {
    difficultyScore += 10;
  } else if (psychologyType === 'stoic_creator' && recipe.difficulty !== 'easy') {
    difficultyScore += 5;
  } else if (psychologyType === 'trend_hunter' && recipe.difficulty === 'hard') {
    difficultyScore += 10;
    matchReasons.push('本格派');
  }

  const totalScore = 50 + tagScore + categoryScore + timeScore + difficultyScore;

  return {
    recipe,
    totalScore: Math.max(0, Math.min(150, totalScore)),
    breakdown: {
      tagScore,
      categoryScore,
      timeScore,
      difficultyScore,
    },
    matchReasons: [...new Set(matchReasons)].slice(0, 3),
    psychologyTags,
  };
};

/**
 * 後方互換性: 旧形式のDiagnosisAnswersからスコアリング
 */
export const scoreRecipeByPreference = (
  recipe: Recipe,
  diagnosisAnswers: DiagnosisAnswers,
  isFavorite: boolean = false
): RecipeScore => {
  // 新形式（心理タイプ）がある場合
  if (diagnosisAnswers.psychologyType) {
    const score = scoreRecipeByType(recipe, diagnosisAnswers.psychologyType);
    // お気に入りボーナス
    if (isFavorite) {
      score.totalScore += 15;
      score.matchReasons.push('お気に入り');
    }
    return score;
  }

  // 旧形式のフォールバック（簡易スコアリング）
  const psychologyTags = extractPsychologyTags(recipe);
  return {
    recipe,
    totalScore: 50 + psychologyTags.length * 5 + (isFavorite ? 15 : 0),
    breakdown: {
      tagScore: psychologyTags.length * 5,
      categoryScore: 0,
      timeScore: 0,
      difficultyScore: 0,
    },
    matchReasons: isFavorite ? ['お気に入り'] : [],
    psychologyTags,
  };
};

/**
 * レシピリストをタイプ別にソート
 */
export const sortRecipesByType = (
  recipes: Recipe[],
  psychologyType: FoodPsychologyType,
  favoriteIds: Set<string> = new Set()
): RecipeScore[] => {
  const scored = recipes.map(recipe => {
    const score = scoreRecipeByType(recipe, psychologyType);
    if (favoriteIds.has(recipe.id)) {
      score.totalScore += 15;
      score.matchReasons.push('お気に入り');
    }
    return score;
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored;
};

/**
 * タイプ別おすすめレシピを選択（週間献立用）
 */
export const selectRecipesByType = (
  recipes: Recipe[],
  count: number,
  psychologyType: FoodPsychologyType,
  excludeIds: Set<string> = new Set(),
  favoriteIds: Set<string> = new Set()
): Recipe[] => {
  const available = recipes.filter(r => !excludeIds.has(r.id));
  const scored = sortRecipesByType(available, psychologyType, favoriteIds);

  // 上位候補からバリエーションを持たせて選択
  const selected: Recipe[] = [];
  const topCandidates = scored.slice(0, Math.min(count * 4, scored.length));

  // 重み付きランダム選択
  const remaining = [...topCandidates];
  while (selected.length < count && remaining.length > 0) {
    const totalScore = remaining.reduce((sum, s) => sum + s.totalScore, 0);
    let random = Math.random() * totalScore;

    for (let i = 0; i < remaining.length; i++) {
      random -= remaining[i].totalScore;
      if (random <= 0) {
        selected.push(remaining[i].recipe);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return selected;
};

/**
 * 診断結果からサマリーテキストを生成
 */
export const generateTypeSummary = (result: DiagnosisResult): string[] => {
  const summaries: string[] = [];
  const { typeInfo, scores } = result;

  summaries.push(`あなたは「${typeInfo.emoji} ${typeInfo.name}」タイプ`);
  summaries.push(typeInfo.shortDescription);

  // 軸の傾向
  if (scores.purposeAxis < -30) {
    summaries.push('効率と健康を重視する合理派');
  } else if (scores.purposeAxis > 30) {
    summaries.push('食を楽しむ快楽派');
  }

  if (scores.adventureAxis < -30) {
    summaries.push('定番を大切にする安定志向');
  } else if (scores.adventureAxis > 30) {
    summaries.push('新しい味に挑戦する冒険派');
  }

  return summaries;
};

/**
 * タイプ別のおすすめキーワード
 */
export const getTypeRecommendationKeywords = (type: FoodPsychologyType): string[] => {
  return FOOD_TYPES[type].keywords;
};

// ============================================
// 「今の気分」微調整機能（オプション）
// ============================================

export type MoodModifier = 'hearty' | 'light' | 'comfort' | 'quick' | 'adventurous';

export const MOOD_MODIFIERS: Record<MoodModifier, {
  label: string;
  emoji: string;
  tagBoost: PsychologyTag[];
}> = {
  hearty: {
    label: 'がっつり',
    emoji: '🍖',
    tagBoost: ['hearty', 'indulgent'],
  },
  light: {
    label: 'さっぱり',
    emoji: '🥗',
    tagBoost: ['health_conscious', 'low_carb'],
  },
  comfort: {
    label: '癒されたい',
    emoji: '🍲',
    tagBoost: ['comfort', 'nostalgic'],
  },
  quick: {
    label: '手早く',
    emoji: '⚡',
    tagBoost: ['quick'],
  },
  adventurous: {
    label: '冒険したい',
    emoji: '🌍',
    tagBoost: ['ethnic', 'trendy', 'creative'],
  },
};

/**
 * 気分修正を適用したスコアリング
 */
export const applyMoodModifier = (
  score: RecipeScore,
  mood: MoodModifier
): RecipeScore => {
  const modifier = MOOD_MODIFIERS[mood];
  let bonus = 0;

  modifier.tagBoost.forEach(tag => {
    if (score.psychologyTags.includes(tag)) {
      bonus += 15;
    }
  });

  return {
    ...score,
    totalScore: score.totalScore + bonus,
    matchReasons: bonus > 0
      ? [...score.matchReasons, `今日の気分にぴったり`]
      : score.matchReasons,
  };
};
