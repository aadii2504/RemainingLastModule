import React, { useState, useEffect } from "react";
import { quizApi } from "../../../api/courseApi";
import { validateTitle } from "./titleValidator";

const defaultQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
});
const defaultQuiz = () => ({
  title: "",
  description: "",
  timeLimitMinutes: 15,
  passingScorePercentage: 60,
  questions: [],
});

/**
 * Admin Quiz Manager
 * Lists and manages quizzes for each chapter in a course structure.
 * Pass structure = { chapters: [...] } and courseId.
 */
export default function QuizManager({ courseId, structure }) {
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null); // null | quiz object
  const [form, setForm] = useState(defaultQuiz());
  const [current, setCurrent] = useState(defaultQuestion());
  const [editQIdx, setEditQIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [quizTitleError, setQuizTitleError] = useState("");

  const chapters = structure?.chapters || [];

  const card = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "#fff",
  };

  useEffect(() => {
    if (!chapters.length) return;
    // Load quizzes for all chapters
    Promise.all(
      chapters.map((ch) =>
        quizApi
          .getByChapter(ch.id)
          .then((quizzes) => ({ chapterId: ch.id, quizzes }))
          .catch(() => ({ chapterId: ch.id, quizzes: [] })),
      ),
    ).then((results) => {
      const map = {};
      results.forEach((r) => {
        map[r.chapterId] = r.quizzes;
      });
      setQuizzesByChapter(map);
    });
  }, [JSON.stringify(chapters.map((c) => c.id))]);

  const openNewQuiz = (chapterId) => {
    setActiveChapterId(chapterId);
    setEditingQuiz("new");
    setForm(defaultQuiz());
    setCurrent(defaultQuestion());
    setEditQIdx(null);
    setMsg("");
    setQuizTitleError("");
  };

  const openEditQuiz = (chapterId, quiz) => {
    setActiveChapterId(chapterId);
    setEditingQuiz(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description || "",
      timeLimitMinutes: quiz.timeLimitMinutes,
      passingScorePercentage: quiz.passingScorePercentage,
      questions: (quiz.questions || []).map((q) => ({
        text: q.text,
        options: Array.isArray(q.options)
          ? q.options
          : JSON.parse(q.options || "[]"),
        correctIndex: q.correctIndex,
      })),
    });
    setCurrent(defaultQuestion());
    setEditQIdx(null);
    setMsg("");
    setQuizTitleError("");
  };

  const addOrUpdateQuestion = () => {
    if (!current.text.trim()) return;
    if (editQIdx !== null) {
      setForm((f) => ({
        ...f,
        questions: f.questions.map((q, i) =>
          i === editQIdx ? { ...current } : q,
        ),
      }));
      setEditQIdx(null);
    } else {
      setForm((f) => ({ ...f, questions: [...f.questions, { ...current }] }));
    }
    setCurrent(defaultQuestion());
  };

  const saveQuiz = async () => {
    if (!form.title.trim()) {
      setMsg("Quiz title is required.");
      return;
    }

    // Validate title
    const validation = validateTitle(form.title);
    if (!validation.isValid) {
      setMsg("❌ " + validation.error);
      return;
    }

    setSaving(true);
    setMsg("");
    const payload = {
      chapterId: activeChapterId,
      ...form,
      questions: form.questions,
    };
    try {
      if (editingQuiz === "new") {
        const created = await quizApi.create(payload);
        setQuizzesByChapter((prev) => ({
          ...prev,
          [activeChapterId]: [...(prev[activeChapterId] || []), created],
        }));
      } else {
        const updated = await quizApi.update(editingQuiz.id, payload);
        setQuizzesByChapter((prev) => ({
          ...prev,
          [activeChapterId]: (prev[activeChapterId] || []).map((q) =>
            q.id === updated.id ? updated : q,
          ),
        }));
      }
      setMsg("✅ Quiz saved!");
      setEditingQuiz(null);
    } catch (e) {
      setMsg("❌ " + (e.message || "Failed to save quiz."));
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (chapterId, quizId) => {
    if (!window.confirm("Delete this quiz?")) return;
    await quizApi.delete(quizId).catch(() => {});
    setQuizzesByChapter((prev) => ({
      ...prev,
      [chapterId]: (prev[chapterId] || []).filter((q) => q.id !== quizId),
    }));
  };

  if (editingQuiz !== null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <button
          onClick={() => setEditingQuiz(null)}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "1px solid var(--border)",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ← Back to Quiz List
        </button>

        <div style={{ ...card, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 18 }}>
            {editingQuiz === "new" ? "Create Quiz" : "Edit Quiz"}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ gridColumn: "1/-1" }}>
              <label
                style={{
                  fontSize: 12,
                  opacity: 0.65,
                  marginBottom: 4,
                  display: "block",
                }}
              >
                Quiz Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  // Real-time validation
                  if (!e.target.value.trim()) {
                    setQuizTitleError("");
                  } else {
                    const validation = validateTitle(e.target.value);
                    setQuizTitleError(
                      validation.isValid ? "" : validation.error,
                    );
                  }
                }}
                placeholder="Enter quiz title (no special characters)"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: quizTitleError
                    ? "1px solid #ef4444"
                    : "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  color: "#fff",
                  outline: "none",
                }}
              />
              {quizTitleError && (
                <p style={{ fontSize: 11, color: "#60a5fa", marginTop: 4 }}>
                  {quizTitleError}
                </p>
              )}
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  opacity: 0.65,
                  marginBottom: 4,
                  display: "block",
                }}
              >
                Time Limit (mins)
              </label>
              <input
                type="number"
                min={1}
                value={form.timeLimitMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timeLimitMinutes: +e.target.value }))
                }
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  color: "#fff",
                  outline: "none",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  opacity: 0.65,
                  marginBottom: 4,
                  display: "block",
                }}
              >
                Passing Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.passingScorePercentage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    passingScorePercentage: +e.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  color: "#fff",
                  outline: "none",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              />
            </div>
          </div>
        </div>

        {/* Question Builder */}
        <section style={{ ...card, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 14 }}>
            {editQIdx !== null ? "Edit Question" : "Add Question"}
          </h2>
          <textarea
            placeholder="Question text..."
            value={current.text}
            onChange={(e) =>
              setCurrent((p) => ({ ...p, text: e.target.value }))
            }
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 10,
              color: "#fff",
              height: 72,
              marginBottom: 14,
              resize: "none",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {current.options.map((opt, i) => {
              const isCorrect = current.correctIndex === i;
              return (
                <div
                  key={i}
                  onClick={() => setCurrent((p) => ({ ...p, correctIndex: i }))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    borderRadius: 6,
                    border: `1px solid ${isCorrect ? "#6366f1" : "var(--border)"}`,
                    background: isCorrect
                      ? "rgba(99,102,241,0.1)"
                      : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: `2px solid ${isCorrect ? "#6366f1" : "#fff"}`,
                      background: isCorrect ? "#6366f1" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const opts = [...current.options];
                      opts[i] = e.target.value;
                      setCurrent((p) => ({ ...p, options: opts }));
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      flex: 1,
                      color: "#fff",
                      outline: "none",
                      fontSize: 14,
                    }}
                  />
                  {isCorrect && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#818cf8",
                        fontWeight: "bold",
                      }}
                    >
                      [CORRECT]
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={addOrUpdateQuestion}
            style={{
              width: "100%",
              background: "#6366f1",
              padding: 12,
              borderRadius: 6,
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
            }}
          >
            {editQIdx !== null ? "Update Question" : "Add Question"}
          </button>
        </section>

        {/* Questions List */}
        <section style={{ ...card, padding: 18 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: "bold",
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            Questions ({form.questions.length})
          </h2>
          {form.questions.length === 0 && (
            <p style={{ opacity: 0.4, fontSize: 13 }}>No questions yet.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.questions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: "bold", margin: 0 }}>
                    {idx + 1}. {q.text}
                  </p>
                  <p style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>
                    Correct: {q.options[q.correctIndex]}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setEditQIdx(idx);
                      setCurrent({ ...q });
                    }}
                    style={{
                      background: "transparent",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.3)",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        questions: f.questions.filter((_, i) => i !== idx),
                      }))
                    }
                    style={{
                      background: "transparent",
                      color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.4)",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {msg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              background: msg.startsWith("✅")
                ? "rgba(16,185,129,0.15)"
                : "rgba(239,68,68,0.15)",
              color: msg.startsWith("✅") ? "#6ee7b7" : "#fca5a5",
              fontSize: 13,
            }}
          >
            {msg}
          </div>
        )}

        <button
          onClick={saveQuiz}
          disabled={saving || quizTitleError}
          style={{
            width: "100%",
            background:
              saving || quizTitleError ? "rgba(5,150,105,0.5)" : "#059669",
            padding: 16,
            borderRadius: 8,
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            cursor: saving || quizTitleError ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {saving ? "Saving..." : "💾 Save Quiz"}
        </button>
      </div>
    );
  }

  // Default: chapter list view
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>
        Manage quizzes for each chapter. Students must pass all quizzes to
        unlock the final assessment.
      </p>
      {chapters.length === 0 && (
        <p style={{ opacity: 0.5 }}>
          No chapters found. Add chapters in the Structure tab first.
        </p>
      )}
      {chapters.map((ch) => (
        <div key={ch.id} style={{ ...card, padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ fontSize: 14, fontWeight: "bold", margin: 0 }}>
                Section {ch.order}: {ch.title}
              </h3>
              <p style={{ fontSize: 11, opacity: 0.5, marginTop: 3 }}>
                {(quizzesByChapter[ch.id] || []).length} quiz(zes)
              </p>
            </div>
            <button
              onClick={() => openNewQuiz(ch.id)}
              style={{
                background: "#6366f1",
                border: "none",
                color: "#fff",
                padding: "7px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              + Add Quiz
            </button>
          </div>
          {(quizzesByChapter[ch.id] || []).length === 0 ? (
            <p style={{ fontSize: 12, opacity: 0.4 }}>
              No quizzes for this chapter yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(quizzesByChapter[ch.id] || []).map((quiz) => (
                <div
                  key={quiz.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: "bold", margin: 0 }}>
                      📝 {quiz.title}
                    </p>
                    <p style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>
                      {(quiz.questions || []).length} questions ·{" "}
                      {quiz.timeLimitMinutes} mins · Pass:{" "}
                      {quiz.passingScorePercentage}%
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEditQuiz(ch.id, quiz)}
                      style={{
                        background: "transparent",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.3)",
                        padding: "5px 12px",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuiz(ch.id, quiz.id)}
                      style={{
                        background: "transparent",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.4)",
                        padding: "5px 12px",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
