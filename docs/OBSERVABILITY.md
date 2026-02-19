# Observability Plan

This document outlines the monitoring, logging, metrics, and alerting strategy for TaskTracker.

## Table of Contents

- [Logging Strategy](#logging-strategy)
- [Metrics Collection](#metrics-collection)
- [Tracing Setup](#tracing-setup)
- [Alerting Thresholds](#alerting-thresholds)

---

## Logging Strategy

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `ERROR` | Application errors requiring immediate attention | Database connection failed |
| `WARN` | Unexpected behavior that doesn't stop functionality | Rate limit approaching |
| `INFO` | Normal operational events | User login, task created |
| `DEBUG` | Detailed information for debugging | Request/response details |
| `TRACE` | Very detailed tracing | Function entry/exit |

### Log Format (Structured JSON)

```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "INFO",
  "service": "tasktracker-api",
  "environment": "staging",
  "version": "1.2.3",
  "traceId": "abc123def456",
  "spanId": "span789",
  "userId": "user-uuid",
  "requestId": "req-uuid",
  "method": "POST",
  "path": "/api/v1/tasks",
  "statusCode": 201,
  "durationMs": 45,
  "message": "Task created successfully",
  "metadata": {
    "taskId": "task-uuid",
    "projectId": "project-uuid"
  }
}
```

### Log Aggregation

**Primary:** [Grafana Loki](https://grafana.com/oss/loki/) or [Datadog](https://www.datadoghq.com/)

**Configuration:**

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*.log
  
  - job_name: backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: tasktracker-backend
          __path__: /opt/tasktracker/backend/logs/*.log
```

### Log Retention

| Environment | Retention Period | Storage Class |
|-------------|------------------|---------------|
| Development | 7 days | Standard |
| Staging | 30 days | Standard |
| Production | 90 days | Standard + Archive |
| Audit Logs | 1 year | Glacier/Cold Storage |

### Sensitive Data Handling

**NEVER log:**
- Passwords
- API keys
- JWT tokens
- Credit card numbers
- Personal identifiable information (PII)

**Redaction rules:**
```javascript
const sensitiveFields = ['password', 'token', 'apiKey', 'creditCard', 'ssn'];
logger.redact(sensitiveFields);
```

---

## Metrics Collection

### Metrics Types

#### Application Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_request_size_bytes` | Histogram | Request size |
| `http_response_size_bytes` | Histogram | Response size |
| `active_connections` | Gauge | Current active connections |
| `database_connections_active` | Gauge | Active DB connections |
| `database_connections_idle` | Gauge | Idle DB connections |
| `cache_hits_total` | Counter | Cache hit count |
| `cache_misses_total` | Counter | Cache miss count |
| `queue_size` | Gauge | Background job queue size |
| `jobs_processed_total` | Counter | Jobs processed |
| `jobs_failed_total` | Counter | Jobs failed |

#### Business Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `users_registered_total` | Counter | Total user registrations |
| `tasks_created_total` | Counter | Tasks created |
| `tasks_completed_total` | Counter | Tasks completed |
| `projects_created_total` | Counter | Projects created |
| `active_users` | Gauge | Currently active users |
| `api_calls_by_endpoint` | Counter | API calls per endpoint |

#### Infrastructure Metrics

| Metric | Source | Description |
|--------|--------|-------------|
| `container_cpu_usage` | cAdvisor | CPU usage per container |
| `container_memory_usage` | cAdvisor | Memory usage per container |
| `container_network_io` | cAdvisor | Network I/O per container |
| `disk_usage_percent` | Node Exporter | Disk usage percentage |
| `disk_io_wait` | Node Exporter | Disk I/O wait time |

### Metrics Collection Setup

**Prometheus Configuration:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: /health/metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

**Backend Metrics Endpoint:**

```javascript
// Using prom-client
const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

register.registerMetric(httpRequestDuration);

// Metrics endpoint
app.get('/health/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Grafana Dashboards

**Dashboard Structure:**

1. **Overview Dashboard**
   - Request rate (RPS)
   - Error rate
   - P95/P99 latency
   - Active users

2. **Backend Dashboard**
   - Endpoint performance
   - Database metrics
   - Cache metrics
   - Queue metrics

3. **Infrastructure Dashboard**
   - CPU/Memory/Disk usage
   - Network I/O
   - Container health

4. **Business Metrics Dashboard**
   - User registrations
   - Task completion rates
   - Feature usage

---

## Tracing Setup

### Distributed Tracing

**Primary:** [Jaeger](https://www.jaegertracing.io/) or [Tempo](https://grafana.com/oss/tempo/)

**Trace Structure:**

```
Trace: User creates task
├── Span: POST /api/v1/tasks (45ms)
│   ├── Span: Auth middleware (2ms)
│   ├── Span: Validate request (1ms)
│   ├── Span: Database insert (15ms)
│   │   └── Span: Connection acquire (1ms)
│   │   └── Span: Query execution (12ms)
│   ├── Span: Cache invalidation (5ms)
│   └── Span: Send notification (20ms)
└── Span: Background job (100ms)
    └── Span: Email notification (100ms)
```

### OpenTelemetry Configuration

```javascript
// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'tasktracker-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

### Sampling Strategy

| Environment | Sampling Rate | Strategy |
|-------------|---------------|----------|
| Development | 100% | Always sample |
| Staging | 10% | Probabilistic |
| Production | 1% | Probabilistic + Error-based |

**Error-based sampling:** Always capture traces for 5xx errors.

---

## Alerting Thresholds

### Severity Levels

| Severity | Response Time | Description |
|----------|---------------|-------------|
| `P1-Critical` | 15 minutes | Service down, data loss, security incident |
| `P2-High` | 1 hour | Degraded performance, partial outage |
| `P3-Medium` | 4 hours | Non-critical issues, warnings |
| `P4-Low` | 24 hours | Observations, optimization opportunities |

### Alert Rules

#### Critical Alerts (P1)

```yaml
# Service Down
- alert: ServiceDown
  expr: up{job="backend"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Backend service is down"
    description: "Backend has been down for more than 1 minute"

# High Error Rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is above 5% for 2 minutes"

# Database Down
- alert: DatabaseDown
  expr: pg_up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "PostgreSQL is down"
```

#### High Priority Alerts (P2)

```yaml
# High Latency
- alert: HighLatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High latency detected"
    description: "P95 latency is above 500ms for 5 minutes"

# High CPU Usage
- alert: HighCPUUsage
  expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage"

# High Memory Usage
- alert: HighMemoryUsage
  expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage"
```

#### Medium Priority Alerts (P3)

```yaml
# Disk Space Warning
- alert: DiskSpaceWarning
  expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Low disk space"

# Database Connection Pool
- alert: DBConnectionPoolHigh
  expr: pg_stat_activity_count > 80
  for: 5m
  labels:
    severity: warning
```

### Notification Channels

| Channel | Use Case |
|---------|----------|
| PagerDuty | P1-Critical alerts |
| Slack #alerts-critical | P1-Critical, P2-High |
| Slack #alerts-warning | P3-Medium |
| Email | P4-Low, daily summaries |

### Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  slack_api_url: 'https://hooks.slack.com/services/xxx'

route:
  receiver: 'default'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<pagerduty-key>'
        severity: critical
        
  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts-warning'
        title: 'Warning: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

---

## Observability Stack Summary

| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics | Prometheus | Time-series metrics collection |
| Visualization | Grafana | Dashboards and visualization |
| Logging | Loki / Datadog | Log aggregation and search |
| Tracing | Jaeger / Tempo | Distributed tracing |
| Alerting | Alertmanager | Alert routing and management |
| APM | Sentry | Error tracking and performance |

---

## Runbooks Integration

Each alert should link to a corresponding runbook:

```yaml
annotations:
  runbook_url: "https://wiki.internal/runbooks/service-down"
```

See [RUNBOOK.md](./RUNBOOK.md) for detailed procedures.
