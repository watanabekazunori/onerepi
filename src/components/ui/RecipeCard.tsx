// ============================================
// ワンパン・バディ - 改良版レシピカード
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { DifficultyBadge } from './DifficultyBadge';
import { TimeBadge } from './TimeBadge';
import {
  newColors,
  newSpacing,
  newBorderRadius,
  newTypography,
  shadows,
  gradients,
} from '../../styles/theme';
import { Recipe } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  variant?: 'default' | 'compact';
}

const CATEGORY_LABELS: Record<string, string> = {
  japanese: '和食',
  western: '洋食',
  chinese: '中華',
  asian: 'アジアン',
  other: 'その他',
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  variant = 'default',
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(recipe);
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.cardCompact, shadows.md]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={gradients.primarySoft}
          style={styles.emojiContainerCompact}
        >
          <Text style={styles.emojiCompact}>{recipe.emoji}</Text>
        </LinearGradient>
        <View style={styles.infoCompact}>
          <Text style={styles.nameCompact} numberOfLines={1}>
            {recipe.name}
          </Text>
          <View style={styles.metaCompact}>
            <TimeBadge minutes={recipe.cooking_time_minutes} size="sm" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, shadows.md]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={gradients.heroSoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emojiContainer}
      >
        <Text style={styles.emoji}>{recipe.emoji}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {recipe.name}
          </Text>
          {recipe.is_bento_friendly && (
            <View style={styles.bentoBadge}>
              <Package size={12} color={newColors.success} />
            </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.meta}>
          <TimeBadge minutes={recipe.cooking_time_minutes} size="sm" />
          <DifficultyBadge difficulty={recipe.difficulty} size="sm" />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {CATEGORY_LABELS[recipe.category] || recipe.category}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default card
  card: {
    flexDirection: 'row',
    backgroundColor: newColors.surface,
    borderRadius: newBorderRadius.lg,
    padding: newSpacing.md,
    marginBottom: newSpacing.md,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: newBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: newSpacing.md,
  },
  emoji: {
    fontSize: 42,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.xs,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: newTypography.sizes.lg,
    fontWeight: newTypography.weights.bold,
    color: newColors.text,
  },
  bentoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: newColors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: newTypography.sizes.sm,
    color: newColors.textSecondary,
    lineHeight: 18,
    marginBottom: newSpacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.sm,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: newColors.surfaceWarm,
    paddingHorizontal: newSpacing.sm,
    paddingVertical: 2,
    borderRadius: newBorderRadius.full,
  },
  categoryText: {
    fontSize: newTypography.sizes.xs,
    fontWeight: newTypography.weights.medium,
    color: newColors.warmBrown,
  },

  // Compact card
  cardCompact: {
    flexDirection: 'row',
    backgroundColor: newColors.surface,
    borderRadius: newBorderRadius.md,
    padding: newSpacing.sm,
    alignItems: 'center',
  },
  emojiContainerCompact: {
    width: 48,
    height: 48,
    borderRadius: newBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: newSpacing.sm,
  },
  emojiCompact: {
    fontSize: 24,
  },
  infoCompact: {
    flex: 1,
  },
  nameCompact: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: newColors.text,
    marginBottom: 4,
  },
  metaCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: newSpacing.xs,
  },
});
