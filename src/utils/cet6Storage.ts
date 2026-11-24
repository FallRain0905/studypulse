import type {
  Cet6ExamRecord,
  Cet6PaperAttemptState,
  Cet6ParsedPaper,
  Cet6Progress,
  Cet6ScoreBreakdown,
  CetLevel,
} from '../types/cet6';
import { getTodayKey } from './storage';

const STORAGE_KEYS: Record<CetLevel, string> = {
  cet4: 'studypulse_cet4_progress_v1',
  cet6: 'studypulse_cet6_progress_v1',
};

export function createInitialCet6Progress(): Cet6Progress {
  return {
    attempts: {},
    examHistory: [],
    bookmarks: [],
    lastOpenedPaperId: null,
    dailyActivity: {},
  };
}

export function loadCetProgress(level: CetLevel): Cet6Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[level]);
    if (!raw) return createInitialCet6Progress();
    const parsed = JSON.parse(raw) as Partial<Cet6Progress>;
    return {
      ...createInitialCet6Progress(),
      ...parsed,
    };
  } catch {
    return createInitialCet6Progress();
  }
}

export function saveCetProgress(level: CetLevel, progress: Cet6Progress): void {
  try {
    localStorage.setItem(STORAGE_KEYS[level], JSON.stringify(progress));
  } catch {
    // ignore storage quota errors
  }
}

export const loadCet6Progress = () => loadCetProgress('cet6');
export const saveCet6Progress = (p: Cet6Progress) => saveCetProgress('cet6', p);

export function createEmptyAttempt(
  paperId: string,
  mode: 'practice' | 'mock' = 'practice'
): Cet6PaperAttemptState {
  return {
    paperId,
    mode,
    answers: {},
    writingSelfScore: 72,
    translationSelfScore: 72,
    submitted: false,
    elapsedSec: 0,
    updatedAt: Date.now(),
  };
}

/**
 * Compute authentic CET-4 / CET-6 710-scale score estimate:
 * - Listening (25 qs): Q1–15 * 7.1 = 106.5, Q16–25 * 14.2 = 142 => 248.5 max
 * - Reading (30 qs): Banked Cloze (10 * 3.55 = 35.5), Long Reading (10 * 7.1 = 71), Careful Reading (10 * 14.2 = 142) => 248.5 max
 * - Writing: 106.5 max (user self-assessment slider)
 * - Translation: 106.5 max (user self-assessment slider)
 * Total = 710
 */
export function computeCet6Score(
  paper: Cet6ParsedPaper,
  answers: Record<number, string>,
  writingSelfScore: number,
  translationSelfScore: number
): Cet6ScoreBreakdown {
  let listeningCorrect = 0;
  let listeningTotal = 0;
  let listeningScore = 0;

  let listeningIdx = 0;
  for (const seg of paper.listening) {
    for (const q of seg.questions) {
      listeningTotal += 1;
      const weight = listeningIdx < 15 ? 7.1 : 14.2;
      listeningIdx += 1;
      if ((answers[q.p] || '').trim().toUpperCase() === q.answer.trim().toUpperCase()) {
        listeningCorrect += 1;
        listeningScore += weight;
      }
    }
  }

  const bankedList = paper.bankedClozes?.length
    ? paper.bankedClozes
    : paper.bankedCloze
      ? [paper.bankedCloze]
      : [];
  let bankedCorrect = 0;
  let bankedTotal = 0;
  for (const bc of bankedList) {
    for (const b of bc.blanks) {
      bankedTotal += 1;
      if ((answers[b.p] || '').trim().toUpperCase() === b.answerKey.trim().toUpperCase()) {
        bankedCorrect += 1;
      }
    }
  }
  const bankedScore = Number((bankedCorrect * 3.55).toFixed(1));

  const longList = paper.longReadings?.length
    ? paper.longReadings
    : paper.longReading
      ? [paper.longReading]
      : [];
  let longCorrect = 0;
  let longTotal = 0;
  for (const lr of longList) {
    for (const s of lr.statements) {
      longTotal += 1;
      if ((answers[s.p] || '').trim().toUpperCase() === s.answer.trim().toUpperCase()) {
        longCorrect += 1;
      }
    }
  }
  const longScore = Number((longCorrect * 7.1).toFixed(1));

  let carefulCorrect = 0;
  let carefulTotal = 0;
  for (const passage of paper.carefulReading) {
    for (const q of passage.questions) {
      carefulTotal += 1;
      if ((answers[q.p] || '').trim().toUpperCase() === q.answer.trim().toUpperCase()) {
        carefulCorrect += 1;
      }
    }
  }
  const carefulScore = Number((carefulCorrect * 14.2).toFixed(1));

  listeningScore = Number(listeningScore.toFixed(1));
  const readingScore = Number((bankedScore + longScore + carefulScore).toFixed(1));
  const wScore = paper.writing ? Math.max(0, Math.min(106.5, writingSelfScore)) : 0;
  const tScore = paper.translations.length > 0 ? Math.max(0, Math.min(106.5, translationSelfScore)) : 0;

  const objectiveCorrect = listeningCorrect + bankedCorrect + longCorrect + carefulCorrect;
  const objectiveTotal = listeningTotal + bankedTotal + longTotal + carefulTotal;

  const totalEstimated710 = Math.min(710, Math.round(listeningScore + readingScore + wScore + tScore));

  return {
    listeningCorrect,
    listeningTotal,
    listeningScore,
    bankedCorrect,
    bankedTotal,
    bankedScore,
    longCorrect,
    longTotal,
    longScore,
    carefulCorrect,
    carefulTotal,
    carefulScore,
    readingScore,
    writingSelfScore: Number(wScore.toFixed(1)),
    translationSelfScore: Number(tScore.toFixed(1)),
    objectiveCorrect,
    objectiveTotal,
    totalEstimated710,
  };
}

export function recordCet6Activity(prev: Cet6Progress, delta = 1): Cet6Progress {
  const today = getTodayKey();
  return {
    ...prev,
    dailyActivity: {
      ...prev.dailyActivity,
      [today]: (prev.dailyActivity[today] ?? 0) + delta,
    },
  };
}

export function appendCet6ExamRecord(prev: Cet6Progress, record: Cet6ExamRecord): Cet6Progress {
  return {
    ...recordCet6Activity(prev, Math.max(1, record.breakdown.objectiveTotal)),
    examHistory: [record, ...prev.examHistory].slice(0, 50),
  };
}
