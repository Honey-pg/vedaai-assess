'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FileText, LayoutGrid, Users, Settings, Sparkles, PieChart, BarChart2, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const teacherNavItems = [
  { label: 'Home', href: '/home', icon: LayoutGrid },
  { label: 'My Classes', href: '/classes', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: FileText },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'My Library', href: '/library', icon: PieChart },
];

const studentNavItems = [
  { label: 'Home', href: '/student', icon: LayoutGrid },
  { label: 'Assignments', href: '/student/assignments', icon: FileText },
  { label: 'Join Class', href: '/student/join', icon: Hash },
  { label: 'Analytics', href: '/student/analytics', icon: BarChart2 },
];

const navListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata as Record<string, unknown> | undefined)?.role ?? null;
  const navItems = role === 'student' ? studentNavItems : teacherNavItems;

  const routeActive = (href: string) => {
    if (pathname === href) return true;
    if (href === '/home') return pathname === '/home' || pathname === '/';
    if (href === '/student') return pathname === '/student' || pathname === '/student/home';
    return pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-[260px] h-full md:max-h-full bg-white rounded-[32px] flex flex-col py-8 px-6 shrink-0 shadow-sm border border-gray-100/30">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center gap-3 mb-10 px-1"
      >
        <Image
          src="/vedaai-logo.svg"
          alt="VedaAI Logo"
          width={42}
          height={42}
          priority
          className="w-[42px] h-[42px] object-contain shrink-0 drop-shadow-sm"
        />
        <span className="text-heading text-gray-900 tracking-tight">VedaAI</span>
      </motion.div>

      {role !== 'student' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
          className="relative mb-9 rounded-3xl p-0.5 bg-gradient-to-r from-[#e74c25] to-[#f47f42] shadow-[0_8px_16px_rgba(231,76,37,0.25)] shrink-0"
        >
          <Link
            href="/create"
            className="flex-1 flex items-center justify-center gap-2.5 bg-[#252525] text-white rounded-[22px] py-3.5 px-4 text-sidebar-item hover:bg-black transition-colors w-full text-center font-medium"
          >
            <Sparkles size={16} fill="currentColor" />
            Create Assignment
          </Link>
        </motion.div>
      )}

      <motion.nav
        variants={navListVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-1.5 flex-1 overflow-y-auto"
      >
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActiveRoute = routeActive(href);
          return (
            <motion.div key={href} variants={navItemVariants}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sidebar-item transition-colors relative',
                  isActiveRoute
                    ? 'bg-[#f5f6f8] text-gray-900 font-bold'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                )}
              >
                <Icon size={18} strokeWidth={isActiveRoute ? 2.5 : 2} className={isActiveRoute ? 'text-gray-900' : ''} />
                <span className="flex-1 leading-none">{label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-auto flex flex-col gap-3 shrink-0"
      >
        {role !== 'student' ? (
          <Link
            href="/settings"
            className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sidebar-item text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <Settings size={18} strokeWidth={2} />
            Settings
          </Link>
        ) : null}

        <div className="flex items-center p-3 mt-1 bg-[#f4f4f6] rounded-2xl gap-3 shadow-inner">
          <UserButton appearance={{ elements: { avatarBox: 'h-11 w-11', userButtonPopoverCard: 'rounded-2xl' } }} />
          <div className="min-w-0 pr-2">
            <p className="text-normal font-bold text-gray-900 truncate leading-tight">
              {user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Teacher'}
            </p>
            <p className="text-normal text-[11.5px] text-gray-500 truncate mt-1">{user?.primaryEmailAddress?.emailAddress ?? ''}</p>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}
