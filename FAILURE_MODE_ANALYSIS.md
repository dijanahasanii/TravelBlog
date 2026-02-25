# Step 1 — Failure-Mode Analysis (NO CODE CHANGES)

Concrete risk points and files involved.

---

## 1. MongoDB slow, temporarily unavailable, or empty results

| Risk | Files | What happens |
|------|--------|---------------|
| **user-service:** Mongoose connect fails but server still listens | `user-service/index.js` | `mongoose.connect().catch(err => console.error(...))` — no `process.exit(1)`. Requests hit routes while DB is down → Mongoose operations throw → 500 or unhandled rejection. |
| **content-service:** Server starts before DB is ready | `content-service/index.js`, `content-service/db.js` | `connectDB()` is called but not awaited. `db.js` does `process.exit(1)` on failure, but if connect is slow, first requests may run before connection is established. |
| **notification-service:** DB connect failure not fatal | `notification-service/index.js` | `mongoose.connect().catch((err) => console.log(err))` — no exit. Server listens; write/read routes will fail with 500 when Mongo is down. |
| **Empty results** | Various controllers | `Post.find()`, `Like.find()`, etc. return `[]`. Most handlers `res.json(posts)` or `res.json(likes)` — frontend gets `[]`. Risk: frontend assumes array but doesn't guard; if any code assumed length > 0, could throw. |

---

## 2. Mongoose query throws (cast errors, validation errors)

| Risk | Files | What happens |
|------|--------|---------------|
| **Invalid ObjectId in params** | `content-service/controllers/likeController.js` | `Post.findById(postId)` with invalid `postId` (e.g. non-24-char hex) → Mongoose CastError. Caught by try/catch → 500 with `err.message`. No explicit validation before find. |
| **Invalid ObjectId** | `content-service/controllers/commentController.js` | `Post.findById(postId)` in addComment — same. `Comment.findById(commentId)` in toggleCommentLike — guarded by `mongoose.Types.ObjectId.isValid(commentId)` first. |
| **getUserById** | `user-service/controllers/userController.js` | `User.findById(req.params.userId)` — invalid id throws; catch returns 500 "Server error". |
| **updatePost** | `content-service/controllers/postController.js` | `Post.findById(postId)` — invalid postId throws; catch returns 500. |
| **commentController addComment** | `content-service/controllers/commentController.js` | No validation of `postId` before `Post.findById(postId)` — invalid postId throws. |
| **Validation errors on save** | All `Model.save()` / `create()` | Schema validation throws; caught by route try/catch → 500. Acceptable. |

---

## 3. Network requests fail, timeout, or unexpected shapes

| Risk | Files | What happens |
|------|--------|---------------|
| **Frontend: res.json() on error response** | Various (Feed, Post, etc. — partially fixed in hardening) | Some flows use `parseResponse` or check `res.ok`; others still call `res.json()` on 4xx/5xx or non-JSON body → can throw, crash component or leave state inconsistent. |
| **Backend: content-service calling notification-service** | `content-service/controllers/likeController.js`, `commentController.js`, `content-service/routes/posts.js` | `axios.post(...).catch(() => {})` or `.catch(() => {})` — failure is swallowed. Like/comment/post-delete still succeed; notification is best-effort. No crash. |
| **Timeout** | Frontend fetch, backend axios | No explicit timeouts. Slow Mongo or network can hang; browser may eventually timeout. |

---

## 4. Auth tokens expire mid-session

| Risk | Files | What happens |
|------|--------|---------------|
| **Routes using shared `api` client** | Feed (following-ids, like, comment), Profile, EditProfile, ChangeEmail, ChangePassword | 401 triggers refresh and retry (utils/api.js). After 15 min, first request may 401, then refresh runs; if refresh fails, localStorage cleared and redirect to /. |
| **Routes using raw fetch with token** | Explore, PostDetail, UserProfileView, FollowListModal, LikeButton, etc. | No automatic refresh. After 15 min, request returns 401; user sees error toast or silent failure; no retry. |
| **Backend: invalid or expired token** | All services using verifyToken / auth middleware | Returns 401. No crash. |

---

## 5. Summary: highest-impact risks

1. **user-service:** Server listens even when MongoDB connection fails → 500s or unhandled rejections on every request until DB is back.
2. **notification-service:** Same — server starts, DB failures only surface when routes are hit.
3. **content-service:** connectDB() not awaited; possible race on first requests.
4. **content-service likeController / commentController:** Invalid `postId` (e.g. malformed string) causes CastError → 500; could be validated before findById.
5. **Frontend:** Remaining flows that don't use parseResponse or api client can throw on bad responses or silently fail on 401.

No code modified in this step.
