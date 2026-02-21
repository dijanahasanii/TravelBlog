import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EditProfile = () => {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("currentUserId");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bio: "",
    location: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5004/users/${currentUserId}`);
        setFormData({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          password: "",
          confirmPassword: "",
          bio: res.data.bio || "",
          location: res.data.location || "",
        });
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, [currentUserId]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      delete payload.confirmPassword;

      await axios.patch(`http://localhost:5004/users/${currentUserId}`, payload, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});


      alert("Profile updated successfully");
      navigate("/profile");
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update profile");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#fff1f2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#ffffff",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2 style={{ textAlign: "center", fontSize: "24px" }}>Edit Profile</h2>
        {[
          { name: "fullName", placeholder: "Full Name" },
          { name: "email", placeholder: "Email", type: "email" },
          { name: "phone", placeholder: "Phone" },
          { name: "password", placeholder: "New Password", type: "password" },
          { name: "confirmPassword", placeholder: "Confirm Password", type: "password" },
          { name: "bio", placeholder: "Bio" },
          { name: "location", placeholder: "Location" },
        ].map((field) => (
          <input
            key={field.name}
            name={field.name}
            type={field.type || "text"}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={handleChange}
            style={{
              padding: "12px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              outline: "none",
              width: "100%",
            }}
            required={["fullName", "email"].includes(field.name)}
          />
        ))}

        <button
          type="submit"
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            marginTop: "10px",
          }}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
