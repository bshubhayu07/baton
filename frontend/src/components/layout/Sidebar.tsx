"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileInput,
  GitGraph,
  Clock,
  HelpCircle,
  CheckSquare,
  FileText,
  ShieldCheck,
  Settings,
  AlertCircle,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, activeProject } = useAuth();

  const navItems = [
    {
      label: "Project Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Data Ingestion",
      href: "/sources",
      icon: FileInput,
      badge: activeProject ? `${activeProject.sources_count} sources` : null,
    },
    {
      label: "Evidence Graph",
      href: "/graph",
      icon: GitGraph,
      badge: "React Flow",
    },
    {
      label: "Decisions Timeline",
      href: "/timeline",
      icon: Clock,
      badge: null,
    },
    {
      label: "Leaver Exit Interview",
      href: "/gaps",
      icon: HelpCircle,
      badge: activeProject && activeProject.open_gaps_count > 0 ? `${activeProject.open_gaps_count} Gaps` : null,
      highlight: true,
    },
    {
      label: "Team Lead Review",
      href: "/review",
      icon: CheckSquare,
      badge: activeProject && activeProject.unresolved_conflicts_count > 0 ? "1 Conflict" : null,
      leadOnly: true,
    },
    {
      label: "Successor Handover",
      href: "/handover",
      icon: FileText,
      badge: "Redacted",
    },
    {
      label: "Custody Ledger",
      href: "/ledger",
      icon: ShieldCheck,
      badge: "SHA-256",
    },
    {
      label: "Audit & Access Control",
      href: "/admin",
      icon: Settings,
      badge: null,
      adminOnly: true,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/[0.08] bg-[#080C14]/90 backdrop-blur-2xl flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-500 font-mono">
            Platform Workflow
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-[0_0_16px_rgba(0,240,255,0.1)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : item.highlight
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-surface-raised text-slate-400 border border-white/5"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Role clearance indicator bottom card */}
      <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/[0.06] text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400">Current Clearance</span>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold">
            {currentUser?.role === "ORG_ADMIN"
              ? "RESTRICTED (MAX)"
              : currentUser?.role === "TEAM_LEAD"
              ? "CONFIDENTIAL"
              : currentUser?.role === "OUTGOING_EMPLOYEE"
              ? "CONFIDENTIAL"
              : "INTERNAL"}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              currentUser?.role === "ORG_ADMIN"
                ? "w-full bg-purple-500"
                : currentUser?.role === "TEAM_LEAD"
                ? "w-3/4 bg-cyan-400"
                : currentUser?.role === "OUTGOING_EMPLOYEE"
                ? "w-3/4 bg-amber-400"
                : "w-2/4 bg-emerald-400"
            }`}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
          {currentUser?.role === "INCOMING_EMPLOYEE"
            ? "Restricted HR and compensation data is automatically redacted from your view."
            : "Authorized to review underlying evidence spans."}
        </p>
      </div>
    </aside>
  );
}
