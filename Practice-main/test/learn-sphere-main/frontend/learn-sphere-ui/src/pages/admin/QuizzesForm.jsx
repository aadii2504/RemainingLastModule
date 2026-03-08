
import React, { useState } from "react";

export default function QuizForm({ quizData, setQuizData, onSave }) {
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    options: ["", "", "", ""],
    correct: 0,
  });
  const [editIndex, setEditIndex] = useState(null);

  const cardStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: '#FFFFFF'
  };

  const syncWithParent = (updatedFields) => {
    setQuizData({ ...quizData, ...updatedFields });
  };

  const handleAddOrUpdate = () => {
    if (!currentQuestion.text.trim()) return;
    const questions = quizData?.questions || [];
    let updatedList = editIndex !== null
      ? questions.map((q, i) => (i === editIndex ? currentQuestion : q))
      : [...questions, { ...currentQuestion, id: Date.now() }];

    syncWithParent({ questions: updatedList });
    setCurrentQuestion({ text: "", options: ["", "", "", ""], correct: 0 });
    setEditIndex(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#FFFFFF' }}>
      
      {/* Small UI changes for duration & passing */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '16px', flex: 1 }}>
          <div style={{ fontSize: '12px', opacity: 0.65, marginBottom: '6px' }}>
            Quiz Time (mins)
          </div>
          <input
            type="number"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#FFFFFF',
              outline: 'none',
              width: '100%',
              padding: '10px'
            }}
            value={quizData?.timeLimit ?? 15}
            onChange={(e) => syncWithParent({ timeLimit: Number(e.target.value) })}
          />
        </div>
        <div style={{ ...cardStyle, padding: '16px', flex: 1 }}>
          <div style={{ fontSize: '12px', opacity: 0.65, marginBottom: '6px' }}>
            Minimum Score (%)
          </div>
          <input
            type="number"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#FFFFFF',
              outline: 'none',
              width: '100%',
              padding: '10px'
            }}
            value={quizData?.passingScore ?? 60}
            onChange={(e) => syncWithParent({ passingScore: Number(e.target.value) })}
          />
        </div>
      </div>

      <section style={{ ...cardStyle, padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
          {editIndex !== null ? "Modify Quiz Question" : "Add New Quiz Question"}
        </h2>

        <textarea
          placeholder="Enter the question text here..."
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '12px',
            color: '#FFFFFF',
            height: '80px',
            marginBottom: '20px',
            resize: 'none',
            outline: 'none'
          }}
          value={currentQuestion.text}
          onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {currentQuestion.options.map((opt, i) => (
            <div
              key={i}
              onClick={() => setCurrentQuestion({ ...currentQuestion, correct: i })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'rgba(32, 22, 22, 0.02)',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: '2px solid #FFFFFF',
                  background: currentQuestion.correct === i ? '#FFFFFF' : 'transparent'
                }}
              />
              <input
                placeholder={`Option ${i + 1}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  flex: 1,
                  color: '#FFFFFF',
                  outline: 'none',
                  fontSize: '14px'
                }}
                value={opt}
                onChange={(e) => {
                  const opts = [...currentQuestion.options];
                  opts[i] = e.target.value;
                  setCurrentQuestion({ ...currentQuestion, options: opts });
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {currentQuestion.correct === i && (
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#FFFFFF', letterSpacing: '1px' }}>
                  [CORRECT ANSWER]
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleAddOrUpdate}
          style={{
            width: '100%',
            background: '#0b0c0fff',
            padding: '14px',
            borderRadius: '6px',
            color: '#FFFFFF',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {editIndex !== null ? "Update Question" : "Add Question to List"}
        </button>
      </section>

      <section style={{ ...cardStyle, padding: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', opacity: 0.6 }}>
          Added Questions ({quizData?.questions?.length || 0})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {quizData?.questions?.map((q, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'rgba(14, 14, 27, 0.02)'
              }}
            >
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                  {idx + 1}. {q.text}
                </p>
                <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.8 }}>
                  Correct Choice: {q.options[q.correct]}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setEditIndex(idx);
                    setCurrentQuestion(q);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#FFFFFF',
                    border: '1px solid #FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    const filtered = (quizData?.questions || []).filter((_, i) => i !== idx);
                    syncWithParent({ questions: filtered });
                  }}
                  style={{
                    background: 'transparent',
                    color: '#FFFFFF',
                    opacity: 0.5,
                    border: '1px solid #FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={onSave}
        style={{
          width: '100%',
          background: '#101318ff',
          padding: '18px',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontWeight: 'bold',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          marginTop: '20px',
          letterSpacing: '1px'
        }}
      >
        Finalize & Save Quiz
      </button>
    </div>
  );
}
