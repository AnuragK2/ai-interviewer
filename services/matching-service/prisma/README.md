# matching-service Prisma

This service reads/writes the **same PostgreSQL database** as `application-service` (`ai_interviewer_applications`).

- **Migrations:** run only in `services/application-service`
- **Client codegen:** run here after application-service migrations

```bash
cd services/application-service && bun run db:migrate && bun run db:generate
cd ../matching-service && bun run db:generate
```
