import React from "react";
import { Layers } from "lucide-react";
import { UniversalSubject } from "../../data";

interface SubjectFilterBarProps {
  subjects: UniversalSubject[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  availableSubjectCounts?: Record<string, number>;
  totalNotesCount: number;
}

export function SubjectFilterBar({
  subjects,
  selectedSubject,
  onSelectSubject,
  availableSubjectCounts = {},
  totalNotesCount
}: SubjectFilterBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 uppercase font-mono text-[10px] tracking-wider">
          <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Filter by Subject / Field</span>
        </span>
        {selectedSubject !== "All Subjects" && (
          <button
            onClick={() => onSelectSubject("All Subjects")}
            className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Scrollable horizontal pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          onClick={() => onSelectSubject("All Subjects")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
            selectedSubject === "All Subjects"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <span>All Subjects</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
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
              onClick={() => onSelectSubject(subj.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <span>{subj.name}</span>
              {typeof count === "number" && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
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
    </div>
  );
}
