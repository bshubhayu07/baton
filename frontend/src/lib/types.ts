export type UserRole =
  | "OUTGOING_EMPLOYEE"
  | "INCOMING_EMPLOYEE"
  | "TEAM_LEAD"
  | "ORG_ADMIN";

export type PermissionLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED";

export type ClaimState =
  | "VERIFIED"
  | "INFERRED"
  | "CONFLICTING"
  | "MISSING";

export type ClaimStatus =
  | "DRAFT"
  | "APPROVED"
  | "REJECTED";

export type ClaimCategory =
  | "DECISION"
  | "REASONING"
  | "OWNERSHIP"
  | "DEPENDENCY"
  | "PROGRESS"
  | "RISK"
  | "UNRESOLVED_ISSUE";

export type SourceType =
  | "github"
  | "slack"
  | "meeting_notes"
  | "task_board"
  | "exit_interview";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  org_id: string;
  is_active: boolean;
  created_at: string;
  token?: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  member_count: number;
  sources_count: number;
  claims_count: number;
  verified_claims_count: number;
  open_gaps_count: number;
  unresolved_conflicts_count: number;
}

export interface ClaimSpan {
  id: string;
  claim_id: string;
  source_item_id: string;
  source_name?: string;
  source_type?: string;
  quote: string;
  start_offset: number;
  end_offset: number;
  verified: boolean;
  verification_failure_reason?: string | null;
}

export interface Claim {
  id: string;
  project_id: string;
  category: ClaimCategory;
  title: string;
  text: string;
  state: ClaimState;
  permission_level: PermissionLevel;
  status: ClaimStatus;
  confidence_score: number;
  created_by_role: string;
  created_at: string;
  updated_at: string;
  spans: ClaimSpan[];
}

export interface SourceItem {
  id: string;
  project_id: string;
  type: SourceType;
  name: string;
  raw_text: string;
  permission_tag: PermissionLevel;
  metadata_json: Record<string, any>;
  created_at: string;
  created_by?: string | null;
}

export interface Conflict {
  id: string;
  project_id: string;
  claim_id_1: string;
  claim_id_2?: string | null;
  description: string;
  source_a_quote?: string | null;
  source_b_quote?: string | null;
  status: "UNRESOLVED" | "RESOLVED";
  resolved_by_user_id?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

export interface GapQuestion {
  id: string;
  project_id: string;
  claim_id?: string | null;
  question: string;
  category: string;
  context?: string | null;
  suggested_answers: string[];
  answer_text?: string | null;
  status: "OPEN" | "ANSWERED" | "CONVERTED_TO_CLAIM";
  answered_by_user_id?: string | null;
  answered_at?: string | null;
  created_at: string;
}

export interface CustodyLedgerEntry {
  id: string;
  project_id: string;
  claim_id?: string | null;
  action: string;
  actor_user_id: string;
  actor_role: string;
  timestamp: string;
  details_json: Record<string, any>;
  prev_hash: string;
  entry_hash: string;
  created_at: string;
}

export interface CustodyVerificationResult {
  valid: boolean;
  total_entries: number;
  chain_head?: string | null;
  message: string;
  broken_index?: number | null;
  reason?: string | null;
}

export interface HandoverPacket {
  project_id: string;
  project_name: string;
  generated_for_role: string;
  generated_at: string;
  is_redacted: boolean;
  decisions: Claim[];
  dependencies: Claim[];
  risks: Claim[];
  unresolved_issues: Claim[];
  ownership: Claim[];
  acknowledgments: Array<{
    id: string;
    actor_name: string;
    actor_role: string;
    timestamp: string;
    entry_hash: string;
    notes: string;
  }>;
}

export interface AuditLogItem {
  id: string;
  action: string;
  user_name: string;
  user_email: string;
  user_role: string;
  resource_type: string;
  resource_id?: string | null;
  details: Record<string, any>;
  created_at: string;
}
