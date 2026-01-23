// ============================================
// Screen 5: WeekPreviewScreen
// 来週の雰囲気プレビュー
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
import * as Haptics from 'expo-haptics';
import { QuickOnboardingStackParamList } from './QuickOnboardingNavigator';
import { WeekVibesResult } from '../../lib/quickOnboarding';

type Props = {
  navigation: NativeStackNavigationProp<QuickOnboardingStackParamList, 'WeekPreview'>;
  weekVibes: WeekVibesResult;
};

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

export const WeekPreviewScreen: React.FC<Props> = ({ navigation, weekVibes }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const dayAnims = useRef(DAY_LABELS.map(() => new Animated.Value(0))).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 順次アニメーション
    Animated.sequence([
      // タイトルのフェードイン
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
      // 各日のカードを順番にフェードイン
      Animated.stagger(
        80,
        dayAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          })
        )
      ),
      // ボタンのフェードイン
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
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.headerText}>来週はこんな感じ</Text>
          <Text style={styles.subHeaderText}>毎日考えなくても大丈夫</Text>
        </Animated.View>

        {/* 週間カード */}
        <View style={styles.weekContainer}>
          {weekVibes.days.map((day, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dayCard,
                day.isOffDay && styles.dayCardOff,
                { opacity: dayAnims[index] },
              ]}
            >
              <Text style={[styles.dayLabel, day.isOffDay && styles.dayLabelOff]}>
                {DAY_LABELS[index]}
              </Text>
              {day.isOffDay ? (
                <View style={styles.offDayContent}>
                  <Text style={styles.offDayEmoji}>🛋️</Text>
                  <Text style={styles.offDayText}>お休み</Text>
                </View>
              ) : (
                <View style={styles.dayContent}>
                  <Text style={styles.dayEmoji}>{day.emoji}</Text>
                  <Text style={styles.dayVibe}>{day.vibe}</Text>
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        {/* サマリー */}
        <Animated.View style={[styles.summaryCard, { opacity: buttonAnim }]}>
          <Text style={styles.summaryEmoji}>✨</Text>
          <Text style={styles.summaryText}>{weekVibes.summary}</Text>
        </Animated.View>

        {/* 次へボタン */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>この感じで始める</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#6B7280',
  },
  weekContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  dayCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  dayCardOff: {
    backgroundColor: '#F9FAFB',
    opacity: 0.8,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C00',
    marginBottom: 8,
  },
  dayLabelOff: {
    color: '#9CA3AF',
  },
  dayContent: {
    alignItems: 'center',
  },
  dayEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  dayVibe: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
  offDayContent: {
    alignItems: 'center',
  },
  offDayEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  offDayText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  summaryCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  summaryEmoji: {
    fontSize: 24,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#F57C00',
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
