'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { useAssignmentStore } from '@/lib/store/assignmentStore';
import { useAssignmentSocket } from '@/lib/socket/useSocket';
import { getAssignment, regenerateAssignment } from '@/lib/api/assignments';

export default function AssignmentProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { jobStatus, jobProgress, jobMessage, updateJobStatus, setGeneratedPaper } =
    useAssignmentStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useAssignmentSocket(id);

  useEffect(() => {
    async function checkStatus() {
      try {
        const assignment = await getAssignment(id) as Record<string, unknown>;
        if (assignment.status === 'completed' && assignment.result) {
          setGeneratedPaper(assignment.result as ReturnType<typeof useAssignmentStore.getState>['generatedPaper'] & Record<string, unknown>);
          router.replace(`/assignments/${id}/result`);
          return;
        }
        if (assignment.status === 'failed') {
          updateJobStatus('failed', 0, (assignment.error as string) || 'Generation failed');
        } else if (assignment.status === 'processing') {
          updateJobStatus('processing', jobProgress || 10, 'Processing...');
        } else {
          updateJobStatus('pending', 0, 'Waiting in queue...');
        }
      } catch {
        updateJobStatus('failed', 0, 'Failed to fetch assignment status');
      } finally {
        setInitialLoad(false);
      }
    }
    checkStatus();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (jobStatus === 'completed') {
      const timer = setTimeout(() => {
        router.replace(`/assignments/${id}/result`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [jobStatus, id, router]);

  useEffect(() => {
    if (initialLoad) return;
    if (jobStatus === 'failed' || jobStatus === 'completed') return;

    const poll = async () => {
      try {
        const assignment = (await getAssignment(id)) as Record<string, unknown>;
        if (assignment.status === 'completed' && assignment.result) {
          setGeneratedPaper(
            assignment.result as ReturnType<
              typeof useAssignmentStore.getState
            >['generatedPaper'] & Record<string, unknown>
          );
          router.replace(`/assignments/${id}/result`);
          return;
        }
        if (assignment.status === 'failed') {
          updateJobStatus(
            'failed',
            0,
            (assignment.error as string) || 'Generation failed'
          );
        }
      } catch {
        /* ignore transient poll errors */
      }
    };

    const interval = setInterval(poll, 6000);
    void poll();
    return () => clearInterval(interval);
  }, [initialLoad, jobStatus, id, router, setGeneratedPaper, updateJobStatus]);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await regenerateAssignment(id);
      updateJobStatus('pending', 0, 'Retrying...');
    } catch {
      updateJobStatus('failed', 0, 'Retry failed');
    } finally {
      setIsRetrying(false);
    }
  };

  if (initialLoad) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar title="Assignment" backHref="/assignments" />
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl border border-border/60 p-8 text-center shadow-sm">
            {jobStatus === 'failed' ? (
              <>
                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-lg font-bold mb-2">Generation Failed</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {jobMessage || 'Something went wrong while generating your assessment.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/assignments/new')}
                    className="rounded-full"
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="gap-1.5 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                  >
                    {isRetrying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Retry
                  </Button>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-5"
                >
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                </motion.div>
                <h2 className="text-lg font-bold mb-2">Generating Your Assessment</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {jobMessage || 'Our AI is crafting your questions...'}
                </p>
                <p className="text-xs text-muted-foreground/80 mb-4 -mt-4">
                  Stay on this page. Large papers can take a few minutes; progress updates when the AI responds or retries after rate limits.
                </p>
                <Progress value={jobProgress} className="h-2 mb-3" />
                <p className="text-xs text-muted-foreground tabular-nums">
                  {jobProgress}% Complete
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
