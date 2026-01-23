// ============================================
// Screen 1: Question1Screen
// 「疲れて帰った夜、どうしたい？」
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
  navigation: NativeStackNavigationProp<QuickOnboardingStackParamList, 'Question1'>;
  onAnswer: (answer: QuickAnswer) => void;
};

export const Question1Screen: React.FC<Props> = ({ navigation, onAnswer }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleSelect = (answer: QuickAnswer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAnswer(answer);
    navigation.navigate('Question2');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.introText}>
            いくつか答えてくれたら{'\n'}今日と今週のごはんを決めるよ
          </Text>
        </Animated.View>

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
            疲れて帰った夜、どうしたい？
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSelect('A')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>⚡</Text>
              <Text style={styles.optionText}>とにかく早く終わらせたい</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSelect('B')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>🍲</Text>
              <Text style={styles.optionText}>美味しいもので回復したい</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 進捗インジケーター */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
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
  headerContainer: {
    marginBottom: 40,
  },
  introText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 340,
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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
    backgroundColor: '#FF8C00',
    width: 24,
  },
});
