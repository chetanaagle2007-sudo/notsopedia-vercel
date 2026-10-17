import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  BarChart2,
  BrainCircuit,
  Sliders,
  Check,
  RefreshCw
} from "lucide-react";
import { QuizQuestion, QuizAttemptResult } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface InteractiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteId?: string;
  questions: QuizQuestion[];
  isLoading?: boolean;
  error?: string | null;
  onGenerateQuiz?: (difficulty: "easy" | "medium" | "hard", count: number) => void;
  onRetry?: () => void;
}

export function InteractiveQuizModal({
  isOpen,
  onClose,
  noteTitle,
  noteId,
  questions,
  isLoading = false,
  error = null,
  onGenerateQuiz,
  onRetry
}: InteractiveQuizModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showInstantExplanation, setShowInstantExplanation] = useState<boolean>(true);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Reset quiz state when new questions arrive or modal re-opens
  useEffect(() => {
    if (questions && questions.length > 0) {
      setCurrentIndex(0);
      setUserAnswers({});
      setIsSubmitted(false);
      setShowResults(false);
    }
  }, [questions, isOpen]);

  const currentQ = useMemo(() => questions[currentIndex] || null, [questions, currentIndex]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  // Calculate score
  const scoreStats = useMemo(() => {
    let score = 0;
    const incorrectList: QuizAttemptResult["incorrectQuestions"] = [];

    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      if (selected === q.correctIndex) {
        score++;
      } else if (selected !== undefined) {
        incorrectList.push({
          question: q.question,
          selectedOption: q.options[selected] || "Unanswered",
          correctOption: q.options[q.correctIndex] || "",
          explanation: q.explanation
        });
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return { score, percentage, incorrectList };
  }, [questions, userAnswers, totalQuestions]);

  const handleSelectOption = (optionIndex: number) => {
    if (showResults) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinishQuiz = () => {
    setShowResults(true);

    // Save attempt to localStorage
    try {
      const attempt: QuizAttemptResult = {
        id: `attempt-${Date.now()}`,
        noteId,
        noteTitle,
        totalQuestions,
        score: scoreStats.score,
        percentage: scoreStats.percentage,
        answers: userAnswers,
        incorrectQuestions: scoreStats.incorrectList,
        completedAt: new Date().toISOString()
      };

      const existingRaw = localStorage.getItem("notsopedia_quiz_history");
      const history: QuizAttemptResult[] = existingRaw ? JSON.parse(existingRaw) : [];
      history.unshift(attempt);
      // Keep up to 50 attempts
      localStorage.setItem("notsopedia_quiz_history", JSON.stringify(history.slice(0, 50)));
    } catch (err) {
      console.warn("Failed to persist quiz history to localStorage:", err);
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="quiz-modal-title"
                className="font-serif italic font-bold text-base text-slate-900 dark:text-white"
              >
                {UI_LABELS.quiz.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {noteTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close quiz modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 animate-pulse">
                <Sparkles className="h-8 w-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
                  {UI_LABELS.actions.generatingQuiz}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Extracting core principles, formulas, and academic concepts into interactive multiple-choice questions...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex p-3 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
                  Quiz Generation Notice
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {error}
                </p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  Retry Generation
                </button>
              )}
            </div>
          )}

          {/* Configuration View (when no questions loaded yet) */}
          {!isLoading && !error && questions.length === 0 && onGenerateQuiz && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h3 className="font-serif italic font-bold text-lg text-slate-900 dark:text-white">
                  Configure Your Practice Quiz
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Customize your learning assessment to test recall, mechanics, and conceptual depth.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Difficulty selector */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Target Difficulty</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl capitalize transition ${
                          selectedDifficulty === diff
                            ? "bg-indigo-600 text-white shadow-xs font-bold"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question count selector */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Question Count</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[3, 5, 8].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSelectedCount(cnt)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl transition ${
                          selectedCount === cnt
                            ? "bg-emerald-600 text-white shadow-xs font-bold"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => onGenerateQuiz(selectedDifficulty, selectedCount)}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Interactive Quiz</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Quiz View */}
          {!isLoading && !error && questions.length > 0 && !showResults && currentQ && (
            <div className="space-y-6">
              {/* Progress & Indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <div className="flex items-center space-x-2">
                    {currentQ.topic && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {currentQ.topic}
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                      {currentQ.difficulty || "medium"}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIndex) => {
                  const isSelected = userAnswers[currentIndex] === optIndex;
                  const isAnswered = userAnswers[currentIndex] !== undefined;
                  const isCorrect = optIndex === currentQ.correctIndex;

                  let optionStyle = "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200";

                  if (isAnswered && showInstantExplanation) {
                    if (isCorrect) {
                      optionStyle = "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      optionStyle = "border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold";
                    }
                  } else if (isSelected) {
                    optionStyle = "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold";
                  }

                  return (
                    <button
                      key={optIndex}
                      type="button"
                      onClick={() => handleSelectOption(optIndex)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start space-x-3 text-xs sm:text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${optionStyle}`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span className="flex-1">{opt}</span>

                      {isAnswered && showInstantExplanation && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && showInstantExplanation && isSelected && !isCorrect && (
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation Box */}
              {userAnswers[currentIndex] !== undefined && showInstantExplanation && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Explanation & Key Mechanics</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={userAnswers[currentIndex] === undefined}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                >
                  <span>{currentIndex === totalQuestions - 1 ? UI_LABELS.quiz.finishQuiz : UI_LABELS.quiz.nextQuestion}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Results Summary View */}
          {!isLoading && !error && showResults && (
            <div className="space-y-6 py-2">
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-indigo-600 dark:text-indigo-400">
                  <Award className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif italic font-bold text-xl text-slate-900 dark:text-white">
                    {UI_LABELS.quiz.scoreSummary}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {scoreStats.percentage >= 80
                      ? UI_LABELS.quiz.masteryExcellent
                      : scoreStats.percentage >= 50
                      ? UI_LABELS.quiz.masteryGood
                      : UI_LABELS.quiz.masteryReview}
                  </p>
                </div>
              </div>

              {/* Metrics cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold">
                    Score
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {scoreStats.score} / {totalQuestions}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800 text-center">
                  <div className="text-[10px] font-mono uppercase text-indigo-600 dark:text-indigo-400 font-bold">
                    Accuracy
                  </div>
                  <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {scoreStats.percentage}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold">
                    Review Needed
                  </div>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {scoreStats.incorrectList.length}
                  </div>
                </div>
              </div>

              {/* Incorrect questions review section */}
              {scoreStats.incorrectList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    <span>{UI_LABELS.quiz.incorrectReview} ({scoreStats.incorrectList.length})</span>
                  </h4>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {scoreStats.incorrectList.map((item, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2 text-xs"
                      >
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {item.question}
                        </p>
                        <div className="space-y-1 text-[11px]">
                          <p className="text-rose-600 dark:text-rose-400">
                            Your answer: <span className="line-through">{item.selectedOption}</span>
                          </p>
                          <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            Correct answer: {item.correctOption}
                          </p>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-rose-100 dark:border-rose-900/30">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{UI_LABELS.quiz.retake}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
