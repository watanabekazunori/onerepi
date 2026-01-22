// ============================================
// ワンパン・バディ - 好み診断 Screen
// オンボーディングとは異なる、より深い好み診断
// ============================================

import React, { useState, useRef, useEffect } from 'react';
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
import { X, ChevronRight, Sparkles, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius } from '../lib/theme';
import { getUserPreferences, saveUserPreferences, UserPreferences } from '../lib/storage';
import { FryingPanIcon } from '../components/ui/FryingPanIcon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PreferenceDiagnosis'>;
};

// 診断ステップ
type DiagnosisStep =
  | 'intro'
  | 'flavor_profile'      // 味の好み詳細
  | 'texture_preference'  // 食感の好み
  | 'cooking_style'       // 調理スタイル
  | 'cuisine_exploration' // 新しい料理への開放性
  | 'meal_pattern'        // 食事パターン
  | 'result';

// 診断質問
interface DiagnosisQuestion {
  id: string;
  question: string;
  description?: string;
  options: {
    id: string;
    label: string;
    emoji: string;
    value: string;
  }[];
  multiSelect?: boolean;
}

const DIAGNOSIS_QUESTIONS: Record<DiagnosisStep, DiagnosisQuestion | null> = {
  intro: null,
  flavor_profile: {
    id: 'flavor_profile',
    question: '好きな味付けのタイプは？',
    description: '普段よく選ぶ味付けを教えてね',
    options: [
      { id: 'f1', label: '甘め・まろやか', emoji: '🍯', value: 'sweet' },
      { id: 'f2', label: '塩味・さっぱり', emoji: '🧂', value: 'salty' },
      { id: 'f3', label: '酸味・爽やか', emoji: '🍋', value: 'sour' },
      { id: 'f4', label: '辛め・スパイシー', emoji: '🌶️', value: 'spicy' },
      { id: 'f5', label: 'うま味・こっくり', emoji: '🍖', value: 'umami' },
    ],
    multiSelect: true,
  },
  texture_preference: {
    id: 'texture_preference',
    question: '好きな食感は？',
    description: '複数選んでOK！',
    options: [
      { id: 't1', label: 'カリッと揚げ物', emoji: '🍤', value: 'crispy' },
      { id: 't2', label: 'トロトロ煮込み', emoji: '🍲', value: 'tender' },
      { id: 't3', label: 'シャキシャキ野菜', emoji: '🥬', value: 'crunchy' },
      { id: 't4', label: 'もちもち食感', emoji: '🍡', value: 'chewy' },
      { id: 't5', label: 'ふわふわ軽め', emoji: '☁️', value: 'fluffy' },
    ],
    multiSelect: true,
  },
  cooking_style: {
    id: 'cooking_style',
    question: '理想の料理スタイルは？',
    description: 'あなたの料理への向き合い方を教えてね',
    options: [
      { id: 'c1', label: '10分で完成！時短派', emoji: '⚡', value: 'quick' },
      { id: 'c2', label: 'じっくり丁寧に作りたい', emoji: '🎯', value: 'detailed' },
      { id: 'c3', label: '週末にまとめて作り置き', emoji: '📦', value: 'batch' },
      { id: 'c4', label: 'その日の気分で自由に', emoji: '🎲', value: 'spontaneous' },
    ],
  },
  cuisine_exploration: {
    id: 'cuisine_exploration',
    question: '新しい料理への挑戦は？',
    description: '普段どれくらい新メニューに挑戦する？',
    options: [
      { id: 'e1', label: '定番が安心！いつもの味', emoji: '🏠', value: 'conservative' },
      { id: 'e2', label: 'たまには新しいのも', emoji: '🌱', value: 'moderate' },
      { id: 'e3', label: '新レシピ大好き！', emoji: '🚀', value: 'adventurous' },
      { id: 'e4', label: '世界の料理を制覇したい', emoji: '🌍', value: 'explorer' },
    ],
  },
  meal_pattern: {
    id: 'meal_pattern',
    question: '平日の夕食、どんな感じ？',
    description: '実際の食事パターンを教えてね',
    options: [
      { id: 'm1', label: '一汁一菜でシンプルに', emoji: '🍚', value: 'simple' },
      { id: 'm2', label: '主菜＋副菜2品くらい', emoji: '🍽️', value: 'standard' },
      { id: 'm3', label: 'ワンプレートで完結', emoji: '🥗', value: 'one_plate' },
      { id: 'm4', label: '日によってバラバラ', emoji: '🎭', value: 'varies' },
    ],
  },
  result: null,
};

const STEP_ORDER: DiagnosisStep[] = [
  'intro',
  'flavor_profile',
  'texture_preference',
  'cooking_style',
  'cuisine_exploration',
  'meal_pattern',
  'result',
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PreferenceDiagnosisScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('intro');
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length - 2; // intro と result を除く
  const progressStepIndex = currentStepIndex - 1; // intro を除いた進捗

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleOptionSelect = (optionValue: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const question = DIAGNOSIS_QUESTIONS[currentStep];
    if (!question) return;

    if (question.multiSelect) {
      // 複数選択可能
      setSelectedOptions((prev) =>
        prev.includes(optionValue)
          ? prev.filter((v) => v !== optionValue)
          : [...prev, optionValue]
      );
    } else {
      // 単一選択：即座に次へ
      setAnswers((prev) => ({
        ...prev,
        [currentStep]: [optionValue],
      }));
      goToNextStep();
    }
  };

  const confirmMultiSelect = () => {
    if (selectedOptions.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnswers((prev) => ({
      ...prev,
      [currentStep]: selectedOptions,
    }));
    setSelectedOptions([]);
    goToNextStep();
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      animateTransition(() => {
        setCurrentStep(STEP_ORDER[nextIndex]);
      });
    }
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goToNextStep();
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 結果を保存
    try {
      const currentPrefs = await getUserPreferences();
      const defaultPrefs: UserPreferences = {
        name: '',
        household: 1,
        tastePreferences: [],
        healthGoals: [],
        dislikes: [],
        allergies: [],
        cookingSkill: '',
        kitchenEquipment: [],
        pantrySeasonings: [],
      };
      const updatedPrefs: UserPreferences = {
        ...defaultPrefs,
        ...currentPrefs,
        diagnosisAnswers: answers,
        diagnosisCompletedAt: new Date().toISOString(),
      };
      await saveUserPreferences(updatedPrefs);
    } catch (error) {
      console.error('Failed to save diagnosis results:', error);
    }

    navigation.goBack();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  // イントロ画面
  const renderIntro = () => (
    <View style={styles.introContainer}>
      <View style={styles.introIconContainer}>
        <Sparkles size={64} color={colors.primary} />
      </View>
      <Text style={styles.introTitle}>好み診断</Text>
      <Text style={styles.introSubtitle}>
        あなたの食の好みをもっと深く知りたい！{'\n'}
        5つの質問に答えてね 🍳
      </Text>
      <View style={styles.introPoints}>
        <View style={styles.introPoint}>
          <Text style={styles.introPointEmoji}>🎯</Text>
          <Text style={styles.introPointText}>味・食感の好みを分析</Text>
        </View>
        <View style={styles.introPoint}>
          <Text style={styles.introPointEmoji}>🍽️</Text>
          <Text style={styles.introPointText}>あなたに合った献立提案</Text>
        </View>
        <View style={styles.introPoint}>
          <Text style={styles.introPointEmoji}>✨</Text>
          <Text style={styles.introPointText}>いつでも再診断OK</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>診断をはじめる</Text>
        <ChevronRight size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // 質問画面
  const renderQuestion = () => {
    const question = DIAGNOSIS_QUESTIONS[currentStep];
    if (!question) return null;

    return (
      <Animated.View
        style={[
          styles.questionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* プログレスバー */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((progressStepIndex + 1) / totalSteps) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progressStepIndex + 1} / {totalSteps}
          </Text>
        </View>

        {/* 質問 */}
        <View style={styles.questionHeader}>
          <View style={styles.questionAvatar}>
            <FryingPanIcon size={32} color={colors.primary} variant="solid" />
          </View>
          <View style={styles.questionBubble}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.description && (
              <Text style={styles.questionDescription}>{question.description}</Text>
            )}
          </View>
        </View>

        {/* オプション */}
        <View style={styles.optionsGrid}>
          {question.options.map((option) => {
            const isSelected = question.multiSelect
              ? selectedOptions.includes(option.value)
              : answers[currentStep]?.includes(option.value);

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleOptionSelect(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text
                  style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={styles.optionCheck}>
                    <Check size={16} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 複数選択時の確定ボタン */}
        {question.multiSelect && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              selectedOptions.length === 0 && styles.confirmButtonDisabled,
            ]}
            onPress={confirmMultiSelect}
            disabled={selectedOptions.length === 0}
          >
            <Text
              style={[
                styles.confirmButtonText,
                selectedOptions.length === 0 && styles.confirmButtonTextDisabled,
              ]}
            >
              {selectedOptions.length > 0
                ? `${selectedOptions.length}つ選んで次へ`
                : '1つ以上選んでね'}
            </Text>
            <ChevronRight
              size={18}
              color={selectedOptions.length > 0 ? colors.white : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  // 結果画面
  const renderResult = () => {
    // 診断結果のサマリーを生成
    const flavorLabels: Record<string, string> = {
      sweet: '甘め・まろやか',
      salty: '塩味・さっぱり',
      sour: '酸味・爽やか',
      spicy: '辛め・スパイシー',
      umami: 'うま味・こっくり',
    };

    const styleLabels: Record<string, string> = {
      quick: '時短派',
      detailed: 'じっくり派',
      batch: '作り置き派',
      spontaneous: '気分派',
    };

    const explorationLabels: Record<string, string> = {
      conservative: '定番派',
      moderate: 'バランス派',
      adventurous: '挑戦派',
      explorer: '冒険派',
    };

    const selectedFlavors = (answers.flavor_profile || [])
      .map((v) => flavorLabels[v])
      .filter(Boolean);
    const selectedStyle = answers.cooking_style?.[0];
    const selectedExploration = answers.cuisine_exploration?.[0];

    return (
      <Animated.View
        style={[
          styles.resultContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>診断完了！ 🎉</Text>
          <Text style={styles.resultSubtitle}>
            あなたの好みがわかりました
          </Text>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>🍴 味の好み</Text>
            <View style={styles.resultTags}>
              {selectedFlavors.map((flavor, index) => (
                <View key={index} style={styles.resultTag}>
                  <Text style={styles.resultTagText}>{flavor}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.resultDivider} />

          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>👨‍🍳 料理スタイル</Text>
            <Text style={styles.resultValue}>
              {selectedStyle ? styleLabels[selectedStyle] : '-'}
            </Text>
          </View>

          <View style={styles.resultDivider} />

          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>🌟 新しい料理への姿勢</Text>
            <Text style={styles.resultValue}>
              {selectedExploration ? explorationLabels[selectedExploration] : '-'}
            </Text>
          </View>
        </View>

        <Text style={styles.resultNote}>
          この診断結果をもとに、あなたにぴったりの献立を提案するよ！
        </Text>

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>診断を保存して閉じる</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✨ 好み診断</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'intro' && renderIntro()}
        {currentStep === 'result' && renderResult()}
        {currentStep !== 'intro' && currentStep !== 'result' && renderQuestion()}
      </ScrollView>
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
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Intro
  introContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  introIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  introSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  introPoints: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  introPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  introPointEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  introPointText: {
    fontSize: 15,
    color: colors.text,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // Question
  questionContainer: {
    flex: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  questionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  questionBubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderTopLeftRadius: 4,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  questionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Options Grid
  optionsGrid: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '15',
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Confirm Button (for multi-select)
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  confirmButtonTextDisabled: {
    color: colors.textMuted,
  },

  // Result
  resultContainer: {
    flex: 1,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultSection: {
    paddingVertical: spacing.sm,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  resultTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  resultTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  resultTagText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  resultNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  completeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
});
