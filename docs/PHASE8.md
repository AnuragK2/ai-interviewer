# Phase 8 — Hardening & production

## What shipped

- `@ai-interviewer/observability` — request IDs, structured logs, optional OpenTelemetry export
- `@ai-interviewer/file-security` — upload scanning (magic bytes, blocked extensions, suspicious content)
- `@ai-interviewer/event-bus` — idempotent consumers + dead-letter publishing (`<subject>.dlq`)
- Gateway rate limits (auth, API, uploads)
- Tenant audit log for recruiter actions (invite, packet view, job create/update)
- E2E smoke tests in `tests/e2e`

## 1. Install dependencies

```bash
bun install
```

## 2. Run migrations (idempotency + audit tables)

**application-service** owns the shared `ai_interviewer_applications` database (used by matching-service too):

```bash
cd services/application-service
bun run db:migrate
bun run db:generate
cd ../..
```

**matching-service** — generate client only (do **not** run `db:migrate` here):

```bash
cd services/matching-service
bun run db:generate
cd ../..
```

**notification-service** — separate database:

```bash
cd services/notification-service
bun run db:migrate
bun run db:generate
cd ../..
```

### Shared internal service auth

Use the **same** value in both `application-service` and `job-service`:

| Variable | Example | Purpose |
|----------|---------|---------|
| `INTERNAL_SERVICE_KEY` | `dev-internal-service-key` | Authenticates `job-service` → `POST http://localhost:3005/api/v1/internal/tenant-audit` |

### `apps/gateway/.env`

| Variable | Expected value (local) | Notes |
|----------|------------------------|-------|
| `PORT` | `8080` | Gateway listen port |
| `INTERVIEW_SERVICE_URL` | `http://localhost:3001` | Default catch-all `/api/*` proxy |
| `IDENTITY_SERVICE_URL` | `http://localhost:3002` | `/api/v1/auth`, `/api/v1/companies` |
| `PROFILE_SERVICE_URL` | `http://localhost:3003` | `/api/v1/profiles` |
| `JOB_SERVICE_URL` | `http://localhost:3004` | `/api/v1/jobs` |
| `APPLICATION_SERVICE_URL` | `http://localhost:3005` | `/api/v1/applications` |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:3006` | `/api/v1/notifications` |
| `JWT_SECRET` | Same as identity-service | e.g. `dev-secret-change-me` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | Optional; enable after `docker compose up -d jaeger` |

### `services/application-service/.env`

| Variable | Expected value (local) | Notes |
|----------|------------------------|-------|
| `PORT` | `3005` | |
| `DATABASE_URL` | `postgresql://platform:platform@localhost:5433/platform` **or** your apps DB URL | Must include `ProcessedEvent` + `TenantAuditLog` tables (Phase 8 migrate) |
| `JWT_SECRET` | Same as gateway | |
| `NATS_URL` | `nats://localhost:4222` | Event worker |
| `GATEWAY_URL` | `http://localhost:8080` | Apply flow snapshots |
| `INTERVIEW_SERVICE_URL` | `http://localhost:3001` | Invite → create interview |
| `FRONTEND_URL` | `http://localhost:5173` | Notification links |
| `INTERNAL_SERVICE_KEY` | `dev-internal-service-key` | Must match job-service |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | Optional |

### `services/job-service/.env`

| Variable | Expected value (local) | Notes |
|----------|------------------------|-------|
| `PORT` | `3004` | |
| `DATABASE_URL` | Your jobs DB URL | Separate from applications DB |
| `JWT_SECRET` | Same as gateway | |
| `GATEWAY_URL` | `http://localhost:8080` | Recommended jobs endpoint |
| `APPLICATION_SERVICE_URL` | `http://localhost:3005` | Direct internal audit API (not through gateway) |
| `INTERNAL_SERVICE_KEY` | `dev-internal-service-key` | Must match application-service |

`job-service` calls audit at:

`POST http://localhost:3005/api/v1/internal/tenant-audit`  
Header: `x-internal-service-key: <INTERNAL_SERVICE_KEY>`

This route is **not** exposed on the gateway on purpose.

## 3. Environment

### Gateway / services (optional tracing)

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

Start Jaeger (image tag `1.76.0` — `1.62` does not exist on Docker Hub):

```bash
docker compose up -d jaeger
```

UI: http://localhost:16686

### Shared internal service auth

Use the same value in `application-service` and `job-service`:

```env
INTERNAL_SERVICE_KEY=change-me-in-production
```

`job-service` also needs:

```env
APPLICATION_SERVICE_URL=http://localhost:3005
```

## 4. Typecheck & unit tests

```bash
bun run check-types
bun test packages/file-security
```

## 5. E2E tests

Offline (always passes — skips live HTTP):

```bash
bun run test:e2e
```

Against a running stack:

```bash
E2E_LIVE=true bun run test:e2e
```

## 6. Verify hardening manually

| Area | How to verify |
|------|----------------|
| Rate limits | Burst `POST /api/v1/auth/login` → expect `429` |
| Upload scan | Upload `.exe` renamed as resume → rejected |
| Audit log | Recruiter invites candidate → `GET /api/v1/applications/_recruiter/audit-logs` |
| Idempotency | Replay same NATS event → consumer skips duplicate `eventId` |
| DLQ | Force handler throw → message on `<subject>.dlq` |
| Tracing | Check Jaeger for `gateway` spans when `OTEL_EXPORTER_OTLP_ENDPOINT` is set |

## Recruiter audit API

```http
GET /api/v1/applications/_recruiter/audit-logs?limit=50
Authorization: Bearer <recruiter-token>
```

Logged actions:

- `application.invite`
- `application.packet.view`
- `job.create`
- `job.update`
