import React from "react";
import { Globe, Layers, BookOpen, Terminal, CheckCircle2 } from "lucide-react";
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
  notesCount,
  isAdmin
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
      description: "Uses real-time search grounding and global facts to answer current questions accurately.",
      icon: <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      badge: "Global Web"
    },
    {
      id: "notes-expert",
      title: "Library Material Chat",
      description: "Directly queries and synthesizes peer-uploaded community notes for contextual answers.",
      icon: <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
      badge: `${notesCount} Notes`
    },
    {
      id: "exam-prep",
      title: "Exam Textbook Pro",
      description: "Generates structured exam-ready answers: definitions, step-by-step mechanics, and examples.",
      icon: <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      badge: "Structured"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Mode selection card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="font-serif italic font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
          AI Knowledge Mode
        </h3>

        <div className="space-y-2">
          {modes.map((mode) => {
            const isSelected = currentMode === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
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
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
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

      {/* System Status / Maintenance card */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-slate-200 p-4 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
              AI Context Daemon
            </span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>READY</span>
          </span>
        </div>

        <div className="font-mono text-[10px] space-y-1.5 text-slate-400">
          <div className="flex justify-between">
            <span>Model:</span>
            <span className="text-slate-200">Gemini 2.5 Flash</span>
          </div>
          <div className="flex justify-between">
            <span>Context:</span>
            <span className="text-slate-200">{notesCount} Notes Indexed</span>
          </div>
          <div className="flex justify-between">
            <span>Grounding:</span>
            <span className="text-emerald-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
