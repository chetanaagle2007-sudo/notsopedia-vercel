import React, { useMemo } from "react";
import {
  BookOpen,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Plus,
  BrainCircuit,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  FolderPlus
} from "lucide-react";
import { UserNote, QuizAttemptResult, SignedInUser } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface StudentDashboardProps {
  userNotes: UserNote[];
  likedNoteIds: Set<string>;
  signedInUser: SignedInUser | null;
  onReadNote: (note: UserNote) => void;
  onOpenUpload: () => void;
  onOpenAITutor: () => void;
  onOpenQuizForNote: (note: UserNote) => void;
  onOpenFlashcardsForNote: (note: UserNote) => void;
  onOpenCollections: () => void;
  onNavigateToExplorer: () => void;
  onOpenAIWorkspace?: (note?: UserNote) => void;
}

export function StudentDashboard({
  userNotes,
  likedNoteIds,
  signedInUser,
  onReadNote,
  onOpenUpload,
  onOpenAITutor,
  onOpenQuizForNote,
  onOpenFlashcardsForNote,
  onOpenCollections,
  onNavigateToExplorer,
  onOpenAIWorkspace
}: StudentDashboardProps) {
  // Load real quiz history from localStorage
  const quizHistory: QuizAttemptResult[] = useMemo(() => {
    try {
      const raw = localStorage.getItem("notsopedia_quiz_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  // Load last read note
  const lastReadNote: UserNote | null = useMemo(() => {
    try {
      const lastId = localStorage.getItem("notsopedia_last_read_note_id");
      if (!lastId) return userNotes[0] || null;
      return userNotes.find((n) => n.id === lastId) || userNotes[0] || null;
    } catch {
      return userNotes[0] || null;
    }
  }, [userNotes]);

  // Saved library notes
  const savedNotes = useMemo(() => {
    return userNotes.filter((n) => likedNoteIds.has(n.id));
  }, [userNotes, likedNoteIds]);

  // Aggregate real study metrics
  const totalQuizzesTaken = quizHistory.length;
  const avgAccuracy = useMemo(() => {
    if (totalQuizzesTaken === 0) return 0;
    const sum = quizHistory.reduce((acc, q) => acc + (q.percentage || 0), 0);
    return Math.round(sum / totalQuizzesTaken);
  }, [quizHistory, totalQuizzesTaken]);

  // Revision recommendations based on real incorrect answers or recently saved notes
  const revisionNotes = useMemo(() => {
    const attemptedNoteIds = new Set(quizHistory.map((q) => q.noteId).filter(Boolean));
    const prioritized = userNotes.filter((n) => attemptedNoteIds.has(n.id) || likedNoteIds.has(n.id));
    return prioritized.slice(0, 4);
  }, [userNotes, quizHistory, likedNoteIds]);

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 border border-indigo-950 text-white overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Student Command Center</span>
          </div>

          <h1 className="font-serif italic font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Welcome back{signedInUser ? `, ${signedInUser.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your personalized learning hub. Review recent lecture notes, practice with AI quizzes, and manage your academic study collections.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Note</span>
            </button>

            <button
              type="button"
              onClick={onOpenAITutor}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI Tutor</span>
            </button>

            {onOpenAIWorkspace && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAIWorkspace(lastReadNote || undefined)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem("mind_ai_active_tool", "study_planner");
                    } catch {}
                    onOpenAIWorkspace(lastReadNote || undefined);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Study Planner</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onOpenCollections}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition border border-slate-700"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Study Collections</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Study Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Library Notes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Available Vault</span>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {userNotes.length}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Community peer notes
          </p>
        </div>

        {/* Metric 2: Saved Library */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Saved Notes</span>
            <Bookmark className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {likedNoteIds.size}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Bookmarked in your library
          </p>
        </div>

        {/* Metric 3: Quizzes Completed */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Quizzes Taken</span>
            <BrainCircuit className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalQuizzesTaken}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Total practice assessments
          </p>
        </div>

        {/* Metric 4: Quiz Accuracy */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Avg Accuracy</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalQuizzesTaken > 0 ? `${avgAccuracy}%` : "—"}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {totalQuizzesTaken > 0 ? "Cumulative recall score" : "Take a quiz to see metrics"}
          </p>
        </div>
      </div>

      {/* Continue Learning & Revision Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Continue Learning & Revision */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning Card */}
          {lastReadNote && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span className="font-serif italic font-bold text-sm text-slate-900 dark:text-white">
                    Continue Learning
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {lastReadNote.subjectName}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {lastReadNote.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {lastReadNote.content.replace(/[#*`_]/g, "").slice(0, 180)}...
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onReadNote(lastReadNote)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-xs"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Resume Reading</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenQuizForNote(lastReadNote)}
                  className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span>Take Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenFlashcardsForNote(lastReadNote)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Flashcards</span>
                </button>
              </div>
            </div>
          )}

          {/* Recommended Revision Suggestions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-indigo-500" />
                <span className="font-serif italic font-bold text-sm text-slate-900 dark:text-white">
                  Targeted Revision Recommendations
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateToExplorer}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>Browse All</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {revisionNotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Save notes or take practice quizzes to generate targeted revision cues.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {revisionNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between space-y-2 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {note.subjectName}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                        {note.title}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenQuizForNote(note)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold transition"
                      >
                        Quiz
                      </button>
                      <button
                        type="button"
                        onClick={() => onReadNote(note)}
                        className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold transition"
                      >
                        Read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Activity & Saved Quick List */}
        <div className="space-y-6">
          {/* Recent Quiz Activity */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="font-serif italic font-bold text-sm text-slate-900 dark:text-white">
                Recent Quiz Attempts
              </span>
            </div>

            {quizHistory.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <BrainCircuit className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  No quiz attempts recorded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {quizHistory.slice(0, 4).map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {att.noteTitle || "Practice Quiz"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(att.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                        att.percentage >= 70
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      }`}>
                        {att.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Saved Library Snapshot */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bookmark className="h-4 w-4 text-rose-500" />
                <span className="font-serif italic font-bold text-sm text-slate-900 dark:text-white">
                  My Saved Notes ({savedNotes.length})
                </span>
              </div>
            </div>

            {savedNotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Click the bookmark icon on any note in the catalog to save it here.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedNotes.slice(0, 5).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onReadNote(note)}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {note.title}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
