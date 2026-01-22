// ============================================
// ワンパン・バディ - Cooking Screen
// 分量トグル付き、ダークモードUI（改善版）
// ============================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Vibration,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  Users,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Camera,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../types';
import { MOCK_RECIPES, MOCK_WEEKLY_PLANS } from '../lib/mockData';
import { addCookingLogEntry } from '../lib/storage';
import { CircularProgress, StepIndicator } from '../components/ui';
import {
  cookingColors,
  newSpacing,
  newBorderRadius,
  newTypography,
  shadows,
} from '../styles/theme';

type CookingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cooking'>;
  route: RouteProp<RootStackParamList, 'Cooking'>;
};

const colors = cookingColors;

const SERVING_OPTIONS = [1, 2, 3, 4];

export const CookingScreen: React.FC<CookingScreenProps> = ({ navigation, route }) => {
  const { planId } = route.params;

  // Find plan and recipe
  const plan = MOCK_WEEKLY_PLANS.find((p) => p.id === planId);
  const recipe = plan?.recipe || MOCK_RECIPES[0];

  // -1 = 材料確認ステップ, 0以降 = 実際の調理ステップ
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [servings, setServings] = useState(plan?.scale_factor || 1);
  const [showIngredients, setShowIngredients] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<{[stepIndex: number]: string[]}>({});
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // 材料確認ステップを含めた総ステップ数
  const totalStepsWithPrep = recipe.steps.length + 1;
  const currentStep = currentStepIndex >= 0 ? recipe.steps[currentStepIndex] : null;
  const totalSteps = recipe.steps.length;
  const progress = ((currentStepIndex + 2) / totalStepsWithPrep) * 100;
  const isIngredientCheckStep = currentStepIndex === -1;

  // Calculate scaled ingredients
  const scaledIngredients = useMemo(() => {
    const baseServings = recipe.servings || 1;
    const multiplier = servings / baseServings;

    return recipe.ingredients.map((ing) => ({
      ...ing,
      scaledAmount: ing.amount * multiplier,
    }));
  }, [recipe.ingredients, recipe.servings, servings]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, progress]);

  useEffect(() => {
    if (currentStep?.duration_seconds) {
      setTimerSeconds(currentStep.duration_seconds);
    }
    setIsTimerRunning(false);
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [currentStepIndex, currentStep?.duration_seconds]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerInterval.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            Vibration.vibrate([0, 500, 200, 500]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount: number, unit: string) => {
    if (amount === Math.floor(amount)) {
      return `${amount}${unit}`;
    }
    return `${amount.toFixed(1)}${unit}`;
  };

  const handlePrevStep = () => {
    if (currentStepIndex > -1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNextStep = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // 調理完了！
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.stop();

      try {
        await addCookingLogEntry({
          recipeId: recipe.id,
          recipeName: recipe.name,
          recipeEmoji: recipe.emoji,
          photoUri: capturedPhotos[currentStepIndex]?.[0],
        });

        Alert.alert(
          '調理完了！',
          `「${recipe.name}」の調理が完了しました！\n自炊日記に記録しました。`,
          [
            {
              text: '閉じる',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } catch (error) {
        console.error('Failed to save cooking log:', error);
        navigation.goBack();
      }
    }
  };

  const handleTimerToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTimerRunning((prev) => !prev);
  };

  const handleTimerReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep?.duration_seconds) {
      setTimerSeconds(currentStep.duration_seconds);
    }
    setIsTimerRunning(false);
  };

  const handleServingChange = (newServings: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setServings(newServings);
  };

  const toggleIngredientCheck = (ingredientId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const checkAllIngredients = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allIds = new Set(recipe.ingredients.map((ing) => ing.id));
    setCheckedIngredients(allIds);
  };

  // 音声読み上げ
  const speakStep = useCallback(async (text: string) => {
    if (!isSpeechEnabled) return;

    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      await Speech.stop();
    }

    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'ja-JP',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [isSpeechEnabled]);

  const stopSpeaking = async () => {
    await Speech.stop();
    setIsSpeaking(false);
  };

  const toggleSpeech = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSpeaking) {
      await stopSpeaking();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  // 読み上げテキストを生成
  const getStepSpeechText = () => {
    if (isIngredientCheckStep) {
      return `材料を確認しましょう。${recipe.ingredients.map(ing => ing.name).join('、')}が必要です。`;
    }
    if (!currentStep) return '';

    let text = `ステップ${currentStepIndex + 1}。${currentStep.title}。${currentStep.description}`;
    if (currentStep.details && currentStep.details.length > 0) {
      text += '。詳細は、' + currentStep.details.join('。');
    }
    if (currentStep.tips) {
      text += `。ポイント：${currentStep.tips}`;
    }
    return text;
  };

  // ステップ変更時に自動読み上げ
  useEffect(() => {
    if (isSpeechEnabled && (currentStep || isIngredientCheckStep)) {
      const text = getStepSpeechText();
      speakStep(text);
    }
    return () => {
      Speech.stop();
    };
  }, [currentStepIndex, isSpeechEnabled]);

  // タイマー追加機能
  const addTimerSeconds = (seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimerSeconds(prev => Math.max(0, prev + seconds));
  };

  // タイマーパルスアニメーション（残り10秒以下）
  useEffect(() => {
    if (timerSeconds <= 10 && timerSeconds > 0 && isTimerRunning) {
      Animated.sequence([
        Animated.timing(timerPulseAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(timerPulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [timerSeconds, isTimerRunning]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.stop();
    navigation.goBack();
  };

  // 写真撮影機能
  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('カメラへのアクセス許可が必要です', 'アプリ設定からカメラへのアクセスを許可してください。');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const photoUri = result.assets[0].uri;
      setCapturedPhotos(prev => ({
        ...prev,
        [currentStepIndex]: [...(prev[currentStepIndex] || []), photoUri],
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // 写真を表示
  const viewPhoto = (uri: string) => {
    setSelectedPhoto(uri);
    setShowPhotoModal(true);
  };

  // 現在のステップの写真
  const currentStepPhotos = capturedPhotos[currentStepIndex] || [];

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === -1;

  // タイマーの進捗率を計算
  const timerProgress = currentStep?.duration_seconds
    ? ((currentStep.duration_seconds - timerSeconds) / currentStep.duration_seconds) * 100
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.recipeName}>{recipe.emoji} {recipe.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.speechButton, !isSpeechEnabled && styles.speechButtonDisabled]}
            onPress={toggleSpeech}
          >
            {isSpeechEnabled ? (
              <Volume2 size={20} color={colors.primary} />
            ) : (
              <VolumeX size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ingredientsButton}
            onPress={() => setShowIngredients(!showIngredients)}
          >
            <Text style={styles.ingredientsButtonText}>材料</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicatorContainer}>
        <StepIndicator
          totalSteps={totalSteps}
          currentStep={currentStepIndex}
          compact
        />
      </View>

      {/* Serving Toggle */}
      <View style={styles.servingContainer}>
        <Users size={18} color={colors.textSecondary} />
        <Text style={styles.servingLabel}>分量:</Text>
        <View style={styles.servingButtons}>
          {SERVING_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.servingButton,
                servings === s && styles.servingButtonActive,
              ]}
              onPress={() => handleServingChange(s)}
            >
              <Text
                style={[
                  styles.servingButtonText,
                  servings === s && styles.servingButtonTextActive,
                ]}
              >
                {s}人分
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ingredients Panel (Collapsible) */}
      {showIngredients && (
        <View style={styles.ingredientsPanel}>
          <Text style={styles.ingredientsPanelTitle}>
            材料（{servings}人分）
          </Text>
          <ScrollView style={styles.ingredientsList} showsVerticalScrollIndicator={false}>
            {scaledIngredients.map((ing) => (
              <View key={ing.id} style={styles.ingredientItem}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>
                  {formatAmount(ing.scaledAmount, ing.unit)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 材料確認ステップ */}
        {isIngredientCheckStep ? (
          <>
            <View style={styles.stepHeader}>
              <View style={[styles.phaseBadge, styles.phaseCheckBadge]}>
                <Text style={styles.phaseBadgeText}>材料確認</Text>
              </View>
            </View>

            <Text style={styles.stepTitle}>材料を確認しよう</Text>
            <Text style={styles.stepDescription}>
              調理を始める前に、必要な材料が揃っているか確認しましょう
            </Text>

            <View style={styles.ingredientCheckList}>
              <View style={styles.ingredientCheckHeader}>
                <Text style={styles.ingredientCheckTitle}>
                  必要な材料（{servings}人分）
                </Text>
                <TouchableOpacity
                  style={styles.checkAllButton}
                  onPress={checkAllIngredients}
                >
                  <Text style={styles.checkAllButtonText}>全てチェック</Text>
                </TouchableOpacity>
              </View>

              {scaledIngredients.map((ing) => (
                <TouchableOpacity
                  key={ing.id}
                  style={[
                    styles.ingredientCheckItem,
                    checkedIngredients.has(ing.id) && styles.ingredientCheckItemChecked,
                  ]}
                  onPress={() => toggleIngredientCheck(ing.id)}
                >
                  <View style={[
                    styles.checkBox,
                    checkedIngredients.has(ing.id) && styles.checkBoxChecked,
                  ]}>
                    {checkedIngredients.has(ing.id) && (
                      <Check size={16} color={colors.white} />
                    )}
                  </View>
                  <Text style={[
                    styles.ingredientCheckName,
                    checkedIngredients.has(ing.id) && styles.ingredientCheckNameChecked,
                  ]}>
                    {ing.name}
                  </Text>
                  <Text style={[
                    styles.ingredientCheckAmount,
                    checkedIngredients.has(ing.id) && styles.ingredientCheckAmountChecked,
                  ]}>
                    {formatAmount(ing.scaledAmount, ing.unit)}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.ingredientCheckProgress}>
                <Text style={styles.ingredientCheckProgressText}>
                  {checkedIngredients.size} / {recipe.ingredients.length} 確認済み
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Phase & Step Indicator */}
            <View style={styles.stepHeader}>
              {currentStep?.phase && (
                <View style={[
                  styles.phaseBadge,
                  currentStep.phase === 'prep' && styles.phasePrepBadge,
                  currentStep.phase === 'cook' && styles.phaseCookBadge,
                  currentStep.phase === 'finish' && styles.phaseFinishBadge,
                ]}>
                  <Text style={styles.phaseBadgeText}>
                    {currentStep.phase === 'prep' ? '下準備' :
                     currentStep.phase === 'cook' ? '調理' : '仕上げ'}
                  </Text>
                </View>
              )}
              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>
                  ステップ {currentStepIndex + 1}/{totalSteps}
                </Text>
              </View>
            </View>

            <Text style={styles.stepTitle}>{currentStep?.title}</Text>
            <Text style={styles.stepDescription}>{currentStep?.description}</Text>

            {/* Detail Steps */}
            {currentStep?.details && currentStep.details.length > 0 && (
              <View style={styles.detailsContainer}>
                {currentStep.details.map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <View style={styles.detailBullet}>
                      <Text style={styles.detailBulletText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Ingredients Used in This Step */}
            {currentStep?.ingredientsUsed && currentStep.ingredientsUsed.length > 0 && (
              <View style={styles.usedIngredientsContainer}>
                <Text style={styles.usedIngredientsLabel}>使う材料:</Text>
                <View style={styles.usedIngredientsList}>
                  {currentStep.ingredientsUsed.map((name, index) => (
                    <View key={index} style={styles.usedIngredientChip}>
                      <Text style={styles.usedIngredientText}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Tips Card */}
            {currentStep?.tips && (
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsLabel}>💡 ポイント</Text>
                <Text style={styles.tipsText}>{currentStep.tips}</Text>
              </View>
            )}

            {/* Read Aloud Button */}
            {isSpeechEnabled && (
              <TouchableOpacity
                style={styles.readAloudButton}
                onPress={() => speakStep(getStepSpeechText())}
              >
                <Volume2 size={20} color={colors.white} />
                <Text style={styles.readAloudButtonText}>
                  {isSpeaking ? '読み上げ中...' : 'もう一度読み上げ'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Timer with Circular Progress */}
            {currentStep?.duration_seconds && currentStep.duration_seconds > 0 && (
              <View style={styles.timerContainer}>
                <CircularProgress
                  progress={timerProgress}
                  size={160}
                  strokeWidth={12}
                  color={timerSeconds <= 10 ? '#FF6B6B' : colors.primary}
                  backgroundColor={colors.surface}
                >
                  <Animated.View style={{ transform: [{ scale: timerPulseAnim }] }}>
                    <Text style={[
                      styles.timerDisplay,
                      timerSeconds <= 10 && timerSeconds > 0 && styles.timerDisplayWarning,
                      timerSeconds === 0 && styles.timerDisplayDone,
                    ]}>
                      {formatTime(timerSeconds)}
                    </Text>
                    {timerSeconds === 0 && (
                      <Text style={styles.timerDoneText}>完了！</Text>
                    )}
                  </Animated.View>
                </CircularProgress>

                <View style={styles.timerControls}>
                  <TouchableOpacity
                    style={styles.timerAdjustButton}
                    onPress={() => addTimerSeconds(-30)}
                  >
                    <Minus size={20} color={colors.text} />
                    <Text style={styles.timerAdjustText}>30秒</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timerButton}
                    onPress={handleTimerReset}
                  >
                    <RotateCcw size={28} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timerButton, styles.timerPlayButton]}
                    onPress={handleTimerToggle}
                  >
                    {isTimerRunning ? (
                      <Pause size={32} color={colors.black} />
                    ) : (
                      <Play size={32} color={colors.black} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timerAdjustButton}
                    onPress={() => addTimerSeconds(30)}
                  >
                    <Plus size={20} color={colors.text} />
                    <Text style={styles.timerAdjustText}>30秒</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.photoSectionTitle}>📷 写真を記録</Text>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={24} color={colors.white} />
                  <Text style={styles.photoButtonText}>撮影</Text>
                </TouchableOpacity>
              </View>

              {currentStepPhotos.length > 0 && (
                <View style={styles.photoThumbnails}>
                  {currentStepPhotos.map((uri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.thumbnail}
                      onPress={() => viewPhoto(uri)}
                    >
                      <Image source={{ uri }} style={styles.thumbnailImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.contentSpacer} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            isFirstStep && styles.navButtonDisabled,
          ]}
          onPress={handlePrevStep}
          disabled={isFirstStep}
        >
          <ChevronLeft size={36} color={isFirstStep ? colors.textMuted : colors.text} />
          <Text style={[styles.navButtonText, isFirstStep && styles.navButtonTextDisabled]}>
            前へ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNextStep}
        >
          {isLastStep ? (
            <>
              <Check size={36} color={colors.white} />
              <Text style={[styles.navButtonText, styles.nextButtonText]}>完了</Text>
            </>
          ) : isIngredientCheckStep ? (
            <>
              <Text style={[styles.navButtonText, styles.nextButtonText]}>調理開始</Text>
              <ChevronRight size={36} color={colors.white} />
            </>
          ) : (
            <>
              <Text style={[styles.navButtonText, styles.nextButtonText]}>次へ</Text>
              <ChevronRight size={36} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Photo Modal */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity
            style={styles.photoModalCloseButton}
            onPress={() => setShowPhotoModal(false)}
          >
            <X size={28} color={colors.white} />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.photoModalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.sm,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: newBorderRadius.full,
    backgroundColor: colors.surface,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  recipeName: {
    fontSize: newTypography.sizes.lg,
    fontWeight: newTypography.weights.semibold,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.sm,
  },
  speechButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: newBorderRadius.full,
    backgroundColor: colors.surface,
  },
  speechButtonDisabled: {
    opacity: 0.5,
  },
  ingredientsButton: {
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.sm,
    borderRadius: newBorderRadius.full,
    backgroundColor: colors.surface,
  },
  ingredientsButtonText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.primary,
  },

  // Step Indicator
  stepIndicatorContainer: {
    paddingVertical: newSpacing.sm,
    backgroundColor: colors.surface,
    marginHorizontal: newSpacing.md,
    borderRadius: newBorderRadius.lg,
    marginBottom: newSpacing.sm,
  },

  // Serving Toggle
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.sm,
    gap: newSpacing.sm,
  },
  servingLabel: {
    fontSize: newTypography.sizes.sm,
    color: colors.textSecondary,
  },
  servingButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: newSpacing.xs,
  },
  servingButton: {
    flex: 1,
    paddingVertical: newSpacing.sm,
    borderRadius: newBorderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  servingButtonActive: {
    backgroundColor: colors.primary,
  },
  servingButtonText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.textSecondary,
  },
  servingButtonTextActive: {
    color: colors.white,
  },

  // Ingredients Panel
  ingredientsPanel: {
    backgroundColor: colors.surface,
    marginHorizontal: newSpacing.md,
    marginTop: newSpacing.md,
    borderRadius: newBorderRadius.lg,
    padding: newSpacing.md,
    maxHeight: 200,
  },
  ingredientsPanelTitle: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: colors.text,
    marginBottom: newSpacing.sm,
  },
  ingredientsList: {
    flex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: newSpacing.xs,
  },
  ingredientName: {
    fontSize: newTypography.sizes.sm,
    color: colors.textSecondary,
  },
  ingredientAmount: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.text,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: newSpacing.lg,
    paddingTop: newSpacing.md,
  },
  contentSpacer: {
    height: newSpacing.xl,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: newSpacing.sm,
    marginBottom: newSpacing.md,
  },
  phaseBadge: {
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.xs,
    borderRadius: newBorderRadius.full,
  },
  phasePrepBadge: {
    backgroundColor: '#4ECDC4',
  },
  phaseCookBadge: {
    backgroundColor: '#FF6B6B',
  },
  phaseFinishBadge: {
    backgroundColor: '#95E1D3',
  },
  phaseCheckBadge: {
    backgroundColor: '#FFB347',
  },
  phaseBadgeText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.bold,
    color: colors.white,
  },
  stepIndicator: {
    backgroundColor: colors.surface,
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.xs,
    borderRadius: newBorderRadius.full,
  },
  stepText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.textSecondary,
  },
  stepTitle: {
    fontSize: newTypography.sizes.xxxl,
    fontWeight: newTypography.weights.bold,
    color: colors.text,
    marginBottom: newSpacing.sm,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: newTypography.sizes.lg,
    lineHeight: 28,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: newSpacing.lg,
  },

  // Detail Steps
  detailsContainer: {
    backgroundColor: colors.surface,
    borderRadius: newBorderRadius.lg,
    padding: newSpacing.md,
    marginBottom: newSpacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: newSpacing.sm,
  },
  detailBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: newSpacing.sm,
    marginTop: 2,
  },
  detailBulletText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.bold,
    color: colors.white,
  },
  detailText: {
    flex: 1,
    fontSize: newTypography.sizes.md,
    lineHeight: 26,
    color: colors.text,
  },

  // Used Ingredients
  usedIngredientsContainer: {
    marginBottom: newSpacing.md,
  },
  usedIngredientsLabel: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.textMuted,
    marginBottom: newSpacing.xs,
  },
  usedIngredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: newSpacing.xs,
  },
  usedIngredientChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: newSpacing.sm,
    paddingVertical: newSpacing.xs,
    borderRadius: newBorderRadius.full,
  },
  usedIngredientText: {
    fontSize: newTypography.sizes.sm,
    color: colors.primary,
    fontWeight: newTypography.weights.medium,
  },

  // Tips
  tipsContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: newSpacing.lg,
    paddingVertical: newSpacing.md,
    borderRadius: newBorderRadius.lg,
    marginBottom: newSpacing.md,
  },
  tipsLabel: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.bold,
    color: '#E65100',
    marginBottom: newSpacing.xs,
  },
  tipsText: {
    fontSize: newTypography.sizes.md,
    color: '#BF360C',
    lineHeight: 24,
  },

  // Timer
  timerContainer: {
    alignItems: 'center',
    marginVertical: newSpacing.xl,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: newTypography.weights.bold,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timerDisplayWarning: {
    color: '#FF6B6B',
  },
  timerDisplayDone: {
    color: '#4CAF50',
  },
  timerDoneText: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: newSpacing.xs,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.lg,
    marginTop: newSpacing.lg,
  },
  timerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
  },
  timerAdjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: newSpacing.sm,
    paddingVertical: newSpacing.xs,
    backgroundColor: colors.surface,
    borderRadius: newBorderRadius.md,
    gap: 4,
  },
  timerAdjustText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.textSecondary,
  },

  // Read Aloud Button
  readAloudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: newSpacing.sm,
    paddingHorizontal: newSpacing.lg,
    borderRadius: newBorderRadius.full,
    marginBottom: newSpacing.md,
    gap: newSpacing.sm,
  },
  readAloudButtonText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.white,
  },

  // Photo Section
  photoSection: {
    backgroundColor: colors.surface,
    borderRadius: newBorderRadius.lg,
    padding: newSpacing.md,
    marginTop: newSpacing.md,
  },
  photoSectionTitle: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: colors.text,
    marginBottom: newSpacing.md,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: newSpacing.sm,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: newSpacing.sm,
    borderRadius: newBorderRadius.md,
    gap: newSpacing.xs,
  },
  photoButtonText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.white,
  },
  photoThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: newSpacing.sm,
    marginTop: newSpacing.md,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: newBorderRadius.md,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Photo Modal
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  photoModalImage: {
    width: '90%',
    height: '70%',
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: newSpacing.md,
    paddingBottom: newSpacing.xl,
    gap: newSpacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 88,
    borderRadius: newBorderRadius.xl,
    gap: newSpacing.sm,
  },
  prevButton: {
    backgroundColor: colors.surface,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: newTypography.sizes.xl,
    fontWeight: newTypography.weights.bold,
    color: colors.text,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  nextButtonText: {
    color: colors.white,
  },

  // Ingredient Check Step
  ingredientCheckList: {
    backgroundColor: colors.surface,
    borderRadius: newBorderRadius.lg,
    padding: newSpacing.md,
    marginTop: newSpacing.md,
  },
  ingredientCheckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: newSpacing.md,
  },
  ingredientCheckTitle: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: colors.text,
  },
  checkAllButton: {
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.xs,
    backgroundColor: colors.primary,
    borderRadius: newBorderRadius.full,
  },
  checkAllButtonText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.white,
  },
  ingredientCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: newSpacing.sm,
    paddingHorizontal: newSpacing.sm,
    borderRadius: newBorderRadius.md,
    marginBottom: newSpacing.xs,
    backgroundColor: colors.background,
  },
  ingredientCheckItemChecked: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: newSpacing.sm,
  },
  checkBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ingredientCheckName: {
    flex: 1,
    fontSize: newTypography.sizes.md,
    color: colors.text,
  },
  ingredientCheckNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  ingredientCheckAmount: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: colors.textSecondary,
  },
  ingredientCheckAmountChecked: {
    color: colors.textMuted,
  },
  ingredientCheckProgress: {
    marginTop: newSpacing.md,
    paddingTop: newSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    alignItems: 'center',
  },
  ingredientCheckProgressText: {
    fontSize: newTypography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: newTypography.weights.medium,
  },
});
