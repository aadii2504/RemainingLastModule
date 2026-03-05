import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { liveSessionApi } from "../api/courseApi";

const LiveSessionsPage = () => {
  const location = useLocation();
  const [liveSessions, setLiveSessions] = useState(
    location.state?.liveSessions || [],
  );
  const [loading, setLoading] = useState(!liveSessions.length);

  const normalizeDate = (isoString) => {
    if (!isoString) return new Date();
    const s = String(isoString);
    const normalized =
      s.includes("Z") ||
      s.includes("+") ||
      (s.includes("-") && s.indexOf("-", 5) > 0)
        ? s
        : s + "Z";
    return new Date(normalized);
  };

  const formatDateTime = (dateString) => {
    const d = normalizeDate(dateString);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (!liveSessions.length) {
      const fetchData = async () => {
        try {
          const data = await liveSessionApi.getAll();
          const now = new Date();
          const mapped = (data || []).map((s) => {
            const end = normalizeDate(s.endTime);
            return {
              ...s,
              isLive: now >= normalizeDate(s.startTime) && now <= end,
              isPassed: now > end,
              isUpcoming: now < normalizeDate(s.startTime),
            };
          });
          setLiveSessions(mapped);
        } catch (err) {
          console.error("Failed to fetch live sessions", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-white/40">Loading sessions...</div>
    );
  }

  if (!liveSessions.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-white">
        <h1 className="text-2xl font-bold mb-4 text-white/40">
          No live sessions scheduled
        </h1>
        <Link to="/dashboard" className="text-indigo-400 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 text-white">
      <h1 className="text-3xl font-black mb-1">Live Events</h1>
      <p className="text-white/40 mb-10">All scheduled and active sessions</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {liveSessions.map((session) => (
          <article
            key={session.id}
            className="rounded-2xl border border-white/10 overflow-hidden group hover:border-indigo-500/50 transition-all bg-white/5"
          >
            <div
              className="h-48 w-full bg-center bg-cover relative"
              style={{
                backgroundImage: `url('${session.thumbnailUrl || "/assets/placeholder.jpg"}')`,
              }}
              aria-label={session.title}
            >
              {session.isLive ? (
                <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black text-white bg-red-600 animate-pulse">
                  LIVE
                </span>
              ) : session.isUpcoming ? (
                <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black text-white bg-indigo-500">
                  UPCOMING
                </span>
              ) : (
                <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black text-white bg-slate-600">
                  ENDED
                </span>
              )}
            </div>
            <div className="p-5">
              <h4 className="text-base font-bold line-clamp-2 mb-1">
                {session.title}
              </h4>
              <p className="text-xs text-white/40 mb-4">
                Live Learning Session
              </p>

              <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black uppercase text-white/20">
                  Schedule
                </p>
                <p className="text-xs font-medium">
                  {formatDateTime(session.startTime)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="text-[10px] text-white/60">
                    {Math.round(
                      (new Date(session.endTime) -
                        new Date(session.startTime)) /
                        60000,
                    )}{" "}
                    mins
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!session.isPassed) {
                      try {
                        await liveSessionApi.join(session.id);
                      } catch (err) {
                        console.error("Could not register attendance", err);
                      }
                    }
                    window.location.href = `/session/${session.id}`;
                  }}
                  className={`flex-1 text-center rounded-xl px-3 py-3 text-[11px] font-black uppercase tracking-wider transition-all ${
                    !session.isPassed
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {session.isPassed
                    ? "View Recording"
                    : session.isLive
                      ? "Join Session"
                      : "Join Now"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default LiveSessionsPage;
