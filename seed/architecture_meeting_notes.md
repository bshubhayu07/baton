# Payments V2 Architecture Sync & Risk Review

**Date:** October 28, 2026  
**Attendees:** Dave Chen (Team Lead), Alex Mercer (Senior Staff Engineer, Leaver), Jordan Taylor (Incoming Senior Engineer), Sarah Jenkins (Principal Architect)

---

## 1. Upstream & Downstream Dependencies
- Payments-v2 service is strictly dependent on the Core Banking V3 gRPC service deployment for merchant account ledger balance settlement.
- Proto definition: `protos/banking/v3/settlement.proto` version 3.4.1.
- Authentication utilizes mutual TLS with service certificates provisioned by HashiCorp Vault.

## 2. Load Testing & Stability Risks
- Load testing revealed a gradual memory leak in the webhook worker container when processing batches exceeding 15,000 requests/minute, requiring nightly container restarts.
- Initial heap profile shows unclosed TCP sockets in the HTTP client connection pool.
- Alex recommended upgrading `undici` to patch socket reclamation.

## 3. Disaster Recovery & Failover Gaps (Unresolved)
- Primary payment processing will route via Stripe US-East.
- Secondary failover gateway is configured for Adyen EU-West.
- **Action Item Missing:** Currently, the multi-region Disaster Recovery failover runbook remains unassigned and has no automated health-check switchover. Who owns this runbook and failover testing procedure before Alex departs?

## 4. Security & Compliance
- PCI-DSS Level 1 audit is scheduled for December 2026.
- Stripe Elements iframe scoping keeps all cardholder data outside our application VPC boundaries (SAQ-A compliant).
