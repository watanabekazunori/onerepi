// ============================================
// Screen 4: TodayMealScreen
// 今日の献立表示
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { QuickOnboardingStackParamList } from './QuickOnboardingNavigator';
import { TodayMealResult } from '../../lib/quickOnboarding';

type Props = {
  navigation: NativeStackNavigationProp<QuickOnboardingStackParamList, 'TodayMeal'>;
  todayMeal: TodayMealResult;
  reason: string;
};

export const TodayMealScreen: React.FC<Props> = ({ navigation, todayMeal, reason }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 順次アニメーション
    Animated.sequence([
      // 理由テキストのフェードイン
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
      // 献立カードのフェードイン
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      // ボタンのフェードイン
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('WeekPreview');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 理由テキスト */}
        <Animated.View
          style={[
            styles.reasonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.reasonText}>{reason}</Text>
          <Text style={styles.soText}>だから...</Text>
        </Animated.View>

        {/* 献立カード */}
        <Animated.View style={[styles.mealCard, { opacity: cardAnim }]}>
          <Text style={styles.todayLabel}>今日はこれ！</Text>

          {/* メイン料理 */}
          <View style={styles.dishContainer}>
            <Text style={styles.dishEmoji}>{todayMeal.mainDish.emoji}</Text>
            <View style={styles.dishInfo}>
              <Text style={styles.dishName}>{todayMeal.mainDish.name}</Text>
              <View style={styles.tagContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>🍳 ワンパン</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>⏱ {todayMeal.mainDish.cookTime}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* サイドメニュー */}
          {todayMeal.sideDish && (
            <View style={styles.sideContainer}>
              <Text style={styles.sideLabel}>＋おまけ</Text>
              <Text style={styles.sideName}>
                {todayMeal.sideDish.emoji} {todayMeal.sideDish.name}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* 次へボタン */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>来週の雰囲気も見る</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  reasonContainer: {
    marginBottom: 24,
  },
  reasonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
  },
  soText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 16,
  },
  dishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dishEmoji: {
    fontSize: 56,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F57C00',
  },
  sideContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sideLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  sideName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  buttonContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
