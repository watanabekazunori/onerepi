// ============================================
// STEP 2: ThinkingScreen (1:20–2:20)
// 献立が"考えられている体験"
// 「あなたの答えをもとに、今週の献立を考えています…」
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
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 内部処理の進捗を表現するテキスト
  const thinkingTexts = [
    'あなたの答えをもとに…',
    '今週の献立を考えています…',
    '被りがないかチェック中…',
  ];
  const [textIndex, setTextIndex] = React.useState(0);

  useEffect(() => {
    // フェードイン
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();

    // プログレスバーアニメーション
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // ドットのバウンスアニメーション
    const createBounce = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
    };

    const bounce1 = createBounce(dotAnim1, 0);
    const bounce2 = createBounce(dotAnim2, 120);
    const bounce3 = createBounce(dotAnim3, 240);

    bounce1.start();
    bounce2.start();
    bounce3.start();

    // テキスト切り替え（段階的に進行を表現）
    const textInterval = setInterval(() => {
      Animated.timing(textFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start(() => {
        setTextIndex((prev) => Math.min(prev + 1, thinkingTexts.length - 1));
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start();
      });
    }, 900);

    // 3秒後に次の画面へ（献立生成完了）
    const timer = setTimeout(() => {
      navigation.replace('TodayMeal');
    }, 3000);

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
          outputRange: [0, -10],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.4, 1, 0.4],
    }),
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* メインテキスト（固定） */}
        <Text style={styles.mainText}>
          あなたの答えをもとに、{'\n'}今週の献立を考えています…
        </Text>

        {/* アニメーションドット */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, getDotStyle(dotAnim1)]} />
          <Animated.View style={[styles.dot, getDotStyle(dotAnim2)]} />
          <Animated.View style={[styles.dot, getDotStyle(dotAnim3)]} />
        </View>

        {/* 進捗テキスト（切り替わり） */}
        <Animated.Text style={[styles.thinkingText, { opacity: textFadeAnim }]}>
          {thinkingTexts[textIndex]}
        </Animated.Text>

        {/* プログレスバー */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
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
    paddingHorizontal: 32,
  },
  mainText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
  },
  thinkingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 32,
  },
  progressBarContainer: {
    width: '80%',
    maxWidth: 240,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
});
