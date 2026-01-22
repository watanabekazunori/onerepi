// ============================================
// Onerepi - AI Recipe Generation Screen
// Generate recipes from available ingredients
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  Plus,
  X,
  Sparkles,
  Clock,
  ChefHat,
  Flame,
  Info,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { supabaseService, AIGeneratedRecipe, UserProfile } from '../lib/supabase-service';

// Brand Colors
const brandColors = {
  primary: '#D4490F',
  primaryLight: '#E8601F',
  primarySoft: '#FFF0E8',
  cream: '#FFF8E7',
  warmBrown: '#8B7355',
  text: '#2D1810',
  textSecondary: '#5D4037',
  textMuted: '#A1887F',
  white: '#FFFFFF',
  border: '#F0E6DE',
  surface: '#FAFAFA',
  success: '#4CAF50',
};

type AIRecipeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AIRecipe'>;
};

// Common ingredients for quick add
const SUGGESTED_INGREDIENTS = [
  { emoji: '🥚', name: '卵' },
  { emoji: '🍖', name: '豚肉' },
  { emoji: '🍗', name: '鶏肉' },
  { emoji: '🥬', name: 'キャベツ' },
  { emoji: '🧅', name: '玉ねぎ' },
  { emoji: '🥕', name: 'にんじん' },
  { emoji: '🍅', name: 'トマト' },
  { emoji: '🥔', name: 'じゃがいも' },
  { emoji: '🍚', name: 'ごはん' },
  { emoji: '🍜', name: '麺' },
  { emoji: '🧀', name: 'チーズ' },
  { emoji: '🥓', name: 'ベーコン' },
];

// Seasoning ID to label mapping
const SEASONING_LABELS: Record<string, string> = {
  salt: '塩',
  pepper: 'こしょう',
  soy_sauce: '醤油',
  miso: '味噌',
  mirin: 'みりん',
  sake: '料理酒',
  sugar: '砂糖',
  vinegar: '酢',
  oil: 'サラダ油',
  sesame_oil: 'ごま油',
  olive_oil: 'オリーブオイル',
  butter: 'バター',
  mayonnaise: 'マヨネーズ',
  ketchup: 'ケチャップ',
  worcester: 'ウスターソース',
  oyster_sauce: 'オイスターソース',
  dashi: 'だしの素',
  consomme: 'コンソメ',
  chicken_stock: '鶏がらスープの素',
  garlic: 'にんにく',
  ginger: '生姜',
  chili: '唐辛子',
};

export const AIRecipeScreen: React.FC<AIRecipeScreenProps> = ({ navigation }) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<AIGeneratedRecipe | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSeasonings, setUserSeasonings] = useState<string[]>([]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load user profile and seasonings on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await supabaseService.getUserProfile();
      setUserProfile(profile);
      if (profile?.seasonings) {
        // Convert seasoning IDs to labels
        const seasoningLabels = profile.seasonings
          .map((id) => SEASONING_LABELS[id])
          .filter(Boolean);
        setUserSeasonings(seasoningLabels);
      }
    };
    loadProfile();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const addIngredient = (name: string) => {
    if (name.trim() && !ingredients.includes(name.trim())) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIngredients([...ingredients, name.trim()]);
      setInputValue('');
    }
  };

  const removeIngredient = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients(ingredients.filter((i) => i !== name));
  };

  const generateRecipe = async () => {
    if (ingredients.length < 1) {
      Alert.alert('食材を追加', '1つ以上の食材を追加してください');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    startPulseAnimation();

    try {
      // Get user profile for personalization
      const profile = userProfile || await supabaseService.getUserProfile();

      // User's available seasonings
      const availableSeasonings = userSeasonings.length > 0
        ? userSeasonings
        : ['塩', 'こしょう', 'サラダ油']; // Default basic seasonings

      // TODO: Call actual AI API (OpenAI, Claude, etc.)
      // For now, generate a mock recipe using user's seasonings
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Determine which seasonings to use based on what user has
      const usedSeasonings: { name: string; amount: string; unit: string }[] = [];

      // Always use oil if available
      if (availableSeasonings.includes('サラダ油')) {
        usedSeasonings.push({ name: 'サラダ油', amount: '大さじ1', unit: '' });
      } else if (availableSeasonings.includes('オリーブオイル')) {
        usedSeasonings.push({ name: 'オリーブオイル', amount: '大さじ1', unit: '' });
      } else if (availableSeasonings.includes('ごま油')) {
        usedSeasonings.push({ name: 'ごま油', amount: '大さじ1', unit: '' });
      }

      // Add flavor seasonings based on availability
      if (availableSeasonings.includes('醤油')) {
        usedSeasonings.push({ name: '醤油', amount: '大さじ1', unit: '' });
      }
      if (availableSeasonings.includes('塩')) {
        usedSeasonings.push({ name: '塩', amount: '少々', unit: '' });
      }
      if (availableSeasonings.includes('こしょう')) {
        usedSeasonings.push({ name: 'こしょう', amount: '少々', unit: '' });
      }
      if (availableSeasonings.includes('にんにく')) {
        usedSeasonings.push({ name: 'にんにく', amount: '1かけ', unit: '' });
      }

      // Build step instructions using available seasonings
      const seasoningNames = usedSeasonings.map(s => s.name).join('、');
      const hasJapaneseSeasoning = availableSeasonings.some(s =>
        ['醤油', '味噌', 'みりん', '料理酒', 'だしの素'].includes(s)
      );
      const hasWesternSeasoning = availableSeasonings.some(s =>
        ['オリーブオイル', 'バター', 'コンソメ', 'ケチャップ'].includes(s)
      );

      // Determine recipe style based on available seasonings
      let recipeStyle = '炒め';
      let recipeSuffix = '';
      if (hasJapaneseSeasoning) {
        recipeSuffix = '和風';
      } else if (hasWesternSeasoning) {
        recipeSuffix = '洋風';
      }

      const mockRecipe: AIGeneratedRecipe = {
        input_ingredients: ingredients,
        generated_recipe: {
          name: `${ingredients[0]}${ingredients.length > 1 ? `と${ingredients[1]}` : ''}の${recipeSuffix}${recipeStyle}`,
          emoji: '🍳',
          description: `${ingredients.join('、')}を使った簡単で美味しいワンパン料理です。お持ちの調味料（${availableSeasonings.slice(0, 5).join('、')}${availableSeasonings.length > 5 ? '等' : ''}）で作れます。${profile?.cooking_skill === 'beginner' ? '初心者でも失敗しにくいレシピです。' : ''}`,
          ingredients: [
            // Main ingredients
            ...ingredients.map((ing) => ({
              name: ing,
              amount: '適量',
              unit: '',
            })),
            // Seasonings (from user's available list)
            ...usedSeasonings,
          ],
          steps: [
            {
              step: 1,
              instruction: `フライパンに${usedSeasonings[0]?.name || '油'}を熱します。`,
              time: 1,
              tip: availableSeasonings.includes('にんにく') ? 'にんにくを先に入れると香りが立ちます' : undefined,
            },
            {
              step: 2,
              instruction: `${ingredients.join('、')}を加えて中火で炒めます。`,
              time: 3,
              tip: '材料に火が通るまでしっかり炒めましょう',
            },
            {
              step: 3,
              instruction: `${seasoningNames || '塩こしょう'}で味を調えます。`,
              time: 1,
            },
            {
              step: 4,
              instruction: 'お皿に盛り付けて完成です。',
              time: 1,
            },
          ],
          cooking_time: profile?.cooking_time_preference === '10' ? 10 : profile?.cooking_time_preference === '30' ? 20 : 15,
          difficulty: profile?.cooking_skill === 'beginner' ? 'easy' : 'medium',
          nutrition: {
            calories: 250,
            protein: 15,
            fat: 12,
            carbs: 20,
          },
        },
        was_cooked: false,
      };

      // Save to storage
      const savedRecipe = await supabaseService.saveAIRecipe(mockRecipe);
      setGeneratedRecipe(savedRecipe);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error generating recipe:', error);
      Alert.alert('エラー', 'レシピの生成に失敗しました');
    } finally {
      setIsGenerating(false);
      pulseAnim.setValue(1);
    }
  };

  const startCooking = () => {
    if (generatedRecipe) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Navigate to cooking feedback after "cooking"
      // In a real app, this would navigate to the cooking screen first
      Alert.alert(
        '調理開始',
        `「${generatedRecipe.generated_recipe.name}」の調理を開始します！`,
        [
          {
            text: '調理完了',
            onPress: () => {
              // Navigate to feedback screen
              navigation.navigate('CookingFeedback', {
                recipeId: `ai-${Date.now()}`,
                recipeName: generatedRecipe.generated_recipe.name,
                recipeEmoji: generatedRecipe.generated_recipe.emoji,
              });
            },
          },
          { text: 'キャンセル', style: 'cancel' },
        ]
      );
    }
  };

  const resetRecipe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGeneratedRecipe(null);
    setIngredients([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.white} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={brandColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AIレシピ</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!generatedRecipe ? (
            <>
              {/* Intro */}
              <View style={styles.introContainer}>
                <View style={styles.sparkleIcon}>
                  <Sparkles size={32} color={brandColors.primary} />
                </View>
                <Text style={styles.introTitle}>
                  冷蔵庫の食材から{'\n'}レシピを作成
                </Text>
                <Text style={styles.introSubtitle}>
                  持っている食材を追加して、AIにレシピを提案してもらいましょう
                </Text>
              </View>

              {/* Input */}
              <View style={styles.inputSection}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="食材を入力..."
                    placeholderTextColor={brandColors.textMuted}
                    value={inputValue}
                    onChangeText={setInputValue}
                    onSubmitEditing={() => addIngredient(inputValue)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      !inputValue.trim() && styles.addButtonDisabled,
                    ]}
                    onPress={() => addIngredient(inputValue)}
                    disabled={!inputValue.trim()}
                  >
                    <Plus size={20} color={brandColors.white} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Suggested Ingredients */}
              <View style={styles.suggestedSection}>
                <Text style={styles.sectionTitle}>よく使う食材</Text>
                <View style={styles.suggestedGrid}>
                  {SUGGESTED_INGREDIENTS.map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.suggestedChip,
                        ingredients.includes(item.name) && styles.suggestedChipSelected,
                      ]}
                      onPress={() =>
                        ingredients.includes(item.name)
                          ? removeIngredient(item.name)
                          : addIngredient(item.name)
                      }
                    >
                      <Text style={styles.suggestedEmoji}>{item.emoji}</Text>
                      <Text
                        style={[
                          styles.suggestedLabel,
                          ingredients.includes(item.name) && styles.suggestedLabelSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Selected Ingredients */}
              {ingredients.length > 0 && (
                <View style={styles.selectedSection}>
                  <Text style={styles.sectionTitle}>
                    選択した食材（{ingredients.length}）
                  </Text>
                  <View style={styles.selectedList}>
                    {ingredients.map((ing) => (
                      <View key={ing} style={styles.selectedChip}>
                        <Text style={styles.selectedLabel}>{ing}</Text>
                        <TouchableOpacity
                          onPress={() => removeIngredient(ing)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <X size={16} color={brandColors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* User's Available Seasonings */}
              <View style={styles.seasoningsSection}>
                <View style={styles.seasoningsTitleRow}>
                  <Info size={16} color={brandColors.primary} />
                  <Text style={styles.seasoningsSectionTitle}>
                    使用する調味料
                  </Text>
                </View>
                {userSeasonings.length > 0 ? (
                  <>
                    <Text style={styles.seasoningsSubtitle}>
                      初期設定で選んだ調味料でレシピを作成します
                    </Text>
                    <View style={styles.seasoningsList}>
                      {userSeasonings.slice(0, 8).map((seasoning) => (
                        <View key={seasoning} style={styles.seasoningTag}>
                          <Text style={styles.seasoningTagText}>{seasoning}</Text>
                        </View>
                      ))}
                      {userSeasonings.length > 8 && (
                        <View style={styles.seasoningTag}>
                          <Text style={styles.seasoningTagText}>
                            +{userSeasonings.length - 8}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <Text style={styles.seasoningsSubtitle}>
                    基本の調味料（塩、こしょう、油）でレシピを作成します
                  </Text>
                )}
              </View>
            </>
          ) : (
            // Generated Recipe Display
            <View style={styles.recipeContainer}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeEmoji}>
                  {generatedRecipe.generated_recipe.emoji}
                </Text>
                <Text style={styles.recipeName}>
                  {generatedRecipe.generated_recipe.name}
                </Text>
                <Text style={styles.recipeDescription}>
                  {generatedRecipe.generated_recipe.description}
                </Text>
              </View>

              {/* Recipe Meta */}
              <View style={styles.recipeMeta}>
                <View style={styles.metaItem}>
                  <Clock size={18} color={brandColors.primary} />
                  <Text style={styles.metaText}>
                    {generatedRecipe.generated_recipe.cooking_time}分
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <ChefHat size={18} color={brandColors.primary} />
                  <Text style={styles.metaText}>
                    {generatedRecipe.generated_recipe.difficulty === 'easy'
                      ? '簡単'
                      : generatedRecipe.generated_recipe.difficulty === 'medium'
                      ? 'ふつう'
                      : '上級'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Flame size={18} color={brandColors.primary} />
                  <Text style={styles.metaText}>
                    {generatedRecipe.generated_recipe.nutrition?.calories}kcal
                  </Text>
                </View>
              </View>

              {/* Ingredients */}
              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionTitle}>材料</Text>
                {generatedRecipe.generated_recipe.ingredients.map((ing, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                    <Text style={styles.ingredientAmount}>
                      {ing.amount}
                      {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Steps */}
              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionTitle}>作り方</Text>
                {generatedRecipe.generated_recipe.steps.map((step) => (
                  <View key={step.step} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.step}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      {step.tip && (
                        <Text style={styles.stepTip}>💡 {step.tip}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.recipeActions}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetRecipe}
                >
                  <Text style={styles.resetButtonText}>別のレシピを作る</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        {!generatedRecipe ? (
          <View style={styles.bottomContainer}>
            <Animated.View style={{ transform: [{ scale: isGenerating ? pulseAnim : 1 }] }}>
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  ingredients.length < 1 && styles.generateButtonDisabled,
                ]}
                onPress={generateRecipe}
                disabled={ingredients.length < 1 || isGenerating}
                activeOpacity={0.9}
              >
                {isGenerating ? (
                  <ActivityIndicator color={brandColors.white} />
                ) : (
                  <>
                    <Sparkles size={20} color={brandColors.white} />
                    <Text style={styles.generateButtonText}>レシピを作成</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
            {ingredients.length < 1 && (
              <Text style={styles.helperText}>
                食材を追加してください
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.cookButton}
              onPress={startCooking}
              activeOpacity={0.9}
            >
              <Text style={styles.cookButtonText}>このレシピで作る</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  introContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: brandColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.text,
    textAlign: 'center',
    lineHeight: 34,
  },
  introSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  inputSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: brandColors.text,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: brandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: brandColors.border,
  },
  suggestedSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.textSecondary,
    marginBottom: 12,
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  suggestedChipSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  suggestedEmoji: {
    fontSize: 16,
  },
  suggestedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
  suggestedLabelSelected: {
    color: brandColors.primary,
  },
  selectedSection: {
    paddingHorizontal: 24,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 8,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.white,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: brandColors.white,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    backgroundColor: brandColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.white,
  },
  helperText: {
    fontSize: 13,
    fontWeight: '400',
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  recipeContainer: {
    padding: 24,
  },
  recipeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recipeEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.text,
    textAlign: 'center',
  },
  recipeDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.text,
  },
  recipeSection: {
    marginBottom: 24,
  },
  recipeSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.text,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '500',
    color: brandColors.text,
  },
  ingredientAmount: {
    fontSize: 15,
    fontWeight: '400',
    color: brandColors.textSecondary,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: brandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 15,
    fontWeight: '400',
    color: brandColors.text,
    lineHeight: 22,
  },
  stepTip: {
    fontSize: 13,
    fontWeight: '400',
    color: brandColors.primary,
    marginTop: 6,
    backgroundColor: brandColors.primarySoft,
    padding: 8,
    borderRadius: 8,
  },
  recipeActions: {
    marginTop: 16,
  },
  resetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: brandColors.textMuted,
  },
  cookButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.white,
  },
  // Seasonings section styles
  seasoningsSection: {
    marginTop: 24,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: brandColors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  seasoningsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  seasoningsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.primary,
  },
  seasoningsSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: brandColors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  seasoningsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seasoningTag: {
    backgroundColor: brandColors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  seasoningTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
});
