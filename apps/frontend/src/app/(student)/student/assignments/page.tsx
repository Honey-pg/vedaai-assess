'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { Search, ClipboardList, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { listAssignments, API_BACKEND_ORIGIN } from '@/lib/api/assignments';
import { formatDate } from '@/lib/utils/formatting';

interface AssignmentItem {
  _id: string;
  status: string;
  input: {
    title: string;
    subject: string;
    topic: string;
    dueDate: string;
  };
  createdAt: string;
}

function isIgnoredRequestError(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
  );
}

function formatAssignmentError(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Something went wrong while loading assignments.';
  const code = error.code;
  if (code === 'ECONNREFUSED' || code === 'ERR_NETWORK')
    return `Cannot reach backend at ${API_BACKEND_ORIGIN}.`;
  const status = error.response?.status;
  if (status === 401 || status === 403) return 'Please sign in again to view assignments.';
  return error.response?.data && typeof error.response.data === 'object' && error.response.data !== null && 'error' in error.response.data
    ? String((error.response.data as { error?: string }).error ?? 'Load failed.')
    : 'Failed to load assignments.';
}

export default function StudentAssignmentsPage() {
  const { isLoaded: authLoaded, userId } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const requestIdRef = useRef(0);

  const fetchPage = useCallback(async (requestedPage: number, signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    try {
      setFetchError('');
      setLoading(true);
      const resp = await listAssignments(requestedPage, undefined, signal);
      const items = resp.assignments as unknown as AssignmentItem[];
      if (requestId === requestIdRef.current) setAssignments(items);
      setTotalPages(resp.pagination.pages || 1);
    } catch (err) {
      if (signal?.aborted || isIgnoredRequestError(err)) return;
      console.error(err);
      if (requestId === requestIdRef.current) setFetchError(formatAssignmentError(err));
      if (requestId === requestIdRef.current) setAssignments([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoaded) return;
    if (!userId) {
      queueMicrotask(() => {
        setLoading(false);
        setAssignments([]);
        setFetchError('');
      });
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void fetchPage(page, ac.signal);
    });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [fetchPage, page, authLoaded, userId]);

  const filtered = assignments.filter((a) =>
    a.input.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const isEmpty = !loading && filtered.length === 0 && !searchTerm && !fetchError;

  return (
    <>
      <TopBar title="Assignments" showBack={false} />
      <div className="p-6 md:p-8 page-enter">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A202C]">Assignments for you</h1>
          <p className="text-sm text-[#718096] mt-1">
            Assignments show up when your teacher adds your <span className="font-medium text-[#4A5568]">sign-in email</span>{' '}
            (or your Clerk user ID) to the paper. If this list is empty, ask them to update the invite list and save.
          </p>
        </div>

        {fetchError && (
          <div className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">
            <p className="font-semibold">Could not load assignments</p>
            <p className="mt-1 text-[#B91C1C]">{fetchError}</p>
          </div>
        )}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-[var(--radius-xl)] border border-dashed border-border bg-card/80">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h2 className="text-xl font-semibold text-[#1A202C] mb-2">No assignments shared yet</h2>
            <p className="text-sm text-[#718096] max-w-sm">
              Your teacher attaches learners by email (or Clerk user IDs) when creating an assignment that includes you.
            </p>
          </div>
        ) : (
          <>
            <div className="relative flex-1 mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0AEC0]" />
              <input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-9 pr-3 border border-[#E8ECF4] bg-white rounded-xl text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] outline-none shadow-sm"
              />
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
                    className="bg-white rounded-[12px] border border-[#E8ECF4] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="h-5 w-5 text-[#FF6B35]" />
                      </div>
                      <h3 className="text-base font-semibold text-[#1A202C] flex-1 pt-1.5">{item.input.title}</h3>
                    </div>
                    <div className="text-xs text-[#718096] mb-3">
                      Assigned {formatDate(item.createdAt)}
                    </div>
                    <Link
                      href={
                        item.status === 'completed'
                          ? `/student/assignments/${item._id}/result`
                          : `/student/assignments/${item._id}`
                      }
                      className="inline-block text-sm font-medium text-[#FF6B35] border border-[#FF6B35] rounded-lg px-3 py-1.5 hover:bg-[#FFF4F0] transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-[#E8ECF4] rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="flex items-center px-3 text-sm text-[#718096]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-[#E8ECF4] rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
