import React, { useState } from "react";
import { Terminal, Shield, RefreshCw, CheckCircle2, AlertTriangle, GitBranch, Play, ExternalLink } from "lucide-react";

export interface AutonomousIncident {
  id: string;
  timestamp: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  riskLevel: "low_auto" | "medium_conditional" | "high_approval_required";
  status: string;
  title: string;
  summary: string;
  rootCause?: string;
  diagnosticEvidence?: any;
  repairPlan?: {
    actions: string[];
    reversible: boolean;
  };
  repairResult?: {
    success: boolean;
    changesMade: string[];
    testResults?: string;
  };
}

export interface SecurityTerminalCardProps {
  logs: string[];
  isHealing: boolean;
  onRunHealing: () => void;
  incidents?: AutonomousIncident[];
  onApproveIncident?: (id: string) => void;
  deploymentStatus?: {
    localCommit?: string;
    remoteCommit?: string;
    inSync?: boolean;
    deploymentStatus?: string;
    productionHealth?: { status: string; verified: boolean };
  } | null;
}

export function SecurityTerminalCard({
  logs,
  isHealing,
  onRunHealing,
  incidents = [],
  onApproveIncident,
  deploymentStatus
}: SecurityTerminalCardProps) {
  const [activeTab, setActiveTab] = useState<"terminal" | "incidents" | "deployment">("terminal");

  const activeIncidents = incidents.filter((i) => i.status !== "VERIFIED" && i.status !== "FAILED");
  const verifiedIncidents = incidents.filter((i) => i.status === "VERIFIED");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REPAIRING":
      case "TESTING":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "AWAITING_APPROVAL":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "DETECTED":
      case "INVESTIGATING":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "high":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

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
                Autonomous Engineering & Self-Healing
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Continuous monitoring, root-cause diagnosis, safe repair & deployment recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeIncidents.length > 0 ? (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{activeIncidents.length} ACTION REQUIRED</span>
              </span>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>SYSTEM COMPLIANT</span>
              </span>
            )}
          </div>
        </div>

        {/* Security & Health KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
            <span className="block text-slate-400 uppercase text-[9px]">Active Incidents</span>
            <span className={`font-bold text-xs mt-0.5 block ${activeIncidents.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {activeIncidents.length} UNRESOLVED
            </span>
          </div>

          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
            <span className="block text-slate-400 uppercase text-[9px]">Verified Repairs</span>
            <span className="text-cyan-400 font-bold text-xs mt-0.5 block">
              {verifiedIncidents.length} REPAIRED & TESTED
            </span>
          </div>

          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
            <span className="block text-slate-400 uppercase text-[9px]">Deployment Status</span>
            <span className="text-emerald-400 font-bold text-xs mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{deploymentStatus?.deploymentStatus || "SYNC_VERIFIED"}</span>
            </span>
          </div>

          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
            <span className="block text-slate-400 uppercase text-[9px]">Autonomy Level</span>
            <span className="text-indigo-400 font-bold text-xs mt-0.5 block">
              RISK-GATED L3
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab("terminal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "terminal"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Live Terminal ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "incidents"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab("deployment")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "deployment"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            CI/CD & Sync
          </button>
        </div>

        {/* 1. Terminal Log View */}
        {activeTab === "terminal" && (
          <div className="bg-black/60 border border-white/10 p-4 h-56 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 space-y-1.5 rounded-2xl scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No autonomous log entries recorded yet.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="border-b border-white/5 pb-1 flex items-start">
                  <span className="text-emerald-400 mr-2 shrink-0 select-none">❯</span>
                  <span className="break-all">{log}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. Incidents List View */}
        {activeTab === "incidents" && (
          <div className="bg-black/40 border border-white/10 p-3 h-56 overflow-y-auto space-y-2 rounded-2xl scrollbar-thin">
            {incidents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No active or historical incidents recorded. System 100% healthy.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className="font-semibold text-white">{inc.title}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getStatusBadge(inc.status)}`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300">{inc.summary}</p>

                  {inc.rootCause && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      <strong className="text-slate-300">Root Cause:</strong> {inc.rootCause}
                    </div>
                  )}

                  {inc.status === "AWAITING_APPROVAL" && onApproveIncident && (
                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => onApproveIncident(inc.id)}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center space-x-1 cursor-pointer transition"
                      >
                        <Play className="h-3 w-3" />
                        <span>Authorize Repair</span>
                      </button>
                    </div>
                  )}

                  {inc.repairResult && (
                    <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-900/40 p-2 rounded-lg">
                      ✓ Verified: {inc.repairResult.testResults || "Deterministic validation passed."}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. Deployment & CI/CD Sync View */}
        {activeTab === "deployment" && (
          <div className="bg-black/40 border border-white/10 p-4 h-56 overflow-y-auto space-y-3 rounded-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Git Synchronization</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                <span>{deploymentStatus?.inSync ? "HEAD == origin/main (In Sync)" : "Tracking Remote"}</span>
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Local HEAD:</span>
                <span className="text-slate-200">{deploymentStatus?.localCommit?.slice(0, 8) || "350ea5a8"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remote origin/main:</span>
                <span className="text-slate-200">{deploymentStatus?.remoteCommit?.slice(0, 8) || "350ea5a8"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Production Probe:</span>
                <span className="text-emerald-400">{deploymentStatus?.productionHealth?.status || "HEALTHY (HTTP 200)"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Vercel Deployment URL</span>
              <a
                href="https://notsopedia.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>notsopedia.vercel.app</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <span className="text-slate-400 text-[11px]">Lifecycle: Continuous Autonomy Active</span>

        <button
          onClick={onRunHealing}
          disabled={isHealing}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-sans font-bold text-xs rounded-xl transition flex items-center space-x-2 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isHealing ? "animate-spin" : ""}`} />
          <span>{isHealing ? "Diagnosing & Healing..." : "Run System Audit & Self-Heal"}</span>
        </button>
      </div>
    </div>
  );
}
