// ============================================
// STEP 0: CatchScreen (0:00–0:20)
// ワンメッセージ導入
// 「3分で、あなたの献立を決めます」
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

type Props = {
  navigation: NativeStackNavigationProp<QuickOnboardingStackParamList, 'Catch'>;
};

export const CatchScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // テキストのフェードイン → ボタンのフェードイン
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Question1');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* メインメッセージ - これだけ */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.mainText}>
            3分で、{'\n'}あなたの献立を決めます
          </Text>
        </Animated.View>

        {/* ボタン - 「はじめる」のみ */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonFadeAnim }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>はじめる</Text>
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
  textContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  mainText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
  primaryButton: {
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
