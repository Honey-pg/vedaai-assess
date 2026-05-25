import type { GeneratedPaper, Question, Section } from '@vedaai/shared/types';

/** Strip marking keys so learners only see questions, not official answers. */
export function stripAnswersFromPaper(paper: GeneratedPaper): GeneratedPaper {
  return {
    ...paper,
    sections: paper.sections.map((section: Section) => ({
      ...section,
      questions: section.questions.map((q: Question) => {
        const { correctAnswer: _omit, ...rest } = q;
        return rest;
      }),
    })),
  };
}

export function sanitizeAssignmentRecordForStudent<T extends Record<string, unknown>>(doc: T): T {
  if (!doc.result || typeof doc.result !== 'object') return doc;
  const result = stripAnswersFromPaper(doc.result as GeneratedPaper);
  return { ...doc, result } as T;
}
