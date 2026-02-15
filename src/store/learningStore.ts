/**
 * learningStore.ts
 *
 * Zustand store for the "Story Mode" learning feature.
 * Tracks session points, quiz results, and current story state.
 */

import { create } from 'zustand';
import type { SatelliteStory } from '../services/geminiService';

export type LearningPhase = 'idle' | 'loading' | 'story' | 'quiz' | 'results' | 'error';

interface LearningState {
    /** Current phase of the learning flow */
    phase: LearningPhase;
    /** The satellite ID currently being learned about */
    activeSatelliteId: string | null;
    /** Generated story content */
    story: SatelliteStory | null;
    /** Error message if generation failed */
    errorMessage: string | null;
    /** Current paragraph index in story mode */
    currentParagraph: number;
    /** Quiz answers — index = question number, value = selected option index */
    quizAnswers: (number | null)[];
    /** Whether each quiz answer has been submitted/locked */
    quizSubmitted: boolean[];
    /** Current quiz question index */
    currentQuestion: number;
    /** Total session points */
    totalPoints: number;
    /** Points earned in the current quiz */
    currentQuizPoints: number;
    /** Satellites the user has already completed stories for (IDs) */
    completedSatellites: Set<string>;

    // ── Actions ──
    startLearning: (satelliteId: string) => void;
    setStory: (story: SatelliteStory) => void;
    setError: (msg: string) => void;
    nextParagraph: () => void;
    startQuiz: () => void;
    answerQuestion: (questionIdx: number, optionIdx: number) => void;
    submitAnswer: (questionIdx: number) => void;
    nextQuestion: () => void;
    finishQuiz: () => void;
    closeLearning: () => void;
}

const POINTS_PER_CORRECT = 20;

export const useLearningStore = create<LearningState>((set, get) => ({
    phase: 'idle',
    activeSatelliteId: null,
    story: null,
    errorMessage: null,
    currentParagraph: 0,
    quizAnswers: [],
    quizSubmitted: [],
    currentQuestion: 0,
    totalPoints: 0,
    currentQuizPoints: 0,
    completedSatellites: new Set<string>(),

    startLearning: (satelliteId) =>
        set({
            phase: 'loading',
            activeSatelliteId: satelliteId,
            story: null,
            errorMessage: null,
            currentParagraph: 0,
            quizAnswers: [],
            quizSubmitted: [],
            currentQuestion: 0,
            currentQuizPoints: 0,
        }),

    setStory: (story) =>
        set({
            phase: 'story',
            story,
            quizAnswers: new Array(story.quiz.length).fill(null),
            quizSubmitted: new Array(story.quiz.length).fill(false),
        }),

    setError: (msg) =>
        set({ phase: 'error', errorMessage: msg }),

    nextParagraph: () => {
        const { currentParagraph, story } = get();
        if (story && currentParagraph < story.paragraphs.length - 1) {
            set({ currentParagraph: currentParagraph + 1 });
        }
    },

    startQuiz: () =>
        set({ phase: 'quiz', currentQuestion: 0 }),

    answerQuestion: (questionIdx, optionIdx) => {
        const { quizAnswers, quizSubmitted } = get();
        if (quizSubmitted[questionIdx]) return; // already locked
        const next = [...quizAnswers];
        next[questionIdx] = optionIdx;
        set({ quizAnswers: next });
    },

    submitAnswer: (questionIdx) => {
        const { quizAnswers, quizSubmitted, story, currentQuizPoints } = get();
        if (!story) return;
        const nextSubmitted = [...quizSubmitted];
        nextSubmitted[questionIdx] = true;

        const selected = quizAnswers[questionIdx];
        const correct = story.quiz[questionIdx].correctIndex;
        const earned = selected === correct ? POINTS_PER_CORRECT : 0;

        set({
            quizSubmitted: nextSubmitted,
            currentQuizPoints: currentQuizPoints + earned,
        });
    },

    nextQuestion: () => {
        const { currentQuestion, story } = get();
        if (story && currentQuestion < story.quiz.length - 1) {
            set({ currentQuestion: currentQuestion + 1 });
        }
    },

    finishQuiz: () => {
        const { totalPoints, currentQuizPoints, activeSatelliteId, completedSatellites } = get();
        const nextCompleted = new Set(completedSatellites);
        if (activeSatelliteId) nextCompleted.add(activeSatelliteId);
        set({
            phase: 'results',
            totalPoints: totalPoints + currentQuizPoints,
            completedSatellites: nextCompleted,
        });
    },

    closeLearning: () =>
        set({
            phase: 'idle',
            activeSatelliteId: null,
            story: null,
            errorMessage: null,
        }),
}));
