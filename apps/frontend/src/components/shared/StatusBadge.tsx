'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize font-medium text-xs px-2.5 py-0.5',
        statusStyles[status] || statusStyles.pending,
        className
      )}
    >
      {status}
    </Badge>
  );
}
