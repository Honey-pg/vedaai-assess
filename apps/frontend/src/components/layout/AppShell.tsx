'use client';

import TeacherMobileHeader from '@/components/layout/TeacherMobileHeader';
import MobileTabBar from '@/components/layout/MobileTabBar';
import Sidebar from '@/components/layout/Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <TeacherMobileHeader />
      {/*
        Mobile: cap main column height so the overflow-y-auto child actually clips and scrolls.
        Without max height, flex + min-h expands to content and wheel deltas hit overscroll traps.
        TeacherMobileHeader is ~72px (py-3.5 + 44px row) — matches calc(100dvh - 4.5rem).
      */}
      <div className="flex min-h-0 w-full max-md:h-[calc(100dvh-4.5rem)] max-md:max-h-[calc(100dvh-4.5rem)] flex-col bg-[#e8e9ec] pb-[max(5.5rem,env(safe-area-inset-bottom))] text-gray-900 antialiased selection:bg-orange-100 selection:text-gray-900 md:h-[100dvh] md:max-h-none md:flex-row md:gap-4 md:overflow-hidden md:bg-[#f5f6f8] md:p-4 md:pb-0">
        <div className="hidden md:flex h-full min-h-0 max-h-[calc(100dvh-2rem)] shrink-0 items-stretch">
          <Sidebar />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#e8e9ec] md:bg-transparent">
          {/*
            overscroll-y-contain on an element that is not overflowing blocks wheel chaining in Chrome —
            scrolling only worked when the pointer was outside this pane. Keep containment on md+ only.
          */}
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable] md:overscroll-y-contain">
            <div className="w-full max-w-[1650px] mx-auto min-h-full flex flex-col">{children}</div>
          </div>
        </div>
      </div>
      <MobileTabBar />
    </>
  );
}
