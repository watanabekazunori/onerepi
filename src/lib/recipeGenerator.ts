// ============================================
// Recipe Generator - 3000個のレシピを自動生成
// ============================================

import { Recipe, RecipeCategory, IngredientCategory, Ingredient, CookingStep } from '../types';

// ========== 基本データ ==========

// メイン食材（タンパク質）- 50種類に拡張
const PROTEINS = [
  // 鶏肉
  { name: '鶏もも肉', emoji: '🍗', category: 'protein' as IngredientCategory },
  { name: '鶏むね肉', emoji: '🐔', category: 'protein' as IngredientCategory },
  { name: '鶏ひき肉', emoji: '🐔', category: 'protein' as IngredientCategory },
  { name: '鶏ささみ', emoji: '🐔', category: 'protein' as IngredientCategory },
  { name: '鶏手羽元', emoji: '🍗', category: 'protein' as IngredientCategory },
  { name: '鶏手羽先', emoji: '🍗', category: 'protein' as IngredientCategory },
  { name: '鶏レバー', emoji: '🐔', category: 'protein' as IngredientCategory },
  // 豚肉
  { name: '豚バラ肉', emoji: '🥓', category: 'protein' as IngredientCategory },
  { name: '豚こま切れ', emoji: '🐷', category: 'protein' as IngredientCategory },
  { name: '豚ひき肉', emoji: '🐷', category: 'protein' as IngredientCategory },
  { name: '豚ロース', emoji: '🐷', category: 'protein' as IngredientCategory },
  { name: '豚肩ロース', emoji: '🐷', category: 'protein' as IngredientCategory },
  { name: '豚もも肉', emoji: '🐷', category: 'protein' as IngredientCategory },
  { name: '豚ヒレ肉', emoji: '🐷', category: 'protein' as IngredientCategory },
  // 牛肉
  { name: '牛こま切れ', emoji: '🥩', category: 'protein' as IngredientCategory },
  { name: '牛ひき肉', emoji: '🥩', category: 'protein' as IngredientCategory },
  { name: '牛薄切り', emoji: '🥩', category: 'protein' as IngredientCategory },
  { name: '牛もも肉', emoji: '🥩', category: 'protein' as IngredientCategory },
  { name: '牛バラ肉', emoji: '🥩', category: 'protein' as IngredientCategory },
  { name: '合いびき肉', emoji: '🍖', category: 'protein' as IngredientCategory },
  // 魚介類
  { name: '鮭', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'サバ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'ブリ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'タラ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'マグロ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'カツオ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'アジ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'サンマ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'イワシ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'ホッケ', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'エビ', emoji: '🦐', category: 'protein' as IngredientCategory },
  { name: 'イカ', emoji: '🦑', category: 'protein' as IngredientCategory },
  { name: 'タコ', emoji: '🐙', category: 'protein' as IngredientCategory },
  { name: 'アサリ', emoji: '🐚', category: 'protein' as IngredientCategory },
  { name: 'ホタテ', emoji: '🐚', category: 'protein' as IngredientCategory },
  { name: 'カニカマ', emoji: '🦀', category: 'protein' as IngredientCategory },
  // 缶詰
  { name: 'ツナ缶', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'サバ缶', emoji: '🐟', category: 'protein' as IngredientCategory },
  { name: 'さんま缶', emoji: '🐟', category: 'protein' as IngredientCategory },
  // 卵・大豆製品
  { name: '卵', emoji: '🥚', category: 'protein' as IngredientCategory },
  { name: '温泉卵', emoji: '🥚', category: 'protein' as IngredientCategory },
  { name: '豆腐', emoji: '🧈', category: 'protein' as IngredientCategory },
  { name: '絹豆腐', emoji: '🧈', category: 'protein' as IngredientCategory },
  { name: '厚揚げ', emoji: '🧈', category: 'protein' as IngredientCategory },
  { name: '油揚げ', emoji: '🧈', category: 'protein' as IngredientCategory },
  { name: '納豆', emoji: '🫘', category: 'protein' as IngredientCategory },
  // 加工品
  { name: 'ベーコン', emoji: '🥓', category: 'protein' as IngredientCategory },
  { name: 'ソーセージ', emoji: '🌭', category: 'protein' as IngredientCategory },
  { name: 'ハム', emoji: '🍖', category: 'protein' as IngredientCategory },
  { name: 'ちくわ', emoji: '🍢', category: 'protein' as IngredientCategory },
  { name: 'かまぼこ', emoji: '🍥', category: 'protein' as IngredientCategory },
  { name: 'はんぺん', emoji: '🍢', category: 'protein' as IngredientCategory },
];

// 野菜 - 60種類に拡張
const VEGETABLES = [
  // 葉物野菜
  { name: 'キャベツ', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: '白菜', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'レタス', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'ほうれん草', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: '小松菜', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'チンゲン菜', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: '水菜', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: '春菊', emoji: '🌿', category: 'vegetable' as IngredientCategory },
  { name: 'ニラ', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: '三つ葉', emoji: '🌿', category: 'vegetable' as IngredientCategory },
  { name: '大葉', emoji: '🌿', category: 'vegetable' as IngredientCategory },
  { name: 'パセリ', emoji: '🌿', category: 'vegetable' as IngredientCategory },
  { name: 'バジル', emoji: '🌿', category: 'vegetable' as IngredientCategory },
  // もやし系
  { name: 'もやし', emoji: '🌱', category: 'vegetable' as IngredientCategory },
  { name: '豆苗', emoji: '🌱', category: 'vegetable' as IngredientCategory },
  { name: 'カイワレ', emoji: '🌱', category: 'vegetable' as IngredientCategory },
  // ネギ・玉ねぎ
  { name: '玉ねぎ', emoji: '🧅', category: 'vegetable' as IngredientCategory },
  { name: '長ネギ', emoji: '🧅', category: 'vegetable' as IngredientCategory },
  { name: '青ネギ', emoji: '🧅', category: 'vegetable' as IngredientCategory },
  { name: '万能ねぎ', emoji: '🧅', category: 'vegetable' as IngredientCategory },
  // 根菜
  { name: 'にんじん', emoji: '🥕', category: 'vegetable' as IngredientCategory },
  { name: 'じゃがいも', emoji: '🥔', category: 'vegetable' as IngredientCategory },
  { name: 'さつまいも', emoji: '🍠', category: 'vegetable' as IngredientCategory },
  { name: '里芋', emoji: '🥔', category: 'vegetable' as IngredientCategory },
  { name: '大根', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'かぶ', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'れんこん', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'ごぼう', emoji: '🥕', category: 'vegetable' as IngredientCategory },
  { name: 'たけのこ', emoji: '🎋', category: 'vegetable' as IngredientCategory },
  // 果菜
  { name: 'ピーマン', emoji: '🫑', category: 'vegetable' as IngredientCategory },
  { name: 'パプリカ', emoji: '🫑', category: 'vegetable' as IngredientCategory },
  { name: 'なす', emoji: '🍆', category: 'vegetable' as IngredientCategory },
  { name: 'トマト', emoji: '🍅', category: 'vegetable' as IngredientCategory },
  { name: 'ミニトマト', emoji: '🍅', category: 'vegetable' as IngredientCategory },
  { name: 'きゅうり', emoji: '🥒', category: 'vegetable' as IngredientCategory },
  { name: 'ズッキーニ', emoji: '🥒', category: 'vegetable' as IngredientCategory },
  { name: 'ゴーヤ', emoji: '🥒', category: 'vegetable' as IngredientCategory },
  { name: 'かぼちゃ', emoji: '🎃', category: 'vegetable' as IngredientCategory },
  { name: 'オクラ', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'とうもろこし', emoji: '🌽', category: 'vegetable' as IngredientCategory },
  { name: '枝豆', emoji: '🫛', category: 'vegetable' as IngredientCategory },
  { name: 'スナップエンドウ', emoji: '🫛', category: 'vegetable' as IngredientCategory },
  { name: 'いんげん', emoji: '🫛', category: 'vegetable' as IngredientCategory },
  // ブロッコリー系
  { name: 'ブロッコリー', emoji: '🥦', category: 'vegetable' as IngredientCategory },
  { name: 'カリフラワー', emoji: '🥦', category: 'vegetable' as IngredientCategory },
  { name: 'アスパラガス', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  { name: 'セロリ', emoji: '🥬', category: 'vegetable' as IngredientCategory },
  // きのこ
  { name: 'しめじ', emoji: '🍄', category: 'vegetable' as IngredientCategory },
  { name: 'えのき', emoji: '🍄', category: 'vegetable' as IngredientCategory },
  { name: 'エリンギ', emoji: '🍄', category: 'vegetable' as IngredientCategory },
  { name: 'まいたけ', emoji: '🍄', category: 'vegetable' as IngredientCategory },
  { name: 'しいたけ', emoji: '🍄', category: 'vegetable' as IngredientCategory },
  { name: 'マッシュルーム', emoji: '🍄', category: 'vegetable' as IngredientCategory },
  { name: 'なめこ', emoji: '🍄', category: 'vegetable' as IngredientCategory },
  // 香味野菜
  { name: 'にんにく', emoji: '🧄', category: 'vegetable' as IngredientCategory },
  { name: '生姜', emoji: '🫚', category: 'vegetable' as IngredientCategory },
  { name: 'みょうが', emoji: '🌿', category: 'vegetable' as IngredientCategory },
  // その他
  { name: 'もずく', emoji: '🌿', category: 'vegetable' as IngredientCategory },
  { name: 'めかぶ', emoji: '🌿', category: 'vegetable' as IngredientCategory },
];

// 調味料・ソース系 - 50種類に拡張
const SEASONINGS = [
  // 和風基本
  { name: '醤油', unit: '大さじ' },
  { name: 'みりん', unit: '大さじ' },
  { name: '酒', unit: '大さじ' },
  { name: '砂糖', unit: '大さじ' },
  { name: '塩', unit: '少々' },
  { name: 'こしょう', unit: '少々' },
  { name: '味噌', unit: '大さじ' },
  { name: '赤味噌', unit: '大さじ' },
  { name: '白味噌', unit: '大さじ' },
  { name: 'めんつゆ', unit: '大さじ' },
  { name: '白だし', unit: '大さじ' },
  { name: 'ポン酢', unit: '大さじ' },
  { name: '酢', unit: '大さじ' },
  { name: 'すし酢', unit: '大さじ' },
  { name: '梅肉', unit: '小さじ' },
  { name: 'わさび', unit: '小さじ' },
  { name: 'からし', unit: '小さじ' },
  { name: '柚子胡椒', unit: '小さじ' },
  // 中華・アジア
  { name: 'オイスターソース', unit: '大さじ' },
  { name: '鶏がらスープの素', unit: '小さじ' },
  { name: '豆板醤', unit: '小さじ' },
  { name: 'コチュジャン', unit: '大さじ' },
  { name: '甜麺醤', unit: '大さじ' },
  { name: 'XO醤', unit: '小さじ' },
  { name: '黒酢', unit: '大さじ' },
  { name: 'ナンプラー', unit: '大さじ' },
  { name: 'スイートチリソース', unit: '大さじ' },
  { name: 'ラー油', unit: '小さじ' },
  { name: '花椒', unit: '少々' },
  { name: '五香粉', unit: '少々' },
  // 洋風
  { name: 'コンソメ', unit: '小さじ' },
  { name: 'ケチャップ', unit: '大さじ' },
  { name: 'マヨネーズ', unit: '大さじ' },
  { name: 'マスタード', unit: '小さじ' },
  { name: '粒マスタード', unit: '小さじ' },
  { name: 'バルサミコ酢', unit: '大さじ' },
  { name: 'ウスターソース', unit: '大さじ' },
  { name: 'デミグラスソース', unit: '大さじ' },
  { name: 'トマトソース', unit: '大さじ' },
  { name: 'ホワイトソース', unit: '大さじ' },
  { name: 'アンチョビペースト', unit: '小さじ' },
  // 油・スパイス
  { name: 'ごま油', unit: '大さじ' },
  { name: 'オリーブオイル', unit: '大さじ' },
  { name: 'バター', unit: 'g' },
  { name: 'カレー粉', unit: '大さじ' },
  { name: 'ガラムマサラ', unit: '小さじ' },
  { name: 'クミン', unit: '少々' },
  { name: 'パプリカパウダー', unit: '少々' },
  // 便利調味料
  { name: '焼肉のタレ', unit: '大さじ' },
  { name: '照り焼きのタレ', unit: '大さじ' },
];

// 料理名パターン - 各カテゴリ25種類に拡張（合計100種類）
const COOKING_PATTERNS = {
  japanese: [
    // 基本の調理法
    { name: '炒め', verb: '炒める', emoji: '🍳' },
    { name: '煮', verb: '煮る', emoji: '🍲' },
    { name: '焼き', verb: '焼く', emoji: '🔥' },
    { name: '蒸し', verb: '蒸す', emoji: '♨️' },
    { name: '和え', verb: '和える', emoji: '🥢' },
    { name: '丼', verb: '盛り付ける', emoji: '🍚' },
    // 味付け別
    { name: '味噌炒め', verb: '味噌で炒める', emoji: '🍳' },
    { name: '照り焼き', verb: '照り焼きにする', emoji: '🍗' },
    { name: '生姜焼き', verb: '生姜焼きにする', emoji: '🐷' },
    { name: '甘辛煮', verb: '甘辛く煮る', emoji: '🍲' },
    { name: 'おろし煮', verb: '大根おろしで煮る', emoji: '🥬' },
    { name: '卵とじ', verb: '卵でとじる', emoji: '🥚' },
    { name: '南蛮', verb: '南蛮漬けにする', emoji: '🍗' },
    { name: 'きんぴら', verb: '炒め煮にする', emoji: '🥕' },
    { name: '塩焼き', verb: '塩で焼く', emoji: '🧂' },
    // 追加の和風調理法
    { name: '煮浸し', verb: '煮浸しにする', emoji: '🍲' },
    { name: '柚子胡椒炒め', verb: '柚子胡椒で炒める', emoji: '🍋' },
    { name: 'ごま和え', verb: 'ごまで和える', emoji: '🥢' },
    { name: 'ポン酢和え', verb: 'ポン酢で和える', emoji: '🍊' },
    { name: '梅煮', verb: '梅干しと煮る', emoji: '🍲' },
    { name: 'わさび和え', verb: 'わさびで和える', emoji: '🥬' },
    { name: '味噌煮', verb: '味噌で煮る', emoji: '🍲' },
    { name: 'バター醤油炒め', verb: 'バター醤油で炒める', emoji: '🧈' },
    { name: '酢の物', verb: '酢で和える', emoji: '🥒' },
    { name: 'めんつゆ煮', verb: 'めんつゆで煮る', emoji: '🍜' },
  ],
  western: [
    // 基本の調理法
    { name: 'ソテー', verb: 'ソテーする', emoji: '🍳' },
    { name: 'グリル', verb: 'グリルする', emoji: '🔥' },
    { name: 'パスタ', verb: 'パスタに和える', emoji: '🍝' },
    { name: 'リゾット', verb: 'リゾットにする', emoji: '🍚' },
    { name: 'クリーム煮', verb: 'クリームで煮る', emoji: '🥛' },
    { name: 'トマト煮', verb: 'トマトで煮る', emoji: '🍅' },
    { name: 'チーズ焼き', verb: 'チーズを乗せて焼く', emoji: '🧀' },
    { name: 'バター焼き', verb: 'バターで焼く', emoji: '🧈' },
    { name: 'ガーリック炒め', verb: 'にんにくで炒める', emoji: '🧄' },
    { name: 'オムレツ', verb: 'オムレツにする', emoji: '🥚' },
    { name: 'グラタン', verb: 'グラタンにする', emoji: '🧀' },
    { name: 'ピカタ', verb: 'ピカタにする', emoji: '🥚' },
    { name: 'マリネ', verb: 'マリネにする', emoji: '🥗' },
    // 追加の洋風調理法
    { name: 'ハーブ焼き', verb: 'ハーブで焼く', emoji: '🌿' },
    { name: 'バルサミコ炒め', verb: 'バルサミコで炒める', emoji: '🍷' },
    { name: 'アヒージョ風', verb: 'アヒージョ風に煮る', emoji: '🧄' },
    { name: 'ペペロンチーノ風', verb: 'ペペロンチーノ風に炒める', emoji: '🌶️' },
    { name: 'カルボナーラ風', verb: 'カルボナーラ風に和える', emoji: '🥚' },
    { name: 'ビネガー炒め', verb: 'ビネガーで炒める', emoji: '🍋' },
    { name: 'マスタード焼き', verb: 'マスタードで焼く', emoji: '🟡' },
    { name: 'ワイン煮込み', verb: 'ワインで煮込む', emoji: '🍷' },
    { name: 'レモンバター', verb: 'レモンバターで仕上げる', emoji: '🍋' },
    { name: 'オリーブ炒め', verb: 'オリーブオイルで炒める', emoji: '🫒' },
    { name: 'ケチャップ煮', verb: 'ケチャップで煮る', emoji: '🍅' },
    { name: 'デミグラス煮', verb: 'デミグラスで煮込む', emoji: '🍖' },
  ],
  chinese: [
    // 基本の中華
    { name: '中華炒め', verb: '中華風に炒める', emoji: '🥡' },
    { name: '回鍋肉風', verb: '回鍋肉風に炒める', emoji: '🐷' },
    { name: '青椒肉絲風', verb: '細切りで炒める', emoji: '🫑' },
    { name: '麻婆', verb: '麻婆風に煮る', emoji: '🌶️' },
    { name: 'あんかけ', verb: 'あんをかける', emoji: '🥡' },
    { name: '黒酢炒め', verb: '黒酢で炒める', emoji: '🥢' },
    { name: 'オイスター炒め', verb: 'オイスターソースで炒める', emoji: '🦪' },
    { name: 'ピリ辛炒め', verb: '辛味をつけて炒める', emoji: '🌶️' },
    { name: 'XO醤炒め', verb: 'XO醤で炒める', emoji: '🥡' },
    { name: '中華風煮込み', verb: '中華風に煮込む', emoji: '🍲' },
    // 追加の中華
    { name: '甜麺醤炒め', verb: '甜麺醤で炒める', emoji: '🥡' },
    { name: '豆板醤炒め', verb: '豆板醤で炒める', emoji: '🌶️' },
    { name: 'エビチリ風', verb: 'エビチリ風に炒める', emoji: '🦐' },
    { name: '酢豚風', verb: '酢豚風に炒める', emoji: '🐷' },
    { name: '棒棒鶏風', verb: '棒棒鶏風に仕上げる', emoji: '🍗' },
    { name: '油淋鶏風', verb: '油淋鶏風に仕上げる', emoji: '🍗' },
    { name: '八宝菜風', verb: '八宝菜風に炒める', emoji: '🥬' },
    { name: '花椒炒め', verb: '花椒で炒める', emoji: '🌶️' },
    { name: '中華蒸し', verb: '中華風に蒸す', emoji: '♨️' },
    { name: 'チンジャオ風', verb: 'チンジャオ風に炒める', emoji: '🫑' },
    { name: '担々風', verb: '担々風に仕上げる', emoji: '🍜' },
    { name: '五香粉炒め', verb: '五香粉で炒める', emoji: '🥢' },
    { name: '香味炒め', verb: '香味野菜で炒める', emoji: '🧄' },
    { name: '唐揚げ風', verb: '唐揚げ風に焼く', emoji: '🍗' },
    { name: '塩炒め', verb: '塩味で炒める', emoji: '🧂' },
  ],
  asian: [
    // 東南アジア
    { name: 'ナンプラー炒め', verb: 'ナンプラーで炒める', emoji: '🇹🇭' },
    { name: 'ガパオ風', verb: 'ガパオ風に炒める', emoji: '🌿' },
    { name: 'カレー炒め', verb: 'カレー風味に炒める', emoji: '🍛' },
    { name: 'ココナッツ煮', verb: 'ココナッツで煮る', emoji: '🥥' },
    { name: 'スイートチリ', verb: 'スイートチリで和える', emoji: '🌶️' },
    { name: 'サテ風', verb: 'サテ風に焼く', emoji: '🍢' },
    { name: 'レモングラス蒸し', verb: 'レモングラスで蒸す', emoji: '🍋' },
    // 韓国風
    { name: 'チャプチェ風', verb: 'チャプチェ風に炒める', emoji: '🇰🇷' },
    { name: 'ビビンバ風', verb: 'ビビンバ風に盛る', emoji: '🍚' },
    { name: 'プルコギ風', verb: 'プルコギ風に焼く', emoji: '🥩' },
    { name: 'コチュジャン炒め', verb: 'コチュジャンで炒める', emoji: '🌶️' },
    { name: 'キムチ炒め', verb: 'キムチと炒める', emoji: '🥬' },
    { name: 'チヂミ風', verb: 'チヂミ風に焼く', emoji: '🥞' },
    { name: 'サムギョプサル風', verb: 'サムギョプサル風に焼く', emoji: '🐷' },
    // 追加のアジアン
    { name: 'トムヤム風', verb: 'トムヤム風に煮る', emoji: '🦐' },
    { name: 'グリーンカレー風', verb: 'グリーンカレー風に煮る', emoji: '🍛' },
    { name: 'パッタイ風', verb: 'パッタイ風に炒める', emoji: '🍝' },
    { name: 'バインミー風', verb: 'バインミー風に仕上げる', emoji: '🥖' },
    { name: 'フォー風', verb: 'フォー風に仕上げる', emoji: '🍜' },
    { name: 'タンドリー風', verb: 'タンドリー風に焼く', emoji: '🍗' },
    { name: 'サンバル炒め', verb: 'サンバルで炒める', emoji: '🌶️' },
    { name: 'テリヤキアジアン', verb: 'アジアン照り焼きにする', emoji: '🍯' },
    { name: 'ライム和え', verb: 'ライムで和える', emoji: '🍋' },
    { name: 'パクチー添え', verb: 'パクチーを添える', emoji: '🌿' },
    { name: 'ピーナッツ炒め', verb: 'ピーナッツと炒める', emoji: '🥜' },
  ],
};

// 調理時間パターン
const TIME_PATTERNS = [5, 10, 15, 20, 25, 30];

// 難易度
const DIFFICULTIES: Array<'easy' | 'medium' | 'hard'> = ['easy', 'easy', 'easy', 'medium', 'medium', 'hard'];

// タグパターン - 大幅拡張版
const TAG_PATTERNS = {
  // 時間・簡単さ
  quick: ['時短', 'スピード', '10分以内', '15分以内', 'パパッと'],
  easy: ['簡単', '初心者向け', '失敗しない', '手軽', 'ズボラ飯'],

  // 弁当・作り置き
  bento: ['弁当OK', '作り置き', '冷めても美味しい', '翌日も◎', '冷凍OK'],

  // ヘルシー・ダイエット系
  healthy: ['ヘルシー', '低カロリー', 'ダイエット向け', 'カロリー控えめ', '罪悪感なし'],
  lowCarb: ['低糖質', '糖質オフ', 'ロカボ', '糖質制限'],
  highProtein: ['高タンパク', 'タンパク質豊富', '筋トレ飯', 'プロテイン補給'],

  // ボリューム系
  hearty: ['がっつり', 'ボリューム満点', '満腹', '食べ応え抜群', 'スタミナ'],

  // 定番・人気
  classic: ['定番', '人気', '王道', '間違いない', 'リピ確定'],

  // 節約系
  budget: ['節約', 'コスパ◎', '財布に優しい', '家計応援', '100円レシピ'],

  // 野菜系
  veggie: ['野菜たっぷり', '野菜不足解消', 'ベジタブル', '緑黄色野菜', '食物繊維'],

  // お酒に合う系
  wine: ['ワインに合う', '白ワインと', '赤ワインと', 'ワインのお供'],
  beer: ['ビールに合う', 'ビールのお供', '居酒屋風', 'おつまみ'],
  sake: ['日本酒に合う', '熱燗と', '冷酒と', '和のおつまみ'],
  alcohol: ['お酒に合う', '晩酌に', 'おつまみ最適', '酒の肴'],

  // シーン別
  weeknight: ['平日夜に', '仕事帰りに', '疲れた日に', '帰宅後すぐ'],
  weekend: ['週末ごはん', '休日ランチ', 'ブランチに'],
  special: ['おもてなし', '記念日に', 'パーティー向け', '特別な日に', 'ホムパに'],
  kids: ['子供が喜ぶ', 'キッズOK', '家族向け', '子供と一緒に'],

  // 季節
  summer: ['夏バテ防止', 'さっぱり', '冷たい', '夏向け'],
  winter: ['あったか', '温まる', '冬の定番', '体ぽかぽか'],

  // 料理ジャンル
  japanese: ['和風', '家庭の味', 'おふくろの味', '昔ながら'],
  western: ['洋風', 'カフェ風', 'おしゃれ', 'インスタ映え'],
  asian: ['アジアン', 'エスニック', 'スパイシー', 'ピリ辛'],
  chinese: ['中華風', '町中華', '本格中華'],

  // その他
  rice: ['ご飯がすすむ', '白米泥棒', 'おかわり必至', '丼にしても'],
  comfort: ['ほっこり', '癒し系', '懐かしい味', 'ソウルフード'],
};

// タグパターンをフラット配列に変換（互換性用）
const TAG_PATTERNS_FLAT = Object.values(TAG_PATTERNS).flat();

// 栄養情報ベースデータ（100gあたり）
const NUTRITION_DATA: Record<string, { calories: number; protein: number; fat: number; carbs: number }> = {
  // 肉類
  '鶏もも肉': { calories: 200, protein: 16, fat: 14, carbs: 0 },
  '鶏むね肉': { calories: 108, protein: 22, fat: 1.5, carbs: 0 },
  '鶏ひき肉': { calories: 166, protein: 17, fat: 10, carbs: 0 },
  '鶏ささみ': { calories: 105, protein: 23, fat: 0.8, carbs: 0 },
  '豚バラ肉': { calories: 386, protein: 14, fat: 35, carbs: 0 },
  '豚こま切れ': { calories: 236, protein: 18, fat: 17, carbs: 0 },
  '豚ひき肉': { calories: 221, protein: 18, fat: 15, carbs: 0 },
  '豚ロース': { calories: 263, protein: 19, fat: 19, carbs: 0 },
  '牛こま切れ': { calories: 286, protein: 17, fat: 23, carbs: 0 },
  '牛ひき肉': { calories: 272, protein: 17, fat: 21, carbs: 0 },
  '牛薄切り': { calories: 286, protein: 17, fat: 23, carbs: 0 },
  '合いびき肉': { calories: 236, protein: 17, fat: 17, carbs: 0 },
  // 魚介類
  '鮭': { calories: 133, protein: 22, fat: 4, carbs: 0 },
  'サバ': { calories: 202, protein: 20, fat: 12, carbs: 0 },
  'ブリ': { calories: 257, protein: 21, fat: 17, carbs: 0 },
  'タラ': { calories: 77, protein: 17, fat: 0.2, carbs: 0 },
  'エビ': { calories: 83, protein: 18, fat: 0.6, carbs: 0 },
  'イカ': { calories: 88, protein: 18, fat: 1.2, carbs: 0 },
  'タコ': { calories: 76, protein: 16, fat: 0.7, carbs: 0 },
  'アサリ': { calories: 30, protein: 6, fat: 0.3, carbs: 0 },
  'ツナ缶': { calories: 97, protein: 18, fat: 2, carbs: 0 },
  'サバ缶': { calories: 190, protein: 20, fat: 10, carbs: 0 },
  // その他タンパク質
  '卵': { calories: 151, protein: 12, fat: 10, carbs: 0.3 },
  '豆腐': { calories: 72, protein: 6.6, fat: 4.2, carbs: 1.6 },
  '厚揚げ': { calories: 150, protein: 10, fat: 11, carbs: 1 },
  '油揚げ': { calories: 386, protein: 18, fat: 33, carbs: 0 },
  'ベーコン': { calories: 405, protein: 13, fat: 39, carbs: 0 },
  'ソーセージ': { calories: 321, protein: 12, fat: 29, carbs: 3 },
  'ハム': { calories: 196, protein: 16, fat: 14, carbs: 1 },
  'ちくわ': { calories: 121, protein: 12, fat: 2, carbs: 13 },
  // 野菜類
  'キャベツ': { calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2 },
  '白菜': { calories: 14, protein: 0.8, fat: 0.1, carbs: 3.2 },
  'レタス': { calories: 12, protein: 0.6, fat: 0.1, carbs: 2.8 },
  'ほうれん草': { calories: 20, protein: 2.2, fat: 0.4, carbs: 3.1 },
  '小松菜': { calories: 14, protein: 1.5, fat: 0.2, carbs: 2.4 },
  'チンゲン菜': { calories: 9, protein: 0.6, fat: 0.1, carbs: 2 },
  'もやし': { calories: 14, protein: 1.7, fat: 0.1, carbs: 2.6 },
  '玉ねぎ': { calories: 37, protein: 1, fat: 0.1, carbs: 8.8 },
  '長ネギ': { calories: 34, protein: 1.4, fat: 0.1, carbs: 8.3 },
  'にんじん': { calories: 39, protein: 0.7, fat: 0.1, carbs: 9.3 },
  'じゃがいも': { calories: 76, protein: 1.6, fat: 0.1, carbs: 17.6 },
  'さつまいも': { calories: 134, protein: 1.2, fat: 0.2, carbs: 31.5 },
  '大根': { calories: 18, protein: 0.5, fat: 0.1, carbs: 4.1 },
  'ピーマン': { calories: 22, protein: 0.9, fat: 0.2, carbs: 5.1 },
  'パプリカ': { calories: 30, protein: 1, fat: 0.2, carbs: 7.2 },
  'なす': { calories: 22, protein: 1.1, fat: 0.1, carbs: 5.1 },
  'トマト': { calories: 19, protein: 0.7, fat: 0.1, carbs: 4.7 },
  'ミニトマト': { calories: 29, protein: 1.1, fat: 0.1, carbs: 7.2 },
  'きゅうり': { calories: 14, protein: 1, fat: 0.1, carbs: 3 },
  'ズッキーニ': { calories: 14, protein: 1.3, fat: 0.1, carbs: 2.8 },
  'ブロッコリー': { calories: 33, protein: 4.3, fat: 0.5, carbs: 5.2 },
  'カリフラワー': { calories: 27, protein: 3, fat: 0.1, carbs: 5.2 },
  'アスパラガス': { calories: 22, protein: 2.6, fat: 0.2, carbs: 3.9 },
  'セロリ': { calories: 15, protein: 0.4, fat: 0.1, carbs: 3.6 },
  'しめじ': { calories: 18, protein: 2.7, fat: 0.6, carbs: 4.8 },
  'えのき': { calories: 22, protein: 2.7, fat: 0.2, carbs: 7.6 },
  'エリンギ': { calories: 24, protein: 2.8, fat: 0.4, carbs: 6 },
  'まいたけ': { calories: 16, protein: 2, fat: 0.5, carbs: 4.4 },
  'しいたけ': { calories: 18, protein: 3, fat: 0.4, carbs: 5.7 },
  'にんにく': { calories: 136, protein: 6, fat: 0.9, carbs: 27.5 },
  '生姜': { calories: 30, protein: 0.9, fat: 0.3, carbs: 6.6 },
  '大葉': { calories: 37, protein: 3.9, fat: 0.1, carbs: 7.5 },
  'ニラ': { calories: 21, protein: 1.7, fat: 0.3, carbs: 4 },
  'オクラ': { calories: 30, protein: 2.1, fat: 0.2, carbs: 6.6 },
  'かぼちゃ': { calories: 91, protein: 1.9, fat: 0.3, carbs: 20.6 },
  'ゴーヤ': { calories: 17, protein: 1, fat: 0.1, carbs: 3.9 },
  'れんこん': { calories: 66, protein: 1.9, fat: 0.1, carbs: 15.5 },
  'ごぼう': { calories: 65, protein: 1.8, fat: 0.1, carbs: 15.4 },
  'たけのこ': { calories: 26, protein: 3.6, fat: 0.2, carbs: 4.3 },
  '水菜': { calories: 23, protein: 2.2, fat: 0.1, carbs: 4.8 },
  // 新規追加 - 肉類
  '鶏手羽元': { calories: 197, protein: 18, fat: 12, carbs: 0 },
  '鶏手羽先': { calories: 211, protein: 17, fat: 14, carbs: 0 },
  '鶏レバー': { calories: 111, protein: 18, fat: 3, carbs: 0.6 },
  '豚肩ロース': { calories: 253, protein: 17, fat: 19, carbs: 0 },
  '豚もも肉': { calories: 183, protein: 20, fat: 10, carbs: 0 },
  '豚ヒレ肉': { calories: 115, protein: 22, fat: 1.9, carbs: 0.2 },
  '牛もも肉': { calories: 182, protein: 21, fat: 9, carbs: 0 },
  '牛バラ肉': { calories: 371, protein: 14, fat: 32, carbs: 0 },
  // 新規追加 - 魚介類
  'マグロ': { calories: 125, protein: 26, fat: 1.4, carbs: 0 },
  'カツオ': { calories: 114, protein: 25, fat: 0.5, carbs: 0.1 },
  'アジ': { calories: 121, protein: 20, fat: 3.5, carbs: 0.1 },
  'サンマ': { calories: 310, protein: 18, fat: 24, carbs: 0.1 },
  'イワシ': { calories: 217, protein: 19, fat: 13, carbs: 0.2 },
  'ホッケ': { calories: 115, protein: 17, fat: 4, carbs: 0 },
  'ホタテ': { calories: 72, protein: 13, fat: 0.9, carbs: 1.5 },
  'カニカマ': { calories: 90, protein: 12, fat: 0.5, carbs: 9 },
  'さんま缶': { calories: 225, protein: 18, fat: 15, carbs: 0 },
  // 新規追加 - 大豆製品
  '絹豆腐': { calories: 56, protein: 4.9, fat: 3, carbs: 2 },
  '納豆': { calories: 200, protein: 16, fat: 10, carbs: 12 },
  '温泉卵': { calories: 151, protein: 12, fat: 10, carbs: 0.3 },
  'かまぼこ': { calories: 95, protein: 12, fat: 0.9, carbs: 9.7 },
  'はんぺん': { calories: 94, protein: 9.9, fat: 1, carbs: 11.4 },
  // 新規追加 - 野菜
  '春菊': { calories: 22, protein: 2.3, fat: 0.3, carbs: 3.9 },
  '三つ葉': { calories: 13, protein: 0.9, fat: 0.1, carbs: 2.9 },
  'パセリ': { calories: 43, protein: 3.7, fat: 0.7, carbs: 6.3 },
  'バジル': { calories: 24, protein: 3.1, fat: 0.6, carbs: 4 },
  '豆苗': { calories: 27, protein: 3.8, fat: 0.4, carbs: 4 },
  'カイワレ': { calories: 21, protein: 2.1, fat: 0.5, carbs: 3.3 },
  '青ネギ': { calories: 31, protein: 1.5, fat: 0.2, carbs: 7 },
  '万能ねぎ': { calories: 27, protein: 1.9, fat: 0.3, carbs: 5.5 },
  '里芋': { calories: 58, protein: 1.5, fat: 0.1, carbs: 13.1 },
  'かぶ': { calories: 20, protein: 0.7, fat: 0.1, carbs: 4.6 },
  'とうもろこし': { calories: 92, protein: 3.6, fat: 1.7, carbs: 16.8 },
  '枝豆': { calories: 135, protein: 11.7, fat: 6.2, carbs: 8.8 },
  'スナップエンドウ': { calories: 43, protein: 3, fat: 0.2, carbs: 7.5 },
  'いんげん': { calories: 23, protein: 1.8, fat: 0.1, carbs: 5.1 },
  'マッシュルーム': { calories: 11, protein: 2.9, fat: 0.3, carbs: 0.1 },
  'なめこ': { calories: 15, protein: 1.7, fat: 0.2, carbs: 5.4 },
  'みょうが': { calories: 12, protein: 0.9, fat: 0.1, carbs: 2.6 },
  'もずく': { calories: 4, protein: 0.2, fat: 0.1, carbs: 1.4 },
  'めかぶ': { calories: 11, protein: 0.9, fat: 0.6, carbs: 3.4 },
};

// 調理法による栄養変化係数
const COOKING_METHOD_MULTIPLIER: Record<string, { fat: number; calories: number }> = {
  '炒め': { fat: 1.3, calories: 1.15 },
  '焼き': { fat: 1.2, calories: 1.1 },
  '煮': { fat: 1.0, calories: 1.0 },
  '蒸し': { fat: 1.0, calories: 1.0 },
  '和え': { fat: 1.1, calories: 1.05 },
  '揚げ': { fat: 1.8, calories: 1.4 },
};

// 調理のコツ・ヒント集
const PREP_TIPS: Record<string, string[]> = {
  '鶏もも肉': ['余分な脂身と皮の端を切り落とすとヘルシー', '火の通りを均一にするため厚さを揃える'],
  '鶏むね肉': ['繊維に逆らって切ると柔らかくなる', 'フォークで穴をあけると味が染みやすい'],
  '鶏ひき肉': ['冷蔵庫から出してすぐ調理OK', '手で軽くほぐしておくと炒めやすい'],
  '豚バラ肉': ['脂身が多いので油は少なめに', '薄切りは広げて重ならないように'],
  '豚こま切れ': ['片栗粉をまぶすと柔らかく仕上がる', '一口大に切ると食べやすい'],
  '牛こま切れ': ['常温に戻してから調理すると柔らかい', '強火でサッと炒めるのがコツ'],
  '鮭': ['骨を確認して取り除く', '皮目から焼くとパリッと仕上がる'],
  'サバ': ['臭み取りに塩を振って10分置く', '皮に切り込みを入れると火が通りやすい'],
  '豆腐': ['キッチンペーパーで水気を切る', '木綿は崩れにくく炒め物向き'],
  'キャベツ': ['芯は薄切りにすると甘みが出る', '葉と芯で切り方を変えると○'],
  'もやし': ['ひげ根を取ると口当たりが良い', '洗った後は水気をしっかり切る'],
  '玉ねぎ': ['繊維に沿って切ると食感が残る', '繊維を断つと甘くトロッと'],
  'にんじん': ['皮のすぐ下に栄養があるので薄く剥く', '乱切りで味染み◎'],
  'なす': ['切ったら塩水にさらすとアク抜き', '油を吸いやすいので量に注意'],
  'ピーマン': ['種とワタは取り除く', '縦に切ると苦味が抑えられる'],
};

const COOKING_TIPS: Record<string, string[]> = {
  '炒め': ['フライパンをしっかり熱してから', '材料を入れすぎない（一気に炒めない）', '強火でサッと仕上げる'],
  '焼き': ['焦げ目がつくまで動かさない', '裏返すのは1回だけ', '仕上げに蓋をして蒸し焼きもOK'],
  '煮': ['落し蓋で味が均一に染みる', '弱火でコトコト煮ると柔らかく', '冷めるときに味が染み込む'],
  '蒸し': ['水が足りなくならないよう注意', '蓋を開けすぎない', '竹串がスッと通ればOK'],
  '丼': ['ご飯は少し固めに炊く', 'タレは煮詰めすぎない', '半熟卵で豪華に'],
};

const FINISH_TIPS = [
  '器を温めておくと冷めにくい',
  '彩りに青みを添えると美味しそう',
  '盛り付けは高さを出すと◎',
  'すぐ食べると一番美味しい',
  '白ごまや刻みネギで仕上げ',
];

// ========== ヘルパー関数 ==========

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomItems = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// 栄養情報を生成する関数
const generateNutrition = (
  protein: typeof PROTEINS[0],
  vegetables: typeof VEGETABLES[0][],
  cookingPatternName: string
): { calories: number; protein: number; fat: number; carbohydrates: number; fiber: number; sodium: number } => {
  // 基本栄養データを取得
  const proteinData = NUTRITION_DATA[protein.name] || { calories: 150, protein: 15, fat: 8, carbs: 0 };
  const proteinAmount = protein.name.includes('肉') ? 150 : (protein.name.includes('卵') ? 100 : 100);

  // タンパク質からの栄養計算（量を考慮）
  let totalCalories = (proteinData.calories * proteinAmount) / 100;
  let totalProtein = (proteinData.protein * proteinAmount) / 100;
  let totalFat = (proteinData.fat * proteinAmount) / 100;
  let totalCarbs = (proteinData.carbs * proteinAmount) / 100;
  let totalFiber = 0;

  // 野菜からの栄養計算
  vegetables.forEach(veg => {
    const vegData = NUTRITION_DATA[veg.name] || { calories: 20, protein: 1, fat: 0.2, carbs: 4 };
    // 野菜は平均50g使用と想定
    const vegAmount = (veg.name === 'にんにく' || veg.name === '生姜') ? 5 : 50;
    totalCalories += (vegData.calories * vegAmount) / 100;
    totalProtein += (vegData.protein * vegAmount) / 100;
    totalFat += (vegData.fat * vegAmount) / 100;
    totalCarbs += (vegData.carbs * vegAmount) / 100;
    // 野菜は食物繊維豊富
    totalFiber += vegAmount * 0.02; // 2%と仮定
  });

  // 調理法による補正
  const cookingMethod = Object.keys(COOKING_METHOD_MULTIPLIER).find(m => cookingPatternName.includes(m));
  if (cookingMethod) {
    const multiplier = COOKING_METHOD_MULTIPLIER[cookingMethod];
    totalFat *= multiplier.fat;
    totalCalories *= multiplier.calories;
  }

  // 調味料からの塩分（ナトリウム）推定
  // 醤油大さじ1 = 約900mg、塩少々 = 約400mg、味噌大さじ1 = 約800mg
  const sodium = 500 + Math.floor(Math.random() * 500); // 500-1000mg

  // 油を使う調理法は脂質・カロリーが増える
  if (cookingPatternName.includes('炒め') || cookingPatternName.includes('焼き')) {
    totalFat += 5; // 油大さじ1分
    totalCalories += 40;
  }

  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    fat: Math.round(totalFat),
    carbohydrates: Math.round(totalCarbs),
    fiber: Math.round(totalFiber * 10) / 10,
    sodium: sodium,
  };
};

const generateIngredients = (protein: typeof PROTEINS[0], vegetables: typeof VEGETABLES[0][]): Ingredient[] => {
  const ingredients: Ingredient[] = [];
  let idCounter = 1;

  // メイン食材
  ingredients.push({
    id: `i${idCounter++}`,
    name: protein.name,
    amount: protein.name.includes('肉') ? 150 : (protein.name.includes('卵') ? 2 : 100),
    unit: protein.name.includes('卵') ? '個' : 'g',
    category: protein.category,
    is_optional: false,
  });

  // 野菜
  vegetables.forEach((veg) => {
    ingredients.push({
      id: `i${idCounter++}`,
      name: veg.name,
      amount: veg.name.includes('にんにく') || veg.name.includes('生姜') ? 1 : (Math.random() > 0.5 ? 0.5 : 1),
      unit: veg.name.includes('にんにく') || veg.name.includes('生姜') ? '片' : '個',
      category: veg.category,
      is_optional: false,
    });
  });

  // 調味料
  const seasonings = getRandomItems(SEASONINGS, 3);
  seasonings.forEach((s) => {
    ingredients.push({
      id: `i${idCounter++}`,
      name: s.name,
      amount: s.unit === '少々' ? 1 : (s.unit === '小さじ' ? 1 : 2),
      unit: s.unit,
      category: 'seasoning',
      is_optional: false,
    });
  });

  return ingredients;
};

const generateSteps = (
  cookingPattern: typeof COOKING_PATTERNS.japanese[0],
  protein: string,
  vegetables: string[],
  seasonings: string[]
): CookingStep[] => {
  const steps: CookingStep[] = [];
  let order = 1;

  // 下準備のヒントを取得
  const proteinTip = PREP_TIPS[protein]?.[Math.floor(Math.random() * (PREP_TIPS[protein]?.length || 1))] || '食べやすい大きさに切る';
  const vegTips = vegetables.map(v => PREP_TIPS[v]?.[0]).filter(Boolean);

  // 調理法に応じたヒントを取得
  const cookingMethod = Object.keys(COOKING_TIPS).find(m => cookingPattern.name.includes(m)) || '炒め';
  const methodTips = COOKING_TIPS[cookingMethod] || COOKING_TIPS['炒め'];

  // ========== STEP 1: 下準備 ==========
  const prepDetails: string[] = [];

  // タンパク質の下準備
  if (protein.includes('肉')) {
    prepDetails.push(`${protein}は一口大（2〜3cm角）に切る`);
  } else if (protein.includes('卵')) {
    prepDetails.push(`${protein}はボウルに割り入れ、よく溶きほぐす`);
  } else if (protein.includes('豆腐')) {
    prepDetails.push(`${protein}はキッチンペーパーで水気を切り、2cm角に切る`);
  } else if (protein.includes('鮭') || protein.includes('サバ') || protein.includes('ブリ') || protein.includes('タラ')) {
    prepDetails.push(`${protein}は骨があれば取り除き、食べやすい大きさに切る`);
  } else if (protein.includes('エビ')) {
    prepDetails.push(`${protein}は殻と背わたを取り、軽く塩を振る`);
  } else {
    prepDetails.push(`${protein}は食べやすい大きさに切る`);
  }

  // 野菜の下準備
  vegetables.forEach(veg => {
    if (veg === 'にんにく' || veg === '生姜') {
      prepDetails.push(`${veg}はみじん切りにする`);
    } else if (veg === '玉ねぎ' || veg === '長ネギ') {
      prepDetails.push(`${veg}は薄切りまたはくし切りにする`);
    } else if (veg.includes('菜') || veg === 'キャベツ' || veg === '白菜' || veg === 'レタス') {
      prepDetails.push(`${veg}はざく切りにする`);
    } else if (veg === 'もやし') {
      prepDetails.push(`${veg}は洗って水気を切る`);
    } else if (veg === 'にんじん' || veg === '大根') {
      prepDetails.push(`${veg}は薄い短冊切りまたは乱切りにする`);
    } else if (veg.includes('しめじ') || veg.includes('えのき') || veg.includes('エリンギ') || veg.includes('まいたけ') || veg.includes('しいたけ')) {
      prepDetails.push(`${veg}は石づきを切り落とし、手でほぐす`);
    } else if (veg === 'ピーマン' || veg === 'パプリカ') {
      prepDetails.push(`${veg}は種を取り除き、細切りにする`);
    } else if (veg === 'なす') {
      prepDetails.push(`${veg}は乱切りにし、水にさらしてアク抜きする`);
    } else if (veg === 'トマト' || veg === 'ミニトマト') {
      prepDetails.push(`${veg}はヘタを取り、くし切りにする`);
    } else if (veg === 'ブロッコリー' || veg === 'カリフラワー') {
      prepDetails.push(`${veg}は小房に分ける`);
    } else {
      prepDetails.push(`${veg}は食べやすい大きさに切る`);
    }
  });

  steps.push({
    id: `s${order}`,
    order: order++,
    phase: 'prep',
    title: '材料の下準備',
    description: `${protein}と${vegetables.join('、')}を切ります`,
    details: prepDetails,
    duration_seconds: 120 + vegetables.length * 30,
    ingredientsUsed: [protein, ...vegetables],
    tips: proteinTip || vegTips[0] || '材料は均一な大きさに切ると火の通りが揃います',
  });

  // ========== STEP 2以降: 調理法によって分岐 ==========

  if (cookingPattern.name.includes('炒め') || cookingPattern.name.includes('焼き') || cookingPattern.name.includes('ソテー') || cookingPattern.name.includes('グリル')) {
    // 炒め・焼き系
    const hasGarlic = vegetables.includes('にんにく');
    const hasGinger = vegetables.includes('生姜');

    // フライパン加熱
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: 'フライパンを熱する',
      description: `フライパンに油をひいて${hasGarlic || hasGinger ? '弱火' : '中火'}で熱します`,
      details: [
        'フライパンにサラダ油大さじ1を入れる',
        hasGarlic ? 'にんにくを入れて香りが出るまで炒める（約30秒）' : '',
        hasGinger ? '生姜を入れて香りが出るまで炒める（約30秒）' : '',
        '香りが立ったら中火にする',
      ].filter(Boolean),
      duration_seconds: 60,
      ingredientsUsed: [hasGarlic ? 'にんにく' : '', hasGinger ? '生姜' : ''].filter(Boolean),
      tips: methodTips[0] || '油がサラサラになったら準備OK',
    });

    // タンパク質を炒める
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: `${protein}を炒める`,
      description: `${protein}を入れて火が通るまで炒めます`,
      details: [
        `${protein}を広げるようにフライパンに入れる`,
        '最初は触らず、焼き色がつくまで待つ（約1分）',
        'ひっくり返しながら全体に火を通す',
        protein.includes('肉') ? '肉の色が変わったらOK' : '表面がこんがりしたらOK',
      ],
      duration_seconds: 180,
      ingredientsUsed: [protein],
      tips: methodTips[1] || '焦げないように時々混ぜる',
    });

    // 野菜を加える（にんにく・生姜以外）
    const mainVegetables = vegetables.filter(v => v !== 'にんにく' && v !== '生姜');
    if (mainVegetables.length > 0) {
      const hardVegetables = mainVegetables.filter(v =>
        ['にんじん', 'じゃがいも', 'ごぼう', 'れんこん', 'かぼちゃ'].includes(v)
      );
      const softVegetables = mainVegetables.filter(v =>
        !['にんじん', 'じゃがいも', 'ごぼう', 'れんこん', 'かぼちゃ'].includes(v)
      );

      steps.push({
        id: `s${order}`,
        order: order++,
        phase: 'cook',
        title: '野菜を加えて炒める',
        description: `${mainVegetables.join('、')}を加えて炒め合わせます`,
        details: [
          hardVegetables.length > 0 ? `先に${hardVegetables.join('、')}を加えて2分炒める` : '',
          softVegetables.length > 0 ? `${softVegetables.join('、')}を加えて炒める` : '',
          '全体に油が回るよう混ぜ合わせる',
          '野菜がしんなりしてきたらOK',
        ].filter(Boolean),
        duration_seconds: 120,
        ingredientsUsed: mainVegetables,
      });
    }

    // 味付け
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: '調味料で味付け',
      description: `${seasonings.join('、')}を加えて味付けします`,
      details: [
        `${seasonings.join('、')}を加える`,
        '全体によく絡めるように混ぜる',
        '水分が多い場合は少し煮詰める',
      ],
      duration_seconds: 60,
      ingredientsUsed: seasonings,
      tips: '味見をして、足りなければ塩コショウで調整',
    });

  } else if (cookingPattern.name.includes('煮') || cookingPattern.name.includes('あんかけ')) {
    // 煮物系
    const hasGarlic = vegetables.includes('にんにく');
    const hasGinger = vegetables.includes('生姜');

    // 下炒め（必要に応じて）
    if (protein.includes('肉')) {
      steps.push({
        id: `s${order}`,
        order: order++,
        phase: 'cook',
        title: `${protein}を炒める`,
        description: '鍋またはフライパンで表面を軽く焼きます',
        details: [
          '鍋に油を入れて中火で熱する',
          hasGarlic ? 'にんにくを入れて香りを出す' : '',
          hasGinger ? '生姜を入れて香りを出す' : '',
          `${protein}を入れて表面を軽く焼く`,
          '全体の色が変わったらOK',
        ].filter(Boolean),
        duration_seconds: 120,
        ingredientsUsed: [protein, hasGarlic ? 'にんにく' : '', hasGinger ? '生姜' : ''].filter(Boolean),
      });
    }

    // 煮込み
    const mainVegetables = vegetables.filter(v => v !== 'にんにく' && v !== '生姜');
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: '材料を煮込む',
      description: `水と${seasonings.join('、')}を加えて煮込みます`,
      details: [
        mainVegetables.length > 0 ? `${mainVegetables.join('、')}を加える` : '',
        '水（またはだし汁）をひたひたに入れる',
        `${seasonings.join('、')}を加える`,
        '煮立ったらアクを取り、弱火にする',
        '落し蓋をして10〜15分煮込む',
      ].filter(Boolean),
      duration_seconds: 600,
      ingredientsUsed: [...mainVegetables, ...seasonings],
      tips: COOKING_TIPS['煮'][0] || '落し蓋で味が均一に染みる',
    });

    // 煮詰め・とろみ付け
    if (cookingPattern.name.includes('あんかけ')) {
      steps.push({
        id: `s${order}`,
        order: order++,
        phase: 'cook',
        title: 'とろみをつける',
        description: '水溶き片栗粉でとろみをつけます',
        details: [
          '片栗粉大さじ1を水大さじ2で溶く',
          '火を弱め、水溶き片栗粉を少しずつ加える',
          'よくかき混ぜながら好みのとろみに',
        ],
        duration_seconds: 60,
        tips: '一気に入れるとダマになるので注意',
      });
    }

  } else if (cookingPattern.name.includes('蒸し')) {
    // 蒸し物系
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: '蒸し器を準備',
      description: '蒸し器（またはフライパン）に水を入れて沸騰させます',
      details: [
        '蒸し器に水を3cm程度入れる',
        'フライパンの場合は深めのものを使用',
        '強火で沸騰させる',
      ],
      duration_seconds: 180,
      tips: COOKING_TIPS['蒸し'][0] || '水がなくならないよう時々確認',
    });

    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: '材料を蒸す',
      description: `${protein}と野菜を蒸し上げます`,
      details: [
        `耐熱皿に${protein}と${vegetables.filter(v => v !== 'にんにく' && v !== '生姜').join('、')}を並べる`,
        `${seasonings.join('、')}をかける`,
        '蓋をして中火で8〜10分蒸す',
        '火が通ったら火を止める',
      ],
      duration_seconds: 480,
      ingredientsUsed: [protein, ...vegetables, ...seasonings],
      tips: COOKING_TIPS['蒸し'][2] || '竹串がスッと通ればOK',
    });

  } else if (cookingPattern.name.includes('和え')) {
    // 和え物系
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: '材料を茹でる',
      description: `${protein}と野菜をさっと茹でます`,
      details: [
        '鍋にたっぷりの湯を沸かす',
        `${protein}を入れて茹でる`,
        vegetables.filter(v => v !== 'にんにく' && v !== '生姜').length > 0
          ? `${vegetables.filter(v => v !== 'にんにく' && v !== '生姜').join('、')}も茹でる`
          : '',
        '茹で上がったらザルにあげて水気を切る',
      ].filter(Boolean),
      duration_seconds: 300,
      ingredientsUsed: [protein, ...vegetables.filter(v => v !== 'にんにく' && v !== '生姜')],
    });

    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: '調味料で和える',
      description: `${seasonings.join('、')}で和えます`,
      details: [
        'ボウルに茹でた材料を入れる',
        `${seasonings.join('、')}を加える`,
        '全体をよく混ぜ合わせる',
      ],
      duration_seconds: 60,
      ingredientsUsed: seasonings,
      tips: '水気をしっかり切ると味がぼやけない',
    });

  } else if (cookingPattern.name.includes('丼')) {
    // 丼系
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: '具材を炒める',
      description: `${protein}と野菜を炒めます`,
      details: [
        'フライパンに油を入れて中火で熱する',
        `${protein}を入れて炒める`,
        vegetables.filter(v => v !== 'にんにく' && v !== '生姜').length > 0
          ? `${vegetables.filter(v => v !== 'にんにく' && v !== '生姜').join('、')}を加えて炒め合わせる`
          : '',
      ].filter(Boolean),
      duration_seconds: 180,
      ingredientsUsed: [protein, ...vegetables.filter(v => v !== 'にんにく' && v !== '生姜')],
    });

    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: 'タレを加える',
      description: `${seasonings.join('、')}を加えて味付けします`,
      details: [
        `${seasonings.join('、')}を加える`,
        '全体に絡めながら少し煮詰める',
        'タレにとろみがついたらOK',
      ],
      duration_seconds: 90,
      ingredientsUsed: seasonings,
      tips: COOKING_TIPS['丼']?.[1] || 'タレを煮詰めすぎない',
    });

  } else {
    // その他（デフォルト：炒め物風）
    steps.push({
      id: `s${order}`,
      order: order++,
      phase: 'cook',
      title: 'フライパンで調理',
      description: `${protein}と野菜を${cookingPattern.verb}`,
      details: [
        'フライパンに油を入れて中火で熱する',
        `${protein}を入れて炒める`,
        `${vegetables.filter(v => v !== 'にんにく' && v !== '生姜').join('、')}を加える`,
        `${seasonings.join('、')}で味付けする`,
      ],
      duration_seconds: 300,
      ingredientsUsed: [protein, ...vegetables, ...seasonings],
    });
  }

  // ========== 最終STEP: 仕上げ ==========
  const finishTip = FINISH_TIPS[Math.floor(Math.random() * FINISH_TIPS.length)];

  steps.push({
    id: `s${order}`,
    order: order++,
    phase: 'finish',
    title: '盛り付けて完成',
    description: '器に盛り付けて、お好みでトッピングをして完成',
    details: [
      '味見をして、必要なら塩コショウで調整',
      '器に盛り付ける',
      'お好みで白ごま、刻みネギ、一味唐辛子などをトッピング',
    ],
    duration_seconds: 60,
    tips: finishTip,
  });

  return steps;
};

// ========== メインの生成関数 ==========

export const generateRecipes = (count: number): Recipe[] => {
  const recipes: Recipe[] = [];
  const categories: RecipeCategory[] = ['japanese', 'western', 'chinese', 'asian', 'other'];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const patterns = COOKING_PATTERNS[category === 'other' ? 'japanese' : category];
    const pattern = patterns[i % patterns.length];
    const protein = PROTEINS[i % PROTEINS.length];
    const vegetables = getRandomItems(VEGETABLES, 2 + Math.floor(Math.random() * 2));
    const time = TIME_PATTERNS[Math.floor(Math.random() * TIME_PATTERNS.length)];
    const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];

    // 使用する調味料を取得
    const seasonings = getRandomItems(SEASONINGS, 3);
    const seasoningNames = seasonings.map(s => s.name);

    const name = `${protein.name}と${vegetables[0].name}の${pattern.name}`;

    // 栄養情報を生成
    const nutrition = generateNutrition(protein, vegetables, pattern.name);

    // スマートなタグ割り当て
    const tags: string[] = [];

    // 時間・簡単さ系タグ
    if (time <= 10) {
      tags.push(getRandomItem(TAG_PATTERNS.quick));
    } else if (time <= 15) {
      tags.push('時短');
    }
    if (difficulty === 'easy') {
      tags.push(getRandomItem(TAG_PATTERNS.easy));
    }

    // 弁当・作り置き
    if (Math.random() > 0.5) {
      tags.push(getRandomItem(TAG_PATTERNS.bento));
    }

    // ヘルシー・ダイエット系（栄養情報ベース）
    if (nutrition.calories < 300) {
      tags.push(getRandomItem(TAG_PATTERNS.healthy));
    }
    if (nutrition.carbohydrates < 20) {
      tags.push(getRandomItem(TAG_PATTERNS.lowCarb));
    }
    if (nutrition.protein > 25) {
      tags.push(getRandomItem(TAG_PATTERNS.highProtein));
    }

    // ボリューム系
    if (nutrition.calories > 500 || protein.name.includes('豚バラ') || protein.name.includes('牛')) {
      tags.push(getRandomItem(TAG_PATTERNS.hearty));
    }

    // 野菜たっぷり
    if (vegetables.length >= 3) {
      tags.push(getRandomItem(TAG_PATTERNS.veggie));
    }

    // お酒に合う系（料理タイプと食材ベース）
    const isGoodWithAlcohol =
      pattern.name.includes('焼き') ||
      pattern.name.includes('炒め') ||
      protein.name.includes('ベーコン') ||
      protein.name.includes('エビ') ||
      protein.name.includes('イカ') ||
      protein.name.includes('タコ');

    if (isGoodWithAlcohol) {
      // ランダムにお酒の種類を選択
      const alcoholType = Math.random();
      if (alcoholType < 0.25) {
        tags.push(getRandomItem(TAG_PATTERNS.wine));
      } else if (alcoholType < 0.5) {
        tags.push(getRandomItem(TAG_PATTERNS.beer));
      } else if (alcoholType < 0.75 && category === 'japanese') {
        tags.push(getRandomItem(TAG_PATTERNS.sake));
      } else {
        tags.push(getRandomItem(TAG_PATTERNS.alcohol));
      }
    }

    // カテゴリー別タグ
    if (category === 'japanese') {
      tags.push(getRandomItem(TAG_PATTERNS.japanese));
    } else if (category === 'western') {
      tags.push(getRandomItem(TAG_PATTERNS.western));
    } else if (category === 'chinese') {
      tags.push(getRandomItem(TAG_PATTERNS.chinese));
    } else if (category === 'asian') {
      tags.push(getRandomItem(TAG_PATTERNS.asian));
    }

    // シーン別タグ（ランダム）
    const sceneRandom = Math.random();
    if (sceneRandom < 0.3 && time <= 20) {
      tags.push(getRandomItem(TAG_PATTERNS.weeknight));
    } else if (sceneRandom < 0.4) {
      tags.push(getRandomItem(TAG_PATTERNS.weekend));
    } else if (sceneRandom < 0.5 && pattern.name.includes('チーズ') || pattern.name.includes('グラタン')) {
      tags.push(getRandomItem(TAG_PATTERNS.special));
    } else if (sceneRandom < 0.6) {
      tags.push(getRandomItem(TAG_PATTERNS.kids));
    }

    // 季節タグ（ランダム）
    if (Math.random() < 0.2) {
      const seasonRandom = Math.random();
      if (seasonRandom < 0.5) {
        tags.push(getRandomItem(TAG_PATTERNS.summer));
      } else {
        tags.push(getRandomItem(TAG_PATTERNS.winter));
      }
    }

    // 定番・人気タグ（一部に付与）
    if (Math.random() < 0.3) {
      tags.push(getRandomItem(TAG_PATTERNS.classic));
    }

    // 節約タグ（安い食材ベース）
    const cheapProteins = ['豆腐', '卵', 'もやし', 'ちくわ', '厚揚げ', '油揚げ', '鶏むね肉', '鶏ひき肉'];
    if (cheapProteins.includes(protein.name) || vegetables.some(v => v.name === 'もやし')) {
      tags.push(getRandomItem(TAG_PATTERNS.budget));
    }

    // ご飯系タグ
    if (pattern.name.includes('丼') || pattern.name.includes('炒め') || Math.random() < 0.2) {
      tags.push(getRandomItem(TAG_PATTERNS.rice));
    }

    // 癒し系タグ
    if (pattern.name.includes('煮') || pattern.name.includes('蒸し') || Math.random() < 0.15) {
      tags.push(getRandomItem(TAG_PATTERNS.comfort));
    }

    const recipe: Recipe = {
      id: `recipe-gen-${i + 1}`,
      name,
      emoji: pattern.emoji,
      description: `${protein.name}と${vegetables.map(v => v.name).join('、')}を使った${pattern.name}。フライパンひとつで作れる簡単レシピです。${nutrition.calories}kcal、タンパク質${nutrition.protein}g。`,
      cooking_time_minutes: time,
      difficulty,
      category,
      servings: 1 + Math.floor(Math.random() * 2),
      is_bento_friendly: Math.random() > 0.4,
      pans_required: 1, // ワンパン・バディのコンセプト：全てフライパン1つで完結
      ingredients: generateIngredients(protein, vegetables),
      steps: generateSteps(pattern, protein.name, vegetables.map(v => v.name), seasoningNames),
      tags: [...new Set(tags)], // 重複を削除
      nutrition,
      created_at: new Date().toISOString(),
    };

    recipes.push(recipe);
  }

  return recipes;
};

// 50000個のレシピを生成してエクスポート
export const GENERATED_RECIPES: Recipe[] = generateRecipes(50000);
