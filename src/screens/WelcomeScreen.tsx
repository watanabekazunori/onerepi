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
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// App Icon Logo (右下のデザイン - どーんと大きく)
const AppIconLogo = ({ size = 160 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Rounded square background */}
    <Rect x="0" y="0" width="100" height="100" rx="24" fill={brandColors.primary} />

    {/* Frying pan */}
    <G transform="translate(12, 18)">
      {/* Pan body (circle) - outer */}
      <Circle cx="32" cy="35" r="30" fill="none" stroke={brandColors.white} strokeWidth="4" />
      {/* Pan body (circle) - inner */}
      <Circle cx="32" cy="35" r="20" fill="none" stroke={brandColors.white} strokeWidth="2" opacity="0.7" />

      {/* Handle */}
      <Path
        d="M62 35 L82 27"
        stroke={brandColors.white}
        strokeWidth="7"
        strokeLinecap="round"
      />
    </G>
  </Svg>
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
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
          {/* Logo Section - どーん！ */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <AppIconLogo size={SCREEN_WIDTH * 0.45} />

            {/* Text Logo */}
            <View style={styles.textLogoContainer}>
              <Text style={styles.logoText}>ONEREPI</Text>
              <Text style={styles.logoSubtext}>ワンレピ</Text>
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>
              毎日の献立を、{'\n'}もっとかんたんに
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
    marginTop: 28,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: brandColors.primary,
    letterSpacing: 3,
  },
  logoSubtext: {
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.primary,
    marginTop: 6,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 28,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  signUpButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.white,
    letterSpacing: 0.5,
  },
  loginButton: {
    backgroundColor: brandColors.white,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: brandColors.primary,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.primary,
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 12,
    fontWeight: '400',
    color: brandColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
