"use client";

import React, { useState } from "react";
import { X, Quote, Shield, FileText, CheckCircle2, AlertTriangle, Copy, Check, Hash } from "lucide-react";
import { ConfidenceBadge, CategoryBadge, PermissionBadge } from "@/components/common/Badge";

interface NodeInspectorDrawerProps {
  selectedNode: any | null;
  sourceText?: string;
  onClose: () => void;
}

export function NodeInspectorDrawer({ selectedNode, sourceText, onClose }: NodeInspectorDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!selectedNode) return null;

  const data = selectedNode.data;
  const isClaim = data.node_type === "CLAIM";
  const isSource = data.node_type === "SOURCE";

  const handleCopyQuote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render highlighted text inside raw source
  const renderHighlightedSource = () => {
    const raw = sourceText || data.full_raw_text || "";
    const quote = data.quote;
    const start = data.start_offset;
    const end = data.end_offset;

    if (!quote || start === undefined || end === undefined || start < 0) {
      return (
        <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
          {raw}
        </div>
      );
    }

    const before = raw.slice(0, start);
    const highlighted = raw.slice(start, end);
    const after = raw.slice(end);

    return (
      <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
        <span>{before}</span>
        <mark className="bg-cyan-500/25 text-cyan-200 border-b-2 border-cyan-400 px-1 py-0.5 rounded shadow-[0_0_12px_rgba(0,240,255,0.3)] font-semibold">
          {highlighted}
        </mark>
        <span>{after}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] max-w-full bg-[#0D1527]/95 border-l border-white/10 shadow-2xl z-50 backdrop-blur-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-surface-raised border border-white/10 text-cyan-400">
            {isClaim ? <Quote className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {isClaim ? "Evidence Span Inspector" : "Source Document Inspector"}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {isClaim ? `Claim ID: ${data.id.slice(0, 8)}...` : `Source ID: ${data.id.slice(0, 8)}...`}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="p-5 overflow-y-auto space-y-6 flex-1">
        {isClaim && (
          <>
            {/* Status & Badges */}
            <div className="flex items-center justify-between gap-2">
              <CategoryBadge category={data.category} />
              <div className="flex items-center gap-2">
                <PermissionBadge level={data.permission_level} />
                <ConfidenceBadge state={data.state} />
              </div>
            </div>

            {/* Title & Extracted Claim Text */}
            <div>
              <h4 className="text-base font-bold text-white mb-2 leading-snug">{data.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-surface-raised/40 p-3.5 rounded-xl border border-white/5">
                {data.text}
              </p>
            </div>

            {/* Verbatim Supporting Quote Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERBATIM SOURCE EVIDENCE
                </span>
                {data.quote && (
                  <button
                    onClick={() => handleCopyQuote(data.quote)}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy Quote"}</span>
                  </button>
                )}
              </div>

              {data.quote ? (
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 font-mono italic leading-relaxed shadow-[0_0_16px_rgba(0,240,255,0.08)]">
                  &ldquo;{data.quote}&rdquo;
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 font-mono flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">No Verbatim Quote Found</div>
                    <div className="text-[11px] text-rose-400/90 mt-1">
                      This claim was marked MISSING because no ground-truth text verified it.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Metadata Box */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface-raised/60 border border-white/5">
                <span className="text-[10px] text-slate-400 block mb-1">Character Span Offsets</span>
                <span className="text-cyan-300 font-bold">
                  [{data.start_offset} : {data.end_offset}]
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Length: {data.end_offset - data.start_offset} chars
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-raised/60 border border-white/5">
                <span className="text-[10px] text-slate-400 block mb-1">Source Origin</span>
                <span className="text-white font-bold truncate block">{data.source_name || "Unknown"}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Span Verified: {data.verified ? "YES" : "NO"}
                </span>
              </div>
            </div>

            {/* Full Source Context with Highlight */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                Underlying Source Document (Verbatim Highlight)
              </span>
              <div className="p-4 rounded-xl bg-[#080C14] border border-white/10 max-h-64 overflow-y-auto">
                {renderHighlightedSource()}
              </div>
            </div>
          </>
        )}

        {isSource && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-300 uppercase">
                {data.type} SOURCE
              </span>
              <PermissionBadge level={data.permission_tag} />
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-2">{data.name}</h4>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 font-mono">
                Full Ingested Text
              </span>
              <div className="p-4 rounded-xl bg-[#080C14] border border-white/10 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {data.full_raw_text || data.raw_text}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-white/10 bg-[#080C14]/60 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Baton Verbatim Verifier</span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-surface-raised hover:bg-white/10 text-white font-medium transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
