import React from "react";
import { Database, ShieldCheck, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 px-4 md:px-8 text-xs font-sans text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-serif italic font-bold text-slate-800 dark:text-slate-200 text-sm">
            Notsopedia
          </span>
          <span>•</span>
          <span>Modern AI Study Workspace © 2026</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase Cloud Storage</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
            <span>Gemini 2.5 Flash Engine</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted Workspace</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
