import React, { useState } from "react";
import { NavLink } from "react-router-dom";

/**
 * Hover-expand Sidebar (space expands via React hover state)
 * - Fixed on the left; width transitions between w-16 and w-64 while hovered.
 * - Labels/chevrons/submenu reveal only when expanded (hovered).
 * - Uses app theme tokens: bg-[var(--card)], text-[var(--text)], border-[var(--border)].
 */

export default function Sidebar({ enrolledCount = 0 }) {
  // Expanded while hovering
  const [expanded, setExpanded] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(true);

  // Styles (theme-frienwq
  // dly)
  const linkBase =
    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const linkActive = "bg-white/10 text-[var(--text)]";
  const linkInactive = "text-[var(--text)] hover:bg-white/5";
  const navClass = ({ isActive }) =>
    `${linkBase} ${isActive ? linkActive : linkInactive}`;

  // Icons — fixed sizes keep alignment professional
  const Icon = ({ path, className = "h-5 w-5 shrink-0" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );

  const ICONS = {
    courses: "M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z",
    quizzes: "M12 2l3 6h6l-5 4 2 6-6-3-6 3 2-6L3 8h6l3-6z",
    assignments:
      "M6 2h8a2 2 0 012 2v16l-4-2-4 2V4a2 2 0 012-2zM8 6h6v2H8zM8 10h8v2H8z",
    community:
      "M12 12a5 5 0 100-10 5 5 0 000 10zM2 20c0-3.3 4.5-5 10-5s10 1.7 10 5v1H2v-1z",
    chevronRight: "M8 5v14l11-7L8 5z",
  };

  const EXPANDED_W = "w-64"; // 256px space
  const COLLAPSED_W = "w-16"; // compact bar

  // Label shows only when expanded (hovered)
  const Label = ({ children }) => (
    <span
      className={[
        "truncate transition-all duration-200",
        expanded
          ? "opacity-100 translate-x-0 inline"
          : "opacity-0 -translate-x-1 hidden",
      ].join(" ")}
    >
      {children}
    </span>
  );

  // Small badge for counts
  const CountBadge = ({ count }) => {
    if (!Number.isFinite(count) || count <= 0) return null;
    return (
      <span
        className={[
          "ml-auto inline-flex items-center justify-center",
          "text-[0.7rem] font-semibold rounded-full",
          "bg-blue-600/80 text-white",
          // keep visible in both states; shift a bit when collapsed
          expanded ? "px-2 h-5 min-w-[1.25rem]" : "px-1.5 h-5 min-w-[1.25rem]",
        ].join(" ")}
        aria-label={`${count} enrolled courses`}
      >
        {count}
      </span>
    );
  };

  return (
    <>
      <div
        className={[
          "hidden md:block",
          "fixed left-0 top-0 h-screen z-30",
          "border-r border-[var(--border)] bg-[var(--card)] text-[var(--text)]",
          "transition-all duration-200 overflow-hidden",
          expanded ? EXPANDED_W : COLLAPSED_W,
        ].join(" ")}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <aside
          role="complementary"
          aria-label="Sidebar Navigation"
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-sm shrink-0" />
              <span
                className={[
                  "text-sm font-bold tracking-tight",
                  "bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent",
                  expanded
                    ? "opacity-100 translate-x-0 inline"
                    : "opacity-0 -translate-x-1 hidden",
                  "transition-all duration-200",
                ].join(" ")}
              >
                LearnSphere
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className="mt-2 flex-1 overflow-auto ml-2"
            aria-label="Main navigation"
          >
            <ul className="space-y-1">
              {/* Courses (parent) */}
              <li>
                <button
                  onClick={() => setCoursesOpen((s) => !s)}
                  className={`w-full ${linkBase} ${linkInactive} justify-between`}
                  aria-expanded={coursesOpen}
                >
                  <span className="flex items-center gap-3">
                    <Icon path={ICONS.courses} />
                    <Label>Courses</Label>
                  </span>

                  {/* Count visible in both states */}
                  <CountBadge count={enrolledCount} />

                  {/* Chevron visible only when expanded */}
                  <span
                    className={[
                      "transition-transform duration-200",
                      coursesOpen ? "rotate-90" : "rotate-0",
                      expanded ? "opacity-100 inline" : "opacity-0 hidden",
                    ].join(" ")}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d={ICONS.chevronRight} fill="currentColor" />
                    </svg>
                  </span>
                </button>

                {/* Submenu — only when expanded AND coursesOpen */}
                {expanded && coursesOpen && (
                  <div className="mt-2 pl-2 pr-2">
                    <ul className="space-y-1">
                      <li>
                        <NavLink to="/my-courses" className={navClass}>
                          <span className="text-[0.95rem]">
                            Completed Courses
                          </span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/enrolled-courses" className={navClass}>
                          <span className="text-[0.95rem]">
                            Enrolled Courses
                          </span>
                        </NavLink>
                      </li>
                    </ul>
                  </div>
                )}
              </li>

              {/* Help Center */}
              <li>
                <NavLink to="/help" className={navClass}>
                  <Icon path={ICONS.community} />
                  <Label>Help Center</Label>
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
