# Phase 0 — Baseline safety (report only, no code changes)

## Critical paths and files

### Auth
- **Login:** `SignIn.jsx` (POST USER_SERVICE/login, stores token + refreshToken), `AuthContext.jsx` (AuthPage: POST login/register, stores only token).
- **Register:** `SignUp.jsx` (POST USER_SERVICE/register, then redirect to signin), AuthContext AuthPage (register path stores only token).
- **Refresh:** `frontend/src/utils/api.js` (axios interceptor: on 401 calls USER_SERVICE/refresh with refreshToken, retries request).
- **Files:** `SignIn.jsx`, `SignUp.jsx`, `AuthContext.jsx`, `App.js`, `AuthChoice.jsx`, `ForgotPassword.jsx`, `utils/api.js`, `constants/api.js`.

### Feed
- **Load:** `Feed.jsx` — fetch POSTS, following-ids, enrich posts, likes/comments per post.
- **Like/comment:** `Feed.jsx` (handleLikeToggle, handleCommentSubmit), `LikeButton.jsx` (toggle like).
- **Files:** `Feed.jsx`, `LikeButton.jsx`, `api.js`, `utils/api.js`, `constants/api.js`.

### Post creation
- **Create:** `Post.jsx` — Cloudinary upload, then POST CONTENT_SERVICE/posts with Bearer token.
- **Files:** `Post.jsx`, `utils/cloudinary.js`, `constants/api.js`.

### Notifications
- **List:** `pages/Notifications.jsx` — fetch NOTIF_SERVICE/notifications/:userId (no auth header).
- **Push:** notification-service (VAPID, push/subscribe, push/unsubscribe); frontend `usePushNotifications.js`, `SocketContext.jsx`.
- **Helpers:** `api.js` fetchNotifications/createNotification use CONTENT_SERVICE (wrong).
- **Files:** `Notifications.jsx`, `api.js`, `usePushNotifications.js`, `SocketContext.jsx`, `notification-service/index.js`, `notification-service/routes/notificationRoutes.js`.

## Fix → files touched (planned)

| Fix | Files to touch |
|-----|----------------|
| 1. VAPID | notification-service/index.js |
| 2. Location URL | frontend/src/api.js, .env.example, DEPLOYMENT.md |
| 3. Notification API base | frontend/src/api.js |
| 4. Refresh token storage | frontend/src/context/AuthContext.jsx |
| 5. Safe res.json() | Feed.jsx, LikeButton.jsx, Post.jsx (and small helper or inline) |
| 6. Migrate to api client | Feed.jsx (likes/comments/following-ids), then others incrementally |
| 7. Error surfacing | Feed.jsx, others with empty catch |

## Tests

- **App.test.js** exists and only checks for "learn react" (CRA default); not covering critical paths.
- No **__tests__** directory; no other test files in app source.
- **Assumption:** manual testing required after each step. No automated tests to run.

## No code modified in Phase 0

This phase is report-only. Proceeding to Phase 1.
