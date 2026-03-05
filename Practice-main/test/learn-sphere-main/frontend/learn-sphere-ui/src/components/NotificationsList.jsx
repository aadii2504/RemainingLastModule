import React, { useEffect, useRef, useState } from "react";
import NotificationModal from "./NotificationModal";
import { notificationApi } from "../api/notificationApi";

export default function NotificationsList() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Prevent poll race conditions after updates
  const requestTokenRef = useRef(0);

  const dispatchUnread = (list) => {
    const unreadCount = list.filter((x) => !x.isRead).length;
    window.dispatchEvent(
      new CustomEvent("notificationsUpdated", { detail: { unreadCount } })
    );
  };

  const load = async () => {
    const token = ++requestTokenRef.current;
    try {
      const data = await notificationApi.list(20);
      if (token !== requestTokenRef.current) return; // ignore stale
      setItems(data);
      dispatchUnread(data);
    } finally {
      if (token === requestTokenRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const markOneRead = async (item) => {
    if (item.isRead) return;

    // 1) Optimistic UI
    setItems((prev) => {
      const next = prev.map((x) =>
        x.id === item.id ? { ...x, isRead: true } : x
      );
      dispatchUnread(next);
      return next;
    });

    try {
      // 2) Persist on server
      await notificationApi.markRead(item.id);
      // 3) Align with server so refresh/login stays correct
      await load();
    } catch {
      // Optional: show toast or revert
    }
  };

  const handleOpen = (item) => {
    setActive(item);
    setOpen(true);
    // Mark this specific notification as read when opened
    markOneRead(item);
  };

  const markAllRead = async () => {
    // Optimistic UI
    setItems((prev) => {
      const next = prev.map((x) => ({ ...x, isRead: true }));
      dispatchUnread(next);
      return next;
    });

    try {
      await notificationApi.markAllRead();
      await load();
    } catch {
      // Optional: show toast
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Notifications &amp; Announcements</h1>
        <button
          onClick={markAllRead}
          className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"
        >
          Mark all read
        </button>
      </div>

      {loading ? (
        <p className="text-white/60">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-white/60">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleOpen(item)}
              className={`w-full text-left p-4 rounded-lg border transition
                ${
                  item.isRead
                    ? "bg-white/5 border-white/10"
                    : "bg-indigo-900/20 border-indigo-500/40"
                }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-600/20 text-slate-300 border border-slate-400/40">
                  {(item.type || "NOTIFICATION").toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">{item.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}

      <NotificationModal open={open} data={active} onClose={() => setOpen(false)} />
    </div>
  );
}