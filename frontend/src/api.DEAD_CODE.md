# Legacy api.js — DEPRECATED / DEAD CODE

**File:** `frontend/src/api.js`

This file contains legacy fetch-based API helpers that are **no longer used** by the main application. The app now uses:

- **`utils/api.js`** — axios-based client with automatic token refresh on 401
- **`utils/parseResponse.js`** — safe JSON parsing for fetch responses
- **`utils/fetchWithTimeout.js`** — fetch with configurable timeout

The functions in `api.js` (`createPost`, `createComment`, `toggleLike`, `updateProfile`, `getAllPosts`, `getUserById`, etc.) do not check `res.ok`, do not use timeouts, and do not trigger token refresh. **Do not use them for new code.**

**Status:** Kept for reference only. Safe to delete once all imports are confirmed removed. As of the final pre-deployment hardening pass, no active page or component imports from this file.
