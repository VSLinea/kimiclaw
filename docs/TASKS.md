# TASKS.md - Foundation Build Work Breakdown

## Overview
This document tracks the multi-agent build of the production-grade foundation system.

## Dependency Graph

```
Phase 1: Foundation (Days 1-2)
├── [A] Orchestrator: Setup repo structure, task coordination
├── [E] DevOps: Docker compose, CI skeleton, infra manifests
├── [F] Security: Threat model, secret strategy, RBAC policy draft
└── [B] Architect: Architecture doc, data model, API strategy

Phase 2: Core Implementation (Days 2-4)
├── [D] Backend: Auth integration, RBAC middleware, audit logging
├── [C] Mobile: Flutter scaffold, API client, login + entity screens
├── [B] Architect: OpenAPI spec, contract generation pipeline
└── [G] QA: Test strategy, smoke tests, CI gates

Phase 3: Integration & Deploy (Days 4-5)
├── [A] Orchestrator: Merge coordination, integration testing
├── [E] DevOps: Staging deploy, healthchecks, runbook
├── [D] Backend: HelloEntity CRUD + audit integration
├── [C] Mobile: End-to-end entity flow
└── [G] QA: Full smoke test suite

Phase 4: Documentation & Evidence (Day 5)
├── [A] Orchestrator: Final review, evidence collection
├── [F] Security: Final security review
└── [All] Documentation completion
```

## Task Assignments

### Agent A - Orchestrator
- [ ] Create monorepo structure
- [ ] Coordinate agent task assignments
- [ ] Review and merge feature branches
- [ ] Produce EVIDENCE.md
- [ ] Final integration testing

### Agent B - Architect
- [ ] Write ARCHITECTURE.md
- [ ] Design data model (users, roles, audit_logs, hello_entities)
- [ ] Define OpenAPI strategy
- [ ] Create API_CONTRACT.md
- [ ] Set up OpenAPI generation pipeline

### Agent C - Mobile
- [ ] Flutter project scaffold with Riverpod + Dio + go_router
- [ ] Environment configuration (dev/staging/prod)
- [ ] Login screen with token handling
- [ ] API client integration (generated from OpenAPI)
- [ ] HelloEntity list screen
- [ ] HelloEntity create form

### Agent D - Backend
- [ ] Fastify + TypeScript project setup
- [ ] Prisma schema + migrations
- [ ] Auth provider integration (Clerk)
- [ ] RBAC middleware (user/admin roles)
- [ ] Audit log service
- [ ] HelloEntity CRUD endpoints
- [ ] OpenAPI spec generation

### Agent E - DevOps
- [ ] Docker compose for local development
- [ ] GitHub Actions CI pipeline
- [ ] Infra manifests (K8s or Docker Compose for staging)
- [ ] Staging deployment configuration
- [ ] Write RUNBOOK.md
- [ ] Write DEV_GUIDE.md

### Agent F - Security
- [ ] Write SECURITY.md (threat model, secret handling)
- [ ] Review auth provider choice
- [ ] Define RBAC policy
- [ ] Dependency risk assessment
- [ ] Secret rotation procedures

### Agent G - QA
- [ ] Write OBSERVABILITY.md
- [ ] Create smoke test suite
- [ ] CI gate configuration
- [ ] Test coverage requirements

## Blockers & Dependencies

| Task | Blocked By | Notes |
|------|-----------|-------|
| Backend auth | Architect: Auth provider decision | Clerk chosen for speed |
| Mobile API client | Backend: OpenAPI spec | Generate from backend |
| CI mobile build | Mobile: Flutter scaffold | Needs Android SDK |
| Staging deploy | DevOps: Infra manifests | Use Docker Compose |
| Integration tests | Backend + Mobile complete | End-to-end flow |

## Definition of Done

- [ ] All docs complete in /docs/
- [ ] Monorepo structure established
- [ ] Backend builds and tests pass
- [ ] Mobile builds (Android in CI)
- [ ] Local development: `docker compose up` works
- [ ] Staging deploy documented and tested
- [ ] EVIDENCE.md shows proof of all above

## Current Status

**Phase:** 1 - Foundation
**Started:** 2026-02-19
**Target Completion:** 2026-02-24
