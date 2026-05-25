'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep in dev for diagnosis; production logging can be wired to an APM later.
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#f5f6f8] px-6 py-16 text-center">
      <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-2">Something went wrong</h1>
      <p className="text-[14px] text-gray-500 max-w-md mb-8 leading-relaxed">
        {error.message || 'An unexpected error occurred. You can try again or return home.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-full bg-[#fe5b2b] text-white font-bold text-[14px] px-8 py-3 hover:bg-[#eb4e1e] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 font-bold text-[14px] px-8 py-3 hover:bg-gray-50 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
