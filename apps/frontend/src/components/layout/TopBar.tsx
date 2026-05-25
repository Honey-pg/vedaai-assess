'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Menu } from 'lucide-react';
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu';
import { UserButton } from '@clerk/nextjs';
interface TopBarProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightContent?: React.ReactNode;
}

export function TopBar({ title, showBack = true, backHref, rightContent }: TopBarProps) {
  const router = useRouter();

  return (
    <>
      {/* Desktop */}
      <header className="hidden lg:flex items-center justify-between sticky top-0 z-30 bg-white border-b border-[#E8ECF4] h-16 px-6">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => (backHref ? router.push(backHref) : router.back())}
              className="text-[#4A5568] hover:text-[#1A202C] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <span className="text-lg font-semibold text-[#1A202C]">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {rightContent}
          <NotificationsMenu variant="topBar" />
          <UserButton />
        </div>
      </header>

      {/* Tablet / small-desktop: contextual bar — shell mobile header is hidden from md */}
      <header className="hidden md:flex lg:hidden sticky top-0 z-30 bg-white border-b border-[#E8ECF4] flex-col">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-base text-[#1A202C]">VedaAI</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsMenu variant="topBar" />
            <UserButton />
            <button className="text-[#4A5568]">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
