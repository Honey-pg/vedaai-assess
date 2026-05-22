'use client';

import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';

interface AppShellProps {
  children: React.ReactNode;
  assignmentCount?: number;
}

export function AppShell({ children, assignmentCount }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar assignmentCount={assignmentCount} />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0 flex flex-col">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
