// ============================================
// ワンパン・バディ - Recipe List Screen
// カテゴリ・時間フィルタ付きレシピ一覧（UI改善版）
// ============================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  ChefHat,
  Package,
  X,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList, Recipe, RecipeCategory, RECIPE_CATEGORY_LABELS } from '../types';
import { MOCK_RECIPES } from '../lib/mockData';
import { RecipeCard, EmptyState } from '../components/ui';
import {
  newColors,
  newSpacing,
  newBorderRadius,
  newTypography,
  shadows,
  gradients,
} from '../styles/theme';

type RecipeListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

type TimeFilter = 'all' | '10' | '20' | '30';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

const CATEGORY_FILTERS: { key: RecipeCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'すべて', emoji: '🍽️' },
  { key: 'japanese', label: '和食', emoji: '🍙' },
  { key: 'western', label: '洋食', emoji: '🍝' },
  { key: 'chinese', label: '中華', emoji: '🥟' },
  { key: 'asian', label: 'アジアン', emoji: '🍜' },
];

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: '10', label: '〜10分' },
  { key: '20', label: '〜20分' },
  { key: '30', label: '〜30分' },
];

const DIFFICULTY_FILTERS: { key: DifficultyFilter; label: string; color: string }[] = [
  { key: 'all', label: 'すべて', color: newColors.textSecondary },
  { key: 'easy', label: '簡単', color: newColors.difficultyEasy },
  { key: 'medium', label: '普通', color: newColors.difficultyMedium },
  { key: 'hard', label: '本格', color: newColors.difficultyHard },
];

export const RecipeListScreen: React.FC<RecipeListScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'all'>('all');
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all');
  const [showBentoOnly, setShowBentoOnly] = useState(false);

  const filteredRecipes = useMemo(() => {
    return MOCK_RECIPES.filter((recipe) => {
      // Search filter (name, tags, and ingredients)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = recipe.name.toLowerCase().includes(query);
        const matchesTags = recipe.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesIngredients = recipe.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesTags && !matchesIngredients) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
        return false;
      }

      // Time filter
      if (selectedTime !== 'all') {
        const maxTime = parseInt(selectedTime, 10);
        if (recipe.cooking_time_minutes > maxTime) return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && recipe.difficulty !== selectedDifficulty) {
        return false;
      }

      // Bento filter
      if (showBentoOnly && !recipe.is_bento_friendly) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedTime, selectedDifficulty, showBentoOnly]);

  const handleRecipePress = (recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const handleCategorySelect = (category: RecipeCategory | 'all') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleTimeSelect = (time: TimeFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTime(time);
  };

  const handleDifficultySelect = (difficulty: DifficultyFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDifficulty(difficulty);
  };

  const handleBentoToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowBentoOnly(!showBentoOnly);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const resetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTime('all');
    setSelectedDifficulty('all');
    setShowBentoOnly(false);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedTime !== 'all' ||
    selectedDifficulty !== 'all' ||
    showBentoOnly ||
    searchQuery.length > 0;

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <RecipeCard recipe={item} onPress={handleRecipePress} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={gradients.heroSoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>レシピ集</Text>
            <View style={styles.recipeCountBadge}>
              <Sparkles size={12} color={newColors.primary} />
              <Text style={styles.recipeCount}>{filteredRecipes.length}品</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>今日は何を作りますか？</Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, shadows.sm]}>
          <Search size={20} color={newColors.primary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="レシピや材料を検索..."
            placeholderTextColor={newColors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color={newColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORY_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedCategory === filter.key && styles.filterChipActive,
              shadows.sm,
            ]}
            onPress={() => handleCategorySelect(filter.key)}
          >
            <Text style={styles.filterEmoji}>{filter.emoji}</Text>
            <Text
              style={[
                styles.filterLabel,
                selectedCategory === filter.key && styles.filterLabelActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time, Difficulty & Bento Filters */}
      <View style={styles.subFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subFilterContent}
        >
          {/* Time filters */}
          {TIME_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.timeChip,
                selectedTime === filter.key && styles.timeChipActive,
              ]}
              onPress={() => handleTimeSelect(filter.key)}
            >
              <Text
                style={[
                  styles.timeLabel,
                  selectedTime === filter.key && styles.timeLabelActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterDivider} />

          {/* Difficulty filters */}
          {DIFFICULTY_FILTERS.filter((f) => f.key !== 'all').map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.difficultyChip,
                selectedDifficulty === filter.key && {
                  backgroundColor: filter.color,
                },
              ]}
              onPress={() => handleDifficultySelect(filter.key)}
            >
              <ChefHat
                size={12}
                color={
                  selectedDifficulty === filter.key
                    ? newColors.white
                    : filter.color
                }
              />
              <Text
                style={[
                  styles.difficultyLabel,
                  { color: filter.color },
                  selectedDifficulty === filter.key && styles.difficultyLabelActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.bentoChip,
              showBentoOnly && styles.bentoChipActive,
            ]}
            onPress={handleBentoToggle}
          >
            <Package
              size={14}
              color={showBentoOnly ? newColors.white : newColors.success}
            />
            <Text
              style={[
                styles.bentoLabel,
                showBentoOnly && styles.bentoLabelActive,
              ]}
            >
              弁当向き
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Recipe List */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="条件に合うレシピが見つかりませんでした"
            description="フィルターを変更するか、検索キーワードを変えてみてください"
            actionLabel={hasActiveFilters ? 'フィルターをリセット' : undefined}
            onAction={hasActiveFilters ? resetFilters : undefined}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: newColors.background,
  },

  // Header with Gradient
  header: {
    paddingHorizontal: newSpacing.lg,
    paddingTop: newSpacing.md,
    paddingBottom: newSpacing.lg,
  },
  headerContent: {
    gap: newSpacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: newTypography.sizes.xxl,
    fontWeight: newTypography.weights.bold,
    color: newColors.text,
  },
  recipeCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newColors.surface,
    paddingHorizontal: newSpacing.sm,
    paddingVertical: newSpacing.xs,
    borderRadius: newBorderRadius.full,
    gap: 4,
  },
  recipeCount: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: newColors.primary,
  },
  headerSubtitle: {
    fontSize: newTypography.sizes.md,
    color: newColors.textSecondary,
  },

  // Search
  searchContainer: {
    paddingHorizontal: newSpacing.lg,
    paddingVertical: newSpacing.sm,
    backgroundColor: newColors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: newColors.surface,
    borderRadius: newBorderRadius.full,
    paddingHorizontal: newSpacing.md,
    gap: newSpacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: newSpacing.md,
    fontSize: newTypography.sizes.md,
    color: newColors.text,
  },
  clearButton: {
    padding: newSpacing.xs,
  },

  // Category Filters
  filterContainer: {
    backgroundColor: newColors.background,
  },
  filterContent: {
    paddingHorizontal: newSpacing.lg,
    paddingVertical: newSpacing.sm,
    gap: newSpacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: newSpacing.sm,
    paddingHorizontal: newSpacing.md,
    borderRadius: newBorderRadius.lg,
    backgroundColor: newColors.surface,
    marginRight: newSpacing.sm,
    gap: newSpacing.xs,
  },
  filterChipActive: {
    backgroundColor: newColors.primary,
  },
  filterEmoji: {
    fontSize: 18,
  },
  filterLabel: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.semibold,
    color: newColors.textSecondary,
  },
  filterLabelActive: {
    color: newColors.white,
  },

  // Sub Filters
  subFilterContainer: {
    backgroundColor: newColors.background,
    borderBottomWidth: 1,
    borderBottomColor: newColors.borderLight,
  },
  subFilterContent: {
    paddingHorizontal: newSpacing.lg,
    paddingVertical: newSpacing.sm,
    gap: newSpacing.sm,
  },
  timeChip: {
    paddingVertical: newSpacing.xs,
    paddingHorizontal: newSpacing.md,
    borderRadius: newBorderRadius.full,
    backgroundColor: newColors.surfaceAlt,
    marginRight: newSpacing.sm,
  },
  timeChipActive: {
    backgroundColor: newColors.primary,
  },
  timeLabel: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.medium,
    color: newColors.textSecondary,
  },
  timeLabelActive: {
    color: newColors.white,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: newColors.border,
    marginHorizontal: newSpacing.xs,
  },
  difficultyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: newSpacing.xs,
    paddingHorizontal: newSpacing.md,
    borderRadius: newBorderRadius.full,
    backgroundColor: newColors.surfaceAlt,
    marginRight: newSpacing.sm,
    gap: 4,
  },
  difficultyLabel: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.medium,
  },
  difficultyLabelActive: {
    color: newColors.white,
  },
  bentoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: newSpacing.xs,
    paddingHorizontal: newSpacing.md,
    borderRadius: newBorderRadius.full,
    backgroundColor: newColors.successBg,
    marginRight: newSpacing.sm,
    gap: newSpacing.xs,
  },
  bentoChipActive: {
    backgroundColor: newColors.success,
  },
  bentoLabel: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.medium,
    color: newColors.success,
  },
  bentoLabelActive: {
    color: newColors.white,
  },

  // Recipe List
  listContent: {
    padding: newSpacing.lg,
    paddingTop: newSpacing.md,
  },
});
