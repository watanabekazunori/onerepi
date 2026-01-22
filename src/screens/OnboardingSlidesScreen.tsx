// ============================================
// Onerepi - Onboarding Slides Screen
// 3-step horizontal swipe onboarding
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect, G, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

// Brand Colors
const brandColors = {
  primary: '#D4490F',
  primaryLight: '#E8601F',
  cream: '#FFF8E7',
  warmBrown: '#8B7355',
  text: '#2D1810',
  textSecondary: '#5D4037',
  textMuted: '#A1887F',
  white: '#FFFFFF',
  gray: '#E0E0E0',
};

type OnboardingSlidesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingSlides'>;
};

interface SlideData {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

// Custom SVG illustrations for each slide
const CalendarIcon = () => (
  <Svg width={140} height={140} viewBox="0 0 140 140">
    {/* Calendar base */}
    <Rect x="20" y="35" width="100" height="85" rx="12" fill="none" stroke={brandColors.primary} strokeWidth="3" />
    {/* Calendar header */}
    <Rect x="20" y="35" width="100" height="25" rx="12" fill={brandColors.primary} />
    <Rect x="20" y="48" width="100" height="12" fill={brandColors.primary} />
    {/* Calendar rings */}
    <Circle cx="45" cy="35" r="5" fill={brandColors.cream} stroke={brandColors.primary} strokeWidth="2" />
    <Circle cx="95" cy="35" r="5" fill={brandColors.cream} stroke={brandColors.primary} strokeWidth="2" />
    {/* Days grid */}
    <G fill={brandColors.primary} opacity={0.3}>
      <Rect x="30" y="70" width="18" height="18" rx="4" />
      <Rect x="54" y="70" width="18" height="18" rx="4" />
      <Rect x="78" y="70" width="18" height="18" rx="4" />
      <Rect x="102" y="70" width="8" height="18" rx="4" />
      <Rect x="30" y="94" width="18" height="18" rx="4" />
      <Rect x="54" y="94" width="18" height="18" rx="4" />
    </G>
    {/* Check marks */}
    <Path d="M36 78 L42 84 L52 72" stroke={brandColors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <G transform="translate(102, 70)">
      <Rect width="8" height="18" rx="4" fill={brandColors.primary} />
    </G>
    {/* Food icons */}
    <Circle cx="86" cy="79" r="6" fill={brandColors.primaryLight} />
    <Circle cx="62" cy="103" r="6" fill={brandColors.primaryLight} />
  </Svg>
);

const ShoppingBagIcon = () => (
  <Svg width={140} height={140} viewBox="0 0 140 140">
    {/* Shopping bag */}
    <Path
      d="M30 50 L35 115 Q36 120 42 120 L98 120 Q104 120 105 115 L110 50 Z"
      fill="none"
      stroke={brandColors.primary}
      strokeWidth="3"
    />
    {/* Bag handles */}
    <Path
      d="M50 50 L50 35 Q50 20 70 20 Q90 20 90 35 L90 50"
      fill="none"
      stroke={brandColors.primary}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Items popping out */}
    {/* Carrot */}
    <G transform="translate(45, 30) rotate(-15)">
      <Path d="M0 0 L5 25 L-5 25 Z" fill={brandColors.primaryLight} />
      <Path d="M-3 0 L0 -8 L3 0" stroke={brandColors.primary} strokeWidth="2" fill="none" />
    </G>
    {/* Tomato */}
    <Circle cx="75" cy="38" r="12" fill={brandColors.primaryLight} />
    <Path d="M72 26 Q75 22 78 26" stroke={brandColors.primary} strokeWidth="2" fill="none" />
    {/* Onion */}
    <Circle cx="95" cy="45" r="10" fill="none" stroke={brandColors.primary} strokeWidth="2" />
    {/* Items in bag */}
    <Circle cx="55" cy="80" r="8" fill={brandColors.primaryLight} opacity={0.6} />
    <Circle cx="75" cy="90" r="10" fill={brandColors.primaryLight} opacity={0.6} />
    <Rect x="85" y="75" width="15" height="20" rx="3" fill={brandColors.primaryLight} opacity={0.6} />
  </Svg>
);

const RecipeIcon = () => (
  <Svg width={140} height={140} viewBox="0 0 140 140">
    {/* Phone frame */}
    <Rect x="35" y="15" width="70" height="110" rx="12" fill="none" stroke={brandColors.primary} strokeWidth="3" />
    {/* Screen */}
    <Rect x="42" y="30" width="56" height="80" rx="4" fill={brandColors.cream} />
    {/* Recipe image placeholder */}
    <Rect x="48" y="36" width="44" height="30" rx="6" fill={brandColors.primaryLight} opacity={0.4} />
    {/* Recipe steps */}
    <Circle cx="54" cy="78" r="4" fill={brandColors.primary} />
    <Line x1="64" y1="78" x2="86" y2="78" stroke={brandColors.textMuted} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="54" cy="92" r="4" fill={brandColors.primaryLight} />
    <Line x1="64" y1="92" x2="82" y2="92" stroke={brandColors.textMuted} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="54" cy="106" r="4" stroke={brandColors.textMuted} strokeWidth="2" fill="none" />
    {/* Timer */}
    <G transform="translate(100, 65)">
      <Circle cx="0" cy="0" r="18" fill={brandColors.white} stroke={brandColors.primary} strokeWidth="2" />
      <Line x1="0" y1="0" x2="0" y2="-10" stroke={brandColors.primary} strokeWidth="2" strokeLinecap="round" />
      <Line x1="0" y1="0" x2="6" y2="4" stroke={brandColors.primary} strokeWidth="2" strokeLinecap="round" />
    </G>
    {/* Home indicator */}
    <Rect x="55" y="115" width="30" height="4" rx="2" fill={brandColors.textMuted} />
  </Svg>
);

const slides: SlideData[] = [
  {
    id: '1',
    icon: <CalendarIcon />,
    title: '1週間まとめて計画',
    description: '週の始めに献立を決めれば、\n毎日悩まない',
  },
  {
    id: '2',
    icon: <ShoppingBagIcon />,
    title: '買い物リスト自動作成',
    description: '必要な食材をリストにまとめて、\n買い忘れゼロ',
  },
  {
    id: '3',
    icon: <RecipeIcon />,
    title: 'かんたんステップ調理',
    description: '見やすいレシピで、\n料理がもっと楽しく',
  },
];

export const OnboardingSlidesScreen: React.FC<OnboardingSlidesScreenProps> = ({
  navigation,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Setup');
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Setup');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>{item.icon}</View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: brandColors.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.white} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {renderDots()}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
        />

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'はじめる' : '次へ'}
            </Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: brandColors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 17,
    fontWeight: '400',
    color: brandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  nextButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.white,
    letterSpacing: 0.5,
  },
});
