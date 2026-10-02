import React from "react";
import { Shield, Lock, FileText, CheckCircle2, Megaphone, AlertCircle } from "lucide-react";
import { SignedInUser, SystemConfig } from "../../types";
import { SystemSettingsCard } from "./SystemSettingsCard";
import { SecurityTerminalCard } from "./SecurityTerminalCard";

interface AdminPortalProps {
  signedInUser: SignedInUser | null;
  onOpenAuthModal: () => void;
  systemConfig: SystemConfig;
  onSaveConfig: (updated: Partial<SystemConfig>) => void;
  isSavingConfig: boolean;
  onResetDatabase: () => void;
  securityLogs: string[];
  isHealing: boolean;
  onRunHealing: () => void;
  totalNotesCount: number;
}

export function AdminPortal({
  signedInUser,
  onOpenAuthModal,
  systemConfig,
  onSaveConfig,
  isSavingConfig,
  onResetDatabase,
  securityLogs,
  isHealing,
  onRunHealing,
  totalNotesCount
}: AdminPortalProps) {
  const isAdmin = Boolean(signedInUser && signedInUser.isAdmin);

  return (
    <div className="space-y-6">
      {/* Console Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-400 shrink-0">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif italic text-slate-900 dark:text-white">
              System Control Console
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Authorized administrators can configure platform broadcasts, toggle peer uploads,
              moderate community study notes, and run the autonomous security healing daemon.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {isAdmin ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold uppercase flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Admin Credentials Active</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase rounded-xl transition shadow-xs flex items-center space-x-2"
            >
              <Lock className="h-4 w-4" />
              <span>Unlock Admin Console</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Vault Notes</span>
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            {totalNotesCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Submissions</span>
            {systemConfig.enableSubmissions ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Lock className="h-4 w-4 text-rose-600" />
            )}
          </div>
          <div className="text-sm font-bold font-sans text-slate-900 dark:text-white mt-1">
            {systemConfig.enableSubmissions ? "Open for Students" : "Locked Down"}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Broadcast</span>
            <Megaphone className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold font-sans text-slate-900 dark:text-white mt-1">
            {systemConfig.announcementActive ? "Active Marquee" : "Muted"}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Daemon Shield</span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold font-sans text-emerald-600 dark:text-emerald-400 mt-1">
            Armed & Healthy
          </div>
        </div>
      </div>

      {/* Main Admin Panels: Settings & Terminal */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 relative ${!isAdmin ? "opacity-50 select-none" : ""}`}>
        {!isAdmin && (
          <div className="absolute inset-0 z-10 bg-slate-100/60 dark:bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-3xl space-y-3">
            <div className="p-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Administrative Passcode Required</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed font-sans">
              Sign in with administrative privileges to configure system parameters and moderate study documents.
            </p>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              Sign In As Administrator
            </button>
          </div>
        )}

        <SystemSettingsCard
          systemConfig={systemConfig}
          onSaveConfig={onSaveConfig}
          isSaving={isSavingConfig}
          onResetDatabase={onResetDatabase}
        />

        <SecurityTerminalCard
          logs={securityLogs}
          isHealing={isHealing}
          onRunHealing={onRunHealing}
        />
      </div>
    </div>
  );
}
