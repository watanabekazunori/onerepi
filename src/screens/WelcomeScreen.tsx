// ============================================
// Onerepi - Welcome Screen
// シンプルなロゴとログイン/新規登録
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';

// Brand Colors
const brandColors = {
  primary: '#D4490F',
  primaryLight: '#E8601F',
  primarySoft: '#FFF0E8',
  cream: '#FFF8E7',
  text: '#2D1810',
  textSecondary: '#5D4037',
  textMuted: '#A1887F',
  white: '#FFFFFF',
  border: '#F0E6DE',
};

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

// App Icon Logo (固定サイズ)
const AppIconLogo = ({ size = 140 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Rounded square background */}
    <Rect x="0" y="0" width="100" height="100" rx="24" fill={brandColors.primary} />

    {/* Frying pan */}
    <G transform="translate(12, 18)">
      {/* Pan body (circle) - outer */}
      <Circle cx="32" cy="35" r="28" fill="none" stroke={brandColors.white} strokeWidth="4" />
      {/* Pan body (circle) - inner */}
      <Circle cx="32" cy="35" r="18" fill="none" stroke={brandColors.white} strokeWidth="2" opacity="0.6" />

      {/* Handle */}
      <Path
        d="M60 35 L78 28"
        stroke={brandColors.white}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </G>
  </Svg>
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('OnboardingSlides');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.white} />

      <SafeAreaView style={styles.safeArea}>
        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <AppIconLogo size={140} />

            {/* Text Logo */}
            <View style={styles.textLogoContainer}>
              <Text style={styles.logoText}>ONEREPI</Text>
              <Text style={styles.logoSubtext}>ワンレピ</Text>
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>
              毎日の献立を、もっとかんたんに
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Buttons */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: buttonAnim,
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Sign Up Button (Primary) */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            activeOpacity={0.9}
          >
            <Text style={styles.signUpButtonText}>新規アカウント登録</Text>
          </TouchableOpacity>

          {/* Login Button (Secondary) */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>ログイン</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            続行することで、利用規約とプライバシーポリシーに{'\n'}同意したことになります
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
  },
  textLogoContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: brandColors.primary,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.primary,
    marginTop: 4,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  signUpButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.white,
  },
  loginButton: {
    backgroundColor: brandColors.white,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: brandColors.primary,
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.primary,
  },
  termsText: {
    fontSize: 11,
    fontWeight: '400',
    color: brandColors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
