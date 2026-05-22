'use client';

import { cn } from '@/lib/utils';

interface FormProgressProps {
  totalMarks: number;
  totalQuestions: number;
}

export function FormProgress({ totalMarks, totalQuestions }: FormProgressProps) {
  return (
    <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Total Questions
        </span>
        <span
          className={cn(
            'text-lg font-bold tabular-nums',
            totalQuestions > 0 ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {totalQuestions}
        </span>
      </div>
      <div className="h-6 w-px bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Total Marks
        </span>
        <span
          className={cn(
            'text-lg font-bold tabular-nums',
            totalMarks > 0 ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {totalMarks}
        </span>
      </div>
    </div>
  );
}
