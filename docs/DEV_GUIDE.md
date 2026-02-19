# Developer Guide

Welcome to TaskTracker! This guide will help you get the development environment up and running.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or later) - [Download](https://nodejs.org/)
- **Docker** & **Docker Compose** - [Download](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js)

Optional but recommended:

- **Android Studio** - for mobile development
- **Xcode** (macOS only) - for iOS development
- **pgAdmin** or **DBeaver** - for database management

---

## Quick Start

### 1. Clone the Repository

```bash
git clone git@github.com:your-org/tasktracker.git
cd tasktracker
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install mobile dependencies
cd mobile && npm install && cd ..
```

### 3. Set Up Environment Variables

```bash
# Copy example environment files
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env

# Edit the files with your preferred editor
nano backend/.env
```

### 4. Start the Development Stack

```bash
cd infra
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- Backend API on port 3000
- MailHog (email catcher) on port 8025

### 5. Run Database Migrations

```bash
cd backend
npm run db:migrate
```

### 6. Start the Backend (if not using Docker)

```bash
cd backend
npm run dev
```

### 7. Start the Mobile App

```bash
cd mobile
# For iOS
npm run ios

# For Android
npm run android
```

---

## Environment Variables

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | API server port | `3000` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | Secret for JWT signing | - | Yes |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | No |
| `LOG_LEVEL` | Logging level | `debug` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |
| `SMTP_HOST` | SMTP server host | - | No |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_USER` | SMTP username | - | No |
| `SMTP_PASS` | SMTP password | - | No |
| `SENTRY_DSN` | Sentry error tracking DSN | - | No |

### Mobile (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_BASE_URL` | Backend API URL | `http://localhost:3000` | Yes |
| `ENVIRONMENT` | App environment | `development` | Yes |
| `SENTRY_DSN` | Sentry error tracking DSN | - | No |

### Docker Compose (.env in /infra)

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | `tasktracker` |
| `DB_PASSWORD` | PostgreSQL password | `devpassword` |
| `DB_NAME` | PostgreSQL database name | `tasktracker` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `API_PORT` | Backend API port | `3000` |
| `REDIS_PORT` | Redis port | `6379` |
| `MAILHOG_UI_PORT` | MailHog web UI port | `8025` |
| `MAILHOG_SMTP_PORT` | MailHog SMTP port | `1025` |

---

## Common Commands

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Restart a service
docker-compose restart backend

# Rebuild a service
docker-compose up -d --build backend
```

### Backend

```bash
cd backend

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

### Mobile

```bash
cd mobile

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on specific iOS simulator
npm run ios -- --simulator="iPhone 15 Pro"

# Run on specific Android device
npm run android -- --deviceId=emulator-5554

# Lint code
npm run lint

# Type check
npm run typecheck

# Run tests
npm test
```

### Database

```bash
cd backend

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Create new migration
npm run db:create-migration -- migration_name

# Seed database
npm run db:seed

# Reset database (drop, create, migrate, seed)
npm run db:reset

# Open database console
npm run db:console
```

---

## Database Migrations

We use [Knex.js](http://knexjs.org/) for database migrations.

### Creating a Migration

```bash
cd backend
npm run db:create-migration -- create_users_table
```

This creates a new migration file in `backend/migrations/` with a timestamp prefix.

### Migration Template

```javascript
exports.up = async function(knex) {
  await knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('users');
};
```

### Running Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Rollback last batch
npm run db:rollback

# Rollback all migrations
npm run db:rollback --all
```

### Migration Best Practices

1. **Always write both `up` and `down` functions**
2. **Test migrations on a copy of production data before deploying**
3. **Never modify existing migrations after they've been committed**
4. **Keep migrations atomic** - one logical change per migration
5. **Use transactions** for complex migrations

---

## Troubleshooting

### Docker Issues

#### Port Already in Use

```
Error: Ports are not available: listen tcp 0.0.0.0:5432: bind: address already in use
```

**Solution:**
```bash
# Find what's using the port
lsof -i :5432

# Kill the process or change the port in .env
DB_PORT=5433
```

#### Container Won't Start

```bash
# Check container logs
docker-compose logs postgres

# Restart the service
docker-compose restart postgres

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Database Issues

#### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Ensure Docker containers are running: `docker-compose ps`
2. Check DATABASE_URL in `.env` matches your setup
3. If using Docker, use `postgres` as hostname, not `localhost`

#### Migration Failed

```bash
# Check migration status
npm run db:status

# Rollback and retry
npm run db:rollback
npm run db:migrate

# Force unlock if migration is stuck
npm run db:unlock
```

### Mobile Issues

#### Metro Bundler Won't Start

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or
npm start -- --reset-cache
```

#### Android Build Fails

```bash
cd mobile/android

# Clean build
./gradlew clean

# Rebuild
./gradlew assembleDebug
```

#### iOS Build Fails

```bash
cd mobile/ios

# Install pods
pod install

# Clean build
xcodebuild clean -workspace TaskTracker.xcworkspace -scheme TaskTracker
```

### Backend Issues

#### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Clear TypeScript cache
npx tsc --build --force

# Or rebuild
npm run build
```

### General Tips

1. **Always check logs first**: `docker-compose logs -f`
2. **Restart services**: `docker-compose restart`
3. **Clear caches**: Delete `node_modules` and reinstall
4. **Check environment variables**: Ensure `.env` files are correct
5. **Update dependencies**: `npm update` periodically

---

## Getting Help

If you encounter issues not covered here:

1. Check the [Runbook](./RUNBOOK.md) for operational issues
2. Review [Observability](./OBSERVABILITY.md) for monitoring help
3. Open an issue on GitHub
4. Ask in the team Slack channel

---

## Contributing

Please read our [Contributing Guide](../CONTRIBUTING.md) before submitting pull requests.
