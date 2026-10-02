import React from "react";

export function SkeletonCard({ key }: { key?: React.Key } = {}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="space-y-1.5 pt-2">
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
        <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
        <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="flex space-x-1.5">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="w-14 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
