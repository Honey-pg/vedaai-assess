'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import AppHeader from '@/components/ui/AppHeader';
import { buttonVariants } from '@/components/ui/button';
import {
  fetchStudentAnalyticsSummary,
  type StudentAnalyticsSummary,
} from '@/lib/api/analyticsApi';
import { cn } from '@/lib/utils';

function formatDueRelative(daysUntil: number | null): string {
  if (daysUntil === null) return '—';
  if (daysUntil < 0) return `${daysUntil === -1 ? '1 day' : `${Math.abs(daysUntil)} days`} overdue`;
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `In ${daysUntil} days`;
}

function formatWeekBand(weekStartIso: string): string {
  const start = new Date(`${weekStartIso}T12:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const a = start.toLocaleDateString(undefined, opt);
  const b = end.toLocaleDateString(undefined, opt);
  return `${a} – ${b}`;
}

export default function StudentAnalyticsPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, userId } = useAuth();
  const [data, setData] = useState<StudentAnalyticsSummary | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!authLoaded) return;
    if (!userId) {
      queueMicrotask(() => {
        setErr('Please sign in to view analytics.');
        setData(null);
      });
      return;
    }
    queueMicrotask(() => {
      setErr('');
    });
    let cancel = false;
    (async () => {
      try {
        const d = await fetchStudentAnalyticsSummary();
        if (!cancel) setData(d);
      } catch {
        if (!cancel)
          setErr(
            'Could not load analytics. Ensure you are signed in as a student with shared assignments.'
          );
      }
    })();
    return () => {
      cancel = true;
    };
  }, [authLoaded, userId]);

  const inProgress = data ? data.byStatus.pending + data.byStatus.processing : 0;

  const maxSubject = useMemo(
    () => Math.max(...(data?.bySubject.map((s) => s.count) ?? [0]), 1),
    [data]
  );

  if (err) {
    return (
      <div className="flex flex-col gap-4">
        <div className="px-4 md:px-2">
          <AppHeader breadcrumb="Analytics" />
        </div>
        <div className="p-6 md:p-8 max-w-3xl">
          <p className="text-sm text-destructive">{err}</p>
        </div>
      </div>
    );
  }

  if (!authLoaded || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="px-4 md:px-2">
          <AppHeader breadcrumb="Analytics" />
        </div>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        </div>
      </div>
    );
  }

  const peakCadence = Math.max(...data.weekly.map((w) => w.count), 0);
  const cadenceScaleMax = Math.max(peakCadence, 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="px-4 md:px-2">
        <AppHeader breadcrumb="Analytics" />
      </div>
      <div className="p-6 md:p-8 space-y-10 max-w-5xl page-enter mx-auto w-full">
        <div className="text-balance">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Shared papers overview</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Figures match assessments shared with you in VedaAI—workload and due dates only, not grades or scores.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total shared" value={data.totalShared} hue="bg-chart-1" />
          <StatCard label="Ready" value={data.byStatus.completed} hue="bg-chart-3" />
          <StatCard label="In progress" value={inProgress} hue="bg-chart-2" />
          <StatCard label="Unavailable" value={data.byStatus.failed} hue="bg-destructive" />
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-veda-soft)]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Workload</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Assessment volume summed from question mixes on shared papers.
              </p>
            </div>
            <div className="flex gap-8 text-right tabular-nums">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questions</p>
                <p className="text-3xl font-bold text-foreground">{data.workload.totalQuestions}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Marks (planned)
                </p>
                <p className="text-3xl font-bold text-foreground">{data.workload.totalMarks}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teachers</p>
                <p className="text-3xl font-bold text-foreground">{data.uniqueTeachers}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-veda-soft)]">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Planner signals</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">
            For papers marked completed that have a due date—we surface past-due counts and upcoming-week signals.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PlannerStat label="Completed, due date passed" value={data.overdueCount} />
            <PlannerStat label="Due within the next 7 days" value={data.dueSoonCount} />
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-veda-soft)]">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Subject mix</h2>
          <div className="mx-auto mt-6 max-w-2xl space-y-4">
            {data.bySubject.length === 0 && (
              <p className="text-sm text-muted-foreground">No subject breakdown yet.</p>
            )}
            {data.bySubject.map((row) => {
              const pct = (row.count / maxSubject) * 100;
              return (
                <div key={row.subject} className="space-y-1.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{row.subject}</span>
                    <span className="tabular-nums shrink-0 text-muted-foreground">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full max-w-full rounded-full bg-primary/85 motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out"
                      style={{ width: `${Math.min(Math.max(pct, row.count ? 10 : 0), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-veda-soft)]">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Upcoming deadlines</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">
            Papers with a parseable due date (up to eight, soonest first). Tap a row to open—or use Open for a clearer
            target.
          </p>
          {data.upcomingDue.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">Nothing with a dated deadline yet.</p>
              <Link
                href="/student/assignments"
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'mt-4 inline-flex min-h-11')}
              >
                View assignments
              </Link>
            </div>
          ) : (
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full table-fixed border-collapse text-sm min-w-[34rem]">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">Title</th>
                    <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">Subject</th>
                    <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">Due date</th>
                    <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">Timing</th>
                    <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="py-2 text-right text-xs font-medium text-muted-foreground"> </th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingDue.map((row) => {
                    const go = () => router.push(row.hrefPath);
                    return (
                      <tr
                        key={row._id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Open assignment: ${row.title}`}
                        className={cn(
                          'border-b border-border/70 last:border-0 outline-none motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out',
                          'hover:bg-muted/50 focus-visible:bg-muted/50 cursor-pointer active:bg-muted/70'
                        )}
                        onClick={go}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            go();
                          }
                        }}
                      >
                        <td className="py-3 pr-3 align-middle">
                          <span className="font-medium text-foreground line-clamp-2" title={row.title}>
                            {row.title}
                          </span>
                        </td>
                        <td className="py-3 pr-3 align-middle text-muted-foreground">
                          <span className="line-clamp-1" title={row.subject || undefined}>
                            {row.subject || '—'}
                          </span>
                        </td>
                        <td className="py-3 pr-3 align-middle tabular-nums text-foreground">
                          {row.dueAt ?? row.dueDateRaw}
                        </td>
                        <td className="py-3 pr-3 align-middle text-foreground">
                          <span className="block font-medium leading-tight">
                            {formatDueRelative(row.daysUntil)}
                          </span>
                          {row.daysUntil !== null ? (
                            <span
                              className="text-[11px] tabular-nums text-muted-foreground"
                              aria-label={`Numeric offset ${row.daysUntil} days`}
                            >
                              Δ {row.daysUntil} days
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-2 align-middle">
                          <StatusPill status={row.status} />
                        </td>
                        <td className="py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={row.hrefPath}
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'inline-flex min-h-9 gap-1 px-3 shadow-none'
                            )}
                          >
                            Open <ChevronRight className="size-3.5 opacity-70" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-veda-soft)]">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Last 30 days cadence</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-1 leading-relaxed">
            Each column is a calendar week when papers could arrive. Taller orange bars mean more papers were shared that
            week; short bars are quieter weeks—even zero keeps the timeline grounded.
          </p>
          <p className="text-xs text-muted-foreground mb-6">Bands use UTC Monday starts; dates follow your locale.</p>

          <div className="mb-2 flex justify-end">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Peak this month <span className="tabular-nums text-foreground">{peakCadence}</span>
              </span>
            </div>
            <div className="relative flex h-[10.5rem] items-end gap-1.5 sm:gap-2">
                <div className="pointer-events-none absolute inset-x-0 bottom-8 top-2 flex flex-col justify-between opacity-75">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-t border-border/50" />
                  ))}
                </div>
                <div className="pointer-events-none absolute bottom-8 left-0 right-0 border-b border-border" />
                {data.weekly.map((bucket) => {
                  const pct = Math.round((bucket.count / cadenceScaleMax) * 100);
                  const floor = bucket.count === 0 ? 10 : Math.max(pct, 14);
                  return (
                    <div
                      key={bucket.weekStart}
                      className="relative z-[1] flex min-w-0 flex-1 flex-col justify-end gap-2 group/bar"
                      title={`${bucket.count} shared (${formatWeekBand(bucket.weekStart)})`}
                    >
                      <div className="text-[11px] text-center font-medium tabular-nums text-muted-foreground group-hover/bar:text-foreground motion-safe:transition-colors">
                        {bucket.count}
                      </div>
                      <div className="relative h-32 w-full flex items-end justify-center px-px">
                        <div
                          className="flex h-full w-[min(3rem,92%)] max-w-full items-end justify-center overflow-hidden rounded-t-md bg-muted/80"
                        >
                          <div
                            className={cn(
                              'w-full rounded-t-md bg-primary/88 motion-safe:transition-[height,background-color] motion-safe:duration-200 motion-safe:ease-out group-hover/bar:bg-primary',
                              bucket.count === 0 && 'opacity-35'
                            )}
                            style={{ height: `${floor}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className="line-clamp-2 px-px text-center text-[10px] leading-tight text-muted-foreground sm:text-[11px]"
                        title={formatWeekBand(bucket.weekStart)}
                      >
                        {formatWeekBand(bucket.weekStart)}
                      </span>
                    </div>
                  );
                })}
              </div>
        </section>

        <footer className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Link href="/student/assignments" className={cn(buttonVariants({ size: 'default' }), 'min-h-11 px-6')}>
            My assignments
          </Link>
          <Link href="/student/join" className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'min-h-11 px-6')}>
            Join a class code
          </Link>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, hue }: { label: string; value: number; hue: string }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className={cn('h-10 w-1 shrink-0 rounded-full', hue)} aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
    </article>
  );
}

function PlannerStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-muted/25 px-4 py-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? '';
  const variants: Record<string, string> = {
    completed: 'border border-chart-3/35 bg-chart-3/15 text-emerald-800 dark:text-emerald-200',
    processing: 'border border-chart-2/35 bg-chart-2/15 text-amber-900 dark:text-amber-100',
    pending: 'border border-border bg-muted/80 text-muted-foreground',
    failed: 'border border-destructive/30 bg-destructive/10 text-destructive',
  };
  const cls = variants[s] ?? 'border border-border bg-muted/80 text-muted-foreground';
  return (
    <span className={`inline-flex max-w-full rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      <span className="truncate">{s || '—'}</span>
    </span>
  );
}
