import React from "react";
import { BookOpen, Search, Plus, Sparkles, RotateCcw } from "lucide-react";
import { UI_LABELS } from "../../constants/labels";

interface EmptyStateProps {
  searchQuery?: string;
  selectedSubject?: string;
  filterAttachmentsOnly?: boolean;
  onClearFilters?: () => void;
  onUploadNote?: () => void;
  onAskAI?: () => void;
}

export function EmptyState({
  searchQuery,
  selectedSubject,
  filterAttachmentsOnly = false,
  onClearFilters,
  onUploadNote,
  onAskAI
}: EmptyStateProps) {
  const isFiltered = Boolean(
    (searchQuery && searchQuery.trim()) ||
    (selectedSubject && selectedSubject !== "All Subjects") ||
    filterAttachmentsOnly
  );

  let filterDescription: string = UI_LABELS.empty.noMatchingNotesDesc;
  if (searchQuery && filterAttachmentsOnly) {
    filterDescription = `No notes with file attachments found matching "${searchQuery}".`;
  } else if (searchQuery) {
    filterDescription = `We couldn't find any study notes matching "${searchQuery}".`;
  } else if (filterAttachmentsOnly && selectedSubject && selectedSubject !== "All Subjects") {
    filterDescription = `No notes with attachments found under ${selectedSubject}.`;
  } else if (filterAttachmentsOnly) {
    filterDescription = "No notes with file attachments were found in your library.";
  } else if (selectedSubject && selectedSubject !== "All Subjects") {
    filterDescription = `No notes found in the ${selectedSubject} subject.`;
  }

  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs max-w-xl mx-auto space-y-5">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        {isFiltered ? <Search className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif italic">
          {isFiltered ? UI_LABELS.empty.noMatchingNotesTitle : UI_LABELS.empty.emptyLibraryTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {isFiltered
            ? `${filterDescription} Try refining your keywords, adjusting criteria, or clearing all filters.`
            : UI_LABELS.empty.emptyLibraryDesc}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {isFiltered && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-9 px-4 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs"
            aria-label={UI_LABELS.actions.clearFilters}
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>{UI_LABELS.actions.clearFilters}</span>
          </button>
        )}

        {searchQuery && onAskAI && (
          <button
            type="button"
            onClick={onAskAI}
            className="h-9 px-4 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Ask AI Tutor about this topic"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask AI Tutor</span>
          </button>
        )}

        {onUploadNote && (
          <button
            type="button"
            onClick={onUploadNote}
            className="h-9 px-4 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={UI_LABELS.actions.uploadNotes}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{UI_LABELS.actions.uploadNotes}</span>
          </button>
        )}
      </div>
    </div>
  );
}
