# Baton End-to-End Demo Walkthrough Guide

This walkthrough guides you through the full **Baton** experience using the pre-seeded **Payments V2 Migration** project scenario.

---

## Seed Accounts & Personas

| Role | Name & Email | Password | Primary Mission |
|---|---|---|---|
| **Project Manager / Team Lead** | Dave Chen (`lead@baton.local`) | `password123` | Supervises transition, approves claims, resolves contradictions. |
| **Outgoing Senior Staff Engineer** | Alex Mercer (`leaver@baton.local`) | `password123` | Knowledge holder, answers targeted gap questions. |
| **Incoming Senior Staff Engineer** | Jordan Taylor (`successor@baton.local`) | `password123` | Successor, reviews redacted handover packet, signs off. |
| **Organisation Admin** | Elena Vance (`admin@baton.local`) | `password123` | Manages permissions, inspects audit logs & custody ledger. |

> **Tip:** You can switch between personas in one click using the **Persona Role Switcher** dropdown in the top right header!

---

## Step-by-Step Scenario Walkthrough

### Step 1: Load the Demo Scenario
1. Open the application at `http://localhost:3000`.
2. Click the **"Load Demo Data"** button in the header.
3. This ingests 4 synthetic datasets:
   - **GitHub Repo:** Commits, PR #142 (claiming December 15 cutover), idempotency specs.
   - **Slack Thread:** Stripe Elements debate, Dave Chen's message postponing cutover to January 10 (contradiction), plus restricted contractor rate ($165/hr).
   - **Architecture Meeting Notes:** Core Banking V3 dependency, webhook socket memory leak, unassigned DR runbook (missing info).
   - **Task Board CSV:** PAY-101 through PAY-106 tickets.
4. AI reconstruction runs, extracts 7 claims with exact character-level quotation spans, flags the cutover conflict, and generates 3 targeted gap questions.

---

### Step 2: Outgoing Employee Answers Gap Questions
1. Switch role to **Alex Mercer (Outgoing Senior Staff Engineer)** from the top-right switcher.
2. Navigate to **"Leaver Exit Interview"** in the sidebar (`/gaps`).
3. Notice the 3 targeted questions synthesized from missing documentation:
   - *"Who will maintain and execute the multi-region Disaster Recovery failover runbook...?"*
   - *"What is the authoritative production cutover date for Payments V2...?"*
   - *"Has a root-cause patch been identified for the webhook worker memory leak...?"*
4. Click on the first suggested answer:
   > *"Dave Chen will assume ownership with DevOps SRE team on-call rotation"*
5. Click **"Submit Answer"**.
6. **Watch the magic:** Baton normalizes your answer into an official Exit Interview source item, automatically creates a new claim with verbatim quote linkage, marks the state as `VERIFIED`, and records a new block in the custody ledger!

---

### Step 3: Team Lead Reviews Claims & Resolves Conflict
1. Switch role to **Dave Chen (Team Lead)**.
2. Navigate to **"Team Lead Review"** in the sidebar (`/review`).
3. Look at the **"Contradictory Evidence Needing Resolution"** section:
   - Notice the side-by-side comparison between **GitHub PR #142** (Dec 15) and **Slack** (Jan 10).
4. Click **"Resolve Contradiction"**:
   - Select *"Option B: Dave Chen Slack Postponement (Jan 10, 2027)"*.
   - Click **"Authorize Resolution"**.
   - The contradiction is resolved, the preferred claim is elevated to `VERIFIED`, and a `CONFLICT_RESOLVED` block is stamped in the custody ledger.
5. In the pending claims section, review *"Idempotency Architecture: Redis + DynamoDB Fallback"* and click **"Approve & Verify"**.
   - Because its underlying verbatim quote was verified in GitHub source code, human approval promotes it to **`VERIFIED` (Emerald Green)**!

---

### Step 4: Explore the Evidence Graph
1. Navigate to **"Evidence Graph"** in the sidebar (`/graph`).
2. An interactive React Flow canvas renders:
   - Purple source nodes on the left.
   - Color-coded claim nodes in the center and right.
   - Cyan edges denoting verbatim quotation evidence links.
   - Amber dashed edges showing cross-document contradictions.
3. Click on the claim node: **"Idempotency Architecture: Redis + DynamoDB Fallback"**:
   - The **Evidence Span Inspector** side drawer slides open.
   - See the verbatim quotation: *"We decided to store idempotency keys in Redis with DynamoDB as durable fallback rather than PostgreSQL to avoid connection pool exhaustion during peak flash sales."*
   - See the exact character offsets: `[137 : 301]` (Length: 164 chars).
   - In the **Underlying Source Document** box, see the full GitHub text with the exact verbatim quotation highlighted in glowing cyan!

---

### Step 5: Successor Reviews Handover with Hardened Redaction
1. Switch role to **Jordan Taylor (Successor Senior Staff Engineer)**.
2. Navigate to **"Successor Handover"** in the sidebar (`/handover`).
3. Notice the **Hardened Role Redaction Engine** notice banner:
   - Successors only have `INTERNAL` clearance.
   - Restricted HR compensation chats ($165/hr contractor rate, $195,000 salary tier) and raw tokens have been **completely scrubbed and omitted**.
   - Engineering decisions, architecture diagrams, and dependencies remain 100% visible and verified.
4. Scroll to the bottom to the **Successor Acknowledgment** card.
5. Review the sign-off statement and click **"Acknowledge Handover"**.
6. A green confirmation badge appears displaying the newly generated SHA-256 custody block hash!

---

### Step 6: Org Admin Audits Custody Ledger & Compliance
1. Switch role to **Elena Vance (Org Admin)**.
2. Navigate to **"Custody Ledger"** in the sidebar (`/ledger`).
3. View the chronological stream of cryptographic blocks:
   - Genesis block (`prev_hash: 000000000...`)
   - `EXTRACTED` blocks
   - `GAP_ANSWERED` block from Alex Mercer
   - `APPROVED` block from Dave Chen
   - `CONFLICT_RESOLVED` block
   - `HANDOVER_ACKNOWLEDGED` block from Jordan Taylor
4. Click **"Verify Chain Integrity"**:
   - Baton traverses the entire SHA-256 hash chain from genesis to head.
   - Displays **"Cryptographic Chain Verified • All N Blocks Valid"**.
5. Navigate to **"Audit & Access Control"** (`/admin`):
   - Review live audit logs recording each login, source ingestion, and handover export.
