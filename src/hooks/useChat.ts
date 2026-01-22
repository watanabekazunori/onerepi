// ============================================
// One-Pan Buddy - Chat Hook
// Manages chat state and AI interactions
// ============================================

import { useState, useCallback } from 'react';
import { ChatMessage, ChatOption } from '../types';

interface UseChatOptions {
  initialMessages?: ChatMessage[];
  onRecipeSelect?: (recipeId: string) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  selectOption: (option: ChatOption) => Promise<void>;
  clearMessages: () => void;
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { initialMessages = [], onRecipeSelect } = options;
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const generateAIResponse = useCallback(async (userInput: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

    const input = userInput.toLowerCase();

    // Context-aware responses
    if (input.includes('腹') || input.includes('空') || input.includes('がっつり')) {
      return 'お腹ペコペコですね！🍽️ ボリューム満点のレシピを提案しますね！';
    }

    if (input.includes('時間') || input.includes('早') || input.includes('急')) {
      return '時短レシピですね！⚡ 10分以内で作れるものをピックアップします！';
    }

    if (input.includes('ヘルシー') || input.includes('野菜') || input.includes('健康')) {
      return '健康志向ですね！🥗 野菜たっぷりのレシピはいかがですか？';
    }

    if (input.includes('節約') || input.includes('安')) {
      return '節約モードですね！💰 コスパ抜群のレシピを探しますよ！';
    }

    if (input.includes('パスタ') || input.includes('麺')) {
      return 'パスタ系ですね！🍝 ペペロンチーノやナポリタンはいかがですか？';
    }

    if (input.includes('肉') || input.includes('チキン') || input.includes('豚')) {
      return 'お肉料理ですね！🍖 ガパオライスや豚キムチはいかがですか？';
    }

    // Default responses
    const responses = [
      'いい選択ですね！✨ おすすめのレシピを見つけました！',
      'なるほど！🤔 それにぴったりのレシピがありますよ！',
      'わかりました！🍳 今日の気分に合わせて提案しますね！',
      'いいですね！今日のおすすめレシピを選んでみました！',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    // Add user message
    addMessage({
      type: 'user',
      content: text,
    });

    // Show typing indicator
    setIsTyping(true);

    try {
      const response = await generateAIResponse(text);
      setIsTyping(false);

      // Add AI response
      addMessage({
        type: 'ai',
        content: response,
      });

      // Add recipe suggestions after certain keywords
      if (
        text.includes('おすすめ') ||
        text.includes('何') ||
        text.includes('提案')
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        addMessage({
          type: 'ai',
          content: '今日のおすすめレシピです！',
          options: [
            { id: 'gapao', label: 'ガパオライス（15分）', value: 'gapao', emoji: '🍳' },
            { id: 'kimchi', label: '豚キムチ丼（10分）', value: 'kimchi', emoji: '🥢' },
            { id: 'peperoncino', label: 'ペペロンチーノ（20分）', value: 'peperoncino', emoji: '🍝' },
          ],
        });
      }
    } catch (error) {
      setIsTyping(false);
      addMessage({
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。',
      });
    }
  }, [addMessage, generateAIResponse]);

  const selectOption = useCallback(async (option: ChatOption) => {
    // Add user's selection as a message
    addMessage({
      type: 'user',
      content: `${option.emoji || ''} ${option.label}`.trim(),
    });

    // Check if it's a recipe selection
    if (['gapao', 'kimchi', 'peperoncino'].includes(option.value)) {
      if (onRecipeSelect) {
        onRecipeSelect(option.value);
      }
      return;
    }

    // Generate response for other options
    setIsTyping(true);
    const response = await generateAIResponse(option.label);
    setIsTyping(false);

    addMessage({
      type: 'ai',
      content: response,
    });
  }, [addMessage, generateAIResponse, onRecipeSelect]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    selectOption,
    clearMessages,
  };
};
