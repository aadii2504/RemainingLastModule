import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllCourses } from "../components/admin/CourseApi";

const LandingPage = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const loadCourses = async () => {
      const data = await getAllCourses();
      setCourses(data || []);
    };
    loadCourses();
  }, []);
  return (
    <div>
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-12 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              LearnSphere
            </span>
            , because{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Curves
            </span>{" "}
            ain’t enough!
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-lg text-[var(--text)]/80">
            A beginner-friendly platform for mastering skills.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-lg hover:shadow-xl transition"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Courses carousel marquee */}
      <section className="pb-8 sm:pb-12 overflow-hidden">
        <div className="flex marquee whitespace-nowrap">
          {courses.length > 0 ? (
            // Render twice for seamless loop
            [...courses, ...courses].map((course, idx) => (
              <Link key={`${course.id}-${idx}`} to={`/course/${course.slug}`}
                className="inline-block flex-shrink-0 w-48 sm:w-56 mx-2 sm:mx-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden group"
              >
                <div
                  className="h-28 sm:h-32 w-full bg-center bg-cover"
                  style={{
                    backgroundImage: `url('${course.thumbnail || "/assets/placeholder.jpg"}')`,
                  }}
                />
                <div className="p-3">
                  <h3 className="text-xs sm:text-sm font-semibold truncate group-hover:text-blue-400 transition">{course.title}</h3>
                  <p className="mt-1 text-xs text-white/50">{course.level}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="w-full text-center py-8 text-white/40 text-sm">
              Loading courses...
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
