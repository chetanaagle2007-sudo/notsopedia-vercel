import React from "react";
import {
  BookMarked,
  Sparkles,
  Shield,
  FileText,
  Clock,
  User,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Edit2
} from "lucide-react";
import { SignedInUser } from "../../types";

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
  currentTime: string;
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
  currentTime,
  theme,
  onToggleTheme,
  mobileMenuOpen,
  onToggleMobileMenu
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
            onClick={() => setActiveTab("explorer")}
          >
            <div className="flex items-center justify-center w-9 h-9 font-serif italic text-lg font-black text-white bg-gradient-to-br from-emerald-600 to-slate-900 dark:from-emerald-500 dark:to-teal-800 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg md:text-xl font-bold font-serif italic tracking-tight text-slate-900 dark:text-white">
                  Notsopedia
                </h1>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md tracking-wider">
                  Workspace
                </span>
              </div>
              <p className="text-[9px] font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500 hidden sm:block">
                Collaborative Study Vault & AI Tutor
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-full border border-slate-200/70 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === "explorer"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/30"
            }`}
          >
            <BookMarked className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Notes Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab("ai-tutor")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === "ai-tutor"
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/30"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            <span>AI Tutor</span>
          </button>

          {signedInUser?.isAdmin && (
            <button
              onClick={onAdminNavigation}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === "admin-portal"
                ? "bg-amber-500 text-slate-950 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/30"
            }`}
            >
              <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Global actions: PPTX, Clock, Theme, Profile */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* PPTX Export Button */}
          <button
            onClick={onDownloadPPTX}
            disabled={isGeneratingPPTX || notesCount === 0}
            className="hidden sm:flex px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-xs font-semibold transition-all items-center space-x-1.5 border border-slate-700/60 shadow-xs"
            title="Download notes syllabus outline deck as PowerPoint"
          >
            <FileText className={`h-3.5 w-3.5 ${isGeneratingPPTX ? "animate-spin text-emerald-400" : "text-emerald-400"}`} />
            <span className="hidden lg:inline">{isGeneratingPPTX ? "Compiling..." : "Export PPTX"}</span>
            <span className="lg:hidden">{isGeneratingPPTX ? "..." : "PPTX"}</span>
          </button>

          {/* Real-time UTC Sync Clock */}
          <div className="hidden xl:flex flex-col text-right font-mono text-[9px] text-slate-400 dark:text-slate-500 leading-tight px-2 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 justify-end">
              <Clock className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>{currentTime || "00:00:00 UTC"}</span>
            </div>
            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">LIVE SYNC</span>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition shadow-xs"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* User Profile / Session Connector */}
          {signedInUser ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              <div
                onClick={() => onOpenAuthModal(signedInUser.isAdmin)}
                className="cursor-pointer text-right group hidden sm:block"
                title="Edit student profile"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-end gap-1">
                  <span className="max-w-[100px] truncate">{signedInUser.name}</span>
                  <Edit2 className="h-2.5 w-2.5 text-slate-400 opacity-60" />
                </div>
                <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                  {signedInUser.role}
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition flex items-center gap-1"
                title="Sign out / Switch user"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal(false)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
