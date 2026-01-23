// ============================================
// STEP 4-5: CompleteScreen (2:50–3:10+)
// 理解度％を"初めて見せる" + CTA
//
// 表示:
// 理解度 48% → 70%
// 「ここまで、だいたい分かりました」
//
// CTA: 「この献立で1週間いく」
// ============================================

import React, { useEffect, useRef, useState } from 'react';
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
  initialUnderstanding?: number; // 初期表示値（デフォルト48）
  finalUnderstanding?: number;   // 最終表示値（デフォルト70）
};

export const CompleteScreen: React.FC<Props> = ({
  onComplete,
  initialUnderstanding = 48,
  finalUnderstanding = 70,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(initialUnderstanding / 100)).current;
  const messageAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const [displayPercentage, setDisplayPercentage] = useState(initialUnderstanding);

  useEffect(() => {
    // 完了のハプティクスフィードバック
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 順次アニメーション
    Animated.sequence([
      // 1. 理解度ラベルとプログレスバーのフェードイン
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      // 2. プログレスバーが48%→70%にアニメーション
      Animated.timing(progressAnim, {
        toValue: finalUnderstanding / 100,
        duration: 1200,
        useNativeDriver: false,
      }),
      // 3. メッセージのフェードイン
      Animated.timing(messageAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      // 4. ボタンのフェードイン
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // プログレスバーのアニメーションに合わせて数値を更新
    const startTime = Date.now();
    const duration = 1700; // フェードイン500 + プログレス1200
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        // 最初の500msはフェードイン中
        return;
      }
      const progressElapsed = elapsed - 500;
      const progressRatio = Math.min(progressElapsed / 1200, 1);
      const currentValue = Math.round(
        initialUnderstanding + (finalUnderstanding - initialUnderstanding) * progressRatio
      );
      setDisplayPercentage(currentValue);
      if (progressRatio >= 1) {
        clearInterval(updateInterval);
      }
    }, 30);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 理解度セクション */}
        <Animated.View style={[styles.understandingSection, { opacity: fadeAnim }]}>
          <Text style={styles.understandingLabel}>理解度</Text>

          {/* 数値 */}
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageValue}>{displayPercentage}</Text>
            <Text style={styles.percentageSymbol}>%</Text>
          </View>

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

          {/* 上限マーカー */}
          <View style={styles.capMarkerContainer}>
            <View style={[styles.capMarker, { left: '70%' }]} />
            <Text style={styles.capMarkerLabel}>Free上限</Text>
          </View>
        </Animated.View>

        {/* メッセージ */}
        <Animated.View style={[styles.messageContainer, { opacity: messageAnim }]}>
          <Text style={styles.mainMessage}>
            ここまで、だいたい分かりました
          </Text>
          <Text style={styles.subMessage}>
            使うほど、あなたに近づきます
          </Text>
        </Animated.View>

        {/* CTAボタン */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>この献立で1週間いく</Text>
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
    paddingHorizontal: 32,
  },

  // 理解度セクション
  understandingSection: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 40,
  },
  understandingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  percentageValue: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: -2,
  },
  percentageSymbol: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 6,
  },
  capMarkerContainer: {
    width: '100%',
    position: 'relative',
    marginTop: 8,
  },
  capMarker: {
    position: 'absolute',
    top: -20,
    width: 2,
    height: 8,
    backgroundColor: '#9CA3AF',
    transform: [{ translateX: -1 }],
  },
  capMarkerLabel: {
    position: 'absolute',
    top: -8,
    right: 0,
    fontSize: 11,
    color: '#9CA3AF',
  },

  // メッセージ
  messageContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  mainMessage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },

  // ボタン
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
