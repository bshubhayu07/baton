"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Project } from "@/lib/types";
import { api } from "@/lib/api";

interface AuthContextType {
  currentUser: User | null;
  demoUsers: User[];
  activeProject: Project | null;
  projects: Project[];
  loading: boolean;
  switchRole: (user: User) => void;
  setActiveProject: (project: Project) => void;
  loadDemoProject: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize demo users and active project
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const users = await api.getDemoUsers();
        setDemoUsers(users);

        // Default to Team Lead (Dave Chen) for a rich supervisory demo experience
        const defaultLead = users.find((u) => u.role === "TEAM_LEAD") || users[0];
        if (defaultLead) {
          api.setToken(defaultLead.token || null);
          setCurrentUser(defaultLead);
        }

        // Fetch projects
        const projList = await api.getProjects();
        setProjects(projList);
        if (projList.length > 0) {
          setActiveProject(projList[0]);
        }
      } catch (err) {
        console.error("Failed to initialize auth/projects:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const switchRole = (user: User) => {
    api.setToken(user.token || null);
    setCurrentUser(user);
    refreshProjects();
  };

  const refreshProjects = async () => {
    try {
      const projList = await api.getProjects();
      setProjects(projList);
      if (projList.length > 0) {
        // Keep active project or update
        const currentActive = projList.find((p) => p.id === activeProject?.id);
        setActiveProject(currentActive || projList[0]);
      }
    } catch (err) {
      console.error("Error refreshing projects:", err);
    }
  };

  const loadDemoProject = async () => {
    try {
      setLoading(true);
      await api.seedDemo(true);
      await refreshProjects();
    } catch (err) {
      console.error("Error seeding demo:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        demoUsers,
        activeProject,
        projects,
        loading,
        switchRole,
        setActiveProject,
        loadDemoProject,
        refreshProjects,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
