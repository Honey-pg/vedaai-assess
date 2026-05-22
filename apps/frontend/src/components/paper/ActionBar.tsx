'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Download, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { regenerateAssignment } from '@/lib/api/assignments';

interface ActionBarProps {
  assignmentId: string;
  title: string;
  showAnswers: boolean;
  onToggleAnswers: () => void;
  onDownloadPDF: () => void;
  isDownloading?: boolean;
}

export function ActionBar({
  assignmentId,
  title,
  showAnswers,
  onToggleAnswers,
  onDownloadPDF,
  isDownloading = false,
}: ActionBarProps) {
  const router = useRouter();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      await regenerateAssignment(assignmentId);
      router.push(`/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b print:hidden">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/assignments')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAnswers}
            className="gap-1.5 hidden sm:flex"
          >
            {showAnswers ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide Answers
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Show Answers
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="gap-1.5"
          >
            {isRegenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={onDownloadPDF}
            disabled={isDownloading}
            className="gap-1.5"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
