"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import {
  FolderGit2,
  Plus,
  ArrowRight,
  Users,
  FileInput,
  FileCheck2,
  AlertTriangle,
  X,
} from "lucide-react";

export default function ProjectsPage() {
  const { projects, activeProject, setActiveProject, refreshProjects } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      const newProj = await api.createProject(name, description);
      await refreshProjects();
      setActiveProject(newProj);
      setShowModal(false);
      setName("");
      setDescription("");
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-cyan-400" />
            Project Handover Rooms
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Dedicated secure continuity workspaces isolating project evidence, RBAC boundaries, and custody ledgers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_16px_rgba(0,240,255,0.25)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Handover Room</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const isActive = activeProject?.id === proj.id;
          return (
            <div
              key={proj.id}
              className={`p-6 rounded-2xl glass-card flex flex-col justify-between transition-all ${
                isActive ? "border-cyan-500/50 shadow-[0_0_24px_rgba(0,240,255,0.12)]" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    ROOM ID: {proj.id.slice(0, 8)}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      CURRENTLY ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-2 leading-snug">{proj.name}</h3>
                <p className="text-xs text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                  {proj.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-4 pt-3 border-t border-white/5">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-surface-raised/40 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Sources</span>
                    <span className="text-white font-bold">{proj.sources_count}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-raised/40 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Verified</span>
                    <span className="text-emerald-400 font-bold">{proj.verified_claims_count}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-raised/40 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Open Gaps</span>
                    <span className="text-amber-400 font-bold">{proj.open_gaps_count}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveProject(proj)}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-surface-raised hover:bg-white/10 text-white"
                    }`}
                  >
                    {isActive ? "Active Room" : "Switch to Room"}
                  </button>

                  <Link
                    href="/"
                    onClick={() => setActiveProject(proj)}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0D1527] border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-cyan-400" />
                Create New Handover Room
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Room Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Identity & Auth V3 Transition"
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context, outgoing holder, incoming successor, cutover scope..."
                  className="w-full px-3 py-2 bg-surface-raised rounded-xl text-white border border-white/10 focus:outline-none focus:border-cyan-400 font-sans text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10 font-sans">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-raised text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  {creating ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
