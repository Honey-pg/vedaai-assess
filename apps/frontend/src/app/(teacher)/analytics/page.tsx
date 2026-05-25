'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  Loader2,
  Minus,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

import AppHeader from '@/components/ui/AppHeader';
import { cn } from '@/lib/utils';
import { fetchAnalyticsSummary, type AnalyticsSummary, type AttentionItem } from '@/lib/api/analyticsApi';

export default function TeacherAnalyticsPage() {
  const { isLoaded: authLoaded, userId } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
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
        const d = await fetchAnalyticsSummary();
        if (!cancel) setData(d);
      } catch {
        if (!cancel) setErr('Could not load analytics. Ensure you are signed in as a teacher.');
      }
    })();
    return () => {
      cancel = true;
    };
  }, [authLoaded, userId]);

  const normalized = useMemo(() => normalizeSummary(data), [data]);

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
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const { backlog, trends, pipelineSuccessPct, failureRatePct, attentionItems } = normalized;
  const maxWeekly = Math.max(...data.weekly.map((w) => w.count), 1);
  const maxSubject = Math.max(...data.bySubject.map((s) => s.count), 1);
  const inFlight = data.byStatus.pending + data.byStatus.processing;

  return (
    <div className="flex flex-col gap-2">
      <div className="px-4 md:px-2">
        <AppHeader breadcrumb="Analytics" />
      </div>
      <div className="p-6 md:p-8 space-y-10 max-w-5xl page-enter pb-24">
        <header className="space-y-1.5 text-balance">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Teaching workload & health</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            See what you started recently, whether papers finished, what is still in the AI queue, and which
            subjects keep you busiest—so you can plan classes and troubleshoot stuck jobs quickly.
          </p>
        </header>

        {failureRatePct >= 25 && completedPlusFailed(normalized.byStatus) >= 5 && (
          <div
            className="rounded-[var(--radius-xl)] border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-foreground shadow-sm"
            role="status"
          >
            <p className="font-semibold flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" aria-hidden />
              Rough patch on generation reliability
            </p>
            <p className="mt-2 text-muted-foreground pl-7 leading-relaxed">
              About <span className="font-medium tabular-nums text-foreground">{failureRatePct}%</span> of finals
              that finished landed in{' '}
              <span className="font-medium text-foreground">failed</span>. Open recent failures below, simplify
              instructions, then retry—or check backend logs if nothing looks wrong with the drafts.
            </p>
          </div>
        )}

        <section aria-label="Last 7-day trends">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Rolling window (vs prior 7 days)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <TrendTile
              label="Drafts started"
              hint="New assessments you authored this week."
              current={trends.createdThisWeek}
              prior={trends.createdPriorWeek}
            />
            <TrendTile
              label="Finished this week"
              hint="Assignments that reached Completed in the window."
              current={trends.finishedThisWeek}
              prior={trends.finishedPriorWeek}
            />
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In-flight now</p>
                <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
              </div>
              <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{backlog}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-snug">
                {inFlight === 0
                  ? 'Queue is clear.'
                  : `${data.byStatus.pending} queued · ${data.byStatus.processing} generating`}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Finals that succeeded
                </p>
                <Minus className="h-4 w-4 opacity-0" aria-hidden />
              </div>
              <p className="text-4xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300 tabular-nums">
                {pipelineSuccessPct}%
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-snug">
                Of papers that exited with <span className="font-medium">completed</span> or{' '}
                <span className="font-medium">failed</span>. Higher is smoother prep for class.
              </p>
            </div>
          </div>
        </section>

        {attentionItems.length > 0 && (
          <section
            aria-label="Needs attention"
            className="rounded-[var(--radius-xl)] border border-amber-500/35 bg-gradient-to-br from-amber-500/8 to-transparent dark:from-amber-500/10 p-5 md:p-6 shadow-[var(--shadow-veda-soft)]"
          >
            <div className="flex flex-wrap items-start gap-3 mb-5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Needs attention</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">
                  Recent failures and jobs that stayed pending or processing unusually long (~45 minutes). Open the
                  paper to inspect the error message or retry from the assignment screen.
                </p>
              </div>
            </div>
            <ul className="divide-y divide-border/80 rounded-[var(--radius-lg)] border border-border/70 bg-card/70 overflow-hidden">
              {attentionItems.map((item) => (
                <AttentionRow key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </ul>
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Status totals">
          <StatCard label="Total authored" value={data.totalAssignments} hue="bg-[var(--chart-1)]" />
          <StatCard label="Completed" value={data.byStatus.completed} hue="bg-[var(--chart-3)]" />
          <StatCard label="In queue + generating" value={inFlight} hue="bg-[var(--chart-2)]" />
          <StatCard label="Failed" value={data.byStatus.failed} hue="bg-destructive" />
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-veda-soft)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Problems after generation finishes</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Percent of finals that landed in failure—among papers that stopped on completed or failed. Use when
                calibrating how strict your titles, topics, or file uploads should be.
              </p>
              <p className="text-4xl font-bold tabular-nums mt-6 text-foreground">{failureRatePct}%</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden mt-4">
                <div
                  className="h-full rounded-full bg-destructive/80 transition-all"
                  style={{ width: `${Math.min(failureRatePct * 3, 100)}%` }}
                />
              </div>
            </div>
            <div className="md:border-l md:border-border md:pl-10">
              <h2 className="text-lg font-semibold text-foreground">Subject mix</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6 leading-relaxed">
                Helps you rebalance workload by subject before exam season—all papers you authored, any status.
              </p>
              {data.bySubject.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No subject labels yet.</p>
              ) : (
                <ul className="space-y-3.5">
                  {data.bySubject.map((row) => {
                    const pct = row.count / maxSubject;
                    return (
                      <li key={row.subject} className="space-y-1">
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="font-medium truncate text-foreground" title={row.subject}>
                            {row.subject || 'Untitled'}
                          </span>
                          <span className="tabular-nums shrink-0 text-muted-foreground">{row.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full max-w-full rounded-full bg-[var(--primary)]/82"
                            style={{ width: `${Math.min(Math.round(pct * 100), 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-veda-soft)]">
          <h2 className="text-lg font-semibold mb-1 text-foreground">Creation cadence — last 30 days</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            When you authored new drafts (starts), not completions—useful for estimating how teaching load spiked week
            to week.
          </p>
          <div className="flex items-end gap-2 h-40">
            {data.weekly.map((bucket) => {
              const pct = (bucket.count / maxWeekly) * 100;
              return (
                <div key={`${bucket.year}-${bucket.week}`} className="flex-1 flex flex-col justify-end gap-2 group/bar">
                  <div className="text-xs text-center font-medium tabular-nums text-muted-foreground">
                    {bucket.count}
                  </div>
                  <div className="w-full rounded-t-md bg-muted relative overflow-hidden h-32 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-[var(--primary)]/82 group-hover/bar:bg-[var(--primary)] transition-colors"
                      style={{ height: `${Math.max(pct, 8)}%` }}
                      title={`${bucket.count} started (ISO week ${bucket.week}, ${bucket.year})`}
                    />
                  </div>
                  <span className="text-[11px] text-center text-muted-foreground truncate">W{bucket.week}</span>
                </div>
              );
            })}
          </div>
          {data.weekly.length === 0 && (
            <p className="text-sm text-muted-foreground text-center pt-10">Nothing in the trailing month yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function normalizeSummary(data: AnalyticsSummary | null): {
  backlog: number;
  trends: AnalyticsSummary['trends'];
  pipelineSuccessPct: number;
  failureRatePct: number;
  attentionItems: AttentionItem[];
  byStatus: AnalyticsSummary['byStatus'];
} {
  if (!data) {
    return {
      backlog: 0,
      trends: {
        createdThisWeek: 0,
        createdPriorWeek: 0,
        finishedThisWeek: 0,
        finishedPriorWeek: 0,
      },
      pipelineSuccessPct: 100,
      failureRatePct: 0,
      attentionItems: [],
      byStatus: { pending: 0, processing: 0, completed: 0, failed: 0 },
    };
  }

  const { completed, failed, pending, processing } = data.byStatus;
  const terminal = completed + failed;
  const pipelineSuccessPct =
    data.pipelineSuccessPct ??
    (terminal === 0 ? 100 : Math.round((completed / terminal) * 1000) / 10);

  return {
    backlog: data.backlog ?? pending + processing,
    trends: data.trends ?? {
      createdThisWeek: 0,
      createdPriorWeek: 0,
      finishedThisWeek: 0,
      finishedPriorWeek: 0,
    },
    pipelineSuccessPct,
    failureRatePct: data.failureRatePct,
    attentionItems: data.attentionItems ?? [],
    byStatus: data.byStatus,
  };
}

function StatCard({ label, value, hue }: { label: string; value: number; hue: string }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <span className={cn('h-10 w-1 rounded-full shrink-0', hue)} aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
    </article>
  );
}

function pctDelta(current: number, prior: number): { Icon: typeof ArrowUpRight; label: string; tone: string } | null {
  if (prior === 0 && current === 0) return null;
  if (prior === 0 && current > 0) {
    return { Icon: ArrowUpRight, label: 'Started this window', tone: 'text-emerald-600 dark:text-emerald-400' };
  }
  const pct = Math.round(((current - prior) / Math.max(prior, 1)) * 100);
  if (pct === 0) {
    return { Icon: Minus, label: 'Flat vs prior week', tone: 'text-muted-foreground' };
  }
  if (pct > 0) {
    return { Icon: ArrowUpRight, label: `+${pct}% vs prior week`, tone: 'text-emerald-600 dark:text-emerald-400' };
  }
  return {
    Icon: ArrowDownRight,
    label: `${pct}% vs prior week`,
    tone: 'text-amber-700 dark:text-amber-400',
  };
}

function TrendTile({
  label,
  hint,
  current,
  prior,
}: {
  label: string;
  hint: string;
  current: number;
  prior: number;
}) {
  const delta = pctDelta(current, prior);
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm flex flex-col h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums mt-3">{current}</p>
      <div className="mt-auto pt-5 flex flex-col gap-2">
        {delta ? (
          <span className={cn('text-sm font-semibold flex items-center gap-1 tabular-nums', delta.tone)}>
            <delta.Icon className="size-4" aria-hidden />
            {delta.label}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Minus className="size-4" aria-hidden />
            Nothing to compare
          </span>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
      </div>
    </div>
  );
}

function formatIdleHint(iso: string): string {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 120) return `Last touched ~${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 72) return `Last touched ~${h}h ago`;
  return `Last touched ~${Math.round(h / 24)}d ago`;
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const isFailed = item.kind === 'failed';
  return (
    <li className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 py-4 hover:bg-muted/40 transition-colors">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              'text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border',
              isFailed
                ? 'border-destructive/35 bg-destructive/15 text-destructive'
                : 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200'
            )}
          >
            {isFailed ? 'Failed' : 'Possibly stuck'}
          </span>
          {item.subject ? (
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[12rem]" title={item.subject}>
              {item.subject}
            </span>
          ) : null}
        </div>
        <p className="font-semibold text-sm text-foreground truncate" title={item.title}>
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground">
          <span title={new Date(item.updatedAt).toLocaleString()}>{formatIdleHint(item.updatedAt)}</span>
        </p>
        {item.detail ? (
          <p className="text-xs text-muted-foreground leading-snug mt-2 max-w-prose">{item.detail}</p>
        ) : null}
      </div>
      <Link
        href={`/assignments/${item.id}`}
        className={cn(
          'inline-flex items-center gap-1.5 self-start sm:self-center shrink-0',
          'text-sm font-semibold text-[var(--primary)] hover:underline underline-offset-2',
          'min-h-10 px-3 py-2 rounded-lg border border-[var(--primary)]/30 hover:bg-[var(--primary)]/8'
        )}
      >
        Open <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </li>
  );
}

function completedPlusFailed(by: AnalyticsSummary['byStatus']): number {
  return by.completed + by.failed;
}
