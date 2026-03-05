import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { liveSessionApi } from "../api/courseApi";
import { FaRegClock, FaArrowLeft, FaPlay } from "react-icons/fa";

const LiveSessionPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("upcoming"); // upcoming | active | ended
  const [timeLeft, setTimeLeft] = useState("");

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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await liveSessionApi.getById(id);
        setSession(data);
      } catch (err) {
        console.error("Failed to fetch session:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const now = new Date();
      const start = normalizeDate(session.startTime);
      const end = normalizeDate(session.endTime);

      if (now < start) {
        setStatus("upcoming");
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      } else if (now >= start && now <= end) {
        setStatus("active");
      } else {
        setStatus("ended");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <h2 className="text-2xl font-bold">Session not found</h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 px-6 py-2 bg-indigo-600 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="h-16 bg-[#1e293b] flex items-center px-6 border-b border-white/5">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 mr-4 hover:bg-white/5 rounded-full transition"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-lg font-bold">{session.title}</h1>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">
          {status === "active" || status === "ended" ? (
            session.videoUrl?.startsWith("http") &&
            !session.videoUrl?.includes("/uploads/") ? (
              <iframe
                src={session.videoUrl}
                className="w-full h-full border-none"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={session.title}
              />
            ) : (
              <video
                src={session.videoUrl}
                className="w-full h-full outline-none"
                controls
                controlsList={status === "active" ? "nodownload" : ""}
                autoPlay={status === "active"}
                title={session.title}
                onSeeking={(e) => {
                  if (status !== "active") return;
                  const video = e.target;
                  const expectedTime =
                    (new Date() - normalizeDate(session.startTime)) / 1000;
                  if (Math.abs(video.currentTime - expectedTime) > 2) {
                    video.currentTime = expectedTime;
                  }
                }}
                onTimeUpdate={(e) => {
                  if (status !== "active") return;
                  const video = e.target;
                  const expectedTime =
                    (new Date() - normalizeDate(session.startTime)) / 1000;
                  // Prevent seeking forward beyond "live" point
                  if (video.currentTime > expectedTime + 1) {
                    video.currentTime = expectedTime;
                  }
                }}
                onLoadedMetadata={(e) => {
                  if (status !== "active") return;
                  const video = e.target;
                  video.playbackRate = 1.0; // Enforce normal speed
                  const expectedTime =
                    (new Date() - normalizeDate(session.startTime)) / 1000;
                  if (expectedTime > 0 && expectedTime < video.duration) {
                    video.currentTime = expectedTime;
                  }
                }}
                onRateChange={(e) => {
                  if (status !== "active") return;
                  const video = e.target;
                  if (video.playbackRate !== 1.0) {
                    video.playbackRate = 1.0;
                  }
                }}
              />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-slate-900 via-black to-slate-900">
              <div className="w-24 h-24 mb-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/20">
                <FaRegClock className="text-indigo-400" />
              </div>
              <h2 className="text-3xl font-black mb-2">
                Live Session Starts Soon
              </h2>
              <p className="text-indigo-400 font-mono text-4xl font-black tracking-tighter mt-4">
                {timeLeft}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black mb-4">About this Session</h2>
            <p className="text-white/60 leading-relaxed text-lg">
              {session.description ||
                "No description provided for this session."}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 h-fit">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-4">
              Session Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-white/30 mb-1">
                  Start Time
                </p>
                <p className="font-bold">{formatDateTime(session.startTime)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-white/30 mb-1">
                  Duration
                </p>
                <p className="font-bold">
                  {Math.round(
                    (normalizeDate(session.endTime) -
                      normalizeDate(session.startTime)) /
                      60000,
                  )}{" "}
                  minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveSessionPlayer;
