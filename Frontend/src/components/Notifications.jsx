import { useEffect, useState, useContext } from 'react';
import notificationService from '../services/notification';
import { AuthContext } from '../context/AuthContext';
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8080');

const normalizeNotification = (notification) => ({
  ...notification,
  _id: notification._id || notification.id
});

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  // load initial notifications
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await notificationService.listNotifications();
        setItems(res.data.notifications);
        window.dispatchEvent(new Event('notifications:changed'));
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [user]);

  // realtime socket
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    const addNotification = (data) => {
      const notification = normalizeNotification(data);
      setItems((prev) => {
        if (notification._id && prev.some((item) => item._id === notification._id)) return prev;
        return [notification, ...prev];
      });
    };

    socket.emit("join", user._id);

    socket.on("notification", addNotification);
    socket.on("new-notification", addNotification);

    socket.on("enrollment-cancelled", (data) => {
      addNotification({
          _id: data._id || data.id || `enrollment-${data.enrollmentId || Date.now()}`,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt || new Date(),
          read: false
      });
    });

    return () => {
      socket.off("notification", addNotification);
      socket.off("new-notification");
      socket.off("enrollment-cancelled");
      socket.disconnect();
    };
  }, [user]);

  const mark = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((s) =>
        s.map((x) => (x._id === id ? { ...x, read: true } : x))
      );
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h3>Notifications</h3>

      <ul className="list-group">
        {items.map((n) => (
          <li
            key={n._id}
            className={`list-group-item ${n.read ? "bg-light" : ""}`}
          >
            <div className="d-flex justify-content-between">
              <div>
                <strong>{n.title}</strong>
                <div className="small text-muted">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                <div>{n.message}</div>
              </div>

              <div>
                {!n.read && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => mark(n._id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
