"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Claim, ClaimCategory } from "@/lib/types";
import { ConfidenceBadge, CategoryBadge, PermissionBadge } from "@/components/common/Badge";
import { Clock, Quote, CheckCircle2, Calendar, GitCommit } from "lucide-react";

export default function TimelinePage() {
  const { activeProject } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  useEffect(() => {
    if (activeProject) {
      loadTimeline(activeProject.id);
    }
  }, [activeProject]);

  const loadTimeline = async (projId: string) => {
    try {
      setLoading(true);
      const res = await api.getClaims(projId);
      // Sort chronologically
      res.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setClaims(res);
    } catch (err) {
      console.error("Failed to load timeline claims:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeProject) {
    return <div className="text-center p-12 text-slate-400">Please select an active project.</div>;
  }

  const filtered = claims.filter(
    (c) => filterCategory === "ALL" || c.category === filterCategory
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-cyan-400" />
            Decisions & Milestones Timeline
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Chronological narrative of engineering decisions and justifications linked to primary sources.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-surface-raised p-1 rounded-xl border border-white/10 text-xs font-mono">
          {["ALL", "DECISION", "REASONING", "OWNERSHIP", "RISK"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterCategory === cat
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 md:pl-8 border-l-2 border-cyan-500/30 space-y-8 my-8">
        {filtered.map((claim, idx) => {
          const firstSpan = claim.spans?.[0];
          return (
            <div key={claim.id} className="relative group">
              {/* Timeline marker dot */}
              <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#080C14] border-2 border-cyan-400 group-hover:scale-125 transition-transform flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>

              {/* Timeline Entry Card */}
              <div className="p-6 rounded-2xl glass-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={claim.category} />
                    <ConfidenceBadge state={claim.state} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{new Date(claim.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{claim.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{claim.text}</p>

                {/* Verbatim quote */}
                {firstSpan?.quote && (
                  <div className="p-3.5 rounded-xl bg-[#080C14] border border-white/5 font-mono text-xs text-cyan-200/90 italic flex items-start gap-2">
                    <Quote className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div>&ldquo;{firstSpan.quote}&rdquo;</div>
                      <div className="mt-1.5 text-[10px] text-slate-500 not-italic flex items-center gap-2">
                        <span>Source: {firstSpan.source_name || "Document"}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">Exact characters [{firstSpan.start_offset}:{firstSpan.end_offset}]</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
