'use client';

import { DifficultyBadge } from './DifficultyBadge';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  showAnswer?: boolean;
}

export function QuestionCard({ question, questionNumber, showAnswer = false }: QuestionCardProps) {
  return (
    <div className="mb-5 print:mb-3">
      <div className="flex items-start gap-2">
        <span className="font-mono text-sm font-semibold text-muted-foreground min-w-[2rem] pt-0.5">
          Q{questionNumber}.
        </span>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm font-serif leading-relaxed flex-1">{question.text}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <DifficultyBadge difficulty={question.difficulty} />
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                [{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}]
              </span>
            </div>
          </div>

          {question.options && question.options.length > 0 && (
            <div className="ml-2 space-y-1 mt-2">
              {question.options.map((option, i) => (
                <div key={i} className="flex items-start gap-2 text-sm font-serif">
                  <span className="text-muted-foreground min-w-[1.5rem]">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span>{option.replace(/^[A-D]\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          )}

          {question.type === 'short_answer' && (
            <div className="mt-3 border-b border-dashed border-muted-foreground/30 pb-8" />
          )}

          {question.type === 'long_answer' && (
            <div className="mt-3 space-y-4">
              {[1, 2, 3].map((line) => (
                <div key={line} className="border-b border-dashed border-muted-foreground/20" />
              ))}
            </div>
          )}

          {question.type === 'fill_in_blank' && !question.options && (
            <div className="mt-2 inline-block border-b-2 border-foreground/40 w-40" />
          )}

          {showAnswer && question.correctAnswer && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              Answer: {question.correctAnswer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
