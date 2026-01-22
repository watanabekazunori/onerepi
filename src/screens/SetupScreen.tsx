// ============================================
// Onerepi - Setup Screen
// Multi-step setup for user preferences
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { ChevronLeft, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { supabaseService } from '../lib/supabase-service';

const { width } = Dimensions.get('window');

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

type SetupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Setup'>;
};

type ExperienceLevel = 'beginner' | 'normal' | 'expert';
type CookingTime = '10' | '20' | '30';
type Interest = 'quick' | 'saving' | 'health' | 'easy';

// Common seasonings list
const SEASONINGS = [
  { id: 'salt', label: '塩', emoji: '🧂' },
  { id: 'pepper', label: 'こしょう', emoji: '🌶️' },
  { id: 'soy_sauce', label: '醤油', emoji: '🫘' },
  { id: 'miso', label: '味噌', emoji: '🥣' },
  { id: 'mirin', label: 'みりん', emoji: '🍶' },
  { id: 'sake', label: '料理酒', emoji: '🍶' },
  { id: 'sugar', label: '砂糖', emoji: '🍬' },
  { id: 'vinegar', label: '酢', emoji: '🫗' },
  { id: 'oil', label: 'サラダ油', emoji: '🫒' },
  { id: 'sesame_oil', label: 'ごま油', emoji: '🥜' },
  { id: 'olive_oil', label: 'オリーブオイル', emoji: '🫒' },
  { id: 'butter', label: 'バター', emoji: '🧈' },
  { id: 'mayonnaise', label: 'マヨネーズ', emoji: '🥫' },
  { id: 'ketchup', label: 'ケチャップ', emoji: '🍅' },
  { id: 'worcester', label: 'ウスターソース', emoji: '🥫' },
  { id: 'oyster_sauce', label: 'オイスターソース', emoji: '🦪' },
  { id: 'dashi', label: 'だしの素', emoji: '🐟' },
  { id: 'consomme', label: 'コンソメ', emoji: '🍲' },
  { id: 'chicken_stock', label: '鶏がらスープの素', emoji: '🐔' },
  { id: 'garlic', label: 'にんにく', emoji: '🧄' },
  { id: 'ginger', label: '生姜', emoji: '🫚' },
  { id: 'chili', label: '唐辛子/一味', emoji: '🌶️' },
];

// Small frying pan icon
const FryingPanIcon = ({ size = 48 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="20" cy="24" r="14" fill={brandColors.primary} />
    <Circle cx="20" cy="24" r="10" fill="none" stroke={brandColors.white} strokeWidth="2" />
    <Path d="M34 24 L44 21" stroke={brandColors.primary} strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

// Progress indicator
const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <View style={styles.progressContainer}>
    {Array.from({ length: totalSteps }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.progressDot,
          index < currentStep && styles.progressDotCompleted,
          index === currentStep && styles.progressDotActive,
        ]}
      />
    ))}
  </View>
);

export const SetupScreen: React.FC<SetupScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [cookingTime, setCookingTime] = useState<CookingTime | null>(null);
  const [interests, setInterests] = useState<Set<Interest>>(new Set());
  const [seasonings, setSeasonings] = useState<Set<string>>(new Set());

  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = 5; // Name, Experience, Time, Interests, Seasonings

  const experienceOptions: { value: ExperienceLevel; emoji: string; label: string; desc: string }[] = [
    { value: 'beginner', emoji: '🔰', label: '初心者', desc: 'これから料理を始めたい' },
    { value: 'normal', emoji: '👨‍🍳', label: 'ふつう', desc: '基本的な料理はできる' },
    { value: 'expert', emoji: '⭐', label: '得意', desc: '料理が好きでよく作る' },
  ];

  const timeOptions: { value: CookingTime; label: string; desc: string }[] = [
    { value: '10', label: '〜10分', desc: 'パパッと時短で' },
    { value: '20', label: '〜20分', desc: 'ちょうどいい時間' },
    { value: '30', label: '30分以上', desc: 'じっくり料理したい' },
  ];

  const interestOptions: { value: Interest; emoji: string; label: string }[] = [
    { value: 'quick', emoji: '⏱', label: '時短' },
    { value: 'saving', emoji: '💰', label: '節約' },
    { value: 'health', emoji: '💪', label: '健康' },
    { value: 'easy', emoji: '✨', label: '簡単' },
  ];

  const animateToStep = (step: number) => {
    Animated.timing(slideAnim, {
      toValue: -step * width,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCurrentStep(step);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < totalSteps - 1) {
      animateToStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      animateToStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Save to Supabase
      await supabaseService.saveUserProfile({
        name: name.trim() || 'ユーザー',
        cooking_skill: experience || 'beginner',
        cooking_time_preference: cookingTime || '20',
        interests: Array.from(interests),
        seasonings: Array.from(seasonings),
      });

      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Still navigate even if save fails (will use local storage fallback)
      navigation.replace('MainTabs');
    }
  };

  const handleSeasoningToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSeasonings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllSeasonings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (seasonings.size === SEASONINGS.length) {
      setSeasonings(new Set());
    } else {
      setSeasonings(new Set(SEASONINGS.map(s => s.id)));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return name.trim().length > 0;
      case 1: return experience !== null;
      case 2: return cookingTime !== null;
      case 3: return true; // interests are optional
      case 4: return true; // seasonings are optional
      default: return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'お名前を教えてください';
      case 1: return '料理の経験は？';
      case 2: return '1食の調理時間は？';
      case 3: return '気になるポイントは？';
      case 4: return '持っている調味料は？';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 0: return 'ニックネームでOKです';
      case 1: return 'あなたに合ったレシピをおすすめします';
      case 2: return '目安の時間を選んでください';
      case 3: return '複数選択できます（スキップ可）';
      case 4: return '選択した調味料でレシピを提案します';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.white} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {currentStep > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={brandColors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          <View style={styles.backButton} />
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
        >
          <View style={styles.titleContainer}>
            <FryingPanIcon size={48} />
            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
          </View>

          <Animated.View
            style={[
              styles.slidesContainer,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            {/* Step 0: Name */}
            <View style={styles.slide}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="例：たろう"
                  placeholderTextColor={brandColors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={20}
                />
              </View>
            </View>

            {/* Step 1: Experience */}
            <View style={styles.slide}>
              <View style={styles.optionsContainer}>
                {experienceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.experienceCard,
                      experience === option.value && styles.experienceCardSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExperience(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.experienceEmoji}>{option.emoji}</Text>
                    <View style={styles.experienceTextContainer}>
                      <Text
                        style={[
                          styles.experienceLabel,
                          experience === option.value && styles.experienceLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.experienceDesc}>{option.desc}</Text>
                    </View>
                    {experience === option.value && (
                      <Check size={20} color={brandColors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Step 2: Cooking Time */}
            <View style={styles.slide}>
              <View style={styles.optionsContainer}>
                {timeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeCard,
                      cookingTime === option.value && styles.timeCardSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCookingTime(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeLabel,
                        cookingTime === option.value && styles.timeLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.timeDesc}>{option.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Step 3: Interests */}
            <View style={styles.slide}>
              <View style={styles.interestsGrid}>
                {interestOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.interestChip,
                      interests.has(option.value) && styles.interestChipSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setInterests((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(option.value)) {
                          newSet.delete(option.value);
                        } else {
                          newSet.add(option.value);
                        }
                        return newSet;
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.interestEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.interestLabel,
                        interests.has(option.value) && styles.interestLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Step 4: Seasonings */}
            <View style={styles.slide}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAllSeasonings}
              >
                <Text style={styles.selectAllText}>
                  {seasonings.size === SEASONINGS.length ? 'すべて解除' : 'すべて選択'}
                </Text>
              </TouchableOpacity>
              <ScrollView
                style={styles.seasoningsScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.seasoningsContent}
              >
                <View style={styles.seasoningsGrid}>
                  {SEASONINGS.map((seasoning) => (
                    <TouchableOpacity
                      key={seasoning.id}
                      style={[
                        styles.seasoningChip,
                        seasonings.has(seasoning.id) && styles.seasoningChipSelected,
                      ]}
                      onPress={() => handleSeasoningToggle(seasoning.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.seasoningEmoji}>{seasoning.emoji}</Text>
                      <Text
                        style={[
                          styles.seasoningLabel,
                          seasonings.has(seasoning.id) && styles.seasoningLabelSelected,
                        ]}
                      >
                        {seasoning.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            activeOpacity={0.9}
            disabled={!canProceed()}
          >
            <Text
              style={[
                styles.nextButtonText,
                !canProceed() && styles.nextButtonTextDisabled,
              ]}
            >
              {currentStep === totalSteps - 1 ? 'はじめる' : '次へ'}
            </Text>
          </TouchableOpacity>

          {(currentStep === 3 || currentStep === 4) && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleNext}
            >
              <Text style={styles.skipButtonText}>スキップ</Text>
            </TouchableOpacity>
          )}
        </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brandColors.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: brandColors.primary,
  },
  progressDotCompleted: {
    backgroundColor: brandColors.success,
  },
  contentContainer: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  slidesContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  slide: {
    width,
    paddingHorizontal: 24,
  },
  inputWrapper: {
    marginTop: 20,
  },
  nameInput: {
    backgroundColor: brandColors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: '600',
    color: brandColors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: brandColors.border,
  },
  optionsContainer: {
    gap: 12,
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  experienceCardSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  experienceEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  experienceTextContainer: {
    flex: 1,
  },
  experienceLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.text,
  },
  experienceLabelSelected: {
    color: brandColors.primary,
  },
  experienceDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: brandColors.textMuted,
    marginTop: 2,
  },
  timeCard: {
    backgroundColor: brandColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  timeCardSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  timeLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.text,
  },
  timeLabelSelected: {
    color: brandColors.primary,
  },
  timeDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: brandColors.textMuted,
    marginTop: 4,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestChipSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  interestEmoji: {
    fontSize: 24,
  },
  interestLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.textSecondary,
  },
  interestLabelSelected: {
    color: brandColors.primary,
  },
  selectAllButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.primary,
  },
  seasoningsScroll: {
    flex: 1,
    marginBottom: 20,
  },
  seasoningsContent: {
    paddingBottom: 20,
  },
  seasoningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  seasoningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  seasoningChipSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  seasoningEmoji: {
    fontSize: 16,
  },
  seasoningLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
  seasoningLabelSelected: {
    color: brandColors.primary,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: brandColors.white,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  nextButton: {
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
  nextButtonDisabled: {
    backgroundColor: brandColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.white,
    letterSpacing: 0.5,
  },
  nextButtonTextDisabled: {
    color: brandColors.textMuted,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: brandColors.textMuted,
  },
});
