// ============================================
// Onerepi - Welcome Screen
// Illustrated splash with logo and tagline
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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Ellipse } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

// Brand Colors
const brandColors = {
  primary: '#D4490F',
  primaryLight: '#E8601F',
  cream: '#FFF8E7',
  warmBrown: '#8B7355',
  warmBrownLight: '#B89B7A',
  text: '#2D1810',
  textSecondary: '#5D4037',
};

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

// Illustrated Background with cooking items
const IllustratedBackground = () => {
  const items = [
    // Frying pan top-left
    { x: 30, y: 80, rotation: -15, scale: 0.8 },
    // Tomato top-right
    { x: width - 80, y: 60, rotation: 10, scale: 0.7, type: 'tomato' },
    // Egg mid-left
    { x: 20, y: height * 0.35, rotation: -20, scale: 0.6, type: 'egg' },
    // Herb bottom-left
    { x: 50, y: height * 0.55, rotation: 15, scale: 0.7, type: 'herb' },
    // Spoon right
    { x: width - 60, y: height * 0.4, rotation: 25, scale: 0.8, type: 'spoon' },
    // Carrot bottom-right
    { x: width - 90, y: height * 0.6, rotation: -10, scale: 0.7, type: 'carrot' },
    // Onion mid
    { x: width - 50, y: height * 0.25, rotation: 5, scale: 0.5, type: 'onion' },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        {items.map((item, index) => (
          <G
            key={index}
            transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}
          >
            {item.type === 'tomato' ? (
              // Tomato
              <G>
                <Circle cx="0" cy="0" r="25" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
                <Path d="M-5 -25 Q0 -35 5 -25" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
              </G>
            ) : item.type === 'egg' ? (
              // Egg
              <Ellipse cx="0" cy="0" rx="18" ry="24" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
            ) : item.type === 'herb' ? (
              // Herb/Leaf
              <G>
                <Path d="M0 30 Q-15 15 0 0 Q15 15 0 30" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
                <Path d="M0 30 L0 45" stroke={brandColors.warmBrownLight} strokeWidth="2" />
              </G>
            ) : item.type === 'spoon' ? (
              // Spoon
              <G>
                <Ellipse cx="0" cy="-30" rx="12" ry="18" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
                <Path d="M0 -12 L0 40" stroke={brandColors.warmBrownLight} strokeWidth="2" />
              </G>
            ) : item.type === 'carrot' ? (
              // Carrot
              <G>
                <Path d="M0 -30 Q10 0 0 40 Q-10 0 0 -30" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
                <Path d="M-5 -30 L0 -40 L5 -30" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
              </G>
            ) : item.type === 'onion' ? (
              // Onion
              <G>
                <Circle cx="0" cy="0" r="20" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
                <Path d="M0 -20 L0 -28" stroke={brandColors.warmBrownLight} strokeWidth="2" />
              </G>
            ) : (
              // Default: Small frying pan
              <G>
                <Circle cx="0" cy="0" r="30" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="2" />
                <Circle cx="0" cy="0" r="22" fill="none" stroke={brandColors.warmBrownLight} strokeWidth="1.5" strokeDasharray="4 4" />
                <Path d="M30 0 L55 -8" stroke={brandColors.warmBrownLight} strokeWidth="2" strokeLinecap="round" />
              </G>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
};

// Logo component - Frying pan as "O"
const OnerepiLogo = ({ size = 120 }: { size?: number }) => {
  return (
    <View style={[styles.logoContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Frying pan circle */}
        <Circle
          cx="45"
          cy="50"
          r="35"
          fill={brandColors.primary}
        />
        {/* Inner circle */}
        <Circle
          cx="45"
          cy="50"
          r="28"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        {/* Handle */}
        <Path
          d="M80 50 L95 45"
          stroke={brandColors.primary}
          strokeWidth="8"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
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

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('OnboardingSlides');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.cream} />

      {/* Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: brandColors.cream }]} />
      <IllustratedBackground />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo & Branding */}
          <Animated.View
            style={[
              styles.brandingContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <OnerepiLogo size={100} />

            <Text style={styles.logoText}>ONEREPI</Text>
            <Text style={styles.logoSubtext}>ワンレピ</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              styles.taglineContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.tagline}>献立、もう悩まない。</Text>
            <Text style={styles.taglineSecondary}>週イチ買い物、毎日ごはん。</Text>
          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* CTA Buttons */}
          <Animated.View
            style={[
              styles.ctaContainer,
              {
                opacity: buttonAnim,
                transform: [
                  {
                    translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStart}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[brandColors.primaryLight, brandColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>はじめる</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>
                すでにアカウントをお持ちの方
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    color: brandColors.primary,
    letterSpacing: 3,
  },
  logoSubtext: {
    fontSize: 16,
    fontWeight: '500',
    color: brandColors.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.text,
    textAlign: 'center',
  },
  taglineSecondary: {
    fontSize: 18,
    fontWeight: '500',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  ctaContainer: {
    paddingBottom: 32,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
});
