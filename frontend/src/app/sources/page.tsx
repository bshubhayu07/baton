"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { SourceItem, SourceType, PermissionLevel } from "@/lib/types";
import { PermissionBadge } from "@/components/common/Badge";
import {
  FileInput,
  Upload,
  Plus,
  Github,
  MessageSquare,
  FileText,
  Table2,
  CheckCircle2,
  Lock,
  Eye,
  X,
} from "lucide-react";

export default function SourcesPage() {
  const { activeProject, refreshProjects } = useAuth();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<SourceType>("github");
  const [permissionTag, setPermissionTag] = useState<PermissionLevel>("INTERNAL");
  const [rawText, setRawText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeProject) {
      loadSources(activeProject.id);
    }
  }, [activeProject]);

  const loadSources = async (projId: string) => {
    try {
      setLoading(true);
      const res = await api.getSources(projId);
      setSources(res);
    } catch (err) {
      console.error("Failed to load sources:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    try {
      setSubmitting(true);
      if (uploadFile) {
        await api.uploadSourceFile(activeProject.id, uploadFile, name, type, permissionTag);
      } else {
        await api.ingestSource(activeProject.id, name, type, rawText, permissionTag);
      }
      setShowModal(false);
      setName("");
      setRawText("");
      setUploadFile(null);
      await loadSources(activeProject.id);
      await refreshProjects();
    } catch (err) {
      console.error("Ingestion failed:", err);
      alert("Error ingesting source. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSourceIcon = (t: SourceType) => {
    switch (t) {
      case "github":
        return <Github className="w-4 h-4 text-purple-400" />;
      case "slack":
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case "meeting_notes":
        return <FileText className="w-4 h-4 text-sky-400" />;
      case "task_board":
        return <Table2 className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Data Integration & Ingestion Pipeline</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Connect enterprise sources. Every claim will be linked directly to verbatim quotations in these documents.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_16px_rgba(0,240,255,0.25)]"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest New Source</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div key={src.id} className="p-5 rounded-2xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-surface-raised border border-white/10">
                    {getSourceIcon(src.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{src.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Type: {src.type}
                    </span>
                  </div>
                </div>
                <PermissionBadge level={src.permission_tag} />
              </div>

              <p className="text-xs text-slate-300 font-mono line-clamp-3 bg-[#080C14] p-3 rounded-xl border border-white/5 mb-4">
                {src.raw_text}
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{src.raw_text.length} characters</span>
              <button
                onClick={() => setSelectedSource(src)}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Raw</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ingestion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0D1527] border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileInput className="w-5 h-5 text-cyan-400" />
                Ingest Source Document
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Document Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GitHub: payments-v2 PR #142"
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-sans font-semibold">Source Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SourceType)}
                    className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="github">GitHub Repo / PR Export</option>
                    <option value="slack">Slack Channel JSON</option>
                    <option value="meeting_notes">Meeting Notes / Doc</option>
                    <option value="task_board">Task Board CSV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-sans font-semibold">Permission Tag</label>
                  <select
                    value={permissionTag}
                    onChange={(e) => setPermissionTag(e.target.value as PermissionLevel)}
                    className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED (HR/Finance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">
                  Upload File or Paste Text
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-raised file:text-cyan-400 hover:file:bg-cyan-500/10 cursor-pointer mb-2"
                />
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Or paste verbatim raw text / JSON / Markdown here..."
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!rawText && !uploadFile)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? "Ingesting..." : "Ingest & Chunk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raw Text Viewer Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0D1527] border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">{selectedSource.name}</h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Permission: {selectedSource.permission_tag}
                </span>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 rounded-xl bg-[#080C14] border border-white/5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {selectedSource.raw_text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
