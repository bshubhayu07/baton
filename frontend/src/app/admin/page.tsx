"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AuditLogItem, User, UserRole } from "@/lib/types";
import {
  ShieldCheck,
  Users,
  Settings,
  Lock,
  FileCheck2,
  Clock,
  Shield,
  Eye,
  CheckCircle2,
} from "lucide-react";

export default function AdminPage() {
  const { activeProject, currentUser, refreshProjects } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [activeProject]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [auditRes, usersRes] = await Promise.all([
        api.getAuditLogs(activeProject?.id),
        api.getAdminUsers(),
      ]);
      setLogs(auditRes);
      setUsers(usersRes);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      await loadAdminData();
      await refreshProjects();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "APPROVE_CLAIM":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "LOGIN":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "INGEST_SOURCE":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "RUN_RECONSTRUCTION":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "EXPORT_HANDOVER":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "ACKNOWLEDGE_HANDOVER":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            ORGANISATION GOVERNANCE & AUDIT LOGS
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-cyan-400" />
          Access Control & Compliance Audit Trail
        </h1>
        <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
          Comprehensive immutable log of all logins, source uploads, claim evaluations, role elevations, and handover exports.
        </p>
      </div>

      {/* Security Policies Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl glass-panel space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Default Permission Rule</span>
          <span className="text-emerald-400 font-bold text-sm">DEFAULT = DENY</span>
          <p className="text-[11px] text-slate-400 mt-1">
            Access strictly denied if source permission or role clearance is unspecified.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Inheritance Strategy</span>
          <span className="text-cyan-400 font-bold text-sm">STRICTEST BOUNDARY</span>
          <p className="text-[11px] text-slate-400 mt-1">
            Claims inherit the highest clearance level among all supporting verbatim spans.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Redaction Enforcement</span>
          <span className="text-purple-400 font-bold text-sm">SERVER-SIDE ENFORCED</span>
          <p className="text-[11px] text-slate-400 mt-1">
            PII, tokens, and compensation are scrubbed by FastAPI backend before delivery.
          </p>
        </div>
      </div>

      {/* Users & Roles Management */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
          <Users className="w-4 h-4 text-cyan-400" />
          Organization User Roles ({users.length})
        </h2>

        <div className="rounded-2xl glass-panel overflow-hidden border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080C14] text-slate-400 border-b border-white/10 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">{u.full_name}</td>
                  <td className="py-3 px-4 text-slate-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="bg-surface-raised border border-white/10 rounded-lg px-2.5 py-1 text-cyan-300 font-semibold focus:outline-none"
                    >
                      <option value="OUTGOING_EMPLOYEE">Outgoing Employee</option>
                      <option value="INCOMING_EMPLOYEE">Incoming Employee</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="ORG_ADMIN">Org Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Stream */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
          <Clock className="w-4 h-4 text-cyan-400" />
          Live Audit Logs Stream ({logs.length} Events)
        </h2>

        <div className="rounded-2xl glass-panel overflow-hidden border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080C14] text-slate-400 border-b border-white/10 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-medium">{log.user_name}</td>
                  <td className="py-3 px-4 text-cyan-400">{log.user_role}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
