'use client';

import { QuestionCard } from './QuestionCard';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

interface SectionBlockProps {
  section: Section;
  startingNumber: number;
  showAnswers?: boolean;
}

export function SectionBlock({ section, startingNumber, showAnswers = false }: SectionBlockProps) {
  return (
    <div className="mb-8 print:mb-5">
      <div className="border-t-2 border-b border-foreground/20 py-2 mb-4 print:mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide font-serif">
            {section.title}
          </h3>
          <span className="text-xs text-muted-foreground font-medium">
            {section.totalMarks} Marks
          </span>
        </div>
        <p className="text-xs text-muted-foreground italic mt-0.5 font-serif">
          {section.instruction}
        </p>
      </div>

      {section.questions.map((question, i) => (
        <QuestionCard
          key={question.id}
          question={question}
          questionNumber={startingNumber + i}
          showAnswer={showAnswers}
        />
      ))}
    </div>
  );
}
