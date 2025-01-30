import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ціни за 1000 токенів для GPT-4
const GPT4_PRICING = {
  prompt: 0.03, // $0.03 за 1000 вхідних токенів
  completion: 0.06, // $0.06 за 1000 вихідних токенів
};

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    console.log('Отримано повідомлення:', message);
    console.log('API Key присутній:', !!process.env.OPENAI_API_KEY);

    console.log('Використовується модель: gpt-4');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Ти - модель GPT-4. Завжди представляйся як GPT-4.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('Відповідь отримано успішно');

    // Розрахунок вартості
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    
    const promptCost = (promptTokens / 1000) * GPT4_PRICING.prompt;
    const completionCost = (completionTokens / 1000) * GPT4_PRICING.completion;
    
    console.log('Відповідь від API:', response);
    console.log('Використана модель:', response.model);
    console.log('Токени запиту:', promptTokens);
    console.log('Токени відповіді:', completionTokens);
    console.log('Вартість запиту:', promptCost.toFixed(5), '$');
    console.log('Вартість відповіді:', completionCost.toFixed(5), '$');

    return NextResponse.json({
      reply: response.choices[0].message.content,
      model: response.model,
      usage: {
        promptTokens,
        completionTokens,
        promptCost: promptCost.toFixed(5),
        completionCost: completionCost.toFixed(5)
      }
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Додаємо більше деталей про помилку
    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
    console.error('Деталі помилки:', errorMessage);
    return NextResponse.json(
      { error: `Помилка при генерації відповіді: ${errorMessage}` },
      { status: 500 }
    );
  }
} 