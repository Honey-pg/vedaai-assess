'use client';

import { TopBar } from '@/components/layout/TopBar';
import { AssignmentForm } from '@/components/assignment/AssignmentForm';

export default function NewAssignmentPage() {
  return (
    <>
      <TopBar title="Assignment" backHref="/assignments" />

      <div className="flex justify-center px-6 md:px-8 py-6 md:py-8 w-full">
        <div className="w-full max-w-[720px]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h1 className="text-xl font-bold">Create Assignment</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Set up a new assignment for your students
          </p>

          <AssignmentForm />
        </div>
      </div>
    </>
  );
}
