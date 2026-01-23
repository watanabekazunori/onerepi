// ============================================
// ワンパン・バディ - マイタイプ画面
// ユーザーの食タイプ情報と学習進捗を表示
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Award,
  Sparkles,
  Info,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { getUserPreferences, UserPreferences } from '../lib/storage';
import {
  FoodPsychologyType,
  FOOD_TYPES,
  DiagnosisAnswers,
} from '../lib/preferenceScoring';
import {
  UserLearningProfile,
  createDefaultLearningProfile,
  generateMyTypeDisplayData,
  getConfidenceLevel,
  MyTypeDisplayData,
  LEARNING_MILESTONES,
} from '../lib/userTypeLearning';
import { colors, spacing, borderRadius, shadows } from '../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

type MyTypeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MyType'>;
};

export const MyTypeScreen: React.FC<MyTypeScreenProps> = ({ navigation }) => {
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [psychologyType, setPsychologyType] = useState<FoodPsychologyType | null>(null);
  const [displayData, setDisplayData] = useState<MyTypeDisplayData | null>(null);
  const [learningProfile, setLearningProfile] = useState<UserLearningProfile | null>(null);

  // アニメーション
  const fadeAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  useEffect(() => {
    if (displayData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: displayData.learningProgress.percentage / 100,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [displayData]);

  const loadUserData = async () => {
    try {
      const prefs = await getUserPreferences();
      setUserPrefs(prefs);

      const diagnosisAnswers = prefs?.diagnosisAnswers as DiagnosisAnswers | undefined;
      const type = diagnosisAnswers?.psychologyType as FoodPsychologyType | undefined;

      if (type) {
        setPsychologyType(type);

        // 学習プロファイルを作成（本来はストレージから取得）
        // TODO: 実際の学習データをストレージから読み込む
        const profile = createDefaultLearningProfile(type);

        // デモ用: 料理ログの数を擬似的に設定
        // 実際のアプリでは getCookingLogs() から計算する
        profile.metadata.totalInteractions = 12;
        profile.metadata.totalCookedRecipes = 8;
        profile.metadata.totalRatings = 5;
        profile.metadata.confidenceLevel = getConfidenceLevel(profile.metadata.totalInteractions).percentage;

        setLearningProfile(profile);
        setDisplayData(generateMyTypeDisplayData(profile));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleRetakeDiagnosis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PreferenceDiagnosis', { isRetake: true });
  };

  if (!psychologyType || !displayData) {
    // 診断未完了の場合
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔮</Text>
            <Text style={styles.emptyTitle}>まだタイプ診断していないよ</Text>
            <Text style={styles.emptyDescription}>
              5つの質問に答えるだけで、{'\n'}
              あなたの「食のタイプ」がわかるよ！
            </Text>
            <TouchableOpacity
              style={styles.diagnosisButton}
              onPress={() => navigation.navigate('PreferenceDiagnosis', { isRetake: false })}
            >
              <Sparkles size={20} color={colors.white} />
              <Text style={styles.diagnosisButtonText}>診断を始める</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const typeInfo = FOOD_TYPES[psychologyType];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ===== タイプカード ===== */}
          <View style={[styles.typeCard, { backgroundColor: typeInfo.color }]}>
            <View style={styles.typeCardHeader}>
              <Text style={styles.typeEmoji}>{typeInfo.emoji}</Text>
              <View style={styles.typeCardBadge}>
                <Text style={styles.typeCardBadgeText}>あなたのタイプ</Text>
              </View>
            </View>
            <Text style={styles.typeName}>{typeInfo.name}</Text>
            <Text style={styles.typeShortDesc}>{typeInfo.shortDescription}</Text>
            <Text style={styles.typeFullDesc}>{typeInfo.fullDescription}</Text>

            {/* キーワードタグ */}
            <View style={styles.keywordsContainer}>
              {typeInfo.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordTag}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>

            {/* 再診断ボタン */}
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetakeDiagnosis}
            >
              <RefreshCw size={14} color={colors.white} />
              <Text style={styles.retakeButtonText}>再診断する</Text>
            </TouchableOpacity>
          </View>

          {/* ===== 学習進捗カード ===== */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>あなたの理解度</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  {displayData.learningProgress.label}
                </Text>
                <Text style={styles.progressPercentage}>
                  {displayData.learningProgress.percentage}%
                </Text>
              </View>

              {/* プログレスバー */}
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: typeInfo.color,
                    },
                  ]}
                />
                {/* マイルストーンマーカー */}
                <View style={[styles.milestoneMarker, { left: '10%' }]} />
                <View style={[styles.milestoneMarker, { left: '30%' }]} />
                <View style={[styles.milestoneMarker, { left: '50%' }]} />
                <View style={[styles.milestoneMarker, { left: '100%' }]} />
              </View>

              <Text style={styles.progressDescription}>
                {displayData.learningProgress.description}
              </Text>
            </View>

            {/* 統計情報 */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {displayData.stats.totalCooked}
                </Text>
                <Text style={styles.statLabel}>作った料理</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {displayData.learningProgress.currentCount}
                </Text>
                <Text style={styles.statLabel}>アクション</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {displayData.stats.preferredCookingTime}
                </Text>
                <Text style={styles.statLabel}>好きな調理時間</Text>
              </View>
            </View>
          </View>

          {/* ===== 好みレーダー ===== */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>あなたの好み傾向</Text>
            </View>

            {/* 簡易バーチャート */}
            <View style={styles.preferenceBars}>
              {displayData.preferences.labels.map((label, index) => {
                const value = displayData.preferences.values[index];
                return (
                  <View key={label} style={styles.preferenceBarRow}>
                    <Text style={styles.preferenceLabel}>{label}</Text>
                    <View style={styles.preferenceBarBackground}>
                      <View
                        style={[
                          styles.preferenceBarFill,
                          {
                            width: `${value}%`,
                            backgroundColor:
                              value >= 60
                                ? typeInfo.color
                                : value >= 40
                                ? colors.textMuted
                                : colors.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.preferenceValue}>{value}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ===== カテゴリ親和性 ===== */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Sparkles size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>相性の良いジャンル</Text>
            </View>

            <View style={styles.affinityContainer}>
              {displayData.affinityCategories.slice(0, 4).map((item, index) => {
                const categoryLabels: Record<string, string> = {
                  japanese: '和食',
                  western: '洋食',
                  chinese: '中華',
                  asian: 'アジアン',
                  other: 'その他',
                };
                const categoryEmojis: Record<string, string> = {
                  japanese: '🍙',
                  western: '🍝',
                  chinese: '🥟',
                  asian: '🍜',
                  other: '🌍',
                };
                return (
                  <View key={item.category} style={styles.affinityItem}>
                    <Text style={styles.affinityEmoji}>
                      {categoryEmojis[item.category] || '🍽️'}
                    </Text>
                    <Text style={styles.affinityLabel}>
                      {categoryLabels[item.category] || item.category}
                    </Text>
                    <View style={styles.affinityBar}>
                      <View
                        style={[
                          styles.affinityBarFill,
                          {
                            width: `${item.affinity}%`,
                            backgroundColor:
                              index === 0 ? typeInfo.color : colors.textMuted,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ===== サブタイプ（30パターン用） ===== */}
          {displayData.subType && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Info size={20} color={colors.info} />
                <Text style={styles.sectionTitle}>詳細タイプ</Text>
              </View>
              <View style={styles.subTypeContainer}>
                <Text style={styles.subTypeLabel}>
                  {displayData.subType.label}
                </Text>
                <Text style={styles.subTypeNote}>
                  料理を続けると、より詳しいタイプが分かるようになるよ！
                </Text>
              </View>
            </View>
          )}

          {/* ===== おすすめキーワード ===== */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🔍 こんなレシピがおすすめ</Text>
            <View style={styles.recommendedKeywords}>
              {displayData.recommendedKeywords.map((keyword, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.recommendKeywordTag,
                    { borderColor: typeInfo.color },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // TODO: キーワードでレシピ検索
                  }}
                >
                  <Text
                    style={[styles.recommendKeywordText, { color: typeInfo.color }]}
                  >
                    #{keyword}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 下部の余白 */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },

  // ===== 未診断状態 =====
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  diagnosisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  diagnosisButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // ===== タイプカード =====
  typeCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  typeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  typeEmoji: {
    fontSize: 48,
  },
  typeCardBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeCardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  typeName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  typeShortDesc: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
  },
  typeFullDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  keywordTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  keywordText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    opacity: 0.8,
  },
  retakeButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },

  // ===== セクションカード =====
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },

  // ===== 学習進捗 =====
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  milestoneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ translateX: -1 }],
  },
  progressDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ===== 統計 =====
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },

  // ===== 好みバーチャート =====
  preferenceBars: {
    gap: spacing.sm,
  },
  preferenceBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    width: 60,
    fontSize: 12,
    color: colors.textSecondary,
  },
  preferenceBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  preferenceBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  preferenceValue: {
    width: 36,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },

  // ===== カテゴリ親和性 =====
  affinityContainer: {
    gap: spacing.sm,
  },
  affinityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  affinityEmoji: {
    fontSize: 20,
    width: 30,
  },
  affinityLabel: {
    width: 60,
    fontSize: 13,
    color: colors.text,
  },
  affinityBar: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginLeft: spacing.sm,
  },
  affinityBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // ===== サブタイプ =====
  subTypeContainer: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  subTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subTypeNote: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // ===== おすすめキーワード =====
  recommendedKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  recommendKeywordTag: {
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
  },
  recommendKeywordText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MyTypeScreen;
