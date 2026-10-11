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
  Tag,
  Sparkles
} from "lucide-react";
import { UserNote } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface NoteCardProps {
  note: UserNote;
  onLike: (id: string) => void;
  isLiked: boolean;
  isLikePending?: boolean;
  onRead: (note: UserNote) => void;
  onDownload: (note: UserNote) => void;
  onEdit?: (note: UserNote) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
  inCarousel?: boolean;
  key?: React.Key;
}

export function NoteCard({
  note,
  onLike,
  isLiked,
  isLikePending = false,
  onRead,
  onDownload,
  onEdit,
  onDelete,
  isAdmin,
  inCarousel = false
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
    <article
      className={`group relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-300 select-none overflow-hidden ${
        inCarousel
          ? "w-[280px] sm:w-[320px] shrink-0 snap-start h-[380px]"
          : "w-full h-full"
      } bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-emerald-500/5`}
    >
      {/* Subtle top ambient accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex-1 flex flex-col space-y-3">
        {/* Header: Subject Code & Date */}
        <div className="flex items-center justify-between gap-2">
          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 opacity-70" />
            <span>{note.subjectCode || "GEN-ACAD"}</span>
          </span>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center">
            <Calendar className="h-3 w-3 mr-1 text-slate-400" />
            {formattedDate}
          </span>
        </div>

        {/* Title: Consistent min-height ensures clean alignment across grid rows */}
        <h3
          onClick={() => onRead(note)}
          className="font-serif italic font-bold text-lg text-slate-900 dark:text-white leading-snug hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors line-clamp-2 min-h-[2.8rem] flex items-center"
          title={note.title}
        >
          {note.title}
        </h3>

        {/* Subject & Topic Metadata */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 min-h-[1.5rem]">
          <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
            {note.subjectName || "General"}
          </span>
          {note.topicName && (
            <span className="truncate max-w-[170px] text-slate-500 dark:text-slate-400">
              • {note.topicName}
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
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-1 overflow-hidden">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed line-clamp-3">
            {cleanSnippet || (
              <span className="text-slate-400 dark:text-slate-500 italic">
                Attached study resource. Click read or open file below to study.
              </span>
            )}
          </p>
        </div>

        {/* File Attachment Pill */}
        {note.fileName && (
          <div className="flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 p-2.5 rounded-xl text-xs mt-auto">
            <div className="flex items-center space-x-2 truncate">
              <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0">
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
                className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={UI_LABELS.actions.openAttachment}
                aria-label={`${UI_LABELS.actions.openAttachment}: ${note.fileName}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer: Author Info & Standardized 32px Action Buttons */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
        {/* Author info */}
        <div className="flex items-center space-x-2 truncate max-w-[120px] sm:max-w-[130px]">
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

        {/* Action Buttons Group */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Like button */}
          <button
            type="button"
            disabled={isLikePending}
            onClick={() => onLike(note.id)}
            className={`h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center space-x-1 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 ${
              isLikePending ? "opacity-60 cursor-not-allowed" : ""
            }`}
            title={isLiked ? UI_LABELS.actions.unlike : UI_LABELS.actions.like}
            aria-label={isLiked ? `Unlike note (${note.likes || 0} likes)` : `Like note (${note.likes || 0} likes)`}
          >
            <Heart
              className={`h-3 w-3 ${isLiked ? "text-rose-500" : "text-slate-400"}`}
              fill={isLiked ? "#f43f5e" : "none"}
              stroke={isLiked ? "#f43f5e" : "currentColor"}
            />
            <span className="text-[11px] font-mono">{note.likes || 0}</span>
          </button>

          {/* Read button */}
          <button
            type="button"
            onClick={() => onRead(note)}
            className="h-8 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold flex items-center space-x-1 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Read note"
            aria-label={`Read note: ${note.title}`}
          >
            <Eye className="h-3 w-3 text-emerald-400 dark:text-emerald-600" />
            <span>{UI_LABELS.actions.read}</span>
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={() => onDownload(note)}
            className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={note.fileUrl && note.fileName ? "Download attachment" : "Download Markdown"}
            aria-label={`Download note: ${note.title}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Admin moderation controls */}
          {isAdmin && (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(note)}
                  className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition shadow-xs flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                  title="Edit Note"
                  aria-label={`Edit note: ${note.title}`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(note.id)}
                  className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 transition shadow-xs flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                  title="Delete Note"
                  aria-label={`Delete note: ${note.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
