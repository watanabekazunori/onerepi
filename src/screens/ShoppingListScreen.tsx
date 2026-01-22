// ============================================
// ワンパン・バディ - Shopping List Screen
// 週間献立から自動生成、調味料を含む
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Check,
  Trash2,
  Plus,
  ShoppingCart,
  ChevronRight,
  RefreshCw,
} from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { RootStackParamList, IngredientCategory, INGREDIENT_CATEGORY_LABELS } from '../types';
import {
  GeneratedShoppingItem,
  generateShoppingListFromPlan,
  saveShoppingListCheckedState,
  getShoppingListCheckedState,
} from '../lib/storage';
import { colors, spacing, borderRadius } from '../lib/theme';

type ShoppingListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

interface ShoppingSection {
  title: string;
  category: IngredientCategory;
  data: GeneratedShoppingItem[];
}

// 手動追加アイテム用
interface ManualItem {
  id: string;
  name: string;
  checked: boolean;
}

export const ShoppingListScreen: React.FC<ShoppingListScreenProps> = ({ navigation }) => {
  const [items, setItems] = useState<GeneratedShoppingItem[]>([]);
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});

  // 買い物リストを読み込み
  const loadShoppingList = useCallback(async () => {
    try {
      setIsLoading(true);
      const [generatedItems, savedCheckedState] = await Promise.all([
        generateShoppingListFromPlan(),
        getShoppingListCheckedState(),
      ]);

      // チェック状態を反映
      const itemsWithCheckedState = generatedItems.map(item => ({
        ...item,
        checked: savedCheckedState[item.id] ?? item.checked,
      }));

      setItems(itemsWithCheckedState);
      setCheckedState(savedCheckedState);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 画面にフォーカスが戻るたびに再読み込み
  useFocusEffect(
    useCallback(() => {
      loadShoppingList();
    }, [loadShoppingList])
  );

  // カテゴリ順序
  const categoryOrder: IngredientCategory[] = ['protein', 'vegetable', 'grain', 'dairy', 'seasoning', 'other'];

  // Group items by category
  const sections: ShoppingSection[] = React.useMemo(() => {
    const grouped: Record<string, GeneratedShoppingItem[]> = {};

    // 自動生成アイテム
    items.forEach((item) => {
      const category = item.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // 手動追加アイテムを"other"に追加
    if (manualItems.length > 0) {
      if (!grouped['other']) {
        grouped['other'] = [];
      }
      manualItems.forEach(manual => {
        grouped['other'].push({
          id: manual.id,
          name: manual.name,
          amount: 0,
          unit: '',
          category: 'other',
          checked: manual.checked,
          recipeIds: [],
          recipeNames: [],
        });
      });
    }

    return categoryOrder
      .filter(cat => grouped[cat] && grouped[cat].length > 0)
      .map((category) => ({
        title: INGREDIENT_CATEGORY_LABELS[category] || category,
        category,
        data: grouped[category].sort((a, b) => {
          // Checked items go to bottom
          if (a.checked !== b.checked) {
            return a.checked ? 1 : -1;
          }
          return a.name.localeCompare(b.name, 'ja');
        }),
      }));
  }, [items, manualItems]);

  const uncheckedCount = items.filter((item) => !item.checked).length +
    manualItems.filter((item) => !item.checked).length;

  const handleCheck = useCallback(async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 自動生成アイテムのチェック
    const isAutoItem = items.some(item => item.id === itemId);
    if (isAutoItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      );

      // チェック状態を保存
      const newCheckedState = {
        ...checkedState,
        [itemId]: !checkedState[itemId],
      };
      setCheckedState(newCheckedState);
      await saveShoppingListCheckedState(newCheckedState);
    } else {
      // 手動追加アイテムのチェック
      setManualItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      );
    }
  }, [items, checkedState]);

  const handleDelete = useCallback((itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '削除確認',
      'このアイテムをリストから削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            // 手動追加アイテムのみ削除可能
            setManualItems((prev) => prev.filter((item) => item.id !== itemId));
          },
        },
      ]
    );
  }, []);

  const handleAddItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.prompt(
      'アイテムを追加',
      '追加するアイテム名を入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '追加',
          onPress: (text: string | undefined) => {
            if (text && text.trim()) {
              const newItem: ManualItem = {
                id: `manual-${Date.now()}`,
                name: text.trim(),
                checked: false,
              };
              setManualItems((prev) => [...prev, newItem]);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadShoppingList();
  };

  // 数量を表示用にフォーマット
  const formatQuantity = (item: GeneratedShoppingItem): string => {
    if (item.amount === 0) return '';
    // 小数点以下を整理
    const amount = item.amount % 1 === 0 ? item.amount : item.amount.toFixed(1);
    return `${amount}${item.unit}`;
  };

  // レシピ名を表示用にフォーマット
  const formatRecipeSource = (item: GeneratedShoppingItem): string => {
    if (item.recipeNames.length === 0) return '';
    if (item.recipeNames.length === 1) return item.recipeNames[0];
    return `${item.recipeNames[0]} 他${item.recipeNames.length - 1}品`;
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    itemId: string,
    isManual: boolean
  ) => {
    if (!isManual) return null; // 自動生成アイテムは削除不可

    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(itemId)}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 size={24} color={colors.white} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: GeneratedShoppingItem }) => {
    const isManual = item.id.startsWith('manual-');
    const quantity = formatQuantity(item);
    const recipeSource = formatRecipeSource(item);

    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item.id, isManual)
        }
        overshootRight={false}
        enabled={isManual}
      >
        <TouchableOpacity
          style={[styles.itemContainer, item.checked && styles.itemChecked]}
          onPress={() => handleCheck(item.id)}
          activeOpacity={0.7}
        >
          {/* Checkbox */}
          <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
            {item.checked && <Check size={16} color={colors.white} />}
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
              {item.name}
            </Text>
            {quantity ? (
              <Text style={styles.itemQuantity}>{quantity}</Text>
            ) : null}
            {recipeSource ? (
              <Text style={styles.itemSource}>{recipeSource}</Text>
            ) : null}
            {isManual && (
              <View style={styles.manualBadge}>
                <Text style={styles.manualBadgeText}>手動追加</Text>
              </View>
            )}
          </View>

          {/* Swipe hint */}
          {isManual && <ChevronRight size={20} color={colors.textMuted} />}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section }: { section: ShoppingSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>
        {section.data.filter((i) => !i.checked).length} / {section.data.length}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>買い物リストを生成中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShoppingCart size={28} color={colors.primary} />
          <Text style={styles.headerTitle}>買い物リスト</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <RefreshCw size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{uncheckedCount}品</Text>
          </View>
        </View>
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>買い物リストは空です</Text>
            <Text style={styles.emptyDescription}>
              献立を決めると自動で追加されます
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
        <Plus size={24} color={colors.white} />
        <Text style={styles.addButtonText}>アイテムを追加</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  headerBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingBottom: 100,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Item
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  itemChecked: {
    backgroundColor: colors.surfaceAlt,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },

  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  itemNameChecked: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemSource: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  manualBadge: {
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  manualBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },

  // Delete Action
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },

  // Add Button
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
