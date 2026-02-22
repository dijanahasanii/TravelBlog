# WANDR — Demo Recording Script
### For portfolio video / LinkedIn post (~2–3 minutes)

---

## Before You Start

1. Start all services: run `start.ps1` (or manually start user-service, content-service, notification-service, frontend)
2. Open **two browser windows** side by side — or use one normal + one incognito
3. Clear any previous login (open the app and sign out first)
4. Set browser zoom to ~90% so more content fits on screen
5. Use a screen recorder (OBS, Loom, or Windows Game Bar: Win + G)

**Demo credentials (all use password `Demo1234!`)**
| Account | Email | Username |
|---|---|---|
| Window 1 | `sofia@wandr.demo` | @sofia.wanders |
| Window 2 (incognito) | `marco@wandr.demo` | @marco.explores |

---

## Scene-by-Scene Script

---

### SCENE 1 — Landing Page (0:00–0:15)
**What to show:** The app homepage before login — full screen, no sidebar

- Navigate to `http://localhost:3000`
- Let the landing page sit for 2 seconds so viewers can read it
- **Narrate:** *"This is WANDR — a travel social platform built with React, Node.js microservices, and MongoDB Atlas."*
- Click **Sign In**

---

### SCENE 2 — Sign In + Feed (0:15–0:40)
**What to show:** Authentication → rich feed

- Sign in as `sofia@wandr.demo` / `Demo1234!`
- The feed loads with posts from Marco and Yuki (beautiful travel photos)
- Scroll slowly through 2–3 posts so viewers can see the card layout
- **Narrate:** *"After login, the feed shows posts from people you follow — with location, likes, and comments."*
- Point out: the left sidebar navigation (desktop), profile avatars, like counts

---

### SCENE 3 — Like a Post (0:40–0:50)
**What to show:** Instant optimistic like

- Like one of Marco's posts (Kyoto or Cappadocia)
- The heart fills **instantly** without any delay
- **Narrate:** *"Likes use optimistic UI — they update instantly on screen while the request runs in the background."*

---

### SCENE 4 — Comment (0:50–1:05)
**What to show:** Comment section

- Click the comment icon on the same post
- Read one of the existing comments ("The colors in this shot 🔥")
- Click on Marco's username in the comment → navigates to his profile
- **Narrate:** *"Comments are threaded. Every commenter's profile is clickable."*

---

### SCENE 5 — User Profile (1:05–1:25)
**What to show:** Another user's profile with follow system

- You're now on Marco's profile
- See his stats: posts, followers, following
- Click **Following** count → FollowListModal opens, shows the list of people he follows
- Click a user in that list → navigates to their profile
- Go back to Marco's profile, click the **Follow / Unfollow** button
- **Narrate:** *"Profiles show post grids, follower/following lists, and a follow system with real-time updates."*

---

### SCENE 6 — Real-time Notifications (1:25–1:50)
**What to show:** Cross-account live notification

- Switch to your **second window** (incognito) → sign in as `marco@wandr.demo`
- Go to Marco's notification bell — show the unread badge (red dot)
- Open notifications — see Sofia's like and comment on his Kyoto post
- Click Sofia's avatar in the notification → goes to Sofia's profile
- **Narrate:** *"Real-time notifications via Socket.io — likes, comments, and follows trigger instant in-app alerts."*

---

### SCENE 7 — Create a Post (1:50–2:10)
**What to show:** Post creation flow

- As Marco, click the **+** button (post creation)
- Upload a photo (any photo from your desktop)
- Write a short caption: *"Testing WANDR live 🌍 #demo"*
- Add a location: type "Tokyo" and select it
- Hit **Post**
- The post appears in the feed
- **Narrate:** *"Creating a post takes seconds — photo upload, caption, and location tagging all in one form."*

---

### SCENE 8 — Search (2:10–2:25)
**What to show:** Search by username + post interaction from search

- Click the **Search** icon
- Type "sofia" → Sofia's profile appears
- Click into a search result post → like or comment directly from search results
- **Narrate:** *"Search finds users and posts. Every post in search results is fully interactive."*

---

### SCENE 9 — Saved Posts (2:25–2:35)
**What to show:** Bookmarking

- On any post, click the **bookmark icon** → post is saved
- Navigate to **Saved** in the sidebar
- Show the bookmarked post with an **Unsave** button
- **Narrate:** *"Users can bookmark any post and revisit their saved collection anytime."*

---

### SCENE 10 — Profile + Edit (2:35–2:50)
**What to show:** Own profile management

- Go to **your own profile** (Sofia)
- Show the post grid, bio, location, stats
- Click **Edit Profile** → change the bio or avatar
- Save changes — updates reflect immediately
- **Narrate:** *"Full profile management — edit bio, location, and avatar with instant preview."*

---

### SCENE 11 — Map View (2:50–3:00)
**What to show:** Location-based exploration

- Click **Map** in the navigation
- The map loads showing pinned posts by location (Santorini, Kyoto, etc.)
- Click a pin → post preview pops up
- **Narrate:** *"The Map view lets you explore posts by location — powered by Leaflet and OpenStreetMap."*

---

### CLOSING — Tech Stack Overlay (3:00–3:10)
End on the feed or map view and overlay (or narrate) the stack:
> *"WANDR — built with React, Node.js microservices, MongoDB Atlas, Socket.io, Cloudinary, and deployed as a PWA. Available on GitHub."*

---

## LinkedIn Caption Template

```
Built WANDR — a full-stack travel social platform from scratch.

Tech stack:
→ React.js (custom hooks, optimistic UI, infinite scroll)
→ Node.js microservices (user, content, notification services)
→ MongoDB Atlas + Mongoose
→ Socket.io for real-time notifications
→ Cloudinary for media storage
→ JWT auth with refresh tokens
→ PWA-ready with offline support
→ Deployed with Helmet, rate limiting, and sanitization

Features: social feed, follow system, real-time notifications,
threaded comments, post bookmarks, map view, search,
image carousel, video posts, and more.

[link to repo or live URL]

#React #NodeJS #MongoDB #FullStack #WebDevelopment #Portfolio
```

---

## Tips for a Clean Recording

- **Hide browser bookmarks bar** (Ctrl+Shift+B to toggle)
- **Full screen the browser** (F11) for cleaner shots
- **Use a microphone** — even a phone mic is better than no audio
- **Record at 1920×1080** minimum
- **Trim dead air** in editing — keep it tight and under 3 minutes
- Tools: **Loom** (free, auto-uploads), **OBS** (more control), or **Windows Game Bar** (Win+G, built-in)

---

*Re-seed demo data anytime: `cd user-service && node seed-demo.js`*
