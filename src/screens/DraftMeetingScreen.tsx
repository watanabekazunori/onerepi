// ============================================
// ワンパン・バディ - Draft Meeting Screen
// LINE風チャットUIで週間献立を決める
// 食材使い回しを考慮した献立提案
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { X, Clock, ChevronRight, Check, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  RootStackParamList,
  ChatMessage,
  ChatOption,
  Recipe,
  DayOfWeek,
} from '../types';
import {
  MOCK_RECIPES,
  getRecipesByCategory,
  getRecipesByTag,
  findRecipesWithSharedIngredients,
} from '../lib/mockData';
import { ChatBubble } from '../components/chat/ChatBubble';
import { saveWeeklyPlan, StoredWeeklyPlan, getUserPreferences, UserPreferences } from '../lib/storage';
import { colors, spacing, borderRadius } from '../lib/theme';
import { suggestSideDishes, SideDishSuggestion } from '../lib/sideDishSuggester';

type DraftMeetingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DraftMeeting'>;
  route: RouteProp<RootStackParamList, 'DraftMeeting'>;
};

// Draft meeting conversation flow
type DraftStep =
  | 'welcome'
  | 'cuisine_preference'  // 系統の好み
  | 'cooking_style'       // 調理スタイル
  | 'weekly_theme'        // 週間テーマ
  | 'side_dish_option'    // 副菜も提案するか
  | 'generating'          // 生成中
  | 'weekly_plan_preview' // 1週間分プレビュー
  | 'adjusting'           // 調整中
  | 'complete';

// 曜日ラベル
const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: '月曜',
  tue: '火曜',
  wed: '水曜',
  thu: '木曜',
  fri: '金曜',
  sat: '土曜',
  sun: '日曜',
};

const DAYS_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

interface WeeklyPlanDraft {
  [key: string]: Recipe | null;
}

interface SideDishPlan {
  [key: string]: SideDishSuggestion | null;
}

export const DraftMeetingScreen: React.FC<DraftMeetingScreenProps> = ({
  navigation,
  route,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<DraftStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);

  // ユーザーの好み
  const [cuisinePreference, setCuisinePreference] = useState<string>('any');
  const [cookingStyle, setCookingStyle] = useState<string>('balanced');
  const [weeklyTheme, setWeeklyTheme] = useState<string>('variety');
  const [includeSideDish, setIncludeSideDish] = useState<boolean>(false);

  // 1週間分の献立
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanDraft>({});
  const [sideDishPlan, setSideDishPlan] = useState<SideDishPlan>({});
  const [sharedIngredients, setSharedIngredients] = useState<string[]>([]);

  // ユーザー設定（苦手食材・アレルギー）
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

  // Initialize welcome messages and load user preferences
  useEffect(() => {
    loadUserPreferences();
    showWelcomeMessages();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // ユーザー設定を読み込み
  const loadUserPreferences = async () => {
    const prefs = await getUserPreferences();
    setUserPrefs(prefs);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setIsTyping(true);
    await delay(600 + Math.random() * 400);
    setIsTyping(false);

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      ...message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    await delay(200);
  };

  const addUserMessage = (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  const showWelcomeMessages = async () => {
    await addMessage({
      type: 'ai',
      content: '1週間の献立を一緒に考えよう！ 🗓️',
    });

    await addMessage({
      type: 'ai',
      content: 'まず、今週はどんな系統の料理が食べたい気分？',
      options: [
        { id: 'cuisine_japanese', label: '和食多め', value: 'japanese', emoji: '🍙' },
        { id: 'cuisine_western', label: '洋食多め', value: 'western', emoji: '🍝' },
        { id: 'cuisine_asian', label: 'アジアン多め', value: 'asian', emoji: '🍜' },
        { id: 'cuisine_mix', label: 'バランスよく', value: 'any', emoji: '🎲' },
      ],
    });

    setCurrentStep('cuisine_preference');
  };

  const showCookingStyleQuestion = async () => {
    await addMessage({
      type: 'ai',
      content: 'いいね！調理スタイルはどうする？',
      options: [
        { id: 'style_quick', label: '時短重視', value: 'quick', emoji: '⚡' },
        { id: 'style_healthy', label: 'ヘルシー重視', value: 'healthy', emoji: '🥗' },
        { id: 'style_hearty', label: 'がっつり系', value: 'hearty', emoji: '🍖' },
        { id: 'style_balanced', label: 'バランス型', value: 'balanced', emoji: '⚖️' },
      ],
    });

    setCurrentStep('cooking_style');
  };

  const showWeeklyThemeQuestion = async () => {
    await addMessage({
      type: 'ai',
      content: '了解！週間のテーマを選んでね。\n（※ どれを選んでも食材の使い回しを考慮して献立を作るよ！）',
      options: [
        { id: 'theme_variety', label: '毎日違う味', value: 'variety', emoji: '🌈' },
        { id: 'theme_quick', label: '時短重視', value: 'quick', emoji: '⚡' },
        { id: 'theme_healthy', label: 'ヘルシー志向', value: 'healthy', emoji: '🥗' },
        { id: 'theme_simple', label: 'シンプル献立', value: 'simple', emoji: '✨' },
      ],
    });

    setCurrentStep('weekly_theme');
  };

  const showSideDishQuestion = async () => {
    await addMessage({
      type: 'ai',
      content: 'もう一品（副菜）も一緒に提案する？🥗',
      options: [
        { id: 'side_yes', label: '副菜も欲しい', value: 'yes', emoji: '🍽️' },
        { id: 'side_no', label: '主菜だけでOK', value: 'no', emoji: '👍' },
      ],
    });

    setCurrentStep('side_dish_option');
  };

  const generateWeeklyPlan = async () => {
    const messageText = includeSideDish
      ? 'ちょっと待ってね...主菜と副菜を考えています 🤔'
      : 'ちょっと待ってね...1週間分の献立を考えています 🤔';

    await addMessage({
      type: 'ai',
      content: messageText,
    });

    setCurrentStep('generating');
    await delay(1500);

    // 献立生成ロジック
    const plan = createWeeklyPlan();
    setWeeklyPlan(plan.recipes);
    setSharedIngredients(plan.sharedIngredients);

    // 副菜も生成
    if (includeSideDish) {
      const sideDishes: SideDishPlan = {};
      DAYS_ORDER.forEach((day) => {
        const mainRecipe = plan.recipes[day];
        if (mainRecipe) {
          const suggestions = suggestSideDishes(mainRecipe, 1);
          sideDishes[day] = suggestions[0] || null;
        }
      });
      setSideDishPlan(sideDishes);
    }

    const completeMessage = includeSideDish
      ? '主菜と副菜、1週間分の献立ができたよ！ 🎉'
      : '1週間分の献立ができたよ！ 🎉';

    await addMessage({
      type: 'ai',
      content: completeMessage,
    });

    // 食材使い回しの説明
    if (plan.sharedIngredients.length > 0) {
      await addMessage({
        type: 'ai',
        content: `💡 ポイント：${plan.sharedIngredients.slice(0, 3).join('、')}などを複数のレシピで使い回すから、食材が無駄にならないよ！`,
      });
    }

    // 副菜の説明
    if (includeSideDish) {
      await addMessage({
        type: 'ai',
        content: '🥗 副菜は主菜との相性を考えて選んだよ！材料や味付けが被らないようにしてるから、バランスよく食べられるよ♪',
      });
    }

    // 1週間分のプレビューを表示
    setCurrentStep('weekly_plan_preview');
  };

  const createWeeklyPlan = (): { recipes: WeeklyPlanDraft; sharedIngredients: string[] } => {
    const plan: WeeklyPlanDraft = {};
    const usedRecipeIds = new Set<string>();
    const ingredientCount: Record<string, number> = {};

    // フィルタリング用のタグ
    const getStyleTags = (): string[] => {
      switch (cookingStyle) {
        case 'quick': return ['スピード', '時短'];
        case 'healthy': return ['ヘルシー', '低カロリー'];
        case 'hearty': return ['がっつり', 'ボリューム'];
        default: return [];
      }
    };

    // カテゴリフィルター
    const getCategoryFilter = (): string | null => {
      if (cuisinePreference === 'any') return null;
      return cuisinePreference;
    };

    // レシピプールを作成
    let recipePool = [...MOCK_RECIPES];

    // 【重要】苦手食材・アレルギーを除外
    if (userPrefs) {
      const dislikedKeywords = userPrefs.dislikes || [];
      const allergyKeywords = userPrefs.allergies || [];
      const excludeKeywords = [...dislikedKeywords, ...allergyKeywords];

      if (excludeKeywords.length > 0) {
        recipePool = recipePool.filter(recipe => {
          // レシピの食材をチェック
          const hasExcludedIngredient = recipe.ingredients.some(ing => {
            const ingName = ing.name.toLowerCase();
            return excludeKeywords.some(keyword => {
              const kw = keyword.toLowerCase();
              // カテゴリチェック
              if (kw === 'seafood' || kw === '魚介類') {
                return ing.category === 'protein' && (
                  ingName.includes('魚') || ingName.includes('えび') ||
                  ingName.includes('いか') || ingName.includes('貝') ||
                  ingName.includes('鮭') || ingName.includes('さば') ||
                  ingName.includes('鯖') || ingName.includes('たこ') ||
                  ingName.includes('シーフード')
                );
              }
              if (kw === 'meat' || kw === '肉類') {
                return ing.category === 'protein' && (
                  ingName.includes('肉') || ingName.includes('ベーコン') ||
                  ingName.includes('ハム') || ingName.includes('ソーセージ')
                );
              }
              if (kw === 'veggie' || kw === '野菜系') {
                return ing.category === 'vegetable';
              }
              if (kw === 'egg' || kw === '卵') {
                return ingName.includes('卵') || ingName.includes('たまご');
              }
              if (kw === 'milk' || kw === '乳製品') {
                return ingName.includes('牛乳') || ingName.includes('チーズ') ||
                       ingName.includes('生クリーム') || ingName.includes('ヨーグルト');
              }
              if (kw === 'wheat' || kw === '小麦') {
                return ingName.includes('小麦') || ingName.includes('パン粉') ||
                       ingName.includes('うどん') || ingName.includes('パスタ');
              }
              // 具体的な食材名のマッチング
              return ingName.includes(kw);
            });
          });
          return !hasExcludedIngredient;
        });
      }
    }

    // カテゴリでフィルター
    const categoryFilter = getCategoryFilter();
    if (categoryFilter) {
      const filtered = getRecipesByCategory(categoryFilter);
      // 最低3つは確保、残りはランダムで他のカテゴリから
      if (filtered.length >= 3) {
        recipePool = [...filtered, ...MOCK_RECIPES.filter(r => r.category !== categoryFilter).slice(0, 4)];
      }
    }

    // スタイルタグでソート（マッチするものを優先）
    const styleTags = getStyleTags();
    if (styleTags.length > 0) {
      recipePool.sort((a, b) => {
        const aMatch = a.tags.some(t => styleTags.includes(t)) ? 1 : 0;
        const bMatch = b.tags.some(t => styleTags.includes(t)) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    // 週間テーマによる追加フィルタリング
    if (weeklyTheme === 'quick') {
      // 時短重視：調理時間が短いものを優先
      recipePool.sort((a, b) => a.cooking_time_minutes - b.cooking_time_minutes);
    } else if (weeklyTheme === 'healthy') {
      // ヘルシー志向：ヘルシータグがあるものを優先
      recipePool.sort((a, b) => {
        const aHealthy = a.tags.some(t => t.includes('ヘルシー') || t.includes('野菜')) ? 1 : 0;
        const bHealthy = b.tags.some(t => t.includes('ヘルシー') || t.includes('野菜')) ? 1 : 0;
        return bHealthy - aHealthy;
      });
    }

    // 【重要】全ての献立で食材使い回しを基本とする
    // 共通食材を多く持つレシピをグループ化
    const ingredientGroups: Record<string, Recipe[]> = {};

    recipePool.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        if (ing.category === 'protein' || ing.category === 'vegetable') {
          if (!ingredientGroups[ing.name]) {
            ingredientGroups[ing.name] = [];
          }
          ingredientGroups[ing.name].push(recipe);
        }
      });
    });

    // 2つ以上のレシピで使える食材を見つける
    const reusableIngredients = Object.entries(ingredientGroups)
      .filter(([_, recipes]) => recipes.length >= 2)
      .sort((a, b) => b[1].length - a[1].length);

    // 使い回し食材を記録（後でUI表示に使用）
    const sharedIngs = reusableIngredients.slice(0, 5).map(([name]) => name);

    // 使い回し可能なレシピを優先的に選択
    const priorityRecipes: Recipe[] = [];
    reusableIngredients.slice(0, 3).forEach(([_, recipes]) => {
      recipes.forEach(r => {
        if (!priorityRecipes.some(pr => pr.id === r.id)) {
          priorityRecipes.push(r);
        }
      });
    });

    // レシピプールを再構成（使い回しレシピを前に）
    recipePool = [
      ...priorityRecipes,
      ...recipePool.filter(r => !priorityRecipes.some(pr => pr.id === r.id)),
    ];

    // 各曜日にレシピを割り当て
    DAYS_ORDER.forEach((day) => {
      const availableRecipes = recipePool.filter(r => !usedRecipeIds.has(r.id));

      if (availableRecipes.length > 0) {
        // ランダム性を少し加える
        const index = Math.floor(Math.random() * Math.min(3, availableRecipes.length));
        const recipe = availableRecipes[index];
        plan[day] = recipe;
        usedRecipeIds.add(recipe.id);

        // 食材カウント
        recipe.ingredients.forEach(ing => {
          ingredientCount[ing.name] = (ingredientCount[ing.name] || 0) + 1;
        });
      } else {
        // 足りない場合はリセットして再利用
        const index = Math.floor(Math.random() * recipePool.length);
        plan[day] = recipePool[index];
      }
    });

    // 複数回使われる食材を抽出
    const sharedIngredients = Object.entries(ingredientCount)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return { recipes: plan, sharedIngredients };
  };

  // 週間献立をストレージに保存
  const saveWeeklyPlanToStorage = async () => {
    const weekStart = route.params?.weekStart || getThisWeekMonday();

    const storedPlan: StoredWeeklyPlan = {
      id: `plan-${Date.now()}`,
      weekStart,
      plans: {},
      sharedIngredients,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 各曜日のレシピを格納
    DAYS_ORDER.forEach((day) => {
      const recipe = weeklyPlan[day];
      if (recipe) {
        storedPlan.plans[day] = {
          recipeId: recipe.id,
          recipe,
          scaleFactor: 1.0,
          isForBento: false,
        };
      }
    });

    await saveWeeklyPlan(storedPlan);
  };

  // 今週の月曜日を取得
  const getThisWeekMonday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return monday.toISOString().split('T')[0];
  };

  const handleOptionSelect = async (option: ChatOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addUserMessage(`${option.emoji || ''} ${option.label}`.trim());

    await delay(300);

    switch (currentStep) {
      case 'cuisine_preference':
        setCuisinePreference(option.value);
        await showCookingStyleQuestion();
        break;

      case 'cooking_style':
        setCookingStyle(option.value);
        await showWeeklyThemeQuestion();
        break;

      case 'weekly_theme':
        setWeeklyTheme(option.value);
        await showSideDishQuestion();
        break;

      case 'side_dish_option':
        setIncludeSideDish(option.value === 'yes');
        await generateWeeklyPlan();
        break;

      case 'weekly_plan_preview':
        if (option.value === 'confirm') {
          // 献立を確定・保存
          try {
            await saveWeeklyPlanToStorage();
            await addMessage({
              type: 'ai',
              content: '1週間分の献立を保存しました！買い物リストも自動で作成したよ。',
            });
            await addMessage({
              type: 'ai',
              content: 'トップページで確認してね！ 🎉',
            });
          } catch (error) {
            console.error('Failed to save weekly plan:', error);
            await addMessage({
              type: 'ai',
              content: '保存に失敗しました...もう一度試してね。',
            });
            return;
          }
          setCurrentStep('complete');
          await delay(1500);
          navigation.goBack();
        } else if (option.value === 'regenerate') {
          // 再生成
          await generateWeeklyPlan();
        } else if (option.value === 'adjust') {
          // 個別調整モード
          await addMessage({
            type: 'ai',
            content: '変更したい曜日のレシピをタップしてね！',
          });
          setCurrentStep('adjusting');
        }
        break;

      case 'adjusting':
        if (option.value === 'done_adjusting') {
          setCurrentStep('weekly_plan_preview');
        }
        break;
    }
  };

  const handleRecipeSelect = async (recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // レシピ詳細を見せる（将来の実装）
  };

  const handleDayRecipeChange = async (day: DayOfWeek) => {
    if (currentStep !== 'adjusting') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 同じカテゴリの別レシピを提案
    const currentRecipe = weeklyPlan[day];
    if (!currentRecipe) return;

    const alternatives = MOCK_RECIPES
      .filter(r => r.id !== currentRecipe.id)
      .filter(r => {
        // 使い回し食材を共有するレシピを優先
        if (sharedIngredients.length > 0) {
          return r.ingredients.some(ing => sharedIngredients.includes(ing.name));
        }
        return true;
      })
      .slice(0, 5);

    // ランダムに選択
    const newRecipe = alternatives[Math.floor(Math.random() * alternatives.length)];

    if (newRecipe) {
      setWeeklyPlan(prev => ({
        ...prev,
        [day]: newRecipe,
      }));

      addUserMessage(`${DAY_LABELS[day]}を変更`);
      await addMessage({
        type: 'ai',
        content: `${DAY_LABELS[day]}を「${newRecipe.emoji} ${newRecipe.name}」に変更したよ！`,
      });
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatBubble
      message={item}
      onOptionSelect={handleOptionSelect}
      onRecipeSelect={handleRecipeSelect}
    />
  );

  // 1週間の献立プレビュー
  const renderWeeklyPlanPreview = () => {
    if (currentStep !== 'weekly_plan_preview' && currentStep !== 'adjusting') {
      return null;
    }

    return (
      <View style={styles.weeklyPlanContainer}>
        <Text style={styles.weeklyPlanTitle}>
          {includeSideDish ? '📅 今週の献立（主菜＋副菜）' : '📅 今週の献立'}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weeklyPlanScroll}
        >
          {DAYS_ORDER.map((day) => {
            const recipe = weeklyPlan[day];
            const sideDish = sideDishPlan[day];
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCard,
                  includeSideDish && styles.dayCardWithSide,
                  currentStep === 'adjusting' && styles.dayCardEditable,
                ]}
                onPress={() => handleDayRecipeChange(day)}
                disabled={currentStep !== 'adjusting'}
              >
                <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                {recipe ? (
                  <>
                    {/* 主菜 */}
                    <View style={includeSideDish ? styles.mainDishSection : undefined}>
                      {includeSideDish && <Text style={styles.dishTypeLabel}>🍳 主菜</Text>}
                      <Text style={styles.dayEmoji}>{recipe.emoji}</Text>
                      <Text style={styles.dayRecipeName} numberOfLines={2}>
                        {recipe.name}
                      </Text>
                      <View style={styles.dayRecipeMeta}>
                        <Clock size={10} color={colors.textMuted} />
                        <Text style={styles.dayRecipeTime}>{recipe.cooking_time_minutes}分</Text>
                      </View>
                    </View>
                    {/* 副菜（表示する場合） */}
                    {includeSideDish && sideDish && (
                      <View style={styles.sideDishSection}>
                        <Text style={styles.dishTypeLabel}>🥗 副菜</Text>
                        <Text style={styles.sideDishEmoji}>{sideDish.recipe.emoji}</Text>
                        <Text style={styles.sideDishName} numberOfLines={2}>
                          {sideDish.recipe.name}
                        </Text>
                        <Text style={styles.sideDishReason}>{sideDish.reason}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.dayEmpty}>未定</Text>
                )}
                {currentStep === 'adjusting' && (
                  <View style={styles.changeIndicator}>
                    <RefreshCw size={12} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 使い回し食材表示（週を通して使う食材） */}
        {sharedIngredients.length > 0 && (
          <View style={styles.sharedIngredientsContainer}>
            <Text style={styles.sharedIngredientsTitle}>
              ♻️ 今週の使い回し食材（まとめ買いがお得！）
            </Text>
            <View style={styles.sharedIngredientsTags}>
              {sharedIngredients.map((ing, index) => (
                <View key={index} style={styles.ingredientTag}>
                  <Text style={styles.ingredientTagText}>{ing}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sharedIngredientsNote}>
              ↑ これらの食材は複数の献立で使うので無駄なく使えるよ！
            </Text>
          </View>
        )}

        {/* アクションボタン */}
        <View style={styles.actionButtons}>
          {currentStep === 'weekly_plan_preview' ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => handleOptionSelect({ id: 'confirm', label: 'この献立でOK！', value: 'confirm', emoji: '✅' })}
              >
                <Check size={18} color={colors.white} />
                <Text style={styles.actionButtonTextPrimary}>この献立でOK！</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => handleOptionSelect({ id: 'adjust', label: '個別に調整', value: 'adjust', emoji: '✏️' })}
              >
                <Text style={styles.actionButtonTextSecondary}>個別に調整</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonGhost]}
                onPress={() => handleOptionSelect({ id: 'regenerate', label: '全部作り直す', value: 'regenerate', emoji: '🔄' })}
              >
                <RefreshCw size={16} color={colors.textMuted} />
                <Text style={styles.actionButtonTextGhost}>全部作り直す</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => handleOptionSelect({ id: 'done', label: '調整完了', value: 'done_adjusting', emoji: '✅' })}
            >
              <Check size={18} color={colors.white} />
              <Text style={styles.actionButtonTextPrimary}>調整完了</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗓️ 献立ドラフト会議</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderWeeklyPlanPreview}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <ChatBubble
            message={{
              id: 'typing',
              type: 'ai',
              content: '',
              timestamp: new Date(),
              isTyping: true,
            }}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },

  content: {
    flex: 1,
  },
  messageList: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Weekly Plan Preview
  weeklyPlanContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  weeklyPlanScroll: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  dayCard: {
    width: 90,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  dayCardWithSide: {
    width: 110,
    paddingBottom: spacing.md,
  },
  dayCardEditable: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dayEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  dayRecipeName: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    minHeight: 28,
  },
  dayRecipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  dayRecipeTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  dayEmpty: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  changeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primaryLight + '40',
    borderRadius: borderRadius.full,
    padding: 4,
  },

  // 主菜・副菜セクション
  mainDishSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  sideDishSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.xs,
  },
  dishTypeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
  },
  sideDishEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  sideDishName: {
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
    minHeight: 22,
  },
  sideDishReason: {
    fontSize: 8,
    color: colors.primary,
    textAlign: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    overflow: 'hidden',
  },

  // Shared Ingredients（使い回し食材 - 目立つように）
  sharedIngredientsContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#E8F5E9', // 薄い緑背景
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  sharedIngredientsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32', // 濃い緑
    marginBottom: spacing.sm,
  },
  sharedIngredientsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ingredientTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  ingredientTagText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
  },
  sharedIngredientsNote: {
    fontSize: 11,
    color: '#388E3C',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButtons: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtonGhost: {
    backgroundColor: 'transparent',
  },
  actionButtonTextPrimary: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  actionButtonTextSecondary: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  actionButtonTextGhost: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
