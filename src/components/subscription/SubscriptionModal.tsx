import React from "react";
import {
  X,
  Check,
  Sparkles,
  Shield,
  Zap,
  GraduationCap,
  Award,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { PlanEntitlements, SubscriptionTier } from "../../types";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: SubscriptionTier;
}

export const PLAN_DEFINITIONS: Record<SubscriptionTier, PlanEntitlements> = {
  free: {
    tier: "free",
    displayName: "Free Student",
    aiRequestsPerHour: 10,
    maxCollections: 3,
    quizQuestionsPerDay: 15,
    canExportMarkdown: true,
    canExportJSON: false,
    canUseAdvancedTutorModes: false,
    spacedRepetitionEnabled: false
  },
  plus: {
    tier: "plus",
    displayName: "Student Plus",
    aiRequestsPerHour: 50,
    maxCollections: 15,
    quizQuestionsPerDay: 100,
    canExportMarkdown: true,
    canExportJSON: true,
    canUseAdvancedTutorModes: true,
    spacedRepetitionEnabled: true
  },
  pro: {
    tier: "pro",
    displayName: "Scholar Pro",
    aiRequestsPerHour: 150,
    maxCollections: 50,
    quizQuestionsPerDay: 500,
    canExportMarkdown: true,
    canExportJSON: true,
    canUseAdvancedTutorModes: true,
    spacedRepetitionEnabled: true
  },
  "student-premium": {
    tier: "student-premium",
    displayName: "University Premium",
    aiRequestsPerHour: 500,
    maxCollections: 200,
    quizQuestionsPerDay: 2000,
    canExportMarkdown: true,
    canExportJSON: true,
    canUseAdvancedTutorModes: true,
    spacedRepetitionEnabled: true
  }
};

export function SubscriptionModal({
  isOpen,
  onClose,
  currentTier = "free"
}: SubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2
                id="subscription-modal-title"
                className="font-serif italic font-bold text-lg text-slate-900 dark:text-white"
              >
                Notsopedia Membership & Entitlements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent feature tiers and computational allowances designed for student success
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close membership modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informational Disclaimer Badge */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/40 px-6 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Non-Payment Architecture Preview:</strong> Live payment gateways are not yet linked to avoid unverified charges. Free learning and core study features remain fully accessible to all verified students.
          </span>
        </div>

        {/* Plans Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Plan 1: Free */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  Baseline
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Free Student
                </h3>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                $0 <span className="text-xs text-slate-400 font-normal">/ forever</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Essential study notes vault and foundational AI learning tools.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>10 AI Tutor queries / hour</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>3 Study Collections</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>15 Quiz questions / day</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Markdown document export</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 cursor-default"
            >
              Current Active Plan
            </button>
          </div>

          {/* Plan 2: Plus (Featured) */}
          <div className="relative p-5 rounded-3xl border-2 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 flex flex-col justify-between space-y-4 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Enhanced Study
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Student Plus
                </h3>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                Upcoming <span className="text-xs text-slate-400 font-normal">/ tier</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Expanded AI capacity, unlimited revision queues, and advanced tutor modes.
              </p>

              <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/50 text-xs">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>50 AI Tutor queries / hour</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>15 Study Collections</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>100 Quiz questions / day</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Concept Explainer & Revision Planner</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Markdown & JSON data backup</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
            >
              Preview Entitlement
            </button>
          </div>

          {/* Plan 3: Pro */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  Power Scholar
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Scholar Pro
                </h3>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                Upcoming <span className="text-xs text-slate-400 font-normal">/ tier</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional-scale power with priority queueing and high-concurrency tasks.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>150 AI queries / hour</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>50 Study Collections</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>500 Practice questions / day</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Export PPTX, Markdown, JSON</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Notify on Release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
