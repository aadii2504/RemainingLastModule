import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  enrollCourse,
  subscribe,
  getSnapshot,
} from "../components/EnrollmentStore";
import { courseApi } from "../api/courseApi";
import { CurriculumAccordion } from "../components/course/CurriculumAccordion";
import { SafeHtmlRenderer } from "../components/common/SafeHtmlRenderer";

const CourseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const enrolled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [course, setCourse] = useState(null);
  const isEnrolled = course ? enrolled.some((c) => c.id == course.id) : false;

  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Fetch both course details and its structure (chapters/lessons)
        const [courseData, structureData] = await Promise.all([
          courseApi.getBySlug(slug),
          courseApi.getStructureBySlug(slug),
        ]);
        setCourse(courseData);
        setStructure(structureData);
      } catch (err) {
        console.error("Error loading course details:", err);
        // Avoid toast on initial load if possible, or handle gracefully
      } finally {
        setLoading(false);
      }
    };
    loadCourseData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="p-6">Course not found.</div>;
  }

  const handleEnroll = () => {
    enrollCourse({
      id: course.id,
      slug: course.slug,
      title: course.title,
      level: course.level || "N/A",
      lessons:
        course.lessons ||
        structure?.chapters?.reduce(
          (acc, ch) => acc + (ch.lessons?.length || 0),
          0,
        ) ||
        0,
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
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <ToastContainer position="top-right" autoClose={2500} theme="light" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Section */}
        <div className="lg:col-span-2 space-y-6">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            ← Back
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm opacity-70">{course.level}</p>
          </div>

          <div className="text-sm sm:text-base opacity-80 leading-relaxed">
            <SafeHtmlRenderer
              html={course.description || "No description available."}
            />
          </div>

          {course.learningPoints && course.learningPoints.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold mb-3">
                What you'll learn
              </h2>
              <ul className="space-y-2">
                {course.learningPoints.map((point, index) => (
                  <li key={index} className="text-sm opacity-80 flex gap-2">
                    <span className="text-indigo-400 flex-shrink-0">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.requirements && course.requirements.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold mb-3">
                Requirements
              </h2>
              <ul className="space-y-2">
                {course.requirements.map((req, index) => (
                  <li key={index} className="text-sm opacity-80 flex gap-2">
                    <span className="text-indigo-400 flex-shrink-0">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-4">
              Course Curriculum
            </h2>
            <CurriculumAccordion chapters={structure?.chapters || []} />
          </div>
        </div>

        {/* Right Section - Sticky Card */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div
              className="h-40 sm:h-48 w-full bg-center bg-cover"
              style={{ backgroundImage: `url('${course.thumbnail}')` }}
              aria-label={course.title}
            />
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <p className="text-xs opacity-60 mb-1">Price</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400">
                  Free
                </p>
              </div>

              {isEnrolled ? (
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/course/${slug}/learn`)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 text-white rounded-lg font-semibold text-sm sm:text-base transition"
                  >
                    Go to Course
                  </button>
                  <p className="text-xs text-center opacity-60">
                    You have full access
                  </p>
                </div>
              ) : enrolled.some(
                  (e) => e.id === Number(course.id) && e.status === "Completed",
                ) ? (
                <button
                  disabled
                  className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg font-semibold text-sm sm:text-base cursor-not-allowed"
                >
                  Course Completed
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 text-white rounded-lg font-semibold text-sm sm:text-base transition"
                >
                  Enroll Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
