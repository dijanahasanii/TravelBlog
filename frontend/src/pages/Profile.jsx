import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EditPostModal from "../components/EditPostModal";
import { dummyUsers, locations } from "./dummyData";

const Profile = () => {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("currentUserId");
  const token = localStorage.getItem("token");

  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [commentsVisible, setCommentsVisible] = useState({});
  const [newComment, setNewComment] = useState({});
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5004/users/${currentUserId}`);
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await axios.get(`http://localhost:5002/posts/user/${currentUserId}`);
        const postsData = res.data;

        // Fetch real like and comment counts, then resolve commenter usernames
        const enriched = await Promise.all(
          postsData.map(async (p) => {
            const [likesRes, commentsRes] = await Promise.all([
              fetch(`http://localhost:5002/likes/${p._id}`).then(r => r.ok ? r.json() : []),
              fetch(`http://localhost:5002/comments/${p._id}`).then(r => r.ok ? r.json() : []),
            ]);

            // Resolve username for each commenter
            const commentsWithNames = await Promise.all(
              commentsRes.map(async (c) => {
                if (c.userId?.toString() === currentUserId) return { ...c, username: localStorage.getItem("username") };
                try {
                  const userRes = await fetch(`http://localhost:5004/users/${c.userId}`);
                  if (userRes.ok) {
                    const u = await userRes.json();
                    return { ...c, username: u.username };
                  }
                } catch (_) {}
                return c;
              })
            );

            return { ...p, likes: likesRes, comments: commentsWithNames };
          })
        );

        setPosts(enriched);
      } catch (err) {
        console.error("Failed to fetch posts", err);
      }
    };

    fetchUser();
    fetchPosts();
  }, [currentUserId]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "postsUpdatedAt") {
        const fetchPosts = async () => {
          try {
            const res = await axios.get(`http://localhost:5002/posts/user/${currentUserId}`);
            setPosts(res.data.map((p) => ({
              ...p,
              likes: p.likes || [],
              comments: p.comments || [],
            })));
          } catch (err) {
            console.error("Failed to fetch posts", err);
          }
        };
        fetchPosts();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [currentUserId]);

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

  const getUserById = (id) => {
    const mockUsers = JSON.parse(localStorage.getItem("mockUsers") || "[]");
    const user =
      mockUsers.find((u) => u._id === id) ||
      dummyUsers.find((u) => u._id === id);
    return user || { username: id || "unknown" };
  };

  const handleLikeToggle = async (postId) => {
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
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`http://localhost:5002/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        localStorage.setItem("postsUpdatedAt", Date.now().toString());
      } else {
        alert("Failed to delete post.");
      }
    } catch (err) {
      console.error("Delete error", err);
      alert("Error deleting post.");
    }
  };

  const allLocations = locations;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "30px auto",
        padding: "20px",
        paddingBottom: 100,
        backgroundColor: "#ffeef0",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <h2 style={{ fontSize: "28px", textAlign: "center", marginBottom: 25 }}>
        👤 Profile
      </h2>

      <div
        style={{
          backgroundColor: "#fff",
          padding: 25,
          borderRadius: 10,
          boxShadow: "0 0 10px rgba(0,0,0,0.05)",
          marginBottom: 30,
        }}
      >
        <p>
          <strong>Username:</strong> @{user.username || localStorage.getItem("username")}
        </p>
        <p>
          <strong>Full Name:</strong> {user.fullName}
        </p>
        {user.bio && (
          <p>
            <strong>Bio:</strong> {user.bio}
          </p>
        )}
        <p>
          <strong>Location:</strong> {user.location || "Not specified"}
        </p>

        <button
          onClick={() => navigate("/edit-profile")}
          style={{
            marginTop: "20px",
            padding: "12px 0",
            backgroundColor: "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            width: "100%",
            fontSize: 16,
          }}
        >
          ✏️ Edit Profile
        </button>
      </div>

      <h3 style={{ marginBottom: 20 }}>📝 Your Posts</h3>

      {posts.length === 0 ? (
        <p>You haven't posted anything yet.</p>
      ) : (
        posts.map((post) => {
          const isLiked = likedPosts.has(post._id);
          const captionText = post.caption?.split("📍")[0]?.trim();

          return (
            <div
              key={post._id}
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                marginBottom: "20px",
                borderRadius: "10px",
                boxShadow: "0 0 10px rgba(0,0,0,0.05)",
              }}
            >
              <img
                src={post.image}
                alt="Post"
                style={{ width: "100%", borderRadius: "8px" }}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/500x300?text=Image+Unavailable";
                }}
              />
              <p>
                <strong>Caption:</strong> {captionText}
              </p>
              {post.location && (
                <p>
                  <strong>Location:</strong> {post.location}
                </p>
              )}
              <p style={{ fontSize: "13px", color: "#888" }}>
                {formatTimeAgo(post.createdAt)}
              </p>

              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => handleLikeToggle(post._id)}
                  style={{
                    backgroundColor: isLiked ? "#e0245e" : "#eee",
                    color: isLiked ? "white" : "#333",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                    marginRight: 10,
                  }}
                >
                  {isLiked ? "♥ Liked" : "♡ Like"} ({post.likes.length})
                </button>

                <span
                  onClick={() => toggleComments(post._id)}
                  style={{ color: "#0077cc", fontSize: 14, cursor: "pointer" }}
                >
                  {commentsVisible[post._id] ? "Hide" : "View"} {post.comments.length} comment
                  {post.comments.length !== 1 ? "s" : ""}
                </span>

                <button
                  onClick={() => setEditingPost(post)}
                  style={{
                    marginLeft: 10,
                    background: "#f0ad4e",
                    border: "none",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(post._id)}
                  style={{
                    marginLeft: 10,
                    background: "#d9534f",
                    border: "none",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>

              {commentsVisible[post._id] && (
                <div style={{ marginTop: 10 }}>
                  {post.comments.map((c, i) => {
                    const isOwnComment = c.userId?.toString() === currentUserId;
                    const commenterName = isOwnComment
                      ? (localStorage.getItem("username") || "you")
                      : (c.username || "...");
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

      {/* Logout Button at the bottom */}
      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("currentUserId");
          navigate("/");
        }}
        style={{
          marginTop: 40,
          padding: "12px 0",
          backgroundColor: "#d9534f",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: "bold",
          width: "100%",
          fontSize: 16,
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
};

export default Profile;
