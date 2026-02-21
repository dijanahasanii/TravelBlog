import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function fetchPost() {
      const res = await fetch(`http://localhost:5001/api/posts/${id}`);
      const data = await res.json();
      setPost(data);
    }

    fetchPost();
  }, [id]);

  async function handleCommentSubmit(e) {
    e.preventDefault();
    const authorId = localStorage.getItem("userId");
    if (!authorId) return alert("You must be logged in");

    await fetch("http://localhost:5001/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: id,
        authorId,
        content: comment,
      }),
    });

    setComment("");
    window.location.reload();
  }

  if (!post) return <p>Loading post...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Post by {post.user?.username}</h2>
      <img src={post.image} alt={post.caption} style={{ width: "100%" }} />
      <p>{post.caption}</p>
      <p><small>{new Date(post.createdAt).toLocaleString()}</small></p>

      <h3>Comments</h3>
      {post.comments?.length === 0 && <p>No comments yet.</p>}
      {post.comments?.map((c, i) => (
        <div key={i} style={{ borderTop: "1px solid #ccc", paddingTop: "0.5rem" }}>
          <strong>{c.authorId}:</strong> {c.content}
        </div>
      ))}

      <form onSubmit={handleCommentSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          required
        />
        <button type="submit">Post</button>
      </form>
    </div>
  );
}
