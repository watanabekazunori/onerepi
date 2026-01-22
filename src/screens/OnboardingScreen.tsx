// ============================================
// One-Pan Buddy - Onboarding Screen
// LINE-style chat onboarding flow with name input
// Supports free-text input for dislikes/allergies
// Includes pantry seasonings selection
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  Animated,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Send, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatMessage, ChatOption, OnboardingStep, RootStackParamList } from '../types';
import { colors, spacing, borderRadius } from '../lib/theme';
import {
  DEFAULT_SEASONINGS,
  saveUserPreferences,
  setOnboardingCompleted,
} from '../lib/storage';

// Input modes for different questions
type InputMode = 'none' | 'name' | 'dislikes_detail' | 'allergy_detail' | 'seasonings';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

// Dynamic message generator based on user name
const getOnboardingMessages = (userName: string): Record<OnboardingStep, Omit<ChatMessage, 'id' | 'timestamp'>[]> => ({
  welcome: [
    {
      type: 'ai',
      content: 'やっほー！ワンパン・バディへようこそ！ 🍳',
    },
    {
      type: 'ai',
      content: '私はパンちゃん！あなたの料理をサポートするAIアシスタントだよ。',
    },
    {
      type: 'ai',
      content: 'フライパンひとつで作れる簡単レシピを一緒に見つけよう！',
    },
    {
      type: 'ai',
      content: 'まずは自己紹介させてね。私のことは「パンちゃん」って呼んでね！あなたのお名前は？（ニックネームでOK！）',
    },
  ],
  name_confirm: [
    {
      type: 'ai',
      content: `${userName}さんね！よろしくね！ 😊`,
    },
    {
      type: 'ai',
      content: `${userName}さんにピッタリのレシピを提案するために、いくつか質問させてね！`,
    },
    {
      type: 'ai',
      content: '何人分の料理を作ることが多い？',
      options: [
        { id: 'household1', label: '1人（自分だけ）', value: '1', emoji: '🧑' },
        { id: 'household2', label: '2人', value: '2', emoji: '👫' },
        { id: 'household3', label: '3〜4人', value: '3', emoji: '👨‍👩‍👧' },
        { id: 'household4', label: '5人以上', value: '5', emoji: '👨‍👩‍👧‍👦' },
      ],
    },
  ],
  household: [
    {
      type: 'ai',
      content: 'ありがとう！人数に合わせて分量を調整するね。',
    },
    {
      type: 'ai',
      content: '次は味の好み診断！どんな味付けが好き？',
      options: [
        { id: 'taste_mild', label: 'あっさり派', value: 'mild', emoji: '🥗' },
        { id: 'taste_rich', label: 'こってり派', value: 'rich', emoji: '🍖' },
        { id: 'taste_spicy', label: 'スパイシー派', value: 'spicy', emoji: '🌶️' },
        { id: 'taste_any', label: 'なんでも好き！', value: 'any', emoji: '😋' },
      ],
    },
  ],
  taste: [
    {
      type: 'ai',
      content: 'なるほど〜！好みを覚えておくね。',
    },
    {
      type: 'ai',
      content: '何か気にしていることはある？（複数選んでもOK！）',
      options: [
        { id: 'goal_none', label: '特になし', value: 'none', emoji: '😊' },
        { id: 'goal_diet', label: 'ダイエット中', value: 'diet', emoji: '⚖️' },
        { id: 'goal_muscle', label: '筋トレ・タンパク質', value: 'muscle', emoji: '💪' },
        { id: 'goal_health', label: '健康・野菜多め', value: 'health', emoji: '🥦' },
      ],
    },
  ],
  health_goals: [
    {
      type: 'ai',
      content: 'わかった！それに合わせたレシピを優先的に提案するね。',
    },
    {
      type: 'ai',
      content: '苦手な食材はある？（複数選んでもOK！）',
      options: [
        { id: 'dislike_none', label: '特になし', value: 'none', emoji: '😊' },
        { id: 'dislike_seafood', label: '魚介類', value: 'seafood', emoji: '🐟' },
        { id: 'dislike_meat', label: '肉類', value: 'meat', emoji: '🥩' },
        { id: 'dislike_veggie', label: '野菜系', value: 'veggie', emoji: '🥬' },
        { id: 'dislike_other', label: 'その他（入力する）', value: 'other_input', emoji: '✏️' },
      ],
    },
  ],
  dislikes: [
    {
      type: 'ai',
      content: 'OK！苦手なものは避けてレシピを提案するね。',
    },
    {
      type: 'ai',
      content: 'アレルギーはある？（安全のため教えてね）',
      options: [
        { id: 'allergy_none', label: '特になし', value: 'none', emoji: '😊' },
        { id: 'allergy_egg', label: '卵', value: 'egg', emoji: '🥚' },
        { id: 'allergy_milk', label: '乳製品', value: 'milk', emoji: '🥛' },
        { id: 'allergy_wheat', label: '小麦', value: 'wheat', emoji: '🌾' },
        { id: 'allergy_other', label: 'その他（入力する）', value: 'other_input', emoji: '✏️' },
      ],
    },
  ],
  dislikes_detail: [
    {
      type: 'ai',
      content: '了解！具体的に苦手な食材を教えて。',
    },
    {
      type: 'ai',
      content: '複数ある場合は「、」で区切って入力してね！',
    },
  ],
  allergy_detail: [
    {
      type: 'ai',
      content: 'アレルギー食材を教えて。これは安全のため絶対避けるからね！',
    },
    {
      type: 'ai',
      content: '複数ある場合は「、」で区切って入力してね！',
    },
  ],
  allergy: [
    {
      type: 'ai',
      content: 'ありがとう！アレルギー食材は絶対に避けるから安心してね。',
    },
    {
      type: 'ai',
      content: '料理のスキルはどのくらい？',
      options: [
        { id: 'skill_beginner', label: '初心者', value: 'beginner', emoji: '🔰' },
        { id: 'skill_basic', label: '基本はできる', value: 'basic', emoji: '👍' },
        { id: 'skill_good', label: 'まあまあ得意', value: 'good', emoji: '👨‍🍳' },
        { id: 'skill_pro', label: '料理大好き！', value: 'pro', emoji: '⭐' },
      ],
    },
  ],
  cooking_skill: [
    {
      type: 'ai',
      content: 'なるほど！スキルに合わせてレシピを提案するね。',
    },
    {
      type: 'ai',
      content: 'キッチンについて教えて！コンロは何口ある？',
      options: [
        { id: 'stove1', label: '1口', value: '1', emoji: '🔥' },
        { id: 'stove2', label: '2口', value: '2', emoji: '🔥🔥' },
        { id: 'stove3', label: '3口以上', value: '3', emoji: '🔥🔥🔥' },
      ],
    },
  ],
  kitchen: [
    {
      type: 'ai',
      content: 'ありがとう！',
    },
    {
      type: 'ai',
      content: '最後に、キッチンにある調味料を教えて！買い物リストから除外するよ 🧂',
    },
  ],
  pantry_seasonings: [
    {
      type: 'ai',
      content: `バッチリ！これで${userName}さんのことがわかったよ！`,
    },
    {
      type: 'ai',
      content: 'さて、どっちから始める？',
      options: [
        { id: 'today', label: '今日のレシピを決める', value: 'today', emoji: '🍳' },
        { id: 'weekly', label: '1週間分の献立を相談', value: 'weekly', emoji: '📅' },
      ],
    },
  ],
  plan_choice: [
    {
      type: 'ai',
      content: `OK！${userName}さんにピッタリの献立を一緒に考えよう！`,
      options: [
        { id: 'start', label: 'さっそく始める！', value: 'start', emoji: '🚀' },
      ],
    },
  ],
  complete: [],
});

// 調味料カテゴリのラベル
const SEASONING_CATEGORY_LABELS: Record<string, string> = {
  basic: '基本調味料',
  oils: '油類',
  chinese: '中華・アジアン',
  western: '洋風',
  other: 'その他',
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('none');
  const [inputPlaceholder, setInputPlaceholder] = useState('');
  const [selectedSeasonings, setSelectedSeasonings] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textInputRef = useRef<TextInput>(null);

  // 収集したユーザー情報
  const [collectedData, setCollectedData] = useState({
    household: 1,
    tastePreferences: [] as string[],
    healthGoals: [] as string[],
    dislikes: [] as string[],
    allergies: [] as string[],
    cookingSkill: 'beginner',
    kitchenEquipment: [] as string[],
  });

  // Initialize welcome messages
  useEffect(() => {
    showStepMessages('welcome');
    // 基本調味料をデフォルトで選択
    const defaultSelected = new Set<string>();
    DEFAULT_SEASONINGS.basic.forEach(s => defaultSelected.add(s.name));
    DEFAULT_SEASONINGS.oils.slice(0, 2).forEach(s => defaultSelected.add(s.name)); // サラダ油、ごま油
    setSelectedSeasonings(defaultSelected);
  }, []);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const showStepMessages = async (step: OnboardingStep, name?: string) => {
    const currentName = name || userName || 'あなた';
    const stepMessages = getOnboardingMessages(currentName)[step];
    if (!stepMessages || stepMessages.length === 0) return;

    for (let i = 0; i < stepMessages.length; i++) {
      // Show typing indicator
      setIsTyping(true);
      await delay(800 + Math.random() * 400);
      setIsTyping(false);

      // Add message
      const newMessage: ChatMessage = {
        id: `${step}-${i}-${Date.now()}`,
        ...stepMessages[i],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      await delay(200);
    }

    // Show appropriate input after certain steps
    if (step === 'welcome') {
      setInputMode('name');
      setInputPlaceholder('あなたのニックネーム...');
      setTimeout(() => textInputRef.current?.focus(), 100);
    } else if (step === 'dislikes_detail') {
      setInputMode('dislikes_detail');
      setInputPlaceholder('苦手な食材を入力（例：パクチー、セロリ）');
      setTimeout(() => textInputRef.current?.focus(), 100);
    } else if (step === 'allergy_detail') {
      setInputMode('allergy_detail');
      setInputPlaceholder('アレルギー食材を入力（例：そば、えび）');
      setTimeout(() => textInputRef.current?.focus(), 100);
    } else if (step === 'kitchen') {
      // kitchenステップの後は調味料選択UIを表示
      setInputMode('seasonings');
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const input = textInput.trim();
    const currentInputMode = inputMode;
    setInputMode('none');

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${currentInputMode}-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setTextInput('');

    await delay(300);

    // Handle different input modes
    if (currentInputMode === 'name') {
      setUserName(input);
      setCurrentStep('name_confirm');
      await showStepMessages('name_confirm', input);
    } else if (currentInputMode === 'dislikes_detail') {
      const dislikes = input.split(/[、,]/).map(s => s.trim()).filter(Boolean);
      setCollectedData(prev => ({ ...prev, dislikes: [...prev.dislikes, ...dislikes] }));
      setCurrentStep('dislikes');
      await showStepMessages('dislikes');
    } else if (currentInputMode === 'allergy_detail') {
      const allergies = input.split(/[、,]/).map(s => s.trim()).filter(Boolean);
      setCollectedData(prev => ({ ...prev, allergies: [...prev.allergies, ...allergies] }));
      setCurrentStep('allergy');
      await showStepMessages('allergy');
    }
  };

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

  const handleSeasoningsConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInputMode('none');

    // Add user response showing selected seasonings count
    const count = selectedSeasonings.size;
    const userMessage: ChatMessage = {
      id: `user-seasonings-${Date.now()}`,
      type: 'user',
      content: `🧂 ${count}種類の調味料を選択しました`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save user preferences
    await saveUserPreferences({
      name: userName,
      household: collectedData.household,
      tastePreferences: collectedData.tastePreferences,
      healthGoals: collectedData.healthGoals,
      dislikes: collectedData.dislikes,
      allergies: collectedData.allergies,
      cookingSkill: collectedData.cookingSkill,
      kitchenEquipment: collectedData.kitchenEquipment,
      pantrySeasonings: Array.from(selectedSeasonings),
    });

    await setOnboardingCompleted(true);

    await delay(300);
    setCurrentStep('pantry_seasonings');
    await showStepMessages('pantry_seasonings');
  };

  const handleOptionSelect = async (option: ChatOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user response
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: `${option.emoji || ''} ${option.label}`.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    await delay(300);

    // Handle "other_input" option - show text input for free-form entry
    if (option.value === 'other_input') {
      if (currentStep === 'health_goals') {
        // 苦手食材の「その他」→ まず苦手食材詳細入力へ
        setCurrentStep('dislikes_detail');
        await showStepMessages('dislikes_detail');
        return;
      } else if (currentStep === 'dislikes') {
        // アレルギーの「その他」→ アレルギー詳細入力へ
        setCurrentStep('allergy_detail');
        await showStepMessages('allergy_detail');
        return;
      }
    }

    // Collect data based on current step
    switch (currentStep) {
      case 'name_confirm':
        setCollectedData(prev => ({ ...prev, household: parseInt(option.value) || 1 }));
        break;
      case 'household':
        setCollectedData(prev => ({ ...prev, tastePreferences: [...prev.tastePreferences, option.value] }));
        break;
      case 'taste':
        if (option.value !== 'none') {
          setCollectedData(prev => ({ ...prev, healthGoals: [...prev.healthGoals, option.value] }));
        }
        break;
      case 'health_goals':
        if (option.value !== 'none') {
          setCollectedData(prev => ({ ...prev, dislikes: [...prev.dislikes, option.value] }));
        }
        break;
      case 'dislikes':
        if (option.value !== 'none') {
          setCollectedData(prev => ({ ...prev, allergies: [...prev.allergies, option.value] }));
        }
        break;
      case 'allergy':
        setCollectedData(prev => ({ ...prev, cookingSkill: option.value }));
        break;
      case 'cooking_skill':
        setCollectedData(prev => ({ ...prev, kitchenEquipment: [...prev.kitchenEquipment, option.value] }));
        break;
    }

    // Handle step progression
    let nextStep: OnboardingStep | null = null;

    switch (currentStep) {
      case 'name_confirm':
        nextStep = 'household';
        break;
      case 'household':
        nextStep = 'taste';
        break;
      case 'taste':
        nextStep = 'health_goals';
        break;
      case 'health_goals':
        // 苦手食材の選択 → アレルギー質問へ
        nextStep = 'dislikes';
        break;
      case 'dislikes':
        // アレルギーの選択 → 料理スキルへ
        nextStep = 'allergy';
        break;
      case 'allergy':
        // 料理スキルへ
        nextStep = 'cooking_skill';
        break;
      case 'cooking_skill':
        // キッチン設備へ
        nextStep = 'kitchen';
        break;
      case 'pantry_seasonings':
        // 今日のレシピ or 1週間献立の選択
        if (option.value === 'today') {
          // 今日のレシピ → レシピ一覧へ
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.replace('MainTabs');
          return;
        } else if (option.value === 'weekly') {
          // 1週間献立 → ドラフト会議へ
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.replace('MainTabs');
          setTimeout(() => {
            navigation.navigate('DraftMeeting' as never);
          }, 100);
          return;
        }
        nextStep = 'plan_choice';
        break;
      case 'plan_choice':
        if (option.value === 'start') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.replace('MainTabs');
          return;
        }
        nextStep = 'complete';
        break;
    }

    if (nextStep) {
      setCurrentStep(nextStep);
      await showStepMessages(nextStep);
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatBubble message={item} onOptionSelect={handleOptionSelect} />
  );

  // 調味料選択UI
  const renderSeasoningsSelector = () => (
    <View style={styles.seasoningsContainer}>
      <ScrollView style={styles.seasoningsScroll} showsVerticalScrollIndicator={false}>
        {Object.entries(DEFAULT_SEASONINGS).map(([category, items]) => (
          <View key={category} style={styles.seasoningCategory}>
            <Text style={styles.seasoningCategoryTitle}>
              {SEASONING_CATEGORY_LABELS[category] || category}
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
                        styles.seasoningName,
                        isSelected && styles.seasoningNameSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Check size={14} color={colors.white} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleSeasoningsConfirm}
      >
        <Text style={styles.confirmButtonText}>
          {selectedSeasonings.size}種類を選択して次へ
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            showsVerticalScrollIndicator={false}
          />

          {/* Typing Indicator */}
          {isTyping && (
            <ChatBubble
              message={{
                id: 'typing',
                type: 'ai',
                content: '',
                timestamp: new Date(),
                isTyping: true,
              }}
            />
          )}
        </Animated.View>

        {/* Seasonings Selector */}
        {inputMode === 'seasonings' && renderSeasoningsSelector()}

        {/* Text Input (for name, dislikes, allergies) */}
        {inputMode !== 'none' && inputMode !== 'seasonings' && (
          <View style={styles.inputContainer}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder={inputPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={textInput}
              onChangeText={setTextInput}
              onSubmitEditing={handleTextSubmit}
              returnKeyType="send"
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !textInput.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              <Send size={20} color={textInput.trim() ? colors.white : colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  messageList: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },

  // Seasonings selector styles
  seasoningsContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: 350,
  },
  seasoningsScroll: {
    padding: spacing.md,
    maxHeight: 280,
  },
  seasoningCategory: {
    marginBottom: spacing.md,
  },
  seasoningCategoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seasoningChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  seasoningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  seasoningChipSelected: {
    backgroundColor: colors.primary,
  },
  seasoningEmoji: {
    fontSize: 14,
  },
  seasoningName: {
    fontSize: 13,
    color: colors.text,
  },
  seasoningNameSelected: {
    color: colors.white,
  },
  checkIcon: {
    marginLeft: 2,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
