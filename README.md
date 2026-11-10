# Baton — Evidence-Linked Knowledge Continuity Platform

> **When engineers leave, their tribal knowledge shouldn't vanish into thin air.**  
> Baton ingests repositories, chats, meeting notes, and task boards, uses AI to reconstruct architectural decisions, risks, dependencies, and ownership, **links EVERY claim to a verbatim source quotation with character-level offsets**, flags cross-document conflicts and missing runbooks, requires human authorization, and compiles a role-aware, redactable handover packet with an append-only cryptographic custody ledger.

---

## 1. Core Principles Enforced in Code

1. **Verbatim Quotation Span Guarantee**: Every extracted claim is backed by an exact quote and source ID. The backend verifies that the quote exists verbatim in the raw source text (`quote in source.raw_text`). Unsupported claims are rejected or classified as `MISSING`.
2. **Human Authority**: Nothing becomes official until a human (departing engineer or team lead) signs off. Approval promotes claims with verified spans to `VERIFIED`.
3. **Default-Deny RBAC & Permission Inheritance**: Claims strictly inherit the **highest clearance level** of their underlying sources (`PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED`).

---

## 2. Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, `@xyflow/react` (React Flow)
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0, Alembic
- **Database**: PostgreSQL 16 with pgvector (via Docker Compose) + clean SQLite compatibility for zero-setup local dev
- **AI Engine**: Pluggable provider (`MOCK`, `OPENAI`, `GEMINI`). Includes an **offline deterministic MOCK provider** that runs out of the box with zero API keys!
- **Security**: JWT Authentication, RBAC dependency injection, Server-Side Redaction Engine
- **Deployment**: Docker Compose with single-command startup: `docker compose up`

---

## 3. Seed Users & RBAC Roles

The system is pre-seeded with 4 demo personas (Password for all: `password123`):

| Persona | Name & Email | Role | Clearance Boundary |
|---|---|---|---|
| **Supervisor** | Dave Chen (`lead@baton.local`) | `TEAM_LEAD` | `CONFIDENTIAL` |
| **Knowledge Holder** | Alex Mercer (`leaver@baton.local`) | `OUTGOING_EMPLOYEE` | `CONFIDENTIAL` |
| **Successor** | Jordan Taylor (`successor@baton.local`) | `INCOMING_EMPLOYEE` | `INTERNAL` (Redacted) |
| **Access Controller** | Elena Vance (`admin@baton.local`) | `ORG_ADMIN` | `RESTRICTED` (Full) |

> 💡 **Instant Role Switcher**: The top header has a one-click persona switcher that updates credentials and permissions across all views instantly!

---

## 4. The Three Signature Improvements

### 1. Cryptographic Custody Ledger
An append-only SHA-256 hash-chained ledger recording every action (`CREATED`, `EXTRACTED`, `EDITED`, `APPROVED`, `REJECTED`, `CONFLICT_RESOLVED`, `GAP_ANSWERED`, `HANDOVER_ACKNOWLEDGED`).  
- **Tamper Evident**: Any modification to block contents or timestamps invalidates the downstream chain.
- **Verification Endpoint**: `GET /api/projects/{id}/ledger/verify` traverses all blocks from genesis and audits cryptographic integrity with one click.

### 2. Gap-Driven Exit Interview
Automatically synthesizes targeted questions for the departing engineer from missing documentation (e.g. unassigned disaster recovery failover runbooks) and cross-document contradictions (e.g. conflicting cutover dates). Answers are ingested as primary `exit_interview` source documents, converted into verified claims, and stamped on the ledger.

### 3. Hardened Server-Side Redaction Engine
Strictly scrubs restricted content (e.g., contractor hourly billing rates, salaries, JWT tokens, API keys, emails) before delivering role-filtered handovers to incoming staff, proven by automated tests (`backend/tests/test_redaction.py`).

---

## 5. One-Command Startup (Docker Compose)

```bash
# Clone the repository
git clone https://github.com/bshubhayu07/baton.git
cd baton

# Copy environment variables
cp .env.example .env

# Run everything with Docker Compose (Postgres 16 + pgvector, FastAPI Backend, Next.js Frontend)
docker compose up --build
```

- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend API**: [http://localhost:8000/api](http://localhost:8000/api)
- **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 6. Local Development Startup (Without Docker)

### Backend
```bash
# Set up Python virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# Start backend server
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

### Frontend
```bash
# In another terminal:
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 7. Running the Automated Test Suite

### Backend Tests (14 Tests Passed: Span Verification, RBAC, Redaction, Custody Ledger)
```bash
.\.venv\Scripts\pytest backend/tests
```
**Test Coverage Includes:**
- `test_span_verifier.py`: Exact character-level substring matching & offset verification.
- `test_auth_rbac.py`: Password hashing, JWT creation, default-deny clearance enforcement, and strictest permission inheritance.
- `test_redaction.py`: Masking of JWT tokens, API secrets, compensation amounts (`$165/hr`, `$195,000`), and role exclusion.
- `test_custody_ledger.py`: SHA-256 hash chaining, genesis block linking, and tamper detection.
- `test_routers_direct.py`: End-to-end route verification.

### Frontend Production Build Smoke Test
```bash
npm --prefix frontend run build
```
Builds all routes statically without errors.

---

## 8. Five-Stage Demo Walkthrough

1. **Load Demo Scenario**: Click the **"Load Demo Data"** button in the header. This ingests:
   - GitHub export (`payments-v2-core` commits, PR #142 claiming cutover is Dec 15).
   - Slack channel export (`#payments-migration-arch` debate on Stripe Elements, Dave Chen message postponing cutover to Jan 10, plus confidential contractor rate).
   - Meeting notes (Core Banking V3 gRPC dependency, webhook memory leak, unassigned DR runbook).
   - Task board CSV (PAY-101 through PAY-106).
2. **AI Reconstruction & Span Verification**: AI extracts 7 claims with exact character spans, flags the cutover contradiction, and synthesizes 3 targeted gap questions.
3. **Leaver Exit Interview (`/gaps`)**: Switch role to **Alex Mercer (Outgoing Senior Staff Engineer)**. Select a suggested answer for the DR runbook and submit. Notice it creates an authoritative `exit_interview` source and a verified claim!
4. **Team Lead Review & Conflict Resolution (`/review`)**: Switch role to **Dave Chen (Team Lead)**. Resolve the cutover date contradiction in favor of Jan 10, and approve pending draft claims.
5. **Interactive Evidence Graph (`/graph`)**: Inspect claims, source documents, and contradiction edges. Click any node to open the side drawer showing verbatim quotes highlighted in glowing cyan with exact character offsets.
6. **Successor Handover (`/handover`)**: Switch role to **Jordan Taylor (Successor Senior Staff Engineer)**. Verify that all confidential compensation data is redacted, review the architectural roadmap, and click **"Acknowledge Handover"** to seal the cryptographic custody ledger!
7. **Custody Ledger Audit (`/ledger`)**: Switch role to **Elena Vance (Org Admin)** and click **"Verify Chain Integrity"** to validate the entire SHA-256 blockchain from genesis to head!

---

## 9. Monorepo Structure

```
baton/
├── backend/
│   ├── app/
│   │   ├── config.py             # Settings via pydantic-settings
│   │   ├── database.py           # SQLAlchemy engine & VectorType
│   │   ├── main.py               # FastAPI entrypoint & router mounts
│   │   ├── models/               # SQLAlchemy models (User, Claim, Source, Ledger...)
│   │   ├── schemas/              # Pydantic v2 validation schemas
│   │   ├── services/             # Span verifier, Redaction, LLM provider, Ledger
│   │   └── routers/              # Modular API endpoints
│   ├── tests/                    # Pytest suite (Span, RBAC, Redaction, Ledger)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages (/graph, /gaps, /handover...)
│   │   ├── components/           # React Flow nodes, Badges, Layout, Drawers
│   │   ├── context/              # Auth & Active Project Context
│   │   └── lib/                  # TypeScript types & API client
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
├── seed/                         # Synthetic demo datasets (GitHub, Slack, Notes, CSV)
├── docs/                         # Architecture, Demo Walkthrough, API docs
├── docker-compose.yml            # Multi-container orchestration (postgres, backend, frontend)
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 10. License
Apache 2.0. Built for enterprise knowledge continuity.
