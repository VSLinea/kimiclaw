# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial foundation scaffold
- Multi-agent architecture implementation
- GitHub workflow documentation

## [0.1.0] - 2026-02-19

### Added
- **Documentation**: FOUNDATION_PRD.md, ARCHITECTURE.md, SECURITY.md, API_CONTRACT.md
- **Documentation**: DEV_GUIDE.md, RUNBOOK.md, OBSERVABILITY.md, GITHUB_WORKFLOW.md
- **Backend**: Fastify API with TypeScript, Prisma ORM, PostgreSQL
- **Backend**: Clerk authentication integration with JWT
- **Backend**: RBAC middleware (user/admin roles)
- **Backend**: Audit logging service for all CRUD operations
- **Backend**: HelloEntity CRUD endpoints with OpenAPI docs
- **Backend**: Health and version endpoints
- **Mobile**: Flutter scaffold with Riverpod state management
- **Mobile**: go_router navigation with route guards
- **Mobile**: Login screen with token handling
- **Mobile**: HelloEntity list and create screens
- **Mobile**: Environment configuration (dev/staging/prod)
- **Infra**: Docker Compose for local development
- **Infra**: Docker Compose for staging deployment
- **Infra**: GitHub Actions CI pipeline (lint, test, build)
- **Infra**: Web IDE (code-server) setup scripts
- **Infra**: Git web browser for repository viewing
- **DevOps**: Automated testing in CI
- **DevOps**: Security scanning with Trivy
- **Security**: Threat model with STRIDE analysis
- **Security**: RBAC policy with 5-tier role hierarchy
- **Security**: Secret rotation procedures
- **Security**: Rate limiting strategy
- **Security**: Data retention and privacy policies
