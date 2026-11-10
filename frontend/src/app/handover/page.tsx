"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { HandoverPacket, UserRole } from "@/lib/types";
import { ConfidenceBadge, CategoryBadge, PermissionBadge } from "@/components/common/Badge";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  Quote,
  Eye,
  Check,
  Award,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function HandoverPage() {
  const { activeProject, currentUser, refreshProjects } = useAuth();
  const [packet, setPacket] = useState<HandoverPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | undefined>(undefined);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState(
    "I acknowledge receipt and full review of this verified handover packet as incoming staff engineer."
  );
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledgedSuccess, setAcknowledgedSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject) {
      loadHandover(activeProject.id, simulatedRole);
    }
  }, [activeProject, simulatedRole]);

  const loadHandover = async (projId: string, role?: UserRole) => {
    try {
      setLoading(true);
      const res = await api.getHandoverPacket(projId, role);
      setPacket(res);
    } catch (err) {
      console.error("Failed to load handover packet:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!activeProject) return;
    try {
      setAcknowledging(true);
      const res = await api.acknowledgeHandover(activeProject.id, acknowledgeNotes);
      setAcknowledgedSuccess(res.entry_hash);
      await loadHandover(activeProject.id, simulatedRole);
      await refreshProjects();
    } catch (err) {
      console.error("Acknowledgment error:", err);
    } finally {
      setAcknowledging(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeProject || !packet) {
    return <div className="text-center p-12 text-slate-400">Loading handover packet...</div>;
  }

  const isSuccessorView = packet.generated_for_role === "INCOMING_EMPLOYEE";

  return (
    <div className="space-y-8 max-w-4xl mx-auto print:max-w-none print:m-0">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              OFFICIAL SUCCESSOR HANDOVER PACKET
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Role: {packet.generated_for_role}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Knowledge Continuity Dossier
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Generated at {new Date(packet.generated_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Simulated role preview for supervisors */}
          {(currentUser?.role === "TEAM_LEAD" || currentUser?.role === "ORG_ADMIN") && (
            <div className="flex items-center gap-2 bg-surface-raised px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Preview as:</span>
              <select
                value={simulatedRole || currentUser.role}
                onChange={(e) => setSimulatedRole(e.target.value as UserRole)}
                className="bg-transparent text-white font-bold focus:outline-none"
              >
                <option value="INCOMING_EMPLOYEE" className="bg-[#0D1527]">
                  Incoming Employee (Redacted)
                </option>
                <option value="TEAM_LEAD" className="bg-[#0D1527]">
                  Team Lead (Confidential)
                </option>
                <option value="ORG_ADMIN" className="bg-[#0D1527]">
                  Org Admin (Unrestricted)
                </option>
              </select>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-raised hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {/* Redaction Notice Card */}
      {packet.is_redacted && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-200 flex items-start gap-3 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
          <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white flex items-center gap-2">
              Hardened Role Redaction Engine Active
              <span className="px-2 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                SEC-RBAC
              </span>
            </div>
            <p className="text-cyan-200/90 leading-relaxed text-[11px]">
              Restricted documents (including HR salary chats, contractor invoices, and unreleased credentials) have been filtered out and stripped before rendering for the incoming employee. All engineering decisions, dependencies, and risks remain 100% grounded in verified source evidence.
            </p>
          </div>
        </div>
      )}

      {/* Dossier Body */}
      <div className="space-y-8 glass-panel p-6 md:p-8 rounded-3xl border border-white/10 print:border-none print:p-0">
        {/* Section 1: Architectural Decisions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
                1
              </span>
              Key Architectural Decisions & Rationale ({packet.decisions.length})
            </h2>
          </div>

          <div className="space-y-3">
            {packet.decisions.map((item: any) => (
              <div key={item.id} className="p-4 rounded-xl bg-surface-raised/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <ConfidenceBadge state={item.state} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                {item.spans?.[0]?.quote && (
                  <div className="p-2.5 rounded-lg bg-[#080C14] border border-white/5 font-mono text-[11px] text-cyan-200/90 italic">
                    &ldquo;{item.spans[0].quote}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Codebase & Service Ownership */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              Codebase & Operational Ownership ({packet.ownership.length})
            </h2>
          </div>

          <div className="space-y-3">
            {packet.ownership.map((item: any) => (
              <div key={item.id} className="p-4 rounded-xl bg-surface-raised/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <ConfidenceBadge state={item.state} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                {item.spans?.[0]?.quote && (
                  <div className="p-2.5 rounded-lg bg-[#080C14] border border-white/5 font-mono text-[11px] text-purple-200/90 italic">
                    &ldquo;{item.spans[0].quote}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Dependencies */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">
                3
              </span>
              Upstream & Downstream Dependencies ({packet.dependencies.length})
            </h2>
          </div>

          <div className="space-y-3">
            {packet.dependencies.map((item: any) => (
              <div key={item.id} className="p-4 rounded-xl bg-surface-raised/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <ConfidenceBadge state={item.state} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                {item.spans?.[0]?.quote && (
                  <div className="p-2.5 rounded-lg bg-[#080C14] border border-white/5 font-mono text-[11px] text-amber-200/90 italic">
                    &ldquo;{item.spans[0].quote}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Risks & Failure Modes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-mono font-bold">
                4
              </span>
              Operational Risks & Unresolved Gaps ({packet.risks.length + packet.unresolved_issues.length})
            </h2>
          </div>

          <div className="space-y-3">
            {[...packet.risks, ...packet.unresolved_issues].map((item: any) => (
              <div key={item.id} className="p-4 rounded-xl bg-surface-raised/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <ConfidenceBadge state={item.state} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                {item.spans?.[0]?.quote && (
                  <div className="p-2.5 rounded-lg bg-[#080C14] border border-white/5 font-mono text-[11px] text-rose-200/90 italic">
                    &ldquo;{item.spans[0].quote}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Cryptographic Acknowledgments Log */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Formal Acknowledgments & Custody Records ({packet.acknowledgments.length})
          </h2>

          {packet.acknowledgments.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono">
              No successor acknowledgments recorded yet. Complete receipt sign-off below.
            </p>
          ) : (
            <div className="space-y-2">
              {packet.acknowledgments.map((ack) => (
                <div key={ack.id} className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="font-bold">{ack.actor_name} ({ack.actor_role})</span>
                    <span>{new Date(ack.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 not-italic">{ack.notes}</p>
                  <div className="text-[10px] text-emerald-400/80 truncate">
                    Custody Block Hash: {ack.entry_hash}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Successor Acknowledgment Sign-off Box */}
      <div className="p-6 rounded-2xl glass-panel-glow border border-emerald-500/30 space-y-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Successor Acknowledgment & Knowledge Acceptance
            </h3>
            <p className="text-xs text-slate-300 font-mono">
              Signing this generates an immutable cryptographic block on the Baton custody ledger.
            </p>
          </div>
        </div>

        {acknowledgedSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold">Handover Successfully Acknowledged!</div>
              <div className="text-[11px] text-emerald-300 truncate">
                Custody Chain Block Hash: {acknowledgedSuccess}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={2}
              value={acknowledgeNotes}
              onChange={(e) => setAcknowledgeNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#080C14] text-xs text-white border border-white/10 font-sans focus:outline-none focus:border-emerald-400"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Signing as: {currentUser?.full_name} ({currentUser?.role})
              </span>
              <button
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{acknowledging ? "Signing Block..." : "Acknowledge Handover"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
