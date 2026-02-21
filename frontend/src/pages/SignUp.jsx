import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      await axios.post("http://localhost:5004/register", {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
      });

      setMessage("Sign up successful! Redirecting...");
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "300px", margin: "50px auto" }}>
      <h2>Sign Up</h2>
      <input type="text" name="fullName" placeholder="Full Name" autoComplete="off" onChange={handleChange} required />
      <input type="text" name="username" placeholder="Username" autoComplete="off" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" autoComplete="off" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" autoComplete="off" onChange={handleChange} required />
      <input type="password" name="confirmPassword" placeholder="Confirm Password" autoComplete="off" onChange={handleChange} required />
      <button type="submit">Register</button>
      {message && <p>{message}</p>}
    </form>
  );
}
