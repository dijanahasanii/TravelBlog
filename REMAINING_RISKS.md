# Remaining Non-Critical Risks (Post-Hardening)

After the final pre-deployment hardening pass, these risks remain. They are documented rather than silently ignored.

## 1. Push subscription endpoints

`POST /push/subscribe` and `DELETE /push/unsubscribe` on notification-service accept `userId` in the body and do not validate that the requester owns that userId. A malicious client could subscribe/unsubscribe on behalf of another user. **Mitigation:** Low impact (worst case: wrong user receives push); consider adding JWT auth and `req.user.id === req.body.userId` in a future pass.

## 2. Legacy api.js

`frontend/src/api.js` is deprecated (see `api.DEAD_CODE.md`). No active imports. Safe to delete after final confirmation.

## 3. Cloudinary / external uploads

`frontend/src/utils/cloudinary.js` uses raw `fetch` for uploads. Errors may not be surfaced consistently. Acceptable for first deploy; migrate to `fetchWithTimeout` + `parseResponse` in a later pass if needed.

## 4. VideoPlayer / external asset fetch

`VideoPlayer.jsx` uses `fetch(src)` for video loading. Failure handling is minimal. Non-blocking for first deploy.

## 5. Optional improvements (future)

- Retry logic for transient MongoDB/network failures
- Centralized error monitoring (e.g. Sentry)
- Full E2E test suite for critical flows
- Auth enforcement on push subscribe/unsubscribe
