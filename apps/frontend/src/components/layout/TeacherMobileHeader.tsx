'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu';

export default function TeacherMobileHeader() {
  const { user } = useUser();

  return (
    <header className="md:hidden sticky top-0 z-40 flex w-full items-center justify-between border-b border-border bg-[var(--surface-elevated)] px-4 py-3.5 shadow-[0_1px_0 rgba(234,236,240,1)] backdrop-blur-md supports-backdrop-filter:bg-background/85">
      <Link
        href="/home"
        className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Image
          src="/vedaai-logo.svg"
          alt="VedaAI"
          width={32}
          height={32}
          priority
          className="w-8 h-8 object-contain shrink-0 drop-shadow-sm"
        />
        <span className="text-heading text-lg leading-none tracking-tight text-foreground truncate">VedaAI</span>
      </Link>

      <div className="flex items-center gap-1 shrink-0">
        <NotificationsMenu variant="mobileHeader" />
        <Link
          href="/settings"
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-gradient-to-br from-accent/80 to-accent shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 motion-safe:transition-shadow motion-safe:duration-150 motion-safe:ease-out"
          aria-label="Account settings"
        >
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
          ) : (
            <span className="text-[15px] font-bold text-gray-800">{user?.firstName?.[0] ?? 'T'}</span>
          )}
        </Link>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
          aria-label="Menu"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
