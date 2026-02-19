# Operations Runbook

This runbook contains procedures for operating the Foundation platform in staging and production environments.

## Table of Contents

- [Web IDE & Repository Access](#web-ide--repository-access)
- [Staging Deployment](#staging-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Secret Rotation](#secret-rotation)
- [Health Check Endpoints](#health-check-endpoints)
- [Common Issues and Resolution](#common-issues-and-resolution)

---

## Web IDE & Repository Access

### Overview

The Foundation platform provides two web-based interfaces for repository access:

1. **Web IDE (VS Code in Browser)** - Full-featured code editor
2. **Git Web Browser** - Lightweight file browser and commit viewer

### Web IDE (Code Server)

**URL:** http://`your-server-ip`:8080  
**Password:** `admin` (default, change in production)

#### Features
- Full VS Code interface in browser
- Syntax highlighting for all project files
- Integrated terminal
- Git integration (commit, push, pull, diff)
- File explorer with create/rename/delete
- Search across files
- Extensions support

#### Starting the Web IDE

```bash
# Using the provided script
cd /root/.openclaw/workspace
./scripts/start-code-server.sh

# Or manually
~/.local/bin/bin/code-server \
    --auth password \
    --bind-addr "0.0.0.0:8080" \
    --disable-telemetry \
    --disable-update-check \
    /root/.openclaw/workspace
```

#### Stopping the Web IDE

```bash
# Find and kill the process
pkill -f code-server

# Or via process management
ps aux | grep code-server
kill <pid>
```

#### Changing the Password

```bash
# Set environment variable
export PASSWORD=your-new-password

# Or edit the config
echo "password: your-new-password" > ~/.config/code-server/config.yaml

# Restart code-server
pkill -f code-server
./scripts/start-code-server.sh
```

#### Adding Basic Auth (Nginx)

For production, place code-server behind nginx with basic auth:

```nginx
server {
    listen 80;
    server_name ide.yourdomain.com;
    
    auth_basic "Foundation IDE";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Git Web Browser

**URL:** http://`your-server-ip`:3001

#### Features
- Browse repository file tree
- View file contents with syntax highlighting
- View commit history
- See diffs for each commit
- Download files

#### Starting the Git Web Browser

```bash
cd /root/.openclaw/workspace
python3 scripts/git-web-server.py

# Or in background
nohup python3 scripts/git-web-server.py > /tmp/git-web-server.log 2>&1 &
```

#### Stopping the Git Web Browser

```bash
pkill -f git-web-server.py
```

### Git Access Methods

#### 1. Web IDE (Recommended for editing)
- Full editing capabilities
- Integrated terminal
- Git commands available

#### 2. Git Web Browser (Recommended for browsing)
- Quick file viewing
- Commit history
- No authentication needed (for local network)

#### 3. Command Line
```bash
cd /root/.openclaw/workspace

# View status
git status

# Make changes and commit
git add .
git commit -m "Your changes"

# Push to remote (if configured)
git push origin master
```

#### 4. SSH/SCP
```bash
# Copy files to/from server
scp localfile.txt root@your-server:/root/.openclaw/workspace/
scp root@your-server:/root/.openclaw/workspace/docs/README.md ./
```

### Security Considerations

**⚠️ IMPORTANT:** These services are currently running without SSL/TLS. For production:

1. **Enable HTTPS** - Use Let's Encrypt or provide certificates
2. **Strong Authentication** - Change default passwords
3. **Firewall Rules** - Restrict access to specific IPs
4. **VPN Access** - Consider requiring VPN for access

#### Quick SSL with Let's Encrypt

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d ide.yourdomain.com -d git.yourdomain.com

# Auto-renewal is configured automatically
```

### Troubleshooting Web Access

#### Web IDE Won't Start
```bash
# Check if port is in use
netstat -tlnp | grep 8080

# Check logs
cat /tmp/code-server.log

# Verify installation
~/.local/bin/bin/code-server --version
```

#### Git Web Browser Won't Start
```bash
# Check if port is in use
netstat -tlnp | grep 3001

# Check Python
python3 --version

# Run in foreground for debugging
python3 scripts/git-web-server.py
```

#### Cannot Access from External IP
```bash
# Check firewall
ufw status
iptables -L

# Open ports
ufw allow 8080/tcp
ufw allow 3001/tcp

# Check if services are listening on 0.0.0.0
netstat -tlnp | grep -E '8080|3001'
```

---

## Staging Deployment

### Prerequisites

- SSH access to staging server
- Docker and Docker Compose installed on staging server
- GitHub Container Registry access
- Environment variables configured in `.env.staging`

### Deployment Steps

#### 1. Pre-Deployment Checklist

- [ ] All CI checks passing on the commit to deploy
- [ ] Database migrations reviewed
- [ ] Environment variables up to date
- [ ] Backup completed (if production)
- [ ] Team notified of deployment window

#### 2. Deploy to Staging

```bash
# SSH into staging server
ssh deploy@staging.tasktracker.io

# Navigate to deployment directory
cd /opt/tasktracker

# Pull latest images
docker-compose -f infra/docker-compose.staging.yml pull

# Run database migrations (if any)
docker-compose -f infra/docker-compose.staging.yml run --rm backend npm run db:migrate

# Restart services with new images
docker-compose -f infra/docker-compose.staging.yml up -d

# Verify deployment
curl https://staging-api.tasktracker.io/health
```

#### 3. Automated Deployment (GitHub Actions)

The staging environment can also be deployed automatically:

```bash
# Trigger via GitHub CLI
gh workflow run deploy-staging.yml --ref develop

# Or via GitHub web interface
# Actions → Deploy to Staging → Run workflow
```

#### 4. Post-Deployment Verification

```bash
# Check service health
docker-compose -f infra/docker-compose.staging.yml ps

# View logs
docker-compose -f infra/docker-compose.staging.yml logs -f --tail=100

# Run smoke tests
./scripts/smoke-tests.sh staging

# Verify endpoints
curl https://staging-api.tasktracker.io/health
curl https://staging-api.tasktracker.io/api/v1/tasks
```

---

## Rollback Procedures

### Quick Rollback (Docker Images)

If the deployment is failing and you need to rollback quickly:

```bash
# SSH into staging server
ssh deploy@staging.tasktracker.io
cd /opt/tasktracker

# List available images
docker images | grep tasktracker-backend

# Rollback to previous image
docker-compose -f infra/docker-compose.staging.yml stop backend
docker-compose -f infra/docker-compose.staging.yml rm -f backend
docker tag ghcr.io/your-org/tasktracker-backend:previous-tag ghcr.io/your-org/tasktracker-backend:current
docker-compose -f infra/docker-compose.staging.yml up -d backend

# Verify rollback
curl https://staging-api.tasktracker.io/health
```

### Database Rollback

**⚠️ WARNING: Use with caution. Data loss may occur.**

```bash
# Rollback migrations
docker-compose -f infra/docker-compose.staging.yml run --rm backend npm run db:rollback

# If rollback fails, restore from backup
docker-compose -f infra/docker-compose.staging.yml stop postgres
docker volume rm tasktracker_postgres_staging_data
docker volume create tasktracker_postgres_staging_data
# Restore from backup
docker run --rm -v tasktracker_postgres_staging_data:/data -v /backups:/backups alpine \
  tar -xzf /backups/postgres-$(date +%Y%m%d).tar.gz -C /data
```

### Full Environment Rollback

```bash
# Stop all services
docker-compose -f infra/docker-compose.staging.yml down

# Restore from snapshot (if available)
# This depends on your infrastructure provider

# Restart with previous version
git checkout <previous-commit>
docker-compose -f infra/docker-compose.staging.yml up -d
```

---

## Secret Rotation

### Database Credentials

1. **Prepare new credentials:**
```bash
# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)
echo $NEW_PASSWORD
```

2. **Update database user:**
```bash
# Connect to database
docker-compose -f infra/docker-compose.staging.yml exec postgres psql -U tasktracker

# Create new user or update password
CREATE USER tasktracker_new WITH PASSWORD 'new-password';
GRANT ALL PRIVILEGES ON DATABASE tasktracker TO tasktracker_new;

# Or alter existing user
ALTER USER tasktracker WITH PASSWORD 'new-password';
```

3. **Update environment variables:**
```bash
# Edit .env.staging
nano /opt/tasktracker/.env.staging

# Update DATABASE_URL
DATABASE_URL=postgres://tasktracker:new-password@postgres:5432/tasktracker
```

4. **Restart services:**
```bash
docker-compose -f infra/docker-compose.staging.yml up -d
```

5. **Verify and cleanup:**
```bash
# Verify application works
curl https://staging-api.tasktracker.io/health

# Remove old user (if created new)
docker-compose -f infra/docker-compose.staging.yml exec postgres psql -U tasktracker
DROP USER tasktracker_old;
```

### JWT Secret Rotation

1. **Generate new secret:**
```bash
NEW_JWT_SECRET=$(openssl rand -base64 64)
echo $NEW_JWT_SECRET
```

2. **Update environment:**
```bash
# Edit .env.staging
nano /opt/tasktracker/.env.staging

# Update JWT_SECRET
JWT_SECRET=$NEW_JWT_SECRET
```

3. **Rolling restart (zero-downtime):**
```bash
# Update one replica at a time
docker-compose -f infra/docker-compose.staging.yml up -d --scale backend=3 --no-recreate

# Or if using swarm
docker service update --secret-rm jwt_secret_old --secret-add jwt_secret_new tasktracker_backend
```

4. **Note:** Users will need to re-login after JWT secret rotation.

### SSL Certificate Rotation

```bash
# Place new certificates
scp new-cert.pem deploy@staging.tasktracker.io:/opt/tasktracker/ssl/cert.pem
scp new-key.pem deploy@staging.tasktracker.io:/opt/tasktracker/ssl/key.pem

# Reload nginx (zero-downtime)
docker-compose -f infra/docker-compose.staging.yml exec nginx nginx -s reload

# Verify
curl -v https://staging-api.tasktracker.io/health 2>&1 | grep "SSL"
```

---

## Health Check Endpoints

### Backend Health Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Basic health check |
| `GET /health/ready` | GET | Readiness probe (includes DB check) |
| `GET /health/live` | GET | Liveness probe |
| `GET /health/metrics` | GET | Prometheus metrics |

### Health Check Examples

```bash
# Basic health check
curl https://api.tasktracker.io/health
# Response: {"status":"ok","timestamp":"2024-01-15T10:30:00Z"}

# Readiness check (includes dependencies)
curl https://api.tasktracker.io/health/ready
# Response: {"status":"ready","checks":{"database":"ok","redis":"ok"}}

# Liveness check
curl https://api.tasktracker.io/health/live
# Response: {"status":"alive"}

# Metrics
curl https://api.tasktracker.io/health/metrics
```

### Docker Health Checks

Services include built-in health checks:

```bash
# Check container health status
docker-compose -f infra/docker-compose.staging.yml ps

# Inspect health details
docker inspect --format='{{.State.Health.Status}}' tasktracker-api-staging

# View health check logs
docker inspect --format='{{json .State.Health}}' tasktracker-api-staging | jq
```

### Kubernetes Health Checks (if applicable)

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Common Issues and Resolution

### Service Won't Start

#### Symptoms
- Container exits immediately
- `docker-compose ps` shows Exit code

#### Resolution
```bash
# Check logs
docker-compose logs <service-name>

# Common fixes
# 1. Port conflict - change port in .env
# 2. Missing env var - check .env file
# 3. Database not ready - check depends_on healthcheck
# 4. Permission issues - check volume permissions
```

### Database Connection Issues

#### Symptoms
- "ECONNREFUSED" errors
- "password authentication failed"
- Timeout errors

#### Resolution
```bash
# Check if postgres is running
docker-compose ps postgres

# Verify credentials
docker-compose exec postgres psql -U tasktracker -d tasktracker -c "SELECT 1"

# Check connection string format
# Format: postgres://user:password@host:port/database

# Reset if needed (WARNING: data loss)
docker-compose down -v
docker-compose up -d postgres
```

### High Memory Usage

#### Symptoms
- Container OOM killed
- Slow response times
- System alerts

#### Resolution
```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart

# Scale down if needed
docker-compose up -d --scale backend=1

# Check for memory leaks in logs
docker-compose logs backend | grep -i "memory\|heap"
```

### Disk Space Issues

#### Symptoms
- "No space left on device"
- Build failures
- Log write errors

#### Resolution
```bash
# Check disk usage
df -h
docker system df

# Clean up Docker
docker system prune -a

# Clean old logs
find /var/log -name "*.log" -mtime +7 -delete

# Clean old images
docker images --filter "dangling=true" -q | xargs docker rmi
```

### SSL/TLS Certificate Issues

#### Symptoms
- "certificate has expired"
- "self-signed certificate"
- Browser security warnings

#### Resolution
```bash
# Check certificate expiry
echo | openssl s_client -servername api.tasktracker.io -connect api.tasktracker.io:443 2>/dev/null | openssl x509 -noout -dates

# Renew certificates (Let's Encrypt)
certbot renew

# Or replace manually
# See SSL Certificate Rotation section
```

### 502 Bad Gateway

#### Symptoms
- Nginx returns 502
- Backend appears healthy

#### Resolution
```bash
# Check nginx configuration
docker-compose exec nginx nginx -t

# Check backend connectivity
docker-compose exec nginx wget -O- http://backend:3000/health

# Restart nginx
docker-compose restart nginx

# Check upstream configuration in nginx.conf
```

### Migration Failures

#### Symptoms
- "Migration failed"
- "Table already exists"
- "Column does not exist"

#### Resolution
```bash
# Check migration status
docker-compose run --rm backend npm run db:status

# Rollback if needed
docker-compose run --rm backend npm run db:rollback

# Fix migration file and re-run
# Or mark as run manually (if already applied):
docker-compose exec postgres psql -U tasktracker
table knex_migrations;
# Update the migration record as needed
```

### Redis Connection Issues

#### Symptoms
- "Redis connection error"
- Cache not working
- Session issues

#### Resolution
```bash
# Check Redis status
docker-compose ps redis
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Clear Redis cache if corrupted
docker-compose exec redis redis-cli FLUSHALL

# Restart Redis
docker-compose restart redis
```

### Network Issues

#### Symptoms
- Services can't communicate
- DNS resolution failures
- Connection timeouts

#### Resolution
```bash
# Inspect network
docker network ls
docker network inspect tasktracker-staging-network

# Recreate network
docker-compose down
docker network rm tasktracker-staging-network
docker-compose up -d

# Check firewall rules
iptables -L
```

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | PagerDuty | +1-xxx-xxx-xxxx |
| DevOps Lead | Slack: @devops-lead | Email: devops@company.com |
| Database Admin | Slack: @dba | Email: dba@company.com |
| Security Team | Slack: #security | security@company.com |

---

## Useful Commands Reference

```bash
# Quick diagnostics
docker-compose ps
docker-compose logs --tail=100 -f
docker stats

# Resource usage
docker system df
df -h
free -m

# Network debugging
docker network inspect tasktracker-staging-network
docker-compose exec backend netstat -tlnp

# Database debugging
docker-compose exec postgres psql -U tasktracker -c "SELECT * FROM pg_stat_activity;"
```
