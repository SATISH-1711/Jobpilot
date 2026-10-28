import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/client";

const POLL_MS = 15000; // ask the server for the unread count every 15 seconds

function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count/");
      setUnread(res.data.unread);
    } catch {
      // ignore: the next poll will try again
    }
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications/", { params: { page_size: 20 } });
      setItems(res.data.results);
    } catch {
      // keep whatever we already show
    } finally {
      setLoading(false);
    }
  };

  // Polling: check once now, then every 15 s while this tab is visible.
  useEffect(() => {
    fetchUnread();
    const timer = setInterval(() => {
      if (!document.hidden) fetchUnread();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchUnread]);

  // Close the dropdown when the user clicks outside it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      loadList();
      fetchUnread();
    }
  };

  const markRead = async (item) => {
    if (item.is_read) return;
    // Optimistic: update the screen first, tell the server after.
    setItems((list) => list.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
    setUnread((count) => Math.max(0, count - 1));
    try {
      await api.post(`/notifications/${item.id}/read/`);
    } catch {
      fetchUnread();
      loadList();
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all/");
      setItems((list) => list.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bell-wrap" ref={wrapperRef}>
      <button className="bell-btn" onClick={toggle} aria-label={`Notifications, ${unread} unread`}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="bell-panel">
          <div className="bell-header">
            <strong>Notifications</strong>
            <button className="link-btn plain" onClick={markAllRead} disabled={unread === 0}>
              Mark all read
            </button>
          </div>

          {loading && items.length === 0 && <p className="muted small bell-empty">Loading...</p>}
          {!loading && items.length === 0 && <p className="muted small bell-empty">No notifications yet.</p>}

          <ul className="bell-list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  className={`bell-item ${item.is_read ? "" : "unread"}`}
                  onClick={() => markRead(item)}
                >
                  <span>{item.message}</span>
                  <small className="muted">{timeAgo(item.created_at)}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}