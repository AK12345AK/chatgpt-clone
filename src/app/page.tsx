'use client';

import React, { useState, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import LoadingDots from '@/components/LoadingDots';
import SampleQuestions from '@/components/SampleQuestions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    promptCost?: string;
    completionCost?: string;
    speechCharacters?: number;
  };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [lastUsage, setLastUsage] = useState<Message['usage']>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playMessage = async (text: string, messageIndex: number) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');

      const characterCount = response.headers.get('x-character-count');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Оновлюємо повідомлення з інформацією про використання символів
      setMessages(prev => prev.map((msg, idx) => {
        if (idx === messageIndex) {
          return {
            ...msg,
            usage: {
              ...msg.usage,
              speechCharacters: Number(characterCount)
            }
          };
        }
        return msg;
      }));

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
      }
    } catch (error) {
      console.error('Error playing message:', error);
      setIsSpeaking(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      if (data.reply) {
        const botMessage: Message = {
          role: 'assistant',
          content: data.reply,
          usage: data.usage
        };
        setMessages(prev => [...prev, botMessage]);
        setLastUsage(data.usage);
        if (data.model) {
          setCurrentModel(data.model);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50">
      <div className="flex flex-col w-full max-w-2xl h-[600px] bg-white rounded-lg shadow-lg">
        <div className="text-sm text-gray-500 text-center py-2 border-b">
          <div>Використовується модель: {currentModel}</div>
          {lastUsage && (
            <div className="text-xs mt-1">
              Останній запит: {lastUsage.promptTokens} токенів (${lastUsage.promptCost}) | 
              Відповідь: {lastUsage.completionTokens} токенів (${lastUsage.completionCost})
              {lastUsage.speechCharacters && ` | Символів мовлення: ${lastUsage.speechCharacters}`}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index}>
              <div className="flex items-start gap-2">
                <ChatMessage message={msg} />
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => playMessage(msg.content, index)}
                    className={`p-2 rounded-full ${
                      isSpeaking ? 'bg-red-500' : 'bg-blue-500'
                    } text-white`}
                  >
                    {isSpeaking ? '■' : '▶'}
                  </button>
                )}
              </div>
              {msg.usage && (
                <div className="text-xs text-gray-400 text-right mt-1">
                  {msg.role === 'user' ? 
                    `Токени: ${msg.usage.promptTokens} (${msg.usage.promptCost}$)` :
                    `Токени: ${msg.usage.completionTokens} (${msg.usage.completionCost}$)${
                      msg.usage.speechCharacters ? ` | Символів мовлення: ${msg.usage.speechCharacters}` : ''
                    }`
                  }
                </div>
              )}
            </div>
          ))}
          {isLoading && <LoadingDots />}
        </div>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Напишіть повідомлення..."
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Надіслати
            </button>
          </div>
          <SampleQuestions onSelect={setInput} />
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </main>
  );
} 