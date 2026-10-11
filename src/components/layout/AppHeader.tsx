import React from "react";
import {
  BookOpen,
  Sparkles,
  Shield,
  FileSpreadsheet,
  User,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Edit2
} from "lucide-react";
import { SignedInUser } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface AppHeaderProps {
  activeTab: "explorer" | "ai-tutor" | "admin-portal";
  setActiveTab: (tab: "explorer" | "ai-tutor" | "admin-portal") => void;
  signedInUser: SignedInUser | null;
  onOpenAuthModal: (isAdmin?: boolean) => void;
  onAdminNavigation: () => void;
  onSignOut: () => void;
  onDownloadPPTX: () => void;
  isGeneratingPPTX: boolean;
  notesCount: number;
  currentTime?: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function AppHeader({
  activeTab,
  setActiveTab,
  signedInUser,
  onOpenAuthModal,
  onAdminNavigation,
  onSignOut,
  onDownloadPPTX,
  isGeneratingPPTX,
  notesCount,
  theme,
  onToggleTheme,
  mobileMenuOpen,
  onToggleMobileMenu
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            type="button"
            className="flex items-center space-x-2.5 select-none group text-left rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 p-1"
            onClick={() => setActiveTab("explorer")}
            aria-label="Notsopedia Home — Go to Explore Notes"
          >
            <div className="flex items-center justify-center w-9 h-9 font-serif italic text-lg font-black text-white bg-gradient-to-br from-emerald-600 to-slate-900 dark:from-emerald-500 dark:to-teal-800 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg md:text-xl font-bold font-serif italic tracking-tight text-slate-900 dark:text-white">
                  Notsopedia
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md tracking-wider">
                  Library
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none mt-0.5">
                Collaborative Student Study Vault
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav
          className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60"
          aria-label="Primary navigation"
        >
          <button
            type="button"
            onClick={() => setActiveTab("explorer")}
            aria-current={activeTab === "explorer" ? "page" : undefined}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === "explorer"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/30"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{UI_LABELS.navigation.exploreNotes}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai-tutor")}
            aria-current={activeTab === "ai-tutor" ? "page" : undefined}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === "ai-tutor"
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/30"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
            <span>{UI_LABELS.navigation.aiTutor}</span>
          </button>

          {signedInUser?.isAdmin && (
            <button
              type="button"
              onClick={onAdminNavigation}
              aria-current={activeTab === "admin-portal" ? "page" : undefined}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                activeTab === "admin-portal"
                  ? "bg-amber-500 text-slate-950 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/30"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>{UI_LABELS.navigation.admin}</span>
            </button>
          )}
        </nav>

        {/* Global actions: Download Presentation, Theme Toggle, User Profile */}
        <div className="flex items-center space-x-2">
          {/* Download Presentation Button */}
          <button
            type="button"
            onClick={onDownloadPPTX}
            disabled={isGeneratingPPTX || notesCount === 0}
            className="hidden sm:inline-flex h-9 px-3 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-xs font-semibold transition items-center space-x-1.5 border border-slate-700/60 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Download study notes outline as a presentation deck"
            aria-label={isGeneratingPPTX ? UI_LABELS.actions.compilingPresentation : UI_LABELS.actions.downloadPresentation}
          >
            <FileSpreadsheet className={`h-3.5 w-3.5 ${isGeneratingPPTX ? "animate-spin text-emerald-400" : "text-emerald-400"}`} />
            <span className="hidden lg:inline">
              {isGeneratingPPTX ? UI_LABELS.actions.compilingPresentation : UI_LABELS.actions.downloadPresentation}
            </span>
            <span className="lg:hidden">
              {isGeneratingPPTX ? "Creating..." : "Presentation"}
            </span>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* User Profile / Session Connector */}
          {signedInUser ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenAuthModal(signedInUser.isAdmin)}
                className="cursor-pointer text-right group hidden sm:block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
                title="Edit student profile"
                aria-label="Edit student profile"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-end gap-1">
                  <span className="max-w-[100px] truncate">{signedInUser.name}</span>
                  <Edit2 className="h-2.5 w-2.5 text-slate-400 opacity-60" />
                </div>
                <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                  {signedInUser.role}
                </div>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className="h-9 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                title={UI_LABELS.actions.signOut}
                aria-label={UI_LABELS.actions.signOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{UI_LABELS.actions.signOut}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal(false)}
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={UI_LABELS.actions.signIn}
            >
              <User className="h-3.5 w-3.5" />
              <span>{UI_LABELS.actions.signIn}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
