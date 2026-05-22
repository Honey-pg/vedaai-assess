import Link from 'next/link';

interface ComingSoonPlaceholderProps {
  title: string;
}

export function ComingSoonPlaceholder({ title }: ComingSoonPlaceholderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center w-full min-h-[50vh]">
      <h1 className="text-xl font-bold text-[#1A202C] mb-2">{title}</h1>
      <p className="text-sm text-[#718096] max-w-md mb-6">
        This section is not part of the hiring demo flow yet. Use the sidebar or browser back to return to Assignments.
      </p>
      <Link
        href="/assignments"
        className="text-sm font-medium text-[#FF6B35] hover:text-[#E55A24]"
      >
        ← Back to Assignments
      </Link>
    </div>
  );
}
