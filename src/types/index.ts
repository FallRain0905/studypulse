export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface McqQuestion {
  id: number;
  chapter: number;
  chapterTitle: string;
  section: string;
  isExamScope: boolean;
  stem: string;
  code: string | null;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string;
  source: string;
}

export interface ChapterMeta {
  chapter: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  isExamScope: boolean;
  homeworkIds: string[];
  accent: 'emerald' | 'cyan' | 'amber' | 'rose' | 'violet' | 'indigo' | 'teal' | 'sky';
  icon: string;
  summary: string;
}

export interface CodeExample {
  title: string;
  code: string;
  stdin?: string;
  note?: string;
}

export interface KnowledgePoint {
  id: string;
  chapter: number;
  title: string;
  summary: string;
  isExamScope: boolean;
  bullets: string[];
  examples: CodeExample[];
  pitfall?: string;
}

export interface PitfallItem {
  id: string;
  chapter: number | 'platform';
  category: '语法陷阱' | '格式与判题' | '文件与CSV' | '算法逻辑' | '面向对象' | '平台实战';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  wrongExample?: string;
  rightExample?: string;
  lesson: string;
  source: string;
}

export interface HomeworkEntry {
  chapter: number;
  assignId: string;
  title: string;
  coreTask: string;
  keyTech: string;
  note?: string;
}

export interface BlankSlot {
  id: string;
  label: string;
  placeholder: string;
  indentHint: string;
  answer: string;
  multiline?: boolean;
}

export interface CodingLab {
  id: string;
  chapter: number;
  title: string;
  type: 'coding' | 'fill-blank';
  source: string;
  scoreLabel: string;
  isExamScope: boolean;
  difficulty: '基础' | '中等' | '综合';
  description: string;
  requirements: string[];
  sampleInputDesc?: string;
  sampleOutputDesc: string;
  starterCode: string;
  templateCode?: string; // For fill-blank: contains {{1}}, {{2}}, ... placeholders
  blanks?: BlankSlot[];
  virtualFiles?: Record<string, string>; // filename -> initial file content
  defaultStdin?: string;
  expectedOutputFile?: string;
  expectedOutput: string;
  referenceAnswer: string;
  explanation: string[];
  pitfallNote?: string;
}

export interface Flashcard {
  id: string;
  chapter: number;
  isExamScope: boolean;
  tag: string;
  front: string;
  frontCode?: string;
  back: string;
  backCode?: string;
  tip?: string;
}

export interface QuestionRecord {
  attempts: number;
  correctCount: number;
  wrongCount: number;
  lastSelected: OptionKey | null;
  lastCorrect: boolean | null;
  lastTimestamp: number;
  inMistakeBook: boolean;
}

export interface FlashcardProgress {
  level: 0 | 1 | 2 | 3; // 0=new/forgot, 1=fuzzy, 2=good, 3=mastered
  reviews: number;
  lastReviewed: number;
}

export interface ExamHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  total: number;
  correct: number;
  scorePercent: number;
  durationSec: number;
  chapterBreakdown: Record<number, { total: number; correct: number }>;
}

export interface UserProgress {
  records: Record<number, QuestionRecord>;
  bookmarks: number[];
  notes: Record<number, string>;
  masteredKnowledge: string[];
  readTutorialSections: string[];
  solvedLabs: string[];
  labDrafts: Record<string, string>;
  labBlankDrafts: Record<string, Record<string, string>>;
  flashcards: Record<string, FlashcardProgress>;
  streak: number;
  bestStreak: number;
  totalAnsweredToday: number;
  dailyActivity: Record<string, number>; // YYYY-MM-DD -> count
  examHistory: ExamHistoryItem[];
}

export interface PythonRunRequest {
  code: string;
  entryFile?: string;
  stdin?: string;
  files?: Record<string, string>;
  readOutputFile?: string;
}

export interface PythonDiagnostic {
  line: number;
  col: number;
  endLine?: number;
  endCol?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface PythonRunResponse {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  outputFileContent?: string | null;
  createdFiles?: Record<string, string>;
  changedFiles?: Record<string, string>;
  runtime?: 'local-python' | 'pyodide';
  error?: string;
}

export type SubjectId = 'hub' | 'cet4' | 'cet6' | 'python';

export type AppTab =
  | 'dashboard'
  | 'tutorials'
  | 'quiz'
  | 'exam'
  | 'labs'
  | 'ide'
  | 'knowledge'
  | 'flashcards'
  | 'mistakes';
