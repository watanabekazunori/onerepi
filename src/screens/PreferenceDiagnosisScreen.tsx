// ============================================
// ワンパン・バディ - 心理タイプ診断 Screen
// 2軸マトリクス（機能/快楽 × 安定/探求）による5タイプ分類
// A/B選択形式の5問診断
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
import { RouteProp } from '@react-navigation/native';
import { X, ChevronRight, Sparkles, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius } from '../lib/theme';
import { getUserPreferences, saveUserPreferences, UserPreferences } from '../lib/storage';
import {
  DIAGNOSIS_QUESTIONS,
  DiagnosisAnswer,
  DiagnosisResult,
  calculateDiagnosisResult,
  FOOD_TYPES,
  FoodPsychologyType,
  generateTypeSummary,
  getTypeRecommendationKeywords,
} from '../lib/preferenceScoring';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PreferenceDiagnosis'>;
  route: RouteProp<RootStackParamList, 'PreferenceDiagnosis'>;
};

type DiagnosisStep = 'intro' | 'question' | 'result';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PreferenceDiagnosisScreen: React.FC<Props> = ({ navigation, route }) => {
  const isRetake = route.params?.isRetake || false;
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswer[]>([]);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnimA = useRef(new Animated.Value(1)).current;
  const scaleAnimB = useRef(new Animated.Value(1)).current;

  const totalQuestions = DIAGNOSIS_QUESTIONS.length;
  const currentQuestion = DIAGNOSIS_QUESTIONS[currentQuestionIndex];

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
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

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateTransition(() => {
      setCurrentStep('question');
    });
  };

  const handleOptionSelect = (option: 'A' | 'B') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 選択アニメーション
    const scaleAnim = option === 'A' ? scaleAnimA : scaleAnimB;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 回答を記録
    const newAnswer: DiagnosisAnswer = {
      questionId: currentQuestion.id,
      selectedOption: option,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // 次の質問へ、または結果画面へ
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        animateTransition(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        });
      } else {
        // 診断結果を計算
        const diagnosisResult = calculateDiagnosisResult(updatedAnswers);
        setResult(diagnosisResult);
        animateTransition(() => {
          setCurrentStep('result');
        });
      }
    }, 300);
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!result) return;

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
        diagnosisAnswers: {
          psychologyType: result.type,
          rawAnswers: answers,
          purposeScore: result.scores.purposeAxis,
          adventureScore: result.scores.adventureAxis,
        },
        diagnosisCompletedAt: result.answeredAt,
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

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setResult(null);
    animateTransition(() => {
      setCurrentStep('question');
    });
  };

  // イントロ画面
  const renderIntro = () => (
    <ScrollView
      style={styles.introScrollView}
      contentContainerStyle={styles.introScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.introContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.introIconContainer}>
          <Text style={styles.introMainEmoji}>🧠</Text>
        </View>

        <Text style={styles.introTitle}>食の心理タイプ診断</Text>
        <Text style={styles.introSubtitle}>
          5つの質問であなたの「食の心理タイプ」を診断！{'\n'}
          ぴったりの献立を提案できるようになるよ
        </Text>

        <View style={styles.introTypePreview}>
          <Text style={styles.introTypePreviewTitle}>診断でわかる5つのタイプ</Text>
          <View style={styles.introTypeGrid}>
            {Object.values(FOOD_TYPES).map((type) => (
              <View key={type.id} style={styles.introTypeItem}>
                <Text style={styles.introTypeEmoji}>{type.emoji}</Text>
                <Text style={styles.introTypeName}>{type.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.introInfo}>
          <View style={styles.introInfoItem}>
            <Text style={styles.introInfoEmoji}>⏱️</Text>
            <Text style={styles.introInfoText}>所要時間: 約1分</Text>
          </View>
          <View style={styles.introInfoItem}>
            <Text style={styles.introInfoEmoji}>🔄</Text>
            <Text style={styles.introInfoText}>何度でも再診断OK</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>診断をはじめる</Text>
          <ArrowRight size={20} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );

  // 質問画面（A/B選択形式）
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const situationText = currentQuestion.situation;
    const questionText = currentQuestion.question;

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
        {/* プログレス */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            {DIAGNOSIS_QUESTIONS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentQuestionIndex && styles.progressDotActive,
                  index === currentQuestionIndex && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>
            Q{currentQuestionIndex + 1} / {totalQuestions}
          </Text>
        </View>

        {/* シチュエーション & 質問 */}
        <View style={styles.questionCard}>
          <Text style={styles.situationText}>{situationText}</Text>
          {questionText && (
            <Text style={styles.questionText}>{questionText}</Text>
          )}
        </View>

        {/* A/B選択肢 */}
        <View style={styles.optionsContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnimA }] }}>
            <TouchableOpacity
              style={[styles.optionButton, styles.optionButtonA]}
              onPress={() => handleOptionSelect('A')}
              activeOpacity={0.8}
            >
              <View style={styles.optionLabelBadge}>
                <Text style={styles.optionLabelBadgeText}>A</Text>
              </View>
              <Text style={styles.optionText}>
                {currentQuestion.optionA.text}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.optionDivider}>
            <View style={styles.optionDividerLine} />
            <Text style={styles.optionDividerText}>or</Text>
            <View style={styles.optionDividerLine} />
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnimB }] }}>
            <TouchableOpacity
              style={[styles.optionButton, styles.optionButtonB]}
              onPress={() => handleOptionSelect('B')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionLabelBadge, styles.optionLabelBadgeB]}>
                <Text style={styles.optionLabelBadgeText}>B</Text>
              </View>
              <Text style={styles.optionText}>
                {currentQuestion.optionB.text}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ヒント */}
        <Text style={styles.questionHint}>
          直感で選んでね！深く考えなくてOK 🙌
        </Text>
      </Animated.View>
    );
  };

  // 結果画面
  const renderResult = () => {
    if (!result) return null;

    const { typeInfo, scores } = result;
    const keywords = getTypeRecommendationKeywords(result.type);

    // 2軸の傾向を日本語で表現
    const getPurposeTendency = () => {
      if (scores.purposeAxis < -30) return '効率・健康重視';
      if (scores.purposeAxis > 30) return '味・快楽重視';
      return 'バランス型';
    };

    const getAdventureTendency = () => {
      if (scores.adventureAxis < -30) return '安定・定番志向';
      if (scores.adventureAxis > 30) return '探求・冒険志向';
      return 'バランス型';
    };

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
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ヘッダー */}
          <View style={styles.resultHeader}>
            <Text style={styles.resultPreTitle}>あなたのタイプは...</Text>
          </View>

          {/* メインタイプカード */}
          <View style={[styles.resultTypeCard, { backgroundColor: typeInfo.color + '15' }]}>
            <View style={[styles.resultTypeIconBg, { backgroundColor: typeInfo.color + '30' }]}>
              <Text style={styles.resultTypeEmoji}>{typeInfo.emoji}</Text>
            </View>
            <Text style={[styles.resultTypeName, { color: typeInfo.color }]}>
              {typeInfo.name}
            </Text>
            <Text style={styles.resultTypeShort}>{typeInfo.shortDescription}</Text>
            <Text style={styles.resultTypeDescription}>{typeInfo.fullDescription}</Text>
          </View>

          {/* 2軸の傾向 */}
          <View style={styles.axisSection}>
            <Text style={styles.axisSectionTitle}>あなたの傾向</Text>
            <View style={styles.axisCards}>
              <View style={styles.axisCard}>
                <Text style={styles.axisCardLabel}>食の目的</Text>
                <Text style={styles.axisCardValue}>{getPurposeTendency()}</Text>
                <View style={styles.axisBar}>
                  <Text style={styles.axisBarLabel}>機能</Text>
                  <View style={styles.axisBarTrack}>
                    <View
                      style={[
                        styles.axisBarIndicator,
                        { left: `${((scores.purposeAxis + 100) / 200) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.axisBarLabel}>快楽</Text>
                </View>
              </View>

              <View style={styles.axisCard}>
                <Text style={styles.axisCardLabel}>冒険度</Text>
                <Text style={styles.axisCardValue}>{getAdventureTendency()}</Text>
                <View style={styles.axisBar}>
                  <Text style={styles.axisBarLabel}>安定</Text>
                  <View style={styles.axisBarTrack}>
                    <View
                      style={[
                        styles.axisBarIndicator,
                        { left: `${((scores.adventureAxis + 100) / 200) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.axisBarLabel}>探求</Text>
                </View>
              </View>
            </View>
          </View>

          {/* おすすめキーワード */}
          <View style={styles.keywordsSection}>
            <Text style={styles.keywordsSectionTitle}>
              あなたにおすすめのキーワード
            </Text>
            <View style={styles.keywordsTags}>
              {keywords.map((keyword, index) => (
                <View
                  key={index}
                  style={[styles.keywordTag, { backgroundColor: typeInfo.color + '20' }]}
                >
                  <Text style={[styles.keywordTagText, { color: typeInfo.color }]}>
                    #{keyword}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 注釈 */}
          <Text style={styles.resultNote}>
            この結果をもとに、あなたにぴったりの献立を優先的に提案するよ！
          </Text>

          {/* ボタン */}
          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultButton, styles.resultButtonPrimary]}
              onPress={handleComplete}
            >
              <Text style={styles.resultButtonPrimaryText}>この結果で保存</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultButton, styles.resultButtonSecondary]}
              onPress={handleRetry}
            >
              <Text style={styles.resultButtonSecondaryText}>もう一度診断する</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
        <Text style={styles.headerTitle}>🧠 食の心理タイプ診断</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {currentStep === 'intro' && renderIntro()}
        {currentStep === 'question' && renderQuestion()}
        {currentStep === 'result' && renderResult()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },

  content: {
    flex: 1,
    padding: spacing.lg,
  },

  // Intro
  introScrollView: {
    flex: 1,
  },
  introScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  introContainer: {
    alignItems: 'center',
  },
  introIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  introMainEmoji: {
    fontSize: 48,
  },
  introTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  introTypePreview: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  introTypePreviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  introTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  introTypeItem: {
    alignItems: 'center',
    width: 60,
  },
  introTypeEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  introTypeName: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  introInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  introInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  introInfoEmoji: {
    fontSize: 16,
  },
  introInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },

  // Question
  questionContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary + '50',
  },
  progressDotCurrent: {
    backgroundColor: colors.primary,
    width: 24,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  situationText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 26,
  },
  questionText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionButtonA: {
    borderColor: '#4A90D9' + '50',
  },
  optionButtonB: {
    borderColor: '#E91E63' + '50',
  },
  optionLabelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabelBadgeB: {
    backgroundColor: '#E91E63',
  },
  optionLabelBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  optionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  optionDividerText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  questionHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // Result
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultPreTitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultTypeCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultTypeIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultTypeEmoji: {
    fontSize: 40,
  },
  resultTypeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  resultTypeShort: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  resultTypeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  axisSection: {
    marginBottom: spacing.lg,
  },
  axisSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  axisCards: {
    gap: spacing.sm,
  },
  axisCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  axisCardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  axisCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  axisBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  axisBarLabel: {
    fontSize: 10,
    color: colors.textMuted,
    width: 28,
  },
  axisBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    position: 'relative',
  },
  axisBarIndicator: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  keywordsSection: {
    marginBottom: spacing.md,
  },
  keywordsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  keywordsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  keywordTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  keywordTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resultButtons: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  resultButton: {
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  resultButtonPrimary: {
    backgroundColor: colors.primary,
  },
  resultButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  resultButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
