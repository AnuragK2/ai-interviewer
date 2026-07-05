# Phase 0 — infrastructure & local development

Infrastructure for the microservices platform: **NATS**, **MinIO**, **Postgres**, **API gateway**, and shared packages.

## Architecture (Phase 0)

```text
Frontend (:5173 or :3000)
    ↓
API Gateway (:8080)  ──proxy──►  interview-service (:3001)
                                      ├── Postgres
                                      ├── NATS (events)
                                      └── MinIO (media — wired, recording in Phase 6)
```

## Key decisions (locked)

| Area | Choice |
|------|--------|
| Event bus | **NATS** |
| Object storage | **MinIO** (S3-compatible) |
| Auth (Phase 1+) | **Custom JWT** + Google/LinkedIn OAuth for candidates |
| API entry | **Dedicated `apps/gateway`** |
| Interview invite | **Manual** by recruiter → email with link to candidate analytics |
| Recording | **Video + audio** (storage wired Phase 0; capture Phase 6) |

---

## Commands to run

### 1. Install dependencies

```bash
cd /Users/anuragkumar/Developer/personal-projects/ai-interviewer
bun install
```

### 2. Start infrastructure (Postgres, NATS, MinIO)

```bash
docker compose up -d
```

Verify:

```bash
docker compose ps
```

- Postgres: `localhost:5432` (user/pass/db: `platform` / `platform` / `platform`)
- NATS: `localhost:4222` (monitor: `http://localhost:8222`)
- MinIO API: `localhost:9000`, Console: `http://localhost:9001` (minio / minio123)

### 3. Migrate interview-service to `services/` (one-time)

```bash
chmod +x scripts/phase0-migrate-interview-service.sh
./scripts/phase0-migrate-interview-service.sh
```

This moves `apps/backend` → `services/interview-service` and leaves a deprecation stub in `apps/backend`.

**Skip if you prefer keeping code in `apps/backend` for now** — everything works from `apps/backend` until you run the script.

### 4. Interview service env + database

```bash
cp apps/backend/.env.example apps/backend/.env
# OR after migration:
# cp services/interview-service/.env.example services/interview-service/.env

# Edit .env — set OPENAI_API_KEY and DATABASE_URL
```

```bash
cd apps/backend   # or services/interview-service after migration
bunx prisma migrate dev
bunx prisma generate
```

### 5. Gateway env

```bash
cp apps/gateway/.env.example apps/gateway/.env
```

### 6. Run services (3 terminals)

**Terminal A — interview-service**

```bash
cd apps/backend && bun run dev
# or: cd services/interview-service && bun run dev
```

**Terminal B — gateway**

```bash
cd apps/gateway && bun run dev
```

**Terminal C — frontend**

Point frontend at gateway:

```bash
# apps/frontend — set in shell or .env
export BACKEND_URL=http://localhost:8080
cd apps/frontend && bun run dev
```

### 7. Smoke test

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/... # proxied to interview-service
curl http://localhost:3001/health    # interview-service direct
```

Run a full interview through the UI as before.

---

## New packages

| Package | Purpose |
|---------|---------|
| `@ai-interviewer/resume-parser` | PDF/DOCX/TXT parse + field extraction |
| `@ai-interviewer/event-bus` | NATS pub/sub wrapper |
| `@ai-interviewer/object-storage` | MinIO client (bucket ensure, upload, presigned URLs) |
| `@ai-interviewer/api-types` | + `events.ts` platform event schemas |

## Events published (interview-service)

| Subject | When |
|---------|------|
| `interview.started` | Session ready after join |
| `interview.completed` | Normal end |
| `interview.cancelled` | Cheat / error |

NATS is optional in local dev — if docker isn't running, interview still works; events are skipped with a warning.

---

## Phase 0 checklist

- [x] `packages/resume-parser`
- [x] `packages/event-bus` (NATS)
- [x] `packages/object-storage` (MinIO)
- [x] `packages/api-types` event schemas
- [x] `apps/gateway`
- [x] `docker-compose.yml`
- [x] Interview service uses shared packages + publishes events
- [ ] Run `bun install` (you)
- [ ] Run `docker compose up -d` (you)
- [ ] Run migration script (optional)
- [ ] Verify interview flow via gateway (you)
