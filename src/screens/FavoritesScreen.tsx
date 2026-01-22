// ============================================
// ワンパン・バディ - Favorites Screen
// お気に入りレシピ一覧
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Heart,
  Clock,
  ChevronLeft,
  HeartOff,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList, Recipe } from '../types';
import { getFavorites, toggleFavorite } from '../lib/storage';
import { MOCK_RECIPES } from '../lib/mockData';
import { colors, spacing, borderRadius } from '../lib/theme';

type FavoritesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const favoriteIds = await getFavorites();
      const recipes = MOCK_RECIPES.filter(r => favoriteIds.includes(r.id));
      setFavoriteRecipes(recipes);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRecipePress = (recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const handleRemoveFavorite = async (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(recipeId);
    setFavoriteRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recipeEmoji}>
        <Text style={styles.emojiText}>{item.emoji}</Text>
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.recipeMeta}>
          <Clock size={14} color={colors.textMuted} />
          <Text style={styles.recipeTime}>{item.cooking_time_minutes}分</Text>
          <Text style={styles.recipeTags}>
            {item.tags.slice(0, 2).join(' / ')}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Heart size={20} color={colors.error} fill={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>お気に入りレシピ</Text>
        <View style={styles.headerRight}>
          <Heart size={20} color={colors.error} fill={colors.error} />
          <Text style={styles.headerCount}>{favoriteRecipes.length}</Text>
        </View>
      </View>

      {/* Content */}
      {favoriteRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <HeartOff size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>お気に入りがありません</Text>
          <Text style={styles.emptySubtitle}>
            レシピ詳細画面でハートをタップして{'\n'}お気に入りに追加しよう
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('RecipeList')}
          >
            <Text style={styles.browseButtonText}>レシピを探す</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  headerCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },

  // List
  listContent: {
    padding: spacing.md,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeEmoji: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recipeTime: {
    fontSize: 13,
    color: colors.textMuted,
  },
  recipeTags: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  removeButton: {
    padding: spacing.sm,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
