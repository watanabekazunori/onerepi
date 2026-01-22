// ============================================
// Side Dish Suggester - もう一品提案機能
// メインディッシュに合う副菜を提案
// 材料・味付け・栄養バランスを総合的に考慮
// ============================================

import { Recipe, RecipeCategory } from '../types';
import { MOCK_RECIPES } from './mockData';

// ============================================
// 食材グループ定義（重複回避用）
// ============================================

// タンパク質グループ
const PROTEIN_GROUPS: Record<string, string[]> = {
  chicken: ['鶏', 'ささみ', '手羽', 'チキン'],
  pork: ['豚', 'ポーク'],
  beef: ['牛', 'ビーフ'],
  fish: ['鮭', 'サバ', 'ブリ', 'タラ', 'マグロ', 'カツオ', 'アジ', 'サンマ', 'イワシ', 'ホッケ', '魚'],
  seafood: ['エビ', 'イカ', 'タコ', 'アサリ', 'ホタテ', 'カニ'],
  egg: ['卵', '温泉卵', 'たまご'],
  tofu: ['豆腐', '厚揚げ', '油揚げ', '納豆'],
  processed: ['ベーコン', 'ソーセージ', 'ハム', 'ちくわ', 'かまぼこ', 'ツナ', 'サバ缶'],
};

// 野菜グループ
const VEGETABLE_GROUPS: Record<string, string[]> = {
  leafy: ['キャベツ', '白菜', 'レタス', 'ほうれん草', '小松菜', 'チンゲン菜', '水菜'],
  root: ['にんじん', 'じゃがいも', '大根', 'ごぼう', 'れんこん', '里芋'],
  allium: ['玉ねぎ', '長ネギ', 'にんにく'],
  nightshade: ['ピーマン', 'パプリカ', 'なす', 'トマト'],
  mushroom: ['しめじ', 'えのき', 'エリンギ', 'まいたけ', 'しいたけ', 'マッシュルーム'],
  sprout: ['もやし', '豆苗', 'カイワレ'],
  bean: ['枝豆', 'スナップエンドウ', 'いんげん'],
  other: ['ブロッコリー', 'アスパラガス', 'きゅうり', 'オクラ', 'かぼちゃ'],
};

// 味付け・調味料グループ
const FLAVOR_PROFILES: Record<string, string[]> = {
  soy: ['醤油', '照り焼き', '甘辛', 'めんつゆ'],
  miso: ['味噌', '味噌炒め', '味噌煮'],
  salt: ['塩', '塩焼き', 'さっぱり'],
  vinegar: ['酢', 'ポン酢', '南蛮', 'マリネ', '酢の物'],
  cream: ['クリーム', 'グラタン', 'ホワイトソース'],
  tomato: ['トマト', 'ケチャップ'],
  chinese: ['オイスター', '中華', '豆板醤', '麻婆', 'XO醤'],
  asian: ['ナンプラー', 'コチュジャン', 'カレー', 'エスニック'],
  garlic: ['にんにく', 'ガーリック', 'アヒージョ'],
  butter: ['バター', 'バター醤油'],
};

// ============================================
// 相性ルール（拡張版）
// ============================================

interface CompatibilityRule {
  mainCategory?: RecipeCategory;
  mainTags?: string[];
  mainIngredients?: string[];
  mainFlavor?: string[];
  sideDishConditions: {
    preferredTags?: string[];
    preferredCategories?: RecipeCategory[];
    excludeTags?: string[];
    excludeFlavors?: string[];
    maxTime?: number;
    preferLowCalorie?: boolean;
    preferVegetable?: boolean;
  };
  bonusScore: number;
  reasonText: string;
}

const COMPATIBILITY_RULES: CompatibilityRule[] = [
  // === 肉料理のルール ===
  {
    mainIngredients: ['鶏', '豚', '牛', 'ひき肉'],
    sideDishConditions: {
      preferredTags: ['野菜たっぷり', 'ヘルシー', 'さっぱり', '野菜不足解消'],
      excludeTags: ['がっつり', 'ボリューム満点'],
      maxTime: 15,
      preferLowCalorie: true,
      preferVegetable: true,
    },
    bonusScore: 30,
    reasonText: '野菜でバランス◎',
  },

  // === 魚料理のルール ===
  {
    mainIngredients: ['鮭', 'サバ', 'ブリ', 'タラ', 'マグロ', '魚'],
    sideDishConditions: {
      preferredTags: ['和風', '家庭の味', 'ヘルシー', 'さっぱり'],
      preferredCategories: ['japanese'],
      maxTime: 15,
    },
    bonusScore: 25,
    reasonText: '和風で相性◎',
  },

  // === こってり料理のルール ===
  {
    mainTags: ['がっつり', 'ボリューム満点', 'スタミナ', '高カロリー'],
    sideDishConditions: {
      preferredTags: ['さっぱり', 'ヘルシー', '低カロリー', '野菜たっぷり', '酢の物'],
      excludeTags: ['がっつり', 'こってり'],
      maxTime: 10,
      preferLowCalorie: true,
    },
    bonusScore: 35,
    reasonText: 'さっぱり口直し',
  },

  // === 味噌味メインのルール ===
  {
    mainFlavor: ['味噌'],
    sideDishConditions: {
      excludeFlavors: ['味噌'],  // 味噌の重複を避ける
      preferredTags: ['さっぱり', '酢の物', 'ポン酢'],
    },
    bonusScore: 20,
    reasonText: '味の変化◎',
  },

  // === 醤油ベースメインのルール ===
  {
    mainFlavor: ['醤油', '照り焼き', '甘辛'],
    sideDishConditions: {
      excludeFlavors: ['醤油'],  // 同系統を避ける
      preferredTags: ['さっぱり', '塩味', 'クリーム系'],
    },
    bonusScore: 15,
    reasonText: '味のバリエーション',
  },

  // === 中華メインのルール ===
  {
    mainCategory: 'chinese',
    sideDishConditions: {
      preferredTags: ['野菜たっぷり', 'さっぱり', '中華風'],
      preferredCategories: ['chinese', 'japanese'],
      maxTime: 15,
    },
    bonusScore: 20,
    reasonText: '中華に合う',
  },

  // === アジアンメインのルール ===
  {
    mainCategory: 'asian',
    sideDishConditions: {
      preferredTags: ['アジアン', 'エスニック', 'さっぱり', '野菜たっぷり'],
      preferredCategories: ['asian', 'japanese'],
      maxTime: 15,
    },
    bonusScore: 20,
    reasonText: 'アジアンに合う',
  },

  // === 洋食メインのルール ===
  {
    mainCategory: 'western',
    sideDishConditions: {
      preferredTags: ['洋風', 'カフェ風', 'ヘルシー', 'マリネ'],
      preferredCategories: ['western', 'japanese'],
      maxTime: 15,
    },
    bonusScore: 20,
    reasonText: '洋食に合う',
  },

  // === 辛い料理のルール ===
  {
    mainTags: ['ピリ辛', '辛い', 'スパイシー'],
    sideDishConditions: {
      preferredTags: ['さっぱり', 'マイルド', 'クリーム系'],
      excludeTags: ['辛い', 'ピリ辛', 'スパイシー'],
    },
    bonusScore: 25,
    reasonText: 'マイルドで中和',
  },

  // === 揚げ物のルール ===
  {
    mainTags: ['揚げ物', '唐揚げ', 'フライ'],
    sideDishConditions: {
      preferredTags: ['さっぱり', '酢の物', 'ヘルシー', '野菜たっぷり'],
      preferLowCalorie: true,
    },
    bonusScore: 30,
    reasonText: '揚げ物に合う',
  },
];

// お酒の相性ルール
const ALCOHOL_PAIRING_RULES: Record<string, string[]> = {
  ワイン: ['ワインに合う', '白ワインと', '赤ワインと', '洋風', 'カフェ風', 'マリネ'],
  ビール: ['ビールに合う', '居酒屋風', 'おつまみ', 'がっつり', '揚げ物'],
  日本酒: ['日本酒に合う', '和風', '和のおつまみ', '家庭の味', 'さっぱり'],
};

export interface SideDishSuggestion {
  recipe: Recipe;
  reason: string;
  matchScore: number;
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * 食材がどのグループに属するか判定
 */
const getIngredientGroups = (ingredientNames: string[]): Set<string> => {
  const groups = new Set<string>();

  for (const name of ingredientNames) {
    // タンパク質グループ
    for (const [group, keywords] of Object.entries(PROTEIN_GROUPS)) {
      if (keywords.some(kw => name.includes(kw))) {
        groups.add(`protein:${group}`);
      }
    }
    // 野菜グループ
    for (const [group, keywords] of Object.entries(VEGETABLE_GROUPS)) {
      if (keywords.some(kw => name.includes(kw))) {
        groups.add(`vegetable:${group}`);
      }
    }
  }

  return groups;
};

/**
 * 料理の味付けプロファイルを取得
 */
const getFlavorProfile = (recipe: Recipe): string[] => {
  const flavors: string[] = [];
  const name = recipe.name.toLowerCase();
  const tags = recipe.tags.join(' ').toLowerCase();
  const ingredients = recipe.ingredients.map(i => i.name).join(' ').toLowerCase();
  const combined = `${name} ${tags} ${ingredients}`;

  for (const [flavor, keywords] of Object.entries(FLAVOR_PROFILES)) {
    if (keywords.some(kw => combined.includes(kw.toLowerCase()))) {
      flavors.push(flavor);
    }
  }

  return flavors;
};

/**
 * タンパク質の種類が重複しているか
 */
const hasProteinOverlap = (mainGroups: Set<string>, sideGroups: Set<string>): boolean => {
  for (const group of mainGroups) {
    if (group.startsWith('protein:') && sideGroups.has(group)) {
      return true;
    }
  }
  return false;
};

/**
 * 同じ野菜グループが多く重複しているか
 */
const getVegetableOverlapCount = (mainGroups: Set<string>, sideGroups: Set<string>): number => {
  let count = 0;
  for (const group of mainGroups) {
    if (group.startsWith('vegetable:') && sideGroups.has(group)) {
      count++;
    }
  }
  return count;
};

// ============================================
// メイン提案関数
// ============================================

/**
 * メイン料理に合う副菜を提案する（改良版）
 */
export const suggestSideDishes = (
  mainRecipe: Recipe,
  count: number = 5
): SideDishSuggestion[] => {
  // メイン料理の分析
  const mainCategory = mainRecipe.category;
  const mainTags = mainRecipe.tags || [];
  const mainIngredientNames = mainRecipe.ingredients.map(i => i.name);
  const mainCalories = mainRecipe.nutrition?.calories || 300;
  const mainFlavors = getFlavorProfile(mainRecipe);
  const mainGroups = getIngredientGroups(mainIngredientNames);

  // 副菜候補を取得（メイン料理自体は除外）
  const candidates = MOCK_RECIPES.filter(r => r.id !== mainRecipe.id);

  // 各候補のスコアを計算
  const scoredCandidates = candidates.map(recipe => {
    let score = 50; // ベーススコア
    const reasons: string[] = [];
    const recipeTags = recipe.tags || [];
    const recipeIngredientNames = recipe.ingredients.map(i => i.name);
    const recipeCalories = recipe.nutrition?.calories || 200;
    const recipeFlavors = getFlavorProfile(recipe);
    const recipeGroups = getIngredientGroups(recipeIngredientNames);

    // ============================================
    // 1. 材料の重複チェック（重要！）
    // ============================================

    // タンパク質の重複は大幅減点
    if (hasProteinOverlap(mainGroups, recipeGroups)) {
      score -= 80;
    } else {
      score += 20;
      reasons.push('食材のバリエーション◎');
    }

    // 野菜グループの重複（2つ以上で減点）
    const vegOverlap = getVegetableOverlapCount(mainGroups, recipeGroups);
    if (vegOverlap >= 2) {
      score -= 30;
    } else if (vegOverlap === 0) {
      score += 10;
    }

    // 具体的な食材名の完全一致チェック
    const directOverlap = mainIngredientNames.filter(mi =>
      recipeIngredientNames.some(ri => ri === mi || ri.includes(mi) || mi.includes(ri))
    );
    if (directOverlap.length >= 2) {
      score -= 40;
    }

    // ============================================
    // 2. 味付けの重複・相性チェック
    // ============================================

    // 同じ味付けの重複を避ける
    const flavorOverlap = mainFlavors.filter(f => recipeFlavors.includes(f));
    if (flavorOverlap.length > 0) {
      score -= 20 * flavorOverlap.length;
    } else if (mainFlavors.length > 0 && recipeFlavors.length > 0) {
      score += 15;
      reasons.push('味の変化◎');
    }

    // ============================================
    // 3. 相性ルールの適用
    // ============================================

    for (const rule of COMPATIBILITY_RULES) {
      let ruleMatches = false;

      // メイン料理がルール条件に合うかチェック
      if (rule.mainCategory && mainCategory === rule.mainCategory) {
        ruleMatches = true;
      }
      if (rule.mainTags && rule.mainTags.some(tag =>
        mainTags.some(mt => mt.includes(tag) || tag.includes(mt))
      )) {
        ruleMatches = true;
      }
      if (rule.mainIngredients && rule.mainIngredients.some(ing =>
        mainIngredientNames.some(mi => mi.includes(ing))
      )) {
        ruleMatches = true;
      }
      if (rule.mainFlavor && rule.mainFlavor.some(f => mainFlavors.includes(f))) {
        ruleMatches = true;
      }

      // ルールにマッチした場合、副菜の条件をチェック
      if (ruleMatches) {
        const conditions = rule.sideDishConditions;
        let conditionScore = 0;

        // 推奨タグにマッチ
        if (conditions.preferredTags) {
          const matchedTags = conditions.preferredTags.filter(tag =>
            recipeTags.some(rt => rt.includes(tag) || tag.includes(rt))
          );
          conditionScore += matchedTags.length * 8;
        }

        // 推奨カテゴリにマッチ
        if (conditions.preferredCategories?.includes(recipe.category)) {
          conditionScore += 10;
        }

        // 除外タグに該当したら減点
        if (conditions.excludeTags) {
          const excludeMatches = conditions.excludeTags.filter(tag =>
            recipeTags.some(rt => rt.includes(tag))
          );
          conditionScore -= excludeMatches.length * 15;
        }

        // 除外フレーバーに該当したら減点
        if (conditions.excludeFlavors) {
          const excludeFlavorMatches = conditions.excludeFlavors.filter(f =>
            recipeFlavors.includes(f)
          );
          conditionScore -= excludeFlavorMatches.length * 10;
        }

        // 時間制限
        if (conditions.maxTime && recipe.cooking_time_minutes <= conditions.maxTime) {
          conditionScore += 5;
        }

        // 低カロリー優先
        if (conditions.preferLowCalorie && recipeCalories < 200) {
          conditionScore += 15;
        }

        // 野菜優先
        if (conditions.preferVegetable) {
          const vegCount = recipe.ingredients.filter(i => i.category === 'vegetable').length;
          if (vegCount >= 2) {
            conditionScore += 10;
          }
        }

        if (conditionScore > 0) {
          score += rule.bonusScore + conditionScore;
          reasons.push(rule.reasonText);
        }
      }
    }

    // ============================================
    // 4. カロリーバランス
    // ============================================

    if (mainCalories > 400 && recipeCalories < 200) {
      score += 20;
      if (!reasons.includes('カロリーバランス◎')) {
        reasons.push('カロリーバランス◎');
      }
    } else if (mainCalories > 500 && recipeCalories < 150) {
      score += 30;
    }

    // ============================================
    // 5. 調理時間・難易度
    // ============================================

    if (recipe.cooking_time_minutes <= 10) {
      score += 15;
      reasons.push('時短で作れる');
    } else if (recipe.cooking_time_minutes <= 15) {
      score += 8;
    } else if (recipe.cooking_time_minutes > 25) {
      score -= 10;
    }

    if (recipe.difficulty === 'easy') {
      score += 5;
    }

    // ============================================
    // 6. 副菜向きタグのボーナス
    // ============================================

    if (recipeTags.some(t => t.includes('野菜たっぷり') || t.includes('野菜不足解消'))) {
      score += 15;
      if (!reasons.some(r => r.includes('野菜'))) {
        reasons.push('野菜たっぷり');
      }
    }
    if (recipeTags.some(t => t.includes('ヘルシー') || t.includes('低カロリー'))) {
      score += 8;
    }
    if (recipeTags.some(t => t.includes('さっぱり'))) {
      score += 5;
    }

    // ============================================
    // 理由をまとめる
    // ============================================

    const uniqueReasons = [...new Set(reasons)].slice(0, 2);
    const reason = uniqueReasons.length > 0
      ? uniqueReasons.join('・')
      : 'バランスの良い組み合わせ';

    return {
      recipe,
      reason,
      matchScore: Math.max(0, score),
    };
  });

  // スコア順にソート
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  // 上位からランダム性を加えて選択（トップ15から選ぶ）
  const topCandidates = scoredCandidates.filter(c => c.matchScore > 30).slice(0, 15);

  if (topCandidates.length === 0) {
    // スコアが低い場合でも何か返す
    return scoredCandidates.slice(0, count);
  }

  // 重み付きランダム選択（スコアが高いほど選ばれやすい）
  const selected: SideDishSuggestion[] = [];
  const remaining = [...topCandidates];

  while (selected.length < count && remaining.length > 0) {
    const totalScore = remaining.reduce((sum, c) => sum + c.matchScore, 0);
    let random = Math.random() * totalScore;

    for (let i = 0; i < remaining.length; i++) {
      random -= remaining[i].matchScore;
      if (random <= 0) {
        selected.push(remaining[i]);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return selected;
};

/**
 * お酒に合うもう一品を提案
 */
export const suggestForAlcohol = (
  alcoholType: 'ワイン' | 'ビール' | '日本酒' | 'お酒',
  count: number = 5
): SideDishSuggestion[] => {
  const preferredTags = ALCOHOL_PAIRING_RULES[alcoholType] || [
    'お酒に合う',
    'おつまみ',
    '晩酌に',
  ];

  const candidates = MOCK_RECIPES.filter(recipe => {
    const recipeTags = recipe.tags || [];
    return preferredTags.some(tag => recipeTags.some(rt => rt.includes(tag)));
  });

  const scoredCandidates = candidates.map(recipe => {
    const recipeTags = recipe.tags || [];
    const matchedTags = preferredTags.filter(tag =>
      recipeTags.some(rt => rt.includes(tag))
    );
    const score = matchedTags.length * 20 + (recipe.cooking_time_minutes <= 15 ? 10 : 0);

    return {
      recipe,
      reason: matchedTags[0] || 'おつまみに最適',
      matchScore: score,
    };
  });

  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  const topCandidates = scoredCandidates.slice(0, 15);
  const shuffled = topCandidates.sort(() => 0.5 - Math.random());

  return shuffled.slice(0, count);
};

/**
 * クイック副菜提案（10分以内で作れるもの）
 */
export const suggestQuickSideDishes = (count: number = 5): SideDishSuggestion[] => {
  const quickRecipes = MOCK_RECIPES.filter(
    r => r.cooking_time_minutes <= 10 && r.difficulty === 'easy'
  );

  const scoredCandidates = quickRecipes.map(recipe => {
    const recipeTags = recipe.tags || [];
    let score = 50;

    if (recipeTags.some(t => t.includes('野菜たっぷり'))) score += 20;
    if (recipeTags.some(t => t.includes('ヘルシー'))) score += 15;
    if (recipeTags.some(t => t.includes('時短'))) score += 10;
    if (recipeTags.some(t => t.includes('簡単'))) score += 10;

    return {
      recipe,
      reason: '10分以内でパパッと',
      matchScore: score,
    };
  });

  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  const topCandidates = scoredCandidates.slice(0, 15);
  const shuffled = topCandidates.sort(() => 0.5 - Math.random());

  return shuffled.slice(0, count);
};
