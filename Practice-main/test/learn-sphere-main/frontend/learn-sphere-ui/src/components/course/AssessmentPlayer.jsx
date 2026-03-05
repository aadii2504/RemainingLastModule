import React, { useState, useEffect, useRef, useCallback } from "react";
import { assessmentApi } from "../../api/courseApi";
import {
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaRegClock,
  FaTrophy,
  FaRedo,
  FaLock,
  FaCheckCircle,
  FaRegCircle,
} from "react-icons/fa";

/**
 * Student-facing Assessment Player.
 * Redesigned for Udemy-style paginated experience.
 */
export default function AssessmentPlayer({ courseId, onClose }) {
  const [phase, setPhase] = useState("loading"); // loading | locked | eligible | started | result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [eligibility, setEligibility] = useState(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [myAttempts, setMyAttempts] = useState([]);
  const timerRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [eligData, history] = await Promise.all([
        assessmentApi.getEligibility(courseId),
        assessmentApi.getMyAttempts(courseId),
      ]);
      setEligibility(eligData);
      setMyAttempts(history);
      if (!eligData.eligible) setPhase("locked");
      else if (eligData.ongoingAttemptId) {
        await resumeAttempt(eligData);
      } else {
        setPhase("eligible");
      }
    } catch {
      setPhase("locked");
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
    return () => clearInterval(timerRef.current);
  }, [loadData]);

  const resumeAttempt = async (data) => {
    try {
      const sess = await assessmentApi.start(courseId);
      beginSession(sess, data);
    } catch {
      setPhase("eligible");
    }
  };

  const startAssessment = async () => {
    try {
      const sess = await assessmentApi.start(courseId);
      beginSession(sess, eligibility);
    } catch (e) {
      alert(e.message || "Could not start assessment.");
    }
  };

  const beginSession = (sess, eligData) => {
    setSession(sess);
    setAnswers({});
    setChecked({});
    setCurrentIdx(0);

    const elapsed = (Date.now() - new Date(sess.startedAt).getTime()) / 1000;
    const totalSecs =
      (eligData?.timeLimitMinutes ?? sess.timeLimitMinutes) * 60;
    const remaining = Math.max(0, Math.floor(totalSecs - elapsed));
    setTimeLeft(remaining);
    setPhase("started");

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(sess.attemptId, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (attemptId, isAutoSubmit = false) => {
    const aid = attemptId ?? session?.attemptId;
    if (!aid) return;

    if (!isAutoSubmit) {
      const answeredCount = Object.keys(answers).length;
      const totalQuestions = session?.questions?.length || 0;
      const msg = `You have answered ${answeredCount} out of ${totalQuestions} questions.\n\nAre you sure you want to submit your final assessment?`;
      if (!window.confirm(msg)) return;
    }

    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await assessmentApi.submit(aid, answers);
      setResult(res);
      setPhase("result");
    } catch (e) {
      alert("Submit failed: " + (e.message || "error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelect = (questionId, idx, type) => {
    if (checked[questionId]) return;
    if (type === "MCQ") {
      setAnswers((prev) => ({ ...prev, [questionId]: idx }));
    } else {
      setAnswers((prev) => {
        const cur = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        return {
          ...prev,
          [questionId]: cur.includes(idx)
            ? cur.filter((x) => x !== idx)
            : [...cur, idx],
        };
      });
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // UI Renders
  if (phase === "loading")
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );

  if (phase === "locked") {
    const isMaxAttempts = eligibility?.reason === "Maximum attempts reached.";
    return (
      <div className="flex flex-col items-center py-12 text-center max-w-lg mx-auto">
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center text-4xl mb-6 shadow-inner ring-1 ring-white/10">
          <FaLock
            className={isMaxAttempts ? "text-rose-500" : "text-white/20"}
          />
        </div>
        <h2 className="text-3xl font-black mb-3 text-white">
          Assessment Locked
        </h2>
        <p className="text-white/40 mb-10 leading-relaxed px-6">
          {eligibility?.reason ||
            "Please complete all course requirements to unlock the final assessment."}
        </p>

        {!isMaxAttempts && (
          <div className="w-full space-y-6 mb-12 px-2">
            {eligibility && (
              <>
                <ProgBar
                  label="Section Lessons"
                  done={eligibility.lessonsCompleted}
                  total={eligibility.lessonsTotal}
                />
                <ProgBar
                  label="Chapter Quizzes"
                  done={eligibility.quizzesPassed}
                  total={eligibility.quizzesTotal}
                />
              </>
            )}
          </div>
        )}

        <div className="w-full space-y-4">
          {myAttempts.length > 0 && <HistoryTable attempts={myAttempts} />}
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all text-white/60 hover:text-white"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (phase === "eligible") {
    return (
      <div className="flex flex-col py-8 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">🎓</div>
          <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
            Final Assessment
          </h2>
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">
            You are qualified for this certification
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <p className="text-white/30 text-[10px] uppercase font-black mb-2">
              Time Limit
            </p>
            <p className="text-xl font-bold flex items-center gap-2 text-white">
              <FaRegClock className="text-indigo-400" />{" "}
              {eligibility?.timeLimitMinutes} min
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <p className="text-white/30 text-[10px] uppercase font-black mb-2">
              Attempts used
            </p>
            <p className="text-xl font-bold flex items-center gap-2 text-white">
              <FaRedo className="text-indigo-400 text-sm" />{" "}
              {eligibility?.attemptsUsed} of {eligibility?.maxAttempts}
            </p>
          </div>
        </div>

        {myAttempts.length > 0 && (
          <div className="mb-10">
            <HistoryTable attempts={myAttempts} />
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={startAssessment}
            className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
          >
            Start Assessment 🚀
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 text-white/40 font-bold hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (phase === "started" && session) {
    const q = session.questions[currentIdx];
    const opts = Array.isArray(q.options)
      ? q.options
      : JSON.parse(q.options || "[]");
    const selected = answers[q.id];
    const isMulti = q.type === "MultipleSelect";
    const isAnswered = isMulti
      ? Array.isArray(selected) && selected.length > 0
      : selected !== undefined;

    const timerColor =
      timeLeft < 120
        ? "text-rose-500"
        : timeLeft < 300
          ? "text-amber-500"
          : "text-emerald-500";

    return (
      <div className="flex flex-col h-full min-h-[600px] animate-in fade-in duration-500">
        {/* Fixed Top Status */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">
              Final Assessment
            </h3>
          </div>
          <div
            className={`px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3 ${timerColor} transition-colors`}
          >
            <FaRegClock className="text-xs" />
            <span className="font-mono text-xl font-black">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Question Info */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-indigo-400 font-bold text-sm tracking-widest uppercase">
              Question {currentIdx + 1}:
            </span>
            {isMulti && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase font-black border border-indigo-500/20">
                Multiple Choice
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold leading-tight text-white/90">
            {q.text}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3 mb-12 flex-1">
          {opts.map((opt, i) => {
            const isSelected = isMulti
              ? Array.isArray(selected) && selected.includes(i)
              : selected === i;

            return (
              <button
                key={i}
                onClick={() => handleSelect(q.id, i, q.type)}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border text-left transition-all duration-200 group ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div
                  className={`
                                    w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                                    ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-white/20 group-hover:border-white/40"}
                                    ${!isMulti ? "rounded-full" : "rounded"}
                                `}
                >
                  {isSelected && <FaCheck className="text-[10px] text-white" />}
                </div>
                <span className="text-base font-medium flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Controls */}
        <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="p-3 rounded-full hover:bg-white/5 disabled:opacity-0 transition-opacity"
              >
                <FaChevronLeft />
              </button>
              <span className="text-xs font-black text-white/30 uppercase tracking-widest">
                {currentIdx + 1} / {session.questions.length}
              </span>
              <button
                onClick={() =>
                  setCurrentIdx(
                    Math.min(session.questions.length - 1, currentIdx + 1),
                  )
                }
                disabled={currentIdx === session.questions.length - 1}
                className="p-3 rounded-full hover:bg-white/5 disabled:opacity-0 transition-opacity"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-[10px] text-white/30 uppercase font-black">
              {Object.keys(answers).length} of {session.questions.length}{" "}
              Answered
            </span>
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="px-10 py-4 rounded-xl bg-white text-black hover:bg-white/90 font-black text-sm tracking-wide transition-all shadow-xl disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in zoom-in duration-500">
        <div className="text-8xl mb-8">{result.passed ? "🏆" : "😟"}</div>
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
          {result.passed ? "Success!" : "Not quite there"}
        </h2>
        <div className="flex flex-col items-center gap-1 mb-12">
          <p
            className={`text-8xl font-black ${result.passed ? "text-emerald-400" : "text-rose-400"}`}
          >
            {Math.round(result.score)}%
          </p>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest">
            Passing score: {result.passingScore}%
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-12">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-black uppercase text-white/30 mb-1">
              Correct
            </p>
            <p className="text-lg font-bold text-white">
              {result.correct} / {result.total}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-black uppercase text-white/30 mb-1">
              Attempts Remaining
            </p>
            <p className="text-lg font-bold text-white">
              {result.maxAttempts - result.attemptsUsed}
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full max-w-sm">
          {!result.passed && result.attemptsUsed < result.maxAttempts && (
            <button
              onClick={() => loadData()}
              className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all shadow-lg shadow-indigo-600/20"
          >
            {result.passed
              ? "Course Completed Successfully"
              : "Continue Learning"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Sub-components with modern styles ───────────────────────────────────

function ProgBar({ label, done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isDone = pct >= 100;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {isDone ? (
            <FaCheckCircle className="text-emerald-400 text-xs" />
          ) : (
            <FaRegCircle className="text-white/20 text-xs" />
          )}
          <span className="text-xs font-bold text-white/80 uppercase tracking-tight">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-black text-white/30 tracking-widest">
          {done} / {total}
        </span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full transition-all duration-1000 ease-out ${isDone ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HistoryTable({ attempts }) {
  return (
    <div className="w-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-4 bg-white/5 border-b border-white/10">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Attempt History
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {attempts.map((a, i) => (
          <div
            key={i}
            className="flex justify-between items-center text-sm font-bold"
          >
            <span className="text-white/40 tracking-tight">
              Attempt {a.attemptNumber || i + 1}
            </span>
            <div className="flex items-center gap-3">
              <span className={a.passed ? "text-emerald-400" : "text-rose-400"}>
                {a.score !== null ? `${Math.round(a.score)}%` : a.status}
              </span>
              {a.passed ? (
                <FaCheckCircle className="text-emerald-400 text-xs" />
              ) : (
                <FaTimes className="text-rose-400 text-xs" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
