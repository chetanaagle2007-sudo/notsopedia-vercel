import React from "react";
import { Search, Sparkles, Plus, BookOpen } from "lucide-react";
import { UI_LABELS } from "../../constants/labels";

interface ExplorerHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAskAIWithQuery: () => void;
  onOpenUpload: () => void;
  onDownloadPPTX?: () => void;
  onOpenAITutor?: () => void;
  isGeneratingPPTX?: boolean;
  notesCount: number;
}

export function ExplorerHero({
  searchQuery,
  onSearchChange,
  onAskAIWithQuery,
  onOpenUpload,
  notesCount
}: ExplorerHeroProps) {
  const suggestedTopics = [
    "Data Structures",
    "Algorithms",
    "Quantum Mechanics",
    "Macroeconomics"
  ];

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-6 max-w-3xl mx-auto w-full transition-all">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
          <BookOpen className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>Curated Academic Vault • {notesCount} Notes Available</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white italic pt-1">
          Notsopedia Study Library
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-sans leading-relaxed">
          Discover peer-reviewed lecture notes, exam blueprints, and syllabus outlines.
          Search by concept or consult the AI Tutor directly.
        </p>
      </div>

      {/* Central Search Bar */}
      <div className="relative w-full max-w-xl focus-within:scale-[1.005] transition-transform duration-200">
        <label htmlFor="notes-search-input" className="sr-only">
          {UI_LABELS.actions.search}
        </label>
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="h-4.5 w-4.5" />
        </span>
        <input
          id="notes-search-input"
          type="search"
          placeholder="Search notes by title, topic, or keyword..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
              onAskAIWithQuery();
            }
          }}
          className="w-full pl-11 pr-28 sm:pr-32 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 shadow-xs transition-all"
        />
        <div className="absolute right-1.5 inset-y-0 flex items-center">
          <button
            type="button"
            onClick={onAskAIWithQuery}
            className="h-8 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-sans text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-xs shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Ask AI Tutor with this search query"
            aria-label="Ask AI Tutor with this search query"
          >
            <Sparkles className="h-3 w-3" />
            <span>AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Quick shortcuts & Topic suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={UI_LABELS.actions.uploadNotes}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{UI_LABELS.actions.uploadNotes}</span>
        </button>

        <span className="text-slate-300 dark:text-slate-700 mx-1 hidden sm:inline">•</span>

        <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
          Popular:
        </span>

        {suggestedTopics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => onSearchChange(topic)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-[11px] font-medium transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={`Search notes for ${topic}`}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
