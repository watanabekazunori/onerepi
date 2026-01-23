// ============================================
// QuickOnboardingNavigator
// 初回3分体験のナビゲーションコンテナ
// ============================================

import React, { useState, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatchScreen } from './CatchScreen';
import { Question1Screen } from './Question1Screen';
import { Question2Screen } from './Question2Screen';
import { ThinkingScreen } from './ThinkingScreen';
import { TodayMealScreen } from './TodayMealScreen';
import { WeekPreviewScreen } from './WeekPreviewScreen';
import { CompleteScreen } from './CompleteScreen';
import {
  QuickAnswer,
  QuickOnboardingAnswers,
  TodayMealResult,
  WeekVibesResult,
  inferQuickType,
  generateQuickReason,
  generateTodayMeal,
  generateWeekVibes,
  saveQuickOnboardingResult,
} from '../../lib/quickOnboarding';

export type QuickOnboardingStackParamList = {
  Catch: undefined;
  Question1: undefined;
  Question2: undefined;
  Thinking: undefined;
  TodayMeal: undefined;
  WeekPreview: undefined;
  Complete: undefined;
};

const Stack = createNativeStackNavigator<QuickOnboardingStackParamList>();

type Props = {
  onComplete: () => void;
};

export const QuickOnboardingNavigator: React.FC<Props> = ({ onComplete }) => {
  // 回答状態
  const [answers, setAnswers] = useState<QuickOnboardingAnswers>({
    q1: null,
    q2: null,
  });

  // 生成された結果
  const [reason, setReason] = useState<string>('');
  const [todayMeal, setTodayMeal] = useState<TodayMealResult | null>(null);
  const [weekVibes, setWeekVibes] = useState<WeekVibesResult | null>(null);

  // Q1回答ハンドラ
  const handleQ1Answer = useCallback((answer: QuickAnswer) => {
    setAnswers((prev) => ({ ...prev, q1: answer }));
  }, []);

  // Q2回答ハンドラ（回答後に結果を生成）
  const handleQ2Answer = useCallback(
    (answer: QuickAnswer) => {
      const newAnswers: QuickOnboardingAnswers = { ...answers, q1: answers.q1, q2: answer };
      setAnswers(newAnswers);

      // 結果を生成
      const inferredType = inferQuickType(newAnswers);
      const generatedReason = generateQuickReason(newAnswers);
      const generatedMeal = generateTodayMeal(inferredType, newAnswers);
      const generatedVibes = generateWeekVibes(inferredType);

      setReason(generatedReason);
      setTodayMeal(generatedMeal);
      setWeekVibes(generatedVibes);
    },
    [answers]
  );

  // 完了ハンドラ
  const handleComplete = useCallback(async () => {
    // 結果を保存
    const inferredType = inferQuickType(answers);
    await saveQuickOnboardingResult({
      answers,
      inferredType,
      reason,
      todayMeal: todayMeal!,
      weekVibes: weekVibes!,
      completedAt: new Date().toISOString(),
    });

    // メイン画面へ
    onComplete();
  }, [answers, reason, todayMeal, weekVibes, onComplete]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Catch">
        {(props) => <CatchScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen name="Question1">
        {(props) => <Question1Screen {...props} onAnswer={handleQ1Answer} />}
      </Stack.Screen>

      <Stack.Screen name="Question2">
        {(props) => <Question2Screen {...props} onAnswer={handleQ2Answer} />}
      </Stack.Screen>

      <Stack.Screen name="Thinking">
        {(props) => <ThinkingScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen name="TodayMeal">
        {(props) => (
          <TodayMealScreen
            {...props}
            todayMeal={todayMeal || generateTodayMeal('balanced', answers)}
            reason={reason || '今日は手軽に美味しく'}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="WeekPreview">
        {(props) => (
          <WeekPreviewScreen
            {...props}
            weekVibes={weekVibes || generateWeekVibes('balanced')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Complete">
        {() => <CompleteScreen onComplete={handleComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
