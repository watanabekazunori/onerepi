// ============================================
// STEP 1 Q2: Question2Screen (0:50–1:20)
// 超軽量・心理タイプ診断（2問中2問目）
// 「知らない料理を見つけたら？」
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
import { QuickAnswer } from '../../lib/quickOnboarding';

type Props = {
  navigation: NativeStackNavigationProp<QuickOnboardingStackParamList, 'Question2'>;
  onAnswer: (answer: QuickAnswer) => void;
};

export const Question2Screen: React.FC<Props> = ({ navigation, onAnswer }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const optionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      Animated.timing(optionAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleSelect = (answer: QuickAnswer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAnswer(answer);
    navigation.navigate('Thinking');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 質問カード */}
        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.questionText}>
            知らない料理を見つけたら？
          </Text>
        </Animated.View>

        {/* 選択肢 */}
        <Animated.View style={[styles.optionsContainer, { opacity: optionAnim }]}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleSelect('A')}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>定番が安心</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleSelect('B')}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>ちょっと試したい</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 進捗インジケーター */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotComplete]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  questionText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 38,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    gap: 16,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 60,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#FF6B35',
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: '#10B981',
  },
});
