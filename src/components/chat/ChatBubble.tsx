// ============================================
// One-Pan Buddy - Chat Bubble Component
// LINE-style messaging interface
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Clock, ChevronRight } from 'lucide-react-native';
import { ChatBubbleProps, ChatOption, Recipe } from '../../types';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { FryingPanIcon } from '../ui/FryingPanIcon';

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onOptionSelect,
  onRecipeSelect,
}) => {
  const isAI = message.type === 'ai';
  const formattedTime = message.timestamp.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleOptionPress = (option: ChatOption) => {
    if (onOptionSelect) {
      onOptionSelect(option);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    if (onRecipeSelect) {
      onRecipeSelect(recipe);
    }
  };

  // If this is a recipes message, render recipe cards
  if (message.recipes && message.recipes.length > 0) {
    return (
      <View style={[styles.container, styles.aiContainer]}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <FryingPanIcon size={28} color={colors.primary} variant="solid" />
        </View>

        <View style={styles.recipesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesContent}
          >
            {message.recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe)}
                activeOpacity={0.8}
              >
                <View style={styles.recipeEmoji}>
                  <Text style={styles.recipeEmojiText}>{recipe.emoji}</Text>
                </View>
                <Text style={styles.recipeName} numberOfLines={2}>
                  {recipe.name}
                </Text>
                <View style={styles.recipeMeta}>
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={styles.recipeTime}>{recipe.cooking_time_minutes}分</Text>
                </View>
                <View style={styles.recipeSelectButton}>
                  <Text style={styles.recipeSelectText}>選ぶ</Text>
                  <ChevronRight size={14} color={colors.white} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>
      </View>
    );
  }

  const hasOptions = message.options && message.options.length > 0;

  return (
    <View style={styles.messageContainer}>
      <View style={[styles.container, isAI ? styles.aiContainer : styles.userContainer]}>
        {/* Avatar (AI only) */}
        {isAI && (
          <View style={styles.avatar}>
            <FryingPanIcon size={28} color={colors.primary} variant="solid" />
          </View>
        )}

        <View style={[styles.messageWrapper, !isAI && styles.userMessageWrapper]}>
          {/* Message Bubble */}
          <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
            {message.isTyping ? (
              <TypingIndicator />
            ) : (
              <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
                {message.content}
              </Text>
            )}
          </View>

          {/* Timestamp (inline for messages without options) */}
          {!hasOptions && (
            <Text style={[styles.timestamp, isAI ? styles.aiTimestamp : styles.userTimestamp]}>
              {formattedTime}
            </Text>
          )}
        </View>
      </View>

      {/* Options (Full width, outside the message wrapper) */}
      {hasOptions && (
        <View style={styles.optionsOuterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionsContainer}
            contentContainerStyle={styles.optionsContent}
          >
            {message.options!.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionChip}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.7}
              >
                {option.emoji && (
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                )}
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.timestamp, styles.optionsTimestamp]}>
            {formattedTime}
          </Text>
        </View>
      )}
    </View>
  );
};

// Typing indicator (3 animated dots)
const TypingIndicator: React.FC = () => {
  return (
    <View style={styles.typingContainer}>
      <View style={[styles.typingDot, styles.dot1]} />
      <View style={[styles.typingDot, styles.dot2]} />
      <View style={[styles.typingDot, styles.dot3]} />
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },

  messageWrapper: {
    maxWidth: '75%',
    flexShrink: 1,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },

  bubble: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  aiBubble: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },

  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: colors.text,
  },
  userText: {
    color: colors.white,
  },

  timestamp: {
    fontSize: 11,
    marginTop: spacing.xs,
  },
  aiTimestamp: {
    color: colors.textMuted,
    textAlign: 'left',
  },
  userTimestamp: {
    color: colors.textMuted,
    textAlign: 'right',
  },

  // Options (Chip buttons)
  optionsOuterContainer: {
    marginTop: spacing.sm,
    paddingLeft: 56, // avatar width (40) + marginRight (spacing.sm = 8) + small padding
  },
  optionsContainer: {
    flexGrow: 0,
  },
  optionsContent: {
    paddingRight: spacing.md,
    paddingLeft: spacing.md,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  optionEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  optionLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  optionsTimestamp: {
    color: colors.textMuted,
    textAlign: 'left',
    paddingLeft: spacing.md,
    marginTop: spacing.xs,
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },

  // Recipe cards
  recipesWrapper: {
    flex: 1,
  },
  recipesContent: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  recipeCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeEmoji: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  recipeEmojiText: {
    fontSize: 24,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    minHeight: 36,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  recipeTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recipeSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  recipeSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
