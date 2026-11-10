"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { PermissionBadge } from "@/components/common/Badge";
import { Github, MessageSquare, FileText, Table2, Sparkles } from "lucide-react";

export const SourceNode = memo(({ data }: { data: any }) => {
  const getIcon = () => {
    switch (data.type) {
      case "github":
        return <Github className="w-4 h-4 text-purple-400" />;
      case "slack":
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case "meeting_notes":
        return <FileText className="w-4 h-4 text-sky-400" />;
      case "task_board":
        return <Table2 className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="w-72 rounded-2xl bg-[#0F172A]/90 border border-purple-500/30 p-3.5 text-left transition-all cursor-pointer hover:border-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.15)]">
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-purple-400 !border-slate-900" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface-raised border border-white/10">
            {getIcon()}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold">
            SOURCE ITEM
          </span>
        </div>
        <PermissionBadge level={data.permission_tag} />
      </div>

      <h4 className="text-xs font-bold text-white mb-1 truncate">{data.name}</h4>
      <p className="text-[11px] text-slate-400 font-mono line-clamp-2 leading-relaxed">
        {data.raw_text}
      </p>

      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-purple-300/80 font-mono">
        <span>Type: {data.type}</span>
        <span>Click to view raw</span>
      </div>
    </div>
  );
});

SourceNode.displayName = "SourceNode";
