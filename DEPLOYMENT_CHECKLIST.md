# Deployment Checklist — First Production

## 1. Environment variables (each service `.env`)

| Variable | Services | Required |
|----------|----------|----------|
| `MONGO_URI` | user, content, notification | Yes |
| `JWT_SECRET` | user | Yes |
| `FRONTEND_URL` | user, content, notification | Yes when `NODE_ENV=production` |
| `NODE_ENV` | all | Set to `production` for prod |
| `PORT` | all | Optional (defaults: 5004, 5002, 5006) |
| `NOTIF_SERVICE_URL` | content | For cascade deletes |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | notification | For push (production) |

## 2. Build & start order

1. **MongoDB** — running and reachable.
2. **user-service** — `cd user-service && npm start` (listens only after DB connects).
3. **content-service** — `cd content-service && npm start`.
4. **notification-service** — `cd notification-service && npm start`.
5. **Frontend** — `cd frontend && npm run build`; serve `build/` via static host (Vercel, Netlify, nginx).

## 3. Post-deploy checks

- [ ] Each backend logs "MongoDB connected" then "running at …".
- [ ] `GET /health` returns `{ ok: true }` on each service.
- [ ] Login, feed, create post, like, comment, delete post — no crashes; errors show via toasts.
- [ ] CORS: Requests from non-`FRONTEND_URL` origins blocked in production.
- [ ] HTTPS: Enforce via platform (Vercel, Railway) or reverse proxy.

## 4. Rollback

- Revert to previous deployment.
- DB schema is additive; no migrations to roll back for current baseline.
- Fix env or DB, restart services; no code rollback needed for env/DB issues.

## 5. Backup / restore

- MongoDB: Use Atlas backups or `mongodump` / `mongorestore` for manual backups.
- Document restore procedure for your hosting provider.

## 6. Rate limits (production)

- user-service: auth 20/15min, general 120/min.
- content-service: 200/min.
- notification-service: 150/min.
- Tighten further if needed.

## 7. Smoke test (optional)

Run with services up: `node scripts/smoke-test.js`
Hits /health and login. Set `USER_SERVICE_URL`, `CONTENT_SERVICE_URL` if not localhost.

## 8. Notification-service public endpoints

These are intentionally unauthenticated (by design for this app):
- `GET /push/vapid-public-key` — VAPID key for browser push.
- `GET /notifications/:userId` — notifications for a user.
- `POST /push/subscribe`, `DELETE /push/unsubscribe` — store/remove push subscription (userId in body). Consider adding auth in a future pass.
