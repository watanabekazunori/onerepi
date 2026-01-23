// ============================================
// STEP 3: TodayMealScreen (2:20–2:50)
// 部分的な成功体験（重要）
// 今日・明日・明後日の3日分だけ表示
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { QuickOnboardingStackParamList } from './QuickOnboardingNavigator';
import { ThreeDayMealResult } from '../../lib/quickOnboarding';

type Props = {
  navigation: NativeStackNavigationProp<QuickOnboardingStackParamList, 'TodayMeal'>;
  threeDayMeals: ThreeDayMealResult;
  reason: string;
};

// 曜日ラベル生成
const getDayLabel = (offset: number): string => {
  if (offset === 0) return '今日';
  if (offset === 1) return '明日';
  if (offset === 2) return '明後日';
  return '';
};

export const TodayMealScreen: React.FC<Props> = ({ navigation, threeDayMeals, reason }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 順次アニメーション: タイトル → カード1 → カード2 → カード3 → ボタン
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(card1Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(card2Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(card3Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Complete');
  };

  const cardAnims = [card1Anim, card2Anim, card3Anim];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.headerText}>
            あなたの好みに合わせて{'\n'}3日分、考えました
          </Text>
        </Animated.View>

        {/* 3日分の献立カード */}
        <View style={styles.cardsContainer}>
          {threeDayMeals.days.map((day, index) => (
            <Animated.View
              key={index}
              style={[
                styles.mealCard,
                { opacity: cardAnims[index] },
              ]}
            >
              {/* 日付ラベル */}
              <View style={styles.dayLabelContainer}>
                <Text style={styles.dayLabel}>{getDayLabel(index)}</Text>
              </View>

              {/* メイン料理 */}
              <View style={styles.dishRow}>
                <Text style={styles.dishEmoji}>{day.emoji}</Text>
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{day.name}</Text>
                  <Text style={styles.dishTime}>{day.cookTime}</Text>
                </View>
              </View>

              {/* マッチ理由チェックリスト */}
              <View style={styles.matchReasons}>
                {day.matchReasons.map((reasonText, reasonIndex) => (
                  <View key={reasonIndex} style={styles.matchReasonItem}>
                    <Check size={14} color="#10B981" strokeWidth={3} />
                    <Text style={styles.matchReasonText}>{reasonText}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* 次へボタン */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>いい感じ！</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 32,
  },
  cardsContainer: {
    gap: 16,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dayLabelContainer: {
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B35',
    textTransform: 'uppercase',
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dishEmoji: {
    fontSize: 44,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dishTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  matchReasons: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  matchReasonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  buttonContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
