import React, { useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import {
  subscribe,
  getSnapshot,
  unenrollCourse,
} from "../components/EnrollmentStore";

export default function EnrolledCourses() {
  const enrolled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const navigate = useNavigate();

  // Separate enrolled and completed courses
  const enrolledCourses = enrolled.filter((c) => c.status !== "Completed");
  const completedCourses = enrolled.filter((c) => c.status === "Completed");

  const CourseCard = ({ c, isCompleted = false }) => (
    <li
      key={c.id}
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: "var(--border)",
        background: "var(--card)",
      }}
    >
      <div
        className="h-32 w-full bg-center bg-cover"
        style={{
          backgroundImage: `url('${c.thumbnail || "/assets/placeholder.jpg"}')`,
        }}
        aria-label={c.title}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold">{c.title}</h3>
          {isCompleted && (
            <span className="rounded-lg px-2 py-1 text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-800/50 whitespace-nowrap">
              ✓ Completed
            </span>
          )}
        </div>
        {c.level && <p className="mt-1 text-sm opacity-80">{c.level}</p>}
        {c.lessons != null && (
          <p className="mt-1 text-sm opacity-70">{c.lessons} lessons</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() =>
              navigate(
                `/course/${c.slug || c.id}${isCompleted ? "/learn" : ""}`,
              )
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white
                       bg-gradient-to-tr from-indigo-600 to-blue-500 shadow hover:shadow-md transition"
          >
            {isCompleted ? "Review Course" : "Go to Course"}
          </button>

          {!isCompleted && (
            <button
              onClick={() => unenrollCourse(c.id)}
              className="rounded-lg px-3 py-2 text-sm font-semibold border transition"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                color: "var(--text)",
              }}
              aria-label={`Unenroll ${c.title}`}
            >
              Unenroll
            </button>
          )}
        </div>
      </div>
    </li>
  );

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-6"
      style={{ color: "var(--text)" }}
    >
      {/* Enrolled Courses Section */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Enrolled Courses</h1>

        {enrolledCourses.length === 0 ? (
          <div
            className="rounded-lg border px-4 py-3 mb-12"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
          >
            <p className="opacity-80">
              You haven't enrolled in any courses yet.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {enrolledCourses.map((c) => (
              <CourseCard key={c.id} c={c} isCompleted={false} />
            ))}
          </ul>
        )}
      </div>

      {/* Completed Courses Section */}
      {completedCourses.length > 0 && (
        <div className="border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold mb-6">Completed Courses</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCourses.map((c) => (
              <CourseCard key={c.id} c={c} isCompleted={true} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
