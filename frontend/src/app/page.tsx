"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Claim, ClaimState } from "@/lib/types";
import { ConfidenceBadge, CategoryBadge, PermissionBadge } from "@/components/common/Badge";
import {
  Sparkles,
  GitGraph,
  HelpCircle,
  CheckSquare,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Layers,
} from "lucide-react";

export default function DashboardPage() {
  const { activeProject, currentUser, refreshProjects } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);

  useEffect(() => {
    if (activeProject) {
      loadClaims(activeProject.id);
    }
  }, [activeProject]);

  const loadClaims = async (projId: string) => {
    try {
      setLoading(true);
      const res = await api.getClaims(projId);
      setClaims(res);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReconstruction = async () => {
    if (!activeProject) return;
    try {
      setReconstructing(true);
      await api.runReconstruction(activeProject.id);
      await refreshProjects();
      await loadClaims(activeProject.id);
    } catch (err) {
      console.error("Reconstruction error:", err);
    } finally {
      setReconstructing(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Layers className="w-12 h-12 text-slate-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white mb-2">No Active Project Room</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-md">
          Establish a new project room or load the pre-configured Payments V2 demo dataset.
        </p>
      </div>
    );
  }

  const verifiedCount = claims.filter((c) => c.state === "VERIFIED").length;
  const inferredCount = claims.filter((c) => c.state === "INFERRED").length;
  const conflictingCount = claims.filter((c) => c.state === "CONFLICTING").length;
  const missingCount = claims.filter((c) => c.state === "MISSING").length;

  return (
    <div className="space-y-8">
      {/* Hero Banner with Project Info */}
      <div className="relative rounded-3xl glass-panel-glow p-6 md:p-8 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ACTIVE HANDOVER PROJECT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Room ID: {activeProject.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {activeProject.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {activeProject.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunReconstruction}
              disabled={reconstructing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${reconstructing ? "animate-spin" : ""}`} />
              <span>{reconstructing ? "Extracting & Verifying Spans..." : "Run AI Reconstruction"}</span>
            </button>

            <Link
              href="/graph"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors"
            >
              <GitGraph className="w-4 h-4 text-cyan-400" />
              <span>Explore Graph</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Verified */}
        <div className="p-5 rounded-2xl glass-panel border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>VERIFIED CLAIMS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{verifiedCount}</div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            Verbatim quote + human approved
          </span>
        </div>

        {/* Inferred */}
        <div className="p-5 rounded-2xl glass-panel border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>INFERRED CLAIMS</span>
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white">{inferredCount}</div>
          <span className="text-[11px] text-sky-400 font-mono mt-1 block">
            Evidence grounded, pending sign-off
          </span>
        </div>

        {/* Conflicting */}
        <div className="p-5 rounded-2xl glass-panel border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>CONFLICTING</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{conflictingCount}</div>
          <span className="text-[11px] text-amber-400 font-mono mt-1 block">
            Contradictory evidence across sources
          </span>
        </div>

        {/* Missing */}
        <div className="p-5 rounded-2xl glass-panel border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>MISSING EVIDENCE</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white">{missingCount}</div>
          <span className="text-[11px] text-rose-400 font-mono mt-1 block">
            Gap questions generated for leaver
          </span>
        </div>
      </div>

      {/* Role-Specific Action Banner */}
      <div className="p-6 rounded-2xl bg-surface-raised/60 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {currentUser?.role === "OUTGOING_EMPLOYEE" ? (
              <HelpCircle className="w-5 h-5 text-amber-400" />
            ) : currentUser?.role === "TEAM_LEAD" ? (
              <CheckSquare className="w-5 h-5 text-cyan-400" />
            ) : currentUser?.role === "INCOMING_EMPLOYEE" ? (
              <FileText className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            )}
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Action Recommended for {currentUser?.role?.replace("_", " ")}
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {currentUser?.role === "OUTGOING_EMPLOYEE"
                ? "Answer targeted gap questions to clarify missing runbook & timeline contradiction"
                : currentUser?.role === "TEAM_LEAD"
                ? "Review and approve extracted claims, and resolve the cutover date contradiction"
                : currentUser?.role === "INCOMING_EMPLOYEE"
                ? "Inspect the role-filtered, redacted handover packet and sign off on receipt"
                : "Verify the append-only SHA-256 custody ledger and monitor audit access logs"}
            </div>
          </div>
        </div>

        <Link
          href={
            currentUser?.role === "OUTGOING_EMPLOYEE"
              ? "/gaps"
              : currentUser?.role === "TEAM_LEAD"
              ? "/review"
              : currentUser?.role === "INCOMING_EMPLOYEE"
              ? "/handover"
              : "/ledger"
          }
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all hover:scale-105"
        >
          <span>Open Portal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Claims List with Verbatim Quotes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Extracted Claims & Evidence Linkages</h3>
            <p className="text-xs text-slate-400 font-mono">
              Every claim is linked to exact character spans in underlying ingested sources.
            </p>
          </div>
          <Link
            href="/graph"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            <span>Interactive Flow View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {claims.map((claim) => (
            <div key={claim.id} className="p-5 rounded-2xl glass-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <CategoryBadge category={claim.category} />
                  <div className="flex items-center gap-2">
                    <PermissionBadge level={claim.permission_level} />
                    <ConfidenceBadge state={claim.state} />
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mb-2 leading-snug">{claim.title}</h4>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">{claim.text}</p>
              </div>

              {/* Supporting Span */}
              <div>
                {claim.spans && claim.spans.length > 0 && claim.spans[0].quote ? (
                  <div className="p-3 rounded-xl bg-[#080C14] border border-white/5 font-mono text-[11px] text-cyan-300/90 italic leading-relaxed">
                    &ldquo;{claim.spans[0].quote}&rdquo;
                    <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 not-italic">
                      <span>Source: {claim.spans[0].source_name || "Document"}</span>
                      <span className="text-emerald-400 font-semibold">Exact Match Verified</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-[11px] text-rose-300 font-mono">
                    ⚠️ No verbatim quote found in source documents.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
