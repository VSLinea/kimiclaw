# Security Documentation

This document outlines the security architecture, policies, and procedures for the foundation system. It serves as a comprehensive guide for the development team to build and maintain a secure application.

---

## Table of Contents

1. [Threat Model](#threat-model)
2. [Secret Handling Strategy](#secret-handling-strategy)
3. [RBAC Policy Definition](#rbac-policy-definition)
4. [Auth Provider Security Considerations](#auth-provider-security-considerations)
5. [Dependency Risk Assessment](#dependency-risk-assessment)
6. [Security Headers and CORS Policy](#security-headers-and-cors-policy)
7. [Rate Limiting Strategy](#rate-limiting-strategy)
8. [Data Retention and Privacy](#data-retention-and-privacy)
9. [Audit Logging Requirements](#audit-logging-requirements)
10. [Incident Response](#incident-response)

---

## Threat Model

### STRIDE Analysis

STRIDE is a threat classification model developed by Microsoft that identifies six categories of security threats:

| Threat Category | Description | Mitigation Strategy |
|----------------|-------------|---------------------|
| **S**poofing | Impersonating another user or system | Strong authentication, MFA, session management |
| **T**ampering | Modifying data in transit or at rest | Data integrity checks, encryption, digital signatures |
| **R**epudiation | Denying that an action occurred | Comprehensive audit logging, non-repudiable timestamps |
| **I**nformation Disclosure | Exposing data to unauthorized parties | Encryption, access controls, least privilege |
| **D**enial of Service | Disrupting service availability | Rate limiting, resource quotas, DDoS protection |
| **E**levation of Privilege | Gaining unauthorized access levels | RBAC, input validation, principle of least privilege |

### Application-Specific Threat Scenarios

#### 1. Authentication & Authorization

| Threat | STRIDE | Risk Level | Mitigation |
|--------|--------|------------|------------|
| Credential stuffing attacks | Spoofing | High | Rate limiting, CAPTCHA, account lockout |
| Session hijacking | Spoofing | High | Secure cookies, HttpOnly, SameSite, short TTL |
| JWT token theft | Information Disclosure | High | Short-lived tokens, refresh token rotation |
| Privilege escalation | Elevation of Privilege | Critical | Strict RBAC, middleware validation, server-side checks |
| OAuth flow manipulation | Tampering | High | PKCE, state parameter validation, redirect URI whitelist |

#### 2. Data Protection

| Threat | STRIDE | Risk Level | Mitigation |
|--------|--------|------------|------------|
| SQL/NoSQL injection | Tampering | Critical | Parameterized queries, ORM, input validation |
| XSS attacks | Tampering | High | Output encoding, CSP headers, React auto-escaping |
| CSRF attacks | Tampering | Medium | CSRF tokens, SameSite cookies, origin validation |
| Sensitive data exposure | Information Disclosure | Critical | Encryption at rest and in transit, field-level encryption |
| API key leakage | Information Disclosure | Critical | Environment variables, key rotation, vault integration |

#### 3. Infrastructure

| Threat | STRIDE | Risk Level | Mitigation |
|--------|--------|------------|------------|
| DDoS attacks | Denial of Service | High | CDN, rate limiting, WAF, auto-scaling |
| Dependency vulnerabilities | Tampering | High | Automated scanning, SBOM, dependency pinning |
| Secret exposure in logs | Information Disclosure | Critical | Log sanitization, structured logging with filtering |
| Container escape | Elevation of Privilege | High | Non-root containers, read-only filesystems, seccomp |

---

## Secret Handling Strategy

### Core Principles

1. **No Secrets in Repository**: Under no circumstances should secrets be committed to version control
2. **Environment Variables Only**: All secrets must be injected via environment variables
3. **Least Privilege**: Secrets should have the minimum required permissions
4. **Rotation Ready**: All secrets must be rotatable without code changes
5. **Audit Trail**: All secret access must be logged

### Environment Variable Schema

#### Required Environment Variables

```bash
# ============================================
# APPLICATION CONFIGURATION
# ============================================
# Node environment: development, staging, production
NODE_ENV=production

# Application port
PORT=3000

# Application base URL
APP_URL=https://app.example.com

# ============================================
# DATABASE CONFIGURATION
# ============================================
# Database connection string (use connection pooling in production)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Database connection pool size
DATABASE_POOL_SIZE=20

# Database connection timeout (ms)
DATABASE_CONNECTION_TIMEOUT=30000

# ============================================
# AUTHENTICATION - CLERK
# ============================================
# Clerk publishable key (safe for frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Clerk secret key (backend only)
CLERK_SECRET_KEY=sk_test_...

# Clerk webhook secret for verifying webhook signatures
CLERK_WEBHOOK_SECRET=whsec_...

# JWT signing key (if using custom JWTs)
JWT_SECRET=your-256-bit-secret-minimum-32-characters

# JWT expiration time
JWT_EXPIRATION=15m

# Refresh token expiration time
REFRESH_TOKEN_EXPIRATION=7d

# ============================================
# ENCRYPTION KEYS
# ============================================
# Master encryption key for sensitive data (AES-256)
ENCRYPTION_KEY=your-256-bit-encryption-key-32-chars

# Key ID for key rotation tracking
ENCRYPTION_KEY_ID=v1

# Previous encryption key (for rotation period)
ENCRYPTION_KEY_PREVIOUS=

# ============================================
# EXTERNAL SERVICES
# ============================================
# Redis/Cache connection
REDIS_URL=redis://:password@host:6379

# Email service (Resend, SendGrid, etc.)
EMAIL_API_KEY=re_...
EMAIL_FROM_DOMAIN=example.com

# File storage (S3, R2, etc.)
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
STORAGE_BUCKET_NAME=...
STORAGE_ENDPOINT=...
STORAGE_REGION=auto

# Payment processor (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# ============================================
# MONITORING & LOGGING
# ============================================
# Sentry DSN for error tracking
SENTRY_DSN=https://...@sentry.io/...

# Log level: debug, info, warn, error
LOG_LEVEL=info

# Enable structured JSON logging
LOG_FORMAT=json

# ============================================
# SECURITY CONFIGURATION
# ============================================
# Rate limiting requests per minute per IP
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Rate limiting burst allowance
RATE_LIMIT_BURST=20

# CORS allowed origins (comma-separated)
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# CSP nonce generation secret
CSP_NONCE_SECRET=your-csp-nonce-secret-min-32-chars

# ============================================
# FEATURE FLAGS
# ============================================
# Enable/disable specific features
FEATURE_BETA_ACCESS=false
FEATURE_ADVANCED_ANALYTICS=true
```

### .env.example Template

Create a `.env.example` file in your repository root:

```bash
# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/database
DATABASE_POOL_SIZE=10
DATABASE_CONNECTION_TIMEOUT=30000

# ============================================
# AUTHENTICATION - CLERK
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT Configuration
JWT_SECRET=your-jwt-secret-min-32-characters
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# ============================================
# ENCRYPTION KEYS
# ============================================
ENCRYPTION_KEY=your-256-bit-encryption-key-32-chars
ENCRYPTION_KEY_ID=v1
ENCRYPTION_KEY_PREVIOUS=

# ============================================
# EXTERNAL SERVICES
# ============================================
REDIS_URL=redis://localhost:6379

EMAIL_API_KEY=your-email-api-key
EMAIL_FROM_DOMAIN=localhost

STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
STORAGE_BUCKET_NAME=your-bucket
STORAGE_ENDPOINT=https://storage.example.com
STORAGE_REGION=auto

STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable

# ============================================
# MONITORING & LOGGING
# ============================================
SENTRY_DSN=
LOG_LEVEL=debug
LOG_FORMAT=pretty

# ============================================
# SECURITY CONFIGURATION
# ============================================
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST=20
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
CSP_NONCE_SECRET=your-csp-nonce-secret-min-32-chars

# ============================================
# FEATURE FLAGS
# ============================================
FEATURE_BETA_ACCESS=false
FEATURE_ADVANCED_ANALYTICS=false
```

### Secret Validation

Implement a configuration validation module:

```typescript
// config/validate.ts
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1).regex(/^sk_/),
  ENCRYPTION_KEY: z.string().min(32),
  // ... other validations
});

export function validateConfig() {
  const result = configSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    result.error.errors.forEach(err => {
      console.error(`  - ${err.path}: ${err.message}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Environment configuration validated');
  return result.data;
}
```

---

## RBAC Policy Definition

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        SUPER_ADMIN                          │
│              (Full system access - break glass)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    ADMIN     │ │   MANAGER    │ │   SUPPORT    │
│  (Platform   │ │  (Team/Org   │ │  (Customer   │
│   Admin)     │ │   Manager)   │ │   Support)   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
               ┌────────────────┐
               │     USER       │
               │ (Standard User)│
               └────────────────┘
```

### Permission Matrix

| Permission | USER | SUPPORT | MANAGER | ADMIN | SUPER_ADMIN |
|------------|:----:|:-------:|:-------:|:-----:|:-----------:|
| **User Management** |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View other users | ❌ | ✅ (limited) | ✅ (org) | ✅ | ✅ |
| Edit other users | ❌ | ❌ | ✅ (org) | ✅ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Content Management** |
| Create content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit others' content | ❌ | ✅ (limited) | ✅ (org) | ✅ | ✅ |
| Delete content | ❌ | ✅ (limited) | ✅ (org) | ✅ | ✅ |
| Moderate content | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Organization** |
| View organization | ✅ (own) | ✅ | ✅ | ✅ | ✅ |
| Edit organization | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage billing | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage integrations | ❌ | ❌ | ✅ | ✅ | ✅ |
| **System** |
| View audit logs | ❌ | ❌ | ✅ (org) | ✅ | ✅ |
| View system logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage security settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| Access super admin | ❌ | ❌ | ❌ | ❌ | ✅ |

### Role Definitions

#### USER (Standard User)
```typescript
const userRole = {
  id: 'user',
  name: 'User',
  description: 'Standard application user',
  permissions: [
    'profile:read:own',
    'profile:write:own',
    'content:create',
    'content:read:own',
    'content:write:own',
    'content:delete:own',
    'organization:read:own',
  ],
  constraints: {
    maxProjects: 5,
    maxStorage: '1GB',
    maxApiCalls: 1000, // per day
  },
};
```

#### SUPPORT (Customer Support)
```typescript
const supportRole = {
  id: 'support',
  name: 'Support',
  description: 'Customer support representative',
  permissions: [
    ...userRole.permissions,
    'user:read:limited', // Can view basic user info for support tickets
    'content:read:all',
    'content:moderate',
    'ticket:manage',
  ],
  constraints: {
    dataAccess: 'read-only-except-tickets',
    piiAccess: 'masked',
    sessionRecording: true,
  },
};
```

#### MANAGER (Team/Organization Manager)
```typescript
const managerRole = {
  id: 'manager',
  name: 'Manager',
  description: 'Organization or team manager',
  permissions: [
    ...userRole.permissions,
    'user:read:org',
    'user:write:org',
    'content:read:org',
    'content:write:org',
    'content:delete:org',
    'organization:write',
    'billing:manage',
    'integration:manage',
    'audit:read:org',
  ],
  constraints: {
    maxTeamMembers: 50,
    canInvite: true,
    canRemoveMembers: true,
  },
};
```

#### ADMIN (Platform Administrator)
```typescript
const adminRole = {
  id: 'admin',
  name: 'Admin',
  description: 'Platform administrator',
  permissions: [
    ...managerRole.permissions,
    'user:read:all',
    'user:write:all',
    'user:delete',
    'role:manage',
    'system:read',
    'security:manage',
    'audit:read:all',
  ],
  constraints: {
    requiresMfa: true,
    sessionTimeout: '8h',
    ipWhitelist: true,
  },
};
```

#### SUPER_ADMIN (Break Glass)
```typescript
const superAdminRole = {
  id: 'super_admin',
  name: 'Super Admin',
  description: 'Emergency access - requires approval',
  permissions: ['*'], // All permissions
  constraints: {
    requiresMfa: true,
    requiresApproval: true,
    sessionTimeout: '2h',
    auditLevel: 'maximum',
    notificationChannels: ['email', 'slack', 'pagerduty'],
  },
};
```

### Permission Format

Permissions follow the format: `{resource}:{action}:{scope}`

- **Resource**: `user`, `content`, `organization`, `billing`, `system`, etc.
- **Action**: `create`, `read`, `write`, `delete`, `manage`, `moderate`, etc.
- **Scope**: `own`, `org`, `all`, or specific IDs

### Implementation Example

```typescript
// middleware/rbac.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserRole, hasPermission } from '@/lib/auth';

export async function rbacMiddleware(
  request: NextRequest,
  requiredPermission: string
) {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = await getUserRole(userId);
  
  if (!hasPermission(userRole, requiredPermission)) {
    // Log denied access attempt
    await logAccessDenied(userId, requiredPermission, request.url);
    
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return NextResponse.next();
}
```

---

## Auth Provider Security Considerations

### Clerk Authentication

#### Security Configuration

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Routes that don't require authentication
  publicRoutes: ['/sign-in', '/sign-up', '/api/webhooks/clerk'],
  
  // Routes that are completely ignored
  ignoredRoutes: ['/api/health', '/_next/static'],
  
  // Security settings
  debug: process.env.NODE_ENV === 'development',
  
  // Session configuration
  session: {
    // Maximum session duration
    maxAge: 7 * 24 * 60 * 60, // 7 days
    
    // Update session on every request
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // After authentication callback
  afterAuth(auth, req, evt) {
    // Handle MFA requirements
    if (requiresMfa(auth.userId) && !auth.sessionClaims.mfa_verified) {
      return Response.redirect(new URL('/mfa', req.url));
    }
  },
});
```

#### Webhook Security

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const payload = await req.text();
  const headersList = headers();
  
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');
  
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }
  
  const wh = new Webhook(webhookSecret);
  
  try {
    const evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
    
    // Process the webhook event
    await processWebhookEvent(evt);
    
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }
}
```

#### Session Security Checklist

- [ ] Enable MFA for all admin accounts
- [ ] Configure session timeouts (recommend 7 days max)
- [ ] Implement concurrent session limits
- [ ] Enable suspicious activity detection
- [ ] Configure logout from all devices capability
- [ ] Implement session invalidation on password change
- [ ] Enable IP-based anomaly detection

### JWT Security

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';

export function generateTokens(userId: string, role: string) {
  // Access token - short lived
  const accessToken = jwt.sign(
    { 
      sub: userId, 
      role,
      type: 'access',
      jti: generateJTI(), // Unique token ID for revocation
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRATION,
      algorithm: 'HS256',
      issuer: process.env.APP_URL,
      audience: process.env.APP_URL,
    }
  );
  
  // Refresh token - longer lived, single use
  const refreshToken = jwt.sign(
    { 
      sub: userId,
      type: 'refresh',
      jti: generateJTI(),
    },
    JWT_SECRET,
    { 
      expiresIn: '7d',
      algorithm: 'HS256',
    }
  );
  
  return { accessToken, refreshToken };
}

export function verifyToken(token: string, expectedType: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // Explicitly allow only HS256
      issuer: process.env.APP_URL,
      audience: process.env.APP_URL,
    }) as jwt.JwtPayload;
    
    if (decoded.type !== expectedType) {
      throw new Error('Invalid token type');
    }
    
    // Check if token is revoked
    if (await isTokenRevoked(decoded.jti)) {
      throw new Error('Token has been revoked');
    }
    
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
}
```

---

## Dependency Risk Assessment

### Dependency Management Policy

#### Allowed Dependency Sources

| Source | Risk Level | Approval Required | Notes |
|--------|------------|-------------------|-------|
| npm registry (official) | Low | No | Use npm audit regularly |
| GitHub releases | Medium | Yes | Must be from verified publisher |
| Private registry | Low | No | Internal packages only |
| Direct git URLs | High | Yes | Pin to specific commit hash |
| Local/file dependencies | Low | No | Development only |

### Security Scanning

#### Automated Scanning Pipeline

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          
      - name: Generate SBOM
        run: npm sbom --format=spdx-json > sbom.json
        
      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.json
```

### Dependency Update Strategy

#### Severity-Based Response

| Severity | Response Time | Action |
|----------|---------------|--------|
| Critical | Immediate (< 4 hours) | Emergency patch, consider temporary disable |
| High | 24 hours | Update within 1 business day |
| Moderate | 7 days | Include in next sprint |
| Low | 30 days | Address in regular maintenance |

### Package.json Security Configuration

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "engineStrict": true,
  "overrides": {
    "lodash": "^4.17.21",
    "minimist": "^1.2.8"
  },
  "scripts": {
    "audit:fix": "npm audit fix",
    "audit:check": "npm audit --audit-level=moderate",
    "outdated": "npm outdated",
    "deps:update": "npm update",
    "deps:check": "npm-check-updates"
  }
}
```

### License Compliance

```javascript
// scripts/license-check.js
const checker = require('license-checker');

const allowedLicenses = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'CC0-1.0',
  'Unlicense',
];

const forbiddenLicenses = [
  'GPL-1.0',
  'GPL-2.0',
  'GPL-3.0',
  'AGPL-1.0',
  'AGPL-3.0',
];

checker.init({
  start: './',
}, function(err, packages) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  const violations = Object.entries(packages).filter(([name, info]) => {
    return forbiddenLicenses.some(forbidden => 
      info.licenses?.includes(forbidden)
    );
  });
  
  if (violations.length > 0) {
    console.error('❌ Forbidden licenses found:');
    violations.forEach(([name, info]) => {
      console.error(`  - ${name}: ${info.licenses}`);
    });
    process.exit(1);
  }
  
  console.log('✅ All licenses compliant');
});
```

---

## Security Headers and CORS Policy

### Security Headers Configuration

#### Next.js Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Content Security Policy (CSP)

```typescript
// middleware.ts - CSP Generation
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export function middleware(request: Request) {
  const nonce = nanoid();
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://clerk.example.com;
    style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.amazonaws.com https://cdn.example.com;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    connect-src 'self' https://api.example.com https://*.clerk.accounts.dev wss://realtime.example.com;
    media-src 'self';
    child-src 'self';
    worker-src 'self' blob:;
  `.replace(/\s+/g, ' ').trim();
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  response.headers.set('Content-Security-Policy', cspHeader);
  
  return response;
}
```

### CORS Configuration

```typescript
// lib/cors.ts
import Cors from 'cors';

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
];

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Middleware wrapper
export function runMiddleware(req: any, res: any, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
```

### Cookie Security

```typescript
// lib/cookies.ts
import { serialize, parse } from 'cookie';

const isProduction = process.env.NODE_ENV === 'production';

export const defaultCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export function setSecureCookie(
  res: any,
  name: string,
  value: string,
  options: Partial<typeof defaultCookieOptions> = {}
) {
  const cookie = serialize(name, value, {
    ...defaultCookieOptions,
    ...options,
  });
  
  res.setHeader('Set-Cookie', cookie);
}

export function clearCookie(res: any, name: string) {
  const cookie = serialize(name, '', {
    ...defaultCookieOptions,
    maxAge: 0,
  });
  
  res.setHeader('Set-Cookie', cookie);
}
```

---

## Rate Limiting Strategy

### Rate Limiting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Rate Limiting Layers                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: CDN/WAF (Cloudflare/AWS WAF)                      │
│  - DDoS protection                                          │
│  - Geographic blocking                                      │
│  - IP reputation filtering                                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: API Gateway / Reverse Proxy                       │
│  - Global rate limits                                       │
│  - Per-IP rate limits                                       │
│  - Method-based limits                                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Application Layer                                 │
│  - Per-user rate limits                                     │
│  - Per-endpoint limits                                      │
│  - Resource-specific limits                                 │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Database/Resource Layer                           │
│  - Connection pooling                                       │
│  - Query timeouts                                           │
│  - Resource quotas                                          │
└─────────────────────────────────────────────────────────────┘
```

### Rate Limit Configuration

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Different rate limit strategies
export const rateLimits = {
  // Strict: Authentication endpoints
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:strict',
  }),
  
  // Standard: General API usage
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:standard',
  }),
  
  // Generous: Read-heavy operations
  generous: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    analytics: true,
    prefix: 'ratelimit:generous',
  }),
  
  // Burst: Short-term high volume
  burst: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(50, '10 s'),
    analytics: true,
    prefix: 'ratelimit:burst',
  }),
};

// Rate limit by user tier
export async function checkRateLimit(
  userId: string,
  tier: 'free' | 'pro' | 'enterprise',
  endpoint: string
) {
  const limits = {
    free: { requests: 100, window: '1 m' },
    pro: { requests: 1000, window: '1 m' },
    enterprise: { requests: 10000, window: '1 m' },
  };
  
  const limit = limits[tier];
  const key = `ratelimit:${userId}:${endpoint}`;
  
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit.requests, limit.window as any),
    prefix: 'ratelimit:tiered',
  });
  
  return await ratelimit.limit(key);
}
```

### Rate Limit Middleware

```typescript
// middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimits } from '@/lib/rate-limit';

export async function rateLimitMiddleware(
  request: NextRequest,
  type: 'strict' | 'standard' | 'generous' | 'burst' = 'standard'
) {
  const ip = request.ip ?? '127.0.0.1';
  const identifier = `${ip}:${request.nextUrl.pathname}`;
  
  const { success, limit, reset, remaining } = await rateLimits[type].limit(
    identifier
  );
  
  const response = success
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  
  if (!success) {
    response.headers.set('Retry-After', Math.ceil((reset - Date.now()) / 1000).toString());
    
    // Log rate limit exceeded
    console.warn(`Rate limit exceeded: ${identifier}`);
  }
  
  return response;
}
```

### Endpoint-Specific Limits

| Endpoint Category | Rate Limit | Burst Allowance | Notes |
|-------------------|------------|-----------------|-------|
| Authentication | 5/min | 10/min | Login, password reset |
| User registration | 3/hour | 5/hour | Account creation |
| API - Read | 1000/min | 1500/min | GET requests |
| API - Write | 100/min | 200/min | POST/PUT/PATCH |
| API - Delete | 50/min | 100/min | DELETE requests |
| File upload | 10/min | 20/min | Per user |
| Webhooks | 100/min | - | Incoming webhooks |
| Export | 5/hour | 10/hour | Data exports |

---

## Data Retention and Privacy

### Data Classification

| Classification | Description | Retention Period | Encryption |
|----------------|-------------|------------------|------------|
| **Public** | Non-sensitive, publicly available | Indefinite | None |
| **Internal** | Business data, non-PII | 7 years | At rest |
| **Confidential** | Business secrets, limited access | 7 years | At rest + in transit |
| **Restricted** | PII, financial, health data | Per regulation | Full encryption + tokenization |

### Retention Policy by Data Type

```typescript
// lib/data-retention.ts
export const retentionPolicies = {
  // User data
  userProfile: {
    active: 'indefinite',
    deleted: '30 days', // Soft delete grace period
    archived: '7 years',
  },
  
  // Session data
  sessions: {
    active: '30 days',
    expired: '7 days',
  },
  
  // Audit logs
  auditLogs: {
    hot: '90 days',      // Primary storage
    warm: '1 year',      // Secondary storage
    cold: '7 years',     // Archive storage
  },
  
  // Application logs
  appLogs: {
    error: '90 days',
    info: '30 days',
    debug: '7 days',
  },
  
  // User-generated content
  content: {
    active: 'indefinite',
    deleted: '30 days',  // Soft delete
    purged: '1 year',    // Hard delete after purge
  },
  
  // Financial data
  financial: {
    transactions: '7 years',
    invoices: '7 years',
    paymentMethods: 'until deletion + 1 year',
  },
  
  // Communication
  communications: {
    emails: '2 years',
    supportTickets: '3 years',
    chatLogs: '1 year',
  },
};
```

### GDPR/CCPA Compliance

#### Data Subject Rights Implementation

```typescript
// lib/privacy/data-subject.ts
export async function handleDataRequest(
  userId: string,
  requestType: 'access' | 'deletion' | 'portability' | 'rectification'
) {
  switch (requestType) {
    case 'access':
      return await exportUserData(userId);
      
    case 'deletion':
      // Validate no legal holds
      if (await hasLegalHold(userId)) {
        throw new Error('Account subject to legal hold');
      }
      return await scheduleUserDeletion(userId);
      
    case 'portability':
      return await exportUserDataPortable(userId);
      
    case 'rectification':
      // Redirect to profile editing
      return { redirect: '/profile/edit' };
  }
}

async function scheduleUserDeletion(userId: string) {
  // Soft delete immediately
  await softDeleteUser(userId);
  
  // Schedule hard delete after grace period
  await scheduleJob('hard-delete-user', {
    userId,
    executeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
  
  // Notify integrations
  await notifyDataDeletion(userId);
  
  return { scheduled: true, deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
}
```

### Data Anonymization

```typescript
// lib/privacy/anonymize.ts
import { faker } from '@faker-js/faker';

export function anonymizeUser(user: User) {
  return {
    ...user,
    email: `anonymized-${user.id}@deleted.local`,
    name: 'Deleted User',
    avatar: null,
    phone: null,
    address: null,
    // Keep non-PII for analytics
    createdAt: user.createdAt,
    accountAge: Date.now() - user.createdAt.getTime(),
    // Remove sensitive data
    passwordHash: null,
    sessions: [],
    tokens: [],
  };
}

export function pseudonymizeData(data: any, key: string) {
  // Consistent pseudonymization using HMAC
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', process.env.PSEUDONYMIZATION_KEY)
    .update(`${key}:${data}`)
    .digest('hex')
    .slice(0, 16);
}
```

### Privacy Policy Checklist

- [ ] Clear data collection disclosure
- [ ] Purpose limitation statements
- [ ] Third-party sharing disclosure
- [ ] Cookie policy
- [ ] User rights explanation
- [ ] Contact information for privacy requests
- [ ] Data breach notification procedure
- [ ] International transfer safeguards
- [ ] Children's privacy (COPPA compliance)
- [ ] Opt-out mechanisms

---

## Audit Logging Requirements

### Audit Event Schema

```typescript
// types/audit.ts
interface AuditEvent {
  // Event identification
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  eventVersion: string;
  
  // Actor information
  actor: {
    type: 'user' | 'system' | 'api' | 'webhook';
    id: string;
    email?: string;
    ip: string;
    userAgent: string;
    sessionId?: string;
  };
  
  // Action details
  action: {
    type: string;
    resource: string;
    resourceId: string;
    operation: 'create' | 'read' | 'update' | 'delete' | 'execute';
    status: 'success' | 'failure' | 'denied';
  };
  
  // Context
  context: {
    requestId: string;
    traceId: string;
    organizationId?: string;
    metadata?: Record<string, unknown>;
  };
  
  // Change tracking (for mutations)
  changes?: {
    before: unknown;
    after: unknown;
    diff: unknown;
  };
  
  // Risk assessment
  risk: {
    score: number; // 0-100
    factors: string[];
  };
}

type AuditEventType =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:mfa_enabled'
  | 'auth:password_changed'
  | 'user:created'
  | 'user:updated'
  | 'user:deleted'
  | 'role:changed'
  | 'data:exported'
  | 'data:deleted'
  | 'billing:payment'
  | 'security:settings_changed'
  | 'api:key_created'
  | 'api:key_revoked';
```

### Audit Logger Implementation

```typescript
// lib/audit/logger.ts
import { createHash } from 'crypto';

class AuditLogger {
  private async write(event: AuditEvent) {
    // Write to primary audit store (append-only)
    await this.writeToPrimary(event);
    
    // Write to SIEM if configured
    if (process.env.SIEM_ENDPOINT) {
      await this.forwardToSIEM(event);
    }
    
    // Alert on high-risk events
    if (event.risk.score >= 70) {
      await this.alertHighRisk(event);
    }
  }
  
  async logAuth(event: {
    type: 'login' | 'logout' | 'mfa' | 'password_change';
    userId: string;
    email: string;
    ip: string;
    userAgent: string;
    success: boolean;
    metadata?: Record<string, unknown>;
  }) {
    const auditEvent: AuditEvent = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      eventType: `auth:${event.type}` as AuditEventType,
      eventVersion: '1.0',
      actor: {
        type: 'user',
        id: event.userId,
        email: event.email,
        ip: event.ip,
        userAgent: event.userAgent,
      },
      action: {
        type: 'auth',
        resource: 'session',
        resourceId: event.userId,
        operation: 'execute',
        status: event.success ? 'success' : 'failure',
      },
      context: {
        requestId: getRequestId(),
        traceId: getTraceId(),
        metadata: event.metadata,
      },
      risk: this.calculateAuthRisk(event),
    };
    
    await this.write(auditEvent);
  }
  
  async logDataAccess(event: {
    userId: string;
    resource: string;
    resourceId: string;
    operation: 'create' | 'read' | 'update' | 'delete';
    before?: unknown;
    after?: unknown;
  }) {
    const auditEvent: AuditEvent = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      eventType: `data:${event.operation}` as AuditEventType,
      eventVersion: '1.0',
      actor: {
        type: 'user',
        id: event.userId,
        ip: getClientIp(),
        userAgent: getUserAgent(),
      },
      action: {
        type: 'data',
        resource: event.resource,
        resourceId: event.resourceId,
        operation: event.operation,
        status: 'success',
      },
      context: {
        requestId: getRequestId(),
        traceId: getTraceId(),
      },
      changes: event.before && event.after ? {
        before: this.sanitizeForAudit(event.before),
        after: this.sanitizeForAudit(event.after),
        diff: this.calculateDiff(event.before, event.after),
      } : undefined,
      risk: this.calculateDataRisk(event),
    };
    
    await this.write(auditEvent);
  }
  
  private sanitizeForAudit(data: unknown): unknown {
    // Remove sensitive fields from audit logs
    const sensitiveFields = ['password', 'token', 'secret', 'ssn', 'creditCard'];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = { ...data as Record<string, unknown> };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  private calculateAuthRisk(event: any): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;
    
    if (!event.success) {
      score += 20;
      factors.push('authentication_failure');
    }
    
    if (this.isNewDevice(event.userId, event.userAgent)) {
      score += 15;
      factors.push('new_device');
    }
    
    if (this.isUnusualLocation(event.userId, event.ip)) {
      score += 20;
      factors.push('unusual_location');
    }
    
    if (this.isOutsideBusinessHours(event.timestamp)) {
      score += 10;
      factors.push('outside_business_hours');
    }
    
    return { score: Math.min(score, 100), factors };
  }
}

export const auditLogger = new AuditLogger();
```

### Required Audit Events

| Event Category | Event Type | Retention | Alert Threshold |
|----------------|------------|-----------|-----------------|
| Authentication | Login success/failure | 7 years | 5 failures / 15 min |
| Authentication | MFA enable/disable | 7 years | Immediate |
| Authentication | Password change | 7 years | Immediate |
| Authorization | Permission denied | 3 years | 10 / hour |
| Authorization | Role change | 7 years | Immediate |
| Data | Export initiated | 7 years | Immediate |
| Data | Bulk delete | 7 years | Immediate |
| System | Configuration change | 7 years | Immediate |
| System | Security setting change | 7 years | Immediate |
| Billing | Payment processed | 7 years | None |
| API | Key created/revoked | 7 years | Immediate |

---

## Incident Response

### Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 - Critical** | System compromise, data breach | 15 minutes | RCE, full database exposure |
| **P1 - High** | Significant security impact | 1 hour | Privilege escalation, partial data exposure |
| **P2 - Medium** | Limited security impact | 4 hours | XSS, CSRF, information disclosure |
| **P3 - Low** | Minimal security impact | 24 hours | Missing headers, outdated dependencies |

### Incident Response Playbook

```markdown
## Security Incident Response

### 1. Detection
- Automated alerts from monitoring
- User reports
- External security reports

### 2. Triage
- Assess severity (P0-P3)
- Identify affected systems
- Determine scope of exposure

### 3. Containment
- Isolate affected systems
- Revoke compromised credentials
- Enable additional monitoring

### 4. Eradication
- Remove attacker access
- Patch vulnerabilities
- Update compromised secrets

### 5. Recovery
- Restore from clean backups
- Verify system integrity
- Gradual service restoration

### 6. Post-Incident
- Document timeline
- Conduct root cause analysis
- Update security measures
- Communication to stakeholders
```

### Emergency Contacts

```yaml
# security-contacts.yml
incident_response:
  primary: security@example.com
  slack: '#security-incidents'
  pagerduty: 'security-oncall'
  
escalation:
  level_1: 'security-team@example.com'
  level_2: 'cto@example.com'
  level_3: 'ceo@example.com'
  
external:
  cloudflare: 'https://dash.cloudflare.com/support'
  aws: 'https://aws.amazon.com/support'
  clerk: 'support@clerk.dev'
```

---

## Secret Rotation Procedures

### Rotation Schedule

| Secret Type | Rotation Frequency | Automated | Procedure |
|-------------|-------------------|-----------|-----------|
| Database credentials | 90 days | Yes | Blue-green rotation |
| API keys (external) | 180 days | Partial | Manual with vendor |
| JWT signing keys | 365 days | Yes | Gradual key rollover |
| Encryption keys | 365 days | Yes | Re-encrypt data |
| Service account keys | 90 days | Yes | Automated via CI/CD |
| Webhook secrets | On suspicion | Manual | Immediate rotation |

### Database Credential Rotation

```typescript
// scripts/rotate-db-credentials.ts
async function rotateDatabaseCredentials() {
  // 1. Generate new credentials
  const newCredentials = await generateSecureCredentials();
  
  // 2. Add new credentials to database (dual-auth period)
  await addDatabaseUser(newCredentials);
  
  // 3. Update application configuration
  await updateSecretManager({
    DATABASE_URL: buildConnectionString(newCredentials),
    DATABASE_URL_PREVIOUS: process.env.DATABASE_URL,
  });
  
  // 4. Rolling restart of application instances
  await rollingRestart();
  
  // 5. Verify all instances using new credentials
  await verifyConnections(newCredentials);
  
  // 6. Remove old credentials
  await removeDatabaseUser(extractCredentials(process.env.DATABASE_URL_PREVIOUS));
  
  // 7. Update secret manager to remove previous
  await updateSecretManager({
    DATABASE_URL: buildConnectionString(newCredentials),
    DATABASE_URL_PREVIOUS: '',
  });
}
```

### JWT Key Rotation

```typescript
// lib/auth/key-rotation.ts
export async function rotateJWTKey() {
  // 1. Generate new key
  const newKey = await generateSecureKey(32);
  const newKeyId = `v${Date.now()}`;
  
  // 2. Store new key with ID
  await secretManager.set({
    JWT_SECRET: newKey,
    JWT_KEY_ID: newKeyId,
    JWT_SECRET_PREVIOUS: process.env.JWT_SECRET,
  });
  
  // 3. Update token validation to accept both keys
  // (handled by middleware reading both env vars)
  
  // 4. Issue new tokens with new key
  // (automatic on next authentication)
  
  // 5. After grace period (e.g., 24 hours), remove old key
  setTimeout(async () => {
    await secretManager.set({
      JWT_SECRET_PREVIOUS: '',
    });
  }, 24 * 60 * 60 * 1000);
}
```

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials in code
- [ ] Security headers configured
- [ ] CSP policy implemented
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Output encoding implemented
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Secure cookie settings
- [ ] Session timeout configured
- [ ] MFA enabled for admin accounts
- [ ] Audit logging configured
- [ ] Error handling doesn't leak sensitive info
- [ ] Dependencies scanned for vulnerabilities

### Ongoing

- [ ] Weekly dependency audit
- [ ] Monthly access review
- [ ] Quarterly penetration testing
- [ ] Annual security training
- [ ] Continuous security monitoring
- [ ] Regular backup testing
- [ ] Incident response drills

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Quick Reference](https://content-security-policy.com/)
- [Security Headers](https://securityheaders.com/)
- [Clerk Security Documentation](https://clerk.com/docs/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

*Last Updated: 2026-02-19*
*Version: 1.0*
*Owner: Security Team*
