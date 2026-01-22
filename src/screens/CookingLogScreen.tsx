// ============================================
// ワンパン・バディ - Cooking Log Screen (自炊日記)
// Photo upload, rating, and memo functionality
// ============================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, CookingLog } from '../types';
import { MOCK_COOKING_LOGS, MOCK_RECIPES } from '../lib/mockData';
import { colors, spacing, borderRadius } from '../lib/theme';

type CookingLogScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 3) / 2;

// Calendar helpers
const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];

  // Fill empty days before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Fill actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export const CookingLogScreen: React.FC<CookingLogScreenProps> = ({ navigation }) => {
  const [logs, setLogs] = useState<CookingLog[]>(MOCK_COOKING_LOGS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogRecipeId, setNewLogRecipeId] = useState<string | null>(null);
  const [newLogPhoto, setNewLogPhoto] = useState<string | null>(null);
  const [newLogRating, setNewLogRating] = useState(3);
  const [newLogMemo, setNewLogMemo] = useState('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Get logs for current month
  const monthLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = new Date(log.cooked_at);
      return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;
    });
  }, [logs, currentYear, currentMonth]);

  // Get log dates map for calendar highlighting
  const logDatesMap = useMemo(() => {
    const map: Record<number, CookingLog[]> = {};
    monthLogs.forEach((log) => {
      const day = new Date(log.cooked_at).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(log);
    });
    return map;
  }, [monthLogs]);

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayPress = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dayLogs = logDatesMap[day];
    if (dayLogs && dayLogs.length > 0) {
      // Show logs for this day
      Alert.alert(
        `${currentMonth + 1}月${day}日の記録`,
        dayLogs.map((l) => `${l.recipe?.emoji || '🍽️'} ${l.recipe?.name || '料理'}`).join('\n')
      );
    }
  };

  const handleAddLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAddModal(true);
    setNewLogRecipeId(null);
    setNewLogPhoto(null);
    setNewLogRating(3);
    setNewLogMemo('');
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('権限が必要です', '写真ライブラリへのアクセスを許可してください');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewLogPhoto(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('権限が必要です', 'カメラへのアクセスを許可してください');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewLogPhoto(result.assets[0].uri);
    }
  };

  const handleSaveLog = () => {
    if (!newLogRecipeId) {
      Alert.alert('レシピを選択してください');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const recipe = MOCK_RECIPES.find((r) => r.id === newLogRecipeId);
    const newLog: CookingLog = {
      id: `log-${Date.now()}`,
      user_id: 'user-1',
      recipe_id: newLogRecipeId,
      recipe,
      photo_url: newLogPhoto || undefined,
      rating: newLogRating,
      memo: newLogMemo || undefined,
      cooked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setLogs((prev) => [newLog, ...prev]);
    setShowAddModal(false);
  };

  const renderRatingStars = (rating: number, onPress?: (r: number) => void) => (
    <View style={styles.ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress?.(star)}
          disabled={!onPress}
        >
          <Star
            size={onPress ? 32 : 16}
            color={star <= rating ? colors.warning : colors.border}
            fill={star <= rating ? colors.warning : 'none'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍳 自炊日記</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddLog}>
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentYear}年{currentMonth + 1}月
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
              <ChevronRight size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, i) => (
              <Text
                key={label}
                style={[
                  styles.weekdayLabel,
                  i === 0 && styles.sundayLabel,
                  i === 6 && styles.saturdayLabel,
                ]}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {monthDays.map((day, index) => {
              const hasLog = day ? logDatesMap[day] : null;
              const isToday =
                day === new Date().getDate() &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    isToday && styles.calendarDayToday,
                    hasLog && styles.calendarDayWithLog,
                  ]}
                  onPress={() => day && handleDayPress(day)}
                  disabled={!day}
                >
                  {day && (
                    <>
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                          hasLog && styles.calendarDayTextWithLog,
                        ]}
                      >
                        {day}
                      </Text>
                      {hasLog && (
                        <View style={styles.logIndicator}>
                          <Text style={styles.logIndicatorEmoji}>
                            {hasLog[0].recipe?.emoji || '🍽️'}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Logs */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>最近の記録</Text>
          <View style={styles.logsGrid}>
            {logs.slice(0, 6).map((log) => (
              <TouchableOpacity key={log.id} style={styles.logCard}>
                <View style={styles.logImageContainer}>
                  {log.photo_url ? (
                    <Image source={{ uri: log.photo_url }} style={styles.logImage} />
                  ) : (
                    <View style={styles.logImagePlaceholder}>
                      <Text style={styles.logImageEmoji}>{log.recipe?.emoji || '🍽️'}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.logName} numberOfLines={1}>
                    {log.recipe?.name || '料理'}
                  </Text>
                  {renderRatingStars(log.rating)}
                  <Text style={styles.logDate}>
                    {new Date(log.cooked_at).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>今月の統計</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthLogs.length}</Text>
              <Text style={styles.statLabel}>作った回数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {monthLogs.length > 0
                  ? (monthLogs.reduce((sum, l) => sum + l.rating, 0) / monthLogs.length).toFixed(1)
                  : '-'}
              </Text>
              <Text style={styles.statLabel}>平均評価</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {new Set(monthLogs.map((l) => l.recipe_id)).size}
              </Text>
              <Text style={styles.statLabel}>レシピ数</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Add Log Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>記録を追加</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Photo */}
              <Text style={styles.modalLabel}>写真</Text>
              <View style={styles.photoSection}>
                {newLogPhoto ? (
                  <View style={styles.selectedPhotoContainer}>
                    <Image source={{ uri: newLogPhoto }} style={styles.selectedPhoto} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => setNewLogPhoto(null)}
                    >
                      <X size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                      <Camera size={24} color={colors.primary} />
                      <Text style={styles.photoButtonText}>撮影</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                      <Calendar size={24} color={colors.primary} />
                      <Text style={styles.photoButtonText}>選択</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Recipe Selection */}
              <Text style={styles.modalLabel}>レシピ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipeSelect}>
                {MOCK_RECIPES.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={[
                      styles.recipeOption,
                      newLogRecipeId === recipe.id && styles.recipeOptionSelected,
                    ]}
                    onPress={() => setNewLogRecipeId(recipe.id)}
                  >
                    <Text style={styles.recipeOptionEmoji}>{recipe.emoji}</Text>
                    <Text
                      style={[
                        styles.recipeOptionName,
                        newLogRecipeId === recipe.id && styles.recipeOptionNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {recipe.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Rating */}
              <Text style={styles.modalLabel}>評価</Text>
              <View style={styles.ratingSection}>
                {renderRatingStars(newLogRating, setNewLogRating)}
              </View>

              {/* Memo */}
              <Text style={styles.modalLabel}>メモ（任意）</Text>
              <TextInput
                style={styles.memoInput}
                value={newLogMemo}
                onChangeText={setNewLogMemo}
                placeholder="感想やアレンジポイントなど..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveLog}>
              <Text style={styles.saveButtonText}>保存する</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  // Calendar
  calendarSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthNavButton: {
    padding: spacing.xs,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  sundayLabel: {
    color: colors.error,
  },
  saturdayLabel: {
    color: colors.primary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calendarDayToday: {
    backgroundColor: colors.primaryLight + '30',
    borderRadius: borderRadius.md,
  },
  calendarDayWithLog: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.text,
  },
  calendarDayTextToday: {
    fontWeight: '700',
    color: colors.primary,
  },
  calendarDayTextWithLog: {
    fontWeight: '600',
  },
  logIndicator: {
    position: 'absolute',
    bottom: 2,
  },
  logIndicatorEmoji: {
    fontSize: 10,
  },

  // Recent Logs
  recentSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  logsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  logCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logImageContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  logImage: {
    width: '100%',
    height: '100%',
  },
  logImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logImageEmoji: {
    fontSize: 40,
  },
  logInfo: {
    padding: spacing.sm,
  },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  logDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Stats
  statsSection: {
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  spacer: {
    height: 100,
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    padding: spacing.md,
    maxHeight: 400,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // Photo Section
  photoSection: {
    marginBottom: spacing.sm,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  selectedPhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  selectedPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recipe Selection
  recipeSelect: {
    marginBottom: spacing.sm,
  },
  recipeOption: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.sm,
    width: 80,
  },
  recipeOptionSelected: {
    backgroundColor: colors.primary,
  },
  recipeOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  recipeOptionName: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recipeOptionNameSelected: {
    color: colors.white,
  },

  // Rating
  ratingSection: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  // Memo
  memoInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Save Button
  saveButton: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
