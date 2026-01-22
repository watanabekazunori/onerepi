// ============================================
// Onerepi - AI Chat Screen
// AIとの対話でレシピ提案
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Send, Sparkles, Refrigerator, X, Plus, ChefHat } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList, ChatMessage, Recipe } from '../types';
import { ChatBubble } from '../components/chat/ChatBubble';
import { getMockAIResponse, AIMessage } from '../lib/ai';
import { colors, spacing, borderRadius } from '../lib/theme';
import { supabaseService, UserProfile } from '../lib/supabase-service';

type AIChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

// Brand Colors
const brandColors = {
  primary: '#D4490F',
  primaryLight: '#E8601F',
  primarySoft: '#FFF0E8',
  cream: '#FFF8E7',
  text: '#2D1810',
  textSecondary: '#5D4037',
  textMuted: '#A1887F',
  white: '#FFFFFF',
  border: '#F0E6DE',
  surface: '#FAFAFA',
};

const QUICK_PROMPTS = [
  { label: '疲れてる...', emoji: '😫' },
  { label: '時間ない', emoji: '⏰' },
  { label: 'おすすめ教えて', emoji: '✨' },
  { label: '弁当向き', emoji: '🍱' },
];

// Common ingredients for quick selection
const COMMON_INGREDIENTS = [
  { emoji: '🥚', name: '卵' },
  { emoji: '🍖', name: '豚肉' },
  { emoji: '🍗', name: '鶏肉' },
  { emoji: '🥬', name: 'キャベツ' },
  { emoji: '🧅', name: '玉ねぎ' },
  { emoji: '🥕', name: 'にんじん' },
  { emoji: '🍅', name: 'トマト' },
  { emoji: '🥔', name: 'じゃがいも' },
  { emoji: '🍚', name: 'ごはん' },
  { emoji: '🍜', name: '麺' },
  { emoji: '🧀', name: 'チーズ' },
  { emoji: '🥓', name: 'ベーコン' },
  { emoji: '🥦', name: 'ブロッコリー' },
  { emoji: '🍄', name: 'きのこ' },
  { emoji: '🫑', name: 'ピーマン' },
  { emoji: '🥒', name: 'きゅうり' },
];

// Seasoning ID to label mapping
const SEASONING_LABELS: Record<string, string> = {
  salt: '塩',
  pepper: 'こしょう',
  soy_sauce: '醤油',
  miso: '味噌',
  mirin: 'みりん',
  sake: '料理酒',
  sugar: '砂糖',
  vinegar: '酢',
  oil: 'サラダ油',
  sesame_oil: 'ごま油',
  olive_oil: 'オリーブオイル',
  butter: 'バター',
  mayonnaise: 'マヨネーズ',
  ketchup: 'ケチャップ',
  worcester: 'ウスターソース',
  oyster_sauce: 'オイスターソース',
  dashi: 'だしの素',
  consomme: 'コンソメ',
  chicken_stock: '鶏がらスープの素',
  garlic: 'にんにく',
  ginger: '生姜',
  chili: '唐辛子',
};

export const AIChatScreen: React.FC<AIChatScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSeasonings, setUserSeasonings] = useState<string[]>([]);

  const flatListRef = useRef<FlatList>(null);

  // Load user profile and seasonings on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await supabaseService.getUserProfile();
      setUserProfile(profile);
      if (profile?.seasonings) {
        const seasoningLabels = profile.seasonings
          .map((id) => SEASONING_LABELS[id])
          .filter(Boolean);
        setUserSeasonings(seasoningLabels);
      }
    };
    loadProfile();
  }, []);

  // Initial greeting with user's name and seasonings info
  useEffect(() => {
    const createGreeting = () => {
      const userName = userProfile?.name || 'ユーザー';
      const hasSeasonings = userSeasonings.length > 0;

      let greetingText = `こんにちは、${userName}さん！🍳\n\n`;
      greetingText += '今日は何を作ろうか？気分や冷蔵庫の食材を教えてくれたら、ぴったりのレシピを提案するよ！\n\n';

      if (hasSeasonings) {
        greetingText += `💡 ${userName}さんの調味料（${userSeasonings.slice(0, 4).join('、')}${userSeasonings.length > 4 ? '等' : ''}）を使ったレシピを提案するね`;
      }

      const greeting: ChatMessage = {
        id: 'greeting',
        type: 'ai',
        content: greetingText,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    };

    // Wait for profile to load before creating greeting
    if (userProfile !== null || userSeasonings.length > 0) {
      createGreeting();
    } else {
      // Default greeting while loading
      const defaultGreeting: ChatMessage = {
        id: 'greeting',
        type: 'ai',
        content: 'こんにちは！🍳 今日は何を作ろうか？気分や時間を教えてくれたら、ぴったりのレシピを提案するよ！',
        timestamp: new Date(),
      };
      setMessages([defaultGreeting]);
    }
  }, [userProfile, userSeasonings]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Add user message
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Update conversation history
    const updatedHistory: AIMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];
    setConversationHistory(updatedHistory);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Get AI response (using mock for now)
      const response = await getMockAIResponse(userMessage);

      // Add AI message
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        recipes: response.suggestedRecipes,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update conversation history
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: response.content },
      ]);
    } catch (error) {
      console.error('AI error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'ごめんね、ちょっと調子が悪いみたい...もう一度試してみて！',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText(prompt);
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  // Ingredient modal handlers
  const toggleIngredient = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedIngredients.includes(name)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== name));
    } else {
      setSelectedIngredients([...selectedIngredients, name]);
    }
  };

  const addCustomIngredient = () => {
    if (customIngredient.trim() && !selectedIngredients.includes(customIngredient.trim())) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIngredients([...selectedIngredients, customIngredient.trim()]);
      setCustomIngredient('');
    }
  };

  const sendIngredientsToChat = () => {
    if (selectedIngredients.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowIngredientModal(false);

    // Create a message about the ingredients
    const ingredientList = selectedIngredients.join('、');
    const seasoningInfo = userSeasonings.length > 0
      ? `（調味料は${userSeasonings.slice(0, 5).join('、')}${userSeasonings.length > 5 ? '等' : ''}があります）`
      : '';

    const message = `冷蔵庫に${ingredientList}があるんだけど、何か作れる？${seasoningInfo}`;
    setInputText(message);

    // Clear selected ingredients for next time
    setSelectedIngredients([]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatBubble
      message={item}
      onRecipeSelect={handleRecipeSelect}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>AIアシスタント</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.label}
                style={styles.quickPromptChip}
                onPress={() => handleQuickPrompt(prompt.label)}
              >
                <Text style={styles.quickPromptEmoji}>{prompt.emoji}</Text>
                <Text style={styles.quickPromptText}>{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            {/* Refrigerator Button */}
            <TouchableOpacity
              style={styles.refrigeratorButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowIngredientModal(true);
              }}
            >
              <Refrigerator size={22} color={brandColors.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="メッセージを入力..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Send
                size={20}
                color={inputText.trim() ? colors.white : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Ingredient Selection Modal */}
      <Modal
        visible={showIngredientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIngredientModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowIngredientModal(false)}
            >
              <X size={24} color={brandColors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>冷蔵庫の中身</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Custom Ingredient Input */}
            <View style={styles.customInputSection}>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="食材を追加..."
                  placeholderTextColor={brandColors.textMuted}
                  value={customIngredient}
                  onChangeText={setCustomIngredient}
                  onSubmitEditing={addCustomIngredient}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.customAddButton,
                    !customIngredient.trim() && styles.customAddButtonDisabled,
                  ]}
                  onPress={addCustomIngredient}
                  disabled={!customIngredient.trim()}
                >
                  <Plus size={20} color={brandColors.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Selected Ingredients */}
            {selectedIngredients.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.sectionLabel}>
                  選択中（{selectedIngredients.length}）
                </Text>
                <View style={styles.ingredientGrid}>
                  {selectedIngredients.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={styles.ingredientChipSelected}
                      onPress={() => toggleIngredient(name)}
                    >
                      <Text style={styles.ingredientLabelSelected}>{name}</Text>
                      <X size={14} color={brandColors.white} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Common Ingredients */}
            <View style={styles.commonSection}>
              <Text style={styles.sectionLabel}>よく使う食材</Text>
              <View style={styles.ingredientGrid}>
                {COMMON_INGREDIENTS.map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={[
                      styles.ingredientChip,
                      selectedIngredients.includes(item.name) && styles.ingredientChipActive,
                    ]}
                    onPress={() => toggleIngredient(item.name)}
                  >
                    <Text style={styles.ingredientEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.ingredientLabel,
                        selectedIngredients.includes(item.name) && styles.ingredientLabelActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* User's Seasonings Info */}
            {userSeasonings.length > 0 && (
              <View style={styles.seasoningsInfo}>
                <View style={styles.seasoningsInfoHeader}>
                  <ChefHat size={18} color={brandColors.primary} />
                  <Text style={styles.seasoningsInfoTitle}>使える調味料</Text>
                </View>
                <Text style={styles.seasoningsInfoText}>
                  {userSeasonings.join('、')}
                </Text>
                <Text style={styles.seasoningsInfoNote}>
                  ※初期設定で選んだ調味料でレシピを提案します
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.sendIngredientsButton,
                selectedIngredients.length === 0 && styles.sendIngredientsButtonDisabled,
              ]}
              onPress={sendIngredientsToChat}
              disabled={selectedIngredients.length === 0}
            >
              <Sparkles size={20} color={brandColors.white} />
              <Text style={styles.sendIngredientsButtonText}>
                {selectedIngredients.length > 0
                  ? `${selectedIngredients.length}つの食材でレシピを聞く`
                  : '食材を選んでください'}
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },

  content: {
    flex: 1,
  },

  messageList: {
    paddingVertical: spacing.md,
  },

  // Quick Prompts
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  quickPromptEmoji: {
    fontSize: 14,
  },
  quickPromptText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Input
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  refrigeratorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  customInputSection: {
    marginBottom: spacing.lg,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customInput: {
    flex: 1,
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: brandColors.text,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  customAddButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: brandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddButtonDisabled: {
    backgroundColor: brandColors.border,
  },
  selectedSection: {
    marginBottom: spacing.lg,
  },
  commonSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.textSecondary,
    marginBottom: 12,
  },
  ingredientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  ingredientChipActive: {
    backgroundColor: brandColors.primarySoft,
    borderColor: brandColors.primary,
  },
  ingredientChipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  ingredientEmoji: {
    fontSize: 16,
  },
  ingredientLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.textSecondary,
  },
  ingredientLabelActive: {
    color: brandColors.primary,
  },
  ingredientLabelSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.white,
  },
  seasoningsInfo: {
    backgroundColor: brandColors.cream,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  seasoningsInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  seasoningsInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.primary,
  },
  seasoningsInfoText: {
    fontSize: 14,
    color: brandColors.textSecondary,
    lineHeight: 20,
  },
  seasoningsInfoNote: {
    fontSize: 12,
    color: brandColors.textMuted,
    marginTop: 8,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 34,
    backgroundColor: brandColors.white,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  sendIngredientsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sendIngredientsButtonDisabled: {
    backgroundColor: brandColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIngredientsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.white,
  },
});
