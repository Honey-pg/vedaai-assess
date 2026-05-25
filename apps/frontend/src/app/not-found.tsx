import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#f5f6f8] px-6 py-16 text-center">
      <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">404</p>
      <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-2">Page not found</h1>
      <p className="text-[15px] text-gray-500 max-w-md mb-8 leading-relaxed">
        The page you’re looking for doesn’t exist or was moved. Head back to your dashboard to continue.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-full bg-[#1c1c1c] text-white font-bold text-[14px] px-8 py-3 hover:bg-black transition-colors"
        >
          Teacher home
        </Link>
        <Link
          href="/student"
          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 font-bold text-[14px] px-8 py-3 hover:bg-gray-50 transition-colors"
        >
          Student home
        </Link>
      </div>
    </div>
  );
}
