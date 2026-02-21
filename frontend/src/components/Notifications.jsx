import React, { useEffect, useState } from "react";
import { fetchNotifications } from "../api";

const Notifications = ({ token, currentUserId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchNotifications(token);
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="notifications">
      <h3>Notifications</h3>
      {notifications.map((n) => (
        <div key={n._id}>
          <p>
            <strong>{n.senderId?.fullName || "Someone"}</strong>{" "}
            {n.type === "like" ? "liked" : n.type === "comment" ? "commented on" : "followed"} your post
          </p>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
