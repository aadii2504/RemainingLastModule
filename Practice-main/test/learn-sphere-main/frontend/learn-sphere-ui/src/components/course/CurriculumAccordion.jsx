import React, { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaPlayCircle,
  FaFileAlt,
  FaImage,
  FaMusic,
  FaCheckCircle,
  FaRegCircle,
  FaFolderOpen,
  FaQuestionCircle,
} from "react-icons/fa";

/**
 * A Udemy-style curriculum accordion component.
 * Displays chapters as headers and lessons as collapsible items.
 */
export const CurriculumAccordion = ({
  chapters,
  onLessonClick,
  onContentClick,
  activeLessonId,
  completedMap = {},
  quizzesByChapter = {},
  passedQuizIds = [],
  onQuizClick,
  activeQuizId,
  activeAssessmentOpen,
}) => {
  const [openChapters, setOpenChapters] = useState({});

  const toggleChapter = (id) => {
    setOpenChapters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "video":
        return <FaPlayCircle className="w-4 h-4 text-indigo-500" />;
      case "document":
        return <FaFileAlt className="w-4 h-4 text-emerald-500" />;
      case "image":
        return <FaImage className="w-4 h-4 text-pink-500" />;
      case "audio":
        return <FaMusic className="w-4 h-4 text-amber-500" />;
      default:
        return <FaFileAlt className="w-4 h-4 opacity-40" />;
    }
  };

  if (!chapters || chapters.length === 0) {
    return (
      <div
        className="p-8 text-center border-2 border-dashed rounded-xl"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="text-sm opacity-60 italic">No curriculum available.</p>
      </div>
    );
  }

  const sortedChapters = [...chapters].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  return (
    <div className="flex flex-col">
      {sortedChapters.map((chapter) => (
        <div
          key={chapter.id}
          className="border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={() => toggleChapter(chapter.id)}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors bg-[#1e293b]/20 hover:bg-[#1e293b]/40`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm tracking-tight">
                Section {chapter.order}: {chapter.title}
              </span>
            </div>
            <FaChevronDown
              className={`w-3 h-3 transition-transform duration-300 ${openChapters[chapter.id] ? "rotate-180" : ""}`}
            />
          </button>

          {openChapters[chapter.id] && (
            <div className="bg-[#0f172a]/30">
              {chapter.lessons
                ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((lesson) => {
                  const content = lesson.contents?.[0];
                  const hasFile = !!content?.fileUrl;

                  return (
                    <div
                      key={lesson.id}
                      className={`p-4 flex flex-col gap-2 transition-colors border-l-4 ${
                        activeLessonId === lesson.id
                          ? "bg-white/5 border-indigo-600"
                          : "hover:bg-white/5 border-transparent"
                      }`}
                    >
                      <div
                        onClick={() => onLessonClick?.(lesson)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Completion Checkbox */}
                          <div className="mt-0.5 text-indigo-500">
                            {
                              // show check when all contents completed for this lesson
                              (() => {
                                const completed = Array.isArray(
                                  completedMap[lesson.id],
                                )
                                  ? completedMap[lesson.id]
                                  : [];
                                const total = (lesson.contents || []).length;
                                if (total > 0 && completed.length >= total) {
                                  return (
                                    <FaCheckCircle className="w-4 h-4 text-emerald-400" />
                                  );
                                }
                                return <FaRegCircle className="w-4 h-4" />;
                              })()
                            }
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-sm font-medium leading-tight ${
                                activeLessonId === lesson.id
                                  ? "text-white"
                                  : "text-white/80"
                              }`}
                            >
                              {lesson.title}
                            </h4>

                            <div className="flex items-center gap-2 mt-2">
                              {getIcon(content?.contentType)}
                              <span className="text-xs text-white/40">
                                {lesson.duration
                                  ? `${lesson.duration}min`
                                  : "3min"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Per-lesson content list (Into React, Readings, etc.) */}
                      {lesson.contents && lesson.contents.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {lesson.contents.map((c, idx) => (
                            <li
                              key={c.id || idx}
                              className="flex items-center justify-between bg-slate-800 p-2 rounded-md border border-slate-700"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-6 h-6 flex items-center justify-center bg-slate-700 text-slate-300 rounded-full text-xs font-semibold">
                                  {idx + 1}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof onContentClick === "function")
                                      onContentClick(lesson, idx);
                                    else onLessonClick?.(lesson);
                                  }}
                                  className="text-sm text-slate-200 text-left flex-1"
                                >
                                  {c.title || c.contentType}
                                </button>
                              </div>
                              <span className="text-xs text-slate-400 ml-3">
                                {c.contentType}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}

              {/* Chapter quizzes */}
              {(quizzesByChapter[chapter.id] || []).length > 0 && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <FaQuestionCircle className="w-3.5 h-3.5" /> Chapter quiz
                  </h4>
                  <ul className="space-y-2">
                    {(quizzesByChapter[chapter.id] || []).map((quiz) => {
                      const passed =
                        Array.isArray(passedQuizIds) &&
                        passedQuizIds.includes(quiz.id);
                      return (
                        <li key={quiz.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuizClick?.(quiz);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                              activeQuizId === quiz.id
                                ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                                : passed
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20"
                                  : "bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {passed ? (
                                <FaCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <FaRegCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium">
                                {quiz.title}
                              </span>
                              {(quiz.questions?.length || 0) > 0 && (
                                <span className="text-xs text-slate-400">
                                  {quiz.questions?.length || 0} questions
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium">
                              {passed ? "Passed" : "Take quiz"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
