/**
 * Plus Prompt Card Component
 *
 * 理解度70%到達時にのみ表示される、Plus訴求カード
 *
 * 【設計原則】
 * - 機能ロックは絶対に見せない
 * - 比較表は作らない
 * - 強制ポップアップは出さない
 * - 自然な流れで「さらに深く理解できます」を提示
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Sparkles, ChevronRight, X } from 'lucide-react-native';
import { PLUS_CONSTANTS } from '../lib/plusSubscription';

interface PlusPromptCardProps {
  currentUnderstanding: number;   // 現在の理解度 (70で表示)
  onLearnMore: () => void;        // 詳細を見る
  onDismiss: () => void;          // 閉じる
  style?: object;
}

/**
 * 理解度70%到達時に表示するPlus訴求カード
 * ユーザーの好みをさらに深く理解できることを控えめに伝える
 */
export const PlusPromptCard: React.FC<PlusPromptCardProps> = ({
  currentUnderstanding,
  onLearnMore,
  onDismiss,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // フェードイン・スライドアップアニメーション
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false, // Web対応
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false, // Web対応
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* 閉じるボタン */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onDismiss}
        activeOpacity={0.7}
      >
        <X size={16} color="#9CA3AF" />
      </TouchableOpacity>

      {/* メインコンテンツ */}
      <View style={styles.content}>
        {/* アイコン */}
        <View style={styles.iconContainer}>
          <Sparkles size={24} color="#FF6B35" />
        </View>

        {/* テキスト */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            理解度{currentUnderstanding}%に到達！
          </Text>
          <Text style={styles.description}>
            あなたの好み、かなり分かってきました。{'\n'}
            <Text style={styles.highlight}>Plus</Text>なら、さらに深く理解できます。
          </Text>
        </View>
      </View>

      {/* アクションボタン */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onLearnMore}
        activeOpacity={0.8}
      >
        <Text style={styles.actionText}>詳しく見る</Text>
        <ChevronRight size={16} color="#FF6B35" />
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Plus機能の説明モーダル用コンテンツ
 * 比較表ではなく、Plusの価値を自然に伝える
 */
export const PlusFeatureDescription: React.FC = () => {
  return (
    <View style={styles.featureContainer}>
      <Text style={styles.featureTitle}>
        このアプリが"あなた専用"になる
      </Text>

      <View style={styles.featureList}>
        <FeatureItem
          emoji="🎯"
          title="理解度100%へ"
          description="あなたの好みを完璧に把握して、毎日ぴったりの献立を提案"
        />
        <FeatureItem
          emoji="✨"
          title="被りがほぼゼロに"
          description="週の献立がより多彩に、飽きのこないバリエーション"
        />
        <FeatureItem
          emoji="📅"
          title="週のテンプレート"
          description="忙しい週、節約週、体調悪い週...状況に合わせて自動調整"
        />
        <FeatureItem
          emoji="🌶️"
          title="冒険レベル調整"
          description="新しいレシピへの挑戦度を自分好みに設定"
        />
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>月額</Text>
        <Text style={styles.priceValue}>¥{PLUS_CONSTANTS.PRICE_YEN}</Text>
        <Text style={styles.priceNote}>/ 月</Text>
      </View>
    </View>
  );
};

interface FeatureItemProps {
  emoji: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ emoji, title, description }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureItemTitle}>{title}</Text>
      <Text style={styles.featureItemDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FFE4D6',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  highlight: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginRight: 4,
  },

  // Feature Description Styles
  featureContainer: {
    padding: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureItemDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
  },
  priceNote: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 2,
  },
});

export default PlusPromptCard;
