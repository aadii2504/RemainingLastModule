import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseApi, quizApi, assessmentApi } from "../api/courseApi";
import { getCoursePerformance } from "../api/analytics";
import { CurriculumAccordion } from "../components/course/CurriculumAccordion";
import QuizPlayer from "../components/course/QuizPlayer";
import AssessmentPlayer from "../components/course/AssessmentPlayer";
import { SafeHtmlRenderer } from "../components/common/SafeHtmlRenderer";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaShareAlt,
  FaTrophy,
  FaEllipsisV,
  FaSearch,
  FaTimes,
  FaRegClock,
} from "react-icons/fa";

const CoursePlayerPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [structure, setStructure] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [completedMap, setCompletedMap] = useState({}); // { [lessonId]: [idx,...] }
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Quiz / Assessment state (now inline)
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [quizzesByChapter, setQuizzesByChapter] = useState({}); // { chapterId: [quiz,...] }
  const [progress, setProgress] = useState({
    completedLessonIds: [],
    passedQuizIds: [],
  });
  const [eligibility, setEligibility] = useState(null);

  // Filter progress to only count items belonging to THIS course
  const allLessonIds =
    structure?.chapters?.flatMap((ch) => ch.lessons?.map((l) => l.id) || []) ||
    [];
  const allQuizIds = Object.values(quizzesByChapter)
    .flat()
    .map((q) => q.id);

  const completedInCourse = (progress.completedLessonIds || []).filter((id) =>
    allLessonIds.includes(id),
  ).length;
  const passedInCourse = (progress.passedQuizIds || []).filter((id) =>
    allQuizIds.includes(id),
  ).length;

  const totalItems = allLessonIds.length + allQuizIds.length;
  const completedItems = completedInCourse + passedInCourse;
  const progressPercentage =
    totalItems > 0
      ? Math.min(100, Math.round((completedItems / totalItems) * 100))
      : 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [courseData, structureData] = await Promise.all([
          courseApi.getBySlug(slug),
          courseApi.getStructureBySlug(slug),
        ]);
        setCourse(courseData);
        setStructure(structureData);

        // Fetch analytics
        try {
          const analyticsData = await getCoursePerformance();
          setAnalytics(analyticsData);
        } catch (e) {
          console.error("Error fetching analytics:", e);
          setAnalytics(null);
        }

        if (structureData?.chapters?.[0]?.lessons?.[0]) {
          setCurrentLesson(structureData.chapters[0].lessons[0]);
        }

        // Load quizzes per chapter, student progress, and assessment eligibility
        const chapters = structureData?.chapters || [];
        if (chapters.length && courseData?.id) {
          const [quizResults, progressData, eligibilityData] =
            await Promise.all([
              Promise.all(
                chapters.map((ch) =>
                  quizApi
                    .getByChapter(ch.id)
                    .then((quizzes) => ({ chapterId: ch.id, quizzes }))
                    .catch(() => ({ chapterId: ch.id, quizzes: [] })),
                ),
              ),
              assessmentApi
                .getProgress(courseData.id)
                .catch(() => ({ completedLessonIds: [], passedQuizIds: [] })),
              assessmentApi
                .getEligibility(courseData.id)
                .catch(() => ({ eligible: false })),
            ]);
          const map = {};
          quizResults.forEach((r) => {
            map[r.chapterId] = r.quizzes;
          });
          setQuizzesByChapter(map);
          setProgress(progressData);
          setEligibility(eligibilityData);

          // Initialize completedMap from backend progress so checkmarks show for completed lessons
          const completedIds = progressData?.completedLessonIds || [];
          if (completedIds.length > 0) {
            const completedMapFromProgress = {};
            chapters.forEach((ch) => {
              (ch.lessons || []).forEach((lesson) => {
                if (
                  completedIds.includes(lesson.id) &&
                  lesson.contents?.length
                ) {
                  completedMapFromProgress[lesson.id] = lesson.contents.map(
                    (_, i) => i,
                  );
                }
              });
            });
            setCompletedMap((prev) => ({
              ...completedMapFromProgress,
              ...prev,
            }));
          }
        }
      } catch (err) {
        console.error("Error loading learning view:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  // reset selected content when lesson changes
  useEffect(() => {
    setSelectedContentIndex(0);
    if (currentLesson) {
      setActiveQuiz(null);
      setActiveAssessment(null);
    }
  }, [currentLesson]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeQuiz) {
      return (
        <div
          className="max-w-4xl mx-auto py-12 px-6 h-full"
          style={{ zoom: 0.85 }}
        >
          <QuizPlayer
            quiz={activeQuiz}
            onClose={() => setActiveQuiz(null)}
            onPassed={() => {
              const qid = activeQuiz.id;
              setProgress((prev) => ({
                ...prev,
                passedQuizIds: prev.passedQuizIds.includes(qid)
                  ? prev.passedQuizIds
                  : [...prev.passedQuizIds, qid],
              }));
              if (course?.id)
                assessmentApi
                  .getEligibility(course.id)
                  .then((e) => setEligibility(e))
                  .catch(() => {});
            }}
          />
        </div>
      );
    }

    if (activeAssessment) {
      return (
        <div
          className="max-w-5xl mx-auto py-12 px-6 h-full"
          style={{ zoom: 0.85 }}
        >
          <AssessmentPlayer
            courseId={course.id}
            onClose={() => {
              setActiveAssessment(null);
              // Refresh eligibility to update sidebar lock state
              if (course?.id)
                assessmentApi
                  .getEligibility(course.id)
                  .then(setEligibility)
                  .catch(() => {});
            }}
          />
        </div>
      );
    }

    if (!currentLesson?.contents?.[0]) {
      if (eligibility?.eligible) {
        return (
          <div className="flex flex-col items-center justify-center p-12 h-full text-center animate-in fade-in zoom-in duration-700 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -z-10"></div>
            <div className="w-28 h-28 mb-8 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/30 backdrop-blur-xl">
              <FaTrophy className="text-indigo-400 animate-bounce" />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-violet-200">
              Mission Accomplished!
            </h2>
            <p className="text-white/60 max-w-lg mx-auto mb-12 text-lg leading-relaxed font-medium">
              You've conquered every lesson and quiz. The final challenge
              awaits. Prove your mastery and claim your certificate.
            </p>
            <button
              onClick={() => {
                setActiveAssessment(true);
                setActiveQuiz(null);
                setCurrentLesson(null);
              }}
              className="group relative px-12 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-lg hover:from-indigo-500 hover:to-violet-500 transition-all shadow-[0_0_30px_rgba(99,102,241,0.5)] active:scale-95 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center gap-3">
                🚀 Launch Final Assessment
              </span>
            </button>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center aspect-video w-full bg-black/60 rounded-xl text-white/40 p-12 text-center border border-white/5">
          <div className="w-20 h-20 mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-xl font-bold text-white/80">
            No content available
          </h3>
        </div>
      );
    }

    const content = currentLesson.contents[selectedContentIndex];
    let rawUrl = content.fileUrl;
    if (rawUrl.includes("localhost:5000")) {
      rawUrl = rawUrl.replace("http://localhost:5000", "");
    }

    const backendBase = "http://localhost:5267";
    const fileUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${backendBase}${rawUrl}`;
    const lowFileName = (content.fileName || "").toLowerCase();
    const lowFileUrl = (content.fileUrl || "").toLowerCase();

    // Strict PDF detection to prevent automatic downloads of docx/other formats
    const isPdf =
      lowFileName.endsWith(".pdf") ||
      lowFileUrl.endsWith(".pdf") ||
      lowFileUrl.includes(".pdf?");
    const type = (content.contentType || "document").toLowerCase();

    switch (type) {
      case "video":
        return (
          <div className="relative group aspect-video w-full bg-slate-900 shadow-2xl rounded-xl overflow-hidden">
            <video
              src={fileUrl}
              controls
              className="w-full h-full"
              poster={course?.thumbnail}
            />
            {renderNavArrows()}
          </div>
        );
      case "audio":
        return (
          <div className="relative group flex flex-col items-center justify-center min-h-[60vh] p-12 bg-[#1e293b]/20 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center text-5xl animate-pulse">
              🎵
            </div>
            <div className="w-full max-w-md">
              <h3 className="text-2xl font-black text-white mb-6 tracking-tight">
                {content.title}
              </h3>
              <audio src={fileUrl} controls className="w-full h-14" />
            </div>
            {renderNavArrows()}
          </div>
        );
      case "image":
        return (
          <div className="relative group flex items-center justify-center min-h-[70vh] bg-slate-900/40 rounded-xl overflow-hidden">
            <img
              src={fileUrl}
              alt={content.title}
              className="max-w-full max-h-[85vh] shadow-2xl rounded-xl"
            />
            {renderNavArrows()}
          </div>
        );
      case "pdf":
      case "document":
        if (isPdf) {
          return (
            <div className="relative group w-full h-[calc(100vh-64px)] bg-[#1e293b]">
              <iframe
                src={`${fileUrl}#view=FitH&toolbar=0`}
                className="w-full h-full border-none"
                title={content.title}
              />
              <div className="absolute right-4 top-4 z-20">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-black/60 text-sm rounded-md border border-white/10 hover:bg-black/80"
                >
                  Open in new tab
                </a>
              </div>
              {renderNavArrows()}
            </div>
          );
        }
        return (
          <div className="relative group p-20 text-center bg-white/5 h-full min-h-[70vh] flex flex-col items-center justify-center border border-white/5 rounded-xl">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-amber-500/10 flex items-center justify-center text-5xl">
              📄
            </div>
            <h3 className="text-2xl font-black mb-2">{content.title}</h3>
            <p className="text-white/60 max-w-md mx-auto leading-relaxed">
              This document format is not supported for inline viewing.
              <br />
              <span className="text-amber-400 font-bold">
                Please upload a PDF version
              </span>{" "}
              for it to open directly on screen.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                Open / Download
              </a>
              {renderNavArrows()}
            </div>
          </div>
        );
      default:
        return (
          <div className="relative group p-20 text-center bg-white/5 h-full min-h-[70vh] flex flex-col items-center justify-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center text-3xl">
              ❓
            </div>
            <p className="text-xl font-black">Unsupported Material</p>
            <p className="opacity-40 italic mt-2">
              This content type cannot be played in the integrated viewer.
            </p>
            {renderNavArrows()}
          </div>
        );
    }
  };

  // Per-lesson content selector removed; content buttons are rendered directly under each lesson in the curriculum accordion.

  const navigateLesson = (dir) => {
    if (!structure?.chapters) return;

    let allLessons = [];
    structure.chapters.forEach((c) => {
      if (c.lessons) allLessons = [...allLessons, ...c.lessons];
    });

    const currentIndex = allLessons.findIndex(
      (l) => l.id === currentLesson?.id,
    );
    if (dir === "next" && currentIndex < allLessons.length - 1) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    } else if (dir === "prev" && currentIndex > 0) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    }
  };

  const renderNavArrows = () => {
    if (activeQuiz || activeAssessment) return null;
    return (
      <>
        <button
          onClick={() => navigateLesson("prev")}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-16 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10 rounded-r-lg"
        >
          <FaChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => navigateLesson("next")}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-16 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10 rounded-l-lg"
        >
          <FaChevronRight className="w-6 h-6" />
        </button>
      </>
    );
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-slate-800 text-slate-100 overflow-hidden font-sans">
        {/* Premium Top Navigation */}
        <nav className="h-16 bg-slate-800/95 backdrop-blur-md flex items-center px-6 border-b border-indigo-500/10 z-20 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => navigate("/dashboard")}
            className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mr-8 hover:scale-105 transition-transform"
          >
            LearnSphere
          </button>
          <div className="h-6 w-[1px] bg-white/10 mr-8 hidden md:block"></div>
          <h1 className="text-lg font-bold truncate opacity-90">
            {course?.title}
          </h1>
        </nav>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content (Left) */}
          <div className="flex-1 flex flex-col bg-slate-700/50 overflow-y-auto relative">
            <div className="flex-1 p-6">{renderContent()}</div>

            {/* Overview panel will be rendered inside the lesson section below */}

            {/* Premium Info Bar */}
            <div className="p-8 bg-gradient-to-b from-slate-700 to-slate-800 border-t border-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                {activeQuiz
                  ? activeQuiz.title
                  : activeAssessment
                    ? "Final Assessment"
                    : currentLesson?.title}
              </h2>
              {/* Overview panel for all lessons */}
              {currentLesson && (
                <div className="my-6 relative z-10">
                  <div className="max-w-2xl">
                    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-2xl hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-2 text-indigo-300">
                            Session Overview
                          </h3>
                          <p className="text-base text-white/80 leading-snug max-h-20 overflow-hidden">
                            {course?.summary ||
                              course?.description ||
                              "No summary available."}
                          </p>
                          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                                Overall Progress
                              </span>
                              <span className="text-sm font-black text-indigo-400">
                                {progressPercentage}% Complete
                              </span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-4">
                          <div className="flex items-center gap-2">
                            <FaTrophy className="w-4 h-4 opacity-70" />
                            <div>
                              <span className="text-sm opacity-70">
                                Students
                              </span>
                              <span className="text-lg font-semibold ml-2">
                                {(() => {
                                  // Try to get enrolled count from analytics
                                  if (analytics && Array.isArray(analytics)) {
                                    const found = analytics.find(
                                      (a) =>
                                        a.title === course?.title ||
                                        a.id === course?.id,
                                    );
                                    if (
                                      found &&
                                      typeof found.enrolled === "number"
                                    )
                                      return found.enrolled;
                                  }
                                  // Fallback to course object
                                  return Array.isArray(course?.enrollments)
                                    ? course.enrollments.length
                                    : typeof course?.students !== "undefined"
                                      ? course?.students
                                      : course?.Students || 0;
                                })()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaRegClock className="w-4 h-4 opacity-70" />
                            <div>
                              <span className="text-sm opacity-70">
                                Duration
                              </span>
                              <span className="text-lg font-semibold ml-2">
                                {course?.duration
                                  ? `${course.duration} weeks`
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-white/70 leading-relaxed max-w-4xl text-base mt-6">
                <SafeHtmlRenderer
                  html={
                    activeQuiz
                      ? activeQuiz.description
                      : activeAssessment
                        ? "Test your knowledge across the entire course."
                        : currentLesson?.description ||
                          course?.description ||
                          "No description available."
                  }
                />
              </div>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div
            className={`bg-slate-800/95 backdrop-blur-xl border-l border-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.3)] ${
              sidebarOpen ? "w-[380px]" : "w-0"
            }`}
          >
            <div className="p-5 border-b border-indigo-500/10 flex flex-col gap-3 bg-gradient-to-br from-slate-700 to-slate-800 sticky top-0 z-10 whitespace-nowrap">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-sm tracking-widest uppercase text-indigo-300/80">
                  Curriculum
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Global Progress Tracker */}
              <div className="bg-slate-700/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <FaTrophy className="text-indigo-500/80" />
                    Your Completion
                  </div>
                  <span className="text-xs font-black text-white/90">
                    {progressPercentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Per-lesson content buttons are shown under each lesson in the curriculum list */}
            </div>

            <div className="flex-1 overflow-y-auto pb-10">
              <CurriculumAccordion
                chapters={structure?.chapters || []}
                onLessonClick={(lesson) => {
                  setCurrentLesson(lesson);
                  setSelectedContentIndex(0);
                  setActiveQuiz(null);
                  setActiveAssessment(null);
                }}
                onContentClick={(lesson, idx) => {
                  setCurrentLesson(lesson);
                  setSelectedContentIndex(idx);
                  setActiveQuiz(null);
                  setActiveAssessment(null);
                  const lid = lesson?.id;
                  if (!lid) return;
                  setCompletedMap((prev) => {
                    const existing = Array.isArray(prev[lid])
                      ? prev[lid].slice()
                      : [];
                    if (!existing.includes(idx)) existing.push(idx);
                    return { ...prev, [lid]: existing };
                  });
                  // Also persist to backend
                  assessmentApi
                    .completeLesson(lid)
                    .then(() => {
                      setProgress((prev) => ({
                        ...prev,
                        completedLessonIds: prev.completedLessonIds.includes(
                          lid,
                        )
                          ? prev.completedLessonIds
                          : [...prev.completedLessonIds, lid],
                      }));
                      if (course?.id)
                        assessmentApi
                          .getEligibility(course.id)
                          .then((e) => setEligibility(e))
                          .catch(() => {});
                    })
                    .catch(() => {});
                }}
                activeLessonId={currentLesson?.id}
                completedMap={completedMap}
                quizzesByChapter={quizzesByChapter}
                passedQuizIds={progress.passedQuizIds || []}
                activeQuizId={activeQuiz?.id}
                activeAssessmentOpen={!!activeAssessment}
                onQuizClick={(quiz) => {
                  setActiveQuiz(quiz);
                  setActiveAssessment(null);
                  setCurrentLesson(null);
                }}
              />

              {/* Assessment launch button at bottom of sidebar — locked until all lessons + quizzes done */}
              <div className="p-4 border-t border-white/5">
                {eligibility?.eligible ? (
                  <button
                    onClick={() => {
                      setActiveAssessment(true);
                      setActiveQuiz(null);
                      setCurrentLesson(null);
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider transition ${
                      activeAssessment
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-white border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20"
                    }`}
                  >
                    🎓 Final Assessment
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 rounded-xl font-bold text-sm tracking-wider text-white/50 border border-white/10 bg-white/5 cursor-not-allowed"
                    title={
                      eligibility?.reason ||
                      "Complete all requirements to unlock."
                    }
                  >
                    🔒 Final Assessment (locked)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Re-open Sidebar Button */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed right-6 bottom-6 w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition z-50"
            >
              <FaChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CoursePlayerPage;
