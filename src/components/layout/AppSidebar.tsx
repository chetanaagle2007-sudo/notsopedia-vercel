import React from "react";
import {
  BookMarked,
  Sparkles,
  Shield,
  Plus,
  Layers,
  Database,
  CloudCheck,
  ChevronRight,
  X
} from "lucide-react";
import { UniversalSubject } from "../../data";

interface AppSidebarProps {
  activeTab: "explorer" | "ai-tutor" | "admin-portal";
  setActiveTab: (tab: "explorer" | "ai-tutor" | "admin-portal") => void;
  subjects: UniversalSubject[];
  selectedSubjectFilter: string;
  onSelectSubject: (subject: string) => void;
  onOpenUploadModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalNotesCount: number;
}

export function AppSidebar({
  activeTab,
  setActiveTab,
  subjects,
  selectedSubjectFilter,
  onSelectSubject,
  onOpenUploadModal,
  isOpenMobile,
  onCloseMobile,
  totalNotesCount
}: AppSidebarProps) {
  const handleNavClick = (tab: "explorer" | "ai-tutor" | "admin-portal") => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const handleSubjectClick = (subj: string) => {
    setActiveTab("explorer");
    onSelectSubject(subj);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 md:top-14 left-0 z-50 md:z-20 h-full md:h-[calc(100vh-3.5rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Mobile Drawer Header */}
          <div className="flex md:hidden items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
              Notsopedia Menu
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Action: Upload */}
          <button
            onClick={() => {
              onOpenUploadModal();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload New Note</span>
          </button>

          {/* Core Navigation items */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
              Workspace
            </div>

            <button
              onClick={() => handleNavClick("explorer")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "explorer"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/60"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BookMarked className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Notes Explorer</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {totalNotesCount}
              </span>
            </button>

            <button
              onClick={() => handleNavClick("ai-tutor")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "ai-tutor"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI Tutor</span>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Live
              </span>
            </button>

            <button
              onClick={() => handleNavClick("admin-portal")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "admin-portal"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/60"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Admin Console</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            </button>
          </div>

          {/* Academic Disciplines & Subject Filter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Subject Filter
              </span>
              <Layers className="h-3 w-3 text-slate-400" />
            </div>

            <button
              onClick={() => handleSubjectClick("All Subjects")}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                selectedSubjectFilter === "All Subjects"
                  ? "font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <span>All Subjects</span>
              {selectedSubjectFilter === "All Subjects" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </button>

            {subjects.map((subj) => (
              <button
                key={subj.code}
                onClick={() => handleSubjectClick(subj.name)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-between truncate ${
                  selectedSubjectFilter === subj.name
                    ? "font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
                title={subj.name}
              >
                <span className="truncate">{subj.name}</span>
                <span className="text-[9px] font-mono text-slate-400 ml-1 shrink-0">
                  {subj.code}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* System Architecture Indicators */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-[10px] font-mono">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>Storage Bucket</span>
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Notesopedia</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Database Sync</span>
            </span>
            <span className="text-slate-700 dark:text-slate-300">Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
