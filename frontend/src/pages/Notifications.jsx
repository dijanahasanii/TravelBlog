import React, { useEffect, useState } from "react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = localStorage.getItem("currentUserId");

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUserId) return;
      try {
        const res = await fetch(`http://localhost:5006/notifications/${currentUserId}`);
        if (res.ok) {
          const data = await res.json();

          // Resolve actor usernames from user-service
          const enriched = await Promise.all(
            data.map(async (n) => {
              try {
                const userRes = await fetch(`http://localhost:5004/users/${n.userId}`);
                if (userRes.ok) {
                  const user = await userRes.json();
                  const action = n.type === "like" ? "liked your post" : "commented on your post";
                  return { ...n, message: `@${user.username} ${action}` };
                }
              } catch (_) {}
              return n;
            })
          );

          setNotifications(enriched);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUserId]);

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getIcon = (type) => {
    if (type === "like") return "♥";
    if (type === "comment") return "💬";
    return "🔔";
  };

  return (
    <div style={{ maxWidth: 600, margin: "30px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>🔔 Notifications</h2>

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888" }}>No notifications yet.</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            style={{
              backgroundColor: "white",
              border: "1px solid #eee",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22 }}>{getIcon(n.type)}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14 }}>{n.message}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#aaa", marginTop: 4 }}>
                {formatTimeAgo(n.createdAt)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;
