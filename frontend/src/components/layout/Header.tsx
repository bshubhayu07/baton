"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import {
  Layers,
  ChevronDown,
  User,
  Shield,
  Sparkles,
  RefreshCw,
  FolderGit2,
  Check,
} from "lucide-react";

export function Header() {
  const {
    currentUser,
    demoUsers,
    activeProject,
    projects,
    switchRole,
    setActiveProject,
    loadDemoProject,
    loading,
  } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const roleColors: Record<UserRole, string> = {
    ORG_ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    TEAM_LEAD: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    OUTGOING_EMPLOYEE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    INCOMING_EMPLOYEE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const roleTitles: Record<UserRole, string> = {
    ORG_ADMIN: "Org Admin",
    TEAM_LEAD: "Team Lead",
    OUTGOING_EMPLOYEE: "Outgoing Engineer",
    INCOMING_EMPLOYEE: "Successor Engineer",
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/[0.08] bg-[#080C14]/80 backdrop-blur-xl px-6 flex items-center justify-between">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-[0_0_16px_rgba(0,240,255,0.35)]">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              BATON
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.0
              </span>
            </span>
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised/80 hover:bg-surface-raised border border-white/10 text-xs font-medium text-slate-200 transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[180px] truncate">
              {activeProject ? activeProject.name : "Select Project"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {projectDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#0D1527] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Project Rooms
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProject(p);
                    setProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    activeProject?.id === p.id
                      ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {activeProject?.id === p.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center status pill */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-raised/40 border border-white/5 text-[11px] font-mono text-slate-400">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>EVIDENCE-VERIFIED KNOWLEDGE CHAIN</span>
        <span className="text-slate-600">|</span>
        <span className="text-cyan-400 font-medium">OFFLINE READY</span>
      </div>

      {/* Right controls: Demo Seeder & Persona Switcher */}
      <div className="flex items-center gap-3">
        {/* Load Demo button */}
        <button
          onClick={loadDemoProject}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all hover:shadow-[0_0_12px_rgba(0,240,255,0.2)] disabled:opacity-50"
          title="Reset and reload the Payments V2 demo scenario"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Load Demo Data</span>
        </button>

        {/* Persona Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-raised/90 hover:bg-surface-raised border border-white/10 text-xs text-white transition-all hover:border-cyan-500/40"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {currentUser?.full_name ? currentUser.full_name[0] : "U"}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-[12px] leading-tight">
                {currentUser?.full_name?.split("(")[0].trim() || "User"}
              </span>
              <span className="text-[10px] text-cyan-400">
                {currentUser?.role ? roleTitles[currentUser.role] : "Role"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0D1527] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                <span>Switch Persona / Role</span>
                <span className="text-[10px] text-cyan-400 font-mono">RBAC DEMO</span>
              </div>
              <div className="space-y-1">
                {demoUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchRole(u);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        isCurrent
                          ? "bg-cyan-500/15 border border-cyan-500/30 text-white"
                          : "hover:bg-white/5 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 border border-white/5">
                          {u.full_name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold leading-snug">{u.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          roleColors[u.role]
                        }`}
                      >
                        {roleTitles[u.role]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
