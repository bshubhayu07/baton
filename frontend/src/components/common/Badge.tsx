import React from "react";
import { ClaimState, PermissionLevel, ClaimCategory } from "@/lib/types";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export function ConfidenceBadge({ state }: { state: ClaimState }) {
  switch (state) {
    case "VERIFIED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          VERIFIED
        </span>
      );
    case "INFERRED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
          <HelpCircle className="w-3.5 h-3.5" />
          INFERRED
        </span>
      );
    case "CONFLICTING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
          <AlertTriangle className="w-3.5 h-3.5" />
          CONFLICTING
        </span>
      );
    case "MISSING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
          <XCircle className="w-3.5 h-3.5" />
          MISSING
        </span>
      );
    default:
      return null;
  }
}

export function PermissionBadge({ level }: { level: PermissionLevel }) {
  switch (level) {
    case "PUBLIC":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <Shield className="w-3 h-3 text-slate-400" />
          PUBLIC
        </span>
      );
    case "INTERNAL":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-900/30 text-blue-300 border border-blue-700/40">
          <ShieldCheck className="w-3 h-3 text-blue-400" />
          INTERNAL
        </span>
      );
    case "CONFIDENTIAL":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/40 text-amber-300 border border-amber-700/50">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          CONFIDENTIAL
        </span>
      );
    case "RESTRICTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/50 text-rose-300 border border-rose-700/60">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          RESTRICTED
        </span>
      );
    default:
      return null;
  }
}

export function CategoryBadge({ category }: { category: ClaimCategory }) {
  const colors: Record<ClaimCategory, string> = {
    DECISION: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    REASONING: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    OWNERSHIP: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    DEPENDENCY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    PROGRESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RISK: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    UNRESOLVED_ISSUE: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border ${
        colors[category] || "bg-slate-800 text-slate-300 border-slate-700"
      }`}
    >
      {category.replace("_", " ")}
    </span>
  );
}
