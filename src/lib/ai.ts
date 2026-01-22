// ============================================
// ワンパン・バディ - AI Service
// Claude API integration for recipe chat
// ============================================

import { Recipe } from '../types';
import { MOCK_RECIPES } from './mockData';

// API Configuration
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// System prompt for the AI assistant
const SYSTEM_PROMPT = `あなたは「ワンパン・バディ」という料理アシスタントアプリのAIです。
フレンドリーで親しみやすい口調で、ユーザーの料理をサポートします。

あなたの役割:
1. ユーザーの気分、体調、時間に合わせてレシピを提案する
2. 料理のコツやアレンジ方法を教える
3. 食材の代用品を提案する
4. 献立の相談に乗る

性格:
- 親しみやすく、励まし上手
- 「〜だよ！」「〜かな？」など柔らかい口調
- 絵文字を適度に使う（🍳 🥘 👨‍🍳 など）
- 疲れているユーザーには特に優しく

利用可能なレシピ:
${MOCK_RECIPES.map((r) => `- ${r.emoji} ${r.name}（${r.cooking_time_minutes}分、${r.category}）`).join('\n')}

レシピを提案する時は、ユーザーの状況に合った理由も添えて説明してください。
回答は簡潔に、2-3文程度を目安にしてください。`;

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  suggestedRecipes?: Recipe[];
}

// Extract recipe suggestions from AI response
const extractRecipeSuggestions = (content: string): Recipe[] => {
  const suggestions: Recipe[] = [];

  MOCK_RECIPES.forEach((recipe) => {
    if (content.includes(recipe.name) || content.includes(recipe.emoji)) {
      suggestions.push(recipe);
    }
  });

  return suggestions.slice(0, 3); // Max 3 suggestions
};

// Call Claude API
export const sendMessageToAI = async (
  messages: AIMessage[],
  apiKey: string
): Promise<AIResponse> => {
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    const suggestedRecipes = extractRecipeSuggestions(content);

    return {
      content,
      suggestedRecipes: suggestedRecipes.length > 0 ? suggestedRecipes : undefined,
    };
  } catch (error) {
    console.error('AI API error:', error);
    throw error;
  }
};

// Mock AI response for development (no API key needed)
export const getMockAIResponse = async (
  userMessage: string
): Promise<AIResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

  const lowerMessage = userMessage.toLowerCase();

  // Simple pattern matching for demo
  if (lowerMessage.includes('疲れ') || lowerMessage.includes('ゾンビ') || lowerMessage.includes('だるい') || lowerMessage.includes('気力がない') || lowerMessage.includes('楽ちん')) {
    return {
      content: '疲れてる日は無理しないで〜！😌💕\n\n洗い物も少なくて超かんたんなレシピを選んだよ：\n\n✨ フライパン1つで完結\n✨ 調理10分以内\n✨ 洗い物最小限\n\nこれなら疲れてても大丈夫！',
      suggestedRecipes: [MOCK_RECIPES[0], MOCK_RECIPES[1]],
    };
  }

  if (lowerMessage.includes('時間ない') || lowerMessage.includes('急いで') || lowerMessage.includes('早く') || lowerMessage.includes('10分') || lowerMessage.includes('スピード')) {
    return {
      content: '時間がない時はおまかせ！⚡\n\n10分以内で作れるスピードレシピを厳選したよ：\n\n🏃‍♂️ 豚キムチ丼 → たった8分！\n🏃‍♂️ ガパオライス → 10分で本格味\n\n切って炒めるだけだから、あっという間に完成するよ！',
      suggestedRecipes: [MOCK_RECIPES[1], MOCK_RECIPES[0]],
    };
  }

  if (lowerMessage.includes('パスタ') || lowerMessage.includes('洋食') || lowerMessage.includes('イタリアン')) {
    return {
      content: '洋食の気分なんだね！🍝 ペペロンチーノはシンプルだけど奥が深いよ。にんにくの香りがたまらない〜！',
      suggestedRecipes: [MOCK_RECIPES[2]],
    };
  }

  if (lowerMessage.includes('和食') || lowerMessage.includes('魚') || lowerMessage.includes('ヘルシー')) {
    return {
      content: '和食でヘルシーに行こう！🐟 鮭のちゃんちゃん焼きは野菜もたっぷり取れておすすめだよ。味噌バターの風味が最高！',
      suggestedRecipes: [MOCK_RECIPES[3]],
    };
  }

  if (lowerMessage.includes('辛い') || lowerMessage.includes('中華') || lowerMessage.includes('刺激')) {
    return {
      content: '辛いもの食べたい気分わかる〜！🌶️ 麻婆豆腐で汗かいてスッキリしよう！花椒を効かせると本格的な味になるよ。',
      suggestedRecipes: [MOCK_RECIPES[4]],
    };
  }

  if (lowerMessage.includes('弁当') || lowerMessage.includes('作り置き') || lowerMessage.includes('冷めても')) {
    return {
      content: 'お弁当向きのおかず、選んでおいたよ！🍱\n\n✅ 冷めても美味しい\n✅ 作り置きOK\n✅ 汁漏れしにくい\n\n倍量で作って、明日のお弁当にも入れちゃおう！朝の時間が楽になるよ〜',
      suggestedRecipes: [MOCK_RECIPES[0], MOCK_RECIPES[1]],
    };
  }

  if (lowerMessage.includes('おすすめ') || lowerMessage.includes('なに作') || lowerMessage.includes('何作') || lowerMessage.includes('人気') || lowerMessage.includes('季節')) {
    const randomRecipes = [...MOCK_RECIPES].sort(() => 0.5 - Math.random()).slice(0, 2);
    return {
      content: `今日のおすすめはこれ！✨\n\n${randomRecipes[0].emoji} ${randomRecipes[0].name}\n└ ${randomRecipes[0].cooking_time_minutes}分で作れて、みんなに人気のメニューだよ！\n\n${randomRecipes[1].emoji} ${randomRecipes[1].name}\n└ こっちも間違いない美味しさ！\n\nどっちも試してみてね〜`,
      suggestedRecipes: randomRecipes,
    };
  }

  // Default response
  return {
    content: 'どんな料理が食べたい気分？🤔 和食、洋食、中華、アジアン...何でも相談してね！疲れ具合や調理時間も教えてくれると、ぴったりのレシピを提案できるよ！',
  };
};
