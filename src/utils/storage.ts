import type { OptionKey, UserProgress } from '../types';

const STORAGE_KEY = 'pypulse_review_progress_v1';

export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialProgress(): UserProgress {
  return {
    records: {},
    bookmarks: [],
    notes: {},
    masteredKnowledge: [],
    readTutorialSections: [],
    solvedLabs: [],
    labDrafts: {},
    labBlankDrafts: {},
    flashcards: {},
    streak: 0,
    bestStreak: 0,
    totalAnsweredToday: 0,
    dailyActivity: {},
    examHistory: [],
  };
}

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return {
      ...createInitialProgress(),
      ...parsed,
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage quota ignored
  }
}

export function recordMcqAnswer(
  prev: UserProgress,
  questionId: number,
  selected: OptionKey,
  isCorrect: boolean
): UserProgress {
  const existing = prev.records[questionId] ?? {
    attempts: 0,
    correctCount: 0,
    wrongCount: 0,
    lastSelected: null,
    lastCorrect: null,
    lastTimestamp: 0,
    inMistakeBook: false,
  };

  const today = getTodayKey();
  const nextStreak = isCorrect ? prev.streak + 1 : 0;

  return {
    ...prev,
    streak: nextStreak,
    bestStreak: Math.max(prev.bestStreak, nextStreak),
    dailyActivity: {
      ...prev.dailyActivity,
      [today]: (prev.dailyActivity[today] ?? 0) + 1,
    },
    totalAnsweredToday: (prev.dailyActivity[today] ?? 0) + 1,
    records: {
      ...prev.records,
      [questionId]: {
        attempts: existing.attempts + 1,
        correctCount: existing.correctCount + (isCorrect ? 1 : 0),
        wrongCount: existing.wrongCount + (isCorrect ? 0 : 1),
        lastSelected: selected,
        lastCorrect: isCorrect,
        lastTimestamp: Date.now(),
        inMistakeBook: isCorrect ? existing.inMistakeBook : true,
      },
    },
  };
}
