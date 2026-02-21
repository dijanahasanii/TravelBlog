import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { locations } from "./dummyData";
import "./Post.css";

const Post = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const token = localStorage.getItem("token");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 600;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", 0.6);
      setImageFile(compressed);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !caption || !location) {
      alert("All fields are required.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5002/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: imageFile, caption, location }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Post created:", data);
        navigate("/feed");
      } else {
        const err = await res.json();
        alert("Failed to post: " + err.message);
      }
    } catch (err) {
      console.error("❌ Error posting:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="post-container">
      <div className="post-box">
        <h2>Create a New Post</h2>
        <form onSubmit={handleSubmit} className="post-form">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <input
            type="text"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Select a location</option>
            {locations.map((loc, idx) => (
              <option key={idx} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <button type="submit">Post</button>
        </form>
      </div>
    </div>
  );
};

export default Post;
