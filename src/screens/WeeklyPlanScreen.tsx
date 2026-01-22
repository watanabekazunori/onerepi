// ============================================
// Onerepi - Weekly Plan Screen (Redesigned)
// モダンで洗練された献立カレンダー
// ============================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Plus,
  Clock,
  Sparkles,
  ChevronRight,
  Refrigerator,
  Heart,
  Settings,
  Play,
  Calendar,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList, WeeklyPlan, WeekDay, DayOfWeek, Recipe } from '../types';
import {
  getCurrentWeekPlan,
  convertToWeeklyPlans,
  getAdvancePrepHintsFromMockPlans,
  AdvancePrepHint,
} from '../lib/storage';
import { supabaseService, UserProfile } from '../lib/supabase-service';
import { suggestSideDishes, SideDishSuggestion } from '../lib/sideDishSuggester';

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
  cardShadow: 'rgba(45, 24, 16, 0.08)',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type WeeklyPlanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
};

// Generate week days
const generateWeekDays = (): WeekDay[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  return days.map((key, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      key,
      label: DAY_LABELS[key],
      date,
      dateString: date.toISOString().split('T')[0],
      isToday: date.toDateString() === today.toDateString(),
    };
  });
};

export const WeeklyPlanScreen: React.FC<WeeklyPlanScreenProps> = ({ navigation }) => {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [advancePrepHints, setAdvancePrepHints] = useState<AdvancePrepHint[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // もう一品インライン表示用のstate
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [sideDishSuggestion, setSideDishSuggestion] = useState<SideDishSuggestion | null>(null);

  const weekDays = useMemo(() => generateWeekDays(), []);

  // Set initial selected day to today
  useEffect(() => {
    const todayIndex = weekDays.findIndex((d) => d.isToday);
    if (todayIndex >= 0) {
      setSelectedDayIndex(todayIndex);
    }
  }, [weekDays]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await supabaseService.getUserProfile();
      setUserProfile(profile);
    };
    loadProfile();
  }, []);

  // Load weekly plans
  const loadWeeklyPlan = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedPlan = await getCurrentWeekPlan();
      if (storedPlan) {
        const weeklyPlans = convertToWeeklyPlans(storedPlan);
        setPlans(weeklyPlans);

        // Calculate advance prep hints
        const today = new Date();
        const todayPlan = weeklyPlans.find(p => {
          const planDate = new Date(p.date);
          return planDate.toDateString() === today.toDateString();
        });

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowPlan = weeklyPlans.find(p => {
          const planDate = new Date(p.date);
          return planDate.toDateString() === tomorrow.toDateString();
        });

        if (todayPlan?.recipe && tomorrowPlan?.recipe) {
          const hints = getAdvancePrepHintsFromMockPlans(
            todayPlan.recipe,
            tomorrowPlan.recipe
          );
          setAdvancePrepHints(hints);
        } else {
          setAdvancePrepHints([]);
        }
      } else {
        setPlans([]);
        setAdvancePrepHints([]);
      }
    } catch (error) {
      console.error('Failed to load weekly plan:', error);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWeeklyPlan();
    }, [loadWeeklyPlan])
  );

  // Get plans grouped by date
  const plansByDate = useMemo(() => {
    const grouped: Record<string, WeeklyPlan[]> = {};
    weekDays.forEach((day) => {
      grouped[day.dateString] = plans.filter((p) => p.date === day.dateString);
    });
    return grouped;
  }, [plans, weekDays]);

  const hasAnyPlans = useMemo(() => plans.length > 0, [plans]);
  const selectedDay = weekDays[selectedDayIndex];
  const selectedDayPlans = plansByDate[selectedDay?.dateString] || [];

  // Handlers
  const handleOpenAIChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AIChat');
  };

  const handleOpenInventory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Inventory');
  };

  const handleOpenFavorites = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Favorites');
  };

  const handleDaySelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDayIndex(index);
  };

  const handlePlanPress = (plan: WeeklyPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Cooking', { planId: plan.id });
  };

  const handleRecipeDetail = (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const handleStartDraftMeeting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('DraftMeeting', { weekStart: weekDays[0].dateString });
  };

  // もう一品提案をトグル（インライン表示）
  const handleToggleSideDish = (planId: string, mainRecipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (expandedPlanId === planId) {
      // 閉じる
      setExpandedPlanId(null);
      setSideDishSuggestion(null);
    } else {
      // 開く - 1つだけ提案
      const suggestions = suggestSideDishes(mainRecipe, 1);
      setExpandedPlanId(planId);
      setSideDishSuggestion(suggestions[0] || null);
    }
  };

  // 別の提案を見る
  const handleRefreshSideDish = (mainRecipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const suggestions = suggestSideDishes(mainRecipe, 1);
    setSideDishSuggestion(suggestions[0] || null);
  };

  // 副菜を選択
  const handleSelectSideDish = (recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedPlanId(null);
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 10) return 'おはようございます';
    if (hour < 17) return 'こんにちは';
    return 'こんばんは';
  };

  const getWeekRangeText = () => {
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.greeting}>
              {getGreeting()}、{userProfile?.name || 'ユーザー'}さん
            </Text>
            <Text style={styles.heroTitle}>今日は何を作る？</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Profile' as any)}
          >
            <Settings size={22} color={brandColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* AI Consultation Section */}
          <View style={styles.aiSection}>
            <Text style={styles.aiSectionTitle}>🍳 AIに相談</Text>

            {/* 1週間の献立を作成 */}
            <TouchableOpacity
              style={styles.aiMainButton}
              onPress={handleStartDraftMeeting}
              activeOpacity={0.8}
            >
              <View style={styles.aiMainButtonIcon}>
                <Calendar size={24} color={brandColors.white} />
              </View>
              <View style={styles.aiMainButtonContent}>
                <Text style={styles.aiMainButtonTitle}>1週間の献立を作成</Text>
                <Text style={styles.aiMainButtonSubtitle}>
                  まとめて計画して、毎日悩まない
                </Text>
              </View>
              <ChevronRight size={20} color={brandColors.white} />
            </TouchableOpacity>

            <View style={styles.aiButtonsRow}>
              {/* あるものから献立 */}
              <TouchableOpacity
                style={styles.aiSubButton}
                onPress={handleOpenAIChat}
                activeOpacity={0.8}
              >
                <View style={styles.aiSubButtonIcon}>
                  <Refrigerator size={22} color={brandColors.primary} />
                </View>
                <Text style={styles.aiSubButtonTitle}>あるもので作る</Text>
                <Text style={styles.aiSubButtonSubtitle}>冷蔵庫の食材から</Text>
              </TouchableOpacity>

              {/* 食べたいもの相談 */}
              <TouchableOpacity
                style={styles.aiSubButton}
                onPress={handleOpenAIChat}
                activeOpacity={0.8}
              >
                <View style={styles.aiSubButtonIcon}>
                  <Sparkles size={22} color={brandColors.primary} />
                </View>
                <Text style={styles.aiSubButtonTitle}>食べたい気分</Text>
                <Text style={styles.aiSubButtonSubtitle}>気分からレシピ提案</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.quickButtonsRow}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={handleOpenInventory}
                activeOpacity={0.7}
              >
                <View style={styles.quickButtonIcon}>
                  <Refrigerator size={20} color={brandColors.primary} />
                </View>
                <Text style={styles.quickButtonText}>食材管理</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={handleOpenFavorites}
                activeOpacity={0.7}
              >
                <View style={styles.quickButtonIcon}>
                  <Heart size={20} color={brandColors.primary} />
                </View>
                <Text style={styles.quickButtonText}>お気に入り</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => navigation.navigate('RecipeList' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.quickButtonIcon}>
                  <Plus size={20} color={brandColors.primary} />
                </View>
                <Text style={styles.quickButtonText}>レシピ検索</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Calendar Strip */}
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>今週の献立</Text>
              <Text style={styles.calendarRange}>{getWeekRangeText()}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekStrip}
            >
              {weekDays.map((day, index) => {
                const dayPlans = plansByDate[day.dateString] || [];
                const hasPlan = dayPlans.length > 0;
                const isSelected = index === selectedDayIndex;

                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayPill,
                      isSelected && styles.dayPillSelected,
                      day.isToday && !isSelected && styles.dayPillToday,
                    ]}
                    onPress={() => handleDaySelect(index)}
                  >
                    <Text
                      style={[
                        styles.dayPillLabel,
                        isSelected && styles.dayPillLabelSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillDate,
                        isSelected && styles.dayPillDateSelected,
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                    {hasPlan && (
                      <View
                        style={[
                          styles.dayPillDot,
                          isSelected && styles.dayPillDotSelected,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Selected Day Content */}
          <View style={styles.selectedDaySection}>
            <View style={styles.selectedDayHeader}>
              <Text style={styles.selectedDayTitle}>
                {selectedDay?.date.getMonth() + 1}月{selectedDay?.date.getDate()}日（{selectedDay?.label}）
                {selectedDay?.isToday && (
                  <Text style={styles.todayBadge}> 今日</Text>
                )}
              </Text>
            </View>

            {selectedDayPlans.length > 0 ? (
              selectedDayPlans.map((plan) => (
                <View key={plan.id} style={styles.mealCard}>
                  <TouchableOpacity
                    style={styles.mealCardContent}
                    onPress={() => handleRecipeDetail(plan.recipe_id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mealEmoji}>
                      <Text style={styles.mealEmojiText}>{plan.recipe?.emoji}</Text>
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{plan.recipe?.name}</Text>
                      <View style={styles.mealMeta}>
                        <Clock size={14} color={brandColors.textMuted} />
                        <Text style={styles.mealTime}>
                          {plan.recipe?.cooking_time_minutes}分
                        </Text>
                        {plan.scale_factor > 1 && (
                          <View style={styles.scaleBadge}>
                            <Text style={styles.scaleBadgeText}>×{plan.scale_factor}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={20} color={brandColors.textMuted} />
                  </TouchableOpacity>
                  <View style={styles.mealCardActions}>
                    <TouchableOpacity
                      style={[
                        styles.sideDishButton,
                        expandedPlanId === plan.id && styles.sideDishButtonActive
                      ]}
                      onPress={() => plan.recipe && handleToggleSideDish(plan.id, plan.recipe)}
                    >
                      <Utensils size={14} color={expandedPlanId === plan.id ? brandColors.white : brandColors.primary} />
                      <Text style={[
                        styles.sideDishButtonText,
                        expandedPlanId === plan.id && styles.sideDishButtonTextActive
                      ]}>
                        {expandedPlanId === plan.id ? '閉じる' : 'もう一品'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cookNowButtonSmall}
                      onPress={() => handlePlanPress(plan)}
                    >
                      <Play size={14} color={brandColors.white} fill={brandColors.white} />
                      <Text style={styles.cookNowTextSmall}>作る</Text>
                    </TouchableOpacity>
                  </View>

                  {/* インライン副菜提案 */}
                  {expandedPlanId === plan.id && sideDishSuggestion && (
                    <View style={styles.inlineSideDish}>
                      <Text style={styles.inlineSideDishLabel}>
                        🍽️ こちらはいかが？
                      </Text>
                      <TouchableOpacity
                        style={styles.inlineSideDishCard}
                        onPress={() => handleSelectSideDish(sideDishSuggestion.recipe)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.inlineSideDishEmoji}>
                          <Text style={styles.inlineSideDishEmojiText}>
                            {sideDishSuggestion.recipe.emoji}
                          </Text>
                        </View>
                        <View style={styles.inlineSideDishInfo}>
                          <Text style={styles.inlineSideDishName}>
                            {sideDishSuggestion.recipe.name}
                          </Text>
                          <View style={styles.inlineSideDishMeta}>
                            <View style={styles.inlineSideDishReason}>
                              <Sparkles size={10} color={brandColors.primary} />
                              <Text style={styles.inlineSideDishReasonText}>
                                {sideDishSuggestion.reason}
                              </Text>
                            </View>
                            <Text style={styles.inlineSideDishTime}>
                              {sideDishSuggestion.recipe.cooking_time_minutes}分
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={16} color={brandColors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={() => plan.recipe && handleRefreshSideDish(plan.recipe)}
                      >
                        <Sparkles size={14} color={brandColors.primary} />
                        <Text style={styles.refreshButtonText}>別の提案を見る</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyDayCard}>
                <Text style={styles.emptyDayEmoji}>🍽️</Text>
                <Text style={styles.emptyDayText}>献立がありません</Text>
                <TouchableOpacity
                  style={styles.addMealButton}
                  onPress={handleStartDraftMeeting}
                >
                  <Plus size={16} color={brandColors.primary} />
                  <Text style={styles.addMealButtonText}>献立を追加</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Advance Prep Tips */}
          {advancePrepHints.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 今日の先取りヒント</Text>
              {advancePrepHints.map((hint, index) => (
                <View key={index} style={styles.tipCard}>
                  <Text style={styles.tipEmoji}>{hint.ingredientEmoji}</Text>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipIngredient}>{hint.ingredientName}</Text>
                    <Text style={styles.tipText}>{hint.hint}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State for No Plans */}
          {!hasAnyPlans && (
            <View style={styles.emptyWeekCard}>
              <Text style={styles.emptyWeekEmoji}>📅</Text>
              <Text style={styles.emptyWeekTitle}>まだ献立がありません</Text>
              <Text style={styles.emptyWeekSubtitle}>
                AIに相談して、1週間の献立を作ってみましょう
              </Text>
              <TouchableOpacity
                style={styles.emptyWeekButton}
                onPress={handleOpenAIChat}
              >
                <Sparkles size={18} color={brandColors.white} />
                <Text style={styles.emptyWeekButtonText}>AIに相談する</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.cream,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero Header
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: brandColors.cream,
  },
  heroContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.textSecondary,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: brandColors.text,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brandColors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  // AI Section
  aiSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.text,
    marginBottom: 12,
  },
  aiMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  aiMainButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiMainButtonContent: {
    flex: 1,
  },
  aiMainButtonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.white,
    marginBottom: 2,
  },
  aiMainButtonSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  aiButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  aiSubButton: {
    flex: 1,
    backgroundColor: brandColors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: brandColors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  aiSubButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brandColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  aiSubButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.text,
    marginBottom: 2,
  },
  aiSubButtonSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: brandColors.textMuted,
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: brandColors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: brandColors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  quickButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: brandColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: brandColors.text,
  },

  // Calendar Section
  calendarSection: {
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.text,
  },
  calendarRange: {
    fontSize: 13,
    fontWeight: '500',
    color: brandColors.textMuted,
  },
  weekStrip: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayPill: {
    width: 52,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: brandColors.white,
    alignItems: 'center',
    shadowColor: brandColors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayPillSelected: {
    backgroundColor: brandColors.primary,
    shadowColor: brandColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  dayPillToday: {
    borderWidth: 2,
    borderColor: brandColors.primary,
  },
  dayPillLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: brandColors.textMuted,
    marginBottom: 4,
  },
  dayPillLabelSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  dayPillDate: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.text,
  },
  dayPillDateSelected: {
    color: brandColors.white,
  },
  dayPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brandColors.primary,
    marginTop: 6,
  },
  dayPillDotSelected: {
    backgroundColor: brandColors.white,
  },

  // Selected Day Section
  selectedDaySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  selectedDayHeader: {
    marginBottom: 12,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.text,
  },
  todayBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: brandColors.primary,
  },
  mealCard: {
    backgroundColor: brandColors.white,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: brandColors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  mealCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mealEmoji: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: brandColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mealEmojiText: {
    fontSize: 28,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.text,
    marginBottom: 4,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTime: {
    fontSize: 13,
    fontWeight: '500',
    color: brandColors.textMuted,
  },
  scaleBadge: {
    backgroundColor: brandColors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  scaleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: brandColors.primary,
  },
  // Empty Day Card
  emptyDayCard: {
    backgroundColor: brandColors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: brandColors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyDayEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyDayText: {
    fontSize: 15,
    fontWeight: '500',
    color: brandColors.textMuted,
    marginBottom: 16,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primarySoft,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  addMealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.primary,
  },

  // Tips Section
  tipsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.text,
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: brandColors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipIngredient: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.text,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '400',
    color: brandColors.textSecondary,
    lineHeight: 18,
  },

  // Empty Week Card
  emptyWeekCard: {
    marginHorizontal: 24,
    backgroundColor: brandColors.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: brandColors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyWeekEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyWeekTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: brandColors.text,
    marginBottom: 8,
  },
  emptyWeekSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyWeekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 8,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyWeekButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.white,
  },

  bottomSpacer: {
    height: 20,
  },

  // Meal Card Actions (もう一品ボタン追加)
  mealCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  sideDishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: brandColors.border,
  },
  sideDishButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: brandColors.primary,
  },
  cookNowButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 14,
    gap: 6,
  },
  cookNowTextSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: brandColors.white,
  },
  sideDishButtonActive: {
    backgroundColor: brandColors.primary,
  },
  sideDishButtonTextActive: {
    color: brandColors.white,
  },

  // Inline Side Dish Suggestion
  inlineSideDish: {
    backgroundColor: brandColors.primarySoft,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  inlineSideDishLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brandColors.textSecondary,
    marginBottom: 12,
  },
  inlineSideDishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.white,
    borderRadius: 14,
    padding: 12,
  },
  inlineSideDishEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: brandColors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inlineSideDishEmojiText: {
    fontSize: 22,
  },
  inlineSideDishInfo: {
    flex: 1,
  },
  inlineSideDishName: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.text,
    marginBottom: 4,
  },
  inlineSideDishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineSideDishReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: brandColors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineSideDishReasonText: {
    fontSize: 10,
    fontWeight: '500',
    color: brandColors.primary,
  },
  inlineSideDishTime: {
    fontSize: 11,
    color: brandColors.textMuted,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    gap: 6,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: brandColors.primary,
  },
});
