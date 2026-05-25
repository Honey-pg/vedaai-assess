'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

import AppHeader from '@/components/ui/AppHeader';
import {
  fetchTeacherClasses,
  fetchTeacherClass,
  createTeacherClass,
  updateTeacherClass,
  deleteTeacherClass,
  type TeacherClassDetail,
  type TeacherClassListItem,
} from '@/lib/api/classesApi';
import { cn } from '@/lib/utils';

export default function ClassesPage() {
  const { isLoaded: authLoaded, userId } = useAuth();
  const [items, setItems] = useState<TeacherClassListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setNetworkError(null);
    try {
      const rows = await fetchTeacherClasses();
      setItems(rows);
    } catch (e) {
      setNetworkError(fetchErrMessage(e, 'Could not load your classes.'));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoaded) return;

    if (!userId) {
      queueMicrotask(() => setLoadingList(false));
      return;
    }
    queueMicrotask(() => {
      void loadList();
    });
  }, [authLoaded, userId, loadList]);

  return (
    <div className="flex flex-col min-h-[60vh] page-enter pb-28 md:pb-10">
      <div className="px-4 md:px-2">
        <AppHeader breadcrumb="My Classes" icon={<Users className="h-[18px] w-[18px]" strokeWidth={2} />} />
      </div>

      <div className="flex-1 px-4 md:px-8 py-6 max-w-[960px] w-full mx-auto space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 max-w-lg">
            <h1 className="text-[22px] md:text-2xl font-bold text-gray-900 tracking-tight">Rosters & join codes</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Save distribution lists once, share a{' '}
              <span className="font-semibold text-gray-900">six-character code</span> with students so they enrol
              themselves, then pull the same roster into new assignments — no repetitive copy-paste.
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setCreateOpen(true)}
            disabled={!authLoaded || !userId}
            className="inline-flex items-center justify-center gap-2 shrink-0 h-11 px-5 rounded-xl bg-[#111] text-white text-sm font-bold shadow-md hover:bg-gray-900 transition-colors disabled:opacity-45"
          >
            <Plus className="size-4" aria-hidden />
            New class
          </motion.button>
        </header>

        {networkError && (
          <div
            className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 text-red-900 px-4 py-3 text-sm"
            role="alert"
          >
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <p>{networkError}</p>
          </div>
        )}

        {loadingList ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
            <Loader2 className="size-8 animate-spin opacity-70" aria-hidden />
            <p className="text-sm">Loading classes…</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyPrompt onCreate={() => setCreateOpen(true)} disabled={!userId} />
        ) : (
          <motion.ul
            className="flex flex-col gap-4 list-none"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {items.map((row) => (
              <motion.li
                key={row.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              >
                <ClassCard
                  summary={row}
                  expanded={expandedId === row.id}
                  onToggle={() => setExpandedId((id) => (id === row.id ? null : row.id))}
                  onDeleted={() => {
                    setExpandedId((id) => (id === row.id ? null : id));
                    void loadList();
                  }}
                  onUpdated={() => void loadList()}
                />
              </motion.li>
            ))}
          </motion.ul>
        )}

        <p className="text-xs text-gray-500 text-center md:text-left pt-2">
          Rosters sync with assignment invites when you{' '}
          <Link href="/assignments/new" className="font-semibold text-[#FF6B35] hover:underline">
            create assignments
          </Link>
          . Students join from{' '}
          <span className="font-semibold text-gray-700">Join a class code</span> on their sidebar.
        </p>
      </div>

      {createOpen ? (
        <CreateClassModal onClose={() => setCreateOpen(false)} onCreated={loadList} />
      ) : null}
    </div>
  );
}

function EmptyPrompt({ onCreate, disabled }: { onCreate: () => void; disabled: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm"
    >
      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <Users className="size-8" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Organize cohorts instead of juggling spreadsheets</h2>
      <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        Create one card per cohort (section, club, elective). Invite emails by roster or lean on{' '}
        <strong className="text-gray-900">instant join codes</strong> for students already on their phones.
      </p>
      <button
        type="button"
        onClick={onCreate}
        disabled={disabled}
        className="h-11 px-6 rounded-xl bg-[#111] text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-45"
      >
        Create first class
      </button>
    </motion.div>
  );
}

function ClassCard({
  summary,
  expanded,
  onToggle,
  onDeleted,
  onUpdated,
}: {
  summary: TeacherClassListItem;
  expanded: boolean;
  onToggle: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const copyCode = useCallback(async () => {
    const ok = await copyToClipboard(summary.joinCode);
    if (ok) {
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [summary.joinCode]);

  const updatedShort = summary.updatedAt
    ? new Date(summary.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <article className="rounded-[24px] border border-[#EAECF0] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden motion-safe:transition-shadow motion-safe:duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
      <div className="w-full px-5 py-4 md:py-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} roster: ${summary.name}`}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          className={cn(
            'flex-1 min-w-0 text-left rounded-xl outline-none cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-[#FF6B35]/40 focus-visible:ring-offset-2'
          )}
        >
          <div className="flex items-start md:items-center gap-2 flex-wrap mb-1">
            <h2 className="text-base font-bold text-gray-900 truncate">{summary.name}</h2>
            {summary.subject ? (
              <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">
                {summary.subject}
              </span>
            ) : null}
            <span className="text-gray-400 shrink-0 md:hidden ml-auto" aria-hidden>
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </div>
          <p className="text-[13px] text-gray-500">
            Updated {updatedShort}
            {' · '}
            <span className="tabular-nums">{summary.inviteCount}</span> invites
            {' · '}
            <span className="tabular-nums">{summary.linkedAccountCount}</span> joined via code
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0 border-t md:border-t-0 border-[#f0f2f8] pt-3 md:pt-0 mt-1 md:mt-0 md:border-transparent">
          <code className="px-3 py-1.5 rounded-lg bg-gray-900 text-orange-400 text-sm font-black tracking-[0.2em] shadow-inner">
            {summary.joinCode}
          </code>
          <motion.button
            type="button"
            onClick={() => void copyCode()}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold border transition-colors',
              copyState === 'copied'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            )}
            aria-label={copyState === 'copied' ? 'Copied code' : 'Copy join code'}
          >
            {copyState === 'copied' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copyState === 'copied' ? 'Copied' : 'Copy'}
          </motion.button>
          <span className="text-gray-400 hidden md:inline" aria-hidden>
            {expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </span>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden border-t border-[#f0f2f8] bg-[#fafbfc]"
      >
        {expanded ? (
          <ClassEditorPanel summary={summary} onDeleted={onDeleted} onUpdated={onUpdated} />
        ) : null}
      </motion.div>
    </article>
  );
}

function ClassEditorPanel({
  summary,
  onDeleted,
  onUpdated,
}: {
  summary: TeacherClassListItem;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<TeacherClassDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rosterText, setRosterText] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadErr(null);
      setBusy(true);
      try {
        const d = await fetchTeacherClass(summary.id);
        if (!cancel) {
          setDetail(d);
          setRosterText((d.studentEmails ?? []).join('\n'));
        }
      } catch (e) {
        if (!cancel) setLoadErr(fetchErrMessage(e, 'Could not open this roster.'));
      } finally {
        if (!cancel) setBusy(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [summary.id]);

  const saveEmails = async () => {
    if (!detail) return;
    const emails = parseInviteLines(rosterText);
    setBusy(true);
    try {
      const next = await updateTeacherClass(summary.id, { studentEmails: emails });
      setDetail(next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      onUpdated();
    } catch (e) {
      setLoadErr(fetchErrMessage(e, 'Save failed'));
    } finally {
      setBusy(false);
    }
  };

  const kill = async () => {
    if (!confirm(`Delete "${summary.name}" permanently? Invite lists and enrolments for this cohort are removed.`))
      return;
    setBusy(true);
    try {
      await deleteTeacherClass(summary.id);
      onDeleted();
    } catch (e) {
      setLoadErr(fetchErrMessage(e, 'Could not delete class'));
    } finally {
      setBusy(false);
    }
  };

  if (busy && !detail) {
    return (
      <div className="flex items-center gap-3 px-5 py-8 text-gray-500 text-sm justify-center">
        <Loader2 className="size-5 animate-spin" />
        Loading roster…
      </div>
    );
  }

  if (loadErr && !detail) {
    return <p className="px-5 py-8 text-sm text-red-600 text-center">{loadErr}</p>;
  }

  return (
    <div className="px-5 py-6 space-y-5">
      {detail?.description ? (
        <p className="text-sm text-gray-600 bg-white rounded-xl px-4 py-3 border border-[#eaecef]">{detail.description}</p>
      ) : null}

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Invite roster (email list)</label>
        <textarea
          value={rosterText}
          onChange={(e) => setRosterText(e.target.value)}
          rows={6}
          placeholder="alice@school.edu&#10;bob@school.edu&#10;…one address per line or comma-separated."
          disabled={busy}
          className="w-full resize-y rounded-2xl border border-[#E8ECF4] px-4 py-3 text-sm placeholder:text-[#a0aec0] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-orange-500/25 disabled:opacity-50"
        />
        <div className="flex flex-wrap items-center gap-2 justify-between pt-2">
          <p className="text-xs text-gray-500">{parseInviteLines(rosterText).length} unique recipient addresses</p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={busy}
            onClick={() => void saveEmails()}
            className="h-9 px-4 rounded-xl bg-[#FF6B35] text-white text-sm font-bold shadow-sm hover:bg-[#E55A24] disabled:opacity-45"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : savedFlash ? 'Saved' : 'Save roster'}
          </motion.button>
        </div>
      </div>

      {detail && detail.studentIds.length > 0 ? (
        <p className="text-xs text-emerald-800 bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100">
          <span className="font-bold">{detail.studentIds.length}</span> learners have joined via code—their Clerk ids stay
          linked even if you prune the invite list later.
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Nobody has joined via code yet. Share the highlighted code verbally or on your LMS bulletin.
        </p>
      )}

      {loadErr ? <p className="text-sm text-red-600">{loadErr}</p> : null}

      <button
        type="button"
        onClick={() => void kill()}
        disabled={busy}
        className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-45 pt-2"
      >
        <Trash2 className="size-4" />
        Delete class
      </button>
    </div>
  );
}

function CreateClassModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setErr(null);
    if (name.trim().length < 2) {
      setErr('Give the class at least two characters.');
      return;
    }
    setSubmitting(true);
    try {
      await createTeacherClass({
        name: name.trim(),
        ...(subject.trim() ? { subject: subject.trim() } : {}),
        ...(desc.trim() ? { description: desc.trim() } : {}),
      });
      await onCreated();
      onClose();
    } catch (e) {
      setErr(fetchErrMessage(e, 'Could not create class'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-10 bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-class-heading"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[24px] bg-white border border-[#EAECF0] shadow-xl p-6 space-y-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div>
          <h2 id="create-class-heading" className="text-lg font-bold text-gray-900">
            New cohort
          </h2>
          <p className="text-xs text-gray-500 mt-1">Students will see the name after they join successfully.</p>
        </div>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-gray-600">Display name*</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grade 11 Physics — Section B"
            className="mt-1.5 w-full h-11 rounded-xl border border-[#E8ECF4] px-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-gray-600">Subject (optional)</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Science"
            className="mt-1.5 w-full h-11 rounded-xl border border-[#E8ECF4] px-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-gray-600">Teacher note</span>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Internal hint for you only"
            className="mt-1.5 w-full rounded-xl border border-[#E8ECF4] px-3 py-2 text-sm resize-none"
          />
        </label>
        {err ? <p className="text-xs text-red-600">{err}</p> : null}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl bg-[#111] text-white text-sm font-bold disabled:opacity-45"
          >
            {submitting ? <Loader2 className="size-5 animate-spin mx-auto" /> : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function parseInviteLines(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 3 && s.includes('@'))
    ),
  ];
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function fetchErrMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object') {
    const d = e.response.data as { error?: string };
    if (d.error) return d.error;
  }
  return fallback;
}
