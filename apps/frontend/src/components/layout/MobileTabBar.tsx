'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ClipboardList, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { icon: LayoutGrid, label: 'Home', href: '/' },
  { icon: ClipboardList, label: 'Assignments', href: '/assignments' },
  { icon: BookOpen, label: 'Library', href: '/library' },
  { icon: Sparkles, label: 'AI Toolkit', href: '/toolkit' },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8ECF4] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active =
            tab.href === '/assignments'
              ? pathname.startsWith('/assignments')
              : tab.href === '/toolkit'
                ? pathname === '/toolkit' || pathname.startsWith('/toolkit/')
                : pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1.5 px-3 transition-colors',
                active ? 'text-[#FF6B35]' : 'text-[#718096]'
              )}
            >
              <tab.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
