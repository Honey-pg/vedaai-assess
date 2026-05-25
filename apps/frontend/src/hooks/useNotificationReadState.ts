'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'vedaai.notifications.readIds';
const CHANGE_EVENT = 'vedaai-notifications-change';

function parseReadIds(raw: string | null): Set<string> {
  try {
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = () => onChange();
  window.addEventListener('storage', listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return '[]';
  return localStorage.getItem(STORAGE_KEY) ?? '[]';
}

function getServerSnapshot(): string {
  return '[]';
}

export function useNotificationReadState() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const readIds = useMemo(() => parseReadIds(raw), [raw]);

  const markRead = useCallback((id: string) => {
    const next = new Set(readIds);
    if (next.has(id)) return;
    next.add(id);
    persistReadIds(next);
  }, [readIds]);

  const markAllRead = useCallback(
    (ids: string[]) => {
      const next = new Set(readIds);
      for (const id of ids) next.add(id);
      persistReadIds(next);
    },
    [readIds]
  );

  return { readIds, markRead, markAllRead };
}
