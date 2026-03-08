import { HiOutlineBell } from "react-icons/hi";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { notificationApi } from "../api/notificationApi";

export const Navbar = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("learnsphere_user") || "null");
    } catch {
      return null;
    }
  });

  const [unreadCount, setUnreadCount] = useState(0);

  const pollerRef = useRef(null);
  const inFlightStampRef = useRef(0);
  const mountedRef = useRef(false);

  // --- fetch unread count (safe against stale responses) ---
  const fetchUnread = useCallback(async () => {
    if (!user || user.role === "admin") {
      setUnreadCount(0);
      return;
    }

    const stamp = Date.now();
    inFlightStampRef.current = stamp;

    try {
      const data = await notificationApi.list(20);
      // API already returns ONLY unread items
      const count = Array.isArray(data) ? data.length : 0;

      if (!mountedRef.current || inFlightStampRef.current !== stamp) return;

      setUnreadCount(count);
    } catch {}
  }, [user]);

  const startPolling = useCallback(() => {
    if (pollerRef.current) clearInterval(pollerRef.current);

    // ⏱️ Poll every 20 seconds (1s was excessive)
    pollerRef.current = setInterval(fetchUnread, 1000);
  }, [fetchUnread]);

  const stopPolling = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  }, []);

  // ----- mounted/unmounted guard -----
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ----- Sync user with localStorage -----
  useEffect(() => {
    const handle = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("learnsphere_user") || "null"));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("userUpdated", handle);
    window.addEventListener("storage", handle);
    return () => {
      window.removeEventListener("userUpdated", handle);
      window.removeEventListener("storage", handle);
    };
  }, []);

  // ----- Start/Stop polling when user changes -----
  useEffect(() => {
    if (user && user.role !== "admin") {
      fetchUnread();
      startPolling();
    } else {
      stopPolling();
      setUnreadCount(0);
    }

    return () => stopPolling();
  }, [user, fetchUnread, startPolling, stopPolling]);

  // ----- Refresh when window focused or tab active -----
  useEffect(() => {
    const onFocus = () => fetchUnread();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchUnread();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchUnread]);

  // ----- Instant update when event happens -----
  useEffect(() => {
    const onNotificationsUpdated = (e) => {
      if (e && e.detail && typeof e.detail.unreadCount === "number") {
        setUnreadCount(e.detail.unreadCount);
      } else {
        fetchUnread();
      }
    };

    const onNotificationNew = () => fetchUnread();

    window.addEventListener("notificationsUpdated", onNotificationsUpdated);
    window.addEventListener("notification:new", onNotificationNew);

    return () => {
      window.removeEventListener("notificationsUpdated", onNotificationsUpdated);
      window.removeEventListener("notification:new", onNotificationNew);
    };
  }, [fetchUnread]);

  // ---------------- Navigation ----------------
  const handleLogoClick = () => {
    if (!user) {
      navigate("/");
      return;
    }
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer focus:outline-none"
          onClick={handleLogoClick}
          aria-label="Go to home"
        >
          <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-[0_0_24px_rgba(66,127,255,0.6)]" />
          <span className="font-bold tracking-tight">
            Learn
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              {" "}
              Sphere
            </span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role !== "admin" && (
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-slate-100"
                  title="Notifications"
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                >
                  <HiOutlineBell size={22} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] leading-[18px] text-center font-bold"
                      aria-live="polite"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              <Link
                to={user.role === "admin" ? "/admin" : "/profile"}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg font-semibold text-white text-sm sm:text-base bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 transition"
                title="Profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10 12a5 5 0 100-10 5 5 0 000 10zm-7 7a7 7 0 0114 0H3z" />
                </svg>
                <span className="hidden sm:inline">{user.name || "Profile"}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm text-white bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 transition"
              >
                Sign up
              </Link>
              <Link
                to="/login"
                className="px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm border border-white/20 text-white hover:bg-white/10 transition"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
