import {
  User,
  Project,
  Claim,
  SourceItem,
  Conflict,
  GapQuestion,
  CustodyLedgerEntry,
  CustodyVerificationResult,
  HandoverPacket,
  AuditLogItem,
  ClaimCategory,
  ClaimState,
  ClaimStatus,
  SourceType,
  PermissionLevel,
  UserRole,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("baton_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("baton_token", token);
      } else {
        localStorage.removeItem("baton_token");
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("baton_token");
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    const token = this.getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.detail || errorJson.message || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  async getDemoUsers(): Promise<User[]> {
    return this.request<User[]>("/auth/demo-users");
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>("/projects");
  }

  async getProjectDetail(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(name: string, description?: string): Promise<Project> {
    return this.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  async getProjectMembers(projectId: string): Promise<any[]> {
    return this.request<any[]>(`/projects/${projectId}/members`);
  }

  async addProjectMember(projectId: string, email: string, role: UserRole): Promise<any> {
    return this.request<any>(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  // Sources
  async getSources(projectId: string): Promise<SourceItem[]> {
    return this.request<SourceItem[]>(`/projects/${projectId}/sources`);
  }

  async ingestSource(
    projectId: string,
    name: string,
    type: SourceType,
    rawText: string,
    permissionTag: PermissionLevel = "INTERNAL"
  ): Promise<SourceItem> {
    return this.request<SourceItem>(`/projects/${projectId}/sources`, {
      method: "POST",
      body: JSON.stringify({
        name,
        type,
        raw_text: rawText,
        permission_tag: permissionTag,
      }),
    });
  }

  async uploadSourceFile(
    projectId: string,
    file: File,
    name?: string,
    type: SourceType = "meeting_notes",
    permissionTag: PermissionLevel = "INTERNAL"
  ): Promise<SourceItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);
    formData.append("source_type", type);
    formData.append("permission_tag", permissionTag);

    return this.request<SourceItem>(`/projects/${projectId}/sources/upload`, {
      method: "POST",
      body: formData,
    });
  }

  // Claims & Reconstruction
  async getClaims(
    projectId: string,
    category?: ClaimCategory,
    state?: ClaimState,
    status?: ClaimStatus
  ): Promise<Claim[]> {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (status) params.set("status", status);

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Claim[]>(`/projects/${projectId}/claims${query}`);
  }

  async runReconstruction(projectId: string): Promise<any> {
    return this.request<any>(`/projects/${projectId}/claims/reconstruct`, {
      method: "POST",
    });
  }

  async getClaimDetail(claimId: string): Promise<Claim> {
    return this.request<Claim>(`/claims/${claimId}`);
  }

  async updateClaim(
    claimId: string,
    data: { title?: string; text?: string; status?: ClaimStatus; state?: ClaimState; reason?: string }
  ): Promise<Claim> {
    return this.request<Claim>(`/claims/${claimId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async approveClaim(claimId: string): Promise<Claim> {
    return this.request<Claim>(`/claims/${claimId}/approve`, {
      method: "POST",
    });
  }

  async rejectClaim(claimId: string): Promise<Claim> {
    return this.request<Claim>(`/claims/${claimId}/reject`, {
      method: "POST",
    });
  }

  async getClaimVersions(claimId: string): Promise<any[]> {
    return this.request<any[]>(`/claims/${claimId}/versions`);
  }

  // Conflicts
  async getConflicts(projectId: string): Promise<Conflict[]> {
    return this.request<Conflict[]>(`/projects/${projectId}/conflicts`);
  }

  async resolveConflict(
    conflictId: string,
    resolutionNotes: string,
    preferredClaimId?: string
  ): Promise<Conflict> {
    return this.request<Conflict>(`/conflicts/${conflictId}/resolve`, {
      method: "POST",
      body: JSON.stringify({
        resolution_notes: resolutionNotes,
        preferred_claim_id: preferredClaimId,
      }),
    });
  }

  // Gaps & Exit Interview
  async getGapQuestions(projectId: string): Promise<GapQuestion[]> {
    return this.request<GapQuestion[]>(`/projects/${projectId}/gaps`);
  }

  async answerGapQuestion(gapId: string, answerText: string): Promise<GapQuestion> {
    return this.request<GapQuestion>(`/gaps/${gapId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer_text: answerText }),
    });
  }

  // Evidence Graph
  async getGraph(projectId: string): Promise<{ nodes: any[]; edges: any[]; stats: any }> {
    return this.request<{ nodes: any[]; edges: any[]; stats: any }>(`/projects/${projectId}/graph`);
  }

  // Successor Handover
  async getHandoverPacket(projectId: string, targetRole?: UserRole): Promise<HandoverPacket> {
    const query = targetRole ? `?target_role=${targetRole}` : "";
    return this.request<HandoverPacket>(`/projects/${projectId}/handover${query}`);
  }

  async acknowledgeHandover(projectId: string, notes?: string): Promise<any> {
    return this.request<any>(`/projects/${projectId}/handover/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  // Custody Ledger
  async getCustodyLedger(projectId: string): Promise<CustodyLedgerEntry[]> {
    return this.request<CustodyLedgerEntry[]>(`/projects/${projectId}/ledger`);
  }

  async verifyCustodyLedger(projectId: string): Promise<CustodyVerificationResult> {
    return this.request<CustodyVerificationResult>(`/projects/${projectId}/ledger/verify`);
  }

  // Admin & Audit
  async getAuditLogs(projectId?: string, limit: number = 100): Promise<AuditLogItem[]> {
    const params = new URLSearchParams();
    if (projectId) params.set("project_id", projectId);
    params.set("limit", limit.toString());
    return this.request<AuditLogItem[]>(`/admin/audit-logs?${params.toString()}`);
  }

  async getAdminUsers(): Promise<User[]> {
    return this.request<User[]>("/admin/users");
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    return this.request<User>(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  // Demo
  async seedDemo(force: boolean = false): Promise<any> {
    return this.request<any>(`/demo/seed?force=${force}`, {
      method: "POST",
    });
  }

  async getDemoStatus(): Promise<{ seeded: boolean; project_id: string | null; project_name: string | null }> {
    return this.request<{ seeded: boolean; project_id: string | null; project_name: string | null }>("/demo/status");
  }
}

export const api = new ApiClient();
