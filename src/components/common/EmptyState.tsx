import React from "react";
import { BookOpen, Search, Plus, Sparkles } from "lucide-react";

interface EmptyStateProps {
  searchQuery?: string;
  selectedSubject?: string;
  onClearFilters?: () => void;
  onUploadNote?: () => void;
  onAskAI?: () => void;
}

export function EmptyState({
  searchQuery,
  selectedSubject,
  onClearFilters,
  onUploadNote,
  onAskAI
}: EmptyStateProps) {
  const isFiltered = Boolean(searchQuery || (selectedSubject && selectedSubject !== "All Subjects"));

  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs max-w-xl mx-auto space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        {isFiltered ? <Search className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif italic">
          {isFiltered ? "No notes found matching your criteria" : "Your study library is currently empty"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {isFiltered
            ? `We couldn't find any study notes matching "${searchQuery || selectedSubject}". Try refining your keywords or clear your active filters.`
            : "Be the first to connect your student profile and publish peer-reviewed notes, syllabi, or exam blueprints!"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {isFiltered && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Clear Filters
          </button>
        )}

        {searchQuery && onAskAI && (
          <button
            onClick={onAskAI}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 transition shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask AI Tutor about this</span>
          </button>
        )}

        {onUploadNote && (
          <button
            onClick={onUploadNote}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Upload New Note</span>
          </button>
        )}
      </div>
    </div>
  );
}
