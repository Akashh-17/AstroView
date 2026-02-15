/**
 * SatelliteLearning.tsx
 *
 * Full learning experience that replaces the right info panel content.
 * Contains: loading state → story paragraphs → quiz → results.
 * Powered by Gemini 2.0 Flash.
 */

import { useEffect, useCallback } from 'react';
import { useLearningStore } from '../../store/learningStore';
import { generateSatelliteStory } from '../../services/geminiService';
import { useSatelliteStore } from '../../store/satelliteStore';
import { SATELLITE_CATEGORIES } from '../../data/satelliteData';
import { twoline2satrec } from 'satellite.js';

/* ── MISSION_META (duplicated keys for description lookup) ──────────── */
const MISSION_DESC: Record<string, string> = {
    'ISS (ZARYA)': 'International Space Station – crewed orbital laboratory.',
    'CSS (TIANHE)': 'Tiangong – China\'s modular space station in LEO.',
    HST: 'Hubble Space Telescope – iconic optical/UV observatory.',
    TERRA: 'Earth-observing satellite studying climate & weather.',
    AQUA: 'Earth Observation satellite focused on the water cycle.',
    JWST: 'James Webb Space Telescope – infrared observatory at L2.',
};

/* ── Main component ─────────────────────────────────────────────────── */
export default function SatelliteLearning() {
    const phase = useLearningStore((s) => s.phase);
    const story = useLearningStore((s) => s.story);
    const errorMessage = useLearningStore((s) => s.errorMessage);
    const activeSatelliteId = useLearningStore((s) => s.activeSatelliteId);
    const closeLearning = useLearningStore((s) => s.closeLearning);

    const satellites = useSatelliteStore((s) => s.satellites);

    // Find the satellite and derive info for the API call
    const sat = satellites.find((s) => s.id === activeSatelliteId) ?? null;
    const category = sat
        ? SATELLITE_CATEGORIES.find((c) => c.id === sat.category)
        : null;

    const orbitType = (() => {
        if (!sat) return 'Unknown';
        try {
            const satrec = twoline2satrec(sat.tle.line1, sat.tle.line2);
            const mu = 398600.4418;
            const n = satrec.no / 60;
            const a = Math.pow(mu / (n * n), 1 / 3);
            const avgAlt = a - 6371;
            if (avgAlt < 2000) return 'LEO';
            if (avgAlt < 35000) return 'MEO';
            if (avgAlt >= 35000 && avgAlt < 36500) return 'GEO';
            return 'HEO';
        } catch {
            return 'Unknown';
        }
    })();

    // Trigger story generation when learning starts
    const setStory = useLearningStore((s) => s.setStory);
    const setError = useLearningStore((s) => s.setError);

    useEffect(() => {
        if (phase !== 'loading' || !sat) return;
        let cancelled = false;

        generateSatelliteStory(
            sat.name,
            category?.label ?? sat.category,
            orbitType,
            sat.alt,
            MISSION_DESC[sat.name],
        )
            .then((result) => {
                if (!cancelled) setStory(result);
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, sat?.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg" onClick={(e) => { if (e.target === e.currentTarget) closeLearning(); }}>
            <div className="relative w-full max-w-3xl max-h-[92vh] mx-6 bg-gradient-to-b from-[#0d1220] to-[#080c16] rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 pt-7 pb-5 flex items-center justify-between border-b border-white/[0.08]">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-xl">🚀</span>
                            <span className="text-[13px] font-bold tracking-[0.15em] uppercase text-[#FFD700]">
                                Story Mode
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white leading-tight">
                            {sat?.name ?? 'Satellite'}
                        </h2>
                    </div>
                    <button
                        onClick={closeLearning}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-red-500/20 border border-white/[0.1] hover:border-red-500/40 text-white/50 hover:text-red-400 transition-all"
                        title="Close story mode"
                    >
                        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M2 2l8 8M10 2l-8 8" />
                        </svg>
                    </button>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto">
                    {phase === 'loading' && <LoadingState />}
                    {phase === 'error' && <ErrorState message={errorMessage} onRetry={closeLearning} />}
                    {phase === 'story' && story && <StoryView />}
                    {phase === 'quiz' && story && <QuizView />}
                    {phase === 'results' && <ResultsView onClose={closeLearning} />}
                </div>
            </div>
        </div>
    );
}

/* ── LOADING STATE ──────────────────────────────────────────────────── */
function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-8">
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-3 border-[#FFD700]/20 rounded-full" />
                <div className="absolute inset-0 border-3 border-transparent border-t-[#FFD700] rounded-full animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-4xl">🛰️</span>
            </div>
            <p className="text-[16px] text-white/50 text-center leading-relaxed">
                AstroGuide is preparing your<br />
                satellite story...
            </p>
            <div className="mt-6 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full bg-[#FFD700]/40 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    );
}

/* ── ERROR STATE ────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-10">
            <span className="text-5xl mb-5">⚠️</span>
            <p className="text-[15px] text-red-400/80 text-center leading-relaxed mb-6 max-w-md">
                {message || 'Something went wrong.'}
            </p>
            <button
                onClick={onRetry}
                className="px-6 py-2.5 rounded-xl text-[14px] font-medium bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/60 hover:text-white transition-all"
            >
                Go Back
            </button>
        </div>
    );
}

/* ── STORY VIEW ─────────────────────────────────────────────────────── */
function StoryView() {
    const story = useLearningStore((s) => s.story)!;
    const currentParagraph = useLearningStore((s) => s.currentParagraph);
    const nextParagraph = useLearningStore((s) => s.nextParagraph);
    const startQuiz = useLearningStore((s) => s.startQuiz);

    const isLastParagraph = currentParagraph >= story.paragraphs.length - 1;

    return (
        <div className="px-8 py-6">
            {/* Story title */}
            <h3 className="text-xl font-bold text-[#FFD700] mb-5 leading-snug">
                {story.title}
            </h3>

            {/* Paragraphs revealed so far */}
            <div className="space-y-4 mb-6">
                {story.paragraphs.slice(0, currentParagraph + 1).map((p, i) => (
                    <p
                        key={i}
                        className="text-[15px] text-white/75 leading-relaxed animate-fadeIn"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    >
                        {p}
                    </p>
                ))}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-5">
                {story.paragraphs.map((_, i) => (
                    <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            i <= currentParagraph
                                ? 'bg-[#FFD700] scale-110'
                                : 'bg-white/15'
                        }`}
                    />
                ))}
            </div>

            {/* Navigation */}
            {!isLastParagraph ? (
                <button
                    onClick={nextParagraph}
                    className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/20 hover:border-[#FFD700]/40 text-[#FFD700] transition-all"
                >
                    Continue Reading →
                </button>
            ) : (
                <div className="space-y-4">
                    {/* Fun fact */}
                    <div className="p-4 rounded-xl bg-[#4A9EFF]/8 border border-[#4A9EFF]/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">💡</span>
                            <span className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#4A9EFF]/80">
                                Fun Fact
                            </span>
                        </div>
                        <p className="text-[14px] text-[#4A9EFF]/90 leading-relaxed">
                            {story.funFact}
                        </p>
                    </div>

                    {/* Start quiz button */}
                    <button
                        onClick={startQuiz}
                        className="w-full py-3.5 rounded-xl text-[15px] font-bold bg-gradient-to-r from-[#FFD700]/20 to-[#FF6B35]/20 hover:from-[#FFD700]/30 hover:to-[#FF6B35]/30 border border-[#FFD700]/30 text-[#FFD700] transition-all shadow-lg shadow-[#FFD700]/5"
                    >
                        🎯 Take the Quiz ({story.quiz.length} questions)
                    </button>
                </div>
            )}

            {/* Inline animation style */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out both;
                }
            `}</style>
        </div>
    );
}

/* ── QUIZ VIEW ──────────────────────────────────────────────────────── */
function QuizView() {
    const story = useLearningStore((s) => s.story)!;
    const currentQuestion = useLearningStore((s) => s.currentQuestion);
    const quizAnswers = useLearningStore((s) => s.quizAnswers);
    const quizSubmitted = useLearningStore((s) => s.quizSubmitted);
    const answerQuestion = useLearningStore((s) => s.answerQuestion);
    const submitAnswer = useLearningStore((s) => s.submitAnswer);
    const nextQuestion = useLearningStore((s) => s.nextQuestion);
    const finishQuiz = useLearningStore((s) => s.finishQuiz);

    const q = story.quiz[currentQuestion];
    const selectedOption = quizAnswers[currentQuestion];
    const isSubmitted = quizSubmitted[currentQuestion];
    const isLastQuestion = currentQuestion >= story.quiz.length - 1;

    const handleSelect = useCallback(
        (optionIdx: number) => {
            if (!isSubmitted) answerQuestion(currentQuestion, optionIdx);
        },
        [currentQuestion, isSubmitted, answerQuestion],
    );

    const handleSubmit = useCallback(() => {
        if (selectedOption !== null && !isSubmitted) {
            submitAnswer(currentQuestion);
        }
    }, [selectedOption, isSubmitted, currentQuestion, submitAnswer]);

    const handleNext = useCallback(() => {
        if (isLastQuestion) finishQuiz();
        else nextQuestion();
    }, [isLastQuestion, finishQuiz, nextQuestion]);

    return (
        <div className="px-8 py-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-5">
                <span className="text-[13px] font-bold tracking-[0.15em] uppercase text-white/40">
                    Question {currentQuestion + 1} of {story.quiz.length}
                </span>
                <div className="flex gap-1.5">
                    {story.quiz.map((_, i) => (
                        <div
                            key={i}
                            className={`w-6 h-1.5 rounded-full transition-all ${
                                i < currentQuestion
                                    ? quizAnswers[i] === story.quiz[i].correctIndex
                                        ? 'bg-[#4AFF7C]'
                                        : 'bg-red-400'
                                    : i === currentQuestion
                                        ? 'bg-[#FFD700]'
                                        : 'bg-white/10'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Question */}
            <p className="text-[17px] text-white/90 font-semibold leading-relaxed mb-5">
                {q.question}
            </p>

            {/* Options */}
            <div className="space-y-3 mb-5">
                {q.options.map((opt, i) => {
                    let borderColor = 'border-white/[0.08]';
                    let bgColor = 'bg-white/[0.03]';
                    let textColor = 'text-white/60';
                    let ring = '';

                    if (selectedOption === i && !isSubmitted) {
                        borderColor = 'border-[#FFD700]/40';
                        bgColor = 'bg-[#FFD700]/8';
                        textColor = 'text-[#FFD700]';
                        ring = 'ring-1 ring-[#FFD700]/20';
                    }

                    if (isSubmitted) {
                        if (i === q.correctIndex) {
                            borderColor = 'border-[#4AFF7C]/40';
                            bgColor = 'bg-[#4AFF7C]/10';
                            textColor = 'text-[#4AFF7C]';
                        } else if (selectedOption === i) {
                            borderColor = 'border-red-400/40';
                            bgColor = 'bg-red-400/10';
                            textColor = 'text-red-400';
                        }
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            disabled={isSubmitted}
                            className={`w-full text-left px-5 py-3.5 rounded-xl border ${borderColor} ${bgColor} ${ring} transition-all ${
                                isSubmitted ? 'cursor-default' : 'hover:bg-white/[0.06] cursor-pointer'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`text-[14px] font-bold mt-0.5 ${textColor}`}>
                                    {String.fromCharCode(65 + i)}.
                                </span>
                                <span className={`text-[15px] leading-relaxed ${textColor}`}>
                                    {opt}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Explanation (after submit) */}
            {isSubmitted && (
                <div className="p-4 rounded-xl bg-[#4A9EFF]/8 border border-[#4A9EFF]/20 mb-5 animate-fadeIn">
                    <p className="text-[14px] text-[#4A9EFF]/85 leading-relaxed">
                        {selectedOption === q.correctIndex ? '✅ ' : '❌ '}
                        {q.explanation}
                    </p>
                </div>
            )}

            {/* Actions */}
            {!isSubmitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className={`w-full py-3.5 rounded-xl text-[15px] font-semibold border transition-all ${
                        selectedOption !== null
                            ? 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20'
                            : 'bg-white/[0.03] border-white/[0.06] text-white/20 cursor-not-allowed'
                    }`}
                >
                    Submit Answer
                </button>
            ) : (
                <button
                    onClick={handleNext}
                    className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] transition-all"
                >
                    {isLastQuestion ? '🏆 See Results' : 'Next Question →'}
                </button>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out both;
                }
            `}</style>
        </div>
    );
}

/* ── RESULTS VIEW ───────────────────────────────────────────────────── */
function ResultsView({ onClose }: { onClose: () => void }) {
    const story = useLearningStore((s) => s.story)!;
    const quizAnswers = useLearningStore((s) => s.quizAnswers);
    const currentQuizPoints = useLearningStore((s) => s.currentQuizPoints);
    const totalPoints = useLearningStore((s) => s.totalPoints);
    const completedSatellites = useLearningStore((s) => s.completedSatellites);

    const correctCount = story.quiz.reduce(
        (acc, q, i) => acc + (quizAnswers[i] === q.correctIndex ? 1 : 0),
        0,
    );
    const totalQuestions = story.quiz.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const grade =
        percentage >= 80
            ? { emoji: '🌟', label: 'Excellent!', color: '#FFD700' }
            : percentage >= 60
                ? { emoji: '👍', label: 'Good Job!', color: '#4AFF7C' }
                : percentage >= 40
                    ? { emoji: '📚', label: 'Keep Learning!', color: '#FFaa40' }
                    : { emoji: '💪', label: 'Try Again!', color: '#FF6B6B' };

    return (
        <div className="px-8 py-8 flex flex-col items-center">
            {/* Big emoji */}
            <span className="text-6xl mb-4">{grade.emoji}</span>
            <h3 className="text-2xl font-bold mb-2" style={{ color: grade.color }}>
                {grade.label}
            </h3>
            <p className="text-[14px] text-white/50 mb-6">
                {story.title}
            </p>

            {/* Score card */}
            <div className="w-full max-w-md p-6 rounded-2xl bg-white/[0.04] border border-white/[0.1] mb-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-3xl font-bold text-white">
                            {correctCount}/{totalQuestions}
                        </div>
                        <div className="text-[12px] text-white/40 mt-1">Correct</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-[#FFD700]">
                            +{currentQuizPoints}
                        </div>
                        <div className="text-[12px] text-white/40 mt-1">Points</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-[#4A9EFF]">
                            {totalPoints}
                        </div>
                        <div className="text-[12px] text-white/40 mt-1">Total</div>
                    </div>
                </div>
            </div>

            {/* Completed count */}
            <div className="w-full max-w-md p-4 rounded-xl bg-[#4A9EFF]/6 border border-[#4A9EFF]/15 mb-6">
                <div className="flex items-center gap-2.5">
                    <span className="text-lg">🛰️</span>
                    <span className="text-[14px] text-[#4A9EFF]/85">
                        You've explored {completedSatellites.size} satellite{completedSatellites.size !== 1 ? 's' : ''} so far!
                    </span>
                </div>
            </div>

            {/* Close */}
            <button
                onClick={onClose}
                className="w-full max-w-md py-3.5 rounded-xl text-[15px] font-medium bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/60 hover:text-white transition-all"
            >
                ← Back to Satellite Info
            </button>
        </div>
    );
}
