// ============================================
// Onerepi - Cooking Feedback Screen
// Post-cooking feedback to learn preferences
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  X,
  Star,
  Camera,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { supabaseService, CookingFeedback } from '../lib/supabase-service';
import { MOCK_RECIPES } from '../lib/mockData';
import {
  createFeedbackFromRecipe,
  saveFeedback,
  CookingFeedback as PreferenceFeedback,
} from '../lib/preferenceLearner';

// Brand Colors
const brandColors = {
  primary: '#D4490F',
  primaryLight: '#E8601F',
  primarySoft: '#FFF0E8',
  cream: '#FFF8E7',
  warmBrown: '#8B7355',
  text: '#2D1810',
  textSecondary: '#5D4037',
  textMuted: '#A1887F',
  white: '#FFFFFF',
  border: '#F0E6DE',
  surface: '#FAFAFA',
  success: '#4CAF50',
  starActive: '#FFB800',
  starInactive: '#E0E0E0',
};

type CookingFeedbackScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CookingFeedback'>;
  route: RouteProp<RootStackParamList, 'CookingFeedback'>;
};

const StarRating = ({
  rating,
  onRate,
  size = 32,
}: {
  rating: number;
  onRate: (rating: number) => void;
  size?: number;
}) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRate(star);
          }}
          style={styles.starButton}
        >
          <Star
            size={size}
            color={star <= rating ? brandColors.starActive : brandColors.starInactive}
            fill={star <= rating ? brandColors.starActive : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const CookingFeedbackScreen: React.FC<CookingFeedbackScreenProps> = ({
  navigation,
  route,
}) => {
  const { recipeId, recipeName, recipeEmoji } = route.params;

  const [overallRating, setOverallRating] = useState(0);
  const [tasteRating, setTasteRating] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [wouldMakeAgain, setWouldMakeAgain] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'カメラを使用するには権限が必要です');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('評価を入力してください', '全体の評価を星で選んでください');
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Supabase用のフィードバック（既存）
      const feedback: Omit<CookingFeedback, 'id' | 'user_id' | 'created_at'> = {
        recipe_id: recipeId,
        rating: overallRating,
        taste_rating: tasteRating || undefined,
        difficulty_rating: difficultyRating || undefined,
        would_make_again: wouldMakeAgain ?? false,
        notes: notes.trim() || undefined,
        photo_url: photoUri || undefined,
        cooked_at: new Date().toISOString(),
      };

      await supabaseService.saveCookingFeedback(feedback);

      // 好み学習用のフィードバックも保存
      const recipe = MOCK_RECIPES.find((r) => r.id === recipeId);
      if (recipe) {
        // 味のコメントを決定
        let tasteComment: PreferenceFeedback['tasteComment'] = undefined;
        if (tasteRating === 5) {
          tasteComment = 'perfect';
        } else if (tasteRating <= 2 && notes.includes('しょっぱ')) {
          tasteComment = 'too_salty';
        } else if (tasteRating <= 2 && notes.includes('薄')) {
          tasteComment = 'too_bland';
        } else if (tasteRating <= 2 && notes.includes('辛')) {
          tasteComment = 'too_spicy';
        } else if (tasteRating <= 2 && notes.includes('甘')) {
          tasteComment = 'too_sweet';
        }

        // 難易度のコメントを決定
        let difficultyComment: PreferenceFeedback['difficultyComment'] = undefined;
        if (difficultyRating >= 4) {
          difficultyComment = 'easy';
        } else if (difficultyRating === 3) {
          difficultyComment = 'just_right';
        } else if (difficultyRating <= 2 && difficultyRating > 0) {
          difficultyComment = 'difficult';
        }

        // 好み学習用のフィードバックを作成
        const preferenceFeedback = createFeedbackFromRecipe(
          recipe,
          overallRating,
          wouldMakeAgain ?? false
        );
        preferenceFeedback.tasteComment = tasteComment;
        preferenceFeedback.difficultyComment = difficultyComment;

        // 保存して学習（saveFeedback内部でupdateLearnedPreferencesが呼ばれる）
        await saveFeedback(preferenceFeedback);
      }

      Alert.alert(
        'ありがとうございます！',
        'フィードバックを保存しました。あなたの好みを学習して、より良いレシピを提案します。',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving feedback:', error);
      Alert.alert('エラー', 'フィードバックの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.white} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
            <X size={24} color={brandColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>調理完了</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Recipe Info */}
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeEmoji}>{recipeEmoji}</Text>
            <Text style={styles.recipeName}>{recipeName}</Text>
            <Text style={styles.congratsText}>
              お疲れさまでした！{'\n'}作った料理はいかがでしたか？
            </Text>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 写真を残す</Text>
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoUri(null)}
                >
                  <X size={16} color={brandColors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={24} color={brandColors.primary} />
                  <Text style={styles.photoButtonText}>撮影する</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Text style={styles.photoButtonText}>ライブラリから選ぶ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ 全体の評価</Text>
            <Text style={styles.sectionSubtitle}>
              この料理を総合的に評価してください
            </Text>
            <StarRating rating={overallRating} onRate={setOverallRating} size={40} />
          </View>

          {/* Taste Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👅 味の評価</Text>
            <StarRating rating={tasteRating} onRate={setTasteRating} size={32} />
          </View>

          {/* Difficulty Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 作りやすさ</Text>
            <Text style={styles.sectionSubtitle}>
              簡単だったら⭐5、難しかったら⭐1
            </Text>
            <StarRating
              rating={difficultyRating}
              onRate={setDifficultyRating}
              size={32}
            />
          </View>

          {/* Would Make Again */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 また作りたい？</Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  wouldMakeAgain === true && styles.yesNoButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWouldMakeAgain(true);
                }}
              >
                <ThumbsUp
                  size={24}
                  color={
                    wouldMakeAgain === true
                      ? brandColors.white
                      : brandColors.success
                  }
                />
                <Text
                  style={[
                    styles.yesNoText,
                    wouldMakeAgain === true && styles.yesNoTextActive,
                  ]}
                >
                  また作りたい！
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  wouldMakeAgain === false && styles.yesNoButtonActiveNo,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWouldMakeAgain(false);
                }}
              >
                <ThumbsDown
                  size={24}
                  color={
                    wouldMakeAgain === false
                      ? brandColors.white
                      : brandColors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.yesNoText,
                    wouldMakeAgain === false && styles.yesNoTextActive,
                  ]}
                >
                  もういいかな
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MessageSquare size={16} color={brandColors.text} /> メモ
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="気づいたこと、アレンジしたこと、次回への改善点など..."
              placeholderTextColor={brandColors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              overallRating === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={overallRating === 0 || isSubmitting}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.submitButtonText,
                overallRating === 0 && styles.submitButtonTextDisabled,
              ]}
            >
              {isSubmitting ? '保存中...' : 'フィードバックを送信'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>スキップ</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  recipeInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: brandColors.primarySoft,
  },
  recipeEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: '700',
    color: brandColors.text,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: 15,
    fontWeight: '400',
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: brandColors.textMuted,
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  starButton: {
    padding: 4,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
  photoPreview: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  yesNoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  yesNoButtonActive: {
    backgroundColor: brandColors.success,
    borderColor: brandColors.success,
  },
  yesNoButtonActiveNo: {
    backgroundColor: brandColors.textMuted,
    borderColor: brandColors.textMuted,
  },
  yesNoText: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.textSecondary,
  },
  yesNoTextActive: {
    color: brandColors.white,
  },
  notesInput: {
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: brandColors.text,
    borderWidth: 1,
    borderColor: brandColors.border,
    minHeight: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: brandColors.white,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: brandColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.white,
  },
  submitButtonTextDisabled: {
    color: brandColors.textMuted,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: brandColors.textMuted,
  },
});
