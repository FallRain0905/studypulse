import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  Languages,
  Loader2,
  Pause,
  PenTool,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  Cet6ExamRecord,
  Cet6PaperAttemptState,
  Cet6ParsedPaper,
  CetLevel,
} from '../../types/cet6';
import { fetchCetPaper } from '../../utils/cet6Api';
import { computeCet6Score, createEmptyAttempt } from '../../utils/cet6Storage';
import { soundEngine } from '../../utils/sound';
import { ProgressRing } from '../MotionPrimitives';
import { Cet6ListeningPlayer } from './Cet6ListeningPlayer';

type PaperSectionKey =
  | 'writing'
  | 'listening'
  | 'banked'
  | 'long'
  | 'careful'
  | 'translation'
  | 'report';

function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function formatTimer(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Cet6PaperRunnerView({
  level = 'cet6',
  paperId,
  initialMode,
  savedAttempt,
  onSaveAttempt,
  onSubmitExam,
  onBackToLibrary,
}: {
  level?: CetLevel;
  paperId: string;
  initialMode: 'practice' | 'mock';
  savedAttempt?: Cet6PaperAttemptState;
  onSaveAttempt: (attempt: Cet6PaperAttemptState) => void;
  onSubmitExam: (record: Cet6ExamRecord, attempt: Cet6PaperAttemptState) => void;
  onBackToLibrary: () => void;
}) {
  const isCet4 = level === 'cet4';
  const codeLabel = isCet4 ? 'CET-4' : 'CET-6';
  const cnName = isCet4 ? '四级' : '六级';
  const minEssayWords = isCet4 ? 120 : 150;
  const maxEssayWords = isCet4 ? 180 : 200;

  const [paper, setPaper] = useState<Cet6ParsedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<Cet6PaperAttemptState>(
    () => savedAttempt ?? createEmptyAttempt(paperId, initialMode)
  );
  const [activeSection, setActiveSection] = useState<PaperSectionKey>('writing');
  const [listeningSegIdx, setListeningSegIdx] = useState(0);
  const [bankedIdx, setBankedIdx] = useState(0);
  const [longIdx, setLongIdx] = useState(0);
  const [carefulIdx, setCarefulIdx] = useState(0);
  const [activeBlankP, setActiveBlankP] = useState<number | null>(null);
  const [highlightLrPara, setHighlightLrPara] = useState<string | null>(null);
  const [showPracticeAnswers, setShowPracticeAnswers] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [readingFontSize, setReadingFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [timerPaused, setTimerPaused] = useState(false);

  // Sync attempt when switching paperId or mode explicitly
  useEffect(() => {
    const base = savedAttempt ?? createEmptyAttempt(paperId, initialMode);
    setAttempt(
      savedAttempt && savedAttempt.paperId === paperId
        ? { ...savedAttempt, mode: savedAttempt.submitted ? savedAttempt.mode : initialMode }
        : base
    );
    setShowPracticeAnswers(false);
    setShowTranscript(false);
    setShowTranslation(false);
    setListeningSegIdx(0);
    setBankedIdx(0);
    setLongIdx(0);
    setCarefulIdx(0);
    setHighlightLrPara(null);
    setTimerPaused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, paperId, initialMode]);

  // Fetch parsed paper from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchCetPaper(level, paperId)
      .then((data) => {
        if (cancelled) return;
        setPaper(data);
        setLoading(false);
        const bcList = data.bankedClozes?.length
          ? data.bankedClozes
          : data.bankedCloze
            ? [data.bankedCloze]
            : [];
        const lrList = data.longReadings?.length
          ? data.longReadings
          : data.longReading
            ? [data.longReading]
            : [];
        if (data.writing) setActiveSection('writing');
        else if (data.listening.length > 0) setActiveSection('listening');
        else if (bcList.length > 0) setActiveSection('banked');
        else if (lrList.length > 0) setActiveSection('long');
        else if (data.carefulReading.length > 0) setActiveSection('careful');
        else setActiveSection('translation');
        if (bcList[0] && bcList[0].blanks.length > 0) {
          setActiveBlankP(bcList[0].blanks[0].p);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level, paperId]);

  const bankedList = useMemo(() => {
    if (!paper) return [];
    if (paper.bankedClozes && paper.bankedClozes.length > 0) return paper.bankedClozes;
    return paper.bankedCloze ? [paper.bankedCloze] : [];
  }, [paper]);

  const longList = useMemo(() => {
    if (!paper) return [];
    if (paper.longReadings && paper.longReadings.length > 0) return paper.longReadings;
    return paper.longReading ? [paper.longReading] : [];
  }, [paper]);

  const activeBanked = bankedList[bankedIdx] ?? bankedList[0] ?? null;
  const activeLong = longList[longIdx] ?? longList[0] ?? null;

  const mockLimitSec = useMemo(() => {
    if (!paper) return (isCet4 ? 125 : 130) * 60;
    if (paper.meta.kind === 'full') return (isCet4 ? 125 : 130) * 60;
    if (paper.meta.kind === 'translation') return 30 * 60;
    if (paper.meta.kind === 'reading-pack') return 60 * 60;
    return 100 * 60;
  }, [paper, isCet4]);

  // Timer tick (counts elapsed seconds; mock mode displays remaining = mockLimitSec - elapsedSec)
  useEffect(() => {
    if (!paper || attempt.submitted || timerPaused) return;
    const id = setInterval(() => {
      setAttempt((prev) => {
        const next = { ...prev, elapsedSec: prev.elapsedSec + 1, updatedAt: Date.now() };
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paper, attempt.submitted, timerPaused]);

  // Auto-save attempt to localStorage when answers/scores/submitted change
  useEffect(() => {
    if (!paper) return;
    onSaveAttempt(attempt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.answers, attempt.writingSelfScore, attempt.translationSelfScore, attempt.submitted, attempt.mode]);

  const scoreBreakdown = useMemo(() => {
    if (!paper) return null;
    return computeCet6Score(
      paper,
      attempt.answers,
      attempt.writingSelfScore,
      attempt.translationSelfScore
    );
  }, [paper, attempt.answers, attempt.writingSelfScore, attempt.translationSelfScore]);

  const objectivePs = useMemo(() => {
    if (!paper) return [];
    const list: number[] = [];
    for (const seg of paper.listening) for (const q of seg.questions) list.push(q.p);
    for (const bc of bankedList) for (const b of bc.blanks) list.push(b.p);
    for (const lr of longList) for (const s of lr.statements) list.push(s.p);
    for (const psg of paper.carefulReading) for (const q of psg.questions) list.push(q.p);
    return list;
  }, [paper, bankedList, longList]);

  const answeredObjCount = useMemo(
    () => objectivePs.filter((p) => Boolean((attempt.answers[p] || '').trim())).length,
    [objectivePs, attempt.answers]
  );

  // Answers are visible if submitted, OR in practice mode when reveal toggle is ON
  const revealed = attempt.submitted || (attempt.mode === 'practice' && showPracticeAnswers);

  function setAnswer(p: number, val: string) {
    setAttempt((prev) => ({
      ...prev,
      answers: { ...prev.answers, [p]: val },
      updatedAt: Date.now(),
    }));
  }

  function handleSubmit() {
    if (!paper || !scoreBreakdown) return;
    const finalized: Cet6PaperAttemptState = {
      ...attempt,
      submitted: true,
      updatedAt: Date.now(),
    };
    setAttempt(finalized);
    const rec: Cet6ExamRecord = {
      id: `cet6-${Date.now()}`,
      paperId: paper.meta.id,
      paperTitle: paper.meta.title,
      mode: finalized.mode,
      timestamp: Date.now(),
      durationSec: Math.max(1, finalized.elapsedSec),
      breakdown: scoreBreakdown,
    };
    onSubmitExam(rec, finalized);
    setActiveSection('report');
    if (scoreBreakdown.totalEstimated710 >= 425) {
      soundEngine.fanfare();
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#d99b26', '#10b981', '#f4f4f5'],
      });
    } else {
      soundEngine.click();
    }
  }

  function handleResetAttempt(targetMode: 'practice' | 'mock') {
    const fresh = createEmptyAttempt(paperId, targetMode);
    setAttempt(fresh);
    onSaveAttempt(fresh);
    setShowPracticeAnswers(false);
    setTimerPaused(false);
    if (paper?.writing) setActiveSection('writing');
    else if (paper && paper.listening.length > 0) setActiveSection('listening');
    soundEngine.click();
  }

  // Wrong / unanswered list for post-submit quick jump
  const wrongItems = useMemo(() => {
    if (!paper) return [];
    const items: Array<{
      p: number;
      label: string;
      section: PaperSectionKey;
      subIdx?: number;
      picked: string;
      answer: string;
    }> = [];
    paper.listening.forEach((seg, sIdx) => {
      for (const q of seg.questions) {
        const picked = (attempt.answers[q.p] || '').trim().toUpperCase();
        if (picked !== q.answer) {
          items.push({
            p: q.p,
            label: `听力 第 ${q.displayNumber} 题`,
            section: 'listening',
            subIdx: sIdx,
            picked: picked || '未答',
            answer: q.answer,
          });
        }
      }
    });
    bankedList.forEach((bc, bIdx) => {
      for (const b of bc.blanks) {
        const picked = (attempt.answers[b.p] || '').trim().toUpperCase();
        if (picked !== b.answerKey) {
          items.push({
            p: b.p,
            label: `选词填空 #${b.displayNumber}`,
            section: 'banked',
            subIdx: bIdx,
            picked: picked || '未答',
            answer: `${b.answerKey} (${b.answerWord})`,
          });
        }
      }
    });
    longList.forEach((lr, lIdx) => {
      for (const s of lr.statements) {
        const picked = (attempt.answers[s.p] || '').trim().toUpperCase();
        if (picked !== s.answer) {
          items.push({
            p: s.p,
            label: `长篇匹配 #${s.displayNumber}`,
            section: 'long',
            subIdx: lIdx,
            picked: picked || '未答',
            answer: s.answer,
          });
        }
      }
    });
    paper.carefulReading.forEach((psg, pIdx) => {
      for (const q of psg.questions) {
        const picked = (attempt.answers[q.p] || '').trim().toUpperCase();
        if (picked !== q.answer) {
          items.push({
            p: q.p,
            label: `${psg.label} #${q.displayNumber}`,
            section: 'careful',
            subIdx: pIdx,
            picked: picked || '未答',
            answer: q.answer,
          });
        }
      }
    });
    return items;
  }, [paper, attempt.answers]);

  // Render banked cloze passage with interactive clickable blank chips
  const bankedPassageNodes = useMemo(() => {
    if (!activeBanked) return null;
    const { passage, blanks, wordBank } = activeBanked;
    const blankNumbers = new Set(blanks.map((b) => String(b.displayNumber)));
    const blankByNum = new Map(blanks.map((b) => [String(b.displayNumber), b]));
    const wordMap = new Map(wordBank.map((w) => [w.key, w.word]));

    // Split on isolated blank numbers like " 27 " or "27." or " 27,"
    const re = /\b(\d{1,2})\b/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;

    while ((match = re.exec(passage)) !== null) {
      const numStr = match[1];
      if (!blankNumbers.has(numStr)) continue;
      const blank = blankByNum.get(numStr)!;
      if (match.index > lastIndex) {
        parts.push(
          <React.Fragment key={`t-${keyCounter++}`}>
            {passage.slice(lastIndex, match.index)}
          </React.Fragment>
        );
      }

      const pickedKey = (attempt.answers[blank.p] || '').toUpperCase();
      const pickedWord = pickedKey ? wordMap.get(pickedKey) || '' : '';
      const isActive = activeBlankP === blank.p;
      const isRight = revealed && pickedKey === blank.answerKey;
      const isWrong = revealed && pickedKey !== blank.answerKey;

      parts.push(
        <button
          key={`b-${blank.p}-${keyCounter++}`}
          onClick={() => {
            setActiveBlankP(blank.p);
            soundEngine.click();
          }}
          className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg font-mono text-xs font-bold border align-baseline transition-all cursor-pointer ${
            isRight
              ? 'bg-emerald-500/18 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
              : isWrong
                ? 'bg-rose-500/18 border-rose-500/50 text-rose-700 dark:text-rose-300'
                : isActive
                  ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400/40'
                  : pickedKey
                    ? 'bg-zinc-900/10 dark:bg-white/[0.12] border-zinc-400/40 dark:border-white/25 text-zinc-900 dark:text-zinc-100'
                    : 'bg-zinc-500/10 border-dashed border-zinc-400/60 text-zinc-500 dark:text-zinc-400 hover:border-amber-400'
          }`}
        >
          <span>{blank.displayNumber}</span>
          <span>{pickedKey ? `${pickedKey}.${pickedWord}` : '____'}</span>
          {isWrong && <span className="text-emerald-600 dark:text-emerald-400">→{blank.answerKey}</span>}
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < passage.length) {
      parts.push(<React.Fragment key="tail">{passage.slice(lastIndex)}</React.Fragment>);
    }

    return parts;
  }, [activeBanked, attempt.answers, activeBlankP, revealed]);

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm font-semibold">正在加载真题并自动校验长篇阅读完整段落...</p>
      </div>
    );
  }

  if (loadError || !paper) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
        <XCircle className="w-9 h-9 text-rose-500 mx-auto" />
        <h3 className="font-bold text-base">试卷加载失败</h3>
        <p className="text-xs text-zinc-500">{loadError}</p>
        <button
          onClick={onBackToLibrary}
          className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold cursor-pointer"
        >
          返回 75 份真题库
        </button>
      </div>
    );
  }

  const remainingSec = Math.max(0, mockLimitSec - attempt.elapsedSec);
  const urgentMock = attempt.mode === 'mock' && !attempt.submitted && remainingSec <= 600;

  const sectionTabs: Array<{ id: PaperSectionKey; label: string; countText?: string }> = [];
  if (paper.writing) sectionTabs.push({ id: 'writing', label: 'Part I 写作' });
  if (paper.listening.length > 0) {
    const lTotal = paper.listening.reduce((s, seg) => s + seg.questions.length, 0);
    const lDone = paper.listening.reduce(
      (s, seg) => s + seg.questions.filter((q) => Boolean(attempt.answers[q.p])).length,
      0
    );
    sectionTabs.push({ id: 'listening', label: 'Part II 听力', countText: `${lDone}/${lTotal}` });
  }
  if (bankedList.length > 0) {
    const total = bankedList.reduce((s, bc) => s + bc.blanks.length, 0);
    const done = bankedList.reduce(
      (s, bc) => s + bc.blanks.filter((b) => Boolean(attempt.answers[b.p])).length,
      0
    );
    sectionTabs.push({
      id: 'banked',
      label: '选词填空',
      countText: `${done}/${total}`,
    });
  }
  if (longList.length > 0) {
    const total = longList.reduce((s, lr) => s + lr.statements.length, 0);
    const done = longList.reduce(
      (s, lr) => s + lr.statements.filter((st) => Boolean(attempt.answers[st.p])).length,
      0
    );
    sectionTabs.push({
      id: 'long',
      label: '长篇阅读',
      countText: `${done}/${total}`,
    });
  }
  if (paper.carefulReading.length > 0) {
    const total = paper.carefulReading.reduce((s, p) => s + p.questions.length, 0);
    const done = paper.carefulReading.reduce(
      (s, p) => s + p.questions.filter((q) => Boolean(attempt.answers[q.p])).length,
      0
    );
    sectionTabs.push({ id: 'careful', label: '仔细阅读', countText: `${done}/${total}` });
  }
  if (paper.translations.length > 0) {
    sectionTabs.push({
      id: 'translation',
      label: paper.meta.kind === 'translation' ? `翻译汇编 (${paper.translations.length})` : 'Part IV 翻译',
    });
  }
  if (attempt.submitted) {
    sectionTabs.push({ id: 'report', label: '★ 710分报告' });
  }

  const activeListeningSeg = paper.listening[listeningSegIdx] ?? paper.listening[0] ?? null;
  const activeCarefulPassage = paper.carefulReading[carefulIdx] ?? paper.carefulReading[0] ?? null;
  const readingTextClass =
    readingFontSize === 'sm'
      ? 'font-reading text-[15px] leading-[1.82]'
      : readingFontSize === 'lg'
        ? 'font-reading text-[18.5px] leading-[1.95]'
        : 'font-reading text-[16.5px] leading-[1.9]';

  return (
    <div className="space-y-4 pb-14">
      {/* Sticky Top Exam Control Bar */}
      <div className="glass-panel-strong rounded-2xl p-3.5 md:p-4 space-y-3 sticky top-16 z-20 border border-zinc-200/80 dark:border-white/[0.09] shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onBackToLibrary}
              className="p-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-zinc-600 dark:text-zinc-300 cursor-pointer shrink-0"
              title="返回试卷库"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-sm md:text-base truncate">{paper.meta.title}</h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    attempt.mode === 'mock'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {attempt.mode === 'mock' ? '710分限时模考' : '沉浸精刷模式'}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                客观题进度 {answeredObjCount}/{objectivePs.length}
                {paper.longReading?.restoredFromRawHtml && ' · 长篇阅读段落已完整补全'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timer */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-extrabold ${
                urgentMock
                  ? 'bg-rose-500/18 border-rose-500/50 text-rose-500 animate-pulse'
                  : 'bg-zinc-900/[0.05] dark:bg-white/[0.06] border-zinc-300 dark:border-white/[0.1] text-zinc-800 dark:text-zinc-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {attempt.mode === 'mock'
                  ? `剩余 ${formatTimer(remainingSec)}`
                  : formatTimer(attempt.elapsedSec)}
              </span>
              {!attempt.submitted && (
                <button
                  onClick={() => setTimerPaused((v) => !v)}
                  className="ml-1 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  title={timerPaused ? '继续计时' : '暂停计时'}
                >
                  {timerPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Practice Reveal Toggle */}
            {attempt.mode === 'practice' && !attempt.submitted && (
              <button
                onClick={() => setShowPracticeAnswers((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  showPracticeAnswers
                    ? 'bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300'
                    : 'bg-zinc-500/10 border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                }`}
              >
                {showPracticeAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPracticeAnswers ? '隐藏答案解析' : '核对答案解析'}
              </button>
            )}

            {/* Submit / Reset Buttons */}
            {!attempt.submitted ? (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs shadow-sm cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> 交卷算 710 分
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveSection('report')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-mono font-extrabold text-xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" /> {scoreBreakdown?.totalEstimated710 ?? 0} / 710
                </button>
                <button
                  onClick={() => handleResetAttempt(attempt.mode)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-500/12 hover:bg-zinc-500/20 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 重做本卷
                </button>
              </>
            )}
          </div>
        </div>

        {/* Part Stepper Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 border-t border-zinc-500/12">
          {sectionTabs.map((t) => {
            const active = activeSection === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveSection(t.id);
                  soundEngine.click();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? t.id === 'report'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                    : 'bg-zinc-500/[0.08] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/16'
                }`}
              >
                <span>{t.label}</span>
                {t.countText && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                      active ? 'bg-black/15 dark:bg-black/15' : 'bg-zinc-500/15'
                    }`}
                  >
                    {t.countText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= PART I: WRITING ================= */}
      {activeSection === 'writing' && paper.writing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 glass-panel-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                <PenTool className="w-4 h-4" /> Part I · Writing (30 minutes · 满分 106.5)
              </span>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  countWords(attempt.answers[paper.writing.p] || '') >= minEssayWords
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-500/12 text-zinc-500'
                }`}
              >
                {countWords(attempt.answers[paper.writing.p] || '')} words（建议 {minEssayWords}–{maxEssayWords}）
              </span>
            </div>

            <div className="rounded-2xl bg-zinc-500/[0.06] border border-zinc-500/12 p-4.5 font-reading text-[15.5px] leading-[1.85] whitespace-pre-line text-zinc-800 dark:text-zinc-200">
              {paper.writing.prompt}
            </div>

            <textarea
              value={attempt.answers[paper.writing.p] || ''}
              onChange={(e) => setAnswer(paper.writing!.p, e.target.value)}
              rows={13}
              placeholder={`在此输入你的${cnName}英文作文草稿（系统自动本地保存，建议写满 ${minEssayWords}~${maxEssayWords} 词）...`}
              className="w-full rounded-2xl bg-white dark:bg-[#111114] text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-white/[0.1] p-4.5 font-reading text-[16px] leading-[1.85] outline-none focus:border-amber-500/60 resize-y"
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">710 分制作文自评打分</span>
                <span className="font-mono text-base font-extrabold text-amber-600 dark:text-amber-300">
                  {attempt.writingSelfScore.toFixed(1)} / 106.5
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={106.5}
                step={1.5}
                value={attempt.writingSelfScore}
                onChange={(e) =>
                  setAttempt((prev) => ({
                    ...prev,
                    writingSelfScore: Number(e.target.value),
                    updatedAt: Date.now(),
                  }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                {[
                  { label: '需加强 55', val: 55 },
                  { label: '及格 66', val: 66 },
                  { label: '良好 78', val: 78 },
                  { label: '高分 92', val: 92 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() =>
                      setAttempt((prev) => ({ ...prev, writingSelfScore: preset.val }))
                    }
                    className="py-1 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/18 font-mono cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {revealed ? (
              <div className="glass-panel-strong rounded-3xl p-5 space-y-4 border border-amber-500/25">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-300">
                  参考高分范文
                </div>
                <div className="font-reading text-[15.5px] leading-[1.85] whitespace-pre-line text-zinc-800 dark:text-zinc-200">
                  {paper.writing.modelEssay}
                </div>
                {paper.writing.explanation && (
                  <div className="pt-3 border-t border-zinc-500/15 space-y-1.5">
                    <div className="text-xs font-bold text-zinc-500">结构与写作思路解析</div>
                    <div className="font-prose-zh text-[13px] whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                      {paper.writing.explanation}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center space-y-2 text-xs text-zinc-500">
                <PenTool className="w-7 h-7 mx-auto opacity-45" />
                <p>
                  {attempt.mode === 'mock'
                    ? '模考模式下交卷后自动展示高分范文与结构拆解。'
                    : '点击右上角「核对答案解析」或交卷后可查看高分范文与写作点评。'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PART II: LISTENING (7 SEGMENTS + MP3) ================= */}
      {activeSection === 'listening' && activeListeningSeg && (
        <div className="space-y-4">
          {/* Segment Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {paper.listening.map((seg, idx) => {
              const active = idx === listeningSegIdx;
              const segDone = seg.questions.filter((q) => Boolean(attempt.answers[q.p])).length;
              return (
                <button
                  key={seg.index}
                  onClick={() => {
                    setListeningSegIdx(idx);
                    soundEngine.click();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                      : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>{seg.sectionLabel}</span>
                  <span className="font-mono text-[10px] opacity-75">
                    {segDone}/{seg.questions.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Native Range-Streamed MP3 Player */}
          <Cet6ListeningPlayer
            audioUrl={activeListeningSeg.audioUrl}
            title={`${paper.meta.folder} · ${activeListeningSeg.sectionLabel}`}
            segmentIndex={activeListeningSeg.index}
            totalSegments={paper.listening.length}
            onPrevSegment={
              listeningSegIdx > 0 ? () => setListeningSegIdx((i) => i - 1) : undefined
            }
            onNextSegment={
              listeningSegIdx < paper.listening.length - 1
                ? () => setListeningSegIdx((i) => i + 1)
                : undefined
            }
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Questions for this segment */}
            <div className={`${revealed && showTranscript ? 'xl:col-span-7' : 'xl:col-span-12'} space-y-4`}>
              {activeListeningSeg.questions.map((q) => {
                const picked = (attempt.answers[q.p] || '').toUpperCase();
                return (
                  <div
                    key={q.p}
                    className="glass-panel-strong rounded-2xl p-5 space-y-3.5 border border-zinc-200/80 dark:border-white/[0.08]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-zinc-900/[0.06] dark:bg-white/[0.08]">
                          Q{q.displayNumber}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {q.displayNumber <= 15 ? '7.1 分' : '14.2 分'}
                        </span>
                      </div>
                      {revealed && (
                        <span
                          className={`text-xs font-bold ${
                            picked === q.answer
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500 dark:text-rose-400'
                          }`}
                        >
                          {picked === q.answer
                            ? `✓ 正确 (${q.answer})`
                            : `✗ 你的选择: ${picked || '未答'} · 答案: ${q.answer}`}
                        </span>
                      )}
                    </div>

                    {revealed && q.questionPrompt && (
                      <div className="font-reading text-[15px] leading-relaxed text-amber-800 dark:text-amber-200 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-3.5 py-2.5">
                        <span className="font-sans text-xs font-semibold mr-1.5">录音问题：</span>
                        {q.questionPrompt}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {q.options.map((opt) => {
                        const isPicked = picked === opt.key;
                        const isAns = opt.key === q.answer;
                        let style =
                          'border-zinc-500/18 bg-zinc-500/[0.04] hover:border-zinc-400/50 dark:hover:border-white/25';
                        if (revealed) {
                          if (isAns) {
                            style = 'border-emerald-500/70 bg-emerald-500/14';
                          } else if (isPicked && !isAns) {
                            style = 'border-rose-500/70 bg-rose-500/14';
                          } else {
                            style = 'border-zinc-500/10 opacity-60';
                          }
                        } else if (isPicked) {
                          style = 'border-amber-500/70 bg-amber-500/12';
                        }

                        return (
                          <button
                            key={opt.key}
                            onClick={() => {
                              if (attempt.submitted) return;
                              setAnswer(q.p, opt.key);
                              soundEngine.click();
                            }}
                            className={`text-left flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                              attempt.submitted ? 'cursor-default' : 'cursor-pointer'
                            } ${style}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                                revealed && isAns
                                  ? 'bg-emerald-500 text-zinc-950'
                                  : revealed && isPicked && !isAns
                                    ? 'bg-rose-500 text-white'
                                    : isPicked
                                      ? 'bg-amber-500 text-zinc-950'
                                      : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="font-reading text-[15px] leading-[1.65] text-zinc-800 dark:text-zinc-100">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {revealed && q.explanation && (
                      <div className="font-prose-zh text-[13px] text-zinc-600 dark:text-zinc-300 bg-zinc-500/[0.07] rounded-xl p-3.5">
                        <strong className="text-emerald-600 dark:text-emerald-400">解析：</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Toggle Transcript Button */}
              {revealed && activeListeningSeg.transcript && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowTranscript((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {showTranscript ? '收起本段听力原文' : '展开本段 [听力原文] 精听对照'}
                  </button>
                </div>
              )}
            </div>

            {/* Transcript Side Panel */}
            {revealed && showTranscript && activeListeningSeg.transcript && (
              <div className="xl:col-span-5 glass-panel-strong rounded-2xl p-5 space-y-3 border border-amber-500/25 xl:sticky xl:top-44 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                    [听力原文] {activeListeningSeg.sectionLabel}
                  </span>
                  <button
                    onClick={() => setShowTranscript(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    收起
                  </button>
                </div>
                <div className="font-reading text-[15.5px] leading-[1.85] whitespace-pre-line text-zinc-800 dark:text-zinc-200">
                  {activeListeningSeg.transcript}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PART III-A: BANKED CLOZE (15 CHOOSE 10) ================= */}
      {activeSection === 'banked' && activeBanked && (
        <div className="space-y-4">
          {bankedList.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {bankedList.map((bc, idx) => {
                const done = bc.blanks.filter((b) => Boolean(attempt.answers[b.p])).length;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setBankedIdx(idx);
                      if (bc.blanks[0]) setActiveBlankP(bc.blanks[0].p);
                      soundEngine.click();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      idx === bankedIdx
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                    }`}
                  >
                    选词第 {idx + 1} 篇 ({done}/{bc.blanks.length})
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Passage with interactive blank chips */}
            <div className="lg:col-span-8 glass-panel-strong rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                  Part III Section A · 选词填空（15 选 10 · 每空 3.55 分）
                </span>
                <span className="text-[11px] text-zinc-500">
                  点击文中空格，再点右侧词库快速填入
                </span>
              </div>

              <div className="font-reading text-[17px] leading-[2.05] whitespace-pre-line text-zinc-800 dark:text-zinc-200">
                {bankedPassageNodes}
              </div>

              {revealed && activeBanked.translation && (
                <div className="pt-4 border-t border-zinc-500/15 space-y-2">
                  <button
                    onClick={() => setShowTranslation((v) => !v)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    {showTranslation ? '收起全文参考译文' : '展开全文 [参考译文]'}
                  </button>
                  {showTranslation && (
                    <p className="font-prose-zh text-[13.5px] whitespace-pre-line text-zinc-600 dark:text-zinc-300 bg-zinc-500/[0.06] rounded-2xl p-4">
                      {activeBanked.translation}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sticky 15-Word Interactive Bank */}
            <div className="lg:col-span-4 glass-panel rounded-3xl p-5 space-y-4 lg:sticky lg:top-44">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  15 词候选词库
                  {activeBlankP !== null && (
                    <span className="ml-2 font-mono text-amber-600 dark:text-amber-300">
                      正在填 #{activeBlankP}
                    </span>
                  )}
                </span>
                {activeBlankP !== null && attempt.answers[activeBlankP] && !attempt.submitted && (
                  <button
                    onClick={() => setAnswer(activeBlankP, '')}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                  >
                    清空此空
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1.5">
                {activeBanked.wordBank.map((item) => {
                  const usedByBlank = activeBanked.blanks.find(
                    (b) => (attempt.answers[b.p] || '').toUpperCase() === item.key
                  );
                  const isSelectedForActive =
                    activeBlankP !== null &&
                    (attempt.answers[activeBlankP] || '').toUpperCase() === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        if (attempt.submitted || activeBlankP === null) return;
                        setAnswer(activeBlankP, item.key);
                        soundEngine.click();
                        const blanks = activeBanked.blanks;
                        const curIdx = blanks.findIndex((b) => b.p === activeBlankP);
                        const nextBlank =
                          blanks.slice(curIdx + 1).find((b) => !attempt.answers[b.p]) ??
                          blanks[curIdx + 1];
                        if (nextBlank) setActiveBlankP(nextBlank.p);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-1 ${
                        attempt.submitted ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        isSelectedForActive
                          ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200 font-bold'
                          : usedByBlank
                            ? 'bg-zinc-500/[0.06] border-transparent text-zinc-400 line-through'
                            : 'bg-white/70 dark:bg-white/[0.04] border-zinc-200/80 dark:border-white/[0.08] hover:border-amber-400/60'
                      }`}
                    >
                      <span className="truncate font-reading text-[14px]">
                        <strong className="font-mono text-xs mr-1.5">{item.key}.</strong>
                        {item.word}
                      </span>
                      {usedByBlank && (
                        <span className="font-mono text-[10px] no-underline text-amber-500 shrink-0">
                          #{usedByBlank.displayNumber}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Blank Selector Strip */}
              <div className="pt-3 border-t border-zinc-500/12 flex flex-wrap gap-1.5">
                {activeBanked.blanks.map((b) => {
                  const val = (attempt.answers[b.p] || '').toUpperCase();
                  const isAct = activeBlankP === b.p;
                  return (
                    <button
                      key={b.p}
                      onClick={() => setActiveBlankP(b.p)}
                      className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold border cursor-pointer ${
                        isAct
                          ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : val
                            ? 'border-zinc-400/30 bg-zinc-500/12'
                            : 'border-transparent bg-zinc-500/[0.06] text-zinc-500'
                      }`}
                    >
                      {b.displayNumber}:{val || '-'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Banked Cloze Explanations */}
          {revealed && (
            <div className="glass-panel rounded-3xl p-5 space-y-3">
              <h3 className="font-bold text-sm">选词填空逐空精解</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeBanked.blanks.map((b) => {
                  const picked = (attempt.answers[b.p] || '').toUpperCase();
                  const ok = picked === b.answerKey;
                  return (
                    <div
                      key={b.p}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                        ok ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-rose-500/30 bg-rose-500/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>
                          第 {b.displayNumber} 空 · 答案：{b.answerKey}. {b.answerWord}
                        </span>
                        <span className={ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                          {ok ? '✓ 正确' : `你的答案：${picked || '未答'}`}
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {b.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= PART III-B: LONG READING (SPLIT PANE A..O) ================= */}
      {activeSection === 'long' && activeLong && (
        <div className="space-y-4">
          {longList.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {longList.map((lr, idx) => {
                const done = lr.statements.filter((st) => Boolean(attempt.answers[st.p])).length;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setLongIdx(idx);
                      setHighlightLrPara(null);
                      setShowTranslation(false);
                      soundEngine.click();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      idx === longIdx
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                    }`}
                  >
                    长篇第 {idx + 1} 篇 ({done}/{lr.statements.length})
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Full Restored Paragraphs A..O */}
            <div className="lg:col-span-7 glass-panel-strong rounded-3xl p-5 md:p-6 space-y-4 lg:max-h-[76vh] lg:overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-500/12">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                      Part III Section B · 长篇阅读信息匹配（每题 7.1 分）
                    </span>
                    {activeLong.restoredFromRawHtml && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                        ✓ 已补全全部 {activeLong.paragraphs.length} 段
                      </span>
                    )}
                  </div>
                  {activeLong.title && (
                    <h2 className="font-editorial text-xl md:text-[22px] leading-snug text-zinc-900 dark:text-zinc-100">
                      {activeLong.title}
                    </h2>
                  )}
                </div>

                {revealed && activeLong.translation && (
                  <button
                    onClick={() => setShowTranslation((v) => !v)}
                    className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-300 cursor-pointer"
                  >
                    {showTranslation ? '看英文原文' : '看参考译文'}
                  </button>
                )}
              </div>

              {revealed && showTranslation && activeLong.translation ? (
                <div className="font-prose-zh text-[14px] whitespace-pre-line text-zinc-700 dark:text-zinc-200">
                  {activeLong.translation}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeLong.paragraphs.map((para) => {
                    const isHi = highlightLrPara === para.letter;
                    return (
                      <div
                        key={para.letter}
                        id={`cet6-lr-para-${para.letter}`}
                        onClick={() => setHighlightLrPara(isHi ? null : para.letter)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isHi
                            ? 'bg-amber-500/12 border-amber-500/50 shadow-sm'
                            : 'bg-zinc-500/[0.04] border-transparent hover:border-zinc-500/20'
                        }`}
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-mono text-xs font-bold mr-2.5 align-middle">
                          {para.letter}
                        </span>
                        <span className="font-reading text-[16px] leading-[1.88] text-zinc-800 dark:text-zinc-200">
                          {para.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Matching Statements */}
            <div className="lg:col-span-5 space-y-3 lg:max-h-[76vh] lg:overflow-y-auto pr-0.5">
              {activeLong.statements.map((st) => {
                const picked = (attempt.answers[st.p] || '').toUpperCase();
                const ok = revealed && picked === st.answer;
                const wrong = revealed && picked !== st.answer;
                const availableLetters = activeLong.paragraphs.map((p) => p.letter);

                return (
                  <div
                    key={st.p}
                    className={`glass-panel-strong rounded-2xl p-4 space-y-3 border ${
                      ok
                        ? 'border-emerald-500/40'
                        : wrong
                          ? 'border-rose-500/40'
                          : 'border-zinc-200/80 dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-900/[0.06] dark:bg-white/[0.08] shrink-0 mt-0.5">
                        {st.displayNumber}
                      </span>
                      <p className="font-reading text-[14.5px] leading-[1.7] text-zinc-800 dark:text-zinc-100">{st.statement}</p>
                    </div>

                    {/* Quick Letter Picker */}
                    <div className="flex flex-wrap gap-1">
                      {availableLetters.map((letter) => {
                        const isPicked = picked === letter;
                        const isAns = letter === st.answer;
                        return (
                          <button
                            key={letter}
                            onClick={() => {
                              setHighlightLrPara(letter);
                              document
                                .getElementById(`cet6-lr-para-${letter}`)
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              if (!attempt.submitted) {
                                setAnswer(st.p, letter);
                                soundEngine.click();
                              }
                            }}
                            className={`w-7 h-7 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                              revealed && isAns
                                ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                                : revealed && isPicked && !isAns
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : isPicked
                                    ? 'bg-amber-500 border-amber-500 text-zinc-950'
                                    : 'bg-zinc-500/10 border-transparent text-zinc-600 dark:text-zinc-300 hover:border-amber-400/50'
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>

                    {revealed && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-500/[0.07] rounded-xl p-2.5 leading-relaxed">
                        <button
                          onClick={() => {
                            setHighlightLrPara(st.answer);
                            document
                              .getElementById(`cet6-lr-para-${st.answer}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline mr-1.5 cursor-pointer"
                        >
                          定位 {st.answer} 段 ↗
                        </button>
                        {st.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= PART III-C: CAREFUL READING (SPLIT PANE) ================= */}
      {activeSection === 'careful' && activeCarefulPassage && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {paper.carefulReading.map((psg, idx) => {
                const done = psg.questions.filter((q) => Boolean(attempt.answers[q.p])).length;
                return (
                  <button
                    key={psg.index}
                    onClick={() => {
                      setCarefulIdx(idx);
                      setShowTranslation(false);
                      soundEngine.click();
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      idx === carefulIdx
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                    }`}
                  >
                    {psg.label} ({done}/{psg.questions.length})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">正文字号：</span>
              {(['sm', 'base', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setReadingFontSize(sz)}
                  className={`px-2 py-1 rounded-lg font-semibold cursor-pointer ${
                    readingFontSize === sz
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                      : 'bg-zinc-500/10 text-zinc-500'
                  }`}
                >
                  {sz === 'sm' ? '小' : sz === 'base' ? '中' : '大'}
                </button>
              ))}
              {revealed && activeCarefulPassage.translation && (
                <button
                  onClick={() => setShowTranslation((v) => !v)}
                  className="ml-1 px-3 py-1 rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-300 font-bold cursor-pointer"
                >
                  {showTranslation ? '切回英文原文' : '对照参考译文'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Passage */}
            <div className="lg:col-span-6 glass-panel-strong rounded-3xl p-6 space-y-4 lg:max-h-[74vh] lg:overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-300">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> {activeCarefulPassage.label} · 仔细阅读（每题 14.2 分）
                </span>
                <span className="font-mono text-zinc-500">{activeCarefulPassage.paragraphs.length} 段</span>
              </div>

              {revealed && showTranslation && activeCarefulPassage.translation ? (
                <div className="font-prose-zh text-[14.5px] whitespace-pre-line text-zinc-700 dark:text-zinc-200">
                  {activeCarefulPassage.translation}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeCarefulPassage.paragraphs.map((pText, i) => (
                    <p key={i} className={`${readingTextClass} text-zinc-800 dark:text-zinc-200`}>
                      <span className="font-mono text-[11px] text-amber-600/80 dark:text-amber-400/70 mr-2 select-none">
                        ¶{i + 1}
                      </span>
                      {pText}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Right 5 MCQs */}
            <div className="lg:col-span-6 space-y-4 lg:max-h-[74vh] lg:overflow-y-auto pr-0.5">
              {activeCarefulPassage.questions.map((q) => {
                const picked = (attempt.answers[q.p] || '').toUpperCase();
                return (
                  <div
                    key={q.p}
                    className="glass-panel-strong rounded-2xl p-5 space-y-3 border border-zinc-200/80 dark:border-white/[0.08]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-reading text-[15.5px] font-semibold leading-[1.65] text-zinc-900 dark:text-zinc-100">
                        <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-300 mr-2">
                          {q.displayNumber}.
                        </span>
                        {q.stem}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isPicked = picked === opt.key;
                        const isAns = opt.key === q.answer;
                        let style =
                          'border-zinc-500/18 bg-zinc-500/[0.04] hover:border-zinc-400/50 dark:hover:border-white/25';
                        if (revealed) {
                          if (isAns) style = 'border-emerald-500/70 bg-emerald-500/14';
                          else if (isPicked && !isAns) style = 'border-rose-500/70 bg-rose-500/14';
                          else style = 'border-zinc-500/10 opacity-60';
                        } else if (isPicked) {
                          style = 'border-amber-500/70 bg-amber-500/12';
                        }

                        return (
                          <button
                            key={opt.key}
                            onClick={() => {
                              if (attempt.submitted) return;
                              setAnswer(q.p, opt.key);
                              soundEngine.click();
                            }}
                            className={`w-full text-left flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                              attempt.submitted ? 'cursor-default' : 'cursor-pointer'
                            } ${style}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                                revealed && isAns
                                  ? 'bg-emerald-500 text-zinc-950'
                                  : revealed && isPicked && !isAns
                                    ? 'bg-rose-500 text-white'
                                    : isPicked
                                      ? 'bg-amber-500 text-zinc-950'
                                      : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="font-reading text-[15px] leading-[1.65] text-zinc-800 dark:text-zinc-100">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {revealed && q.explanation && (
                      <div className="font-prose-zh text-[13px] text-zinc-600 dark:text-zinc-300 bg-zinc-500/[0.07] rounded-xl p-3.5 whitespace-pre-line">
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          解析（答案 {q.answer}）：
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= PART IV: TRANSLATION ================= */}
      {activeSection === 'translation' && paper.translations.length > 0 && (
        <div className="space-y-5">
          {paper.translations.map((tr, idx) => (
            <div key={tr.p} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 glass-panel-strong rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                    <Languages className="w-4 h-4" />
                    {paper.translations.length > 1
                      ? `翻译真题第 ${idx + 1} 篇`
                      : 'Part IV · Translation (30 minutes · 满分 106.5)'}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {countWords(attempt.answers[tr.p] || '')} words
                  </span>
                </div>

                <div className="rounded-2xl bg-zinc-500/[0.06] border border-zinc-500/12 p-4.5 font-prose-zh text-[15px] whitespace-pre-line text-zinc-800 dark:text-zinc-200">
                  {tr.prompt}
                </div>

                <textarea
                  value={attempt.answers[tr.p] || ''}
                  onChange={(e) => setAnswer(tr.p, e.target.value)}
                  rows={8}
                  placeholder="请将上述中文段落翻译为英文..."
                  className="w-full rounded-2xl bg-white dark:bg-[#111114] text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-white/[0.1] p-4.5 font-reading text-[16px] leading-[1.85] outline-none focus:border-amber-500/60 resize-y"
                />
              </div>

              <div className="lg:col-span-5 space-y-4">
                {idx === 0 && (
                  <div className="glass-panel rounded-3xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">710 分制翻译自评打分</span>
                      <span className="font-mono text-base font-extrabold text-amber-600 dark:text-amber-300">
                        {attempt.translationSelfScore.toFixed(1)} / 106.5
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={106.5}
                      step={1.5}
                      value={attempt.translationSelfScore}
                      onChange={(e) =>
                        setAttempt((prev) => ({
                          ...prev,
                          translationSelfScore: Number(e.target.value),
                          updatedAt: Date.now(),
                        }))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}

                {revealed ? (
                  <div className="glass-panel-strong rounded-3xl p-5 space-y-3 border border-amber-500/25">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-300">
                      参考译文
                    </div>
                    <div className="font-reading text-[15.5px] leading-[1.85] whitespace-pre-line text-zinc-800 dark:text-zinc-200">
                      {tr.reference}
                    </div>
                    {tr.explanation && (
                      <div className="pt-3 border-t border-zinc-500/15 font-prose-zh text-[13px] whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                        <strong className="text-zinc-800 dark:text-zinc-100">翻译点评：</strong>
                        {tr.explanation}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-panel rounded-3xl p-8 text-center text-xs text-zinc-500">
                    交卷或点击「核对答案解析」后查看参考译文与句型点评。
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= 710-POINT SCORE REPORT ================= */}
      {activeSection === 'report' && attempt.submitted && scoreBreakdown && (
        <div className="space-y-5">
          <div className="glass-panel-strong rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 border border-amber-500/25">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressRing
                percent={Math.round((scoreBreakdown.totalEstimated710 / 710) * 100)}
                size={122}
                strokeWidth={10}
                color={
                  scoreBreakdown.totalEstimated710 >= 550
                    ? '#10b981'
                    : scoreBreakdown.totalEstimated710 >= 425
                      ? '#d99b26'
                      : '#f43f5e'
                }
                label={`${scoreBreakdown.totalEstimated710}分`}
              />
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                  <Sparkles className="w-4 h-4" /> {codeLabel} 710 分制折算成绩报告
                </div>
                <h2 className="text-2xl font-extrabold">{paper.meta.title}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold ${
                      scoreBreakdown.totalEstimated710 >= 425
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {scoreBreakdown.totalEstimated710 >= 550
                      ? '高分优秀 (≥550)'
                      : scoreBreakdown.totalEstimated710 >= 425
                        ? `已达${cnName} 425 及格线`
                        : '距 425 及格线还差 ' + (425 - scoreBreakdown.totalEstimated710) + ' 分'}
                  </span>
                  <span className="font-mono text-zinc-500">
                    客观题 {scoreBreakdown.objectiveCorrect}/{scoreBreakdown.objectiveTotal} · 用时{' '}
                    {formatTimer(attempt.elapsedSec)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetAttempt(attempt.mode)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-500/12 hover:bg-zinc-500/20 text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 重刷本套卷
              </button>
              <button
                onClick={onBackToLibrary}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer"
              >
                选下一套真题
              </button>
            </div>
          </div>

          {/* 4-Part Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 space-y-1.5">
              <div className="text-xs text-zinc-500">Part II 听力 (35%)</div>
              <div className="font-mono text-2xl font-extrabold">
                {scoreBreakdown.listeningScore}
                <span className="text-xs text-zinc-500 font-normal ml-1">/ 248.5</span>
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                答对 {scoreBreakdown.listeningCorrect} / {scoreBreakdown.listeningTotal} 题
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 space-y-1.5">
              <div className="text-xs text-zinc-500">Part III 阅读 (35%)</div>
              <div className="font-mono text-2xl font-extrabold">
                {scoreBreakdown.readingScore}
                <span className="text-xs text-zinc-500 font-normal ml-1">/ 248.5</span>
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                选词 {scoreBreakdown.bankedScore} · 长篇 {scoreBreakdown.longScore} · 仔细{' '}
                {scoreBreakdown.carefulScore}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Part I 写作自评</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                  {scoreBreakdown.writingSelfScore} / 106.5
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={106.5}
                step={1.5}
                value={attempt.writingSelfScore}
                onChange={(e) =>
                  setAttempt((prev) => ({ ...prev, writingSelfScore: Number(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="glass-panel rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Part IV 翻译自评</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                  {scoreBreakdown.translationSelfScore} / 106.5
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={106.5}
                step={1.5}
                value={attempt.translationSelfScore}
                onChange={(e) =>
                  setAttempt((prev) => ({ ...prev, translationSelfScore: Number(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Wrong & Unanswered Jump List */}
          <div className="glass-panel rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">
                客观题错题与未答清单（共 {wrongItems.length} 题，点击直达复盘）
              </h3>
            </div>
            {wrongItems.length === 0 ? (
              <div className="py-6 text-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> 客观题全部答对，太强了！
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {wrongItems.map((it) => (
                  <button
                    key={it.p}
                    onClick={() => {
                      setActiveSection(it.section);
                      if (it.section === 'listening' && it.subIdx !== undefined) {
                        setListeningSegIdx(it.subIdx);
                      }
                      if (it.section === 'banked' && it.subIdx !== undefined) {
                        setBankedIdx(it.subIdx);
                      }
                      if (it.section === 'long' && it.subIdx !== undefined) {
                        setLongIdx(it.subIdx);
                      }
                      if (it.section === 'careful' && it.subIdx !== undefined) {
                        setCarefulIdx(it.subIdx);
                      }
                    }}
                    className="text-left p-3 rounded-xl bg-rose-500/[0.06] hover:bg-rose-500/12 border border-rose-500/20 flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors"
                  >
                    <span className="font-semibold">{it.label}</span>
                    <span className="font-mono text-[11px]">
                      <span className="text-rose-500">{it.picked}</span>
                      <span className="text-zinc-400 mx-1">→</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {it.answer}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
