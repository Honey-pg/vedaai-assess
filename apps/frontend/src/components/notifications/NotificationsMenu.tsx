'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useNotificationReadState } from '@/hooks/useNotificationReadState';
import {
  notificationsForAudience,
  type NotificationAudience,
} from '@/lib/notifications/catalog';

type Variant = 'appHeaderDesktop' | 'appHeaderMobile' | 'topBar' | 'mobileHeader';

interface NotificationsMenuProps {
  variant?: Variant;
  audience?: NotificationAudience;
  className?: string;
}

function BellGlyph({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/** Shared: 44×44-ish targets on mobile-heavy variants, WCAG-aligned focus rings, token-aligned colors */
const variantStyles: Record<
  Variant,
  { bell: number; stroke: number; btn: string; dot: string }
> = {
  appHeaderDesktop: {
    bell: 22,
    stroke: 2,
    btn:
      'relative inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:active:scale-100',
    dot: 'pointer-events-none absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-card',
  },
  appHeaderMobile: {
    bell: 21,
    stroke: 2,
    btn:
      'relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:active:scale-100',
    dot: 'pointer-events-none absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-card',
  },
  topBar: {
    bell: 20,
    stroke: 2,
    btn:
      'relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:active:scale-100',
    dot: 'pointer-events-none absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-white',
  },
  mobileHeader: {
    bell: 21,
    stroke: 2,
    btn:
      'relative inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-0 text-muted-foreground hover:bg-muted motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:active:scale-100',
    dot: 'pointer-events-none absolute top-3 right-3 size-2 rounded-full bg-primary ring-2 ring-background',
  },
};

export function NotificationsMenu({
  variant = 'appHeaderDesktop',
  audience: audienceProp,
  className = '',
}: NotificationsMenuProps) {
  const { user } = useUser();
  const { readIds, markRead, markAllRead } = useNotificationReadState();
  const [client, setClient] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- unread badge after hydrate
    setClient(true);
  }, []);

  const audience: NotificationAudience = useMemo(() => {
    if (audienceProp) return audienceProp;
    const r = user?.publicMetadata?.role;
    return r === 'student' ? 'student' : 'teacher';
  }, [audienceProp, user?.publicMetadata?.role]);

  const items = useMemo(() => notificationsForAudience(audience), [audience]);

  const unreadIds = useMemo(() => items.map((n) => n.id).filter((id) => !readIds.has(id)), [items, readIds]);
  const unreadCount = client ? unreadIds.length : 0;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const vs = variantStyles[variant];

  const panel = open ? (
    <div
      id={panelId}
      className="absolute top-full right-0 z-[100] mt-2 w-[min(94vw,22.5rem)] overflow-hidden rounded-[var(--radius-xl)] border border-border bg-popover text-popover-foreground shadow-[var(--shadow-veda-soft)]"
      role="dialog"
      aria-label="Notifications and updates"
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
        <p className="text-sm font-semibold leading-tight text-foreground">Updates</p>
        {items.length > 0 && unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markAllRead(items.map((x) => x.id))}
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out"
          >
            Mark all read
          </button>
        ) : null}
      </div>
      <ul className="max-h-[min(70vh,26rem)] divide-y divide-border overflow-y-auto overscroll-contain py-1">
        {items.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing new—check back later.</li>
        ) : (
          items.map((n) => {
            const unread = client && !readIds.has(n.id);
            const body = (
              <>
                <p className="text-sm font-semibold leading-snug text-foreground">{n.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">{n.body}</p>
              </>
            );
            const rowPad = `${n.important ? 'border-l-[3px] border-l-primary' : ''} px-3 py-3`;
            const rowBg = unread ? 'bg-accent/35' : 'bg-transparent';

            if (n.href) {
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={`block ${rowPad} ${rowBg} motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset`}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                  >
                    {body}
                    <span className="mt-2 inline-block text-[11px] font-semibold text-primary">Open →</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={n.id} className={`${rowPad} ${rowBg}`}>
                {body}
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={vs.btn}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <BellGlyph size={vs.bell} strokeWidth={vs.stroke} />
        {client && unreadCount > 0 ? <span className={vs.dot} aria-hidden /> : null}
      </button>
      {panel}
    </div>
  );
}
