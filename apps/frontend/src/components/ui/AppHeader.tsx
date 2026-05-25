'use client';

import React, { useEffect, useRef, useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu';
export interface HeaderClassOption {
  id: string;
  name: string;
}

interface AppHeaderProps {
  breadcrumb?: string;
  /** When empty, hides the dropdown. */
  classes?: HeaderClassOption[];
  selectedClassId?: string | null;
  onClassChange?: (id: string | null) => void;
  icon?: React.ReactNode;
}

/** Responsive header with breadcrumbs and account menu. */
export default function AppHeader({
  breadcrumb,
  icon,
  classes,
  selectedClassId,
  onClassChange,
}: AppHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const classFilter =
    classes && classes.length > 0 ? (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2 text-[13px] font-bold text-gray-700"
        >
          {selectedClass?.name ?? 'All Classes'}
          <ChevronDown size={14} strokeWidth={2.5} />
        </button>

        {dropdownOpen ? (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-[16px] shadow-lg border border-gray-100 z-50 min-w-[150px] py-2 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                onClassChange?.(null);
                setDropdownOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-[13px] font-medium hover:bg-gray-50 transition-colors ${
                !selectedClassId ? 'text-[#fe5b2b] font-bold' : 'text-gray-700'
              }`}
            >
              All Classes
            </button>
            {classes.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  onClassChange?.(c.id);
                  setDropdownOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-[13px] font-medium hover:bg-gray-50 transition-colors ${
                  selectedClassId === c.id ? 'text-[#fe5b2b] font-bold' : 'text-gray-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <>
      {/* Mobile: page label only — shell header already has notifications + account */}
      <div className="md:hidden mb-3 shrink-0 flex items-center gap-2 min-w-0 px-0.5">
        <span className="shrink-0 text-gray-500">{icon || <LayoutGrid size={17} strokeWidth={2} />}</span>
        <span className="truncate text-[15px] font-semibold text-gray-900">{breadcrumb ?? 'Home'}</span>
      </div>

      {/* Desktop */}
      <header className="hidden md:flex w-full shrink-0 rounded-[28px] border border-gray-100/90 bg-white shadow-[0_4px_22px_rgba(0,0,0,0.04)] items-center justify-between px-6 py-3.5 gap-4 min-h-[3.5rem]">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 text-normal text-gray-400 shrink-0">
            {icon || <LayoutGrid size={18} strokeWidth={2} />}
            <span className="font-semibold text-gray-700">{breadcrumb ?? 'Home'}</span>
          </div>
          {classFilter}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <NotificationsMenu variant="appHeaderDesktop" />

          <UserButton
            showName
            appearance={{
              elements: {
                userButtonBox: 'gap-2',
                userButtonTrigger:
                  'rounded-full pl-1.5 pr-3 py-1.5 hover:bg-gray-50 shadow-none gap-2 border border-transparent hover:border-gray-100',
              },
            }}
          />
        </div>
      </header>
    </>
  );
}
