'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const colors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

interface DifficultyBadgeProps {
  difficulty: string;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize text-[10px] px-2 py-0 font-medium',
        colors[difficulty] || colors.easy,
        className
      )}
    >
      {difficulty}
    </Badge>
  );
}
