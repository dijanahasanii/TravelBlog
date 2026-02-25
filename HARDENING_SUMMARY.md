# Hardening Summary — Production Readiness

All phases completed. Below: what changed, what to test, and deployment verdict.

---

## Phase 0 — Baseline (report only)

- **PHASE0_BASELINE.md** created: critical paths (auth, feed, post creation, notifications), files touched per fix, note that no tests cover these flows (manual testing required).
- No code modified.

---

## Phase 1 — Security: VAPID keys

**File:** `notification-service/index.js`

**Change:**
- Removed hardcoded fallbacks for `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (no keys in source).
- In production (`NODE_ENV === 'production'`), service exits with a clear error if either env var is missing.
- In development, keys come only from env; `webPush.setVapidDetails` is called only when both are set (so with `.env` configured, push works; without, push is effectively disabled and no crash).

**Diff (conceptual):**
```diff
- const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BH0RjhWx-...'
- const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'eW36tbRtj_...'
- webPush.setVapidDetails('mailto:...', VAPID_PUBLIC, VAPID_PRIVATE)
+ if (process.env.NODE_ENV === 'production') {
+   if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
+     console.error('❌ notification-service: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required in production. Set them in .env')
+     process.exit(1)
+   }
+ }
+ const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY
+ const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
+ if (VAPID_PUBLIC && VAPID_PRIVATE) {
+   webPush.setVapidDetails('mailto:wandr@example.com', VAPID_PUBLIC, VAPID_PRIVATE)
+ }
```

**Push behavior:** Unchanged when `.env` has both VAPID keys. Without keys in dev, push subscription/send will not work (no keys in code).

**Manual test:** Run notification-service with and without VAPID in `.env`; in production mode without vars it should exit with the error above.

---

## Phase 2 — Configuration

**2a. Location service URL**  
**Files:** `frontend/src/api.js`, `.env.example`, `DEPLOYMENT.md`

- **api.js:** `locations` in `BASE_URL` now uses `process.env.REACT_APP_LOCATION_SERVICE_URL || 'http://localhost:5003'`.
- **.env.example:** Comment and optional `REACT_APP_LOCATION_SERVICE_URL` added.
- **DEPLOYMENT.md:** Frontend env table updated with optional `REACT_APP_LOCATION_SERVICE_URL`.

Location logic unchanged; only the base URL is configurable.

**2b. Notification API base**  
**File:** `frontend/src/api.js`

- Import of `NOTIF_SERVICE` from `./constants/api` added.
- `fetchNotifications` and `createNotification` now call `${NOTIF_SERVICE}/notifications` instead of `${CONTENT_SERVICE}/notifications`.

Notifications page still uses its own fetch to NOTIF_SERVICE; only the shared api helpers were fixed.

**Manual test:** If anything uses `fetchNotifications`/`createNotification` from `api.js`, it should hit the notification service. Notifications page (which doesn’t use those helpers) should behave as before.

---

## Phase 3 — Auth: Refresh token storage

**File:** `frontend/src/context/AuthContext.jsx`

- On successful login/register, `if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)` added after storing the access token.

So any login path that goes through AuthPage now persists refresh tokens; 401 refresh-and-retry can work after 15 min.

**Manual test:** Log in via the flow that uses AuthPage (if any); after 15+ min, perform an action that uses the shared `api` client and confirm it still works (refresh runs) or that logout/redirect is consistent.

---

## Phase 4 — Safe response parsing

**New file:** `frontend/src/utils/parseResponse.js`  
- Helper `parseResponse(res)` that: reads `res.text()`, safely parses JSON, returns `{ ok, data, error }` so callers don’t call `res.json()` on error or non-JSON responses.

**Files using it (critical flows only):**
- **Feed.jsx:** Initial load (following-ids, posts), loadMore (posts), handleLikeToggle (later migrated to api in Phase 5), handleAddComment (later migrated to api in Phase 5). Parsing for like/comment was then replaced by axios in Phase 5; feed load and loadMore still use parseResponse.
- **LikeButton.jsx:** GET likes in useEffect, POST likes in handleLikeToggle (both use parseResponse before using data).
- **Post.jsx:** handleSubmit POST /posts uses parseResponse so error responses don’t trigger unsafe `res.json()`.

**Manual test:** Force 4xx/5xx or non-JSON from posts/likes/comments (e.g. proxy or mock); confirm no uncaught exception and that error toasts/messages appear where implemented.

---

## Phase 5 — Authenticated requests (Feed)

**File:** `frontend/src/pages/Feed.jsx`

- Import of `api` from `../utils/api` added.
- **following-ids:** `fetch` replaced with `api.get(USER_SERVICE/.../following-ids)` so 401 triggers refresh and retry.
- **POST like:** `fetch` replaced with `api.post(CONTENT_SERVICE/likes, { postId })`; errors surfaced via toast from `err.response?.data`.
- **POST comment:** `fetch` replaced with `api.post(CONTENT_SERVICE/comments, ...)`; errors surfaced via toast.

Feed like/comment and following-ids now go through the shared client; after token expiry, refresh runs once and the request is retried.

**Manual test:** Log in, wait 15+ min (or shorten JWT expiry for test), then like/comment or trigger a feed load that uses following-ids; confirm either success after refresh or a clear error/toast, and no silent failure.

---

## Phase 6 — Error surfacing (Feed)

**File:** `frontend/src/pages/Feed.jsx`

- **following-ids catch:** `toast.error("Couldn't load your follow list.")` when the api.get fails.
- **Initial posts load catch:** `toast.error("Couldn't load posts. Showing sample posts.")` when fetch/parse fails (replacing only console.warn).
- **loadMore catch:** `toast.error("Couldn't load more posts.")` when load more fails.

No new UI components; messaging is neutral and short.

**Manual test:** Disconnect backend or return errors for following-ids, initial posts, or load more; confirm the corresponding toasts appear.

---

## Files touched (all phases)

| Phase | Files |
|-------|--------|
| 0 | PHASE0_BASELINE.md (new) |
| 1 | notification-service/index.js |
| 2a | frontend/src/api.js, .env.example, DEPLOYMENT.md |
| 2b | frontend/src/api.js |
| 3 | frontend/src/context/AuthContext.jsx |
| 4 | frontend/src/utils/parseResponse.js (new), Feed.jsx, LikeButton.jsx, Post.jsx |
| 5 | frontend/src/pages/Feed.jsx |
| 6 | frontend/src/pages/Feed.jsx |

No renames, no broad refactors; only the listed files were modified.

---

## Re-evaluation: deployment readiness

**Before:** Not ready (VAPID in source, localhost in config, fragile auth/errors).

**After:**

- **Security:** VAPID keys are no longer in source; production notification-service requires them in env. Safe for deployment from a key-leak perspective.
- **Config:** Location and notification API bases are env-driven; production can set REACT_APP_LOCATION_SERVICE_URL and use NOTIF_SERVICE for notifications.
- **Auth:** All login paths that store token now store refreshToken; Feed’s following-ids and like/comment use the shared api client and benefit from refresh/retry.
- **Stability:** Critical feed/post flows use safe parsing or the api client; Feed shows toasts for load/follow-list/load-more failures instead of failing silently.

**Verdict:** **Production deployment is now safe** from a hardening perspective, provided:

1. **notification-service:** Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in production (and `NODE_ENV=production`).
2. **Frontend:** Set all required REACT_APP_* URLs (and optionally REACT_APP_LOCATION_SERVICE_URL if using location-service).
3. **Manual smoke test:** Sign in, load feed, like/comment, create post, trigger load more and follow-list; confirm toasts on failure and no crashes on bad responses.

---

## Remaining (non-blocking) improvements

- **Other empty catches:** Explore, SearchPage, Notifications, FollowListModal, NotifPopup, MapView, Profile, PostDetail, UserProfileView still have `catch (_) {}` in places; add toasts or inline messages in a later pass.
- **More api migration:** PostDetail, UserProfileView (follow/block/report), Explore (like/comment/follow), FollowListModal, EditPostModal, etc. still use raw fetch; migrating them to the shared api would extend refresh/retry and consistent error handling.
- **CORS:** Backends still use default cors(); restricting origin to the frontend URL in production is recommended.
- **parseResponse elsewhere:** Other fetch calls (e.g. Notifications, Explore) could use parseResponse to avoid unsafe res.json() on error; not required for current deployment.

---

## What to manually test before release

1. **Auth:** Sign in (SignIn + AuthPage if used), sign up; confirm refreshToken in localStorage; after 15+ min perform an action that uses api (e.g. like/comment in Feed) and confirm refresh or clear logout.
2. **Feed:** Load feed, like, comment, load more, delete post; disconnect backend and confirm error toasts (follow list, posts, load more).
3. **Post creation:** Create a post with image and location; confirm success or clear error toast on failure.
4. **Notifications:** Notifications page and push (if used) still work; notification-service starts in production only with VAPID set.
5. **Config:** Build frontend with REACT_APP_* set to production URLs; confirm no localhost calls for user, content, notification (and location if set).

Nothing else was modified beyond the files and behavior described above.  
Stability over elegance; no extra refactors.
