import React from "react";
import { Search, Sparkles, Plus, FileText } from "lucide-react";

interface ExplorerHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAskAIWithQuery: () => void;
  onOpenUpload: () => void;
  onDownloadPPTX: () => void;
  onOpenAITutor: () => void;
  isGeneratingPPTX: boolean;
  notesCount: number;
}

export function ExplorerHero({
  searchQuery,
  onSearchChange,
  onAskAIWithQuery,
  onOpenUpload,
  onDownloadPPTX,
  onOpenAITutor,
  isGeneratingPPTX,
  notesCount
}: ExplorerHeroProps) {
  return (
    <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-5 max-w-3xl mx-auto w-full transition-all">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
          <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>AI Study Workspace • Supabase Cloud Storage</span>
        </span>
        <h2 className="text-2xl md:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white italic pt-1">
          Notsopedia Universal Search
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-sans leading-relaxed">
          Synthesize peer-reviewed community notes, academic syllabi, and research papers.
          Enter a topic to search the vault or query the AI Tutor directly.
        </p>
      </div>

      {/* Central Search Bar */}
      <div className="relative w-full max-w-xl focus-within:scale-[1.01] transition-transform duration-200">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="h-5 w-5" />
        </span>
        <input
          type="text"
          placeholder="Search notes, topics, or ask the AI Tutor a question..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
              onAskAIWithQuery();
            }
          }}
          className="w-full pl-11 pr-32 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 shadow-xs transition-all"
        />
        <div className="absolute right-2 inset-y-0 flex items-center">
          <button
            onClick={onAskAIWithQuery}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-sans text-xs font-semibold uppercase tracking-wider transition-all flex items-center space-x-1 shadow-xs shrink-0"
            title="Directly launch AI tutor session with this query"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-sans text-slate-500 dark:text-slate-400 pt-1">
        <span className="text-[11px] uppercase font-mono tracking-wider opacity-70">Quick Actions:</span>
        <button
          onClick={onOpenUpload}
          className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Upload Note</span>
        </button>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <button
          onClick={onDownloadPPTX}
          disabled={isGeneratingPPTX || notesCount === 0}
          className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline font-semibold flex items-center gap-1 disabled:opacity-40 transition"
          title="Export notes library to PowerPoint slide deck"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Export PPTX</span>
        </button>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <button
          onClick={onOpenAITutor}
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 transition"
          title="Launch interactive AI Tutor"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Open AI Tutor</span>
        </button>
      </div>
    </div>
  );
}
