import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Presentation,
  Code2,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Terminal,
  ChevronRight,
  RefreshCw,
  FolderArchive,
  Layers,
  FileText
} from "lucide-react";
import { UserNote } from "../../types";

export interface AIWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNote?: UserNote | null;
  userNotes?: UserNote[];
  authToken?: string | null;
}

export interface UniversalTaskResult {
  task_id: string;
  owner_id: string;
  category: string;
  status: string;
  progress: number;
  artifacts: string[];
  final_response?: string;
  message?: string;
}

export function AIWorkspaceModal({
  isOpen,
  onClose,
  selectedNote,
  userNotes = [],
  authToken
}: AIWorkspaceModalProps) {
  const [activeCategory, setActiveCategory] = useState<"presentation" | "project_build" | "email" | "research">("presentation");
  const [goal, setGoal] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<string>("academic_modern");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [subjectLine, setSubjectLine] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<UniversalTaskResult | null>(null);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"create" | "history">("create");

  // Prepopulate goal when note changes or category changes
  useEffect(() => {
    if (selectedNote) {
      if (activeCategory === "presentation") {
        setGoal(`Create a comprehensive slide presentation on "${selectedNote.title}" covering key principles, formulas, and real-world applications.`);
      } else if (activeCategory === "project_build") {
        setGoal(`Build a modular Python application implementing algorithms and utilities discussed in "${selectedNote.title}".`);
      } else if (activeCategory === "email") {
        setGoal(`Draft a clear, professional study summary email to my study group covering key concepts from "${selectedNote.title}".`);
        setSubjectLine(`Study Summary: ${selectedNote.title}`);
      } else {
        setGoal(`Conduct in-depth research expanding on "${selectedNote.title}" with verified academic references and practice problems.`);
      }
    }
  }, [selectedNote, activeCategory]);

  // Load task history
  const loadHistory = async () => {
    if (!authToken) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/mind-ai/tasks", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTaskHistory(data.tasks || []);
      }
    } catch (err: any) {
      console.warn("Could not load tasks history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeView === "history") {
      loadHistory();
    }
  }, [isOpen, activeView]);

  if (!isOpen) return null;

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError("Please describe the goal or instruction for MIND-AI.");
      return;
    }

    if (!authToken) {
      setError("Please sign in to launch MIND-AI tasks.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parameters: Record<string, any> = {};
    if (activeCategory === "presentation") {
      parameters.theme = selectedTheme;
    } else if (activeCategory === "email") {
      if (recipientEmail) parameters.recipient = recipientEmail;
      if (subjectLine) parameters.subject = subjectLine;
    }

    try {
      const payload: any = {
        goal: goal.trim(),
        category: activeCategory,
        parameters
      };

      if (selectedNote?.id) {
        payload.noteIds = [selectedNote.id];
      }

      const res = await fetch("/api/mind-ai/universal-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to launch autonomous task.");
      }

      setActiveTask(data);
    } catch (err: any) {
      setError(err.message || "Failed to launch task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  MIND-AI Autonomous Workspace
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Universal Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute presentations, self-repairing code projects, and automated emails from your notes.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveView("create")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeView === "create"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                New Task
              </button>
              <button
                type="button"
                onClick={() => setActiveView("history")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeView === "history"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                History
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeView === "history" ? (
            /* Task History View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Your Recent AI Tasks
                </h3>
                <button
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Loading task store history...
                </div>
              ) : taskHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                  No previous tasks found. Submit your first autonomous task!
                </div>
              ) : (
                <div className="space-y-3">
                  {taskHistory.map((t: any) => (
                    <div
                      key={t.task_id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900 dark:text-white text-sm">
                            {t.goal}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              t.status === "completed"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : t.status === "failed"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3">
                          <span>Category: {t.category || "General"}</span>
                          <span>ID: {t.task_id.slice(0, 8)}...</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {t.artifacts && t.artifacts.length > 0 && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {t.artifacts.length} Artifact(s)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Create Task View */
            <div className="space-y-6">
              {/* Category Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Select Task Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("presentation")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col space-y-2 transition-all ${
                      activeCategory === "presentation"
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <Presentation className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="font-semibold text-xs">Presentation Studio</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">16:9 PowerPoint Decks</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory("project_build")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col space-y-2 transition-all ${
                      activeCategory === "project_build"
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="font-semibold text-xs">Autonomous Builder</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Self-Repairing Code</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory("email")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col space-y-2 transition-all ${
                      activeCategory === "email"
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="font-semibold text-xs">Email Assistant</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Gated Study Summaries</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory("research")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col space-y-2 transition-all ${
                      activeCategory === "research"
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="font-semibold text-xs">Deep Research</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Synthesis & References</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Context Note Notice */}
              {selectedNote && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>
                      Context Linked: <strong className="text-slate-900 dark:text-white">{selectedNote.title}</strong>
                    </span>
                  </div>
                  <span className="text-slate-500">{selectedNote.subjectName || "Study Note"}</span>
                </div>
              )}

              {/* Form Controls */}
              <form onSubmit={handleSubmitTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Goal / Natural Language Instruction
                  </label>
                  <textarea
                    rows={3}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Describe what you want MIND-AI to build or research..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Optional category-specific fields */}
                {activeCategory === "presentation" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Slide Design Theme
                    </label>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    >
                      <option value="academic_modern">Academic Modern (Navy & Gold)</option>
                      <option value="executive_slate">Executive Slate (Monochrome)</option>
                      <option value="emerald_matrix">Emerald Matrix (Clean Technical)</option>
                      <option value="vibrant_dawn">Vibrant Dawn (High Contrast)</option>
                    </select>
                  </div>
                )}

                {activeCategory === "email" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Recipient Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="study-group@university.edu"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Subject Line (Optional)
                      </label>
                      <input
                        type="text"
                        value={subjectLine}
                        onChange={(e) => setSubjectLine(e.target.value)}
                        placeholder="Subject..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !goal.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Autonomous Task...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Launch Autonomous Task</span>
                    </>
                  )}
                </button>
              </form>

              {/* Live Task Execution Result Card */}
              {activeTask && (
                <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        Task Executed Successfully
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                      {activeTask.status} ({activeTask.progress}%)
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {activeTask.final_response || activeTask.message}
                  </p>

                  {/* Artifacts list */}
                  {activeTask.artifacts && activeTask.artifacts.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Generated Artifacts:
                      </span>
                      <div className="space-y-1.5">
                        {activeTask.artifacts.map((art, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                              <Download className="w-4 h-4 text-indigo-500" />
                              <span className="font-mono">{art}</span>
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Ready
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default AIWorkspaceModal;
