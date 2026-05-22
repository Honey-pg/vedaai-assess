'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { PaperView } from '@/components/paper/PaperView';
import { useAssignmentStore, GeneratedPaper } from '@/lib/store/assignmentStore';
import { getAssignment } from '@/lib/api/assignments';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { generatedPaper, setGeneratedPaper } = useAssignmentStore();
  const [loading, setLoading] = useState(!generatedPaper);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (generatedPaper) return;
    async function fetchResult() {
      try {
        const assignment = await getAssignment(id) as Record<string, unknown>;
        if (assignment.status === 'completed' && assignment.result) {
          setGeneratedPaper(assignment.result as GeneratedPaper);
        } else if (assignment.status === 'processing' || assignment.status === 'pending') {
          router.replace(`/assignments/${id}`);
        } else {
          setError('No result available');
        }
      } catch {
        setError('Failed to load assignment result');
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [id, generatedPaper, setGeneratedPaper, router]);

  if (loading) {
    return (
      <AppShell>
        <TopBar title="Assignment" backHref="/assignments" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#A0AEC0]" />
        </div>
      </AppShell>
    );
  }

  if (error || !generatedPaper) {
    return (
      <AppShell>
        <TopBar title="Assignment" backHref="/assignments" />
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-[#1A202C] mb-2">Error</p>
            <p className="text-sm text-[#718096]">{error || 'No paper data available'}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar title="Create New" backHref="/assignments" />
      <PaperView paper={generatedPaper} assignmentId={id} />
    </AppShell>
  );
}
