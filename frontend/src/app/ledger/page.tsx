"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { CustodyLedgerEntry, CustodyVerificationResult } from "@/lib/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Link as LinkIcon,
  User,
  Clock,
  Layers,
  FileCheck2,
} from "lucide-react";

export default function LedgerPage() {
  const { activeProject } = useAuth();
  const [entries, setEntries] = useState<CustodyLedgerEntry[]>([]);
  const [verification, setVerification] = useState<CustodyVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (activeProject) {
      loadLedger(activeProject.id);
    }
  }, [activeProject]);

  const loadLedger = async (projId: string) => {
    try {
      setLoading(true);
      const [listRes, verifyRes] = await Promise.all([
        api.getCustodyLedger(projId),
        api.verifyCustodyLedger(projId),
      ]);
      setEntries(listRes);
      setVerification(verifyRes);
    } catch (err) {
      console.error("Failed to load custody ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    if (!activeProject) return;
    try {
      setVerifying(true);
      const res = await api.verifyCustodyLedger(activeProject.id);
      setVerification(res);
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  if (!activeProject) {
    return <div className="text-center p-12 text-slate-400">Please select an active project.</div>;
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "APPROVED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "EXTRACTED":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "GAP_ANSWERED":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "CONFLICT_RESOLVED":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "HANDOVER_ACKNOWLEDGED":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "REJECTED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              SIGNATURE FEATURE: CRYPTOGRAPHIC CUSTODY LEDGER
            </span>
            <span className="text-xs text-slate-400 font-mono">
              SHA-256 Hash Chained
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            Append-Only Custody Ledger
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
            Every claim creation, human approval, gap answer, conflict resolution, and handover acknowledgment is cryptographically chained and verifiable.
          </p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
          <span>{verifying ? "Auditing Hash Chain..." : "Verify Chain Integrity"}</span>
        </button>
      </div>

      {/* Verification Status Banner */}
      {verification && (
        <div
          className={`p-5 rounded-2xl glass-panel border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            verification.valid
              ? "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
              : "border-rose-500/40 bg-rose-950/20"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                verification.valid
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {verification.valid ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{verification.valid ? "Cryptographic Chain Verified" : "Chain Integrity Broken"}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {verification.total_entries} Blocks
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{verification.message}</p>
            </div>
          </div>

          {verification.chain_head && (
            <div className="text-right font-mono text-[11px] text-slate-400 bg-[#080C14] px-3 py-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-500 block">HEAD BLOCK HASH</span>
              <span className="text-cyan-300 font-semibold truncate block max-w-xs">
                {verification.chain_head}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Blockchain Blocks List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 font-mono uppercase tracking-wider">
          Ledger Block Stream ({entries.length} Blocks)
        </h2>

        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const isGenesis = entry.prev_hash === "0".repeat(64);
            return (
              <div
                key={entry.id}
                className="p-5 rounded-2xl glass-card space-y-3 font-mono text-xs border border-white/10 hover:border-cyan-500/30 transition-all"
              >
                {/* Block header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-white/10 text-cyan-400 font-bold text-[11px]">
                      BLOCK #{idx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getActionColor(
                        entry.action
                      )}`}
                    >
                      {entry.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Role: {entry.actor_role}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Details Json */}
                {entry.details_json && Object.keys(entry.details_json).length > 0 && (
                  <div className="p-3 rounded-xl bg-[#080C14] border border-white/5 text-[11px] text-slate-300 space-y-1">
                    {Object.entries(entry.details_json).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-slate-500 font-semibold min-w-[120px]">{k}:</span>
                        <span className="text-cyan-200 truncate">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hashes connection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[10px] text-slate-400 border-t border-white/5">
                  <div className="truncate">
                    <span className="text-slate-500 block mb-0.5">PREVIOUS HASH:</span>
                    <span className="text-slate-400">
                      {isGenesis ? "GENESIS_ROOT (0000000000...)" : entry.prev_hash}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500 block mb-0.5">ENTRY HASH (SHA-256):</span>
                    <span className="text-cyan-400 font-bold">{entry.entry_hash}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
