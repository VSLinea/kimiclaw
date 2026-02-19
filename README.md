# Foundation Platform

A production-grade foundation for multi-platform applications with native iOS + Android clients, common backend, and comprehensive DevOps infrastructure.

## 🚀 Quick Start

### One-Command Local Start

```bash
# Clone and start everything
git clone <repo-url> foundation
cd foundation
docker-compose -f infra/docker-compose.yml up -d
```

Services will be available at:
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/documentation
- **Database**: localhost:5432

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Flutter 3.16+ (for mobile development)

## 📁 Repository Structure

```
foundation/
├── apps/
│   └── mobile/           # Flutter mobile app (iOS + Android)
├── services/
│   └── api/              # Fastify backend API
├── infra/                # Docker, deployment configs
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── .github/workflows/    # CI/CD pipelines
```

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│   Backend API   │────▶│   PostgreSQL    │
│  (Flutter)      │     │   (Fastify)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Clerk Auth     │     │   Audit Logs    │
│  (JWT/OAuth)    │     │   (Prisma)      │
└─────────────────┘     └─────────────────┘
```

**Tech Stack:**
- **Mobile**: Flutter + Riverpod + Dio + go_router
- **Backend**: Node.js + TypeScript + Fastify
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk (JWT-based)
- **Infra**: Docker Compose, GitHub Actions

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [FOUNDATION_PRD.md](docs/FOUNDATION_PRD.md) | Product requirements & acceptance criteria |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & data flows |
| [SECURITY.md](docs/SECURITY.md) | Threat model, RBAC, secret handling |
| [API_CONTRACT.md](docs/API_CONTRACT.md) | OpenAPI strategy & error model |
| [DEV_GUIDE.md](docs/DEV_GUIDE.md) | Local setup, commands, migrations |
| [RUNBOOK.md](docs/RUNBOOK.md) | Deploy, rollback, secret rotation |
| [OBSERVABILITY.md](docs/OBSERVABILITY.md) | Logging, metrics, tracing |
| [GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) | Git workflow, PRs, releases |
| [EVIDENCE.md](docs/EVIDENCE.md) | Build evidence & verification |

## 🛠️ Development

### Backend

```bash
cd services/api
npm install
npm run db:migrate
npm run dev
```

### Mobile

```bash
cd apps/mobile
flutter pub get
flutter run --flavor dev
```

### Database

```bash
# Run migrations
cd services/api
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed data
npm run db:seed
```

## 🧪 Testing

```bash
# Backend tests
cd services/api
npm test

# Mobile tests
cd apps/mobile
flutter test

# Integration tests (with Docker)
docker-compose -f infra/docker-compose.yml up -d
./scripts/integration-tests.sh
```

## 🚢 Deployment

### Staging

```bash
# Deploy to staging
docker-compose -f infra/docker-compose.staging.yml up -d

# Or via GitHub Actions
gh workflow run deploy-staging.yml
```

See [RUNBOOK.md](docs/RUNBOOK.md) for detailed deployment procedures.

## 🔒 Security

- **No secrets in repository** - All via environment variables
- **RBAC** - Role-based access control (user/admin)
- **Audit Logging** - All CRUD operations logged
- **Secret Rotation** - Documented procedures in RUNBOOK.md

See [SECURITY.md](docs/SECURITY.md) for complete security documentation.

## 🌐 Web IDE (Optional)

A browser-based VS Code instance is available for editing:

```bash
# Start Web IDE
./scripts/start-code-server.sh

# Access at http://localhost:8080
# Password: admin (change in production)
```

See [RUNBOOK.md](docs/RUNBOOK.md) for Web IDE documentation.

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes with conventional commits
3. Push and create PR
4. Ensure CI passes
5. Request review
6. Merge to main

See [GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) for detailed workflow.

## 📄 License

[MIT](LICENSE)

## 🆘 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Emergency**: See RUNBOOK.md contacts
