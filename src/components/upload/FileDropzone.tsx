import React, { useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

interface FileDropzoneProps {
  fileName: string;
  fileSize: number;
  onFileSelected: (file: File) => void;
  onClearFile: () => void;
}

export function FileDropzone({
  fileName,
  fileSize,
  onFileSelected,
  onClearFile
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        Attach Study Document <span className="text-slate-400 font-normal">(PDF, DOCX, ZIP, PPTX, Images)</span>
      </label>

      {fileName ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-slate-900 dark:text-white truncate block" title={fileName}>
                {fileName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {(fileSize / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearFile}
            className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer relative group ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]"
              : "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
          }`}
        >
          <input
            type="file"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Click or drag file to attach"
          />

          <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
            <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
              Drag & drop your study file, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Uploaded directly to Supabase Cloud Storage
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
