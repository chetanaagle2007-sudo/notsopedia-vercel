import React, { useRef, useEffect, useState } from "react";
import {
  Send,
  RefreshCw,
  Layers,
  Globe,
  BookOpen,
  Lightbulb,
  Calendar,
  FileText,
  HelpCircle,
  Mic,
  MicOff,
  Square,
  Trash2,
  Sparkles,
  LogIn,
  Languages
} from "lucide-react";
import { AIMode, AIChatMessage as AIChatMessageType } from "../../types";
import { AIModeSelector } from "./AIModeSelector";
import { AIChatMessage } from "./AIChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { UI_LABELS } from "../../constants/labels";

interface AITutorWorkspaceProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  chatHistory: AIChatMessageType[];
  isResponding: boolean;
  question: string;
  onQuestionChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStopGeneration?: () => void;
  onClearChat?: () => void;
  notesCount: number;
  isAdmin: boolean;
  signedInUser?: any;
  onOpenAuthModal?: () => void;
}

export function AITutorWorkspace({
  currentMode,
  onSelectMode,
  chatHistory,
  isResponding,
  question,
  onQuestionChange,
  onSubmit,
  onStopGeneration,
  onClearChat,
  notesCount,
  isAdmin,
  signedInUser,
  onOpenAuthModal
}: AITutorWorkspaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<"en-US" | "hi-IN" | "mr-IN">("en-US");
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

  // Auto-scroll when chat messages change or while AI is responding
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isResponding]);

  // Toggle voice recognition
  const toggleListening = () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        onQuestionChange(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isResponding && question.trim()) {
        onSubmit(e);
      }
    }
  };

  const modeHeaders: Record<AIMode, { title: string; icon: React.ReactNode; color: string }> = {
    "news-gk": {
      title: "Live Web Grounding",
      icon: <Globe className="h-4 w-4 text-emerald-500" />,
      color: "border-emerald-500"
    },
    "notes-expert": {
      title: "Library Notes Chat",
      icon: <Layers className="h-4 w-4 text-indigo-500" />,
      color: "border-indigo-500"
    },
    "exam-prep": {
      title: "Exam Textbook Pro",
      icon: <BookOpen className="h-4 w-4 text-amber-500" />,
      color: "border-amber-500"
    },
    "concept-explainer": {
      title: "Concept Explainer",
      icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
      color: "border-amber-500"
    },
    "revision-planner": {
      title: "Revision Roadmap",
      icon: <Calendar className="h-4 w-4 text-teal-500" />,
      color: "border-teal-500"
    },
    "summary": {
      title: "High-Yield Summary",
      icon: <FileText className="h-4 w-4 text-rose-500" />,
      color: "border-rose-500"
    },
    "mcq-generator": {
      title: "Practice Question AI",
      icon: <HelpCircle className="h-4 w-4 text-indigo-500" />,
      color: "border-indigo-500"
    }
  };

  const quickStarters = [
    {
      title: "Explain Graph Algorithms",
      desc: "Compare Breadth-First vs Depth-First search with time & space complexity",
      prompt: "Explain BFS (Breadth-First Search) vs DFS (Depth-First Search) graph traversal with algorithmic differences and time complexity."
    },
    {
      title: "Quantum Physics",
      desc: "Derive the Time-Independent Schrödinger Equation step-by-step",
      prompt: "Derive the Time-Independent Schrödinger Equation from the wave-particle duality principle with clear mathematical steps."
    },
    {
      title: "Economics & Finance",
      desc: "Analyze Fiscal vs Monetary policy levers during inflation",
      prompt: "Compare Fiscal Policy and Monetary Policy trade-offs when cooling demand-pull inflation."
    },
    {
      title: "Practice Quiz",
      desc: "Generate 5 exam-grade MCQs on Thermodynamics with explanations",
      prompt: "Generate 5 multiple-choice questions on Thermodynamics with answer keys and detailed conceptual explanations."
    }
  ];

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
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between overflow-hidden min-h-[620px] max-h-[780px] transition-colors">
        {/* Chat Header */}
        <div className="px-6 py-3.5 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2 font-semibold text-slate-800 dark:text-slate-200">
            {currentModeInfo.icon}
            <span>{currentModeInfo.title}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {chatHistory.length > 0 && onClearChat && (
              <button
                type="button"
                onClick={onClearChat}
                className="inline-flex items-center space-x-1 text-slate-400 hover:text-rose-500 transition px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                title="Start a fresh conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium hidden sm:inline">New Chat</span>
              </button>
            )}

            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Assistant • Ready</span>
            </div>
          </div>
        </div>

        {/* Unauthenticated Alert Banner */}
        {!signedInUser && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <span className="font-medium">
              You are currently browsing as a guest. Sign in to ask questions and save your AI conversations.
            </span>
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition"
              >
                <LogIn className="h-3 w-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        )}

        {/* Chat Stream */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center py-8 px-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                How can Notsopedia AI help you study today?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                Ask any academic question, paste syllabus topics, or select a suggested starter prompt below to begin.
              </p>

              {/* Quick-starter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
                {quickStarters.map((starter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onQuestionChange(starter.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left transition group shadow-2xs"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1">
                      {starter.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {starter.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => <AIChatMessage key={idx} message={msg} />)
          )}

          {isResponding && (
            <div className="flex flex-col items-start max-w-[85%] space-y-2">
              <span className="text-[11px] text-slate-400 font-mono px-1">Notsopedia AI</span>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl rounded-tl-xs flex items-center justify-between w-full space-x-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2.5">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>Synthesizing answer with verified academic context...</span>
                </div>
                {onStopGeneration && (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-medium transition"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Suggestions Footer */}
        <div className="p-4 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <SuggestedPrompts
            mode={currentMode}
            onSelectPrompt={(p) => {
              onQuestionChange(p);
              textareaRef.current?.focus();
            }}
          />

          {/* Multiline Prompt Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isResponding && question.trim()) {
                onSubmit(e);
              }
            }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition"
          >
            {isListening && (
              <div className="px-3 py-1 mb-1.5 flex items-center justify-between text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg animate-pulse">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-semibold">Listening in {speechLanguage}... Speak now</span>
                </div>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="underline text-[11px] font-medium"
                >
                  Done
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              id="ai-tutor-question-input"
              rows={1}
              aria-label="Ask AI Tutor a question"
              placeholder={
                currentMode === "news-gk"
                  ? "Ask any global concept or scientific question... (Press Enter to send, Shift+Enter for new line)"
                  : currentMode === "notes-expert"
                  ? "Ask a question based on your uploaded peer notes... (Press Enter to send)"
                  : "Type an academic concept to draft a complete textbook answer... (Press Enter to send)"
              }
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isResponding}
              className="w-full px-3 py-2 bg-transparent text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none max-h-44 min-h-[44px]"
            />

            {/* Bottom Actions Row inside Composer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 px-1 text-xs">
              {/* Left: Language Selector & Speech Mic */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-slate-400">
                  <Languages className="h-3.5 w-3.5" />
                  <select
                    value={speechLanguage}
                    onChange={(e) => setSpeechLanguage(e.target.value as any)}
                    className="bg-transparent text-[11px] text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
                    title="Select voice input language"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">Hindi (हिन्दी)</option>
                    <option value="mr-IN">Marathi (मराठी)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title={
                    speechSupported
                      ? isListening
                        ? "Stop listening"
                        : "Speak with voice recognition"
                      : "Speech recognition not supported in this browser"
                  }
                  aria-label={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>

              {/* Right: Submit or Stop button */}
              <div className="flex items-center space-x-2">
                {isResponding ? (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="h-8 px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center space-x-1"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!question.trim()}
                    aria-label={UI_LABELS.actions.send}
                    className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{UI_LABELS.actions.send}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
