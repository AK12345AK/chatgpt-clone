import React from 'react';

interface SampleQuestionsProps {
  onSelect: (question: string) => void;
}

const sampleQuestions = [
  "Як справи?",
  "Розкажи жарт",
  "Що ти вмієш?",
  "Допоможи мені"
];

export default function SampleQuestions({ onSelect }: SampleQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {sampleQuestions.map((question, index) => (
        <button
          key={index}
          onClick={() => onSelect(question)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          {question}
        </button>
      ))}
    </div>
  );
} 