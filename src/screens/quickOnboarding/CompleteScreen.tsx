// ============================================
// Screen 6: CompleteScreen
// 完了画面 + 保存
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
import * as Haptics from 'expo-haptics';

type Props = {
  onComplete: () => void;
};

export const CompleteScreen: React.FC<Props> = ({ onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 完了のハプティクスフィードバック
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 順次アニメーション
    Animated.sequence([
      // チェックマークのスケールイン
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: false,
        }),
      ]),
      // チェックマークの描画アニメーション
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      // テキストのフェードイン
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 400,
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

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 完了アイコン */}
        <Animated.View
          style={[
            styles.checkContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.checkCircle}>
            <Text style={styles.checkEmoji}>🎉</Text>
          </View>
        </Animated.View>

        {/* メッセージ */}
        <Animated.View style={[styles.messageContainer, { opacity: textAnim }]}>
          <Text style={styles.mainText}>準備完了！</Text>
          <Text style={styles.subText}>
            あなたの好みを覚えたよ{'\n'}
            明日からも「何作ろう」って{'\n'}
            聞いてくれたら考えるね
          </Text>
        </Animated.View>

        {/* 特徴リスト */}
        <Animated.View style={[styles.featureContainer, { opacity: textAnim }]}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🍳</Text>
            <Text style={styles.featureText}>全部ワンパンで作れる</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📅</Text>
            <Text style={styles.featureText}>1週間まとめて考える</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🛒</Text>
            <Text style={styles.featureText}>買い物リストも自動で作る</Text>
          </View>
        </Animated.View>

        {/* スタートボタン */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>使ってみる</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  checkContainer: {
    marginBottom: 32,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkEmoji: {
    fontSize: 48,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  subText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  featureContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  startButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
