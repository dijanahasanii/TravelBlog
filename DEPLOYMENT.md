# Wandr — Deployment Checklist

Use this checklist when deploying to Railway, Render, Vercel, or similar.

---

## 1. Backend services (user, content, notification)

Deploy each service (e.g. as separate services on Railway/Render). Ensure:

- **Node.js** version 18 or 20 LTS (avoid Node 24 for MongoDB Atlas TLS compatibility).
- **Start command:** `node index.js` (from each service root).
- **Root directory:** Set to `user-service`, `content-service`, or `notification-service` as appropriate.

### user-service

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGO_URI` | Yes | MongoDB Atlas URI for **userdb** |
| `JWT_SECRET` | Yes | Same value across all services |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing |
| `PORT` | No | Default 5004; host may inject this |

### content-service

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGO_URI` | Yes | MongoDB Atlas URI for **contentdb** |
| `JWT_SECRET` | Yes | Same value as user-service |
| `NOTIF_SERVICE_URL` | Yes (prod) | Full URL of notification service (e.g. `https://your-notif.railway.app`) so likes/comments/post-delete can create notifications. Omit for local (defaults to `http://localhost:5006`). |
| `PORT` | No | Default 5002 |

### notification-service

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGO_URI` | Yes | MongoDB Atlas URI for **notificationdb** |
| `JWT_SECRET` | Yes | Same value as user-service |
| `VAPID_PUBLIC_KEY` | Yes (push) | Web push public key |
| `VAPID_PRIVATE_KEY` | Yes (push) | Web push private key |
| `PORT` | No | Default 5006 |

---

## 2. Frontend (Vercel, Netlify, etc.)

- **Build command:** `npm run build` (in `frontend` folder).
- **Output directory:** `build` (Create React App default).
- **Environment variables** (all `REACT_APP_*` so they are baked into the build):

| Variable | Required | Example |
|----------|----------|---------|
| `REACT_APP_USER_SERVICE_URL` | Yes | `https://your-user-service.railway.app` |
| `REACT_APP_CONTENT_SERVICE_URL` | Yes | `https://your-content-service.railway.app` |
| `REACT_APP_NOTIF_SERVICE_URL` | Yes | `https://your-notif-service.railway.app` |
| `REACT_APP_LOCATION_SERVICE_URL` | No (optional) | Only if you use location-service; e.g. `https://your-location-service.railway.app`. Defaults to `http://localhost:5003` in dev. |
| `REACT_APP_CLOUDINARY_CLOUD_NAME` | Yes (uploads) | From Cloudinary dashboard |
| `REACT_APP_CLOUDINARY_UPLOAD_PRESET` | Yes (uploads) | Unsigned preset name |

---

## 3. MongoDB Atlas

- **Network Access:** Add `0.0.0.0/0` (or your host IPs) so Railway/Render can connect.
- **Database:** Same cluster; use databases `userdb`, `contentdb`, `notificationdb` as in URIs.

---

## 4. CORS

Backends use `cors()` with default (any origin). For production you can restrict:

- In each service, set `origin` to your frontend URL (e.g. `https://your-app.vercel.app`). Check `app.use(cors(...))` in each `index.js`.

---

## 5. Secrets

- Do **not** commit `.env` or `WANDR_IMPORTANT_KEYS.md`. Use your platform’s env/secrets UI.
- JWT secrets and MongoDB password: see `WANDR_IMPORTANT_KEYS.md` (local copy) or your password manager.

---

## 6. Post-deploy checks

- [ ] Frontend loads; can open login/signup.
- [ ] Sign up / log in works (user-service + JWT).
- [ ] Feed loads posts (content-service).
- [ ] Create a post with image and location (content-service + Cloudinary).
- [ ] Like a post; check notification appears (content-service → notification-service).
- [ ] Edit profile / change password (user-service; token refresh works if using shared `api` client).

---

## Ready for deployment?

Yes, once:

1. All env vars above are set per service and frontend.
2. MongoDB Atlas allows connections from your host.
3. `NOTIF_SERVICE_URL` in content-service points to your deployed notification service URL.
4. Frontend env vars point to your deployed backend URLs (no `localhost` in production).
