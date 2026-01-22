// ============================================
// ワンパン・バディ - Recipe Detail Screen
// レシピ詳細表示（UI改善版）
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Clock,
  ChefHat,
  Users,
  Package,
  Play,
  Plus,
  Heart,
  Calendar,
  Flame,
  Utensils,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ExpoCalendar from 'expo-calendar';
import { RootStackParamList, Recipe, RECIPE_CATEGORY_LABELS } from '../types';
import { MOCK_RECIPES } from '../lib/mockData';
import { isFavorite, toggleFavorite } from '../lib/storage';
import { suggestSideDishes, SideDishSuggestion } from '../lib/sideDishSuggester';
import { NutritionChart, DifficultyBadge, TimeBadge } from '../components/ui';
import {
  newColors,
  newSpacing,
  newBorderRadius,
  newTypography,
  shadows,
  gradients,
} from '../styles/theme';

type RecipeDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RecipeDetail'>;
  route: RouteProp<RootStackParamList, 'RecipeDetail'>;
};

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { recipeId } = route.params;
  const recipe = MOCK_RECIPES.find((r) => r.id === recipeId);
  const [servings, setServings] = useState(recipe?.servings || 1);
  const [isFav, setIsFav] = useState(false);
  const [sideDishSuggestions, setSideDishSuggestions] = useState<SideDishSuggestion[]>([]);

  // 副菜提案を取得
  React.useEffect(() => {
    if (recipe) {
      const suggestions = suggestSideDishes(recipe, 3);
      setSideDishSuggestions(suggestions);
    }
  }, [recipe]);

  // 副菜をタップしたとき
  const handleSideDishPress = (sideDishRecipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.push('RecipeDetail', { recipeId: sideDishRecipe.id });
  };

  // お気に入り状態を読み込み
  useFocusEffect(
    useCallback(() => {
      const loadFavoriteStatus = async () => {
        const favStatus = await isFavorite(recipeId);
        setIsFav(favStatus);
      };
      loadFavoriteStatus();
    }, [recipeId])
  );

  const handleToggleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = await toggleFavorite(recipeId);
    setIsFav(newStatus);
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>レシピが見つかりません</Text>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleServingChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newServings = Math.max(1, Math.min(8, servings + delta));
    setServings(newServings);
  };

  const handleStartCooking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Cooking', { planId: 'temp-plan' });
  };

  const handleAddToPlan = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  // カレンダー登録機能
  const handleAddToCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'カレンダーへのアクセス許可が必要です',
        'アプリ設定からカレンダーへのアクセスを許可してください。'
      );
      return;
    }

    try {
      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
      const defaultCalendar = Platform.OS === 'ios'
        ? calendars.find((cal) => cal.allowsModifications && cal.source?.name === 'iCloud') ||
          calendars.find((cal) => cal.allowsModifications)
        : calendars.find((cal) => cal.isPrimary) ||
          calendars.find((cal) => cal.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert('エラー', 'カレンダーが見つかりませんでした。');
        return;
      }

      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 1);
      eventDate.setHours(18, 0, 0, 0);

      const endDate = new Date(eventDate);
      endDate.setMinutes(endDate.getMinutes() + recipe.cooking_time_minutes);

      const ingredientsList = recipe.ingredients
        .map((ing) => `• ${ing.name}: ${formatAmount(ing.amount, ing.unit)}`)
        .join('\n');

      await ExpoCalendar.createEventAsync(defaultCalendar.id, {
        title: `🍳 ${recipe.name}を作る`,
        notes: `【材料（${servings}人分）】\n${ingredientsList}\n\n調理時間: ${recipe.cooking_time_minutes}分`,
        startDate: eventDate,
        endDate: endDate,
        timeZone: 'Asia/Tokyo',
        alarms: [{ relativeOffset: -60 }],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'カレンダーに登録しました',
        `明日の18:00に「${recipe.name}」の予定を追加しました。`
      );
    } catch (error) {
      console.error('Calendar error:', error);
      Alert.alert('エラー', 'カレンダーへの登録に失敗しました。');
    }
  };

  const multiplier = servings / recipe.servings;

  const formatAmount = (amount: number, unit: string) => {
    const scaledAmount = amount * multiplier;
    if (scaledAmount === Math.floor(scaledAmount)) {
      return `${scaledAmount}${unit}`;
    }
    return `${scaledAmount.toFixed(1)}${unit}`;
  };

  const getPhaseLabel = (phase?: string) => {
    switch (phase) {
      case 'prep':
        return { label: '下準備', color: newColors.info };
      case 'cook':
        return { label: '調理', color: newColors.warning };
      case 'finish':
        return { label: '仕上げ', color: newColors.success };
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={[styles.headerButton, shadows.md]} onPress={handleBack}>
          <ArrowLeft size={24} color={newColors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerButton, shadows.md]} onPress={handleToggleFavorite}>
          <Heart
            size={24}
            color={isFav ? newColors.error : newColors.textMuted}
            fill={isFav ? newColors.error : 'none'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{recipe.emoji}</Text>
          </View>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          {/* Meta Badges */}
          <View style={styles.metaBadges}>
            <TimeBadge minutes={recipe.cooking_time_minutes} size="md" variant="filled" />
            <DifficultyBadge difficulty={recipe.difficulty} size="md" />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {RECIPE_CATEGORY_LABELS[recipe.category]}
              </Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {recipe.is_bento_friendly && (
              <View style={styles.bentoTag}>
                <Package size={12} color={newColors.white} />
                <Text style={styles.bentoTagText}>弁当向き</Text>
              </View>
            )}
            {recipe.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Nutrition Section */}
        {recipe.nutrition && (
          <View style={[styles.section, shadows.sm]}>
            <View style={styles.sectionHeader}>
              <Flame size={20} color={newColors.primary} />
              <Text style={styles.sectionTitle}>栄養情報（1人分）</Text>
            </View>
            <NutritionChart nutrition={recipe.nutrition} />
          </View>
        )}

        {/* Servings Selector */}
        <View style={[styles.servingsSection, shadows.sm]}>
          <View style={styles.servingsHeader}>
            <Users size={20} color={newColors.text} />
            <Text style={styles.servingsLabel}>分量を調整</Text>
          </View>
          <View style={styles.servingsControl}>
            <TouchableOpacity
              style={[styles.servingButton, servings <= 1 && styles.servingButtonDisabled]}
              onPress={() => handleServingChange(-1)}
              disabled={servings <= 1}
            >
              <Text style={[styles.servingButtonText, servings <= 1 && styles.servingButtonTextDisabled]}>−</Text>
            </TouchableOpacity>
            <View style={styles.servingsValueContainer}>
              <Text style={styles.servingsValue}>{servings}</Text>
              <Text style={styles.servingsUnit}>人分</Text>
            </View>
            <TouchableOpacity
              style={[styles.servingButton, servings >= 8 && styles.servingButtonDisabled]}
              onPress={() => handleServingChange(1)}
              disabled={servings >= 8}
            >
              <Text style={[styles.servingButtonText, servings >= 8 && styles.servingButtonTextDisabled]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={[styles.section, shadows.sm]}>
          <Text style={styles.sectionTitle}>🥬 材料（{servings}人分）</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingredientItem}>
                <Text style={[styles.ingredientName, ing.is_optional && styles.optionalText]}>
                  {ing.name}
                  {ing.is_optional && ' (任意)'}
                </Text>
                <Text style={styles.ingredientAmount}>
                  {formatAmount(ing.amount, ing.unit)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Steps Section */}
        <View style={[styles.section, shadows.sm]}>
          <Text style={styles.sectionTitle}>📝 作り方（{recipe.steps.length}ステップ）</Text>
          <View style={styles.stepsList}>
            {recipe.steps.map((step, index) => {
              const phaseInfo = getPhaseLabel(step.phase);
              return (
                <View key={step.id} style={styles.stepItem}>
                  <View style={styles.stepNumberContainer}>
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.stepNumber}
                    >
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </LinearGradient>
                    {index < recipe.steps.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      {phaseInfo && (
                        <View style={[styles.phaseBadge, { backgroundColor: phaseInfo.color + '20' }]}>
                          <Text style={[styles.phaseBadgeText, { color: phaseInfo.color }]}>
                            {phaseInfo.label}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                    {step.details && step.details.length > 0 && (
                      <View style={styles.detailsList}>
                        {step.details.map((detail, detailIndex) => (
                          <View key={detailIndex} style={styles.detailItem}>
                            <Text style={styles.detailBullet}>•</Text>
                            <Text style={styles.detailText}>{detail}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {step.tips && (
                      <View style={styles.tipsContainer}>
                        <Text style={styles.tipsText}>💡 {step.tips}</Text>
                      </View>
                    )}
                    {step.duration_seconds && (
                      <View style={styles.durationContainer}>
                        <Clock size={12} color={newColors.textMuted} />
                        <Text style={styles.durationText}>
                          約{Math.ceil(step.duration_seconds / 60)}分
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* もう一品セクション */}
        {sideDishSuggestions.length > 0 && (
          <View style={[styles.section, shadows.sm]}>
            <View style={styles.sectionHeader}>
              <Utensils size={20} color={newColors.primary} />
              <Text style={styles.sectionTitle}>相性の良いもう一品</Text>
            </View>
            <Text style={styles.sideDishSubtitle}>
              この料理と合わせておすすめ
            </Text>
            <View style={styles.sideDishList}>
              {sideDishSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.recipe.id}
                  style={styles.sideDishCard}
                  onPress={() => handleSideDishPress(suggestion.recipe)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sideDishEmoji}>
                    <Text style={styles.sideDishEmojiText}>
                      {suggestion.recipe.emoji}
                    </Text>
                  </View>
                  <View style={styles.sideDishInfo}>
                    <Text style={styles.sideDishName} numberOfLines={1}>
                      {suggestion.recipe.name}
                    </Text>
                    <View style={styles.sideDishMeta}>
                      <View style={styles.sideDishReason}>
                        <Sparkles size={10} color={newColors.primary} />
                        <Text style={styles.sideDishReasonText}>
                          {suggestion.reason}
                        </Text>
                      </View>
                      <View style={styles.sideDishTime}>
                        <Clock size={10} color={newColors.textMuted} />
                        <Text style={styles.sideDishTimeText}>
                          {suggestion.recipe.cooking_time_minutes}分
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={16} color={newColors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, shadows.lg]}>
        <TouchableOpacity style={styles.calendarButton} onPress={handleAddToCalendar}>
          <Calendar size={22} color={newColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToPlan}>
          <Plus size={20} color={newColors.primary} />
          <Text style={styles.addButtonText}>献立追加</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cookButton} onPress={handleStartCooking}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cookButtonGradient}
          >
            <Play size={22} color={newColors.white} />
            <Text style={styles.cookButtonText}>作り始める</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: newColors.background,
  },
  errorText: {
    fontSize: newTypography.sizes.md,
    color: newColors.textMuted,
    textAlign: 'center',
    marginTop: newSpacing.xxl,
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: newSpacing.md,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: newColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    paddingTop: 100,
    paddingBottom: newSpacing.xl,
    paddingHorizontal: newSpacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: newBorderRadius.xxl,
    borderBottomRightRadius: newBorderRadius.xxl,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: newSpacing.md,
  },
  emoji: {
    fontSize: 64,
  },
  recipeName: {
    fontSize: newTypography.sizes.xxl,
    fontWeight: newTypography.weights.bold,
    color: newColors.white,
    marginBottom: newSpacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: newTypography.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: newSpacing.lg,
  },
  metaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.sm,
    marginBottom: newSpacing.md,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.xs,
    borderRadius: newBorderRadius.full,
  },
  categoryText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: newColors.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: newSpacing.sm,
    justifyContent: 'center',
  },
  bentoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newColors.success,
    paddingHorizontal: newSpacing.sm,
    paddingVertical: newSpacing.xs,
    borderRadius: newBorderRadius.full,
    gap: 4,
  },
  bentoTagText: {
    fontSize: newTypography.sizes.xs,
    color: newColors.white,
    fontWeight: newTypography.weights.semibold,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: newSpacing.sm,
    paddingVertical: newSpacing.xs,
    borderRadius: newBorderRadius.full,
  },
  tagText: {
    fontSize: newTypography.sizes.xs,
    color: newColors.white,
  },

  // Section
  section: {
    backgroundColor: newColors.surface,
    marginTop: newSpacing.md,
    marginHorizontal: newSpacing.md,
    borderRadius: newBorderRadius.lg,
    padding: newSpacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.sm,
    marginBottom: newSpacing.md,
  },
  sectionTitle: {
    fontSize: newTypography.sizes.lg,
    fontWeight: newTypography.weights.bold,
    color: newColors.text,
    marginBottom: newSpacing.md,
  },

  // Servings
  servingsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: newColors.surface,
    marginTop: newSpacing.md,
    marginHorizontal: newSpacing.md,
    borderRadius: newBorderRadius.lg,
    padding: newSpacing.md,
  },
  servingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.sm,
  },
  servingsLabel: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: newColors.text,
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.md,
  },
  servingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: newColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingButtonDisabled: {
    backgroundColor: newColors.surfaceAlt,
  },
  servingButtonText: {
    fontSize: newTypography.sizes.xl,
    fontWeight: newTypography.weights.bold,
    color: newColors.primary,
  },
  servingButtonTextDisabled: {
    color: newColors.textMuted,
  },
  servingsValueContainer: {
    alignItems: 'center',
  },
  servingsValue: {
    fontSize: newTypography.sizes.xxl,
    fontWeight: newTypography.weights.bold,
    color: newColors.primary,
  },
  servingsUnit: {
    fontSize: newTypography.sizes.xs,
    color: newColors.textMuted,
  },

  // Ingredients
  ingredientsList: {
    gap: newSpacing.xs,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: newSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: newColors.borderLight,
  },
  ingredientName: {
    fontSize: newTypography.sizes.md,
    color: newColors.text,
  },
  optionalText: {
    color: newColors.textMuted,
  },
  ingredientAmount: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.bold,
    color: newColors.primary,
  },

  // Steps
  stepsList: {
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepNumberContainer: {
    alignItems: 'center',
    marginRight: newSpacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.bold,
    color: newColors.white,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: newColors.primarySoft,
    marginVertical: newSpacing.xs,
  },
  stepContent: {
    flex: 1,
    paddingBottom: newSpacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.sm,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.bold,
    color: newColors.text,
  },
  phaseBadge: {
    paddingHorizontal: newSpacing.sm,
    paddingVertical: 2,
    borderRadius: newBorderRadius.full,
  },
  phaseBadgeText: {
    fontSize: newTypography.sizes.xs,
    fontWeight: newTypography.weights.semibold,
  },
  stepDescription: {
    fontSize: newTypography.sizes.sm,
    color: newColors.textSecondary,
    lineHeight: 22,
    marginBottom: newSpacing.sm,
  },
  detailsList: {
    marginTop: newSpacing.xs,
    gap: newSpacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    gap: newSpacing.xs,
  },
  detailBullet: {
    fontSize: newTypography.sizes.sm,
    color: newColors.primary,
    lineHeight: 20,
  },
  detailText: {
    flex: 1,
    fontSize: newTypography.sizes.sm,
    color: newColors.text,
    lineHeight: 20,
  },
  tipsContainer: {
    marginTop: newSpacing.sm,
    backgroundColor: newColors.warningBg,
    padding: newSpacing.sm,
    borderRadius: newBorderRadius.md,
  },
  tipsText: {
    fontSize: newTypography.sizes.sm,
    color: newColors.warning,
    lineHeight: 20,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: newSpacing.sm,
  },
  durationText: {
    fontSize: newTypography.sizes.xs,
    color: newColors.textMuted,
  },

  spacer: {
    height: 120,
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: newSpacing.md,
    paddingBottom: newSpacing.xl,
    backgroundColor: newColors.surface,
    borderTopLeftRadius: newBorderRadius.xl,
    borderTopRightRadius: newBorderRadius.xl,
    gap: newSpacing.sm,
  },
  calendarButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: newColors.primarySoft,
    borderRadius: newBorderRadius.lg,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: newColors.surface,
    borderWidth: 2,
    borderColor: newColors.primary,
    borderRadius: newBorderRadius.lg,
    gap: newSpacing.xs,
    height: 52,
  },
  addButtonText: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.bold,
    color: newColors.primary,
  },
  cookButton: {
    flex: 1.5,
    borderRadius: newBorderRadius.lg,
    overflow: 'hidden',
  },
  cookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: newSpacing.sm,
  },
  cookButtonText: {
    fontSize: newTypography.sizes.lg,
    fontWeight: newTypography.weights.bold,
    color: newColors.white,
  },

  // Side Dish Suggestions
  sideDishSubtitle: {
    fontSize: newTypography.sizes.sm,
    color: newColors.textMuted,
    marginBottom: newSpacing.md,
    marginTop: -newSpacing.xs,
  },
  sideDishList: {
    gap: newSpacing.sm,
  },
  sideDishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newColors.surfaceAlt,
    borderRadius: newBorderRadius.md,
    padding: newSpacing.sm,
  },
  sideDishEmoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: newColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: newSpacing.sm,
  },
  sideDishEmojiText: {
    fontSize: 22,
  },
  sideDishInfo: {
    flex: 1,
  },
  sideDishName: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: newColors.text,
    marginBottom: 4,
  },
  sideDishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.sm,
  },
  sideDishReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newColors.primarySoft,
    paddingHorizontal: newSpacing.xs,
    paddingVertical: 2,
    borderRadius: newBorderRadius.sm,
    gap: 2,
  },
  sideDishReasonText: {
    fontSize: newTypography.sizes.xs,
    color: newColors.primary,
    fontWeight: newTypography.weights.medium,
  },
  sideDishTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sideDishTimeText: {
    fontSize: newTypography.sizes.xs,
    color: newColors.textMuted,
  },
});
