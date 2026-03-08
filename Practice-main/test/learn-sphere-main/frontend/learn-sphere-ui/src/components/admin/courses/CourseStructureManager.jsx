import React, { useState, useEffect } from "react";
import { courseApi } from "../../../api/courseApi";
import ContentUploadModal from "./ContentUploadModal";
import { validateTitle } from "./titleValidator";

export default function CourseStructureManager({
  courseId,
  onClose,
  isEmbedded = false,
}) {
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadModal, setUploadModal] = useState(null);
  const [uploading, setUploading] = useState(false);

  // New states for chapter/lesson creation
  const [newChapter, setNewChapter] = useState({ title: "", description: "" });
  const [newLesson, setNewLesson] = useState({}); // { chapterId: { title: "", description: "", duration: "" } }
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState({}); // { chapterId: boolean }
  const [chapterTitleError, setChapterTitleError] = useState("");
  const [lessonTitleErrors, setLessonTitleErrors] = useState({}); // { chapterId: error message }

  useEffect(() => {
    if (courseId && courseId !== "new") {
      loadCourseStructure();
    } else {
      setLoading(false);
    }
  }, [courseId]);

  const loadCourseStructure = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getStructure(courseId);
      setCourseData(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load course structure");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadContent = async (formData) => {
    if (!uploadModal) return;

    try {
      setUploading(true);
      await courseApi.content.upload(
        courseId,
        uploadModal.chapterId,
        uploadModal.lessonId,
        formData,
      );
      setUploadModal(null);
      await loadCourseStructure();
    } catch (err) {
      console.error("Upload Error Details:", err.response?.data);
      let msg = "Failed to upload content";
      if (err.response?.data?.error) {
        msg = err.response.data.error;
        if (err.response.data.received) {
          msg += ` (Server received: ${JSON.stringify(err.response.data.received)})`;
        }
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContent = async (chapterId, lessonId, contentId) => {
    if (!window.confirm("Are you sure you want to delete this content?"))
      return;

    try {
      await courseApi.content.delete(courseId, chapterId, lessonId, contentId);
      await loadCourseStructure();
    } catch (err) {
      setError(err.message || "Failed to delete content");
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapter.title.trim()) {
      setChapterTitleError("Chapter title is required");
      return;
    }

    // Validate title
    const validation = validateTitle(newChapter.title);
    if (!validation.isValid) {
      setChapterTitleError(validation.error);
      return;
    }

    try {
      setIsCreatingChapter(true);
      setChapterTitleError("");
      await courseApi.chapters.create(courseId, {
        title: newChapter.title,
        description: newChapter.description,
        order: (courseData?.chapters?.length || 0) + 1,
      });
      setNewChapter({ title: "", description: "" });
      await loadCourseStructure();
    } catch (err) {
      setError(err.message || "Failed to create chapter");
    } finally {
      setIsCreatingChapter(false);
    }
  };

  const handleAddLesson = async (chapterId) => {
    const lessonData = newLesson[chapterId];
    if (!lessonData || !lessonData.title.trim()) {
      setLessonTitleErrors((prev) => ({
        ...prev,
        [chapterId]: "Lesson title is required",
      }));
      return;
    }

    // Validate title
    const validation = validateTitle(lessonData.title);
    if (!validation.isValid) {
      setLessonTitleErrors((prev) => ({
        ...prev,
        [chapterId]: validation.error,
      }));
      return;
    }

    try {
      setIsCreatingLesson((prev) => ({ ...prev, [chapterId]: true }));
      setLessonTitleErrors((prev) => ({ ...prev, [chapterId]: "" }));
      await courseApi.lessons.create(courseId, chapterId, {
        title: lessonData.title,
        description: lessonData.description,
        duration: lessonData.duration,
        order:
          (courseData.chapters.find((c) => c.id === chapterId)?.lessons
            ?.length || 0) + 1,
      });
      setNewLesson((prev) => ({
        ...prev,
        [chapterId]: { title: "", description: "", duration: "" },
      }));
      await loadCourseStructure();
    } catch (err) {
      setError(err.message || "Failed to create lesson");
    } finally {
      setIsCreatingLesson((prev) => ({ ...prev, [chapterId]: false }));
    }
  };

  const updateNewChapterState = (field, value) => {
    setNewChapter((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate title in real-time
    if (field === "title") {
      if (!value.trim()) {
        setChapterTitleError("");
      } else {
        const validation = validateTitle(value);
        setChapterTitleError(validation.isValid ? "" : validation.error);
      }
    }
  };

  const updateNewLessonState = (chapterId, field, value) => {
    setNewLesson((prev) => ({
      ...prev,
      [chapterId]: {
        ...(prev[chapterId] || { title: "", description: "", duration: "" }),
        [field]: value,
      },
    }));

    // Validate title in real-time
    if (field === "title") {
      if (!value.trim()) {
        setLessonTitleErrors((prev) => ({ ...prev, [chapterId]: "" }));
      } else {
        const validation = validateTitle(value);
        setLessonTitleErrors((prev) => ({
          ...prev,
          [chapterId]: validation.isValid ? "" : validation.error,
        }));
      }
    }
  };

  if (loading) {
    return (
      <div
        className={`${isEmbedded ? "py-10" : "fixed inset-0 bg-black/70 backdrop-blur-sm z-50"} flex items-center justify-center`}
      >
        <div className="bg-slate-800 rounded-lg p-8 flex flex-col items-center">
          <div className="animate-spin text-4xl mb-4 text-blue-500">⚙️</div>
          <p className="text-white">Loading course structure...</p>
        </div>
      </div>
    );
  }

  if (courseId === "new") {
    return (
      <div className="p-8 text-center bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold mb-4">Save Course First</h3>
        <p className="text-slate-400">
          Please save the course details first before managing its structure.
        </p>
      </div>
    );
  }

  const containerClasses = isEmbedded
    ? "flex flex-col space-y-6"
    : "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4";

  const contentClasses = isEmbedded
    ? "bg-transparent w-full"
    : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header - Only show if not embedded */}
        {!isEmbedded && (
          <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/80">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Course Structure
              </h2>
              <p className="text-sm text-slate-300 mt-1">{courseData?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-600/20 hover:text-red-400 rounded-md transition text-slate-400"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-300">
              ⚠️ {error}
            </div>
          )}

          {/* Chapters */}
          {courseData?.chapters && courseData.chapters.length > 0 ? (
            <div className="space-y-4">
              {courseData.chapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition"
                >
                  {/* Chapter Header */}
                  <div className="flex items-start justify-between p-4 bg-slate-800/50">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-400">
                        📚 Chapter {idx + 1}: {chapter.title}
                      </h3>
                      {chapter.description && (
                        <p className="text-sm text-slate-400 mt-1">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="p-4 space-y-3 border-t border-slate-700">
                    {chapter.lessons && chapter.lessons.length > 0 ? (
                      chapter.lessons.map((lesson, lessonIdx) => (
                        <div
                          key={lesson.id}
                          className="bg-slate-700/50 rounded-lg p-4 space-y-3"
                        >
                          {/* Lesson Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-slate-100">
                                🎓 Lesson {lessonIdx + 1}: {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-sm text-slate-400 mt-1">
                                  {lesson.description}
                                </p>
                              )}
                              {lesson.duration && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Duration: {lesson.duration}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                setUploadModal({
                                  courseId,
                                  chapterId: chapter.id,
                                  lessonId: lesson.id,
                                })
                              }
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition"
                            >
                              + Upload Content
                            </button>
                          </div>

                          {/* Content List */}
                          {lesson.contents && lesson.contents.length > 0 ? (
                            <div className="mt-3 space-y-2 border-t border-slate-600 pt-3">
                              {lesson.contents.map((content) => (
                                <div
                                  key={content.id}
                                  className="flex items-center justify-between p-2 bg-slate-600/30 rounded"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-100">
                                      {getContentIcon(content.contentType)}{" "}
                                      {content.title}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {content.contentType} •{" "}
                                      {formatFileSize(content.fileSize)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteContent(
                                        chapter.id,
                                        lesson.id,
                                        content.id,
                                      )
                                    }
                                    className="p-1 text-red-400 hover:text-red-300 transition"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 mt-2">
                              No content uploaded yet
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        No lessons in this chapter
                      </p>
                    )}

                    {/* Add Lesson Form */}
                    <div className="bg-slate-800/50 border border-slate-600 border-dashed rounded-lg p-4 mt-4">
                      <h4 className="text-sm font-semibold text-slate-200 mb-3">
                        Add New Lesson
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Lesson Title (no special characters)"
                            value={newLesson[chapter.id]?.title || ""}
                            onChange={(e) =>
                              updateNewLessonState(
                                chapter.id,
                                "title",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {lessonTitleErrors[chapter.id] && (
                            <p className="text-xs text-blue-300 mt-1">
                              {lessonTitleErrors[chapter.id]}
                            </p>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Duration (e.g. 10 mins)"
                          value={newLesson[chapter.id]?.duration || ""}
                          onChange={(e) =>
                            updateNewLessonState(
                              chapter.id,
                              "duration",
                              e.target.value,
                            )
                          }
                          className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <textarea
                          placeholder="Lesson Description"
                          value={newLesson[chapter.id]?.description || ""}
                          onChange={(e) =>
                            updateNewLessonState(
                              chapter.id,
                              "description",
                              e.target.value,
                            )
                          }
                          rows="1"
                          className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                        <button
                          onClick={() => handleAddLesson(chapter.id)}
                          disabled={
                            isCreatingLesson[chapter.id] ||
                            !newLesson[chapter.id]?.title?.trim() ||
                            lessonTitleErrors[chapter.id]
                          }
                          className="md:col-span-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm font-semibold rounded transition"
                        >
                          {isCreatingLesson[chapter.id]
                            ? "Adding..."
                            : "+ Add Lesson"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Chapter Form (at bottom of existing chapters) */}
              <div className="bg-slate-800 border border-blue-500/30 border-dashed rounded-lg p-6 hover:border-blue-500/50 transition mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Add Another Chapter
                </h3>
                <form onSubmit={handleAddChapter} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Chapter Title (no special characters)"
                      value={newChapter.title}
                      onChange={(e) =>
                        updateNewChapterState("title", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    {chapterTitleError && (
                      <p className="text-xs text-blue-300 mt-1">
                        {chapterTitleError}
                      </p>
                    )}
                  </div>
                  <textarea
                    placeholder="Chapter Description"
                    value={newChapter.description}
                    onChange={(e) =>
                      updateNewChapterState("description", e.target.value)
                    }
                    rows="2"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  />
                  <button
                    type="submit"
                    disabled={
                      isCreatingChapter ||
                      !newChapter.title.trim() ||
                      chapterTitleError
                    }
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold rounded-lg transition"
                  >
                    {isCreatingChapter ? "Adding..." : "+ Add Chapter"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 border border-blue-500/30 border-dashed rounded-lg p-6 hover:border-blue-500/50 transition text-center py-12">
              <h3 className="text-xl font-bold text-white mb-2">
                No Chapters Yet
              </h3>
              <p className="text-slate-400 mb-6">
                Create your first chapter to start building the course.
              </p>
              <form
                onSubmit={handleAddChapter}
                className="max-w-md mx-auto space-y-4"
              >
                <div>
                  <input
                    type="text"
                    placeholder="Chapter Title (no special characters)"
                    value={newChapter.title}
                    onChange={(e) =>
                      updateNewChapterState("title", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  {chapterTitleError && (
                    <p className="text-xs text-blue-300 mt-1">
                      {chapterTitleError}
                    </p>
                  )}
                </div>
                <textarea
                  placeholder="Chapter Description"
                  value={newChapter.description}
                  onChange={(e) =>
                    updateNewChapterState("description", e.target.value)
                  }
                  rows="2"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
                <button
                  type="submit"
                  disabled={
                    isCreatingChapter ||
                    !newChapter.title.trim() ||
                    chapterTitleError
                  }
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold rounded-lg transition"
                >
                  {isCreatingChapter ? "Creating..." : "Create First Chapter"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer - Only show if not embedded */}
        {!isEmbedded && (
          <div className="border-t border-slate-700 p-4 bg-slate-900/80">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <ContentUploadModal
          courseId={uploadModal.courseId}
          chapterId={uploadModal.chapterId}
          lessonId={uploadModal.lessonId}
          onUpload={handleUploadContent}
          onClose={() => setUploadModal(null)}
          isLoading={uploading}
        />
      )}
    </div>
  );
}

function getContentIcon(contentType) {
  const icons = {
    video: "📹",
    audio: "🎵",
    document: "📄",
    image: "🖼️",
  };
  return icons[contentType] || "📎";
}

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
