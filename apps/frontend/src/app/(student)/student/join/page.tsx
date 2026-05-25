'use client';

import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle2, Hash, Loader2 } from 'lucide-react';

import AppHeader from '@/components/ui/AppHeader';
import { joinClassByCode } from '@/lib/api/classesApi';

/** Join a teacher cohort via six-character alphanumeric code issued on the teacher Classes page */
export default function StudentJoinPage() {
  const [code, setCode] = useState('');
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState<{ className: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (code.length !== 6) {
      setError('Enter exactly six letters or numbers.');
      return;
    }
    setWorking(true);
    try {
      const res = await joinClassByCode(code);
      setDone({ className: res.className });
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setError('We could not find a class with that code. Ask your teacher to double-check.');
        return;
      }
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        setError('Accounts need the student profile to enrol in classes.');
        return;
      }
      if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object') {
        const msg = (e.response.data as { error?: string }).error;
        if (msg) {
          setError(msg);
          return;
        }
      }
      setError('Something went wrong. Try again.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f2f4f7] md:bg-transparent overflow-hidden px-4 md:px-0 py-4 md:pr-4 pb-24 md:pb-6 gap-4">
      <div className="hidden md:block px-2">
        <AppHeader breadcrumb="Join Class" icon={<Hash size={18} strokeWidth={2} />} />
      </div>

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
        <h1 className="text-xl font-extrabold text-gray-900 mb-2 text-center">Join a class</h1>
        <p className="text-[14px] text-gray-500 text-center mb-8 leading-relaxed">
          Paste the{' '}
          <span className="font-semibold text-gray-800">invite code</span> your teacher shows on&nbsp;
          <span className="font-semibold text-gray-800">My Classes</span>. We link your current sign-in automatically.
        </p>

        {done ? (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 mb-8 text-center"
          >
            <CheckCircle2 className="size-14 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg font-extrabold text-gray-900 mb-2">You&apos;re in</p>
            <p className="text-[15px] text-gray-600 mb-6">
              Rosters synced for <strong className="text-gray-900">{done.className}</strong>. Assignments that include
              you will keep appearing on your Assignments tab.
            </p>
            <Link
              href="/student/home"
              className="inline-flex justify-center rounded-[18px] bg-gray-900 text-white font-bold px-6 py-3 text-sm hover:bg-black transition-colors min-h-[48px]"
            >
              Continue to dashboard
            </Link>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <label className="text-[13px] font-semibold text-gray-700 block">Invite code</label>
            <input
              maxLength={6}
              aria-label="Class invite code"
              placeholder="ABCD34"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .replace(/[^A-Za-z2-9]/g, '')
                    .toUpperCase()
                    .slice(0, 6)
                )
              }
              className="w-full uppercase tracking-[0.35em] text-center font-black text-xl border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={working || code.length !== 6}
              onClick={() => void submit()}
              className="w-full rounded-[18px] bg-gray-900 text-white font-bold py-3.5 text-[15px] hover:bg-black transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {working ? <Loader2 className="size-5 animate-spin" /> : null}
              {working ? 'Joining…' : 'Join class'}
            </button>
          </div>
        )}

        {!done ? (
          <p className="text-center mt-8 text-[13px] text-gray-500">
            Returning?{' '}
            <Link href="/student/home" className="text-orange-500 font-semibold">
              Dashboard
            </Link>
          </p>
        ) : (
          <p className="text-center mt-6 text-[13px] text-gray-500">
            Prefer to browse assignments first?{' '}
            <Link href="/student/assignments" className="text-orange-500 font-semibold">
              My assignments
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
