"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Claim, Conflict } from "@/lib/types";
import { ConfidenceBadge, CategoryBadge, PermissionBadge } from "@/components/common/Badge";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
  Quote,
  Shield,
  ArrowRight,
  GitCompare,
  FileCheck2,
} from "lucide-react";

export default function ReviewPage() {
  const { activeProject, currentUser, refreshProjects } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Edit claim state
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editReason, setEditReason] = useState("");

  // Conflict resolution state
  const [resolvingConflict, setResolvingConflict] = useState<Conflict | null>(null);
  const [conflictNotes, setConflictNotes] = useState("");
  const [preferredClaimId, setPreferredClaimId] = useState<string>("");

  useEffect(() => {
    if (activeProject) {
      loadReviewData(activeProject.id);
    }
  }, [activeProject]);

  const loadReviewData = async (projId: string) => {
    try {
      setLoading(true);
      const [claimsRes, conflictsRes] = await Promise.all([
        api.getClaims(projId),
        api.getConflicts(projId),
      ]);
      setClaims(claimsRes);
      setConflicts(conflictsRes);
    } catch (err) {
      console.error("Failed to load review data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claimId: string) => {
    try {
      setActionLoadingId(claimId);
      await api.approveClaim(claimId);
      if (activeProject) await loadReviewData(activeProject.id);
      await refreshProjects();
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    try {
      setActionLoadingId(claimId);
      await api.rejectClaim(claimId);
      if (activeProject) await loadReviewData(activeProject.id);
      await refreshProjects();
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim || !activeProject) return;

    try {
      setActionLoadingId(editingClaim.id);
      await api.updateClaim(editingClaim.id, {
        title: editTitle,
        text: editText,
        reason: editReason,
      });
      setEditingClaim(null);
      await loadReviewData(activeProject.id);
      await refreshProjects();
    } catch (err) {
      console.error("Edit error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolveConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingConflict || !activeProject) return;

    try {
      await api.resolveConflict(
        resolvingConflict.id,
        conflictNotes,
        preferredClaimId || undefined
      );
      setResolvingConflict(null);
      setConflictNotes("");
      await loadReviewData(activeProject.id);
      await refreshProjects();
    } catch (err) {
      console.error("Conflict resolve error:", err);
    }
  };

  if (!activeProject) {
    return <div className="text-center p-12 text-slate-400">Please select an active project.</div>;
  }

  const pendingClaims = claims.filter((c) => c.status === "DRAFT");
  const approvedClaims = claims.filter((c) => c.status === "APPROVED");
  const unresolvedConflicts = conflicts.filter((c) => c.status === "UNRESOLVED");

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            SUPERVISORY GOVERNANCE & APPROVALS
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {pendingClaims.length} Pending Review • {unresolvedConflicts.length} Unresolved Conflicts
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Team Lead Review & Conflict Resolution
        </h1>
        <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
          Nothing becomes official until a supervisor or knowledge holder signs off. Approvals promote verified claims to official status and record a tamper-evident block into the custody ledger.
        </p>
      </div>

      {/* Unresolved Conflicts Section */}
      {unresolvedConflicts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2 font-mono uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Contradictory Evidence Needing Resolution ({unresolvedConflicts.length})
          </h2>

          <div className="space-y-4">
            {unresolvedConflicts.map((cf) => (
              <div
                key={cf.id}
                className="p-6 rounded-2xl glass-panel border border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.08)] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Contradiction Detected Across Sources
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {cf.id.slice(0, 8)}</span>
                </div>

                <p className="text-sm font-semibold text-white">{cf.description}</p>

                {/* Side by side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Source A Quote */}
                  <div className="p-4 rounded-xl bg-[#080C14] border border-white/5 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">
                      Source A Verbatim Evidence (GitHub)
                    </span>
                    <p className="text-cyan-200 italic">&ldquo;{cf.source_a_quote}&rdquo;</p>
                  </div>

                  {/* Source B Quote */}
                  <div className="p-4 rounded-xl bg-[#080C14] border border-white/5 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">
                      Source B Verbatim Evidence (Slack)
                    </span>
                    <p className="text-amber-200 italic">&ldquo;{cf.source_b_quote}&rdquo;</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setResolvingConflict(cf);
                      setPreferredClaimId(cf.claim_id_2 || cf.claim_id_1);
                      setConflictNotes(
                        "Resolved in favor of Dave Chen's Slack statement postponing cutover to January 10 to guarantee security pen-testing sign-off."
                      );
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_16px_rgba(245,158,11,0.2)]"
                  >
                    <GitCompare className="w-4 h-4" />
                    <span>Resolve Contradiction</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Claims Review Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
          <CheckSquare className="w-4 h-4 text-cyan-400" />
          Claims Pending Supervisor Approval ({pendingClaims.length})
        </h2>

        {pendingClaims.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel text-center text-xs font-mono text-slate-400">
            No pending claims. All claims have been reviewed or approved.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-6 rounded-2xl glass-card space-y-4 border-l-4 border-l-cyan-400"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={claim.category} />
                    <PermissionBadge level={claim.permission_level} />
                    <ConfidenceBadge state={claim.state} />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Confidence: {Math.round(claim.confidence_score * 100)}%
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white leading-snug mb-1">{claim.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{claim.text}</p>
                </div>

                {/* Verbatim quote */}
                {claim.spans && claim.spans.length > 0 && claim.spans[0].quote && (
                  <div className="p-3.5 rounded-xl bg-[#080C14] border border-white/5 font-mono text-xs text-cyan-200/90 italic flex items-start gap-2">
                    <Quote className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div>&ldquo;{claim.spans[0].quote}&rdquo;</div>
                      <div className="mt-1 text-[10px] text-slate-500 not-italic">
                        Source: {claim.spans[0].source_name || "Document"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions: Approve / Edit / Reject */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setEditingClaim(claim);
                      setEditTitle(claim.title);
                      setEditText(claim.text);
                      setEditReason("Refined claim text during team lead review");
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Text</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReject(claim.id)}
                      disabled={actionLoadingId === claim.id}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(claim.id)}
                      disabled={actionLoadingId === claim.id}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoadingId === claim.id ? "Approving..." : "Approve & Verify"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Claim Modal */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0D1527] border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Edit Claim Text (Version Tracked)</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Claim Text</label>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Reason for Change</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Corrected dependency contract details"
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingClaim(null)}
                  className="px-4 py-2 rounded-xl bg-surface-raised text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save New Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {resolvingConflict && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0D1527] border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Resolve Contradiction & Authorize Truth
            </h3>
            <p className="text-xs text-slate-300 mb-4">{resolvingConflict.description}</p>

            <form onSubmit={handleResolveConflict} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-2 font-sans font-semibold">
                  Select Preferred Claim to Elevate to VERIFIED:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-raised border border-white/5 cursor-pointer">
                    <input
                      type="radio"
                      name="preferred"
                      checked={preferredClaimId === resolvingConflict.claim_id_2}
                      onChange={() => setPreferredClaimId(resolvingConflict.claim_id_2 || "")}
                    />
                    <span>Option B: Dave Chen Slack Postponement (Jan 10, 2027)</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-raised border border-white/5 cursor-pointer">
                    <input
                      type="radio"
                      name="preferred"
                      checked={preferredClaimId === resolvingConflict.claim_id_1}
                      onChange={() => setPreferredClaimId(resolvingConflict.claim_id_1)}
                    />
                    <span>Option A: GitHub Release Sprint (Dec 15, 2026)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">
                  Resolution Notes & Rationale
                </label>
                <textarea
                  rows={3}
                  value={conflictNotes}
                  onChange={(e) => setConflictNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10 font-sans">
                <button
                  type="button"
                  onClick={() => setResolvingConflict(null)}
                  className="px-4 py-2 rounded-xl bg-surface-raised text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Authorize Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
