import React from "react";
import { ArrowUpRight, BookOpen, Layers } from "lucide-react";
import { UniversalSubject } from "../../data";

interface SubjectCardProps {
  subject: UniversalSubject;
  noteCount: number;
  isSelected?: boolean;
  onSelect: (subjectName: string) => void;
  key?: React.Key;
}

// Categorical gradient palettes for visual distinction
const CATEGORY_GRADIENTS: Record<string, { bg: string; border: string; accent: string }> = {
  "Computer Science": {
    bg: "from-blue-950/60 via-indigo-950/40 to-slate-900/80",
    border: "group-hover:border-indigo-500/50",
    accent: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  },
  "Applied Physics": {
    bg: "from-cyan-950/60 via-teal-950/40 to-slate-900/80",
    border: "group-hover:border-cyan-500/50",
    accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
  },
  "Mathematics": {
    bg: "from-violet-950/60 via-purple-950/40 to-slate-900/80",
    border: "group-hover:border-violet-500/50",
    accent: "text-violet-400 bg-violet-500/10 border-violet-500/20"
  },
  "Economics & Business": {
    bg: "from-amber-950/60 via-yellow-950/40 to-slate-900/80",
    border: "group-hover:border-amber-500/50",
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  },
  "Humanities": {
    bg: "from-rose-950/60 via-pink-950/40 to-slate-900/80",
    border: "group-hover:border-rose-500/50",
    accent: "text-rose-400 bg-rose-500/10 border-rose-500/20"
  },
  "Medical Sciences": {
    bg: "from-emerald-950/60 via-teal-950/40 to-slate-900/80",
    border: "group-hover:border-emerald-500/50",
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  }
};

const DEFAULT_THEME = {
  bg: "from-slate-900/90 via-slate-800/60 to-slate-900/90",
  border: "group-hover:border-emerald-500/50",
  accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
};

export function SubjectCard({
  subject,
  noteCount,
  isSelected = false,
  onSelect
}: SubjectCardProps) {
  const theme = CATEGORY_GRADIENTS[subject.category] || DEFAULT_THEME;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(subject.name)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(subject.name);
        }
      }}
      className={`group relative overflow-hidden text-left cursor-pointer rounded-2xl p-5 border transition-all duration-300 w-[260px] sm:w-[280px] shrink-0 snap-start flex flex-col justify-between select-none ${
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-slate-900 shadow-lg shadow-emerald-500/10"
          : `border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/90 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-indigo-500/5 ${theme.border}`
      }`}
      aria-label={`Subject ${subject.name}, ${noteCount} note${noteCount === 1 ? "" : "s"}`}
    >
      {/* Subtle background gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-10 dark:opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none`}
      />

      <div className="relative z-10 space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${theme.accent}`}
          >
            {subject.code || "ACAD"}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-slate-400" />
            {noteCount} {noteCount === 1 ? "note" : "notes"}
          </span>
        </div>

        {/* Title */}
        <h4 className="font-serif italic font-bold text-base text-slate-900 dark:text-white line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {subject.name}
        </h4>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans line-clamp-2 leading-relaxed">
          {subject.description || subject.category}
        </p>
      </div>

      {/* Footer link cue */}
      <div className="relative z-10 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        <span className="flex items-center gap-1.5 text-[11px]">
          <Layers className="h-3 w-3" />
          <span>{subject.category}</span>
        </span>
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-500 transition-all">
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </div>
  );
}
