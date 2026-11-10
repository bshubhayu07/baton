"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { EvidenceGraph } from "@/components/graph/EvidenceGraph";
import { GitGraph, Shield, CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";

export default function GraphPage() {
  const { activeProject } = useAuth();

  if (!activeProject) {
    return <div className="text-center p-12 text-slate-400">Please select an active project.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Page Title & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <GitGraph className="w-6 h-6 text-cyan-400" />
            Interactive Evidence Graph
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Explore claims, underlying sources, and contradiction edges. Click any node to open the verbatim span inspector.
          </p>
        </div>

        {/* Confidence State Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono bg-surface-raised/80 px-3 py-1.5 rounded-xl border border-white/10">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            VERIFIED
          </span>
          <span className="flex items-center gap-1.5 text-sky-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_#38BDF8]" />
            INFERRED
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
            CONFLICTING
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]" />
            MISSING
          </span>
        </div>
      </div>

      {/* React Flow Graph */}
      <EvidenceGraph projectId={activeProject.id} />
    </div>
  );
}
