import React, { useState, useEffect } from "react";
import { assessmentApi } from "../../api/courseApi";

const defaultQuestion = () => ({
  text: "",
  type: "MCQ",
  options: ["", "", "", ""],
  correctIndices: [0],
});

export default function AssessmentForm({ courseId, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [meta, setMeta] = useState({
    title: "Final Assessment",
    description: "",
    timeLimitMinutes: 30,
    passingScorePercentage: 70,
    maxAttempts: 2,
    accessDurationDays: "",
  });

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(defaultQuestion());
  const [editIdx, setEditIdx] = useState(null);

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    assessmentApi.getByCourse(courseId).then(data => {
      if (data) {
        setMeta({
          title: data.title || "Final Assessment",
          description: data.description || "",
          timeLimitMinutes: data.timeLimitMinutes ?? 30,
          passingScorePercentage: data.passingScorePercentage ?? 70,
          maxAttempts: data.maxAttempts ?? 2,
          accessDurationDays: data.accessDurationDays ?? "",
        });
        setQuestions((data.questions || []).map(q => ({
          text: q.text,
          type: q.type,
          options: q.options,
          correctIndices: q.correctIndices,
        })));
      }
    }).catch(() => { }).finally(() => setLoading(false));
  }, [courseId]);

  const card = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "#fff" };

  const handleTypeChange = (type) => {
    setCurrent(prev => ({
      ...prev,
      type,
      correctIndices: type === "MCQ" ? [prev.correctIndices[0] ?? 0] : [],
    }));
  };

  const toggleCorrect = (i) => {
    if (current.type === "MCQ") {
      setCurrent(prev => ({ ...prev, correctIndices: [i] }));
    } else {
      setCurrent(prev => {
        const has = prev.correctIndices.includes(i);
        return { ...prev, correctIndices: has ? prev.correctIndices.filter(x => x !== i) : [...prev.correctIndices, i] };
      });
    }
  };

  const handleAddOrUpdate = () => {
    if (!current.text.trim()) return;
    if (editIdx !== null) {
      setQuestions(qs => qs.map((q, i) => i === editIdx ? { ...current } : q));
      setEditIdx(null);
    } else {
      setQuestions(qs => [...qs, { ...current }]);
    }
    setCurrent(defaultQuestion());
  };

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      await assessmentApi.upsert(courseId, {
        ...meta,
        accessDurationDays: meta.accessDurationDays ? +meta.accessDurationDays : null,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.options,
          correctIndices: q.correctIndices,
        })),
      });
      setMsg("✅ Assessment saved!");
      onSaved?.();
    } catch (e) {
      setMsg("❌ " + (e.message || "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: "#fff", padding: 32 }}>Loading assessment...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, color: "#fff" }}>
      {/* Meta section */}
      <div style={{ ...card, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>Assessment Settings</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, opacity: 0.65, display: "block", marginBottom: 4 }}>Title</label>
            <input value={meta.title} onChange={e => setMeta(p => ({ ...p, title: e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", color: "#fff", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.65, display: "block", marginBottom: 4 }}>Time Limit (mins)</label>
            <input type="number" min={1} value={meta.timeLimitMinutes} onChange={e => setMeta(p => ({ ...p, timeLimitMinutes: +e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", color: "#fff", outline: "none", fontSize: 18, fontWeight: 600 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.65, display: "block", marginBottom: 4 }}>Passing Score (%)</label>
            <input type="number" min={0} max={100} value={meta.passingScorePercentage} onChange={e => setMeta(p => ({ ...p, passingScorePercentage: +e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", color: "#fff", outline: "none", fontSize: 18, fontWeight: 600 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.65, display: "block", marginBottom: 4 }}>Max Attempts</label>
            <input type="number" min={1} max={10} value={meta.maxAttempts} onChange={e => setMeta(p => ({ ...p, maxAttempts: +e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", color: "#fff", outline: "none", fontSize: 18, fontWeight: 600 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.65, display: "block", marginBottom: 4 }}>Access Duration (Days)</label>
            <input type="number" min={1} placeholder="e.g. 7" value={meta.accessDurationDays} onChange={e => setMeta(p => ({ ...p, accessDurationDays: e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", color: "#fff", outline: "none", fontSize: 18, fontWeight: 600 }} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12, opacity: 0.65, display: "block", marginBottom: 4 }}>Description</label>
            <textarea value={meta.description} onChange={e => setMeta(p => ({ ...p, description: e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px", color: "#fff", height: 60, resize: "none", outline: "none" }} />
          </div>
        </div>
      </div>

      {/* Question builder */}
      <section style={{ ...card, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          {editIdx !== null ? "Edit Question" : "Add Question"}
        </h2>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {["MCQ", "MultipleSelect"].map(t => (
            <button key={t} onClick={() => handleTypeChange(t)}
              style={{ padding: "6px 16px", borderRadius: 20, border: `2px solid ${current.type === t ? "#6366f1" : "var(--border)"}`, background: current.type === t ? "#6366f1" : "transparent", color: "#fff", fontWeight: current.type === t ? "bold" : "normal", cursor: "pointer", fontSize: 12 }}>
              {t === "MCQ" ? "MCQ" : "Multiple Select"}
            </button>
          ))}
          {current.type === "MultipleSelect" && (
            <span style={{ fontSize: 11, opacity: 0.6, alignSelf: "center" }}>Check all correct answers</span>
          )}
        </div>

        <textarea placeholder="Enter question text..." value={current.text} onChange={e => setCurrent(p => ({ ...p, text: e.target.value }))}
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px", color: "#fff", height: 80, marginBottom: 16, resize: "none", outline: "none" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {current.options.map((opt, i) => {
            const isCorrect = current.correctIndices.includes(i);
            return (
              <div key={i} onClick={() => toggleCorrect(i)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 6, border: `1px solid ${isCorrect ? "#6366f1" : "var(--border)"}`, background: isCorrect ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
                <div style={{ flexShrink: 0, width: 16, height: 16, borderRadius: current.type === "MCQ" ? "50%" : 4, border: `2px solid ${isCorrect ? "#6366f1" : "#fff"}`, background: isCorrect ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isCorrect && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}
                </div>
                <input placeholder={`Option ${i + 1}`} value={opt} onClick={e => e.stopPropagation()}
                  onChange={e => { const opts = [...current.options]; opts[i] = e.target.value; setCurrent(p => ({ ...p, options: opts })); }}
                  style={{ background: "transparent", border: "none", flex: 1, color: "#fff", outline: "none", fontSize: 14 }} />
                {isCorrect && <span style={{ fontSize: 10, fontWeight: "bold", color: "#818cf8", letterSpacing: 1 }}>{current.type === "MCQ" ? "[CORRECT]" : "[✓ CORRECT]"}</span>}
              </div>
            );
          })}
        </div>

        <button onClick={handleAddOrUpdate}
          style={{ width: "100%", background: "#6366f1", padding: 12, borderRadius: 6, color: "#fff", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: 14 }}>
          {editIdx !== null ? "Update Question" : "Add Question"}
        </button>
      </section>

      {/* Questions list */}
      <section style={{ ...card, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: "bold", marginBottom: 14, opacity: 0.6 }}>
          Questions ({questions.length})
        </h2>
        {questions.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No questions yet.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {questions.map((q, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: "bold", margin: 0 }}>{idx + 1}. {q.text}</p>
                <p style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
                  [{q.type}] Correct: {q.correctIndices.map(ci => q.options[ci] || `Option ${ci + 1}`).join(", ")}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                <button onClick={() => { setEditIdx(idx); setCurrent({ ...q, options: [...q.options], correctIndices: [...q.correctIndices] }); }}
                  style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "5px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Edit</button>
                <button onClick={() => setQuestions(qs => qs.filter((_, i) => i !== idx))}
                  style={{ background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", padding: "5px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {msg && <div style={{ padding: "10px 14px", borderRadius: 6, background: msg.startsWith("✅") ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${msg.startsWith("✅") ? "#10b981" : "#ef4444"}`, color: msg.startsWith("✅") ? "#6ee7b7" : "#fca5a5", fontSize: 13 }}>{msg}</div>}

      <button onClick={handleSave} disabled={saving}
        style={{ width: "100%", background: saving ? "rgba(99,102,241,0.4)" : "#6366f1", padding: 18, borderRadius: 8, color: "#fff", fontWeight: "bold", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, letterSpacing: 1 }}>
        {saving ? "Saving..." : "💾 Save Assessment"}
      </button>
    </div>
  );
}