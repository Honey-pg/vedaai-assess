'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import AppHeader from '@/components/ui/AppHeader';

export default function StudentHomePage() {
  return (
    <div className="flex flex-col h-full bg-[#f2f4f7] md:bg-transparent overflow-hidden px-4 md:px-0 py-4 md:pr-4 pb-24 md:pb-6 gap-4">
      <div className="hidden md:block px-2">
        <AppHeader breadcrumb="Home" />
      </div>
      <div className="flex-1 space-y-6 max-w-xl mx-auto w-full mt-6">
        <div>
          <h1 className="text-[22px] font-extrabold text-gray-900">Your workspace</h1>
          <p className="text-gray-500 text-[14px] mt-1 leading-relaxed">
            Assignments from your teachers show up here once they&apos;ve published them through VedaAI.
          </p>
        </div>
        <Link
          href="/student/assignments"
          className="flex items-center gap-4 rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:border-orange-100 transition-colors"
        >
          <div className="h-11 w-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5 text-orange-500" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[16px] text-gray-900">My assignments</p>
            <p className="text-[13px] text-gray-500">Open submissions and drafts</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
