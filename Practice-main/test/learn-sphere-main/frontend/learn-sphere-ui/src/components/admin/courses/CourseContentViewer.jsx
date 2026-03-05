// components/admin/courses/CourseContentViewer.jsx
import React, { useEffect, useState } from "react";
import CourseStructureManager from "./CourseStructureManager";
import { courseApi, quizApi, assessmentApi } from "../../../api/courseApi";

export default function CourseContentViewer({ course, onClose }) {
  const [activeTab, setActiveTab] = React.useState("details");
  const [showStructure, setShowStructure] = React.useState(false);
  const [structure, setStructure] = useState(null);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [structureError, setStructureError] = useState("");
  const [assessment, setAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (activeTab !== "structure" && activeTab !== "quizzes") return;
      if (structure) return;
      setStructureError("");
      setLoadingStructure(true);
      try {
        const data = await courseApi.getStructure(course.id);
        setStructure(data);
      } catch (err) {
        console.error("Failed to load structure:", err);
        const msg = err?.response?.data?.error || err?.message || "Failed to load structure";
        setStructureError(msg);
      } finally {
        setLoadingStructure(false);
      }
    };
    load();
  }, [activeTab, course.id, structure]);

  useEffect(() => {
    if (activeTab === "assessment" && !assessment) {
      setLoadingAssessment(true);
      assessmentApi.getByCourse(course.id)
        .then(setAssessment)
        .catch(console.error)
        .finally(() => setLoadingAssessment(false));
    }
  }, [activeTab, course.id, assessment]);

  useEffect(() => {
    if (activeTab === "quizzes" && structure?.chapters && Object.keys(quizzesByChapter).length === 0) {
      setLoadingQuizzes(true);
      Promise.all(structure.chapters.map(ch =>
        quizApi.getByChapter(ch.id).then(qs => ({ id: ch.id, qs }))
      ))
        .then(results => {
          const map = {};
          results.forEach(r => map[r.id] = r.qs);
          setQuizzesByChapter(map);
        })
        .catch(console.error)
        .finally(() => setLoadingQuizzes(false));
    }
  }, [activeTab, structure, quizzesByChapter]);

  if (!course) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[100vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/80">
          <div>
            <h2 className="text-2xl font-bold text-white">{course.title}</h2>
            <p className="text-sm text-slate-300 mt-1">{course.summary}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-600/20 hover:text-red-400 rounded-md transition text-slate-400"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 border-b border-slate-700 overflow-x-auto p-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-none ${activeTab === "details"
                ? "text-blue-400  border-blue-500 bg-slate-800"
                : "text-slate-400 hover:text-slate-300"
              }`}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab("structure")}
            className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-none ${activeTab === "structure"
                ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800"
                : "text-slate-400 hover:text-slate-300"
              }`}
          >
            📚 Course Structure
          </button>
          <button
            onClick={() => setActiveTab("assessment")}
            className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-none ${activeTab === "assessment"
                ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800"
                : "text-slate-400 hover:text-slate-300"
              }`}
          >
            Assessment
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-none ${activeTab === "quizzes"
                ? "text-blue-400 border-b-2 border-blue-500 bg-slate-800"
                : "text-slate-400 hover:text-slate-300"
              }`}
          >
            Quizzes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Course Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Level
                  </p>
                  <p className="text-lg font-semibold mt-1 capitalize text-slate-100">
                    {course.level}
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Duration
                  </p>
                  <p className="text-lg font-semibold mt-1 text-slate-100">
                    {course.duration}
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Status
                  </p>
                  <p
                    className={`text-lg font-semibold mt-1 capitalize ${course.status === "published"
                        ? "text-green-400"
                        : course.status === "draft"
                          ? "text-yellow-400"
                          : "text-gray-400"
                      }`}
                  >
                    {course.status}
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Price
                  </p>
                  <p className="text-lg font-semibold mt-1 text-slate-100">
                    {course.price === 0 ? "Free" : `$${course.price}`}
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Students
                  </p>
                  <p className="text-lg font-semibold mt-1 text-slate-100">
                    {course.students}
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Slug
                  </p>
                  <p className="text-sm font-mono mt-1 truncate text-slate-100">
                    {course.slug}
                  </p>
                </div>
              </div>

              {/* Categories */}
              {course.categories && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-3">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(typeof course.categories === "string"
                      ? course.categories.split(",").map(c => c.trim())
                      : course.categories
                    ).map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-600 border border-blue-500 rounded-full text-sm text-blue-100"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Thumbnail */}
              {course.thumbnail && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-3">
                    Thumbnail
                  </h3>
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full max-h-48 object-cover rounded-lg border border-slate-700"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-3">
                  Description
                </h3>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-sm text-slate-200 whitespace-pre-wrap font-mono text-xs max-h-48 overflow-y-auto">
                  {course.description || "No description provided"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "assessment" && (
            <div className="space-y-4">
              {loadingAssessment ? (
                <div className="text-center py-12 text-slate-400">Loading assessment...</div>
              ) : assessment ? (
                <>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400 uppercase tracking-wide">
                      Assessment Title
                    </p>
                    <p className="text-lg font-semibold mt-1 text-slate-100">
                      {assessment.title || "Untitled Assessment"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <p className="text-[10px] text-slate-500 uppercase">Limit</p>
                      <p className="text-sm font-bold text-slate-200">{assessment.timeLimitMinutes} mins</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <p className="text-[10px] text-slate-500 uppercase">Passing</p>
                      <p className="text-sm font-bold text-slate-200">{assessment.passingScorePercentage}%</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <p className="text-[10px] text-slate-500 uppercase">Window</p>
                      <p className="text-sm font-bold text-slate-200">{assessment.accessDurationDays} days</p>
                    </div>
                  </div>

                  {assessment.questions?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-100">
                        <span className="text-xl">📝</span>
                        Questions ({assessment.questions.length})
                      </h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {assessment.questions.map((q, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800/40 p-4 rounded-lg border border-slate-700"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <p className="font-semibold text-sm text-slate-100">
                                {idx + 1}. {q.text}
                              </p>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">{q.type}</span>
                            </div>
                            {q.options?.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, optIdx) => {
                                  const isCorrect = q.correctIndices?.includes(optIdx);
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${isCorrect
                                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                                          : "bg-slate-900/50 border-slate-800 text-slate-400"
                                        }`}
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full ${isCorrect ? 'bg-green-400' : 'bg-slate-600'}`}></div>
                                      <span className="flex-1">{opt}</span>
                                      {isCorrect && <span className="text-[10px] font-bold">✓</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg">
                    No assessment created yet
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    Create an assessment in the edit view
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "quizzes" && (
            <div className="space-y-6">
              {!structure ? (
                <div className="text-center py-12 text-slate-400">Loading chapters...</div>
              ) : structure.chapters?.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No chapters found for this course.</div>
              ) : (
                structure.chapters.map(ch => (
                  <div key={ch.id} className="space-y-4">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                      Chapter: {ch.title}
                    </h3>
                    {loadingQuizzes ? (
                      <div className="text-slate-500 text-xs italic">Loading quizzes...</div>
                    ) : !quizzesByChapter[ch.id] || quizzesByChapter[ch.id].length === 0 ? (
                      <div className="text-slate-500 text-xs italic py-2">No quizzes in this chapter.</div>
                    ) : (
                      <div className="space-y-4">
                        {quizzesByChapter[ch.id].map(quiz => (
                          <div key={quiz.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-bold text-slate-100 text-base">{quiz.title}</h4>
                                <p className="text-xs text-slate-400 mt-1">{quiz.description}</p>
                              </div>
                              <div className="flex gap-4 text-[10px] text-slate-400 uppercase font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                                <span>Limit: {quiz.timeLimitMinutes}m</span>
                                <span className="text-slate-700">|</span>
                                <span>Pass: {quiz.passingScorePercentage}%</span>
                              </div>
                            </div>
                            {quiz.questions?.length > 0 && (
                              <div className="space-y-3">
                                {quiz.questions.map((q, idx) => (
                                  <div key={idx} className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                                    <p className="text-slate-100 text-sm mb-3 font-medium">{idx + 1}. {q.text}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {q.options.map((opt, oi) => {
                                        const isCorrect = oi === q.correctIndex;
                                        return (
                                          <div key={oi} className={`px-3 py-2 rounded-md border text-xs flex items-center gap-2 ${isCorrect
                                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                              : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                                            }`}>
                                            <div className={`w-1 h-1 rounded-full ${isCorrect ? 'bg-green-400' : 'bg-slate-600'}`}></div>
                                            <span className="flex-1">{opt}</span>
                                            {isCorrect && <span className="text-[10px] font-bold">✓</span>}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "structure" && (
            <div className="space-y-4">
              {loadingStructure ? (
                <div className="text-center py-8 text-slate-400">Loading structure...</div>
              ) : structureError ? (
                <div className="text-center py-8 text-red-400">{structureError}</div>
              ) : structure && structure.chapters?.length > 0 ? (
                <div className="space-y-4">
                  {structure.chapters.map((ch) => (
                    <div key={ch.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-100">{ch.title}</h4>
                        <div className="text-sm text-slate-400">Lessons: {ch.lessons?.length || 0}</div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {ch.lessons?.map((l) => (
                          <div key={l.id} className="bg-slate-900 p-3 rounded-md border border-slate-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-slate-200">{l.title}</div>
                                <div className="text-xs text-slate-400">{l.description || ""}</div>
                              </div>
                              <div className="text-xs text-slate-400">Contents: {l.contents?.length || 0}</div>
                            </div>

                            {l.contents?.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {l.contents.map((c) => (
                                  <div key={c.id} className="flex items-center justify-between bg-slate-800 p-2 rounded-md border border-slate-700">
                                    <div className="text-sm text-slate-200">{c.title}</div>
                                    <div className="text-xs text-slate-400">{c.contentType} • {c.fileSize || "-"} bytes</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">No structure created yet.</div>
              )}

              <div>
                <button
                  onClick={() => setShowStructure(true)}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Open Structure Manager
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Course Structure Manager Modal */}
      {showStructure && (
        <CourseStructureManager
          courseId={course.id}
          onClose={() => setShowStructure(false)}
        />
      )}
    </div>
  );
}
