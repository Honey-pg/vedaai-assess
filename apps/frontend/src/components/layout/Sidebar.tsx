'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Sparkles,
  BookMarked,
  Library,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutGrid, label: 'Home', href: '/' },
  { icon: Users, label: 'My Groups', href: '/groups' },
  { icon: ClipboardList, label: 'Assignments', href: '/assignments' },
  { icon: BookMarked, label: "AI Teacher's Toolkit", href: '/toolkit' },
  { icon: Library, label: 'My Library', href: '/library' },
];

interface SidebarProps {
  assignmentCount?: number;
}

export function Sidebar({ assignmentCount }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/assignments') return pathname.startsWith('/assignments');
    if (href === '/toolkit') return pathname === '/toolkit' || pathname.startsWith('/toolkit/');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-w-[260px] bg-[#1A1A2E] h-screen sticky top-0 z-40 shadow-[2px_0_12px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand — logo + title only */}
        <div className="shrink-0 px-6 pt-8 pb-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E03E1C] flex items-center justify-center shadow-[0_2px_8px_rgba(255,107,53,0.35)]">
              <span className="text-white font-bold text-xl leading-none">V</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">VedaAI</span>
          </Link>
        </div>

        {/* Create Assignment — pill, dark fill + accent border */}
        <div className="shrink-0 px-5 pb-6">
          <Link
            href="/assignments/new"
            className={cn(
              'w-full flex items-center justify-center gap-2.5 h-[46px] rounded-full',
              'bg-[#151525] border border-[#FF6B35] text-white text-sm font-medium',
              'shadow-[0_0_14px_rgba(255,107,53,0.22),inset_0_1px_0_rgba(255,255,255,0.04)]',
              'hover:bg-[#1e1e32] hover:border-[#FF8555] transition-colors'
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-white" aria-hidden />
            Create Assignment
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] leading-snug transition-colors',
                  active
                    ? 'bg-[#252540] text-white font-semibold'
                    : 'text-[#A0AEC0] hover:bg-[#22223A] hover:text-white'
                )}
              >
                <item.icon className={cn('h-[22px] w-[22px] shrink-0', active ? 'text-[#FF6B35]' : 'text-[#8B909A]')} />
                <span className="flex-1">{item.label}</span>
                {item.label === 'Assignments' &&
                  assignmentCount !== undefined &&
                  assignmentCount > 0 && (
                    <span
                      className={cn(
                        'text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5',
                        active ? 'bg-[#FF6B35] text-white' : 'bg-[#FF6B35]/90 text-white'
                      )}
                    >
                      {assignmentCount}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Settings + organisation card */}
        <div className="shrink-0 flex flex-col gap-2 px-4 pb-6 pt-4 border-t border-[#2D2D4E] mt-auto">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] text-[#A0AEC0] hover:bg-[#22223A] hover:text-white transition-colors"
          >
            <Settings className="h-[22px] w-[22px] shrink-0 text-[#8B909A]" />
            <span>Settings</span>
          </Link>

          <div className="mt-3 rounded-xl bg-[#252540] px-4 py-3.5 flex items-center gap-3 border border-[#2D3548]/80">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-[10px] font-bold text-white tracking-tighter" aria-hidden>
                DPS
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Delhi Public School</p>
              <p className="text-xs text-[#A0AEC0] truncate">Bokaro Steel City</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
