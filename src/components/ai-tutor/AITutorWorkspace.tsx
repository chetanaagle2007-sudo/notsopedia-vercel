import React, { useRef, useEffect } from "react";
import { Sparkles, Send, RefreshCw, Layers, Globe, BookOpen } from "lucide-react";
import { AIMode, AIChatMessage as AIChatMessageType } from "../../types";
import { AIModeSelector } from "./AIModeSelector";
import { AIChatMessage } from "./AIChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";

interface AITutorWorkspaceProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  chatHistory: AIChatMessageType[];
  isResponding: boolean;
  question: string;
  onQuestionChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  notesCount: number;
  isAdmin: boolean;
}

export function AITutorWorkspace({
  currentMode,
  onSelectMode,
  chatHistory,
  isResponding,
  question,
  onQuestionChange,
  onSubmit,
  notesCount,
  isAdmin
}: AITutorWorkspaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when chat messages change or while AI is responding
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isResponding]);

  const modeHeaders: Record<AIMode, { title: string; icon: React.ReactNode; color: string }> = {
    "news-gk": {
      title: "Live Web Grounding Mode",
      icon: <Globe className="h-4 w-4 text-emerald-500" />,
      color: "border-emerald-500"
    },
    "notes-expert": {
      title: "Peer Library Context Mode",
      icon: <Layers className="h-4 w-4 text-indigo-500" />,
      color: "border-indigo-500"
    },
    "exam-prep": {
      title: "Exam Textbook Pro Mode",
      icon: <BookOpen className="h-4 w-4 text-amber-500" />,
      color: "border-amber-500"
    }
  };

  const currentModeInfo = modeHeaders[currentMode];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Sidebar: Mode selection */}
      <div className="lg:col-span-1">
        <AIModeSelector
          currentMode={currentMode}
          onSelectMode={onSelectMode}
          notesCount={notesCount}
          isAdmin={isAdmin}
        />
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between overflow-hidden min-h-[600px] max-h-[750px] transition-colors">
        {/* Chat Header */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2 font-semibold text-slate-800 dark:text-slate-200">
            {currentModeInfo.icon}
            <span>{currentModeInfo.title}</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GEMINI 2.5 FLASH</span>
          </div>
        </div>

        {/* Chat Stream */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          {chatHistory.map((msg, idx) => (
            <AIChatMessage key={idx} message={msg} />
          ))}

          {isResponding && (
            <div className="flex flex-col items-start max-w-[85%] space-y-1">
              <span className="text-[11px] text-slate-400 font-mono px-1">Notsopedia AI</span>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl rounded-tl-xs flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Synthesizing answer with verified academic context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Suggestions Footer */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <SuggestedPrompts
            mode={currentMode}
            onSelectPrompt={(p) => {
              onQuestionChange(p);
            }}
          />

          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={
                currentMode === "news-gk"
                  ? "Ask any global or scientific question..."
                  : currentMode === "notes-expert"
                  ? "Ask a question based on your uploaded peer notes..."
                  : "Type an academic concept to draft a complete textbook answer..."
              }
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              disabled={isResponding}
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
            />

            <button
              type="submit"
              disabled={isResponding || !question.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-2xl transition shadow-xs flex items-center space-x-1.5 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
