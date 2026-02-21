export const locations = [
  "Paris, France",
  "New York, USA",
  "Kyoto, Japan",
  "Istanbul, Turkey",
  "Santorini, Greece",
  "Reykjavik, Iceland",
  "Marrakech, Morocco",
  "Cape Town, South Africa",
  "Banff, Canada",
  "Pristina, Kosovo",
  "Shtime, Kosova"
];

export const dummyUsers = [
  { _id: "u1", username: "alice", fullName: "Alice Smith", email: "alice@example.com" },
  { _id: "u2", username: "bob", fullName: "Bob Johnson", email: "bob@example.com" },
  { _id: "u3", username: "carol", fullName: "Carol Davis", email: "carol@example.com" },
  { _id: "u4", username: "dave", fullName: "Dave Williams", email: "dave@example.com" },
  { _id: "u5", username: "eve", fullName: "Eve Brown", email: "eve@example.com" },
  { _id: "u6", username: "frank", fullName: "Frank Wilson", email: "frank@example.com" },
  { _id: "u7", username: "grace", fullName: "Grace Taylor", email: "grace@example.com" },
  { _id: "u8", username: "heidi", fullName: "Heidi Martinez", email: "heidi@example.com" },
  { _id: "u9", username: "ivan", fullName: "Ivan Anderson", email: "ivan@example.com" },
  { _id: "u10", username: "judy", fullName: "Judy Thomas", email: "judy@example.com" },
];

// Helper for random int in range
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sampleCommentsTexts = [
  "Amazing shot!",
  "Love this place!",
  "Wish I was there!",
  "Great capture!",
  "So beautiful!",
  "This looks fantastic!",
  "What a view!",
  "Incredible scenery!",
  "Such a vibe!",
  "Can't wait to visit!",
];

function getRandomComments() {
  const commentsCount = getRandomInt(3, 6);
  const comments = [];
  for (let i = 0; i < commentsCount; i++) {
    const user = dummyUsers[getRandomInt(0, dummyUsers.length - 1)];
    const text = sampleCommentsTexts[getRandomInt(0, sampleCommentsTexts.length - 1)];
    const timestamp = new Date(Date.now() - getRandomInt(0, 48 * 60 * 60 * 1000)).toISOString();
    comments.push({ userId: user._id, text, timestamp });
  }
  return comments;
}

function getRandomLikes() {
  const likesCount = getRandomInt(25, 40);
  const shuffled = dummyUsers.map(u => u._id).sort(() => 0.5 - Math.random());
  return shuffled.slice(0, likesCount);
}

export const dummyPosts = [
  {
    _id: "d1",
    userId: "u1",
    image: "https://picsum.photos/id/1011/600/400",
    caption: "Sunset vibes",
    location: "Paris, France",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    _id: "d2",
    userId: "u2",
    image: "https://picsum.photos/id/1015/600/400",
    caption: "City lights",
    location: "New York, USA",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-02T11:00:00Z",
  },
  {
    _id: "d3",
    userId: "u3",
    image: "https://picsum.photos/id/1025/600/400",
    caption: "Temple adventures",
    location: "Kyoto, Japan",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-03T12:00:00Z",
  },
  {
    _id: "d4",
    userId: "u4",
    image: "https://picsum.photos/id/1035/600/400",
    caption: "Exploring history",
    location: "Istanbul, Turkey",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-04T13:00:00Z",
  },
  {
    _id: "d5",
    userId: "u5",
    image: "https://picsum.photos/id/1045/600/400",
    caption: "Blue domes and seas",
    location: "Santorini, Greece",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-05T14:00:00Z",
  },
  {
    _id: "d6",
    userId: "u6",
    image: "https://picsum.photos/id/1055/600/400",
    caption: "Snowy adventures",
    location: "Reykjavik, Iceland",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-06T15:00:00Z",
  },
  {
    _id: "d7",
    userId: "u7",
    image: "https://picsum.photos/id/1065/600/400",
    caption: "Spices and souks",
    location: "Marrakech, Morocco",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-07T16:00:00Z",
  },
  {
    _id: "d8",
    userId: "u8",
    image: "https://picsum.photos/id/1075/600/400",
    caption: "Mountain peaks",
    location: "Banff, Canada",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-08T17:00:00Z",
  },
  {
    _id: "d9",
    userId: "u9",
    image: "https://picsum.photos/id/1005/600/400",
    caption: "Hiking trails",
    location: "Cape Town, South Africa",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-09T18:00:00Z",
  },
  {
    _id: "d10",
    userId: "u10",
    image: "https://picsum.photos/id/1006/600/400",
    caption: "Hidden gems",
    location: "Pristina, Kosovo",
    likes: getRandomLikes(),
    comments: getRandomComments(),
    createdAt: "2024-01-10T19:00:00Z",
  },
];
