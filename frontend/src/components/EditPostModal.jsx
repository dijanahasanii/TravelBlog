import React, { useEffect, useState } from "react";

const EditPostModal = ({ post, onClose, onSave, allLocations }) => {
  // State for caption (without location) and location separately
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    // Strip out the location part from caption if present (e.g. "My text 📍 Location")
    const baseCaption = post.caption?.split("📍")[0]?.trim() || "";
    setCaption(baseCaption);
    setLocation(post.location || "");
  }, [post]);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5002/posts/${post._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption: caption.trim(), location }),
      });
      const data = await res.json();
      if (res.ok) {
        // Support different backend response formats
        onSave(data.post || data);
      } else {
        alert("Failed to update post: " + data.message);
      }
    } catch (err) {
      console.error("Error updating post", err);
      alert("Error updating post.");
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Edit Post</h2>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          style={input}
          placeholder="Caption"
        />

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={input}
        >
          <option value="">📍 Select Location</option>
          {allLocations.map((loc, i) => (
            <option key={i} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <div style={{ marginTop: 20 }}>
          <button onClick={handleSave} style={btn}>
            Save
          </button>
          <button onClick={onClose} style={{ ...btn, backgroundColor: "#ccc" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  width: 400,
  maxWidth: "90%",
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
};

const input = {
  width: "100%",
  padding: 8,
  marginBottom: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  resize: "vertical",
};

const btn = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 6,
  backgroundColor: "#0077cc",
  color: "white",
  marginRight: 10,
  cursor: "pointer",
};

export default EditPostModal;
