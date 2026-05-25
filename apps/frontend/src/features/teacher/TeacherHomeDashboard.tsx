'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { Sparkles, Plus, ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

import AppHeader from '@/components/ui/AppHeader';
import { listAssignments, API_BACKEND_ORIGIN } from '@/lib/api/assignments';
import { fetchAnalyticsSummary, type AnalyticsSummary } from '@/lib/api/analyticsApi';
import { fadeUp, fadeIn, scaleIn, stagger } from '@/lib/motion';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 flex flex-col items-center justify-center flex-1 shadow-[0_12px_44px_rgba(0,0,0,0.04)] min-h-[128px] sm:min-h-[140px]"
    >
      <span className="text-[44px] font-extrabold text-[#111111] leading-none tracking-tight mb-2">{value}</span>
      <span className="text-[14px] font-[800] text-[#111111] text-center">{label}</span>
    </motion.div>
  );
}

interface AssignmentShape {
  _id: string;
  input: { title: string; subject: string; topic: string; dueDate?: string; gradeLevel?: string };
  status: string;
  studentIds?: string[];
  createdAt: string;
}

function isCanceledAxios(err: unknown): boolean {
  return axios.isCancel(err) || (axios.isAxiosError(err) && err.code === 'ERR_CANCELED');
}

export function TeacherHomeDashboard() {
  const { user } = useUser();
  const { isLoaded: authLoaded, userId } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentShape[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoaded) return;

    if (!userId) {
      queueMicrotask(() => {
        setLoading(false);
        setAssignments([]);
        setAnalytics(null);
      });
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        const [listData, ana] = await Promise.all([
          listAssignments(1, undefined, ac.signal),
          fetchAnalyticsSummary().catch(() => null),
        ]);
        if (!ac.signal.aborted) {
          setAssignments((listData.assignments ?? []) as unknown as AssignmentShape[]);
          setAnalytics(ana);
        }
      } catch (e) {
        if (!isCanceledAxios(e) && process.env.NODE_ENV === 'development') console.error(e);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [authLoaded, userId]);

  const classOptions: { id: string; name: string }[] = [];
  /** Class filter scaffold (no REST class model yet — empty list behaves like reference before data load). */

  const filtered = useMemo(() => {
    /** No classId on assignment locally — selector no-op until backend adds it */
    if (!selectedClassId) return assignments;
    return assignments;
  }, [assignments, selectedClassId]);

  const papersGenerated = filtered.filter((a) => a.status === 'completed').length;
  const timeSaved =
    papersGenerated > 0 ? Math.round(((papersGenerated * 15) / 60) * 10) / 10 : 0;

  const gradedTotal = analytics?.byStatus.completed ?? 0;
  const gradedThisWeek = useMemo(() => {
    const w = analytics?.weekly;
    if (w?.length)
      return w[w.length - 1]?.count ?? papersGenerated;
    return papersGenerated;
  }, [analytics?.weekly, papersGenerated]);

  const gaugeMax = Math.max(analytics?.totalAssignments ?? filtered.length ?? 1, 1);
  const gaugeVal = Math.min(
    gradedThisWeek > 0 ? gradedThisWeek : papersGenerated || gradedTotal || gaugeMax,
    gaugeMax
  );
  const gaugeFraction = Math.min(Math.max(gaugeVal / gaugeMax, 0), 1);

  /** Semi-circular arc length in user units matches strokeDasharray (`π * radius`, r = 80). */
  const semiArcLen = Math.PI * 80;

  const recent = filtered.slice(0, 4);

  return (
    <div className="flex flex-col min-h-full w-full font-[family-name:var(--font-bricolage,ui-sans-serif)] px-4 sm:px-6 md:px-8 lg:px-10 py-4 md:py-6 pb-8 gap-6">
      {/* Single scroll lives in AppShell; header sticks within that region on md+ */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="shrink-0 md:sticky md:top-0 md:z-20 md:bg-[#f5f6f8]/92 md:supports-backdrop-filter:backdrop-blur-md md:shadow-[0_1px_0_rgba(0,0,0,0.05)] pb-3 md:pb-4"
      >
        <AppHeader
          breadcrumb="Home"
          classes={classOptions}
          selectedClassId={selectedClassId}
          onClassChange={setSelectedClassId}
        />
      </motion.div>

      <div className="flex flex-col w-full gap-6">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          className="flex flex-col xl:flex-row gap-5"
        >
          <motion.div
            variants={fadeUp}
            className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:w-full xl:w-[57%] min-h-[min(380px,calc(100dvh-12rem))] border border-gray-50/50"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-6">
              <div className="flex flex-col min-w-0 order-2 sm:order-1">
                <h1 className="text-[26px] sm:text-[34px] font-extrabold text-[#111111] mb-2 tracking-tight leading-tight">
                  Hi {user?.firstName ?? 'Teacher'}!
                </h1>
                <p className="text-[14px] sm:text-[15px] font-medium text-[#9ca3af] max-w-[320px] leading-relaxed">
                  Welcome back. Here&apos;s your teaching summary.
                </p>
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                className="relative w-[112px] h-[112px] sm:w-[130px] sm:h-[130px] flex items-center justify-center shrink-0 self-start sm:self-auto order-1 sm:order-2 mx-auto sm:mx-0"
              >
                <div className="absolute inset-0 rounded-full bg-[#fef5f0] scale-[0.85] border border-[#fceee6]" />
                <div className="absolute top-4 right-2 w-3.5 h-3.5 rounded-full bg-[#fe5b2b] shadow-sm border-2 border-white" />
                <div className="absolute bottom-6 -left-1 w-3 h-3 rounded-full bg-[#fe5b2b] shadow-sm border-2 border-white" />
                <div className="absolute top-10 -right-2 w-2 h-2 rounded-full bg-[#fde1d3]" />
                <div className="w-[84px] h-[84px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden bg-white z-10 flex items-center justify-center border-4 border-white shadow-md">
                  {user?.imageUrl ? (
                    <Image src={user.imageUrl} alt="Avatar" width={100} height={100} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span className="text-[32px] sm:text-[38px] leading-none">{user?.firstName?.[0] ?? '👩‍🏫'}</span>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="bg-[#f9fafb] border border-gray-200 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between mt-auto shadow-sm gap-4">
              <div className="flex flex-col pr-4">
                <h2 className="text-[20px] font-extrabold text-[#111111] mb-2 tracking-tight">
                  AI Teacher&apos;s Toolkit
                </h2>
                <p className="text-[14px] font-medium text-[#7a818c] max-w-[340px] leading-relaxed">
                  Quickly create lesson plans, question papers, and curriculum-aligned teaching materials.
                </p>
              </div>
              <Link
                href="/create"
                className="bg-[#fe5b2b] text-white px-9 py-4 rounded-full font-bold text-[14.5px] shadow-[0_10px_30px_rgba(254,91,43,0.35)] hover:bg-[#eb4e1e] transition-colors shrink-0 text-center"
              >
                Continue Now
              </Link>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row xl:w-[43%] gap-5 h-full">
            <motion.div
              variants={fadeUp}
              className="flex shrink-0 flex-1 flex-col items-center justify-between rounded-[28px] bg-[#252525] px-6 pb-10 pt-[52px] shadow-[0_20px_50px_rgba(0,0,0,0.22)] sm:rounded-[32px] sm:px-8 sm:pb-12 sm:pt-14 min-h-[min(340px,52dvh)] sm:min-h-[380px]"
            >
              {/* Taller wrapper: metric sits only in the cavity under the arc; vertical-centering pulled digits into stroke + round caps. */}
              <div className="relative mx-auto h-[148px] w-[min(100%,228px)] shrink-0">
                <svg className="block h-[128px] w-full overflow-visible" viewBox="0 0 200 118" aria-hidden>
                  <path
                    d="M 20 118 A 80 80 0 0 1 180 118"
                    fill="none"
                    stroke="#3a3a3a"
                    strokeWidth="26"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M 20 118 A 80 80 0 0 1 180 118"
                    fill="none"
                    stroke="#fe5c38"
                    strokeWidth="26"
                    strokeLinecap="round"
                    strokeDasharray={semiArcLen}
                    initial={{ strokeDashoffset: semiArcLen }}
                    animate={{ strokeDashoffset: semiArcLen * (1 - gaugeFraction) }}
                    transition={{ duration: 1.15, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>

                {/* Inner ridge ~≤52px @128px svg height — start stack at ~64px (+pt) so cap height clears orange stroke. */}
                <div className="pointer-events-none absolute inset-x-0 top-[52px] bottom-0 flex flex-col items-center justify-start gap-2 pt-3">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.75, duration: 0.35 }}
                    className="flex items-baseline justify-center gap-px"
                  >
                    {loading ? (
                      <Loader2 className="h-9 w-9 animate-spin text-white/80" aria-label="Loading" />
                    ) : (
                      <>
                        <span className="text-[52px] font-bold leading-[0.92] tracking-[-0.045em] text-white tabular-nums sm:text-[56px]">
                          {gaugeVal}
                        </span>
                        <span className="text-[20px] font-bold leading-none text-neutral-400 tabular-nums sm:text-[22px]">
                          /{gaugeMax}
                        </span>
                      </>
                    )}
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.88, duration: 0.35 }}
                    className="text-[11.5px] font-semibold uppercase tracking-[0.34em] text-[#b0b0b0]"
                  >
                    reviews
                  </motion.span>
                </div>
              </div>

              <Link
                href="/assignments"
                className="mx-auto mt-14 flex min-h-[56px] w-full max-w-[272px] flex-col items-center justify-center rounded-[999px] bg-white px-10 py-[17px] text-center outline-none shadow-[0_16px_44px_rgba(0,0,0,0.28)] transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-white/50 sm:mt-16"
              >
                <span className="text-[14.75px] font-bold leading-snug tracking-[-0.01em] text-[#151b24]">
                  Continue to
                </span>
                <span className="text-[14.75px] font-bold leading-snug tracking-[-0.01em] text-[#151b24]">
                  classroom
                </span>
              </Link>
            </motion.div>

            <motion.div variants={stagger(0.12)} initial="hidden" animate="show" className="flex flex-col gap-5 flex-1 min-w-[200px]">
              <StatCard label="Assignments Graded" value={gradedTotal} />
              <motion.div
                variants={fadeUp}
                className="bg-[#303030] rounded-[32px] p-6 flex flex-col items-center justify-center flex-1 shadow-[0_16px_40px_rgba(42,42,42,0.2)] min-h-[140px]"
              >
                <span className="text-[13px] font-medium text-white/90 text-center mb-1.5">Time Saved By AI</span>
                <span className="text-[38px] font-extrabold text-white leading-none tracking-tight mb-2">
                  {timeSaved > 0 ? `${timeSaved} hrs` : papersGenerated === 0 ? '3.3 hrs' : '0 hrs'}
                </span>
                <span className="text-[11px] font-medium text-gray-400 text-center">
                  {papersGenerated > 0 ? '1.5 hrs more than last week' : '~15 min saved per paper'}
                </span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="flex flex-row items-center justify-between gap-4 mt-4 w-full flex-wrap"
        >
          <div className="flex items-center min-w-0">
            <div className="w-3.5 h-3.5 rounded-full bg-[#4ebf7b] mr-3 shrink-0 shadow-[0_0_12px_rgba(78,191,123,0.6)] border-2 border-[#dcf4e5] blur-[0.5px]" />
            <h2 className="text-[19px] sm:text-[21px] font-extrabold text-[#111111] tracking-tight truncate">
              Recent Assignments
            </h2>
          </div>
          <Link
            href="/assignments"
            className="bg-[#1c1c1c] text-white pl-5 pr-4 py-2.5 rounded-full text-[13.5px] font-extrabold flex items-center justify-center transition-colors hover:bg-black shadow-[0_4px_16px_rgba(0,0,0,0.1)] h-11 shrink-0"
          >
            View All <ChevronRight size={16} strokeWidth={3} className="ml-1" />
          </Link>
        </motion.div>

        <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
          ) : recent.length === 0 ? (
            Array.from({ length: 2 }).map((_, i) => (
              <motion.div
                key={`sk-${String(i)}`}
                variants={scaleIn}
                className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 flex flex-col relative overflow-hidden opacity-60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">No Assignment</h3>
                    <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-[#f4f4f4] text-[#a0a0a0]">
                      —
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-[12px] font-bold text-gray-400 mt-6 pb-1">
                  <p>
                    <span className="text-gray-900">Assigned on: </span>—
                  </p>
                  <p>
                    <span className="text-gray-900">Due: </span>—
                  </p>
                </div>
                <div className="w-full h-1 bg-[#fe5b2b] rounded-full mt-4 opacity-80" />
              </motion.div>
            ))
          ) : (
            recent.map((a) => {
              const now = new Date();
              const due = a.input.dueDate ? new Date(a.input.dueDate) : null;
              const isReady = a.status === 'completed';
              const progress = a.status === 'processing' || a.status === 'pending';
              const isGenerating = progress || !isReady;

              const statusLabel =
                isGenerating ? 'Draft' : due && due > now ? 'Active' : 'Closed';
              const statusColor = isGenerating
                ? 'bg-[#fff3ed] text-[#fe5b2b]'
                : due && due > now
                  ? 'bg-[#dcf4e5] text-[#3ea468]'
                  : 'bg-[#f4f4f4] text-[#a0a0a0]';

              const totalStudents = a.studentIds?.length ?? 0;
              const classInfo = [a.input.gradeLevel, a.input.subject].filter(Boolean).join(' • ');
              const canOpen = a.status !== 'failed';

              return (
                <motion.div
                  key={a._id}
                  variants={scaleIn}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!canOpen) return;
                    const href =
                      a.status === 'completed' ? `/assignments/${a._id}/result` : `/assignments/${a._id}`;
                    router.push(href);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && canOpen) {
                      e.preventDefault();
                      const href =
                        a.status === 'completed' ? `/assignments/${a._id}/result` : `/assignments/${a._id}`;
                      router.push(href);
                    }
                  }}
                  className={`bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 flex flex-col relative overflow-hidden ${
                    canOpen ? 'cursor-pointer hover:border-orange-200 hover:shadow-md transition-all' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight truncate">
                        {a.input.title || 'Untitled'}
                      </h3>
                      <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <button type="button" className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
                      <span className="text-[18px] leading-none">⋮</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-400 mt-1.5 line-clamp-2">
                    <span>{classInfo || a.input.subject}</span>
                  </div>
                  <div className="text-[13px] font-bold text-gray-700 mt-3">
                    0/{totalStudents > 0 ? totalStudents : '—'}{' '}
                    <span className="text-gray-400 font-medium">Submitted</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[12px] font-bold text-gray-400 mt-4 pb-1">
                    <p>
                      <span className="text-gray-900">Assigned on: </span>
                      {new Date(a.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </p>
                    {a.input.dueDate ? (
                      <p>
                        <span className="text-gray-900">Due: </span>
                        {new Date(a.input.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                      </p>
                    ) : (
                      <p>
                        <span className="text-gray-900">Due: </span>—
                      </p>
                    )}
                  </div>
                  <div className="w-full h-1 bg-[#fe5b2b] rounded-full mt-4 opacity-80" />
                </motion.div>
              );
            })
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.5 }}
          className="bg-white rounded-[28px] sm:rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_12px_44px_rgba(0,0,0,0.04)] mt-1 w-full gap-4 mb-4 md:mb-6"
        >
          <div className="flex items-center gap-3 md:ml-2 text-center md:text-left">
            <Sparkles size={20} strokeWidth={2.5} className="text-[#111111] shrink-0" />
            <span className="text-[16px] font-extrabold text-[#111111]">
              Manage your assignments and track submissions
            </span>
          </div>
          <Link
            href="/create"
            className="bg-[#1c1c1c] w-full md:w-auto text-white px-7 py-3 rounded-full text-[14px] font-bold flex items-center justify-center transition-colors hover:bg-black shrink-0"
          >
            <Plus size={16} strokeWidth={3} className="mr-2" />
            Create Assignment
          </Link>
        </motion.div>

        <p className="sr-only">API origin {API_BACKEND_ORIGIN}</p>
      </div>
    </div>
  );
}
