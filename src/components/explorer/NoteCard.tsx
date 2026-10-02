import React from "react";
import {
  Calendar,
  Heart,
  Eye,
  Download,
  FileText,
  User,
  Edit3,
  Trash2,
  ExternalLink,
  Tag
} from "lucide-react";
import { UserNote } from "../../types";

interface NoteCardProps {
  note: UserNote;
  onLike: (id: string) => void;
  isLiked: boolean;
  onRead: (note: UserNote) => void;
  onDownload: (note: UserNote) => void;
  onEdit?: (note: UserNote) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
  key?: React.Key;
}

export function NoteCard({
  note,
  onLike,
  isLiked,
  onRead,
  onDownload,
  onEdit,
  onDelete,
  isAdmin
}: NoteCardProps) {
  // Format clean content preview
  const cleanSnippet = (note.content || "")
    .replace(/[#*$\-`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const formattedDate = note.uploadedAt
    ? new Date(note.uploadedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "Recent";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group">
      <div className="space-y-3.5">
        {/* Header: Subject Code & Date */}
        <div className="flex items-center justify-between gap-2">
          <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
            {note.subjectCode || "GEN-ACAD"}
          </span>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center">
            <Calendar className="h-3 w-3 mr-1 text-slate-400" />
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onRead(note)}
          className="font-serif italic font-bold text-lg text-slate-900 dark:text-white leading-snug hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors line-clamp-2"
          title={note.title}
        >
          {note.title}
        </h3>

        {/* Subject & Topic Metadata */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {note.subjectName || "General"}
          </span>
          {note.topicName && (
            <span className="truncate max-w-[180px] text-slate-500 dark:text-slate-400">
              â€¢ {note.topicName}
            </span>
          )}
        </div>

        {/* Tags if any */}
        {Array.isArray(note.tags) && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded border border-slate-200/60 dark:border-slate-800"
              >
                <Tag className="h-2.5 w-2.5 text-slate-400" />
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[9px] font-mono text-slate-400 self-center">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Content Preview */}
        {cleanSnippet ? (
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed line-clamp-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {cleanSnippet}
          </p>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic font-sans leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800/80">
            Attached file resource. Click read or open file below to study.
          </p>
        )}

        {/* File Attachment Pill */}
        {note.fileName && (
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 p-2.5 rounded-xl text-xs mt-2">
            <div className="flex items-center space-x-2 truncate">
              <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="truncate">
                <span
                  className="font-medium text-slate-800 dark:text-slate-200 truncate block text-[11px]"
                  title={note.fileName}
                >
                  {note.fileName}
                </span>
                {note.fileSize ? (
                  <span className="text-[9px] text-slate-400 font-mono">
                    {(note.fileSize / 1024).toFixed(1)} KB
                  </span>
                ) : null}
              </div>
            </div>

            {note.fileUrl && (
              <a
                href={note.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition shrink-0"
                title="Open attachment in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer: Uploader & Actions */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Author info */}
        <div className="flex items-center space-x-2 truncate max-w-[130px]">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <User className="h-3 w-3 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="truncate">
            <span
              className="block font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate"
              title={note.uploaderName}
            >
              {note.uploaderName || "Scholar"}
            </span>
            <span className="block uppercase text-[8px] font-mono text-slate-400 dark:text-slate-500">
              {note.uploaderRole || "Student"}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Like button */}
          <button
            onClick={() => onLike(note.id)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center space-x-1 transition shadow-xs"
            title={isLiked ? "Unlike this note" : "Like this note"}
          >
            <Heart className={`h-3 w-3 ${isLiked ? "text-rose-500" : "text-slate-400"}`} fill={isLiked ? "#f43f5e" : "none"} stroke={isLiked ? "#f43f5e" : "currentColor"} />
            <span className="text-[11px]">{note.likes || 0}</span>
          </button>

          {/* Read button */}
          <button
            onClick={() => onRead(note)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold flex items-center space-x-1 transition shadow-xs"
            title="Read complete note"
          >
            <Eye className="h-3 w-3 text-emerald-400 dark:text-emerald-600" />
            <span>Read</span>
          </button>

          {/* Download button */}
          <button
            onClick={() => onDownload(note)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs"
            title={note.fileUrl && note.fileName ? "Download original attachment" : "Download note as Markdown"}
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Admin moderation controls */}
          {isAdmin && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(note)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition shadow-xs"
                  title="Moderate / Edit Note (Admin)"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(note.id)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 transition shadow-xs"
                  title="Delete Note (Admin)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}





