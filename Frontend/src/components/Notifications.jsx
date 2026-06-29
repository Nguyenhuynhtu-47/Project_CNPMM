import { useEffect, useState, useContext } from 'react';
import notificationService from '../services/notification';
import { AuthContext } from '../context/AuthContext';
import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

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
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [user]);

  // realtime socket
  useEffect(() => {
    if (!user) return;

    socket.emit("join", user._id);

    socket.on("new-notification", (data) => {
      setItems((prev) => [data, ...prev]);
    });

    socket.on("enrollment-cancelled", (data) => {
      setItems((prev) => [
        {
          _id: Date.now(),
          title: data.title,
          message: data.message,
          createdAt: new Date(),
          read: false
        },
        ...prev
      ]);
    });

    return () => {
      socket.off("new-notification");
      socket.off("enrollment-cancelled");
    };
  }, [user]);

  const mark = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((s) =>
        s.map((x) => (x._id === id ? { ...x, read: true } : x))
      );
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