import React, { useState } from "react";
import { Settings, Megaphone, Lock, Unlock, RotateCcw } from "lucide-react";
import { SystemConfig } from "../../types";

interface SystemSettingsCardProps {
  systemConfig: SystemConfig;
  onSaveConfig: (updated: Partial<SystemConfig>) => void;
  isSaving: boolean;
  onResetDatabase: () => void;
}

export function SystemSettingsCard({
  systemConfig,
  onSaveConfig,
  isSaving,
  onResetDatabase
}: SystemSettingsCardProps) {
  const [announcementText, setAnnouncementText] = useState(systemConfig.announcement);

  const handleUpdateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      announcement: announcementText,
      announcementActive: true
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
            System & Broadcast Parameters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control platform announcements, student uploads, and data recovery
          </p>
        </div>
      </div>

      <div className="space-y-5 text-xs">
        {/* Broadcast Marquee Config */}
        <form onSubmit={handleUpdateAnnouncement} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Announcement Banner Message</span>
            </label>

            <button
              type="button"
              onClick={() => onSaveConfig({ announcementActive: !systemConfig.announcementActive })}
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase transition ${
                systemConfig.announcementActive
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              {systemConfig.announcementActive ? "Active" : "Disabled"}
            </button>
          </div>

          <textarea
            rows={3}
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Type broadcast announcement..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-white text-xs transition shadow-xs"
          >
            {isSaving ? "Saving Config..." : "Update Announcement"}
          </button>
        </form>

        {/* Submission Lockdown Toggle */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div>
            <span className="block font-semibold text-slate-800 dark:text-slate-200">
              Student Note Submissions
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Lock or open academic note submissions from the community
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSaveConfig({ enableSubmissions: !systemConfig.enableSubmissions })}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs ${
              systemConfig.enableSubmissions
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {systemConfig.enableSubmissions ? (
              <>
                <Unlock className="h-3.5 w-3.5" />
                <span>Open</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>Locked</span>
              </>
            )}
          </button>
        </div>

        {/* Disaster Recovery / Factory Reset */}
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
          <span className="block font-semibold text-rose-900 dark:text-rose-300">
            Database Recovery & Seed Defaults
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Re-seeds universal textbook starter materials. Use with caution.
          </p>

          <button
            type="button"
            onClick={onResetDatabase}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset To Default Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
