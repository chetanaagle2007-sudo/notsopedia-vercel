import React, { useState } from "react";
import {
  Book,
  Download,
  X,
  FileText,
  ExternalLink,
  Calendar,
  User,
  Tag,
  Check
} from "lucide-react";
import { UserNote } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface NoteReaderModalProps {
  note: UserNote | null;
  onClose: () => void;
  onDownloadMarkdown: (note: UserNote) => void;
}

export function NoteReaderModal({
  note,
  onClose,
  onDownloadMarkdown
}: NoteReaderModalProps) {
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  if (!note) return null;

  const formattedDate = note.uploadedAt
    ? new Date(note.uploadedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Unknown Date";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Book className="h-4 w-4" />
            </div>
            <div>
              <span className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
                Notsopedia Reader
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 ml-2">
                • {note.subjectCode || "GEN-ACAD"}
              </span>
            </div>
          </div>

          {/* Controls: Font Size, Download MD, Close */}
          <div className="flex items-center space-x-2.5">
            {/* Font scaling pills */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 text-xs font-mono">
              <button
                onClick={() => setFontSize("normal")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  fontSize === "normal"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Normal font size"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("large")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  fontSize === "large"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Large font size"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize("xlarge")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  fontSize === "xlarge"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Extra large font size"
              >
                A++
              </button>
            </div>

            {/* Markdown export button */}
            <button
              onClick={() => onDownloadMarkdown(note)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
              title="Download note formatted as Markdown"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export MD</span>
              <span className="sm:hidden">MD</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close reader"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Content */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 space-y-6">
          {/* Header Metadata */}
          <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                {note.subjectName} ({note.subjectCode || "GEN-ACAD"})
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif italic font-bold text-slate-900 dark:text-white leading-tight">
              {note.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  By <strong className="text-slate-800 dark:text-slate-200">{note.uploaderName}</strong> ({note.uploaderRole})
                </span>
              </div>
              {note.topicName && (
                <span>
                  • Topic: <strong className="text-slate-700 dark:text-slate-300">{note.topicName}</strong>
                </span>
              )}
            </div>

            {/* Tags */}
            {Array.isArray(note.tags) && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {note.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attached Document Card (if file was attached) */}
          {note.fileName && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3 truncate">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white truncate block" title={note.fileName}>
                    {note.fileName}
                  </span>
                  {note.fileSize ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      Attached File • {(note.fileSize / 1024).toFixed(1)} KB
                    </span>
                  ) : null}
                </div>
              </div>

              {note.fileUrl && (
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 shrink-0 shadow-xs"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Attached File</span>
                </a>
              )}
            </div>
          )}

          {/* Rendered Note Content */}
          <div className="prose max-w-none text-slate-800 dark:text-slate-200">
            {note.content ? (
              <MarkdownRenderer content={note.content} fontSize={fontSize} />
            ) : (
              <p className="text-sm italic text-slate-400 dark:text-slate-500">
                No text summary provided. Please open the attached academic file above to study.
              </p>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
          <span>Document ID: {note.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
}
