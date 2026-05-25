'use client';

import { useState, useTransition } from 'react';
import { GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import { useSession } from '@clerk/nextjs';
import { setUserRole } from './actions';

export default function OnboardingPage() {
  const { session, isLoaded: sessionLoaded } = useSession();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<'teacher' | 'student' | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!selected) {
      setError('Pick a role to continue.');
      return;
    }

    startTransition(async () => {
      const result = await setUserRole(selected, selected === 'teacher' ? schoolName : undefined);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const href = result.role === 'student' ? '/student/join' : `/home`;

      /** Clerk updates `publicMetadata` on the server, but middleware reads the *session JWT*.
       *  Reload session so claims include `metadata.role` before hard navigation — otherwise
       *  middleware redirects back to `/onboarding` (see Clerk: session.reload after metadata updates).
       */
      try {
        if (sessionLoaded && session && typeof session.reload === 'function') {
          await session.reload();
        }
      } catch {
        // Still navigate; JWT may update on full page load, or Clerk dashboard shows template errors.
      }

      window.location.assign(href);
    });
  };

  return (
    <div className="min-h-screen bg-[#f2f4f7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-2">Welcome to VedaAI</h1>
          <p className="text-gray-500 text-[15px]">Tell us who you are to get started</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            disabled={pending}
            onClick={() => setSelected('teacher')}
            className={`rounded-[24px] p-6 flex flex-col items-center gap-3 border-2 transition-all ${
              selected === 'teacher'
                ? 'border-orange-400 bg-orange-50 shadow-md'
                : 'border-transparent bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
              <BookOpen size={26} className="text-orange-500" strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-gray-900 text-[15px]">I&apos;m a Teacher</p>
              <p className="text-gray-400 text-[12px] mt-0.5">Create & grade papers</p>
            </div>
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => setSelected('student')}
            className={`rounded-[24px] p-6 flex flex-col items-center gap-3 border-2 transition-all ${
              selected === 'student'
                ? 'border-orange-400 bg-orange-50 shadow-md'
                : 'border-transparent bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
              <GraduationCap size={26} className="text-orange-500" strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-gray-900 text-[15px]">I&apos;m a Student</p>
              <p className="text-gray-400 text-[12px] mt-0.5">Take tests & submit work</p>
            </div>
          </button>
        </div>

        {selected === 'teacher' ? (
          <div className="bg-white rounded-[20px] p-5 mb-6 shadow-sm">
            <label className="block text-[13px] font-semibold text-gray-700 mb-2" htmlFor="school">
              School name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="school"
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Delhi Public School, Sector 4"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-200"
              disabled={pending}
            />
          </div>
        ) : null}

        <button
          type="button"
          disabled={!selected || pending || !sessionLoaded}
          onClick={submit}
          className="w-full bg-[#111] text-white font-extrabold text-[15px] py-3.5 rounded-[20px] hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Setting up…
            </>
          ) : (
            'Continue'
          )}
        </button>

        {error ? <p className="text-center text-red-500 text-[13px] mt-3">{error}</p> : null}
      </div>
    </div>
  );
}
