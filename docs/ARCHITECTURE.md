# Baton Architecture & Technical Specification

## 1. System Overview
**Baton** is an evidence-linked knowledge continuity platform designed to eliminate institutional knowledge loss when engineers, leads, or architects leave a project. Unlike unstructured wikis or lossy LLM summaries, Baton enforces a **verbatim quotation guarantee**: every architectural decision, risk, dependency, and ownership claim must be grounded in exact character spans from ingested sources (GitHub repositories, Slack channel threads, meeting notes, and task boards).

---

## 2. Core Principles Enforced in Code

### 2.1 Verbatim Quotation Span Linkage
- Every claim is backed by a `ClaimSpan` linking to `SourceItem.id` with `start_offset` and `end_offset`.
- The backend verifier (`backend/app/services/span_verifier.py`) checks that `source.raw_text[start_offset:end_offset] == quote`.
- If an LLM hallucinates an unsupported claim or misquotes a source, verification fails: `span.verified = False`, and the claim is classified as `MISSING` or rejected.

### 2.2 Human Authority & Approval Gate
- Extracted claims remain in `DRAFT` status and `INFERRED` state.
- A claim only transitions to `APPROVED` and `VERIFIED` state once a human supervisor (Team Lead or Leaver) reviews and authorizes it.

### 2.3 Default-Deny RBAC & Permission Inheritance
- Ingested sources are tagged with clearance levels: `PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED`.
- Claims inherit the **strictest permission tag** among all underlying supporting spans (`max(permission_tags)`).
- Permissions are strictly enforced in backend FastAPI dependency injection, never trusted from client-side state.

---

## 3. The Three Signature Improvements

### 3.1 Append-Only Cryptographic Custody Ledger
To establish non-repudiation and tamper resistance for engineering decisions:
- Each event (`CREATED`, `EXTRACTED`, `EDITED`, `APPROVED`, `REJECTED`, `CONFLICT_RESOLVED`, `GAP_ANSWERED`, `HANDOVER_ACKNOWLEDGED`) is appended to `custody_ledger`.
- Genesis block: `prev_hash = "0" * 64`.
- Chaining formula:
  $$\text{entry\_hash} = \text{SHA256}(\text{prev\_hash} \parallel \text{project\_id} \parallel \text{claim\_id} \parallel \text{action} \parallel \text{actor\_user\_id} \parallel \text{actor\_role} \parallel \text{timestamp} \parallel \text{details\_json})$$
- Verification endpoint `GET /api/projects/{id}/ledger/verify` traverses the entire block sequence, recalculates SHA-256 digests, and validates continuous cryptographic integrity.

### 3.2 Gap-Driven Exit Interview
- Unresolved issues, missing runbooks, and conflicting evidence automatically generate structured questions for the departing engineer.
- When the departing engineer answers, Baton ingests the response as an authoritative `exit_interview` source document, generates a verified claim with exact character offsets, and marks the gap resolved.

### 3.3 Hardened Role Redaction Engine
- Filters out all claims above the caller's role clearance before compiling the successor handover packet.
- Scrubs credentials, JWT tokens, API keys, email addresses, and compensation/salary numbers (`\$[0-9,]+`, hourly contractor rates).
- Rigorously verified through unit tests (`backend/tests/test_redaction.py`).

---

## 4. Confidence & Evidence States

| State | Badge Color | Description |
|---|---|---|
| **`VERIFIED`** | Emerald Green | Verbatim quote verified in source text AND confirmed by supervisor/leaver sign-off. |
| **`INFERRED`** | Cyan / Sky Blue | Verbatim quote exists in source, but claim conclusion is model-generated awaiting sign-off. |
| **`CONFLICTING`** | Amber | Multiple sources contradict each other (e.g. cutover dates). Both sides shown separately. |
| **`MISSING`** | Crimson Red | Critical required domain information has zero supporting evidence in ingested docs. |

---

## 5. Database Schema & Models

```
organizations (id, name, created_at)
  └── users (id, org_id, email, hashed_password, full_name, role, is_active)
  └── projects (id, org_id, name, description, status, created_by)
        ├── project_members (id, project_id, user_id, role)
        ├── source_items (id, project_id, type, name, raw_text, permission_tag, metadata_json)
        │     └── source_chunks (id, source_item_id, chunk_index, content, embedding_vector)
        ├── claims (id, project_id, category, title, text, state, permission_level, status, confidence_score)
        │     ├── claim_spans (id, claim_id, source_item_id, quote, start_offset, end_offset, verified)
        │     └── claim_versions (id, claim_id, version_number, title, text, state, status, changed_by)
        ├── conflicts (id, project_id, claim_id_1, claim_id_2, description, source_a_quote, source_b_quote, status)
        ├── gap_questions (id, project_id, question, category, context, suggested_answers, answer_text, status)
        └── custody_ledger (id, project_id, claim_id, action, actor_user_id, prev_hash, entry_hash)

audit_log (id, org_id, project_id, user_id, user_role, action, resource_type, resource_id, details_json)
```
