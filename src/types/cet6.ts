export type CetLevel = 'cet4' | 'cet6';

export type Cet6PaperKind = 'full' | 'no-listening' | 'partial' | 'translation' | 'reading-pack';

export interface Cet6PaperSummary {
  id: string; // e.g. "2025年06月/2025年06月-(1)"
  examId: string | null;
  yearMonth: string; // e.g. "2025年06月" or "其它"
  year: number; // 2025 or 0 for 其它
  folder: string; // e.g. "2025年06月-(1)"
  title: string; // e.g. "2025年06月 六级真题（第1套）"
  questionCount: number;
  audioCount: number;
  kind: Cet6PaperKind;
  hasListening: boolean;
  hasWriting: boolean;
  hasBankedCloze: boolean;
  hasLongReading: boolean;
  hasCarefulReading: boolean;
  hasTranslation: boolean;
}

export interface Cet6Option {
  key: string;
  text: string;
}

export interface Cet6WritingPart {
  p: number;
  prompt: string;
  modelEssay: string;
  explanation: string;
}

export interface Cet6ListeningQuestion {
  p: number;
  displayNumber: number; // 1..25
  options: Cet6Option[];
  answer: string;
  questionPrompt: string; // extracted from [听力原文] line before [解析]
  explanation: string;
}

export interface Cet6ListeningSegment {
  index: number; // 1..7
  sectionLabel: string; // Section A · 长对话 1, Section B · 短文 1, Section C · 讲座 1
  audioFile: string | null;
  audioUrl: string | null;
  transcript: string;
  questions: Cet6ListeningQuestion[];
}

export interface Cet6WordBankItem {
  key: string; // A..O
  word: string;
}

export interface Cet6BankedClozeBlank {
  p: number;
  displayNumber: number; // e.g. 26..35 or 27..36 matching text placeholder
  answerKey: string; // A..O
  answerWord: string;
  explanation: string;
}

export interface Cet6BankedClozePart {
  passage: string; // contains numbered markers like 27..36
  wordBank: Cet6WordBankItem[];
  blanks: Cet6BankedClozeBlank[];
  translation: string;
}

export interface Cet6LongReadingParagraph {
  letter: string; // A..O
  text: string;
}

export interface Cet6LongReadingStatement {
  p: number;
  displayNumber: number;
  statement: string;
  answer: string; // A..O
  explanation: string;
}

export interface Cet6LongReadingPart {
  title: string;
  paragraphs: Cet6LongReadingParagraph[];
  statements: Cet6LongReadingStatement[];
  restoredFromRawHtml: boolean;
  translation: string;
}

export interface Cet6CarefulReadingQuestion {
  p: number;
  displayNumber: number;
  stem: string;
  options: Cet6Option[];
  answer: string;
  explanation: string;
}

export interface Cet6CarefulReadingPassage {
  index: number; // 1 or 2
  label: string; // "Passage One" | "Passage Two"
  paragraphs: string[];
  questions: Cet6CarefulReadingQuestion[];
  translation: string;
}

export interface Cet6TranslationItem {
  p: number;
  prompt: string;
  reference: string;
  explanation: string;
}

export interface Cet6ParsedPaper {
  meta: Cet6PaperSummary;
  writing: Cet6WritingPart | null;
  listening: Cet6ListeningSegment[];
  bankedCloze: Cet6BankedClozePart | null;
  bankedClozes?: Cet6BankedClozePart[];
  longReading: Cet6LongReadingPart | null;
  longReadings?: Cet6LongReadingPart[];
  carefulReading: Cet6CarefulReadingPassage[];
  translations: Cet6TranslationItem[];
}

export interface Cet6ScoreBreakdown {
  listeningCorrect: number;
  listeningTotal: number;
  listeningScore: number; // max 248.5
  bankedCorrect: number;
  bankedTotal: number;
  bankedScore: number; // max 35.5
  longCorrect: number;
  longTotal: number;
  longScore: number; // max 71
  carefulCorrect: number;
  carefulTotal: number;
  carefulScore: number; // max 142
  readingScore: number; // max 248.5
  writingSelfScore: number; // 0..106.5
  translationSelfScore: number; // 0..106.5
  objectiveCorrect: number;
  objectiveTotal: number;
  totalEstimated710: number; // rounded 0..710
}

export interface Cet6PaperAttemptState {
  paperId: string;
  mode: 'practice' | 'mock';
  answers: Record<number, string>; // p -> letter (A..O) or user text for writing/translation
  writingSelfScore: number; // 0..106.5
  translationSelfScore: number; // 0..106.5
  submitted: boolean;
  elapsedSec: number;
  updatedAt: number;
}

export interface Cet6ExamRecord {
  id: string;
  paperId: string;
  paperTitle: string;
  mode: 'practice' | 'mock';
  timestamp: number;
  durationSec: number;
  breakdown: Cet6ScoreBreakdown;
}

export interface Cet6Progress {
  attempts: Record<string, Cet6PaperAttemptState>;
  examHistory: Cet6ExamRecord[];
  bookmarks: string[]; // `${paperId}#${p}`
  lastOpenedPaperId: string | null;
  dailyActivity: Record<string, number>;
}

export type Cet6Tab = 'overview' | 'papers' | 'runner' | 'history';
