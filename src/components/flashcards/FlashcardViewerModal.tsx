import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Check,
  Bookmark
} from "lucide-react";
import { Flashcard } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface FlashcardViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  flashcards: Flashcard[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function FlashcardViewerModal({
  isOpen,
  onClose,
  noteTitle,
  flashcards,
  isLoading = false,
  error = null,
  onRetry
}: FlashcardViewerModalProps) {
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<Record<string, "known" | "review">>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Sync deck when flashcards prop updates
  useEffect(() => {
    if (flashcards && flashcards.length > 0) {
      setDeck(flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setAssessment({});
      setIsCompleted(false);
    }
  }, [flashcards]);

  const currentCard = useMemo(() => deck[currentIndex] || null, [deck, currentIndex]);

  const totalCards = deck.length;
  const progressPercent = totalCards > 0 ? Math.round(((currentIndex + 1) / totalCards) * 100) : 0;

  // Stats calculation
  const stats = useMemo(() => {
    let knownCount = 0;
    let reviewCount = 0;
    for (const card of deck) {
      const status = assessment[card.id];
      if (status === "known") knownCount++;
      if (status === "review") reviewCount++;
    }
    const unassessedCount = Math.max(0, deck.length - (knownCount + reviewCount));
    const masteryRate = deck.length > 0 ? Math.round((knownCount / deck.length) * 100) : 0;
    return { knownCount, reviewCount, unassessedCount, masteryRate };
  }, [deck, assessment]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, deck.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = useCallback(() => {
    setDeck((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, []);

  const handleRestart = useCallback(() => {
    setDeck(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setAssessment({});
    setIsCompleted(false);
  }, [flashcards]);

  const handleStudyWeakOnly = useCallback(() => {
    const weakCards = deck.filter((c) => assessment[c.id] === "review");
    if (weakCards.length > 0) {
      setDeck(weakCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
    }
  }, [deck, assessment]);

  const handleMarkAssessment = useCallback(
    (type: "known" | "review") => {
      if (!currentCard) return;
      setAssessment((prev) => ({
        ...prev,
        [currentCard.id]: type
      }));

      // Smooth advance to next card after marking
      if (currentIndex < deck.length - 1) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
    },
    [currentCard, currentIndex, deck.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === "r" || e.key === "1") {
        e.preventDefault();
        handleMarkAssessment("review");
      } else if (e.key.toLowerCase() === "k" || e.key === "2") {
        e.preventDefault();
        handleMarkAssessment("known");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleFlip, handleNext, handlePrev, handleMarkAssessment]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`${UI_LABELS.flashcards.title}: ${noteTitle}`}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col min-h-[540px] max-h-[92vh] overflow-hidden transition-all">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
                  {UI_LABELS.flashcards.title}
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  AI Grounded
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate block max-w-md">
                From: {noteTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {deck.length > 0 && !isCompleted && !isLoading && !error && (
              <>
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  title={UI_LABELS.flashcards.shuffle}
                  aria-label={UI_LABELS.flashcards.shuffle}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  title={UI_LABELS.flashcards.restart}
                  aria-label={UI_LABELS.flashcards.restart}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Restart</span>
                </button>
              </>
            )}

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

        {/* Progress Bar (Visible during study mode) */}
        {!isLoading && !error && deck.length > 0 && !isCompleted && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 shrink-0 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center items-center overflow-y-auto">
          {/* STATE 1: Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <RotateCw className="h-6 w-6 text-emerald-500 animate-spin absolute -top-2 -right-2" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  Generating Study Flashcards
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesizing key formulas, core concepts, and definitions strictly from this note...
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  Flashcard Generation Failed
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Try Again</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: Empty */}
          {!isLoading && !error && deck.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  No Flashcards Available
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This note does not contain enough text content to create interactive study cards.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold transition"
              >
                Back to Document
              </button>
            </div>
          )}

          {/* STATE 4: Completion Summary */}
          {!isLoading && !error && isCompleted && (
            <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 py-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-serif italic font-bold text-slate-900 dark:text-white">
                  {UI_LABELS.flashcards.summaryTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You reviewed all {deck.length} flashcards for this study session.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 font-mono text-center">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Mastered</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.knownCount}
                  </span>
                </div>
                <div className="space-y-1 border-x border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Review</span>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.reviewCount}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Score</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {stats.masteryRate}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                {stats.reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={handleStudyWeakOnly}
                    className="h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{UI_LABELS.flashcards.reviewWeakOnly} ({stats.reviewCount})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRestart}
                  className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{UI_LABELS.flashcards.studyAgain}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                >
                  Back to Note
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: Active Flashcard Study */}
          {!isLoading && !error && deck.length > 0 && !isCompleted && currentCard && (
            <div className="w-full flex flex-col items-center space-y-6">
              {/* Card Meta Indicator */}
              <div className="w-full flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Bookmark className="h-3.5 w-3.5 text-emerald-500" />
                  {currentCard.topic || "Core Concept"}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  Card {currentIndex + 1} of {totalCards}
                </span>
              </div>

              {/* The Interactive Flippable Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleFlip}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleFlip();
                  }
                }}
                aria-label={`Flashcard ${currentIndex + 1}. Showing ${isFlipped ? "answer" : "question"}. Click or press space to flip.`}
                className={`w-full min-h-[260px] md:min-h-[290px] p-8 md:p-10 rounded-3xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between shadow-lg relative group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isFlipped
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-400"
                    : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {/* Side Tag Pill */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md ${
                      isFlipped
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isFlipped ? "Answer" : "Question"}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <RotateCw className="h-3 w-3" />
                    <span>Flip</span>
                  </span>
                </div>

                {/* Main Content Area */}
                <div className="py-6 flex items-center justify-center text-center">
                  <p
                    className={`leading-relaxed transition-all ${
                      isFlipped
                        ? "text-lg md:text-xl font-sans text-slate-900 dark:text-white"
                        : "text-xl md:text-2xl font-serif italic font-bold text-slate-900 dark:text-white"
                    }`}
                  >
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                </div>

                {/* Bottom Instruction */}
                <div className="text-center text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  {UI_LABELS.flashcards.flipPrompt}
                </div>
              </div>

              {/* Assessment & Study Action Controls */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                {/* Navigation Buttons */}
                <div className="flex items-center space-x-2 order-2 sm:order-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                    title="Previous Card (← Arrow)"
                    aria-label="Previous Card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                    title={currentIndex === deck.length - 1 ? "Finish Deck" : "Next Card (→ Arrow)"}
                    aria-label="Next Card"
                  >
                    <span>{currentIndex === deck.length - 1 ? "Finish" : "Next"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Self Assessment Pills (Need Review / Know It) */}
                <div className="flex items-center space-x-2.5 order-1 sm:order-2 w-full sm:w-auto justify-center">
                  <button
                    type="button"
                    onClick={() => handleMarkAssessment("review")}
                    className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      assessment[currentCard.id] === "review"
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800/80"
                    }`}
                    title="Mark as needing review (Key: 1 or R)"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{UI_LABELS.flashcards.needReview}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkAssessment("known")}
                    className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      assessment[currentCard.id] === "known"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/80"
                    }`}
                    title="Mark as mastered (Key: 2 or K)"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{UI_LABELS.flashcards.knowIt}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Keyboard shortcuts guide) */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0 gap-2">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Space</kbd> Flip</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">← / →</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">1</kbd> Review</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">2</kbd> Mastered</span>
          </div>
          <span>Study Mode • Notsopedia AI</span>
        </div>
      </div>
    </div>
  );
}
