'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Menu } from 'lucide-react';

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
          <button className="relative text-[#4A5568] hover:text-[#1A202C] transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#FF6B35] rounded-full" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-xs font-bold text-white">
            JD
          </div>
        </div>
      </header>

      {/* Mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#E8ECF4]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-base text-[#1A202C]">VedaAI</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative text-[#4A5568]">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#FF6B35] rounded-full" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-xs font-bold text-white">
              JD
            </div>
            <button className="text-[#4A5568]">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
