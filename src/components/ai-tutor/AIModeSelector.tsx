import React from "react";
import { Globe, Layers, BookOpen, Lightbulb, Compass, BrainCircuit, Calendar, FileText, HelpCircle } from "lucide-react";
import { AIMode } from "../../types";

interface AIModeSelectorProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  notesCount: number;
  isAdmin: boolean;
}

export function AIModeSelector({
  currentMode,
  onSelectMode,
  notesCount
}: AIModeSelectorProps) {
  const modes: Array<{
    id: AIMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    badge: string;
  }> = [
    {
      id: "news-gk",
      title: "Live Web Grounding",
      description: "Uses verified online academic sources to explain current concepts, scientific news, and facts.",
      icon: <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      badge: "Web Grounded"
    },
    {
      id: "notes-expert",
      title: "Library Notes Chat",
      description: "Directly queries and synthesizes peer-uploaded study notes in your library.",
      icon: <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
      badge: `${notesCount} Notes`
    },
    {
      id: "exam-prep",
      title: "Exam Textbook Pro",
      description: "Generates structured exam-ready outlines with definitions, step-by-step mechanics, and examples.",
      icon: <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      badge: "Structured"
    },
    {
      id: "concept-explainer",
      title: "Concept Explainer",
      description: "Breaks down hard concepts using intuitive analogies, mental models, and step-by-step intuition.",
      icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
      badge: "Intuitive"
    },
    {
      id: "revision-planner",
      title: "Revision Roadmap",
      description: "Creates prioritized study timelines, core milestone checklists, and active recall cues.",
      icon: <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
      badge: "Roadmap"
    },
    {
      id: "summary",
      title: "High-Yield Summary",
      description: "Executive study overview with key principles, formulas, and cheatsheet takeaways.",
      icon: <FileText className="h-4 w-4 text-rose-500" />,
      badge: "Cheatsheet"
    },
    {
      id: "mcq-generator",
      title: "Practice Question AI",
      description: "Generates multiple-choice practice questions with full answer keys and rationales.",
      icon: <HelpCircle className="h-4 w-4 text-indigo-500" />,
      badge: "Practice"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Mode selection card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-serif italic font-bold text-sm text-slate-900 dark:text-white">
            Study Mode
          </h3>
        </div>

        <div className="space-y-2">
          {modes.map((mode) => {
            const isSelected = currentMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectMode(mode.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 shadow-xs"
                    : "border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {mode.icon}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {mode.title}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {mode.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Helpful Study Guide Tips card (replaces developer daemon info) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl shadow-xs space-y-2.5">
        <div className="flex items-center space-x-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="font-serif italic text-xs font-bold text-slate-900 dark:text-white">
            Study Assistant Tips
          </span>
        </div>

        <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
            <span>Ask for chapter summaries or practice quiz questions.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
            <span>Switch to <strong>Exam Prep</strong> for high-yield marking schemes.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
            <span>Cite specific topics from the library for tailored synthesis.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
