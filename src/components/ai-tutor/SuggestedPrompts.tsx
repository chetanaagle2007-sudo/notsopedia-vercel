import React from "react";
import { Sparkles } from "lucide-react";
import { AIMode } from "../../types";

interface SuggestedPromptsProps {
  mode: AIMode;
  onSelectPrompt: (prompt: string) => void;
}

export function SuggestedPrompts({ mode, onSelectPrompt }: SuggestedPromptsProps) {
  const promptsByMode: Record<AIMode, string[]> = {
    "news-gk": [
      "What are the latest breakthroughs in quantum computing?",
      "Explain the recent discoveries from the James Webb telescope.",
      "How is generative AI impacting software engineering today?"
    ],
    "notes-expert": [
      "Summarize the BFS vs DFS graph traversal algorithms.",
      "What is the Schrödinger equation and wave function normalisation?",
      "Compare fiscal policy vs monetary policy tools."
    ],
    "exam-prep": [
      "Draft a 10-mark exam answer on Binary Search Tree balancing.",
      "Give a textbook definition of time-independent Schrödinger wave equation.",
      "Explain the components of Gross Domestic Product (GDP)."
    ]
  };

  const currentPrompts = promptsByMode[mode] || promptsByMode["news-gk"];

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1">
      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-indigo-500" />
        <span>Try asking:</span>
      </span>
      {currentPrompts.map((p, idx) => (
        <button
          key={idx}
          onClick={() => onSelectPrompt(p)}
          className="text-[11px] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 transition truncate max-w-xs text-left"
          title={p}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
