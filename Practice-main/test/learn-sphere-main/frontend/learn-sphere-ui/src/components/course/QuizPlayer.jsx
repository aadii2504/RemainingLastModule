import React, { useState } from "react";
import { quizApi } from "../../api/courseApi";
import { FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * Student-facing Quiz Player (MCQ only).
 * Paginated Udemy-style interface.
 */
export default function QuizPlayer({ quiz, onClose, onPassed }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
    const [checked, setChecked] = useState({}); // { questionId: boolean } - if answer has been checked
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState((quiz.timeLimitMinutes || 15) * 60);
    const timerRef = React.useRef(null);

    React.useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return <div className="p-10 text-center text-white/40">No questions in this quiz.</div>;
    }

    const currentQuestion = quiz.questions[currentIdx];
    const options = Array.isArray(currentQuestion.options)
        ? currentQuestion.options
        : (JSON.parse(currentQuestion.options || "[]"));

    const handleSelect = (idx) => {
        if (checked[currentQuestion.id]) return; // locked after check
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: idx }));
    };

    const handleCheck = () => {
        if (answers[currentQuestion.id] === undefined) return;
        setChecked(prev => ({ ...prev, [currentQuestion.id]: true }));
    };

    const handleNext = () => {
        if (currentIdx < quiz.questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        if (!isAutoSubmit && !window.confirm("Submit your quiz answers?")) return;

        setSubmitting(true);
        clearInterval(timerRef.current);
        try {
            const res = await quizApi.submit(quiz.id, answers);
            setResult(res);
            if (res.passed) onPassed?.();
        } catch (e) {
            alert("Failed to submit quiz: " + (e.message || "Unknown error"));
        } finally {
            setSubmitting(false);
        }
    };

    if (result) {
        const pct = Math.round(result.score);
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="text-7xl mb-6">{result.passed ? "🎉" : "😕"}</div>
                <h2 className="text-3xl font-black text-white mb-2">
                    {result.passed ? "You passed!" : "Keep practicing!"}
                </h2>
                <div className="flex flex-col items-center gap-1 mb-10">
                    <p className={`text-6xl font-black ${result.passed ? "text-emerald-400" : "text-rose-400"}`}>
                        {pct}%
                    </p>
                    <p className="text-white/40 text-sm font-medium uppercase tracking-widest">
                        {result.correct} of {result.total} correct
                    </p>
                </div>

                {!result.passed && (
                    <div className="max-w-md bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-10 text-rose-200 text-sm leading-relaxed">
                        You need {quiz.passingScorePercentage}% to pass this quiz. Review the material in this section and try again to improve your score.
                    </div>
                )}

                <div className="flex gap-4 w-full max-w-sm">
                    {!result.passed && (
                        <button
                            onClick={() => { setResult(null); setAnswers({}); setChecked({}); setCurrentIdx(0); }}
                            className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all"
                        >
                            Retry Quiz
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {result.passed ? "Finish & Continue" : "Exit Quiz"}
                    </button>
                </div>
            </div>
        );
    }

    const isAnswered = answers[currentQuestion.id] !== undefined;
    const isChecked = checked[currentQuestion.id];
    const selectedIdx = answers[currentQuestion.id];
    const isCorrect = isChecked && selectedIdx === currentQuestion.correctIndex;

    return (
        <div className="flex flex-col min-h-[500px] h-full bg-transparent text-white">
            {/* Header Area */}
            <div className="pb-8 mb-8 border-b border-white/5 flex items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-indigo-400 font-bold text-sm tracking-widest uppercase mb-3">
                        Question {currentIdx + 1}:
                    </p>
                    <h2 className="text-2xl font-bold leading-tight text-white/90">
                        {currentQuestion.text}
                    </h2>
                </div>
                <div className={`px-5 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1 min-w-[100px] transition-colors ${timeLeft < 120 ? 'text-rose-500 border-rose-500/30' : 'text-indigo-400'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Time Left</span>
                    <span className="text-2xl font-black font-mono">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* Options Area */}
            <div className="flex-1 space-y-3 mb-12">
                {options.map((opt, i) => {
                    const isSelected = selectedIdx === i;
                    let stateClasses = "border-white/10 bg-white/5 hover:bg-white/10";

                    if (isSelected) {
                        stateClasses = "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500";
                    }

                    if (isChecked) {
                        if (i === currentQuestion.correctIndex) {
                            stateClasses = "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 text-emerald-100";
                        } else if (isSelected && i !== currentQuestion.correctIndex) {
                            stateClasses = "border-rose-500 bg-rose-500/10 ring-1 ring-rose-500 text-rose-100";
                        } else {
                            stateClasses = "border-white/5 opacity-40 grayscale";
                        }
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            disabled={isChecked}
                            className={`w-full flex items-center gap-4 p-5 rounded-xl border text-left transition-all duration-200 group ${stateClasses}`}
                        >
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                                ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-white/20 group-hover:border-white/40"}
                                ${isChecked && i === currentQuestion.correctIndex ? "border-emerald-500 bg-emerald-500" : ""}
                                ${isChecked && isSelected && i !== currentQuestion.correctIndex ? "border-rose-500 bg-rose-500" : ""}
                            `}>
                                {(isSelected || (isChecked && i === currentQuestion.correctIndex)) && <FaCheck className="text-[10px] text-white" />}
                            </div>
                            <span className="text-base font-medium flex-1">{opt}</span>
                        </button>
                    );
                })}
            </div>

            {/* Bottom Controls */}
            <div className="mt-auto pt-8 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 order-2 md:order-1">
                    <button
                        onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                        disabled={currentIdx === 0}
                        className="p-3 rounded-full hover:bg-white/5 disabled:opacity-0 transition-opacity"
                    >
                        <FaChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                        Question {currentIdx + 1} of {quiz.questions.length}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={!isChecked && !isAnswered && currentIdx < quiz.questions.length - 1}
                        className="p-3 rounded-full hover:bg-white/5 disabled:opacity-0 transition-opacity"
                    >
                        <FaChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3 order-1 md:order-2">
                    {!isChecked ? (
                        <>
                            <button
                                onClick={handleNext}
                                className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide hover:bg-white/5 transition-colors"
                            >
                                Skip question
                            </button>
                            <button
                                onClick={handleCheck}
                                disabled={!isAnswered}
                                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-sm tracking-wide transition-all"
                            >
                                Check answer
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 rounded-xl bg-white text-black hover:bg-white/90 font-black text-sm tracking-wide transition-all shadow-xl"
                        >
                            {currentIdx === quiz.questions.length - 1 ? "End Quiz & View Results" : "Next Question"}
                        </button>
                    )}
                </div>
            </div>

            {/* Absolute Bottom Tip if checked */}
            {isChecked && (
                <div className={`mt-6 p-4 rounded-xl border animate-in slide-in-from-bottom-2 duration-300 ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    <div className="flex items-center gap-3 font-black text-sm uppercase tracking-wider">
                        {isCorrect ? <><FaCheck /> Correct!</> : <><FaTimes /> Incorrect</>}
                    </div>
                </div>
            )}
        </div>
    );
}
