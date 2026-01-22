// ============================================
// Onerepi - Setup Screen (All-in-One)
// Single page setup for user preferences
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { Check, ChefHat } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { supabaseService } from '../lib/supabase-service';

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
  { id: 'dashi', label: 'だしの素', emoji: '🐟' },
  { id: 'consomme', label: 'コンソメ', emoji: '🍲' },
  { id: 'chicken_stock', label: '鶏がらスープ', emoji: '🐔' },
  { id: 'garlic', label: 'にんにく', emoji: '🧄' },
];

// Small frying pan icon
const FryingPanIcon = ({ size = 48 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="20" cy="24" r="14" fill={brandColors.primary} />
    <Circle cx="20" cy="24" r="10" fill="none" stroke={brandColors.white} strokeWidth="2" />
    <Path d="M34 24 L44 21" stroke={brandColors.primary} strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

export const SetupScreen: React.FC<SetupScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [cookingTime, setCookingTime] = useState<CookingTime | null>(null);
  const [seasonings, setSeasonings] = useState<Set<string>>(new Set(['salt', 'soy_sauce', 'oil']));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const experienceOptions: { value: ExperienceLevel; emoji: string; label: string }[] = [
    { value: 'beginner', emoji: '🔰', label: '初心者' },
    { value: 'normal', emoji: '👨‍🍳', label: 'ふつう' },
    { value: 'expert', emoji: '⭐', label: '得意' },
  ];

  const timeOptions: { value: CookingTime; label: string }[] = [
    { value: '10', label: '〜10分' },
    { value: '20', label: '〜20分' },
    { value: '30', label: '30分〜' },
  ];

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

  const handleComplete = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await supabaseService.saveUserProfile({
        name: name.trim() || 'ユーザー',
        cooking_skill: experience || 'normal',
        cooking_time_preference: cookingTime || '20',
        interests: [],
        seasonings: Array.from(seasonings),
      });

      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Failed to save profile:', error);
      navigation.replace('MainTabs');
    }
  };

  const canProceed = name.trim().length > 0 && experience !== null && cookingTime !== null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.white} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <FryingPanIcon size={56} />
            <Text style={styles.mainTitle}>はじめまして！</Text>
            <Text style={styles.mainSubtitle}>あなたに合ったレシピを提案するために{'\n'}かんたんな質問に答えてね</Text>
          </View>

          {/* Section 1: Name */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>1</Text>
              <Text style={styles.sectionTitle}>ニックネーム</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              placeholder="例：たろう"
              placeholderTextColor={brandColors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={20}
            />
          </View>

          {/* Section 2: Experience */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>2</Text>
              <Text style={styles.sectionTitle}>料理の経験</Text>
            </View>
            <View style={styles.horizontalOptions}>
              {experienceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.experienceChip,
                    experience === option.value && styles.experienceChipSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExperience(option.value);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.experienceEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.experienceLabel,
                      experience === option.value && styles.experienceLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section 3: Cooking Time */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>3</Text>
              <Text style={styles.sectionTitle}>目安の調理時間</Text>
            </View>
            <View style={styles.horizontalOptions}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeChip,
                    cookingTime === option.value && styles.timeChipSelected,
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
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section 4: Seasonings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>4</Text>
              <View style={styles.sectionTitleRow}>
                <ChefHat size={18} color={brandColors.primary} />
                <Text style={styles.sectionTitle}>持っている調味料</Text>
              </View>
            </View>
            <Text style={styles.sectionHint}>選んだ調味料でレシピを提案します</Text>
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
                  {seasonings.has(seasoning.id) && (
                    <Check size={14} color={brandColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              (!canProceed || isSubmitting) && styles.startButtonDisabled,
            ]}
            onPress={handleComplete}
            activeOpacity={0.9}
            disabled={!canProceed || isSubmitting}
          >
            <Text
              style={[
                styles.startButtonText,
                (!canProceed || isSubmitting) && styles.startButtonTextDisabled,
              ]}
            >
              {isSubmitting ? '設定中...' : 'はじめる 🍳'}
            </Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: brandColors.text,
    marginTop: 16,
  },
  mainSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: brandColors.primary,
    color: brandColors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.text,
  },
  sectionHint: {
    fontSize: 13,
    color: brandColors.textMuted,
    marginBottom: 12,
    marginLeft: 34,
  },
  nameInput: {
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '500',
    color: brandColors.text,
    borderWidth: 2,
    borderColor: brandColors.border,
  },
  horizontalOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  experienceChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  experienceChipSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  experienceEmoji: {
    fontSize: 24,
  },
  experienceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.textSecondary,
  },
  experienceLabelSelected: {
    color: brandColors.primary,
  },
  timeChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeChipSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.textSecondary,
  },
  timeLabelSelected: {
    color: brandColors.primary,
  },
  seasoningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seasoningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  seasoningChipSelected: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  seasoningEmoji: {
    fontSize: 14,
  },
  seasoningLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
  seasoningLabelSelected: {
    color: brandColors.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
    backgroundColor: brandColors.white,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  startButton: {
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
  startButtonDisabled: {
    backgroundColor: brandColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.white,
    letterSpacing: 0.5,
  },
  startButtonTextDisabled: {
    color: brandColors.textMuted,
  },
});
