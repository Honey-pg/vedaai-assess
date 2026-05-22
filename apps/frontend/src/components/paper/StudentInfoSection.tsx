'use client';

export function StudentInfoSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 print:mb-4">
      <div className="flex items-end gap-2">
        <span className="text-sm font-medium whitespace-nowrap font-serif">Name:</span>
        <input
          type="text"
          className="flex-1 border-0 border-b border-foreground/30 bg-transparent text-sm outline-none focus:border-foreground pb-0.5 font-serif"
        />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-sm font-medium whitespace-nowrap font-serif">Roll No:</span>
        <input
          type="text"
          className="flex-1 border-0 border-b border-foreground/30 bg-transparent text-sm outline-none focus:border-foreground pb-0.5 font-serif"
        />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-sm font-medium whitespace-nowrap font-serif">Section:</span>
        <input
          type="text"
          className="flex-1 border-0 border-b border-foreground/30 bg-transparent text-sm outline-none focus:border-foreground pb-0.5 font-serif"
        />
      </div>
    </div>
  );
}
