# Deployment Readiness Audit — Wandr (Travel Blog)

**Audit date:** 2025-02-24  
**Scope:** Full-project scan (frontend, user-service, content-service, notification-service, location-service, backend)

---

## Verdict

# Not ready

**Critical issues must be fixed before production.** The app will run locally and many flows work, but production deployment will hit broken config, security issues, and fragile auth behavior that will confuse or lock out users.

---

## 1. Core functionality & user flows

**App purpose (one sentence):** A travel blog platform where users sign up, post photos/captions with locations, like/comment, follow others, and receive notifications.

**What works end-to-end:**
- **Auth:** Sign up (SignUp.jsx), sign in (SignIn.jsx), token + refreshToken stored; login/register use USER_SERVICE; forgot-password flow exists.
- **Feed:** Loads posts (content-service), dummy + real posts, pagination; like/comment send token where required.
- **Profile:** Profile.jsx uses shared `api` for user + posts + follow-stats; EditProfile, ChangeEmail, ChangePassword use `api` (token refresh works).
- **Post creation:** Post.jsx sends `Authorization: Bearer ${token}` to POST /posts; Cloudinary upload; location (text + GPS).
- **Navigation:** RequireAuth/GuestOnly guards; routes for feed, profile, post, map, explore, search, notifications, user/:id.

**Broken / incomplete / fragile:**
- **AuthContext.jsx (AuthPage):** Does **not** store `refreshToken`. Only SignIn.jsx stores it (`if (response.data.refreshToken) localStorage.setItem('refreshToken', ...)`). If the app ever uses AuthPage for login (e.g. from a different entry), refresh will never work and users will be logged out after 15 minutes.
- **api.js** is partially dead / wrong:
  - `BASE_URL.locations = 'http://localhost:5003'` is **hardcoded**. No `REACT_APP_LOCATION_SERVICE_URL`. Any use of `getLocations()` or location-service in production will call localhost.
  - `fetchNotifications` / `createNotification` use `CONTENT_SERVICE` for `/notifications`; content-service has **no** `/notifications` route (only notification-service does). The main Notifications **page** correctly uses NOTIF_SERVICE; the small **component** `components/Notifications.jsx` imports `fetchNotifications` from api and would hit the wrong service (currently unused in App.js).
- **Token expiry (15 min):** Most of the app uses raw `fetch()` with manual `Authorization` and does **not** use the shared `api` client. So when the access token expires, those requests get 401 and there is **no** automatic refresh and retry. Only flows using `api` (edit profile, change email/password, profile user/posts) get refresh. Feed like/comment, follow, block, report, post delete, etc. will fail with 401 after 15 min with no user-friendly recovery (silent failure or generic error).
- **No TODOs/FIXMEs** in app source; no commented-out critical logic found.

---

## 2. Error handling & resilience

**API calls / async:**
- Many `fetch()` calls do **not** check `res.ok` before `res.json()`. If the server returns 4xx/5xx with a non-JSON body (or invalid JSON), `await res.json()` can throw and crash the component or leave state inconsistent. Examples: Feed.jsx (like/comment handlers use `const data = await res.json()` then check `res.ok` after), Explore.jsx, PostDetail.jsx, CommentSection, EditPostModal, ForgotPassword (calls `res.json()` then checks `!response.ok` — correct order for auth, but 5xx HTML would still break .json()).
- **api.js:** Every helper returns `res.json()` without checking `res.ok`. Callers get error bodies as “data”; no standard handling.
- **Silent failures:** Feed initial load does `catch (_) {}` and “Backend unavailable, showing sample posts”; like/comment in Feed do `catch (_) {}` with no toast or message. User may think an action succeeded when it failed (e.g. 401).
- **Loading/empty states:** Notifications page has loading and empty state; Profile, Feed, MapView have loading. Many list views do not show a clear “error, retry” state when the request fails.

**Recommendation:** Use shared `api` (or a fetch wrapper) that (1) attaches token, (2) on 401 tries refresh and retries, (3) checks `res.ok` and only then parses JSON, (4) surfaces a consistent error/toast.

---

## 3. State management & consistency

- **Auth/session:** Auth state is effectively “token in localStorage” + redirect in api interceptor on 401 (clear storage, redirect to /). There is no in-memory auth context that stays in sync with token/refresh; RequireAuth only reads localStorage. On refresh, the page reloads and token is still in localStorage — so session persists across refresh. If refresh fails (e.g. refresh token expired), the interceptor clears storage and redirects to /, which is correct.
- **Race conditions:** Feed and others use `cancelled` flags in useEffect to avoid setState after unmount; pagination uses refs (hasMoreRef, pageRef). No obvious stale closure bugs found.
- **Double usage of “api”:** Two different things: `utils/api.js` (axios with interceptors) and `api.js` (plain fetch helpers). Naming is confusing and leads to mixed usage (some flows use fetch + token, some use api from utils).

---

## 4. Environment & configuration

**Correct:**
- Frontend: `USER_SERVICE`, `CONTENT_SERVICE`, `NOTIF_SERVICE` from `REACT_APP_*` with localhost fallback; Cloudinary from env.
- user-service: MONGO_URI, JWT_SECRET (and JWT_REFRESH_SECRET) required at startup; exits with clear message if missing.
- content-service: MONGO_URI, dotenv; NOTIF_SERVICE_URL with fallback `http://localhost:5006`.
- notification-service: dotenv, VAPID from env (but see Security).

**Issues:**
- **frontend/package.json:** `"proxy": "http://localhost:5004"` — CRA proxy is **dev-only**; production build ignores it. Production must set REACT_APP_* to real backend URLs. Documented in DEPLOYMENT.md but easy to miss.
- **api.js:** `locations: 'http://localhost:5003'` — no env; production will always call localhost for location service.
- **.env.example:** Does not list REACT_APP_USER_SERVICE_URL etc.; DEPLOYMENT.md does. Recommend adding them to .env.example so “clean install” is obvious.

---

## 5. Security & data safety

**Good:**
- user-service: rate limiting on auth and general routes; helmet; mongo-sanitize; bcrypt for passwords; JWT for access + refresh; protected routes use verifyToken.
- content-service: verifyToken on POST/PUT/DELETE posts, likes, comments; helmet; mongo-sanitize; rate limit.
- notification-service: no auth on GET /notifications/:userId — anyone who knows userId can read that user’s notifications (acceptable for MVP if userId is not guessable; consider auth later).
- No JWT_SECRET or MongoDB credentials in repo (they are in .env / WANDR_IMPORTANT_KEYS.md which is gitignored).

**Critical:**
- **notification-service/index.js:** VAPID keys have **in-code fallbacks** if env is missing:
  - `VAPID_PUBLIC_KEY  || 'BH0RjhWx-...'`
  - `VAPID_PRIVATE_KEY || 'eW36tbRtj_...'`
  So the **private key is in source**. If the repo is ever public or leaked, push subscriptions could be abused. **Fix:** Require VAPID from env in production (e.g. `if (!process.env.VAPID_PRIVATE_KEY) throw new Error('VAPID_PRIVATE_KEY required')`) and remove hardcoded defaults.

**Moderate:**
- CORS is open (`cors()`) on all backends. For production, restrict origin to the frontend URL.
- GET /users/:userId and GET /posts are public; POST /likes, POST /comments, follow, etc. require Authorization. No obvious IDOR in the routes audited (e.g. delete post checks post owner).

---

## 6. Performance & UX

- **Re-renders:** Large lists (Feed, Explore) fetch per-post likes/comments in parallel; some pages do many small requests. Consider batching or a small backend aggregate if needed later.
- **Heavy work:** Cloudinary upload and Nominatim reverse geocode run on main thread; acceptable for current scale. No heavy sync work in tight loops.
- **Loading/empty:** Loading states exist on main pages; empty states on Notifications and similar. Some error paths do not show a clear “Something went wrong, try again” with retry.
- **UX:** After 15 min, like/comment/follow will 401 without refresh; user sees silent failure or generic error. Feels “not production-ready” for session length and error feedback.

---

## 7. Build & deployment sanity

- **Production build:** `npm run build` in frontend completes successfully (exit code 0).
- **Routing:** React Router (BrowserRouter); all routes are client-side; no SSR. No dynamic imports observed; no obvious SSR/CSR boundary issues.
- **Warnings:** No build warnings captured; no patterns that obviously break production (e.g. missing env at build time is handled by localhost fallbacks).

**Deployment gaps:**
- content-service must have `NOTIF_SERVICE_URL` set to the **deployed** notification-service URL in production; otherwise delete-post notification cleanup and like/comment notifications will fail or target localhost.
- If location-service is used in production, frontend must have a way to set its URL (e.g. REACT_APP_LOCATION_SERVICE_URL); currently api.js hardcodes localhost.

---

## 8. Code quality & maintainability

- **Duplication:** Many pages repeat the same pattern: fetch with Authorization, then res.json(), then check res.ok. Centralizing this in one client (e.g. `utils/api`) would reduce bugs and make 401/refresh behavior consistent.
- **Fragile:** Reliance on raw fetch and manual token handling is fragile: new features often forget the token or forget to use the refresh-capable client.
- **Debugging:** When a user reports “like doesn’t work” or “I was logged out,” production debugging will require checking whether the request used the shared api, whether token was sent, and whether refresh ran. Logging or error reporting (e.g. 401 counts) would help.

---

## Prioritized checklist

### Critical (must fix before production)

1. **Remove VAPID fallbacks in notification-service**  
   Require `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from env; remove hardcoded keys from `notification-service/index.js`.

2. **Fix production URL for location service**  
   In `frontend/src/api.js`, replace `locations: 'http://localhost:5003'` with `process.env.REACT_APP_LOCATION_SERVICE_URL || 'http://localhost:5003'`, and document in .env.example and DEPLOYMENT.md. If location service is not used in production, remove or gate usage so no request hits localhost.

3. **Fix api.js notification URL**  
   In `frontend/src/api.js`, `fetchNotifications` and `createNotification` use CONTENT_SERVICE; they should use NOTIF_SERVICE (or the same base as the Notifications page). Even if the small Notifications component is unused today, fix the API so future use is correct.

4. **Ensure refreshToken is always stored on login**  
   If AuthPage (AuthContext.jsx) is ever used for login, store `data.refreshToken` in localStorage (same as SignIn.jsx). Prefer a single auth entry point so refresh behavior is consistent.

5. **Avoid .json() on error responses**  
   In all critical paths, check `res.ok` (or equivalent) before calling `res.json()`. If not ok, parse .json() in a try/catch or use a helper that returns { ok, data, error } so non-JSON error bodies don’t crash the app.

### High (should fix before production)

6. **Use shared api client for all authenticated requests**  
   Migrate Feed (like, comment, delete post, following-ids), Explore (like, comment, follow), PostDetail, UserProfileView (follow, block, report), FollowListModal, CommentSection, EditPostModal, LikeButton, etc. to use the axios instance from `utils/api.js` so 401 triggers refresh and retry. This prevents “logged out” feeling after 15 min and gives consistent error handling.

7. **Surface errors to the user**  
   Replace silent `catch (_) {}` (e.g. Feed like/comment) with toast or inline message (“Couldn’t save. Try again.”) and optionally retry.

8. **Tighten CORS**  
   Set `origin` to the frontend URL (e.g. `https://your-app.vercel.app`) on user-service, content-service, notification-service in production.

### Nice-to-have

9. **.env.example**  
   Add REACT_APP_USER_SERVICE_URL, REACT_APP_CONTENT_SERVICE_URL, REACT_APP_NOTIF_SERVICE_URL, and optionally REACT_APP_LOCATION_SERVICE_URL with placeholder values.

10. **Single auth entry**  
    Use one login/signup flow (e.g. SignIn/SignUp only) and remove or redirect AuthPage so refreshToken and behavior are consistent.

11. **Consolidate API layer**  
    Deprecate or refactor `api.js` (fetch helpers) in favor of `utils/api.js` (axios + interceptors) and one set of constants so there’s no confusion and no duplicate logic.

---

## Summary

| Area                     | Status | Notes                                                                 |
|--------------------------|--------|----------------------------------------------------------------------|
| Core functionality       | 🟡     | Main flows work; token expiry and mixed fetch/api usage cause 401s. |
| Error handling           | 🔴     | Many places ignore errors or call .json() on error responses.       |
| State / auth             | 🟡     | Session persists; refresh only works for a subset of requests.       |
| Environment / config     | 🟡     | One hardcoded URL (locations); proxy dev-only.                        |
| Security                 | 🔴     | VAPID private key fallback in source.                               |
| Performance / UX         | 🟡     | Acceptable; error feedback and “silent fail” need improvement.      |
| Build                    | ✅     | Production build succeeds.                                           |
| Code quality             | 🟡     | Duplication and mixed fetch vs api make it fragile.                  |

**Conclusion:** Do **not** deploy as-is. Fix the **critical** items (VAPID, locations URL, notifications URL, refreshToken on login, and safe .json() usage), then address the **high** items (shared api for auth requests, user-visible errors, CORS). After that, the app will be in an “almost ready” state; the nice-to-haves will make it easier to maintain and debug in production.
