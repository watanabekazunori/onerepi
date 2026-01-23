// ============================================
// ワンパン・バディ - マイタイプ画面
// 「このアプリは私をどれだけ理解しているか」を感じさせる場所
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Lock, Crown, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { getUserPreferences, UserPreferences } from '../lib/storage';
import {
  FoodPsychologyType,
  FOOD_TYPES,
} from '../lib/preferenceScoring';
import { colors, spacing, borderRadius } from '../lib/theme';
import {
  selectUnderstandingForMyType,
  UnderstandingForMyType,
  getCurrentUnderstanding,
} from '../lib/understandingScore';
import {
  isUserPlus,
  shouldShowPlusPrompt,
  markPlusPromptShown,
  PLUS_CONSTANTS,
} from '../lib/plusSubscription';
import { PlusPromptCard } from '../components/PlusPromptCard';

type MyTypeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MyType'>;
};

// タイプ別の説明文（指定文言）
const TYPE_DESCRIPTIONS: Record<FoodPsychologyType, string> = {
  smart_balancer: '疲れている日は、\n「早く・失敗しない」を選びがち。',
  stoic_creator: '体のことを考えて、\n新しい健康法も試したくなる派。',
  healing_gourmet: '「いつものあの味」が、\n心の支えになることを知ってる。',
  trend_hunter: '食で気分を上げたい。\n新しい味との出会いがワクワクする。',
  balanced: 'その日の気分で柔軟に。\n平日は効率、週末は楽しみ重視。',
};

// 注: 理解度メッセージは understandingScore.ts の selectUnderstandingForMyType で生成

// ============================================
// メインコンポーネント
// ============================================

export const MyTypeScreen: React.FC<MyTypeScreenProps> = ({ navigation }) => {
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [psychologyType, setPsychologyType] = useState<FoodPsychologyType | null>(null);
  const [understandingData, setUnderstandingData] = useState<UnderstandingForMyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Plus関連の状態
  const [isPlus, setIsPlus] = useState(false);
  const [showPlusPrompt, setShowPlusPrompt] = useState(false);

  // アニメーション
  const fadeAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const prefs = await getUserPreferences();
      setUserPrefs(prefs);

      // Plus状態を確認
      const plusStatus = await isUserPlus();
      setIsPlus(plusStatus);

      // diagnosisAnswers から psychologyType を取得
      const diagnosisAnswers = prefs?.diagnosisAnswers as { psychologyType?: FoodPsychologyType } | undefined;
      const type = diagnosisAnswers?.psychologyType;

      if (type && FOOD_TYPES[type]) {
        setPsychologyType(type);

        // 理解度システムから取得（Plus状態を渡す）
        const understanding = await selectUnderstandingForMyType(plusStatus);
        setUnderstandingData(understanding);

        // デモ用: イベントがなく0%の場合は62%をデフォルト表示
        // TODO: 実運用時はこのフォールバックを削除
        const displayScore = understanding.percentage === 0 ? 62 : understanding.percentage;
        const displayData: UnderstandingForMyType = understanding.percentage === 0
          ? { ...understanding, percentage: 62, displayMessage: 'だいぶ好みが見えてきた' }
          : understanding;
        setUnderstandingData(displayData);

        // Plus訴求表示チェック（70%到達時のみ）
        const shouldShow = await shouldShowPlusPrompt(displayScore);
        setShowPlusPrompt(shouldShow);

        // アニメーション開始
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: displayScore / 100,
            duration: 800,
            useNativeDriver: false,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDiagnosis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PreferenceDiagnosis', { isRetake: false });
  };

  const handleCreatePlan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('DraftMeeting', {});
  };

  const handleLearnMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: 学習許可のモーダルを表示する
    // 現時点では何もしない
  };

  // Plus訴求: 詳しく見る
  const handlePlusLearnMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Plus詳細モーダル or 購入画面に遷移
    console.log('[Plus] Learn more pressed');
  };

  // Plus訴求: 閉じる
  const handlePlusPromptDismiss = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPlusPrompt(false);
    await markPlusPromptShown();
  };

  // ============================================
  // A. 未診断時の表示
  // ============================================
  if (!psychologyType && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.undiagnosedContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.undiagnosedCard}>
            {/* 見出し */}
            <Text style={styles.undiagnosedTitle}>
              あなたの好み、もう少し知りたい
            </Text>

            {/* 本文 */}
            <Text style={styles.undiagnosedBody}>
              何を食べたいか、{'\n'}
              考えるのがしんどい日もあるよね。{'\n'}
              少しだけ教えてくれたら、{'\n'}
              あなたの代わりに考えるよ。
            </Text>

            {/* CTA */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleStartDiagnosis}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>ごはん決めを任せる</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ローディング中
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // B. 診断済みの表示
  // ============================================
  const typeInfo = FOOD_TYPES[psychologyType!];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ===== タイプカード ===== */}
          <View style={styles.typeCard}>
            <Text style={styles.typeCardLabel}>あなたの今のタイプ</Text>
            <Text style={styles.typeName}>
              {typeInfo.emoji} {typeInfo.name}
            </Text>
            <Text style={styles.typeDescription}>
              {TYPE_DESCRIPTIONS[psychologyType!]}
            </Text>
          </View>

          {/* ===== 最近の傾向 ===== */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>最近の傾向</Text>
            <View style={styles.tendencyList}>
              <View style={styles.tendencyItem}>
                <Text style={styles.tendencyEmoji}>⏱</Text>
                <Text style={styles.tendencyText}>15分以内をよく選ぶ</Text>
              </View>
              <View style={styles.tendencyItem}>
                <Text style={styles.tendencyEmoji}>🥘</Text>
                <Text style={styles.tendencyText}>ワンパン率 高め</Text>
              </View>
              <View style={styles.tendencyItem}>
                <Text style={styles.tendencyEmoji}>🌶</Text>
                <Text style={styles.tendencyText}>冒険は控えめ</Text>
              </View>
            </View>
          </View>

          {/* ===== 理解度メーター ===== */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🧠 あなたの理解度</Text>

            {/* プログレスバー */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: understandingData?.progressColor || colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.progressPercentage,
                { color: understandingData?.progressColor || colors.primary }
              ]}>
                {understandingData?.percentage || 0}%
              </Text>
            </View>

            {/* サブ文言 */}
            <Text style={styles.understandingMessage}>
              {understandingData?.displayMessage || '読み込み中...'}
            </Text>

            {/* Free上限到達時のPlus案内 */}
            {understandingData?.isAtFreeCap && (
              <View style={styles.plusPromptContainer}>
                <Crown size={16} color="#FFB800" />
                <Text style={styles.plusPromptText}>
                  Plusにアップグレードすると、さらに理解が深まります
                </Text>
              </View>
            )}

            {/* Plusユーザーで実際の値が表示値より高い場合の表示 */}
            {understandingData?.canUnlockMore && (
              <View style={styles.unlockHintContainer}>
                <Text style={styles.unlockHintText}>
                  💡 実際は{understandingData.percentageRaw}%まで上がっています
                </Text>
              </View>
            )}
          </View>

          {/* ===== 進化の匂わせ ===== */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>この先、こんな感じに進化するかも</Text>

            <View style={styles.evolutionContainer}>
              {/* 現在のタイプ */}
              <View style={styles.evolutionItem}>
                <Text style={styles.evolutionEmoji}>{typeInfo.emoji}</Text>
                <Text style={styles.evolutionLabel}>{typeInfo.name}</Text>
              </View>

              <Text style={styles.evolutionArrow}>↓</Text>

              {/* ロック中の進化先1 */}
              <View style={styles.evolutionItemLocked}>
                <Lock size={16} color={colors.textMuted} />
                <Text style={styles.evolutionLabelLocked}>疲労回避型</Text>
              </View>

              <Text style={styles.evolutionArrow}>↓</Text>

              {/* ロック中の進化先2 */}
              <View style={styles.evolutionItemLocked}>
                <Lock size={16} color={colors.textMuted} />
                <Text style={styles.evolutionLabelLocked}>平日短期決戦型</Text>
              </View>
            </View>

            <Text style={styles.evolutionSubCopy}>
              使うほど、あなた専用に近づくよ
            </Text>

            {/* 控えめCTA */}
            <TouchableOpacity
              style={styles.learnMoreButton}
              onPress={handleLearnMore}
              activeOpacity={0.7}
            >
              <Text style={styles.learnMoreButtonText}>もっと覚えてもいい？</Text>
            </TouchableOpacity>
          </View>

          {/* ===== メインCTA ===== */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleCreatePlan}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>このタイプで献立を作る</Text>
            </TouchableOpacity>
          </View>

          {/* ===== Plus訴求カード（70%到達時のみ表示） ===== */}
          {showPlusPrompt && understandingData && (
            <PlusPromptCard
              currentUnderstanding={understandingData.percentage}
              onLearnMore={handlePlusLearnMore}
              onDismiss={handlePlusPromptDismiss}
              style={{ marginTop: 16, marginHorizontal: 0 }}
            />
          )}

          {/* 下部の余白 */}
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// スタイル定義
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },

  // ===== ローディング =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },

  // ===== 未診断時 =====
  undiagnosedContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  undiagnosedCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  undiagnosedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  undiagnosedBody: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },

  // ===== タイプカード =====
  typeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  typeCardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  typeName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // ===== セクションカード =====
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },

  // ===== 最近の傾向 =====
  tendencyList: {
    gap: spacing.sm,
  },
  tendencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tendencyEmoji: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  tendencyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  // ===== 理解度メーター =====
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 50,
    textAlign: 'right',
  },
  understandingMessage: {
    fontSize: 14,
    color: colors.textMuted,
  },
  plusPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: '#FFF8E1',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  plusPromptText: {
    fontSize: 13,
    color: '#F57C00',
    flex: 1,
  },
  unlockHintContainer: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unlockHintText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ===== 進化の匂わせ =====
  evolutionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  evolutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  evolutionEmoji: {
    fontSize: 18,
  },
  evolutionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  evolutionArrow: {
    fontSize: 16,
    color: colors.textMuted,
    marginVertical: 4,
  },
  evolutionItemLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  evolutionLabelLocked: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  evolutionSubCopy: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  learnMoreButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  learnMoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },

  // ===== CTA =====
  ctaContainer: {
    marginTop: spacing.sm,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});

export default MyTypeScreen;
