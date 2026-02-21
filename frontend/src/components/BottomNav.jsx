import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Feed", path: "/feed", icon: "🏠" },
  { label: "Post", path: "/post", icon: "➕" },
  { label: "Alerts", path: "/notifications", icon: "🔔" },
  { label: "Profile", path: "/profile", icon: "👤" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#fff",
        borderTop: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0",
        zIndex: 1000,
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            background: "none",
            border: "none",
            fontSize: 16,
            color: location.pathname === item.path ? "#0077cc" : "#555",
            fontWeight: location.pathname === item.path ? "bold" : "normal",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>{item.icon}</span>
          <span style={{ fontSize: 12 }}>{item.label}</span>
        </button>
      ))}

    </nav>
  );
};

export default BottomNav;
