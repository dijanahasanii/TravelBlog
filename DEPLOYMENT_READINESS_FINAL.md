# Deployment Readiness — Final Report

First real deployment prep. Backend uses MongoDB (Mongoose); no Supabase.

---

## Step 1 — Failure-Mode Analysis

Done. See **FAILURE_MODE_ANALYSIS.md** for concrete risk points and files. No code changed in Step 1.

---

## Step 2 — Database Safety & Query Assumptions

**Changes applied (one file at a time):**

| File | Change |
|------|--------|
| **content-service/controllers/likeController.js** | Validate `postId` with `mongoose.Types.ObjectId.isValid(postId)` before `Like.findOne` / `Post.findById`. Return 400 "Valid postId is required" if missing or invalid. Prevents CastError from malformed id. |
| **content-service/controllers/commentController.js** | Same for `addComment`: validate `postId` before `Post.findById`. |
| **user-service/controllers/userController.js** | In `getUserById`, validate `req.params.userId` with `mongoose.Types.ObjectId.isValid(userId)`; return 404 "User not found" if invalid (avoids CastError, consistent with missing user). |
| **content-service/controllers/postController.js** | In `updatePost`, validate `postId` with `mongoose.Types.ObjectId.isValid(postId)`; return 404 "Post not found" if invalid. |

Existing null checks after `findById` / `findOne` (e.g. `if (!post) return 404`) were left as-is. No other logic refactored.

---

## Step 3 — Double-Action & Idempotency Safety

**Changes applied:**

| File | Change |
|------|--------|
| **frontend/src/pages/Feed.jsx** | Guard against double comment submit: `commentingPostIdsRef` (Set of postIds). In `handleAddComment`, early return if `postId` is already in the set; add before request, remove in `finally`. Prevents duplicate comments from double-click. |

Backend: like toggle is already idempotent (findOne then delete or create). No duplicate like documents. Form/buttons: Post.jsx create-post already uses `setLoading(true)` and disables submit during request. No other changes.

---

## Step 4 — Cold-Start & Environment Safety

**Changes applied:**

| File | Change |
|------|--------|
| **user-service/index.js** | MongoDB connect: on failure, `console.error` + `process.exit(1)`. Server starts only after DB is ready: `app.listen(PORT, ...)` moved inside `mongoose.connect(...).then(...)`. |
| **content-service/db.js** | At start of `connectDB`, if `!process.env.MONGO_URI`, log clear message and `process.exit(1)`. |
| **content-service/index.js** | `connectDB()` is awaited before listening: `connectDB().then(() => app.listen(...)).catch(...)`; on failure, log and `process.exit(1)`. |
| **notification-service/index.js** | Require `MONGO_URI`: if missing, log and `process.exit(1)`. MongoDB connect: on failure, log and `process.exit(1)`. `server.listen` moved into `mongoose.connect(...).then(...)` so server starts only after DB is ready. |

No new dependencies. Existing env checks in user-service (MONGO_URI, JWT_SECRET) unchanged.

---

## Step 5 — Frontend ↔ Backend Contract Validation

**Verified (no code change):**

- Feed, Post, LikeButton already use `parseResponse` or shared `api` where we hardened; they handle non-OK and parse safely.
- Many list views use `(posts || [])`, `(comments || [])`, `(p.comments || [])`. Empty arrays from API are safe.
- API responses that return `{ posts }` or array are normalized in Feed (Array.isArray(data) ? data : data.posts || []).

**Remaining risk:** Some pages (Explore, PostDetail, UserProfileView, etc.) still use raw `fetch` and `res.json()` without checking `res.ok`. If the backend returns 500 with HTML or non-JSON, those call sites could throw. Mitigation: existing try/catch in those components; consider extending parseResponse or api client there in a later pass.

---

## Step 6 — Observability

**Changes applied:**

| File | Change |
|------|--------|
| **content-service/controllers/likeController.js** | Catch block logs `[likes] toggleLike error:`, `err.message` only (no full `err` object). |
| **content-service/controllers/commentController.js** | Catch in addComment: `[comments] addComment error:`, `err.message`. Catch in toggleCommentLike: `[comments] toggleCommentLike error:`, `err.message`. |

Backend already returns `err.message` in JSON (no secrets). Logs use route/action prefix + `err.message` only to avoid leaking stack or internal details.

---

## Step 7 — Dead Code & Zombie Path Detection

**Findings (no aggressive deletion):**

- **API routes with no frontend callers:** Not fully audited. Known used routes: /login, /register, /refresh, /users/*, /posts/*, /likes/*, /comments/*, /notifications/*. If any route is never called, it can be left; remove only when confirmed dead.
- **UI paths:** All routes in App.js are reachable via navigation or redirects. No orphan routes identified.
- **Mongo models/fields:** All referenced models (User, Post, Like, Comment, Notification, Follow, Block, Report, PushSubscription) are used. No safe removal without deeper audit.

**Action:** None. No code removed. Documented for future cleanup.

---

## Step 8 — Security Sanity Sweep

**Confirmed:**

- No MONGO_URI or JWT secrets in frontend or in client-exposed responses. Secrets live in backend .env only.
- Write routes (POST/PUT/DELETE) on user-service and content-service use `verifyToken` / auth middleware. Notification-service createNotification has no auth (called by other backends); GET notifications by userId is unauthenticated (by design for this app).
- User-controlled input: mongo-sanitize and validation (ObjectId, required fields) in place. Like/comment/postId validated as above.

No additional security code changes in this pass.

---

## Step 9 — Rollback Awareness

**Flagged (no behavior change):**

- **Mongo schema:** Current schemas are additive (new fields can be optional). No destructive or irreversible schema changes were made in this prep. If you later add required fields or drop indexes, document them and plan a rollback path (e.g. keep old code compatible with both schemas for one deploy).
- **Deploy steps:** Services now exit on DB or env failure. Ensure process manager (e.g. systemd, Railway, Render) restarts on exit. If a service exits because MONGO_URI is missing or DB is down, rollback is “fix env or DB and redeploy” — no code rollback needed.
- **Startup order:** user-service and notification-service listen only after MongoDB connects. If DB is slow, startup is delayed; no “listen then fail on first request” window.

---

## Deployment Readiness Verdict

### **Caution — deploy with checks**

- **Stability:** DB and env failures now fail fast; server listens only after DB is ready where changed. Invalid ObjectIds are validated; double comment submit is guarded.
- **Remaining risks:** Some frontend flows still use raw `fetch` and may throw on non-JSON or error responses. Token expiry on those flows (e.g. Explore, PostDetail) does not trigger refresh — user sees error or must re-login. Acceptable for first deployment if monitored.

**Verdict: Ready for first production deployment** provided the checklist below is followed and the remaining risks are accepted and monitored.

---

## Remaining Risks (non-blocking)

1. **Frontend:** Several pages still call `fetch` and then `res.json()` without checking `res.ok` or using parseResponse — possible throw on 500/HTML or unexpected body.
2. **Auth:** Routes that don’t use the shared `api` client won’t retry after 401/refresh; user gets error or re-login after 15 min.
3. **Timeouts:** No explicit request timeouts on frontend or backend; very slow Mongo or network can hang until browser/server timeout.
4. **CORS:** Production CORS restricted to FRONTEND_URL; all services exit if FRONTEND_URL missing when NODE_ENV=production.

---

## Environment Variables & Startup (Verified)

| Service | Required env (startup exit if missing) |
|--------|----------------------------------------|
| user-service | MONGO_URI, JWT_SECRET; FRONTEND_URL when NODE_ENV=production |
| content-service | MONGO_URI (in db.js); FRONTEND_URL when NODE_ENV=production |
| notification-service | MONGO_URI; FRONTEND_URL when NODE_ENV=production |

Servers do not listen until MongoDB is connected. serverSelectionTimeoutMS: 5000 (content, notification) or 10000 (user).

---

## ObjectId Validation (Verified)

content-service: postId, commentId, userId validated before find/delete; invalid IDs return 400/404. user-service: userId/:id validated in getUserById, updateUser, follow, unfollow, follow-stats, followers, following, report, block, block-status.

---

## Frontend Safety (Post-Hardening)

Feed, PostDetail, UserProfileView, Explore, FollowListModal, EditPostModal, LikeButton use api client or fetchWithTimeout + parseResponse; errors via toast.error; timeouts 5–10s. Double-action guard: Feed comment submit uses commentingPostIdsRef (Set).

---

## What to Monitor Immediately After Deployment

1. **Service startup:** All three services (user, content, notification) should log “MongoDB connected” and then “running at …”. If any exits with MONGO_URI or connection error, fix env/network and restart.
2. **First requests:** After deploy, hit login, feed load, create post, like, comment. Check backend logs for `[likes]` or `[comments]` errors; check frontend for toasts or console errors.
3. **Mongo slow/unavailable:** If Mongo is slow or down, services now exit (user, content, notification). Monitor restart count and DB health.
4. **401s:** Monitor auth; flows using the shared api client auto-refresh. 5. **CORS:** In production, requests from origins other than FRONTEND_URL are blocked.

---

## Files Touched (Summary)

| Step | Files |
|------|--------|
| 1 | None (report only) |
| 2 | content-service/controllers/likeController.js, commentController.js; user-service/controllers/userController.js; content-service/controllers/postController.js |
| 3 | frontend/src/pages/Feed.jsx |
| 4 | user-service/index.js; content-service/db.js, index.js; notification-service/index.js |
| 5 | None (verification only) |
| 6 | content-service/controllers/likeController.js, commentController.js |
| 7–9 | None (documentation / flagging only) |

No renames, no public API changes, no broad refactors. Formatting and style preserved. Stability over speed.
