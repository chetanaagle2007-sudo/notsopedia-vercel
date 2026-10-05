import React from "react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 px-4 md:px-8 text-xs font-sans text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="font-serif italic font-bold text-slate-800 dark:text-slate-200 text-sm">
            Notsopedia
          </span>
          <span>•</span>
          <span>Learn. Create. Share.</span>
        </div>
      </div>
    </footer>
  );
}

