import Link from 'next/link';

interface ComingSoonPlaceholderProps {
  title: string;
  /** When false, rely on AppHeader / TopBar for the page name (avoids duplicate headings on mobile). */
  showTitle?: boolean;
  description?: string;
}

export function ComingSoonPlaceholder({
  title,
  showTitle = true,
  description = 'This section is not part of the hiring demo flow yet. Use the sidebar or browser back to return to Assignments.',
}: ComingSoonPlaceholderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center w-full min-h-[50vh]">
      {showTitle ? <h1 className="text-xl font-bold text-[#1A202C] mb-2">{title}</h1> : null}
      <p className={`text-sm text-[#718096] max-w-md mb-6 ${showTitle ? '' : 'mt-0'}`}>{description}</p>
      <Link href="/home" className="text-sm font-medium text-[#fe5b2b] hover:text-[#eb4e1e]">
        ← Back to Home
      </Link>
    </div>
  );
}
