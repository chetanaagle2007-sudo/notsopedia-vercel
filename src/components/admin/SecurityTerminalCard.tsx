import React from "react";
import { Terminal, Shield, RefreshCw, CheckCircle2 } from "lucide-react";

interface SecurityTerminalCardProps {
  logs: string[];
  isHealing: boolean;
  onRunHealing: () => void;
}

export function SecurityTerminalCard({
  logs,
  isHealing,
  onRunHealing
}: SecurityTerminalCardProps) {
  return (
    <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Autonomous Security & Self-Healing
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Automated XSS sanitization and schema alignment daemon
              </p>
            </div>
          </div>

          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>SHIELD ARMED</span>
          </span>
        </div>

        {/* Security KPI Badges */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
            <span className="block text-slate-400 uppercase text-[9px]">Audit Frequency</span>
            <span className="text-emerald-400 font-bold text-xs mt-0.5 block">EVERY 24H AUTO</span>
          </div>

          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
            <span className="block text-slate-400 uppercase text-[9px]">Protection Status</span>
            <span className="text-emerald-400 font-bold text-xs mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>OPTIMIZED</span>
            </span>
          </div>
        </div>

        {/* Terminal Log Console */}
        <div className="bg-black/60 border border-white/10 p-4 h-48 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 space-y-1.5 rounded-2xl scrollbar-thin">
          {logs.map((log, idx) => (
            <div key={idx} className="border-b border-white/5 pb-1 flex items-start">
              <span className="text-emerald-400 mr-2 shrink-0 select-none">❯</span>
              <span className="break-all">{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <span className="text-slate-400 text-[11px]">Daily Autonomous Routine: ACTIVE</span>

        <button
          onClick={onRunHealing}
          disabled={isHealing}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-sans font-bold text-xs rounded-xl transition flex items-center space-x-2 shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isHealing ? "animate-spin" : ""}`} />
          <span>{isHealing ? "Running Security Healing..." : "Run Security Audit"}</span>
        </button>
      </div>
    </div>
  );
}
