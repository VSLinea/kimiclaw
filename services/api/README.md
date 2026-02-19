# API Service

Backend API service built with Fastify, TypeScript, and Prisma.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio
- `npm run generate:openapi` - Generate OpenAPI client for mobile

## API Documentation

When the server is running, visit `/documentation` for Swagger UI.

## Architecture

- `src/auth/` - Authentication middleware and Clerk integration
- `src/rbac/` - Role-based access control
- `src/audit/` - Audit logging service
- `src/hello-entities/` - HelloEntity CRUD endpoints
- `src/health/` - Health check endpoints
- `src/prisma/` - Database client and schema
