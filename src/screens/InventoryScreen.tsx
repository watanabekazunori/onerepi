// ============================================
// ワンパン・バディ - Inventory Screen
// 在庫管理 - 冷蔵庫の食材を管理
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Plus,
  Refrigerator,
  Trash2,
  X,
  Search,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  getInventory,
  saveInventory,
  addInventoryItem,
  removeInventoryItem,
  InventoryItem,
} from '../lib/storage';
import { IngredientCategory } from '../types';
import { colors, spacing, borderRadius } from '../lib/theme';

const CATEGORY_OPTIONS: { value: IngredientCategory; label: string; emoji: string }[] = [
  { value: 'protein', label: 'お肉・魚・卵', emoji: '🥩' },
  { value: 'vegetable', label: '野菜・きのこ', emoji: '🥬' },
  { value: 'seasoning', label: '調味料', emoji: '🧂' },
  { value: 'other', label: 'その他', emoji: '📦' },
];

// 一般的な食材リスト（クイック追加用）
const QUICK_ADD_ITEMS: { name: string; category: IngredientCategory; emoji: string }[] = [
  { name: '鶏もも肉', category: 'protein', emoji: '🍗' },
  { name: '豚バラ肉', category: 'protein', emoji: '🥓' },
  { name: '卵', category: 'protein', emoji: '🥚' },
  { name: '豆腐', category: 'protein', emoji: '🧈' },
  { name: 'キャベツ', category: 'vegetable', emoji: '🥬' },
  { name: '玉ねぎ', category: 'vegetable', emoji: '🧅' },
  { name: 'にんじん', category: 'vegetable', emoji: '🥕' },
  { name: 'じゃがいも', category: 'vegetable', emoji: '🥔' },
  { name: 'もやし', category: 'vegetable', emoji: '🌱' },
  { name: 'ほうれん草', category: 'vegetable', emoji: '🥗' },
  { name: 'しめじ', category: 'vegetable', emoji: '🍄' },
  { name: '醤油', category: 'seasoning', emoji: '🫗' },
  { name: 'みりん', category: 'seasoning', emoji: '🍶' },
  { name: '味噌', category: 'seasoning', emoji: '🥣' },
];

export const InventoryScreen: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 新規追加用
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<IngredientCategory>('vegetable');

  const loadInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await getInventory();
      setInventory(items);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [loadInventory])
  );

  // カテゴリ別にグループ化
  const groupedInventory = useMemo(() => {
    const filtered = searchQuery
      ? inventory.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : inventory;

    const groups: Record<IngredientCategory, InventoryItem[]> = {
      protein: [],
      vegetable: [],
      seasoning: [],
      grain: [],
      dairy: [],
      other: [],
    };

    filtered.forEach(item => {
      const category = item.category as IngredientCategory;
      if (groups[category]) {
        groups[category].push(item);
      } else {
        groups.other.push(item);
      }
    });

    return groups;
  }, [inventory, searchQuery]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await addInventoryItem({
      name: newItemName.trim(),
      category: newItemCategory,
    });

    setNewItemName('');
    setShowAddModal(false);
    loadInventory();
  };

  const handleQuickAdd = async (item: typeof QUICK_ADD_ITEMS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 既に登録されていないかチェック
    const exists = inventory.some(
      i => i.name.toLowerCase() === item.name.toLowerCase()
    );

    if (exists) {
      Alert.alert('既に登録済み', `${item.name}は既に在庫にあります`);
      return;
    }

    await addInventoryItem({
      name: item.name,
      category: item.category,
    });

    loadInventory();
  };

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    Alert.alert(
      '在庫から削除',
      `${itemName}を在庫から削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await removeInventoryItem(itemId);
            loadInventory();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Refrigerator size={28} color={colors.primary} />
          <Text style={styles.headerTitle}>冷蔵庫の中身</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{inventory.length}品</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="食材を検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Add */}
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>よく使う食材をタップで追加</Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD_ITEMS.filter(
              item => !inventory.some(i => i.name === item.name)
            ).slice(0, 8).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAddChip}
                onPress={() => handleQuickAdd(item)}
              >
                <Text style={styles.quickAddEmoji}>{item.emoji}</Text>
                <Text style={styles.quickAddText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Inventory List */}
        {CATEGORY_OPTIONS.map(category => {
          const items = groupedInventory[category.value];
          if (items.length === 0) return null;

          return (
            <View key={category.value} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryTitle}>{category.label}</Text>
                <Text style={styles.categoryCount}>{items.length}品</Text>
              </View>
              <View style={styles.itemGrid}>
                {items.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.inventoryItem}
                    onLongPress={() => handleRemoveItem(item.id, item.name)}
                  >
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.expiryDate && (
                      <View style={styles.expiryBadge}>
                        <AlertCircle size={10} color={colors.warning} />
                        <Text style={styles.expiryText}>
                          {new Date(item.expiryDate).getMonth() + 1}/
                          {new Date(item.expiryDate).getDate()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {inventory.length === 0 && (
          <View style={styles.emptyState}>
            <Refrigerator size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>在庫がありません</Text>
            <Text style={styles.emptySubtitle}>
              食材を追加すると、それを使うレシピを優先的に提案します
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color={colors.white} />
        <Text style={styles.addButtonText}>食材を追加</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>食材を追加</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="食材名を入力"
              value={newItemName}
              onChangeText={setNewItemName}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <Text style={styles.inputLabel}>カテゴリ</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.categoryOption,
                    newItemCategory === option.value && styles.categoryOptionSelected,
                  ]}
                  onPress={() => setNewItemCategory(option.value)}
                >
                  <Text style={styles.categoryOptionEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryOptionText,
                      newItemCategory === option.value && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !newItemName.trim() && styles.submitButtonDisabled]}
              onPress={handleAddItem}
              disabled={!newItemName.trim()}
            >
              <Text style={styles.submitButtonText}>追加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },

  // Content
  content: {
    flex: 1,
  },

  // Quick Add
  quickAddSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  quickAddEmoji: {
    fontSize: 14,
  },
  quickAddText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },

  // Category Section
  categorySection: {
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    gap: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  inventoryItem: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  itemName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  expiryText: {
    fontSize: 11,
    color: colors.warning,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },

  spacer: {
    height: 100,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.xs,
  },
  categoryOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  categoryOptionEmoji: {
    fontSize: 16,
  },
  categoryOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  categoryOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
