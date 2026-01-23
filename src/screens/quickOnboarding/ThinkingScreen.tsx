// ============================================
// Screen 3: ThinkingScreen
// 考え中アニメーション
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { QuickOnboardingStackParamList } from './QuickOnboardingNavigator';

type Props = {
  navigation: NativeStackNavigationProp<QuickOnboardingStackParamList, 'Thinking'>;
};

export const ThinkingScreen: React.FC<Props> = ({ navigation }) => {
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(1)).current;

  const thinkingTexts = [
    '考え中...',
    'あなたの好みを分析中...',
    '献立を組み立て中...',
  ];
  const [textIndex, setTextIndex] = React.useState(0);

  useEffect(() => {
    // テキストフェードイン
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();

    // ドットのバウンスアニメーション
    const createBounce = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
    };

    const bounce1 = createBounce(dotAnim1, 0);
    const bounce2 = createBounce(dotAnim2, 150);
    const bounce3 = createBounce(dotAnim3, 300);

    bounce1.start();
    bounce2.start();
    bounce3.start();

    // テキスト切り替え
    const textInterval = setInterval(() => {
      Animated.timing(textFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setTextIndex((prev) => (prev + 1) % thinkingTexts.length);
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }, 1500);

    // 2.5秒後に次の画面へ
    const timer = setTimeout(() => {
      navigation.replace('TodayMeal');
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(textInterval);
      bounce1.stop();
      bounce2.stop();
      bounce3.stop();
    };
  }, []);

  const getDotStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* アニメーションドット */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, getDotStyle(dotAnim1)]} />
          <Animated.View style={[styles.dot, getDotStyle(dotAnim2)]} />
          <Animated.View style={[styles.dot, getDotStyle(dotAnim3)]} />
        </View>

        {/* 考え中テキスト */}
        <Animated.Text style={[styles.thinkingText, { opacity: textFadeAnim }]}>
          {thinkingTexts[textIndex]}
        </Animated.Text>
      </Animated.View>
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
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF8C00',
  },
  thinkingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
});
