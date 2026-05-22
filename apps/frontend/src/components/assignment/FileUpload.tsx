'use client';

import { useCallback } from 'react';
import { CloudUpload, X } from 'lucide-react';
import { useAssignmentStore } from '@/lib/store/assignmentStore';
import { formatFileSize } from '@/lib/utils/formatting';

export function FileUpload() {
  const { uploadedFile, setUploadedFile } = useAssignmentStore();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) setUploadedFile(file);
    },
    [setUploadedFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setUploadedFile(file);
    },
    [setUploadedFile]
  );

  if (uploadedFile) {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <span className="bg-[#FFF4F0] text-[#FF6B35] text-xs font-medium px-3 py-1 rounded-full flex items-center gap-2">
          {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
          <button type="button" onClick={() => setUploadedFile(null)} className="hover:text-[#E55A24]">
            <X className="h-3 w-3" />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-[#E8ECF4] rounded-[10px] bg-[#F8F9FC] py-8 px-6 text-center cursor-pointer hover:border-[#FF6B35] hover:bg-[#FFF4F0] transition-colors"
    >
      <input
        type="file"
        accept=".pdf,.txt,.png,.jpg,.jpeg,application/pdf,text/plain,image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <CloudUpload className="h-10 w-10 mx-auto text-[#A0AEC0] mb-3" />
        <p className="text-sm font-medium text-[#4A5568] mb-1">
          Choose a file or drag & drop it here
        </p>
        <p className="text-xs text-[#A0AEC0] mb-4">JPEG, PNG, upto 10MB</p>
        <span className="inline-block px-4 py-2 text-sm font-medium text-[#4A5568] border border-[#E8ECF4] bg-white rounded-lg hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors">
          Browse Files
        </span>
      </label>
    </div>
  );
}
