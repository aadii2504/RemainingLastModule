import React, { useState, useEffect, useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { courseApi } from "../api/courseApi";
import {
  subscribe,
  getSnapshot,
  enrollCourse,
} from "../components/EnrollmentStore";

const CoursesPage = () => {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const enrolled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await courseApi.getAll();
        setCourses(data || []);
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    };
    loadCourses();
  }, []);

  if (!courses.length) {
    return <div className="p-6">No courses available.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        All Courses
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((course) => (
          <article
            key={course.id}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 overflow-hidden group transition"
          >
            <div
              className="h-40 sm:h-44 w-full bg-center bg-cover group-hover:scale-105 transition-transform duration-300"
              style={{
                backgroundImage: `url('${course.thumbnail || "/assets/placeholder.jpg"}')`,
              }}
              aria-label={course.title}
            />
            <div className="p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-blue-400 transition">
                {course.title}
              </h4>
              <p className="mt-1 text-xs sm:text-sm opacity-70">
                {course.level || "N/A"}
              </p>
              <div className="mt-3 sm:mt-4 flex items-center gap-2 flex-wrap">
                {enrolled.some(
                  (ec) => ec.id == course.id && ec.status === "Completed",
                ) ? (
                  <>
                    <span className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-800/50">
                      Completed
                    </span>
                    <Link
                      to={`/course/${course.slug}/learn`}
                      className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 transition"
                    >
                      Review Course
                    </Link>
                  </>
                ) : enrolled.some((ec) => ec.id == course.id) ? (
                  <>
                    <span className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
                      Enrolled
                    </span>
                    <Link
                      to={`/course/${course.slug}/learn`}
                      className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 transition"
                    >
                      Continue
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => enrollCourse(course)}
                    className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 transition"
                  >
                    Join Now
                  </button>
                )}
                <Link
                  to={`/course/${course.slug}`}
                  className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold border border-white/20 hover:bg-white/10 transition"
                >
                  Details
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
