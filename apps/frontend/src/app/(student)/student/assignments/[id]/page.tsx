'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TopBar } from '@/components/layout/TopBar';
import { useAssignmentStore } from '@/lib/store/assignmentStore';
import { useAssignmentSocket } from '@/lib/socket/useSocket';
import { getAssignment } from '@/lib/api/assignments';

export default function StudentAssignmentProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isLoaded: authLoaded, userId } = useAuth();

  const { jobStatus, jobProgress, jobMessage, updateJobStatus, setGeneratedPaper } =
    useAssignmentStore();
  const [initialLoad, setInitialLoad] = useState(true);

  useAssignmentSocket(id);

  useEffect(() => {
    if (!authLoaded) return;
    if (!userId) {
      queueMicrotask(() => {
        setInitialLoad(false);
      });
      return;
    }
    async function checkStatus() {
      try {
        const assignment = await getAssignment(id) as Record<string, unknown>;
        if (assignment.status === 'completed' && assignment.result) {
          setGeneratedPaper(
            assignment.result as ReturnType<typeof useAssignmentStore.getState>['generatedPaper'] &
              Record<string, unknown>
          );
          router.replace(`/student/assignments/${id}/result`);
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
    void checkStatus();
  }, [id, authLoaded, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (jobStatus === 'completed') {
      const timer = setTimeout(() => router.replace(`/student/assignments/${id}/result`), 500);
      return () => clearTimeout(timer);
    }
  }, [jobStatus, id, router]);

  useEffect(() => {
    if (!authLoaded || !userId) return;
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
          router.replace(`/student/assignments/${id}/result`);
        } else if (assignment.status === 'failed') {
          updateJobStatus('failed', 0, (assignment.error as string) || 'Generation failed');
        }
      } catch {
        /* ignore transient poll errors */
      }
    };

    const interval = setInterval(() => void poll(), 6000);
    void poll();
    return () => clearInterval(interval);
  }, [authLoaded, userId, initialLoad, jobStatus, id, router, setGeneratedPaper, updateJobStatus]);

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <TopBar title="Assignment" backHref="/student/assignments" />
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
                <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
                <p className="text-sm text-muted-foreground mb-6">{jobMessage || 'Generation failed.'}</p>
                <Button variant="outline" onClick={() => router.push('/student/assignments')} className="rounded-full">
                  Back to assignments
                </Button>
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
                <h2 className="text-lg font-bold mb-2">Your teacher&apos;s AI is generating this paper</h2>
                <p className="text-sm text-muted-foreground mb-6">{jobMessage || 'Hang tight…'}</p>
                <Progress value={jobProgress} className="h-2 mb-3" />
                <p className="text-xs text-muted-foreground tabular-nums">{jobProgress}% Complete</p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
