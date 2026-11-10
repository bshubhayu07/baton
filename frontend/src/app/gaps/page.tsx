"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { GapQuestion } from "@/lib/types";
import {
  HelpCircle,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Quote,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function ExitInterviewPage() {
  const { activeProject, currentUser, refreshProjects } = useAuth();
  const [questions, setQuestions] = useState<GapQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject) {
      loadGaps(activeProject.id);
    }
  }, [activeProject]);

  const loadGaps = async (projId: string) => {
    try {
      setLoading(true);
      const res = await api.getGapQuestions(projId);
      setQuestions(res);
    } catch (err) {
      console.error("Failed to load gap questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggested = (gapId: string, suggestion: string) => {
    setAnswers((prev) => ({ ...prev, [gapId]: suggestion }));
  };

  const handleSubmitAnswer = async (gapId: string) => {
    const text = answers[gapId];
    if (!text || !text.trim() || !activeProject) return;

    try {
      setSubmittingId(gapId);
      const updated = await api.answerGapQuestion(gapId, text);
      setSuccessMessage(
        "Response submitted! Automatically normalized as an authoritative Exit Interview source, created a verified claim, and stamped in the custody ledger."
      );
      await loadGaps(activeProject.id);
      await refreshProjects();
    } catch (err) {
      console.error("Failed to answer gap:", err);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (!activeProject) {
    return <div className="text-center p-12 text-slate-400">Please select an active project.</div>;
  }

  const openQuestions = questions.filter((q) => q.status === "OPEN");
  const answeredQuestions = questions.filter((q) => q.status !== "OPEN");

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            SIGNATURE WORKFLOW: GAP-DRIVEN EXIT INTERVIEW
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {openQuestions.length} Open Questions
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Outgoing Knowledge Holder Clarifications
        </h1>
        <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
          Questions automatically synthesized from missing evidence and contradicting sources. Responses are ingested as primary source material and converted into evidence-verified claims.
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-start justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {openQuestions.length === 0 && answeredQuestions.length > 0 && (
          <div className="p-8 rounded-2xl glass-panel text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">All Gap Questions Resolved!</h3>
            <p className="text-xs text-slate-400 font-mono">
              The outgoing employee has verified all missing items and contradictions.
            </p>
          </div>
        )}

        {openQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="p-6 rounded-2xl glass-panel border border-amber-500/20 shadow-[0_0_24px_rgba(245,158,11,0.06)] space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
                {q.category.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-400 font-mono">Question #{idx + 1}</span>
            </div>

            <h3 className="text-base font-bold text-white leading-snug">{q.question}</h3>

            {q.context && (
              <p className="text-xs text-slate-400 font-mono bg-[#080C14] p-3 rounded-xl border border-white/5">
                Context: {q.context}
              </p>
            )}

            {/* Suggested quick responses */}
            {q.suggested_answers && q.suggested_answers.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-cyan-400 font-semibold block">
                  Quick Suggested Responses (Click to auto-populate):
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {q.suggested_answers.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => handleSelectSuggested(q.id, sug)}
                      className="text-left p-2.5 rounded-xl bg-surface-raised/60 hover:bg-surface-raised border border-white/5 hover:border-cyan-500/30 text-xs text-slate-300 transition-colors"
                    >
                      💡 {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-2 pt-2">
              <textarea
                rows={3}
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                placeholder="Type authoritative response or select a suggested answer above..."
                className="w-full p-3 rounded-xl bg-[#080C14] text-xs text-white border border-white/10 focus:outline-none focus:border-cyan-400 font-sans"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-slate-500">
                  Submitting will create an official Exit Interview claim with verbatim quotation.
                </span>

                <button
                  type="button"
                  onClick={() => handleSubmitAnswer(q.id)}
                  disabled={submittingId === q.id || !answers[q.id]?.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_16px_rgba(245,158,11,0.25)] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingId === q.id ? "Converting..." : "Submit Answer"}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Answered Questions Section */}
        {answeredQuestions.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-slate-400 font-mono uppercase tracking-wider">
              Previously Answered & Converted Claims ({answeredQuestions.length})
            </h3>
            <div className="space-y-3">
              {answeredQuestions.map((q) => (
                <div key={q.id} className="p-4 rounded-xl glass-card border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{q.question}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                      CONVERTED TO CLAIM
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080C14] border border-white/5 text-xs text-emerald-300 font-mono mt-2">
                    &ldquo;{q.answer_text}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
