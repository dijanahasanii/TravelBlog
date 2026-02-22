/**
 * WANDR — Demo Seeder
 * Run from inside user-service folder: node seed-demo.js
 *
 * Creates 3 realistic demo travel accounts with posts, likes, comments,
 * follows and notifications so the app looks fully alive for a portfolio demo.
 *
 * Safe to run multiple times — wipes existing demo accounts first.
 */

const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
require('dotenv').config()

// ── Connection strings ────────────────────────────────────────────────────────
const BASE = 'mongodb+srv://dijanahasani:Traveli1@traveli1.yclmttj.mongodb.net'
const MONGO_USERDB    = `${BASE}/userdb?appName=Traveli1`
const MONGO_CONTENTDB = `${BASE}/contentdb?appName=Traveli1`
const MONGO_NOTIFDB   = `${BASE}/notificationdb?appName=Traveli1`

// ── Inline schemas (self-contained — no imports from other services) ──────────
const userSchema = new mongoose.Schema(
  { fullName: String, username: String, email: String, password: String,
    bio: String, location: String, avatar: String },
  { timestamps: true }
)

const postSchema = new mongoose.Schema(
  { userId:   { type: mongoose.Schema.Types.ObjectId },
    caption:  String,
    image:    { type: String, default: '' },
    images:   { type: [String], default: [] },
    video:    { type: String, default: null },
    location: String,
    likes:    { type: [String], default: [] },
    comments: { type: [{ userId: String, text: String, timestamp: Date }], default: [] } },
  { timestamps: true }
)

const commentSchema = new mongoose.Schema({
  postId:   { type: mongoose.Schema.Types.ObjectId },
  userId:   { type: mongoose.Schema.Types.ObjectId },
  text:     String,
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  likes:    { type: [mongoose.Schema.Types.ObjectId], default: [] },
  createdAt: { type: Date, default: Date.now },
})

const likeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  postId: { type: mongoose.Schema.Types.ObjectId },
})

const followSchema = new mongoose.Schema(
  { followerId:  { type: mongoose.Schema.Types.ObjectId, required: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, required: true } },
  { timestamps: true }
)

const notifSchema = new mongoose.Schema(
  { userId: String, targetUserId: String, postId: String,
    type: String, message: String, commentText: String,
    isRead: { type: Boolean, default: false } },
  { timestamps: true }
)

// ── Real Unsplash photo URLs (no API key needed) ──────────────────────────────
const P = {
  santorini:   'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
  bali:        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  paris:       'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
  kyoto:       'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
  amalfi:      'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800&q=80',
  machu:       'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
  maldives:    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
  cappadocia:  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  iceland:     'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80',
  marrakech:   'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80',
  avatar1:     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  avatar2:     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  avatar3:     'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
}

// Helper: date X days ago
function ago(days, hours = 0) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() - hours)
  return d
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  WANDR Demo Seeder starting…\n')

  const userConn    = await mongoose.createConnection(MONGO_USERDB).asPromise()
  const contentConn = await mongoose.createConnection(MONGO_CONTENTDB).asPromise()
  const notifConn   = await mongoose.createConnection(MONGO_NOTIFDB).asPromise()

  console.log('✅  Connected to all 3 databases')

  const User         = userConn.model('User', userSchema)
  const Post         = contentConn.model('Post', postSchema)
  const Comment      = contentConn.model('Comment', commentSchema)
  const Like         = contentConn.model('Like', likeSchema)
  const Follow       = userConn.model('Follow', followSchema)
  const Notification = notifConn.model('Notification', notifSchema)

  // ── Wipe existing demo data ────────────────────────────────────────────────
  const DEMO_EMAILS = ['sofia@wandr.demo', 'marco@wandr.demo', 'yuki@wandr.demo']
  const oldUsers    = await User.find({ email: { $in: DEMO_EMAILS } })
  const oldIds      = oldUsers.map(u => u._id)
  const oldIdStrs   = oldIds.map(id => id.toString())

  if (oldIds.length) {
    console.log(`🗑️   Removing ${oldIds.length} previous demo account(s)…`)
    await Promise.all([
      User.deleteMany({ email: { $in: DEMO_EMAILS } }),
      Post.deleteMany({ userId: { $in: oldIds } }),
      Comment.deleteMany({ userId: { $in: oldIds } }),
      Like.deleteMany({ userId: { $in: oldIds } }),
      Follow.deleteMany({ $or: [{ followerId: { $in: oldIds } }, { followingId: { $in: oldIds } }] }),
      Notification.deleteMany({ $or: [{ userId: { $in: oldIdStrs } }, { targetUserId: { $in: oldIdStrs } }] }),
    ])
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤  Creating demo users…')
  const pw = await bcrypt.hash('Demo1234!', 10)

  const [sofia, marco, yuki] = await User.insertMany([
    {
      fullName: 'Sofia Reyes', username: 'sofia.wanders',
      email: 'sofia@wandr.demo', password: pw,
      bio: '🌍 Solo traveler · 47 countries · Chasing sunsets & street food',
      location: 'Barcelona, Spain', avatar: P.avatar1,
    },
    {
      fullName: 'Marco Bianchi', username: 'marco.explores',
      email: 'marco@wandr.demo', password: pw,
      bio: '📸 Travel photographer · Italy → Everywhere · Stories worth telling',
      location: 'Rome, Italy', avatar: P.avatar2,
    },
    {
      fullName: 'Yuki Tanaka', username: 'yuki.journey',
      email: 'yuki@wandr.demo', password: pw,
      bio: '✈️ Digital nomad · Food lover · Currently: Southeast Asia',
      location: 'Tokyo, Japan', avatar: P.avatar3,
    },
  ])
  console.log(`   ✅  ${sofia.username} / ${marco.username} / ${yuki.username}`)

  // ── Posts ──────────────────────────────────────────────────────────────────
  console.log('📸  Creating posts…')

  const sofiaPosts = await Post.insertMany([
    {
      userId: sofia._id,
      caption: "Lost in the blue domes of Santorini 💙 There's something about this place that makes time stand still. The white-washed walls, the volcanic cliffs, the Aegean stretching forever… I've been here three days and I genuinely cannot leave. #Santorini #Greece #SoloTravel",
      image: P.santorini, images: [P.santorini],
      location: 'Santorini, Greece',
      likes: [marco._id.toString(), yuki._id.toString()],
      createdAt: ago(5), updatedAt: ago(5),
    },
    {
      userId: sofia._id,
      caption: "Sunrise over the Bali rice terraces 🌅 Woke up at 4:30 AM for this view and honestly? Worth every second. The mist, the green, the absolute silence except for the birds… Ubud is pure magic. #Bali #Indonesia #Ubud",
      image: P.bali, images: [P.bali],
      location: 'Ubud, Bali, Indonesia',
      likes: [marco._id.toString()],
      createdAt: ago(12), updatedAt: ago(12),
    },
    {
      userId: sofia._id,
      caption: "She always had a thing for Paris ❤️ Cliché? Maybe. Worth it? Absolutely. The croissants alone justify the flight. #Paris #France #Eiffel",
      image: P.paris, images: [P.paris],
      location: 'Paris, France',
      likes: [marco._id.toString(), yuki._id.toString()],
      createdAt: ago(21), updatedAt: ago(21),
    },
  ])

  const marcoPosts = await Post.insertMany([
    {
      userId: marco._id,
      caption: "Chasing golden hour in Kyoto 🍂 Fushimi Inari at dusk — 10,000 torii gates and a silence so deep you can hear yourself breathe. No filter. No edits. Just this. #Kyoto #Japan #GoldenHour",
      image: P.kyoto, images: [P.kyoto],
      location: 'Kyoto, Japan',
      likes: [sofia._id.toString(), yuki._id.toString()],
      createdAt: ago(3), updatedAt: ago(3),
    },
    {
      userId: marco._id,
      caption: "The Amalfi Coast hits different when you're on a scooter 🛵 Wind in your face, cliffs on your left, Mediterranean on your right. This is the Italy they don't put in guidebooks. #AmalfiCoast #Italy",
      image: P.amalfi, images: [P.amalfi],
      location: 'Amalfi Coast, Italy',
      likes: [sofia._id.toString()],
      createdAt: ago(8), updatedAt: ago(8),
    },
    {
      userId: marco._id,
      caption: "Hot air balloons over Cappadocia at sunrise 🎈 This is one of those views that makes you forget every bad day you've ever had. Turkey is massively underrated. Book the ticket. #Cappadocia #Turkey #BucketList",
      image: P.cappadocia, images: [P.cappadocia],
      location: 'Göreme, Cappadocia, Turkey',
      likes: [sofia._id.toString(), yuki._id.toString()],
      createdAt: ago(18), updatedAt: ago(18),
    },
  ])

  const yukiPosts = await Post.insertMany([
    {
      userId: yuki._id,
      caption: "Northern Lights from a glass igloo in Iceland 🌌 -15°C outside and I'm lying in a warm bubble staring at the aurora borealis dance across the sky. Some experiences genuinely cannot be described. #Iceland #NorthernLights #Aurora",
      image: P.iceland, images: [P.iceland],
      location: 'Northern Iceland',
      likes: [sofia._id.toString(), marco._id.toString()],
      createdAt: ago(2), updatedAt: ago(2),
    },
    {
      userId: yuki._id,
      caption: "Djemaa el-Fna square, Marrakech 🕌 The colors, the smells, the sounds — sensory overload in the best possible way. Snake charmers, spice merchants, storytellers. This square never sleeps. #Marrakech #Morocco",
      image: P.marrakech, images: [P.marrakech],
      location: 'Marrakech, Morocco',
      likes: [sofia._id.toString()],
      createdAt: ago(9), updatedAt: ago(9),
    },
    {
      userId: yuki._id,
      caption: "Maldives: the most expensive nap of my life 😂💙 But also the clearest water, the softest sand, and the most surreal overwater bungalow experience. 10/10 would go broke again. #Maldives #LuxuryTravel",
      image: P.maldives, images: [P.maldives],
      location: 'North Malé Atoll, Maldives',
      likes: [marco._id.toString(), sofia._id.toString()],
      createdAt: ago(30), updatedAt: ago(30),
    },
  ])

  console.log(`   ✅  9 posts created`)

  // ── Likes (Like collection) ────────────────────────────────────────────────
  console.log('❤️   Creating like records…')
  await Like.insertMany([
    { userId: marco._id, postId: sofiaPosts[0]._id },
    { userId: yuki._id,  postId: sofiaPosts[0]._id },
    { userId: marco._id, postId: sofiaPosts[1]._id },
    { userId: marco._id, postId: sofiaPosts[2]._id },
    { userId: yuki._id,  postId: sofiaPosts[2]._id },
    { userId: sofia._id, postId: marcoPosts[0]._id },
    { userId: yuki._id,  postId: marcoPosts[0]._id },
    { userId: sofia._id, postId: marcoPosts[1]._id },
    { userId: sofia._id, postId: marcoPosts[2]._id },
    { userId: yuki._id,  postId: marcoPosts[2]._id },
    { userId: sofia._id, postId: yukiPosts[0]._id },
    { userId: marco._id, postId: yukiPosts[0]._id },
    { userId: sofia._id, postId: yukiPosts[1]._id },
    { userId: marco._id, postId: yukiPosts[2]._id },
    { userId: sofia._id, postId: yukiPosts[2]._id },
  ])
  console.log('   ✅  15 likes created')

  // ── Comments ───────────────────────────────────────────────────────────────
  console.log('💬  Creating comments…')
  await Comment.insertMany([
    { postId: sofiaPosts[0]._id, userId: marco._id, text: "This shot is absolutely unreal 🙌 The blue really pops. What time of day was this?" },
    { postId: sofiaPosts[0]._id, userId: yuki._id,  text: "I've been wanting to go to Santorini forever 😭 Did you feel safe traveling solo there?" },
    { postId: sofiaPosts[1]._id, userId: yuki._id,  text: "Ubud is on my list for next year! Which terrace is this — Tegallalang?" },
    { postId: marcoPosts[0]._id, userId: sofia._id, text: "The colors in this shot 🔥 You have such an eye for light, Marco." },
    { postId: marcoPosts[0]._id, userId: yuki._id,  text: "Japan in autumn is a dream. I went last November and cried twice lol." },
    { postId: marcoPosts[2]._id, userId: sofia._id, text: "I did this at sunset instead! The colors are crazy — pink, orange, red…" },
    { postId: marcoPosts[2]._id, userId: yuki._id,  text: "How early do you have to book the balloon rides? I heard they sell out months ahead" },
    { postId: yukiPosts[0]._id,  userId: marco._id, text: "A glass igloo!! I've always dreamed of this. Which lodge was it? Saving this post." },
    { postId: yukiPosts[0]._id,  userId: sofia._id, text: "Okay this officially moved to the top of my bucket list. The auroras are WILD 💚" },
    { postId: yukiPosts[2]._id,  userId: marco._id, text: '"Would go broke again" 😂 Honestly the most relatable travel caption I\'ve ever read' },
    { postId: yukiPosts[2]._id,  userId: sofia._id, text: "The water looks SO clear. Is it actually that blue or is this edited?" },
  ])
  console.log('   ✅  11 comments created')

  // ── Follows ────────────────────────────────────────────────────────────────
  console.log('👥  Creating follow relationships…')
  await Follow.insertMany([
    { followerId: marco._id, followingId: sofia._id },
    { followerId: yuki._id,  followingId: sofia._id },
    { followerId: sofia._id, followingId: marco._id },
    { followerId: yuki._id,  followingId: marco._id },
    { followerId: sofia._id, followingId: yuki._id  },
    { followerId: marco._id, followingId: yuki._id  },
  ])
  console.log('   ✅  6 follow relationships (everyone follows everyone)')

  // ── Notifications ──────────────────────────────────────────────────────────
  console.log('🔔  Creating notifications…')
  await Notification.insertMany([
    { userId: marco._id.toString(), targetUserId: sofia._id.toString(),
      postId: sofiaPosts[0]._id.toString(), type: 'like',
      message: 'marco.explores liked your post', isRead: false, createdAt: ago(5, 2) },
    { userId: yuki._id.toString(),  targetUserId: sofia._id.toString(),
      postId: sofiaPosts[0]._id.toString(), type: 'like',
      message: 'yuki.journey liked your post', isRead: true, createdAt: ago(5, 1) },
    { userId: marco._id.toString(), targetUserId: sofia._id.toString(),
      postId: sofiaPosts[0]._id.toString(), type: 'comment',
      message: 'marco.explores commented on your post',
      commentText: 'This shot is absolutely unreal 🙌 The blue really pops. What time of day was this?',
      isRead: false, createdAt: ago(5) },
    { userId: marco._id.toString(), targetUserId: sofia._id.toString(),
      type: 'follow', message: 'marco.explores started following you', isRead: true, createdAt: ago(6) },
    { userId: yuki._id.toString(),  targetUserId: sofia._id.toString(),
      type: 'follow', message: 'yuki.journey started following you', isRead: false, createdAt: ago(4) },
    { userId: sofia._id.toString(), targetUserId: marco._id.toString(),
      postId: marcoPosts[0]._id.toString(), type: 'like',
      message: 'sofia.wanders liked your post', isRead: false, createdAt: ago(3, 1) },
    { userId: sofia._id.toString(), targetUserId: marco._id.toString(),
      postId: marcoPosts[0]._id.toString(), type: 'comment',
      message: 'sofia.wanders commented on your post',
      commentText: 'The colors in this shot 🔥 You have such an eye for light, Marco.',
      isRead: false, createdAt: ago(3) },
    { userId: sofia._id.toString(), targetUserId: yuki._id.toString(),
      postId: yukiPosts[0]._id.toString(), type: 'like',
      message: 'sofia.wanders liked your post', isRead: false, createdAt: ago(2, 3) },
    { userId: marco._id.toString(), targetUserId: yuki._id.toString(),
      postId: yukiPosts[0]._id.toString(), type: 'comment',
      message: 'marco.explores commented on your post',
      commentText: "A glass igloo!! I've always dreamed of this. Which lodge was it? Saving this post.",
      isRead: false, createdAt: ago(2, 1) },
  ])
  console.log('   ✅  9 notifications created')

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  Demo data seeded successfully!

Demo accounts  (password for all: Demo1234!)
  sofia@wandr.demo    →  @sofia.wanders    (Barcelona)
  marco@wandr.demo    →  @marco.explores   (Rome)
  yuki@wandr.demo     →  @yuki.journey     (Tokyo)

Content seeded:
  • 9 posts  (real Unsplash travel photos)
  • 15 likes · 11 comments · 6 follows · 9 notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  await Promise.all([userConn.close(), contentConn.close(), notifConn.close()])
  process.exit(0)
}

seed().catch(err => {
  console.error('\n❌  Seeder failed:', err.message)
  process.exit(1)
})
