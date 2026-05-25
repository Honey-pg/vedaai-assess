'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { Search, SlidersHorizontal, Plus, Loader2, ClipboardList, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { listAssignments, deleteAssignment, API_BACKEND_ORIGIN } from '@/lib/api/assignments';
import { formatDate } from '@/lib/utils/formatting';

interface AssignmentItem {
  _id: string;
  input: {
    title: string;
    subject: string;
    topic: string;
    dueDate: string;
    questionConfigs: Array<{ type: string; count: number; marksPerQuestion: number }>;
  };
  status: string;
  createdAt: string;
}

function isCanceledAxios(err: unknown): boolean {
  return (
    axios.isCancel(err) ||
    (axios.isAxiosError(err) && err.code === 'ERR_CANCELED')
  );
}

function fetchErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Something went wrong while loading assignments.';
  if (!error.response) {
    return (
      `Cannot reach API at ${API_BACKEND_ORIGIN}. Start the backend (e.g. npm run dev from the repo root, port 4000), ` +
      `confirm MongoDB/Redis are running, and set NEXT_PUBLIC_API_URL to the backend origin only — no trailing /api ` +
      `(resolved: ${API_BACKEND_ORIGIN}).`
    );
  }
  const st = error.response.status;
  const body = error.response.data as { error?: string } | undefined;
  return body?.error ?? `Request failed (${st}).`;
}

export default function AssignmentHistoryPage() {
  const { isLoaded: authLoaded, userId } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  /** Initial / pagination / BFCache restore — shows spinner */
  const fetchPageWithSpinner = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const data = await listAssignments(pageRef.current, undefined, signal);
      setAssignments(data.assignments as unknown as AssignmentItem[]);
      setTotalPages(data.pagination.pages);
      setFetchError(null);
    } catch (error) {
      if (isCanceledAxios(error)) return;
      console.error('Failed to fetch:', error);
      setFetchError(fetchErrorMessage(error));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoaded) return;
    if (!userId) {
      queueMicrotask(() => {
        setLoading(false);
        setAssignments([]);
        setFetchError(null);
      });
      return;
    }
    const ac = new AbortController();
    const tid = setTimeout(() => {
      void fetchPageWithSpinner(ac.signal);
    }, 0);
    return () => {
      clearTimeout(tid);
      ac.abort();
    };
  }, [page, fetchPageWithSpinner, authLoaded, userId]);

  /** Browser back-forward cache restore leaves React state stale with loading=true — refetch */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      if (!authLoaded || !userId) return;
      const ac = new AbortController();
      void fetchPageWithSpinner(ac.signal);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [fetchPageWithSpinner, authLoaded, userId]);

  /** Poll without toggling loading (avoids spinner flicker + stale loading state) */
  useEffect(() => {
    if (!authLoaded || !userId) return;
    const hasProcessing = assignments.some(
      (a) => a.status === 'processing' || a.status === 'pending'
    );
    if (!hasProcessing) return;

    const tick = async () => {
      try {
        const data = await listAssignments(pageRef.current);
        setAssignments(data.assignments as unknown as AssignmentItem[]);
        setTotalPages(data.pagination.pages);
        setFetchError(null);
      } catch (err) {
        if (!isCanceledAxios(err)) console.error('Poll failed:', err);
      }
    };

    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [assignments, authLoaded, userId]);

  const handleDelete = async (id: string) => {
    await deleteAssignment(id);
    setAssignments((prev) => prev.filter((a) => a._id !== id));
  };

  const filtered = assignments.filter((a) =>
    a.input.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isEmpty = !loading && filtered.length === 0 && !searchTerm;

  return (
    <>
      <TopBar title="Assignment" backHref="/assignments" />

      <div className="p-6 md:p-8 page-enter">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#1A202C]">Assignments</h1>
            <p className="text-sm text-[#718096] mt-1">Manage and create assignments for your classes.</p>
          </div>
          {!isEmpty && (
            <Link href="/assignments/new">
              <button className="flex items-center gap-2 h-10 px-4 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E55A24] transition-colors">
                <Plus className="h-4 w-4" />
                Create Assignment
              </button>
            </Link>
          )}
        </div>

        {fetchError && (
          <div
            className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] leading-relaxed"
            role="alert"
          >
            <p className="font-semibold">Could not load assignments</p>
            <p className="mt-1 text-[#B91C1C]">{fetchError}</p>
          </div>
        )}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-[120px] w-[120px] mb-6 flex items-center justify-center">
              <svg className="h-24 w-24 text-[#A0AEC0]/60" viewBox="0 0 96 96" fill="none">
                <rect x="24" y="12" width="48" height="60" rx="6" stroke="currentColor" strokeWidth="2" />
                <line x1="34" y1="28" x2="54" y2="28" stroke="currentColor" strokeWidth="2" />
                <line x1="34" y1="36" x2="62" y2="36" stroke="currentColor" strokeWidth="2" />
                <line x1="34" y1="44" x2="56" y2="44" stroke="currentColor" strokeWidth="2" />
                <circle cx="66" cy="54" r="18" stroke="currentColor" strokeWidth="2" />
                <path d="M59 47L73 61M73 47L59 61" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#1A202C] mb-2">No assignments yet</h2>
            <p className="text-sm text-[#718096] text-center max-w-[360px] leading-relaxed mb-5">
              Create your first assignment to start collecting and grading student submissions.
              You can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
            <Link href="/assignments/new">
              <button className="flex items-center gap-2 h-11 px-6 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E55A24] transition-colors">
                <Plus className="h-4 w-4" />
                Create Your First Assignment
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button className="flex items-center gap-2 text-sm text-[#4A5568] border border-[#E8ECF4] bg-white rounded-lg px-4 py-2.5 hover:bg-[#F8F9FC] transition-colors">
                <SlidersHorizontal className="h-4 w-4" />
                Filter By
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0AEC0]" />
                <input
                  placeholder="Search Assignment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-[#E8ECF4] bg-white rounded-lg text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#A0AEC0]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((item) => (
                  <div
                    key={item._id}
                    className="assignment-card bg-white rounded-[12px] border border-[#E8ECF4] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="h-5 w-5 text-[#FF6B35]" />
                      </div>
                      <h3 className="text-base font-semibold text-[#1A202C] flex-1 pt-1.5">{item.input.title}</h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs mb-3">
                      <span className="text-[#718096]">
                        <span className="font-medium text-[#4A5568]">Assigned on</span> : {formatDate(item.createdAt)}
                      </span>
                      {item.input.dueDate && (
                        <span className="text-[#718096]">
                          <span className="font-medium text-[#4A5568]">Due</span> : {formatDate(item.input.dueDate)}
                        </span>
                      )}
                    </div>

                    <div className="border-t border-[#F0F4FF] my-3" />

                    <div className="flex items-center gap-2">
                      <Link
                        href={
                          item.status === 'completed'
                            ? `/assignments/${item._id}/result`
                            : `/assignments/${item._id}`
                        }
                        className="text-sm font-medium text-[#FF6B35] border border-[#FF6B35] rounded-lg px-3 py-1.5 hover:bg-[#FFF4F0] transition-colors"
                      >
                        View Assignment
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="flex items-center gap-1 text-sm font-medium text-[#EF4444] rounded-lg px-3 py-1.5 hover:bg-[#FEF2F2] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 text-sm border border-[#E8ECF4] rounded-lg disabled:opacity-40 hover:bg-[#F8F9FC]">Previous</button>
                <span className="flex items-center px-3 text-sm text-[#718096]">Page {page} of {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-[#E8ECF4] rounded-lg disabled:opacity-40 hover:bg-[#F8F9FC]">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <Link href="/assignments/new"
        className="lg:hidden fixed right-5 bottom-24 z-40 h-12 w-12 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shadow-lg hover:bg-[#E55A24] transition-colors">
        <Plus className="h-5 w-5" />
      </Link>
    </>
  );
}
