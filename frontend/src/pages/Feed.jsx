import React, { useEffect, useState } from "react";
import { dummyUsers, dummyPosts, locations } from "./dummyData";
import EditPostModal from "../components/EditPostModal";

const Feed = () => {
  const currentUserId = localStorage.getItem("currentUserId");
  const token = localStorage.getItem("token");
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [commentsVisible, setCommentsVisible] = useState({});
  const [newComment, setNewComment] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const dummyWithDates = dummyPosts.slice(0, 10).map((p) => ({
      ...p,
      likes: p.likes || [],
      comments: p.comments || [],
    }));

    let realPosts = [];
    try {
      const res = await fetch("http://localhost:5002/posts");
      if (res.ok) {
        const data = await res.json();

        // Fetch real like and comment counts from Like/Comment collections
        realPosts = await Promise.all(
          data.map(async (p) => {
            const [likesRes, commentsRes] = await Promise.all([
              fetch(`http://localhost:5002/likes/${p._id}`).then(r => r.ok ? r.json() : []),
              fetch(`http://localhost:5002/comments/${p._id}`).then(r => r.ok ? r.json() : []),
            ]);
            return {
              ...p,
              createdAt: p.createdAt || new Date().toISOString(),
              likes: likesRes,
              comments: commentsRes,
            };
          })
        );
      }
    } catch (err) {
      console.error("Content service unavailable, showing dummy posts only", err);
    }

    const combined = [...realPosts, ...dummyWithDates];
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const safePosts = combined.filter((p) => p.userId);
      setPosts(safePosts);
      prefetchUsers(safePosts);

      // Mark posts already liked by current user
      const alreadyLiked = new Set(
        safePosts
          .filter((p) => Array.isArray(p.likes) && p.likes.some((l) => l.userId?.toString() === currentUserId || l === currentUserId))
          .map((p) => p._id)
      );
      setLikedPosts(alreadyLiked);
  };

  const [userCache, setUserCache] = useState({});

  const getUserById = (id) => {
    if (!id) return { username: "unknown" };
    if (userCache[id]) return userCache[id];
    return dummyUsers.find((u) => u._id === id) || { username: "unknown" };
  };

  const prefetchUsers = async (posts) => {
    // Collect post author IDs + all commenter IDs
    const authorIds = posts.map((p) => p.userId?.toString());
    const commenterIds = posts.flatMap((p) => p.comments.map((c) => c.userId?.toString()));
    const allIds = [...new Set([...authorIds, ...commenterIds].filter((id) => id && !dummyUsers.find((u) => u._id === id)))];

    const fetched = {};
    await Promise.all(
      allIds.map(async (id) => {
        try {
          const res = await fetch(`http://localhost:5004/users/${id}`);
          if (res.ok) fetched[id] = await res.json();
        } catch (_) {}
      })
    );
    if (Object.keys(fetched).length > 0) setUserCache((prev) => ({ ...prev, ...fetched }));
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const handleLikeToggle = async (postId) => {
    // Dummy posts have short IDs like "d1", "d2" — only toggle locally
    const isDummy = postId.length < 10;
    if (isDummy) {
      setLikedPosts((prev) => {
        const updated = new Set(prev);
        updated.has(postId) ? updated.delete(postId) : updated.add(postId);
        return updated;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likes: likedPosts.has(postId)
                  ? p.likes.filter((id) => id !== currentUserId)
                  : [...p.likes, currentUserId],
              }
            : p
        )
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:5002/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      const liked = data.liked;
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likes: liked
                  ? [...p.likes, currentUserId]
                  : p.likes.filter((id) => id !== currentUserId),
              }
            : p
        )
      );
      setLikedPosts((prev) => {
        const updated = new Set(prev);
        liked ? updated.add(postId) : updated.delete(postId);
        return updated;
      });
    } catch (err) {
      console.error("Like error", err);
    }
  };

  const toggleComments = (postId) => {
    setCommentsVisible((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = async (postId) => {
    const text = newComment[postId]?.trim();
    if (!text) return;
    try {
      const res = await fetch("http://localhost:5002/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, text }),
      });
      const data = await res.json();
      const entry = data.comment || { userId: currentUserId, text, createdAt: new Date().toISOString() };
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: [...p.comments, entry] } : p
        )
      );
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Comment error", err);
    }
  };

  const handleDelete = async (postId) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`http://localhost:5002/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      } else {
        alert("Failed to delete post.");
      }
    } catch (err) {
      console.error("Delete error", err);
      alert("Error deleting post.");
    }
  };

  // Compose all locations from dummyData.js locations + dummyPosts + real posts
  const dummyPostLocations = dummyPosts
    .map((p) => p.location?.trim().toLowerCase())
    .filter(Boolean);

  const realLocations = posts
    .map((p) => p.location?.trim().toLowerCase())
    .filter(Boolean);

  const masterLocations = locations.map((loc) => loc.trim().toLowerCase());

  const uniqueLocationsSet = new Set([
    ...masterLocations,
    ...dummyPostLocations,
    ...realLocations,
  ]);

  const allLocations = Array.from(uniqueLocationsSet).map(
    (loc) => loc.charAt(0).toUpperCase() + loc.slice(1)
  );

  // Filter posts by location filter (case-insensitive substring match)
  const filteredPosts = posts.filter((post) =>
    locationFilter.trim() === ""
      ? true
      : post.location?.toLowerCase().includes(locationFilter.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 700, margin: "30px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>🌍 Travel Feed</h1>

      {/* Location search input */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by location..."
          list="locations-list"
          value={locationFilter}
          autoComplete="off"
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />
        <datalist id="locations-list">
          {allLocations.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
      </div>

      {filteredPosts.length === 0 ? (
        <p>No posts found for this location.</p>
      ) : (
        filteredPosts.map((post) => {
          const user = getUserById(post.userId);
          // Log each post user info for debugging
          console.log("Post by:", post.userId, "Resolved username:", user?.username);
          const isOwner = post.userId === currentUserId;
          const isLiked = likedPosts.has(post._id);

          return (
            <div
              key={post._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 15,
                marginBottom: 30,
                backgroundColor: "white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", marginBottom: 10 }}
              >
                <img
                  src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${
                    user?.username || "user"
                  }`}
                  alt="avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/40?text=U";
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    marginRight: 10,
                  }}
                />
                <div>
                  <strong>@{isOwner ? "you" : user?.username}</strong>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {formatTimeAgo(post.createdAt)}
                  </div>
                </div>
              </div>

              <img
                src={post.image}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/400x300?text=Image+not+found";
                }}
                style={{ width: "100%", borderRadius: 10, marginBottom: 10 }}
                alt="Post"
              />

              {/* Show caption */}
              <p style={{ fontSize: 15 }}>
                {post.caption?.split("📍")[0]?.trim()}
              </p>
              {/* Show location separately */}
              <p style={{ fontSize: 13, fontWeight: "bold", color: "#555" }}>
                📍 {post.location || "Unknown location"}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <button
                  onClick={() => handleLikeToggle(post._id)}
                  style={{
                    backgroundColor: isLiked ? "#e0245e" : "#eee",
                    color: isLiked ? "white" : "#333",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  {isLiked ? "♥ Liked" : "♡ Like"} ({post.likes.length})
                </button>
                <span
                  onClick={() => toggleComments(post._id)}
                  style={{ color: "#0077cc", fontSize: 14, cursor: "pointer" }}
                >
                  {commentsVisible[post._id] ? "Hide" : "View"}{" "}
                  {post.comments.length} comment
                  {post.comments.length !== 1 ? "s" : ""}
                </span>

                {isOwner && (
                  <>
                    <button
                      onClick={() => setEditingPost(post)}
                      style={{
                        padding: "5px 10px",
                        background: "#f0ad4e",
                        border: "none",
                        color: "white",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      style={{
                        padding: "5px 10px",
                        background: "#d9534f",
                        border: "none",
                        color: "white",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {commentsVisible[post._id] && (
                <div style={{ marginBottom: 10 }}>
                  {post.comments.map((c, i) => {
                    const commenter = getUserById(c.userId?.toString());
                    const isOwnComment = c.userId?.toString() === currentUserId;
                    const commenterName = isOwnComment
                      ? (localStorage.getItem("username") || "you")
                      : (commenter?.username || "...");
                    return (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <strong>@{commenterName}</strong>
                        : {c.text}
                        <span
                          style={{
                            fontSize: 12,
                            color: "#777",
                            marginLeft: 6,
                          }}
                        >
                          {formatTimeAgo(c.createdAt || c.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "flex", marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment[post._id] || ""}
                  onChange={(e) =>
                    setNewComment({ ...newComment, [post._id]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddComment(post._id);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={() => handleAddComment(post._id)}
                  disabled={!newComment[post._id]?.trim()}
                  style={{
                    marginLeft: 8,
                    backgroundColor: "#0077cc",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 12px",
                    cursor: newComment[post._id]?.trim()
                      ? "pointer"
                      : "not-allowed",
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          );
        })
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          allLocations={allLocations}
          onSave={(updatedPost) => {
            setPosts((prev) =>
              prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
            );
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
};

export default Feed;
