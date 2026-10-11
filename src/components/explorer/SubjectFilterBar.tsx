import React from "react";
import { Layers, Paperclip, ArrowUpDown, RotateCcw } from "lucide-react";
import { UniversalSubject } from "../../data";
import { NoteSortOption } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface SubjectFilterBarProps {
  subjects: UniversalSubject[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  availableSubjectCounts?: Record<string, number>;
  totalNotesCount: number;
  sortBy?: NoteSortOption;
  onSortChange?: (sort: NoteSortOption) => void;
  filterAttachmentsOnly?: boolean;
  onToggleAttachmentsOnly?: () => void;
  attachmentCount?: number;
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function SubjectFilterBar({
  subjects,
  selectedSubject,
  onSelectSubject,
  availableSubjectCounts = {},
  totalNotesCount,
  sortBy = "newest",
  onSortChange,
  filterAttachmentsOnly = false,
  onToggleAttachmentsOnly,
  attachmentCount = 0,
  isFiltered = false,
  onResetFilters
}: SubjectFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Category header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 uppercase font-mono text-[10px] tracking-wider">
          <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Academic Subjects</span>
        </span>
        {selectedSubject !== "All Subjects" && (
          <button
            type="button"
            onClick={() => onSelectSubject("All Subjects")}
            className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
          >
            Show All Subjects
          </button>
        )}
      </div>

      {/* Scrollable horizontal subject pills */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin"
        role="region"
        aria-label="Filter notes by academic subject"
      >
        <button
          type="button"
          onClick={() => onSelectSubject("All Subjects")}
          aria-pressed={selectedSubject === "All Subjects"}
          className={`h-8 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            selectedSubject === "All Subjects"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <span>{UI_LABELS.filters.allSubjects}</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
              selectedSubject === "All Subjects"
                ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            {totalNotesCount}
          </span>
        </button>

        {subjects.map((subj) => {
          const count = availableSubjectCounts[subj.name];
          const isSelected = selectedSubject === subj.name;

          return (
            <button
              key={subj.code}
              type="button"
              onClick={() => onSelectSubject(subj.name)}
              aria-pressed={isSelected}
              className={`h-8 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <span>{subj.name}</span>
              {typeof count === "number" && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Discovery & Refinement Toolbar: Attachment Filter, Reset, and Sort */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center flex-wrap gap-2">
          {/* Attachment filter toggle */}
          {onToggleAttachmentsOnly && (
            <button
              type="button"
              onClick={onToggleAttachmentsOnly}
              aria-pressed={filterAttachmentsOnly}
              className={`h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                filterAttachmentsOnly
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              title="Show only notes that include downloadable file attachments"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>{UI_LABELS.filters.hasAttachments}</span>
              {attachmentCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    filterAttachmentsOnly
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {attachmentCount}
                </span>
              )}
            </button>
          )}

          {/* Clear Filters button */}
          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 shadow-2xs"
              title="Clear all active search and filter criteria"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{UI_LABELS.actions.clearFilters}</span>
            </button>
          )}
        </div>

        {/* Sort selector */}
        {onSortChange && (
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <label htmlFor="notes-sort-select" className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {UI_LABELS.filters.sortBy}:
            </label>
            <select
              id="notes-sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as NoteSortOption)}
              className="h-8 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 text-xs font-semibold hover:border-slate-300 dark:hover:border-slate-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-xs transition"
              aria-label="Sort notes"
            >
              <option value="newest">{UI_LABELS.filters.sortNewest}</option>
              <option value="likes">{UI_LABELS.filters.sortLikes}</option>
              <option value="title">{UI_LABELS.filters.sortTitle}</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
