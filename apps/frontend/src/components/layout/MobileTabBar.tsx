'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, BookOpen, Sparkles, BarChart2, Hash, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';

const teacherNav = [
  { label: 'Home', href: '/home', icon: LayoutGrid },
  { label: 'Classes', href: '/classes', icon: Users },
  { label: 'Library', href: '/library', icon: BookOpen },
  { label: 'AI Toolkit', href: '/toolkit', icon: Sparkles },
];

const studentNav = [
  { label: 'Home', href: '/student', icon: LayoutGrid },
  { label: 'Assignments', href: '/student/assignments', icon: FileText },
  { label: 'Join', href: '/student/join', icon: Hash },
  { label: 'Analytics', href: '/student/analytics', icon: BarChart2 },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata as Record<string, unknown> | undefined)?.role ?? null;
  const navItems = role === 'student' ? studentNav : teacherNav;

  const isTeacherActive = (href: string) => {
    if (href === '/home') return pathname === '/home' || pathname === '/';
    if (href === '/toolkit') return pathname.startsWith('/toolkit') || pathname.startsWith('/teacher-toolkit');
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  const isStudentActive = (href: string) => {
    if (pathname === href) return true;
    if (href === '/student') return pathname === '/student' || pathname === '/student/home';
    return pathname.startsWith(`${href}/`);
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3 pt-1 pointer-events-none">
      <div className="bg-[#1c1c1c] rounded-[999px] px-2 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] flex items-center justify-around border border-white/10 mx-auto max-w-lg pointer-events-auto">
        {navItems.map((item) => {
          const isActive =
            role === 'student' ? isStudentActive(item.href) : isTeacherActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 min-w-[56px] py-1 rounded-2xl transition-colors',
                isActive ? 'text-white' : 'text-gray-400 active:text-gray-200'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-extrabold tracking-wide leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
