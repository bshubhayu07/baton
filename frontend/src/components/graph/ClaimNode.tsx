"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ConfidenceBadge, CategoryBadge, PermissionBadge } from "@/components/common/Badge";
import { Quote, AlertCircle, FileCheck2 } from "lucide-react";

export const ClaimNode = memo(({ data }: { data: any }) => {
  const isMissing = data.state === "MISSING";
  const isConflicting = data.state === "CONFLICTING";
  const isVerified = data.state === "VERIFIED";

  return (
    <div
      className={`w-80 rounded-2xl glass-panel p-4 text-left transition-all cursor-pointer hover:scale-[1.02] ${
        isVerified
          ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          : isConflicting
          ? "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          : isMissing
          ? "border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
          : "border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-cyan-400 !border-slate-900" />

      {/* Header tags */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <CategoryBadge category={data.category} />
        <ConfidenceBadge state={data.state} />
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-white mb-1.5 leading-snug line-clamp-2">
        {data.title}
      </h4>

      {/* Body preview */}
      <p className="text-xs text-slate-300 mb-3 line-clamp-3 leading-relaxed">
        {data.text}
      </p>

      {/* Verbatim quote pill */}
      {data.quote ? (
        <div className="p-2 rounded-lg bg-surface-raised/80 border border-white/5 text-[11px] text-cyan-200/90 font-mono italic line-clamp-2 flex items-start gap-1.5">
          <Quote className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span>&ldquo;{data.quote}&rdquo;</span>
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[11px] text-rose-300 font-mono flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>No verbatim quote backing (Evidence missing)</span>
        </div>
      )}

      {/* Footer metadata */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <FileCheck2 className="w-3 h-3 text-cyan-400" />
          {data.verified ? "Verified Quote" : "Span Unlinked"}
        </span>
        <span>Score: {Math.round(data.confidence * 100)}%</span>
      </div>
    </div>
  );
});

ClaimNode.displayName = "ClaimNode";
