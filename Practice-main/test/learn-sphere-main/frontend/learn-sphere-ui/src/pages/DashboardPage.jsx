import React, {
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useSyncExternalStore,
} from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import {
  enrollCourse,
  subscribe,
  getSnapshot,
} from "../components/EnrollmentStore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { courseApi, liveSessionApi } from "../api/courseApi";

export const DashboardPage = () => {
  const location = useLocation();

  let name = location.state?.name ?? "Student";
  try {
    const user = JSON.parse(localStorage.getItem("learnsphere_user") ?? "null");
    if (user?.name) name = user.name;
  } catch { }

  const sidebarShellRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useLayoutEffect(() => {
    const shell = sidebarShellRef.current;
    if (!shell) return;

    const target = shell.firstElementChild || shell;

    const measure = () => {
      const rect = target.getBoundingClientRect();
      setSidebarWidth(Math.max(0, Math.round(rect.width)));
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(target);

    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const [courses, setCourses] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const enrolled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [courseData, liveData] = await Promise.all([
          courseApi.getAll(),
          liveSessionApi.getAll().catch(() => []),
        ]);
        setCourses(courseData || []);

        const normalizeDate = (isoString) => {
          if (!isoString) return new Date();
          const normalized =
            isoString.includes("Z") || isoString.includes("+")
              ? isoString
              : isoString + "Z";
          return new Date(normalized);
        };

        // Transform backend dates and set isLive based on current time
        const now = new Date();
        const mappedSessions = (liveData || []).map((s) => {
          const start = normalizeDate(s.startTime);
          const end = normalizeDate(s.endTime);
          return {
            ...s,
            isLive: now >= start && now <= end,
            isUpcoming: now < start,
            isEnded: now > end,
          };
        });
        setLiveSessions(mappedSessions);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };
    loadData();
  }, []);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("newest");

  const handleContinue = async (course) => {
    try {
      await enrollCourse({
        id: course.id,
        title: course.title,
        level: course.level || "N/A",
        lessons: course.lessons || 0,
        thumbnail: course.thumbnail || "/assets/placeholder.jpg",
      });

      toast.success("Successfully Enrolled", {
        position: "top-right",
        autoClose: 2500,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        theme: "light",
      });
    } catch (err) {
      toast.error(err?.message || "Failed to enroll", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
      });
    }
  };

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

  const formatDateTime = (iso) => {
    try {
      const d = normalizeDate(iso);
      return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const filteredLive = useMemo(() => {
    const list = liveSessions.filter((s) =>
      s.title.toLowerCase().includes(query.toLowerCase()),
    );
    return sortKey === "az"
      ? [...list].sort((a, b) => a.title.localeCompare(b.title))
      : [...list].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [query, sortKey, liveSessions]);

  const filteredCourses = useMemo(() => {
    const list = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.level.toLowerCase().includes(query.toLowerCase()),
    );
    return sortKey === "az"
      ? [...list].sort((a, b) => a.title.localeCompare(b.title))
      : list;
  }, [query, sortKey, courses]);

  return (
    <div
      className="flex min-h-dvh"
      style={{ ["--sidebar-current-width"]: `${sidebarWidth}px` }}
    >
      <aside
        className="flex-shrink-0"
        style={{
          width: "var(--sidebar-current-width)",
          transition: "width 50ms ease",
        }}
      >
        <div ref={sidebarShellRef}>
          <Sidebar />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <ToastContainer position="top-right" autoClose={2500} theme="light" />

        <section
          className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8"
          style={{ color: "var(--text)" }}
        >
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Welcome, {name}!
              </h2>
              <p className="mt-1 text-sm opacity-70">
                Continue learning and explore new courses.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs sm:text-sm opacity-80" htmlFor="sort">
                Sort:
              </label>
              <select
                id="sort"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs sm:text-sm transition"
              >
                <option value="newest">Newest</option>
                <option value="az">A–Z</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 focus:bg-white/10 px-3 sm:px-4 py-2 text-sm transition"
              aria-label="Search"
            />
          </div>

          {/* Live Sessions */}
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                Live Sessions
              </h3>
              <Link
                to="/live-sessions"
                state={{ liveSessions }}
                className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLive.map((s) => (
                <article
                  key={s.id}
                  className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 overflow-hidden group transition"
                >
                  <div
                    className="h-36 sm:h-40 w-full bg-center bg-cover relative"
                    style={{
                      backgroundImage: `url('${s.thumbnailUrl || "/assets/placeholder.jpg"}')`,
                    }}
                    aria-label={s.title}
                  >
                    {s.isLive ? (
                      <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white bg-red-600 animate-pulse">
                        ● LIVE
                      </span>
                    ) : s.isUpcoming ? (
                      <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white bg-indigo-500">
                        UPCOMING
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white bg-slate-600">
                        ENDED
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-blue-400 transition">
                      {s.title}
                    </h4>
                    <p className="mt-1 text-xs opacity-70 mb-2">Live Session</p>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!s.isEnded && !s.isUpcoming) {
                            try {
                              await liveSessionApi.join(s.id);
                            } catch (err) {
                              console.error("Attendance fail:", err);
                            }
                          }
                          window.location.href = `/session/${s.id}`;
                        }}
                        className={`rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white transition-all ${s.isEnded
                            ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white/60"
                            : "bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 shadow-md"
                          }`}
                      >
                        {s.isEnded
                          ? "View Recording"
                          : s.isLive
                            ? "Join now"
                            : "Join Session"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Explore Courses */}
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                Explore Courses
              </h3>
              <Link
                to="/courses"
                state={{ courses }}
                className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map((c) => (
                <Link
                  key={c.id}
                  to={`/course/${c.slug}`}
                  state={{ courses }}
                  className="block group h-full"
                >
                  <article className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 overflow-hidden transition h-full flex flex-col">
                    <div
                      className="h-36 sm:h-40 w-full bg-center bg-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url('${c.thumbnail}')` }}
                      aria-label={c.title}
                    />
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-blue-400 transition">
                          {c.title}
                        </h4>
                        <p className="mt-1 text-xs opacity-70 italic">
                          {c.level}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest group-hover:text-white transition">
                          View Details →
                        </span>
                        {enrolled.some((ec) => ec.id == c.id) && (
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black border uppercase tracking-tighter ${enrolled.find((ec) => ec.id == c.id)?.status === "Completed"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            }`}>
                            {enrolled.find((ec) => ec.id == c.id)?.status === "Completed" ? "Completed" : "Enrolled"}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
export default DashboardPage;
