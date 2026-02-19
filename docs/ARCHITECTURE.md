# Foundation System - Architecture Document

## Document Information
- **Version:** 1.0.0
- **Status:** Draft
- **Last Updated:** 2026-02-19

---

## 1. Overview

This document describes the architecture of the Foundation System, a production-grade base infrastructure for mobile and web applications. The architecture follows modern cloud-native principles with clear separation of concerns, scalability, and maintainability.

---

## 2. Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | Each service has one clear purpose |
| **Statelessness** | API servers are stateless; state externalized |
| **Defense in Depth** | Multiple security layers |
| **Fail Fast** | Quick failure detection and recovery |
| **Observability** | Comprehensive logging, metrics, tracing |
| **Infrastructure as Code** | All infrastructure defined declaratively |

---

## 3. High-Level Architecture

### 3.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Mobile App  │  │  Mobile App  │  │   Web App    │                  │
│  │    (iOS)     │  │  (Android)   │  │   (Future)   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
└─────────┼─────────────────┼─────────────────┼──────────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ HTTPS/TLS 1.3
┌───────────────────────────▼─────────────────────────────────────────────┐
│                           GATEWAY LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Load Balancer (Nginx/ALB)                    │    │
│  │  - SSL termination  - Rate limiting  - Request routing           │    │
│  └────────────────────────────────┬────────────────────────────────┘    │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                           API LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    API Server Cluster (Fastify)                  │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │    │
│  │  │ Node 1  │  │ Node 2  │  │ Node 3  │  │ Node N  │            │    │
│  │  │ (PM2)   │  │ (PM2)   │  │ (PM2)   │  │ (PM2)   │            │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
┌─────────────▼─────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│      DATA LAYER       │  │   AUTH LAYER    │  │  STORAGE LAYER  │
│  ┌─────────────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │   PostgreSQL    │  │  │  │   Clerk   │  │  │  │  S3/MinIO │  │
│  │  (Primary +     │  │  │  │  (OAuth,  │  │  │  │           │  │
│  │   Replicas)     │  │  │  │  JWT)     │  │  │  │           │  │
│  └─────────────────┘  │  │  └───────────┘  │  │  └───────────┘  │
│  ┌─────────────────┐  │  └─────────────────┘  └─────────────────┘
│  │  Redis (Cache   │  │
│  │   & Sessions)   │  │
│  └─────────────────┘  │
└───────────────────────┘
```

### 3.2 Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| Mobile App | Flutter | Cross-platform user interface |
| Load Balancer | Nginx/AWS ALB | Traffic distribution, SSL |
| API Server | Node.js + Fastify | Business logic, API endpoints |
| Database | PostgreSQL 15+ | Primary data persistence |
| Cache | Redis | Session storage, query caching |
| Auth Provider | Clerk | Identity management |
| Object Storage | S3/MinIO | File storage |
| Message Queue | Redis/RabbitMQ | Async job processing (future) |

---

## 4. Deployment Topology

### 4.1 Production Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         VPC (10.0.0.0/16)                        │    │
│  │                                                                  │    │
│  │   ┌─────────────────────────────────────────────────────────┐   │    │
│  │   │              Public Subnets (ALB, NAT GW)                │   │    │
│  │   │    ┌─────────┐    ┌─────────┐    ┌─────────┐           │   │    │
│  │   │    │  AZ-1a  │    │  AZ-1b  │    │  AZ-1c  │           │   │    │
│  │   │    └────┬────┘    └────┬────┘    └────┬────┘           │   │    │
│  │   └─────────┼──────────────┼──────────────┼────────────────┘   │    │
│  │             │              │              │                     │    │
│  │   ┌─────────▼──────────────▼──────────────▼────────────────┐   │    │
│  │   │              Private Subnets (App Tier)                 │   │    │
│  │   │    ┌─────────┐    ┌─────────┐    ┌─────────┐           │   │    │
│  │   │    │ ECS/    │    │ ECS/    │    │ ECS/    │           │   │    │
│  │   │    │ EKS Pod │    │ EKS Pod │    │ EKS Pod │           │   │    │
│  │   │    │ (API)   │    │ (API)   │    │ (API)   │           │   │    │
│  │   │    └────┬────┘    └────┬────┘    └────┬────┘           │   │    │
│  │   └─────────┼──────────────┼──────────────┼────────────────┘   │    │
│  │             │              │              │                     │    │
│  │   ┌─────────▼──────────────▼──────────────▼────────────────┐   │    │
│  │   │              Data Subnets (Database Tier)               │   │    │
│  │   │    ┌─────────┐    ┌─────────┐    ┌─────────┐           │   │    │
│  │   │    │ RDS     │    │ ElastiCache│   │ S3 VPC │           │   │    │
│  │   │    │Primary  │    │ (Redis)   │    │Endpoint│           │   │    │
│  │   │    │Replica  │    │           │    │        │           │   │    │
│  │   │    └─────────┘    └─────────┘    └─────────┘           │   │    │
│  │   └────────────────────────────────────────────────────────┘   │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  External Services:                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │    Clerk    │    │   S3/MinIO  │    │ CloudWatch  │                 │
│  │  (Auth)     │    │  (Storage)  │    │ (Monitoring)│                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Environment Configuration

| Environment | Infrastructure | Scaling |
|-------------|----------------|---------|
| **Production** | AWS ECS/EKS, RDS Multi-AZ | Auto-scaling 3-10 instances |
| **Staging** | AWS ECS, RDS Single-AZ | Fixed 2 instances |
| **Development** | Docker Compose locally | Single container |

---

## 5. Data Flows

### 5.1 Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────>│  Clerk  │────>│  Mobile │────>│   API   │────>│  Clerk  │
│         │     │  (Auth) │     │   App   │     │ Server  │     │ (Verify)│
└─────────┘     └─────────┘     └────┬────┘     └────┬────┘     └────┬────┘
                                     │               │               │
                                     │  1. Sign In   │               │
                                     │──────────────>│               │
                                     │               │               │
                                     │  2. JWT Token │               │
                                     │<──────────────│               │
                                     │               │               │
                                     │  3. API Call  │               │
                                     │   + JWT       │               │
                                     │──────────────>│               │
                                     │               │               │
                                     │               │ 4. Verify JWT │
                                     │               │──────────────>│
                                     │               │               │
                                     │               │ 5. Valid/Invalid
                                     │               │<──────────────│
                                     │               │               │
                                     │  6. Response  │               │
                                     │<──────────────│               │
                                     │               │               │
                                     │               │ 7. Sync User  │
                                     │               │────┐          │
                                     │               │    │          │
                                     │               │<───┘          │
                                     │               │ (if new user) │
                                     │               │               │
```

**Flow Description:**
1. User authenticates with Clerk (email/password, OAuth, etc.)
2. Clerk returns JWT token to mobile app
3. Mobile app includes JWT in `Authorization: Bearer <token>` header
4. API server validates JWT signature against Clerk JWKS
5. If valid, API extracts user claims (user_id, email)
6. API syncs user to local database if not exists
7. Request proceeds with authenticated user context

### 5.2 Hello Entity CRUD Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────>│  Mobile │────>│   API   │────>│  AuthZ  │────>│  Prisma │
│         │     │   App   │     │ Server  │     │  Check  │     │  ORM    │
└─────────┘     └─────────┘     └────┬────┘     └─────────┘     └────┬────┘
                                     │                               │
                                     │  1. Create Entity             │
                                     │  POST /hello-entities         │
                                     │  { name: "Foo" }              │
                                     │──────────────────────────────>│
                                     │                               │
                                     │  2. Validate Input (Zod)      │
                                     │  3. Check Authorization       │
                                     │  4. Insert to Database        │
                                     │                               │
                                     │  5. Write Audit Log           │
                                     │  6. Return 201 Created        │
                                     │<──────────────────────────────│
                                     │                               │
                                     │  7. Show Success              │
                                     │<──────────────────────────────│
```

### 5.3 Audit Logging Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Action    │────>│   Audit     │────>│  Database   │────>│   Admin     │
│  Trigger    │     │   Service   │     │  (append)   │     │   Query     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘

1. Any CREATE/UPDATE/DELETE action triggers audit
2. Audit service constructs log entry:
   {
     id: uuid(),
     action: "HELLO_ENTITY_CREATE",
     entity_type: "hello_entity",
     entity_id: "uuid",
     user_id: "user_uuid",
     timestamp: new Date(),
     metadata: { name: "Foo", changes: {...} }
   }
3. Entry appended to audit_logs table (immutable)
4. Admins can query with filters (date range, user, entity type)
```

### 5.4 User Synchronization Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Clerk  │────>│ Webhook │────>│   API   │────>│  Users  │
│  Event  │     │ Handler │     │ Server  │     │  Table  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘

Events Handled:
- user.created   → Create user record, assign default role
- user.updated   → Update email/name if changed
- user.deleted   → Soft delete or anonymize
- session.created → Optional: track active sessions

Webhook Security:
- Clerk-Signature header verification
- Idempotency key handling
- Retry with exponential backoff
```

---

## 6. Component Details

### 6.1 API Server (Node.js + Fastify)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Fastify Application                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Routes    │  │  Middleware │  │   Plugins   │             │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤             │
│  │ /health     │  │ CORS        │  │ JWT Auth    │             │
│  │ /auth/*     │  │ Helmet      │  │ Prisma      │             │
│  │ /users/*    │  │ Rate Limit  │  │ S3 Client   │             │
│  │ /hello-entities│ Request ID │  │ Logger      │             │
│  │ /audit-logs │  │ Compression │  │ Validator   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Service Layer                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  Auth    │  │  User    │  │  Hello   │  │  Audit   │ │   │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Data Access Layer                     │   │
│  │              (Prisma Client / Repository Pattern)        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Dependencies:**
```json
{
  "fastify": "^4.x",
  "@fastify/jwt": "^7.x",
  "@fastify/cors": "^8.x",
  "@fastify/helmet": "^11.x",
  "@fastify/rate-limit": "^9.x",
  "@prisma/client": "^5.x",
  "zod": "^3.x",
  "pino": "^8.x"
}
```

### 6.2 Mobile Application (Flutter)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Flutter Application                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Presentation Layer                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  Login   │  │   Home   │  │  Entity  │  │ Profile  │ │   │
│  │  │  Screen  │  │  Screen  │  │  Form    │  │  Screen  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    State Management (Riverpod)           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │ Auth     │  │ User     │  │ Entity   │  │ App      │ │   │
│  │  │ Provider │  │ Provider │  │ Provider │  │ Provider │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Domain Layer                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │  Models  │  │ Use Cases│  │ Repository│  Interfaces │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Data Layer                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ API      │  │ Local    │  │ Clerk    │              │   │
│  │  │ Client   │  │ Storage  │  │ Client   │              │   │
│  │  │ (Dio)    │  │(Hive/SP) │  │          │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Navigation (go_router)                │   │
│  │  /login → /home → /entities → /entities/:id            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Dependencies:**
```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.x
  dio: ^5.x
  go_router: ^12.x
  clerk_flutter: ^0.x
  hive: ^2.x
  freezed_annotation: ^2.x
```

### 6.3 Database Schema (PostgreSQL + Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique // 'user' | 'admin'
  permissions String[]
  createdAt   DateTime @default(now()) @map("created_at")
  
  users       User[]
  
  @@map("roles")
}

model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique @map("clerk_id")
  email     String   @unique
  name      String
  roleId    String   @map("role_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  role        Role         @relation(fields: [roleId], references: [id])
  auditLogs   AuditLog[]
  helloEntities HelloEntity[]
  
  @@map("users")
}

model AuditLog {
  id         String   @id @default(uuid())
  action     String   // CREATE, UPDATE, DELETE, etc.
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  userId     String   @map("user_id")
  timestamp  DateTime @default(now())
  metadata   Json?    // Additional context
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([timestamp])
  @@map("audit_logs")
}

model HelloEntity {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  createdBy String   @map("created_by")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  creator User @relation(fields: [createdBy], references: [id])
  
  @@index([createdBy])
  @@map("hello_entities")
}
```

---

## 7. Security Architecture

### 7.1 Defense Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Network Security                                       │
│  - VPC with private subnets                                      │
│  - Security groups (least privilege)                             │
│  - WAF for DDoS protection                                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Transport Security                                     │
│  - TLS 1.3 for all communications                                │
│  - HSTS headers                                                  │
│  - Certificate pinning (mobile)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Application Security                                   │
│  - JWT validation (RS256)                                        │
│  - Rate limiting (per user, per IP)                              │
│  - Input validation (Zod schemas)                                │
│  - Output encoding                                               │
│  - CORS configuration                                            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Data Security                                          │
│  - Encryption at rest (AES-256)                                  │
│  - Parameterized queries (Prisma)                                │
│  - Field-level encryption for PII                                │
│  - Audit logging                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: Identity Security                                      │
│  - Clerk-managed authentication                                  │
│  - MFA support                                                   │
│  - Session management                                            │
│  - Brute force protection                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Sequence

```
┌─────────┐          ┌─────────┐          ┌─────────┐          ┌─────────┐
│ Client  │          │  API    │          │  Clerk  │          │  JWKS   │
└────┬────┘          └────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │                    │
     │  Request + JWT     │                    │                    │
     │───────────────────>│                    │                    │
     │                    │                    │                    │
     │                    │  Validate Token    │                    │
     │                    │  (Local cache)     │                    │
     │                    │  or                │                    │
     │                    │  Fetch JWKS        │                    │
     │                    │───────────────────>│                    │
     │                    │                    │                    │
     │                    │                    │  Get Public Keys   │
     │                    │                    │───────────────────>│
     │                    │                    │<───────────────────│
     │                    │                    │                    │
     │                    │<───────────────────│                    │
     │                    │                    │                    │
     │                    │  Verify Signature  │                    │
     │                    │  Check Expiration  │                    │
     │                    │  Extract Claims    │                    │
     │                    │                    │                    │
     │  Response          │                    │                    │
     │<───────────────────│                    │                    │
     │                    │                    │                    │
```

---

## 8. Scalability Strategy

### 8.1 Horizontal Scaling

```
                    ┌─────────────┐
                    │   Load      │
                    │  Balancer   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   API       │ │   API       │ │   API       │
    │   Server 1  │ │   Server 2  │ │   Server N  │
    │   (Stateless)│ │  (Stateless)│ │  (Stateless)│
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼────┐ ┌────▼──────┐
       │  Primary    │ │ Read   │ │  Redis    │
       │  Postgres   │ │ Replica│ │  Cluster  │
       └─────────────┘ └────────┘ └───────────┘
```

### 8.2 Caching Strategy

| Cache Type | TTL | Use Case |
|------------|-----|----------|
| JWT Validation | 1 hour | JWKS key caching |
| User Session | 24 hours | Active session data |
| User Profile | 5 minutes | Frequently accessed profiles |
| Hello Entities List | 1 minute | Entity lists per user |
| Rate Limit Counters | 1 minute | Request counting |

---

## 9. Monitoring & Observability

### 9.1 Metrics

| Category | Metric | Alert Threshold |
|----------|--------|-----------------|
| **Performance** | API Response Time (p95) | > 500ms |
| **Performance** | Database Query Time (p95) | > 100ms |
| **Reliability** | Error Rate | > 1% |
| **Reliability** | API Uptime | < 99.9% |
| **Business** | Active Users | N/A |
| **Business** | Failed Auth Attempts | > 10/min |

### 9.2 Logging Levels

| Level | Usage |
|-------|-------|
| ERROR | Exceptions, failed operations, security events |
| WARN | Degraded performance, retry attempts |
| INFO | Successful operations, state changes |
| DEBUG | Detailed flow information (dev only) |

### 9.3 Structured Log Format

```json
{
  "timestamp": "2026-02-19T10:30:00.000Z",
  "level": "info",
  "service": "foundation-api",
  "version": "1.0.0",
  "requestId": "req-uuid",
  "userId": "user-uuid",
  "method": "POST",
  "path": "/v1/hello-entities",
  "statusCode": 201,
  "durationMs": 45,
  "message": "Hello entity created"
}
```

---

## 10. Disaster Recovery

### 10.1 Backup Strategy

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| PostgreSQL | Continuous | 30 days | Point-in-time recovery |
| PostgreSQL | Daily | 90 days | Automated snapshots |
| S3 Objects | Versioned | 90 days | Object versioning |
| Redis | None | N/A | Ephemeral cache only |

### 10.2 Recovery Procedures

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Single AZ failure | 5 min | 0 | Auto-failover to standby |
| Database corruption | 30 min | 1 hour | Restore from snapshot |
| Complete region failure | 4 hours | 1 hour | Failover to DR region |
| Data deletion | 1 hour | 1 hour | Point-in-time restore |

---

## 11. Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Mobile | Flutter | 3.x |
| Mobile State | Riverpod | 2.x |
| Mobile HTTP | Dio | 5.x |
| Mobile Routing | go_router | 12.x |
| Backend Runtime | Node.js | 20 LTS |
| Backend Framework | Fastify | 4.x |
| Database | PostgreSQL | 15+ |
| ORM | Prisma | 5.x |
| Cache | Redis | 7.x |
| Auth | Clerk | Latest |
| Storage | S3/MinIO | - |
| Container | Docker | 24.x |
| Orchestration | ECS/EKS | - |
| Load Balancer | Nginx/ALB | - |
| Monitoring | CloudWatch/Prometheus | - |

---

## 12. Appendix

### A. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_JWKS_URL=https://clerk.example.com/.well-known/jwks.json

# S3/MinIO
S3_ENDPOINT=s3.amazonaws.com
S3_BUCKET=foundation-storage
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1

# Redis
REDIS_URL=redis://localhost:6379

# App
NODE_ENV=production
PORT=3000
API_VERSION=v1
LOG_LEVEL=info
```
