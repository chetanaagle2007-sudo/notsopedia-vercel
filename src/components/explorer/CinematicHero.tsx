import React from "react";
import {
  Search,
  Sparkles,
  Plus,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileText,
  User
} from "lucide-react";
import { UserNote } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface CinematicHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAskAIWithQuery: () => void;
  onOpenUpload: () => void;
  onOpenAITutor: () => void;
  onReadNote?: (note: UserNote) => void;
  notesCount: number;
  featuredNote?: UserNote | null;
}

export function CinematicHero({
  searchQuery,
  onSearchChange,
  onAskAIWithQuery,
  onOpenUpload,
  onOpenAITutor,
  onReadNote,
  notesCount,
  featuredNote
}: CinematicHeroProps) {
  const suggestedTopics = [
    "Data Structures",
    "Algorithms",
    "Quantum Mechanics",
    "Macroeconomics",
    "Linear Algebra"
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl p-6 sm:p-10 lg:p-12 transition-all">
      {/* Cinematic Ambient Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />

      {/* Grid Pattern Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Column: Heading & Value Proposition */}
        <div className="flex-1 text-center lg:text-left space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px] font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Curated Academic Vault • {notesCount} Community Notes</span>
          </div>

          {/* Cinematic Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white leading-tight italic">
            Unlock Collective <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 not-italic font-sans font-extrabold">
              Academic Intelligence
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 font-sans leading-relaxed">
            High-yield lecture syntheses, verified revision frameworks, and syllabus blueprints.
            Query concepts in natural language or study alongside an interactive AI Tutor.
          </p>

          {/* Central Interactive Search Bar */}
          <div className="relative w-full max-w-xl focus-within:scale-[1.01] transition-transform duration-200">
            <label htmlFor="cinematic-search-input" className="sr-only">
              {UI_LABELS.actions.search}
            </label>
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              id="cinematic-search-input"
              type="search"
              placeholder="Search by topic, course code, author, or keyword..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  onAskAIWithQuery();
                }
              }}
              className="w-full pl-12 pr-32 py-3.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 shadow-inner transition-all"
            />
            <div className="absolute right-2 inset-y-0 flex items-center">
              <button
                type="button"
                onClick={onAskAIWithQuery}
                className="h-9 px-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-md shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400"
                title="Query AI Tutor with search term"
                aria-label="Query AI Tutor with search term"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Tutor</span>
              </button>
            </div>
          </div>

          {/* Quick topic suggestion tags */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Trending:
            </span>
            {suggestedTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => onSearchChange(topic)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Featured Spotlight Note */}
        {featuredNote ? (
          <div className="w-full lg:w-[380px] shrink-0 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl relative group transition-all duration-300">
            {/* Top Spotlight Tag */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span>Spotlight Note</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {featuredNote.likes || 0} Likes
              </span>
            </div>

            {/* Note Title */}
            <h3 className="font-serif italic font-bold text-lg text-white mb-2 line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
              {featuredNote.title}
            </h3>

            {/* Subject info */}
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono text-[11px]">
                {featuredNote.subjectCode || "GEN-ACAD"}
              </span>
              <span className="truncate">{featuredNote.subjectName}</span>
            </div>

            {/* Snippet preview */}
            <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed font-sans">
              {(featuredNote.content || "Attached study resource. Open to review full material.")
                .replace(/[#*$\-`]/g, " ")
                .replace(/\s+/g, " ")
                .trim()}
            </p>

            {/* Author */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300 truncate max-w-[180px]">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-slate-400" />
                </div>
                <span className="truncate text-[11px] font-medium">
                  {featuredNote.uploaderName || "Scholar"}
                </span>
              </div>

              {/* Read button */}
              {onReadNote && (
                <button
                  type="button"
                  onClick={() => onReadNote(featuredNote)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <span>Read Now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Fallback action card if notes are loading or empty */
          <div className="w-full lg:w-[340px] shrink-0 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Share Your Study Notes</h3>
              <p className="text-xs text-slate-400">
                Help classmates excel. Upload lecture notes, exam guides, or summaries.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={onOpenUpload}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Upload Study Material</span>
              </button>
              <button
                type="button"
                onClick={onOpenAITutor}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Open AI Tutor</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
