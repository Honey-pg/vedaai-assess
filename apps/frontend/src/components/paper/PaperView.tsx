'use client';

import { useState } from 'react';
import { Download, RefreshCw, ChevronLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { regenerateAssignment } from '@/lib/api/assignments';

interface Question {
  id: string; text: string; type: string; difficulty: string;
  marks: number; options?: string[]; correctAnswer?: string;
}
interface Section {
  id: string; title: string; instruction: string;
  questions: Question[]; totalMarks: number;
}
interface GeneratedPaper {
  id: string; assignmentId: string; title: string; subject: string;
  topic: string; gradeLevel: string; totalMarks: number;
  duration?: string; sections: Section[]; createdAt: string;
}

const diffLabel: Record<string, string> = { easy: 'Easy', medium: 'Moderate', hard: 'Challenging' };
const diffStyle: Record<string, string> = {
  easy: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  medium: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  hard: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
};

export function PaperView({
  paper,
  assignmentId,
  variant = 'teacher',
}: {
  paper: GeneratedPaper;
  assignmentId: string;
  variant?: 'teacher' | 'student';
}) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const isStudent = variant === 'student';
  const assignmentsListPath = isStudent ? '/student/assignments' : '/assignments';

  const sectionQuestionStarts = paper.sections.map((_, index) =>
    1 + paper.sections.slice(0, index).reduce((sum, s) => sum + s.questions.length, 0)
  );

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const pdfRenderer = await import('@react-pdf/renderer');
      const { PaperPDFDocument } = await import('./PDFExport');
      const React = await import('react');
      const doc = React.createElement(PaperPDFDocument, {
        paper,
        institutionName: 'Delhi Public School, Sector-4, Bokaro',
        showAnswers: !isStudent,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdfRenderer.pdf(doc as any).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paper.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) { console.error('PDF failed:', e); }
    finally { setIsDownloading(false); }
  };

  const handleRegenerate = async () => {
    if (isStudent) return;
    setIsRegenerating(true);
    await regenerateAssignment(assignmentId);
    router.push(`/assignments/${assignmentId}`);
  };

  return (
    <div className="page-enter">
      {/* Action Bar */}
      <div className="sticky top-16 z-10 bg-white border-b border-[#E8ECF4] no-print">
        <div className="max-w-[800px] mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push(assignmentsListPath)}
              className="text-[#4A5568] hover:text-[#1A202C] shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-base font-semibold text-[#1A202C] truncate">{paper.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isStudent ? (
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 text-sm text-[#4A5568] border border-[#E8ECF4] bg-white px-4 py-2 rounded-lg hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                {isRegenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Regenerate
              </button>
            ) : null}
            <button type="button" onClick={handleDownloadPDF} disabled={isDownloading}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#FF6B35] px-4 py-2 rounded-lg hover:bg-[#E55A24] transition-colors">
              {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center px-4 md:px-8 py-6 md:py-8 w-full">
        <div className="w-full max-w-[800px] mx-auto">
        {/* AI Chat Intro */}
        <div className="bg-[#F8F9FC] border border-[#E8ECF4] rounded-[12px] p-4 flex items-start gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-[#FF6B35] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            AI
          </div>
          <p className="text-sm text-[#4A5568] leading-relaxed">
            Certainly! Here are customized Question Paper for your <strong>CBSE {paper.gradeLevel} {paper.subject}</strong> classes
            on the <strong>{paper.topic}</strong> chapters:
          </p>
        </div>

        {/* Exam Paper */}
        <div className="bg-white rounded-[14px] border border-[#E8ECF4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-10 md:p-12"
          style={{ fontFamily: 'var(--font-paper), Lora, Georgia, serif' }}>

          {/* Paper Header */}
          <div className="text-center pb-4 border-b-2 border-[#1A202C] mb-5">
            <h1 className="text-lg font-bold text-[#1A202C]">Delhi Public School, Sector-4, Bokaro</h1>
            <p className="text-base font-semibold mt-1">Subject: {paper.subject}</p>
            <p className="text-sm mt-0.5">Class: {paper.gradeLevel}</p>
          </div>

          <div className="flex items-center justify-between text-sm mb-1">
            <span>Time Allowed: {paper.duration || '45 minutes'}</span>
            <span>Maximum Marks: {paper.totalMarks}</span>
          </div>
          <p className="text-xs text-[#4A5568] mb-5">All questions are compulsory unless stated otherwise.</p>

          {/* Student Info */}
          <div className="flex flex-wrap gap-8 py-4 border-t border-b border-[#E8ECF4] mb-6">
            <div className="flex items-end gap-1">
              <span className="text-sm">Name:</span>
              <span className="border-b-[1.5px] border-[#1A202C] w-40 pb-0.5" />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-sm">Roll Number:</span>
              <span className="border-b-[1.5px] border-[#1A202C] w-28 pb-0.5" />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-sm">Class: {paper.gradeLevel} Section:</span>
              <span className="border-b-[1.5px] border-[#1A202C] w-20 pb-0.5" />
            </div>
          </div>

          {/* Sections */}
          {paper.sections.map((section, sectionIndex) => {
            const start = sectionQuestionStarts[sectionIndex];
            return (
              <div key={section.id} className="mb-7">
                <div className="pb-2 border-b-[1.5px] border-[#1A202C] mb-3 mt-7">
                  <h2 className="text-base font-bold uppercase tracking-wide text-[#1A202C]">{section.title}</h2>
                  <p className="text-sm italic text-[#4A5568] mt-1">
                    {section.instruction}. Each question carries {section.questions[0]?.marks || 0} marks
                  </p>
                </div>

                {section.questions.map((q, i) => (
                  <div key={q.id} className="py-3 border-b border-dashed border-[#E8ECF4] last:border-none flex items-start justify-between gap-4 hover:bg-[#FAFBFF] transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-sm font-bold text-[#1A202C] min-w-[24px]">{start + i}.</span>
                      <div className="flex-1">
                        <p className="text-sm text-[#1A202C] leading-relaxed">{q.text}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-1.5 ml-1">
                            {q.options.map((opt, oi) => (
                              <p key={oi} className="text-sm text-[#4A5568] py-0.5">
                                {String.fromCharCode(65 + oi)}. {opt.replace(/^[A-D]\.\s*/, '')}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diffStyle[q.difficulty] || diffStyle.easy}`}>
                        [{diffLabel[q.difficulty] || q.difficulty}]
                      </span>
                      <span className="text-[10px] font-semibold text-[#4A5568] whitespace-nowrap">
                        [{q.marks} Marks]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* End */}
          <div className="mt-8 pt-4 border-t border-[#E8ECF4] text-center">
            <p className="text-sm font-bold tracking-widest uppercase text-[#1A202C]">End of Question Paper</p>
          </div>
        </div>

        {!isStudent ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-2 text-sm font-medium text-[#FF6B35] hover:text-[#E55A24] transition-colors"
            >
              {showAnswers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showAnswers ? 'Hide Answer Key' : 'Show Answer Key'}
            </button>

            {showAnswers && (
              <div className="mt-3 bg-[#F8F9FC] rounded-[10px] p-5">
                <h3 className="text-sm font-bold text-[#1A202C] mb-3">Answer Key</h3>
                <p className="text-xs text-[#718096] mb-3">
                  Numbers match question order above. Older papers may omit answers until you use <strong>Regenerate</strong>.
                </p>
                <ul className="space-y-2 list-none">
                  {paper.sections.flatMap((section, sectionIndex) =>
                    section.questions.map((q, qi) => {
                      const globalNum = sectionQuestionStarts[sectionIndex] + qi;
                      const ans =
                        typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
                      return (
                        <li
                          key={q.id}
                          className="text-sm leading-relaxed border-b border-[#E8ECF4]/80 pb-2 last:border-0 last:pb-0"
                        >
                          <span className="font-bold text-[#1A202C]">{globalNum}. </span>
                          <span className={ans ? 'text-[#4A5568]' : 'text-[#A0AEC0] italic'}>
                            {ans ||
                              'Answer not saved for this question — regenerate the assignment to populate from the AI.'}
                          </span>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
