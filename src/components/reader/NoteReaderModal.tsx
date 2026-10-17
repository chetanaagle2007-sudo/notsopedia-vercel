import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Download,
  X,
  FileText,
  ExternalLink,
  Calendar,
  User,
  Tag,
  Sparkles,
  RotateCw,
  BrainCircuit
} from "lucide-react";
import { UserNote, Flashcard, QuizQuestion } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";
import { UI_LABELS } from "../../constants/labels";
import { FlashcardViewerModal } from "../flashcards/FlashcardViewerModal";
import { InteractiveQuizModal } from "../quiz/InteractiveQuizModal";
import { supabase } from "../../supabase";

interface NoteReaderModalProps {
  note: UserNote | null;
  onClose: () => void;
  onDownloadMarkdown: (note: UserNote) => void;
  onOpenAuth?: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function NoteReaderModal({
  note,
  onClose,
  onDownloadMarkdown,
  onOpenAuth,
  showToast
}: NoteReaderModalProps) {
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [showFlashcards, setShowFlashcards] = useState<boolean>(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState<boolean>(false);
  const [flashcardDeck, setFlashcardDeck] = useState<Flashcard[]>([]);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [deckCache, setDeckCache] = useState<Record<string, Flashcard[]>>({});

  // Interactive Quiz State
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizCache, setQuizCache] = useState<Record<string, QuizQuestion[]>>({});

  const handleGenerateQuiz = async (difficulty: "easy" | "medium" | "hard" = "medium", count: number = 5) => {
    if (!note) return;
    if (isGeneratingQuiz) return;

    setShowQuiz(true);

    const cacheKey = `${note.id}-${difficulty}-${count}`;
    if (quizCache[cacheKey] && quizCache[cacheKey].length > 0) {
      setQuizQuestions(quizCache[cacheKey]);
      setQuizError(null);
      return;
    }

    if (!note.content || note.content.trim().length < 40) {
      setQuizError("This note contains insufficient text (minimum 40 characters required) to generate quiz questions.");
      return;
    }

    setIsGeneratingQuiz(true);
    setQuizError(null);

    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setQuizError("You must be signed in to generate practice quizzes. Please sign in to continue.");
        if (showToast) {
          showToast("Please sign in to take interactive quizzes.", "info");
        }
        if (onOpenAuth) {
          onOpenAuth();
        }
        return;
      }

      const res = await fetch(`/api/notes/${encodeURIComponent(note.id)}/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ difficulty, questionCount: count })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study quiz.");
      }

      const questions: QuizQuestion[] = Array.isArray(data.quiz) ? data.quiz : [];
      if (questions.length === 0) {
        throw new Error("No quiz questions could be generated from this note.");
      }

      setQuizQuestions(questions);
      setQuizCache((prev) => ({ ...prev, [cacheKey]: questions }));
    } catch (err: any) {
      setQuizError(err.message || "Failed to generate study quiz. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!note) return;
    if (isGeneratingFlashcards) return;

    setShowFlashcards(true);

    if (deckCache[note.id] && deckCache[note.id].length > 0) {
      setFlashcardDeck(deckCache[note.id]);
      setFlashcardError(null);
      return;
    }

    if (!note.content || note.content.trim().length < 40) {
      setFlashcardError("This note contains insufficient text (minimum 40 characters required) to generate flashcards.");
      return;
    }

    setIsGeneratingFlashcards(true);
    setFlashcardError(null);

    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setFlashcardError("You must be signed in to generate AI study flashcards. Please sign in to continue.");
        if (showToast) {
          showToast("Please sign in to generate AI flashcards.", "info");
        }
        if (onOpenAuth) {
          onOpenAuth();
        }
        return;
      }

      const res = await fetch(`/api/notes/${encodeURIComponent(note.id)}/flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study flashcards.");
      }

      const cards: Flashcard[] = Array.isArray(data.flashcards) ? data.flashcards : [];
      if (cards.length === 0) {
        throw new Error("No flashcards could be generated from this note.");
      }

      setFlashcardDeck(cards);
      setDeckCache((prev) => ({ ...prev, [note.id]: cards }));
    } catch (err: any) {
      setFlashcardError(err.message || "Failed to generate study flashcards. Please try again.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (note) {
      window.addEventListener("keydown", handleKeyDown);
      try {
        localStorage.setItem("notsopedia_last_read_note_id", note.id);
      } catch {
        // ignore localStorage errors
      }
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [note, onClose]);

  if (!note) return null;

  const formattedDate = note.uploadedAt
    ? new Date(note.uploadedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Recent";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`${UI_LABELS.reader.title}: ${note.title}`}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
                {UI_LABELS.reader.title}
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 ml-2">
                • {note.subjectCode || "GEN-ACAD"}
              </span>
            </div>
          </div>

          {/* Controls: Font Size, Download MD, Close */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Font scaling pills */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 text-xs font-mono" role="group" aria-label="Text sizing">
              <button
                type="button"
                onClick={() => setFontSize("normal")}
                aria-pressed={fontSize === "normal"}
                aria-label="Standard font size"
                className={`h-7 px-2.5 rounded-lg transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  fontSize === "normal"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Standard font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("large")}
                aria-pressed={fontSize === "large"}
                aria-label="Large font size"
                className={`h-7 px-2.5 rounded-lg transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  fontSize === "large"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Large font size"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize("xlarge")}
                aria-pressed={fontSize === "xlarge"}
                aria-label="Extra large font size"
                className={`h-7 px-2.5 rounded-lg transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  fontSize === "xlarge"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Extra large font size"
              >
                A++
              </button>
            </div>

            {/* Take Interactive Quiz button */}
            <button
              type="button"
              onClick={() => handleGenerateQuiz()}
              disabled={isGeneratingQuiz}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={UI_LABELS.actions.startQuiz}
              aria-label={UI_LABELS.actions.startQuiz}
            >
              {isGeneratingQuiz ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Generating Quiz...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-3.5 w-3.5 text-indigo-200" />
                  <span className="hidden sm:inline">Practice Quiz</span>
                  <span className="sm:hidden">Quiz</span>
                </>
              )}
            </button>

            {/* Generate Flashcards button */}
            <button
              type="button"
              onClick={handleGenerateFlashcards}
              disabled={isGeneratingFlashcards}
              className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={UI_LABELS.actions.generateFlashcards}
              aria-label={UI_LABELS.actions.generateFlashcards}
            >
              {isGeneratingFlashcards ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="hidden sm:inline">Flashcards</span>
                  <span className="sm:hidden">Cards</span>
                </>
              )}
            </button>

            {/* Markdown download button */}
            <button
              type="button"
              onClick={() => onDownloadMarkdown(note)}
              className="h-8 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={UI_LABELS.actions.downloadMarkdown}
              aria-label={UI_LABELS.actions.downloadMarkdown}
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{UI_LABELS.actions.downloadMarkdown}</span>
              <span className="sm:hidden">Markdown</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={UI_LABELS.actions.close}
              aria-label={UI_LABELS.actions.close}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Content */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 space-y-6">
          {/* Header Metadata */}
          <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                {note.subjectName} ({note.subjectCode || "GEN-ACAD"})
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif italic font-bold text-slate-900 dark:text-white leading-tight">
              {note.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  By <strong className="text-slate-800 dark:text-slate-200">{note.uploaderName}</strong> ({note.uploaderRole})
                </span>
              </div>
              {note.topicName && (
                <span>
                  • Topic: <strong className="text-slate-700 dark:text-slate-300">{note.topicName}</strong>
                </span>
              )}
            </div>

            {/* Tags */}
            {Array.isArray(note.tags) && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {note.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attached Document Card (if file was attached) */}
          {note.fileName && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3 truncate">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white truncate block" title={note.fileName}>
                    {note.fileName}
                  </span>
                  {note.fileSize ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      Attached Document • {(note.fileSize / 1024).toFixed(1)} KB
                    </span>
                  ) : null}
                </div>
              </div>

              {note.fileUrl && (
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 shrink-0 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{UI_LABELS.actions.openAttachment}</span>
                </a>
              )}
            </div>
          )}

          {/* Rendered Note Content */}
          <div className="prose max-w-none text-slate-800 dark:text-slate-200">
            {note.content ? (
              <MarkdownRenderer content={note.content} fontSize={fontSize} />
            ) : (
              <p className="text-sm italic text-slate-400 dark:text-slate-500">
                No text summary provided. Please open the attached academic file above to study.
              </p>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
          <span>Document Reference: {note.subjectCode || "GEN"} • {note.id.slice(0, 8)}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_LABELS.actions.close}
            className="h-8 px-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {UI_LABELS.actions.close}
          </button>
        </div>
      </div>

      {/* Interactive Flashcard Study Modal */}
      <FlashcardViewerModal
        isOpen={showFlashcards}
        onClose={() => setShowFlashcards(false)}
        noteTitle={note.title}
        flashcards={flashcardDeck}
        isLoading={isGeneratingFlashcards}
        error={flashcardError}
        onRetry={handleGenerateFlashcards}
      />

      {/* Interactive Quiz Assessment Modal */}
      <InteractiveQuizModal
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        noteTitle={note.title}
        noteId={note.id}
        questions={quizQuestions}
        isLoading={isGeneratingQuiz}
        error={quizError}
        onGenerateQuiz={(difficulty, count) => handleGenerateQuiz(difficulty, count)}
        onRetry={() => handleGenerateQuiz()}
      />
    </div>
  );
}
