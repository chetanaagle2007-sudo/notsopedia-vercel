import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Moon,
  Sun,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  Mail,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound
} from "lucide-react";
import { SignedInUser } from "../../types";
import { supabase } from "../../supabase";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  signedInUser: SignedInUser | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenAuthModal?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  signedInUser,
  theme,
  onToggleTheme,
  onOpenAuthModal
}: SettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState<
    "profile" | "appearance" | "preferences" | "security" | "about"
  >("profile");

  // Learning preferences stored in localStorage
  const [explorerLayout, setExplorerLayout] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("notsopedia_explorer_layout") as "grid" | "list") || "grid";
  });
  const [defaultAiMode, setDefaultAiMode] = useState<string>(() => {
    return localStorage.getItem("notsopedia_default_ai_mode") || "notes-expert";
  });

  // Action status feedback
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setActionSuccess("");
      setActionError("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLayoutChange = (layout: "grid" | "list") => {
    setExplorerLayout(layout);
    localStorage.setItem("notsopedia_explorer_layout", layout);
    window.dispatchEvent(new Event("notsopedia_layout_change"));
  };

  const handleAiModeChange = (mode: string) => {
    setDefaultAiMode(mode);
    localStorage.setItem("notsopedia_default_ai_mode", mode);
  };

  const handleRequestPasswordReset = async () => {
    if (!signedInUser?.email) return;
    setActionSuccess("");
    setActionError("");
    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(signedInUser.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) throw error;
      setActionSuccess(`Password reset instructions sent to ${signedInUser.email}`);
    } catch (err: any) {
      setActionError(err?.message || "Failed to send password reset email.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendVerification = async () => {
    if (!signedInUser?.email) return;
    setActionSuccess("");
    setActionError("");
    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: signedInUser.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      setActionSuccess(`Account confirmation link dispatched to ${signedInUser.email}`);
    } catch (err: any) {
      setActionError(err?.message || "Failed to resend confirmation email.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Notsopedia Application Settings"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col md:flex-row min-h-[480px] max-h-[90vh]">
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-52 p-4 bg-slate-50 dark:bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1.5">
              Settings
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("profile");
                setActionSuccess("");
                setActionError("");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeCategory === "profile"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Profile & Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("appearance");
                setActionSuccess("");
                setActionError("");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeCategory === "appearance"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("preferences");
                setActionSuccess("");
                setActionError("");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeCategory === "preferences"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutGrid className="h-4 w-4 text-indigo-500" />
              <span>Learning Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("security");
                setActionSuccess("");
                setActionError("");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeCategory === "security"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Security & Email</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("about");
                setActionSuccess("");
                setActionError("");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeCategory === "about"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <HelpCircle className="h-4 w-4 text-slate-500" />
              <span>About & Support</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-mono hidden md:block">
            Notsopedia v1.2.0
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {activeCategory === "profile" && "Profile & Academic Identity"}
                {activeCategory === "appearance" && "Appearance & Display"}
                {activeCategory === "preferences" && "Learning Preferences"}
                {activeCategory === "security" && "Security & Official Email"}
                {activeCategory === "about" && "About Notsopedia & Support"}
              </h2>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close Settings modal"
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status alerts */}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Profile Tab */}
            {activeCategory === "profile" && (
              <div className="space-y-4 text-xs">
                {signedInUser ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {signedInUser.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                          {signedInUser.role}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Email: <strong className="text-slate-800 dark:text-slate-200">{signedInUser.email}</strong>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Institution: <span className="text-slate-800 dark:text-slate-200">{signedInUser.institution}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-500 text-[11px]">
                      Account identity is verified through Supabase Authentication with encrypted password hashing and Google OAuth integration.
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <User className="h-8 w-8 mx-auto text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Not signed in</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Sign in to upload notes, save study materials, and access your personal learning library.
                      </p>
                    </div>
                    {onOpenAuthModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAuthModal();
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                      >
                        Sign in or Register
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Appearance Tab */}
            {activeCategory === "appearance" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Application Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (theme === "dark") onToggleTheme();
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                        theme === "light"
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Sun className="h-5 w-5 text-amber-500" />
                      <div className="text-left">
                        <div>Light Mode</div>
                        <div className="text-[10px] text-slate-400 font-normal">Clean bright paper style</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (theme === "light") onToggleTheme();
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                        theme === "dark"
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Moon className="h-5 w-5 text-indigo-400" />
                      <div className="text-left">
                        <div>Dark Mode</div>
                        <div className="text-[10px] text-slate-400 font-normal">Eye-care late-night study</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Preferences Tab */}
            {activeCategory === "preferences" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Default Notes Explorer Layout
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleLayoutChange("grid")}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                        explorerLayout === "grid"
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>Grid View (Visual Cards)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange("list")}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                        explorerLayout === "list"
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <List className="h-4 w-4" />
                      <span>Compact List View</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Default AI Tutor Mode
                  </label>
                  <select
                    value={defaultAiMode}
                    onChange={(e) => handleAiModeChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="notes-expert">Library Notes Chat (Grounded in Peer Notes)</option>
                    <option value="exam-prep">Exam Textbook Pro (Detailed Exam Questions)</option>
                    <option value="news-gk">Live Web Grounding (General & Science)</option>
                    <option value="concept-explainer">Concept Explainer (Intuition & Analogies)</option>
                    <option value="revision-planner">Revision Roadmap Planner (High-Yield Milestones)</option>
                    <option value="summary">High-Yield Study Summary (Cheatsheet & Core Formulas)</option>
                    <option value="mcq-generator">MCQ Practice Generator (Self-Test Questions)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block font-semibold text-slate-800 dark:text-slate-200">
                    Data Export & Local Backup
                  </label>
                  <p className="text-slate-500 text-[11px]">
                    Export your saved library bookmarks, local quiz attempts, and study collections as a JSON archive.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const exportData = {
                          exportedAt: new Date().toISOString(),
                          theme,
                          defaultAiMode,
                          quizHistory: JSON.parse(localStorage.getItem("notsopedia_quiz_history") || "[]"),
                          collections: JSON.parse(localStorage.getItem(`notsopedia_collections_${signedInUser?.id || "guest"}`) || "[]")
                        };
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `notsopedia-backup-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setActionSuccess("Study data exported successfully.");
                      } catch (err) {
                        setActionError("Failed to export data.");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
                  >
                    Export Study Data (JSON)
                  </button>
                </div>
              </div>
            )}

            {/* Security & Email Tab */}
            {activeCategory === "security" && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Official Authentication & Notification Email</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Notsopedia delivers automatic signup verification, secure password recovery, and security alerts through Supabase Auth.
                  </p>

                  {signedInUser ? (
                    <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={handleRequestPasswordReset}
                          disabled={isProcessing}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5"
                        >
                          {isProcessing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                          <span>Request Password Reset</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={isProcessing}
                          className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Resend Verification Email</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">
                      Sign in to manage your security and email notification preferences.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* About & Support Tab */}
            {activeCategory === "about" && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="font-serif italic font-bold text-sm text-slate-900 dark:text-white">
                    Notsopedia Study Platform
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Notsopedia is an open-access student learning and notes repository featuring AI-powered tutoring, presentation exports, and peer study vaults.
                  </p>
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-400">Support & Feedback: </span>
                      <a href="mailto:chetanaagle09@gmail.com" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                        chetanaagle09@gmail.com
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400">Platform Deployment: </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">https://notsopedia.vercel.app</span>
                    </div>
                    <div>
                      <span className="text-slate-400">MIND-AI Gateway: </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
