# Baton REST API Reference

The backend API is served at `http://localhost:8000/api`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

---

## 1. Authentication & RBAC

### `POST /api/auth/login`
Authenticate with email and password.
- **Request Body:** `{ "email": "lead@baton.local", "password": "password123" }`
- **Response:** `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`

### `GET /api/auth/demo-users`
Returns the 4 seeded demo personas with pre-generated tokens for instant one-click UI switching.

### `GET /api/auth/me`
Returns the authenticated user profile.
- **Headers:** `Authorization: Bearer <token>`

---

## 2. Projects & Ingestion

### `GET /api/projects`
List all accessible project rooms.

### `POST /api/projects`
Create a new project room (`TEAM_LEAD` or `ORG_ADMIN`).

### `GET /api/projects/{id}/sources`
List ingested source documents for a project.

### `POST /api/projects/{id}/sources`
Ingest raw text/JSON source item with permission tagging:
- **Request Body:**
  ```json
  {
    "name": "Architecture Review Notes",
    "type": "meeting_notes",
    "raw_text": "...",
    "permission_tag": "INTERNAL"
  }
  ```

### `POST /api/projects/{id}/sources/upload`
Multipart file upload supporting `.json`, `.md`, `.txt`, `.csv`, `.pdf`.

---

## 3. Claims & Evidence Linkages

### `GET /api/projects/{id}/claims`
List claims. Query parameters: `category`, `state` (`VERIFIED`, `INFERRED`, `CONFLICTING`, `MISSING`), `status` (`DRAFT`, `APPROVED`, `REJECTED`).
- Returns claims with supporting `spans` (quote, start offset, end offset, verified).

### `POST /api/projects/{id}/claims/reconstruct`
Triggers AI extraction and verbatim quotation span verification.

### `POST /api/claims/{id}/approve`
Team Lead / Leaver approval. Transitions claim to `VERIFIED` (if quote is verified) and stamps custody ledger block.

### `POST /api/claims/{id}/reject`
Rejects ungrounded claim.

### `PUT /api/claims/{id}`
Edits claim text or title. Increments claim version and appends to custody ledger.

---

## 4. Conflicts & Gaps

### `GET /api/projects/{id}/conflicts`
List cross-source contradictions.

### `POST /api/conflicts/{id}/resolve`
Resolve conflict between contradictory sources.

### `GET /api/projects/{id}/gaps`
List targeted exit interview questions generated from missing/conflicting evidence.

### `POST /api/gaps/{id}/answer`
Submit leaver response. Automatically ingests response as an `exit_interview` source item, generates a verified claim, and stamps custody ledger.

---

## 5. React Flow Evidence Graph

### `GET /api/projects/{id}/graph`
Returns nodes and edges tailored for React Flow:
- Source nodes (purple)
- Claim nodes (emerald, cyan, amber, rose)
- Verbatim quotation edges (cyan)
- Cross-document contradiction edges (amber dashed)

---

## 6. Successor Handover & Redaction

### `GET /api/projects/{id}/handover?target_role=INCOMING_EMPLOYEE`
Returns compiled handover packet with server-side redaction of confidential HR data, salaries, tokens, and PII.

### `POST /api/projects/{id}/handover/acknowledge`
Successor signs off on handover packet. Stamped in custody ledger.

---

## 7. Custody Ledger & Audit

### `GET /api/projects/{id}/ledger`
Returns chronological append-only custody chain.

### `GET /api/projects/{id}/ledger/verify`
Traverses the SHA-256 hash chain and verifies cryptographic integrity.

### `GET /api/admin/audit-logs`
Audit trail of all reads, approvals, and exports.
