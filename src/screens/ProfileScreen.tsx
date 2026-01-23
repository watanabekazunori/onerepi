// ============================================
// ワンパン・バディ - Profile Screen
// 設定と苦手食材管理
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  User,
  Users,
  ChefHat,
  Flame,
  Microwave,
  CookingPot,
  X,
  Plus,
  ChevronRight,
  LogOut,
  Bell,
  HelpCircle,
  FileText,
  TrendingUp,
  Award,
  History,
  Heart,
  Refrigerator,
  PiggyBank,
  Beef,
  Check,
  Sparkles,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList, Profile, KitchenEquipment } from '../types';
import { colors, spacing, borderRadius } from '../lib/theme';
import {
  getUserStats,
  UserStats,
  getWeeklyCookCount,
  getFavorites,
  getUserPreferences,
  saveUserPreferences,
  DEFAULT_SEASONINGS,
  getAllSeasoningOptions,
  UserPreferences,
} from '../lib/storage';
import {
  FOOD_TYPES,
  FoodPsychologyType,
  DiagnosisAnswers,
  getTypeRecommendationKeywords,
} from '../lib/preferenceScoring';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

// Mock user data
const INITIAL_PROFILE: Profile = {
  id: 'user-1',
  email: 'user@example.com',
  display_name: 'ユーザー',
  household_size: 1,
  dislikes: ['パクチー', 'セロリ', 'レバー'],
  kitchen_equipment: {
    stove_count: 1,
    has_microwave: true,
    has_oven: false,
    has_rice_cooker: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [newDislike, setNewDislike] = useState('');
  const [showDislikeInput, setShowDislikeInput] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weeklyCookCount, setWeeklyCookCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [pantrySeasonings, setPantrySeasonings] = useState<string[]>([]);
  const [showSeasoningsModal, setShowSeasoningsModal] = useState(false);
  const [selectedSeasonings, setSelectedSeasonings] = useState<Set<string>>(new Set());
  const [diagnosisType, setDiagnosisType] = useState<FoodPsychologyType | null>(null);
  const [diagnosisDate, setDiagnosisDate] = useState<string | null>(null);

  // 統計と常備調味料を読み込み
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const [userStats, weeklyCount, favorites, prefs] = await Promise.all([
          getUserStats(),
          getWeeklyCookCount(),
          getFavorites(),
          getUserPreferences(),
        ]);
        setStats(userStats);
        setWeeklyCookCount(weeklyCount);
        setFavoritesCount(favorites.length);
        if (prefs?.pantrySeasonings) {
          setPantrySeasonings(prefs.pantrySeasonings);
        }
        // 診断結果を読み込み
        if (prefs?.diagnosisAnswers) {
          const diagnosisAnswers = prefs.diagnosisAnswers as DiagnosisAnswers;
          if (diagnosisAnswers.psychologyType) {
            setDiagnosisType(diagnosisAnswers.psychologyType);
          }
        }
        if (prefs?.diagnosisCompletedAt) {
          setDiagnosisDate(prefs.diagnosisCompletedAt);
        }
      };
      loadData();
    }, [])
  );

  const handleHouseholdChange = (size: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfile((prev) => ({ ...prev, household_size: size }));
  };

  const handleKitchenEquipmentChange = (key: keyof KitchenEquipment, value: boolean | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfile((prev) => ({
      ...prev,
      kitchen_equipment: {
        ...prev.kitchen_equipment,
        [key]: value,
      },
    }));
  };

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setProfile((prev) => ({
        ...prev,
        dislikes: [...prev.dislikes, newDislike.trim()],
      }));
      setNewDislike('');
      setShowDislikeInput(false);
    }
  };

  const handleRemoveDislike = (dislike: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfile((prev) => ({
      ...prev,
      dislikes: prev.dislikes.filter((d) => d !== dislike),
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  // 常備調味料編集モーダルを開く
  const openSeasoningsModal = () => {
    setSelectedSeasonings(new Set(pantrySeasonings));
    setShowSeasoningsModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 調味料の選択切り替え
  const toggleSeasoning = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSeasonings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  // 常備調味料を保存
  const saveSeasonings = async () => {
    const newSeasonings = Array.from(selectedSeasonings);
    setPantrySeasonings(newSeasonings);

    const prefs = await getUserPreferences();
    const defaultPrefs = {
      name: '',
      household: 1,
      tastePreferences: [],
      healthGoals: [],
      dislikes: [],
      allergies: [],
      cookingSkill: '',
      kitchenEquipment: [],
      pantrySeasonings: [],
    };
    await saveUserPreferences({
      ...defaultPrefs,
      ...prefs,
      pantrySeasonings: newSeasonings,
    });

    setShowSeasoningsModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // カテゴリ名の日本語変換
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basic: '基本調味料',
      oils: '油類',
      chinese: '中華系',
      western: '洋風',
      other: 'その他',
    };
    return labels[category] || category;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <User size={32} color={colors.white} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile.display_name}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>今週の自炊</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{weeklyCookCount}</Text>
                <Text style={styles.statLabel}>/ {stats.weeklyGoal}回</Text>
                <View style={styles.statProgress}>
                  <View
                    style={[
                      styles.statProgressFill,
                      { width: `${Math.min((weeklyCookCount / stats.weeklyGoal) * 100, 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statRow}>
                  <TrendingUp size={16} color={colors.success} />
                  <Text style={styles.statNumber}>{stats.currentStreak}</Text>
                </View>
                <Text style={styles.statLabel}>日連続</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statRow}>
                  <PiggyBank size={16} color={colors.primary} />
                  <Text style={styles.statNumber}>¥{stats.totalSavedAmount.toLocaleString()}</Text>
                </View>
                <Text style={styles.statLabel}>累計節約</Text>
              </View>
            </View>
          </View>
        )}

        {/* Badges */}
        {stats && stats.badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>獲得バッジ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgeRow}>
                {stats.badges.map((badge) => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Food Psychology Type Card */}
        {diagnosisType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>あなたの食タイプ</Text>
            <TouchableOpacity
              style={[
                styles.diagnosisCard,
                { backgroundColor: FOOD_TYPES[diagnosisType].color + '15' },
              ]}
              onPress={() => navigation.navigate('MyType')}
            >
              <View style={styles.diagnosisMain}>
                <View
                  style={[
                    styles.diagnosisIconBg,
                    { backgroundColor: FOOD_TYPES[diagnosisType].color + '30' },
                  ]}
                >
                  <Text style={styles.diagnosisEmoji}>
                    {FOOD_TYPES[diagnosisType].emoji}
                  </Text>
                </View>
                <View style={styles.diagnosisInfo}>
                  <Text
                    style={[
                      styles.diagnosisTypeName,
                      { color: FOOD_TYPES[diagnosisType].color },
                    ]}
                  >
                    {FOOD_TYPES[diagnosisType].name}
                  </Text>
                  <Text style={styles.diagnosisShort}>
                    {FOOD_TYPES[diagnosisType].shortDescription}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
              <View style={styles.diagnosisKeywords}>
                {getTypeRecommendationKeywords(diagnosisType).slice(0, 4).map((keyword, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.diagnosisKeywordTag,
                      { backgroundColor: FOOD_TYPES[diagnosisType].color + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.diagnosisKeywordText,
                        { color: FOOD_TYPES[diagnosisType].color },
                      ]}
                    >
                      #{keyword}
                    </Text>
                  </View>
                ))}
              </View>
              {diagnosisDate && (
                <Text style={styles.diagnosisDate}>
                  診断日: {new Date(diagnosisDate).toLocaleDateString('ja-JP')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>機能</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('CookingLog')}
            >
              <View style={styles.menuLeft}>
                <History size={20} color={colors.primary} />
                <Text style={styles.menuLabel}>料理履歴</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuBadge}>{stats?.totalCookedCount || 0}回</Text>
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Inventory')}
            >
              <View style={styles.menuLeft}>
                <Refrigerator size={20} color={colors.primary} />
                <Text style={styles.menuLabel}>冷蔵庫の中身</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Favorites')}
            >
              <View style={styles.menuLeft}>
                <Heart size={20} color={colors.error} />
                <Text style={styles.menuLabel}>お気に入りレシピ</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuBadge}>{favoritesCount}個</Text>
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            {/* マイタイプ画面（常に表示） */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('MyType')}
            >
              <View style={styles.menuLeft}>
                <Award size={20} color={diagnosisType ? FOOD_TYPES[diagnosisType].color : colors.primary} />
                <Text style={styles.menuLabel}>マイタイプ</Text>
              </View>
              <View style={styles.menuRight}>
                {diagnosisType ? (
                  <Text style={[styles.menuBadge, { color: FOOD_TYPES[diagnosisType].color }]}>
                    {FOOD_TYPES[diagnosisType].emoji} {FOOD_TYPES[diagnosisType].name}
                  </Text>
                ) : (
                  <Text style={styles.menuBadge}>未診断</Text>
                )}
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('PreferenceDiagnosis', { isRetake: !!diagnosisType })}
            >
              <View style={styles.menuLeft}>
                <Sparkles size={20} color="#FFB800" />
                <Text style={styles.menuLabel}>
                  {diagnosisType ? '食タイプ再診断' : '食の心理タイプ診断'}
                </Text>
              </View>
              <View style={styles.menuRight}>
                {!diagnosisType && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Onboarding')}
            >
              <View style={styles.menuLeft}>
                <AlertTriangle size={20} color={colors.warning} />
                <Text style={styles.menuLabel}>初期設定をやり直す</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pantry Seasonings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>常備調味料</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openSeasoningsModal}
            >
              <Plus size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.seasoningsCard}
            onPress={openSeasoningsModal}
          >
            {pantrySeasonings.length > 0 ? (
              <View style={styles.seasoningsPreview}>
                <Text style={styles.seasoningsText} numberOfLines={2}>
                  {pantrySeasonings.join('、')}
                </Text>
                <Text style={styles.seasoningsCount}>
                  {pantrySeasonings.length}種類
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>
                タップして常備調味料を設定
              </Text>
            )}
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.seasoningsHint}>
            常備調味料は買い物リストから除外されます
          </Text>
        </View>

        {/* Household Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>世帯人数</Text>
          <View style={styles.householdContainer}>
            <Users size={20} color={colors.textSecondary} />
            <View style={styles.householdButtons}>
              {[1, 2, 3, 4].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.householdButton,
                    profile.household_size === size && styles.householdButtonActive,
                  ]}
                  onPress={() => handleHouseholdChange(size)}
                >
                  <Text
                    style={[
                      styles.householdButtonText,
                      profile.household_size === size && styles.householdButtonTextActive,
                    ]}
                  >
                    {size}人
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Dislikes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>苦手な食材</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowDislikeInput(true)}
            >
              <Plus size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showDislikeInput && (
            <View style={styles.dislikeInputContainer}>
              <TextInput
                style={styles.dislikeInput}
                value={newDislike}
                onChangeText={setNewDislike}
                placeholder="食材名を入力..."
                placeholderTextColor={colors.textMuted}
                autoFocus
                onSubmitEditing={handleAddDislike}
              />
              <TouchableOpacity style={styles.addDislikeButton} onPress={handleAddDislike}>
                <Text style={styles.addDislikeButtonText}>追加</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDislikeInput(false);
                  setNewDislike('');
                }}
              >
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.dislikesContainer}>
            {profile.dislikes.map((dislike) => (
              <View key={dislike} style={styles.dislikeChip}>
                <Text style={styles.dislikeChipText}>{dislike}</Text>
                <TouchableOpacity
                  style={styles.removeChipButton}
                  onPress={() => handleRemoveDislike(dislike)}
                >
                  <X size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
            {profile.dislikes.length === 0 && (
              <Text style={styles.emptyText}>登録された苦手食材はありません</Text>
            )}
          </View>
        </View>

        {/* Kitchen Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>キッチン設備</Text>
          <View style={styles.equipmentContainer}>
            {/* Stove Count */}
            <View style={styles.equipmentItem}>
              <View style={styles.equipmentLeft}>
                <Flame size={20} color={colors.primary} />
                <Text style={styles.equipmentLabel}>コンロ数</Text>
              </View>
              <View style={styles.stoveButtons}>
                {[1, 2, 3].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.stoveButton,
                      profile.kitchen_equipment.stove_count === count && styles.stoveButtonActive,
                    ]}
                    onPress={() => handleKitchenEquipmentChange('stove_count', count)}
                  >
                    <Text
                      style={[
                        styles.stoveButtonText,
                        profile.kitchen_equipment.stove_count === count &&
                          styles.stoveButtonTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Microwave */}
            <View style={styles.equipmentItem}>
              <View style={styles.equipmentLeft}>
                <Microwave size={20} color={colors.primary} />
                <Text style={styles.equipmentLabel}>電子レンジ</Text>
              </View>
              <Switch
                value={profile.kitchen_equipment.has_microwave}
                onValueChange={(value) => handleKitchenEquipmentChange('has_microwave', value)}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={profile.kitchen_equipment.has_microwave ? colors.primary : colors.white}
              />
            </View>

            {/* Oven */}
            <View style={styles.equipmentItem}>
              <View style={styles.equipmentLeft}>
                <ChefHat size={20} color={colors.primary} />
                <Text style={styles.equipmentLabel}>オーブン</Text>
              </View>
              <Switch
                value={profile.kitchen_equipment.has_oven}
                onValueChange={(value) => handleKitchenEquipmentChange('has_oven', value)}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={profile.kitchen_equipment.has_oven ? colors.primary : colors.white}
              />
            </View>

            {/* Rice Cooker */}
            <View style={styles.equipmentItem}>
              <View style={styles.equipmentLeft}>
                <CookingPot size={20} color={colors.primary} />
                <Text style={styles.equipmentLabel}>炊飯器</Text>
              </View>
              <Switch
                value={profile.kitchen_equipment.has_rice_cooker}
                onValueChange={(value) => handleKitchenEquipmentChange('has_rice_cooker', value)}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={
                  profile.kitchen_equipment.has_rice_cooker ? colors.primary : colors.white
                }
              />
            </View>
          </View>
        </View>

        {/* Other Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Bell size={20} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>通知設定</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <HelpCircle size={20} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>ヘルプ</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <FileText size={20} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>利用規約</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <LogOut size={20} color={colors.error} />
                <Text style={[styles.menuLabel, styles.logoutText]}>ログアウト</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>ワンパン・バディ v1.0.0</Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Seasonings Modal */}
      <Modal
        visible={showSeasoningsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSeasoningsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSeasoningsModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>常備調味料</Text>
            <TouchableOpacity onPress={saveSeasonings}>
              <Text style={styles.modalSaveButton}>保存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              家にある調味料を選択してください。選択した調味料は買い物リストから除外されます。
            </Text>

            {Object.entries(DEFAULT_SEASONINGS).map(([category, items]) => (
              <View key={category} style={styles.seasoningCategory}>
                <Text style={styles.seasoningCategoryTitle}>
                  {getCategoryLabel(category)}
                </Text>
                <View style={styles.seasoningChips}>
                  {items.map((item) => {
                    const isSelected = selectedSeasonings.has(item.name);
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[
                          styles.seasoningChip,
                          isSelected && styles.seasoningChipSelected,
                        ]}
                        onPress={() => toggleSeasoning(item.name)}
                      >
                        <Text style={styles.seasoningEmoji}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.seasoningChipText,
                            isSelected && styles.seasoningChipTextSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isSelected && (
                          <Check size={16} color={colors.white} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.modalSpacer} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.selectedCount}>
              {selectedSeasonings.size}種類を選択中
            </Text>
            <TouchableOpacity
              style={styles.modalSaveButtonLarge}
              onPress={saveSeasonings}
            >
              <Text style={styles.modalSaveButtonLargeText}>保存する</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },

  content: {
    flex: 1,
  },

  // Section
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statProgress: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  badgeItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 80,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  badgeName: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Menu extras
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuBadge: {
    fontSize: 13,
    color: colors.textMuted,
  },
  newBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Household
  householdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  householdButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  householdButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  householdButtonActive: {
    backgroundColor: colors.primary,
  },
  householdButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  householdButtonTextActive: {
    color: colors.white,
  },

  // Dislikes
  addButton: {
    padding: spacing.xs,
  },
  dislikeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dislikeInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  addDislikeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addDislikeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: spacing.xs,
  },
  dislikesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  dislikeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  dislikeChipText: {
    fontSize: 14,
    color: colors.text,
  },
  removeChipButton: {
    padding: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Kitchen Equipment
  equipmentContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  equipmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  equipmentLabel: {
    fontSize: 16,
    color: colors.text,
  },
  stoveButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stoveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoveButtonActive: {
    backgroundColor: colors.primary,
  },
  stoveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stoveButtonTextActive: {
    color: colors.white,
  },

  // Menu
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.text,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: colors.error,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  spacer: {
    height: 80,
  },

  // Seasonings
  seasoningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  seasoningsPreview: {
    flex: 1,
    marginRight: spacing.sm,
  },
  seasoningsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  seasoningsCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  seasoningsHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    paddingLeft: spacing.xs,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  seasoningCategory: {
    marginBottom: spacing.lg,
  },
  seasoningCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  seasoningChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  seasoningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seasoningChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seasoningEmoji: {
    fontSize: 16,
  },
  seasoningChipText: {
    fontSize: 14,
    color: colors.text,
  },
  seasoningChipTextSelected: {
    color: colors.white,
  },
  modalSpacer: {
    height: 100,
  },
  modalFooter: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedCount: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalSaveButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalSaveButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Diagnosis Card
  diagnosisCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  diagnosisMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagnosisIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosisEmoji: {
    fontSize: 28,
  },
  diagnosisInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  diagnosisTypeName: {
    fontSize: 18,
    fontWeight: '700',
  },
  diagnosisShort: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  diagnosisKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  diagnosisKeywordTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  diagnosisKeywordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  diagnosisDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
});
