import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignIn() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5004/login", formData);
      const { user, token } = response.data;

      if (!token) {
        setMessage("Token is missing in response.");
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("currentUserId", user._id);
      localStorage.setItem("username", user.username);
      localStorage.setItem("token", token);

      navigate("/feed");
    } catch (err) {
      setMessage(err.response?.data?.error || "Error connecting to server");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "300px", margin: "50px auto" }}>
      <h2>Sign In</h2>
      <input
        type="text"
        name="username"
        placeholder="Username"
        autoComplete="off"
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        required
      />
      <button type="submit">Login</button>
      {message && <p style={{ color: "red" }}>{message}</p>}
    </form>
  );
}
