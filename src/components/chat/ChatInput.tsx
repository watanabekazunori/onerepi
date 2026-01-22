// ============================================
// One-Pan Buddy - Chat Input Component
// ============================================

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, Mic, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../lib/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCameraPress?: () => void;
  onVoicePress?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onCameraPress,
  onVoicePress,
  placeholder = 'メッセージを入力...',
  disabled = false,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSend(text.trim());
      setText('');
    }
  };

  const handleCameraPress = () => {
    if (onCameraPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCameraPress();
    }
  };

  const handleVoicePress = () => {
    if (onVoicePress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onVoicePress();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Camera Button */}
        {onCameraPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleCameraPress}
            disabled={disabled}
          >
            <Camera size={24} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Text Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            editable={!disabled}
          />
        </View>

        {/* Send or Voice Button */}
        {text.trim() ? (
          <TouchableOpacity
            style={[styles.sendButton, disabled && styles.disabled]}
            onPress={handleSend}
            disabled={disabled}
          >
            <Send size={20} color={colors.white} />
          </TouchableOpacity>
        ) : (
          onVoicePress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleVoicePress}
              disabled={disabled}
            >
              <Mic size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },

  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },

  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },

  input: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabled: {
    opacity: 0.5,
  },
});
