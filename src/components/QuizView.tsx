import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Grid,
  NotebookPen,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHAPTERS } from '../data/knowledgeData';
import { MCQ_QUESTIONS } from '../data/questions';
import type { OptionKey, UserProgress } from '../types';
import { PythonCodeBlock, RichText } from '../utils/highlight';
import { soundEngine } from '../utils/sound';

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export interface QuizFilterPreset {
  chapter: number | 'all' | 'exam';
  status: 'all' | 'unanswered' | 'mistakes' | 'bookmarks';
  jumpQuestionId?: number;
  nonce?: number;
}

export function QuizView({
  progress,
  preset,
  onAnswer,
  onToggleBookmark,
  onSaveNote,
  onRemoveMistake,
}: {
  progress: UserProgress;
  preset: QuizFilterPreset;
  onAnswer: (questionId: number, selected: OptionKey, isCorrect: boolean) => void;
  onToggleBookmark: (questionId: number) => void;
  onSaveNote: (questionId: number, note: string) => void;
  onRemoveMistake: (questionId: number) => void;
}) {
  const [chapterFilter, setChapterFilter] = useState<number | 'all' | 'exam'>(preset.chapter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'mistakes' | 'bookmarks'>(
    preset.status
  );
  const [studyMode, setStudyMode] = useState(false); // 背题模式
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [sessionSelected, setSessionSelected] = useState<Record<number, OptionKey>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [showNavGrid, setShowNavGrid] = useState(true);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  // Sync external preset jumps (e.g. from Dashboard or Global Search)
  useEffect(() => {
    setChapterFilter(preset.chapter);
    setStatusFilter(preset.status);
    setShuffleSeed(0);
    setSessionSelected({});
    if (preset.jumpQuestionId) {
      const idx = MCQ_QUESTIONS.findIndex((q) => q.id === preset.jumpQuestionId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentIndex(0);
    }
  }, [preset]);

  const deck = useMemo(() => {
    let list = MCQ_QUESTIONS.filter((q) => {
      if (chapterFilter === 'exam' && !q.isExamScope) return false;
      if (typeof chapterFilter === 'number' && q.chapter !== chapterFilter) return false;
      if (statusFilter === 'unanswered' && progress.records[q.id]) return false;
      if (statusFilter === 'mistakes' && !progress.records[q.id]?.inMistakeBook) return false;
      if (statusFilter === 'bookmarks' && !progress.bookmarks.includes(q.id)) return false;
      return true;
    });

    if (shuffleSeed > 0) {
      // deterministic Fisher-Yates using shuffleSeed
      list = [...list];
      let seed = shuffleSeed;
      for (let i = list.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = seed % (i + 1);
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }, [chapterFilter, statusFilter, shuffleSeed, progress.bookmarks, progress.records]);

  const safeIndex = Math.min(currentIndex, Math.max(0, deck.length - 1));
  const currentQ = deck[safeIndex] ?? null;

  useEffect(() => {
    if (currentQ) {
      setNoteDraft(progress.notes[currentQ.id] ?? '');
      setEditingNote(false);
    }
  }, [currentQ, progress.notes]);

  const selectedOption = currentQ ? sessionSelected[currentQ.id] ?? null : null;
  const revealed = studyMode || selectedOption !== null;
  const isBookmarked = currentQ ? progress.bookmarks.includes(currentQ.id) : false;
  const isInMistake = currentQ ? Boolean(progress.records[currentQ.id]?.inMistakeBook) : false;

  const handleSelect = useCallback(
    (opt: OptionKey) => {
      if (!currentQ || studyMode || sessionSelected[currentQ.id]) return;
      const isCorrect = opt === currentQ.answer;
      setSessionSelected((prev) => ({ ...prev, [currentQ.id]: opt }));
      onAnswer(currentQ.id, opt, isCorrect);

      if (isCorrect) {
        const nextStreak = progress.streak + 1;
        soundEngine.correct(nextStreak);
        if (nextStreak > 0 && nextStreak % 5 === 0) {
          confetti({
            particleCount: 55,
            spread: 70,
            origin: { y: 0.65 },
            colors: ['#10b981', '#06b6d4', '#f59e0b', '#a855f7'],
          });
        }
      } else {
        soundEngine.wrong();
        setShakeKey((k) => k + 1);
      }
    },
    [currentQ, studyMode, sessionSelected, onAnswer, progress.streak]
  );

  const goTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= deck.length) return;
      setDirection(nextIdx >= safeIndex ? 1 : -1);
      setCurrentIndex(nextIdx);
      soundEngine.click();
    },
    [deck.length, safeIndex]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (!currentQ) return;

      const k = e.key.toLowerCase();
      if (k === '1' || k === 'a') handleSelect('A');
      else if (k === '2' || k === 'b') handleSelect('B');
      else if (k === '3' || k === 'c') handleSelect('C');
      else if (k === '4' || k === 'd') handleSelect('D');
      else if (e.key === 'ArrowRight' || (e.key === 'Enter' && revealed)) {
        goTo(safeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        goTo(safeIndex - 1);
      } else if (k === 'f') {
        onToggleBookmark(currentQ.id);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQ, handleSelect, goTo, safeIndex, revealed, onToggleBookmark]);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Filter & Control Toolbar */}
      <div className="glass-panel rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Chapter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all' as const, label: `全部 (${MCQ_QUESTIONS.length})` },
              {
                id: 'exam' as const,
                label: `★ 考试范围 4~8 章 (${MCQ_QUESTIONS.filter((q) => q.isExamScope).length})`,
              },
              ...CHAPTERS.map((c) => ({ id: c.chapter, label: `第${c.chapter}章` })),
            ].map((item) => {
              const active = chapterFilter === item.id;
              return (
                <button
                  key={String(item.id)}
                  onClick={() => {
                    setChapterFilter(item.id);
                    setCurrentIndex(0);
                    soundEngine.click();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? item.id === 'exam'
                        ? 'bg-amber-500 dark:bg-amber-400 text-zinc-950 shadow-sm'
                        : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                      : 'bg-zinc-500/10 hover:bg-zinc-500/18 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Mode Switches */}
          <div className="flex flex-wrap items-center gap-2">
            {progress.streak >= 2 && (
              <motion.div
                key={progress.streak}
                initial={{ scale: 0.7, rotate: -6 }}
                animate={{ scale: 1, rotate: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-300 text-xs font-extrabold"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                {progress.streak} 连击!
              </motion.div>
            )}
            <button
              onClick={() => {
                setStudyMode((v) => !v);
                soundEngine.click();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                studyMode
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300'
                  : 'bg-zinc-500/10 border-transparent text-zinc-500 dark:text-zinc-300 hover:bg-zinc-500/18'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {studyMode ? '背题模式：开' : '背题模式'}
            </button>
            <button
              onClick={() => {
                setShuffleSeed((s) => (s === 0 ? Date.now() % 100000 : 0));
                setCurrentIndex(0);
                soundEngine.click();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                shuffleSeed > 0
                  ? 'bg-zinc-900/10 dark:bg-white/[0.12] border-zinc-900/20 dark:border-white/20 text-zinc-900 dark:text-zinc-100'
                  : 'bg-zinc-500/10 border-transparent text-zinc-500 dark:text-zinc-300 hover:bg-zinc-500/18'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              {shuffleSeed > 0 ? '已随机' : '随机抽题'}
            </button>
            <button
              onClick={() => setShowNavGrid((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              答题卡
            </button>
          </div>
        </div>

        {/* Status Sub-filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-500/12">
          <div className="flex items-center gap-1.5">
            {(
              [
                ['all', '全部题目'],
                ['unanswered', '仅未做'],
                ['mistakes', '仅错题本'],
                ['bookmarks', '仅收藏'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  setStatusFilter(k);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === k
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              当前筛选共 <strong className="text-slate-900 dark:text-white">{deck.length}</strong> 题
            </span>
            {Object.keys(sessionSelected).length > 0 && (
              <button
                onClick={() => setSessionSelected({})}
                className="inline-flex items-center gap-1 text-emerald-500 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> 清空本轮作答状态
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Quiz Arena + Navigator */}
      {!currentQ ? (
        <div className="glass-panel rounded-3xl p-14 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold">当前筛选条件下没有题目</h3>
          <p className="text-sm text-slate-400">
            可能是你已经把该章节的未做题或错题全部刷完啦！试试切换回「全部题目」或换一个章节。
          </p>
          <button
            onClick={() => {
              setChapterFilter('all');
              setStatusFilter('all');
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm cursor-pointer"
          >
            恢复查看全部 {MCQ_QUESTIONS.length} 题
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${showNavGrid ? 'xl:grid-cols-12' : ''} gap-5 items-start`}>
          {/* Question Card Column */}
          <div className={showNavGrid ? 'xl:col-span-8 space-y-4' : 'max-w-4xl mx-auto w-full space-y-4'}>
            {/* Progress Strip */}
            <div className="h-1.5 w-full rounded-full bg-zinc-500/15 overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 dark:bg-amber-400"
                animate={{ width: `${((safeIndex + 1) / deck.length) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${currentQ.id}-${shakeKey}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 26 }}
                animate={
                  shakeKey > 0 && selectedOption && selectedOption !== currentQ.answer
                    ? { opacity: 1, x: [0, -10, 10, -7, 7, 0] }
                    : { opacity: 1, x: 0 }
                }
                exit={{ opacity: 0, x: -direction * 26 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="glass-panel-strong rounded-3xl p-6 md:p-7 shadow-xl space-y-6"
              >
                {/* Question Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-zinc-900/[0.06] dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-100 border border-zinc-900/10 dark:border-white/[0.1]">
                      第 {safeIndex + 1} / {deck.length} 题 · 题库 #{currentQ.id}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-500/12 text-zinc-600 dark:text-zinc-300">
                      第 {currentQ.chapter} 章 · {currentQ.section}
                    </span>
                    {currentQ.isExamScope && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        ★ 考试必考
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingNote((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        progress.notes[currentQ.id]
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                      title="个人速记笔记"
                    >
                      <NotebookPen className="w-3.5 h-3.5" />
                      {progress.notes[currentQ.id] ? '有笔记' : '记笔记'}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        onToggleBookmark(currentQ.id);
                        soundEngine.click();
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-slate-500/10 text-slate-400 hover:text-amber-400'
                      }`}
                      title="收藏题目 (快捷键 F)"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                      {isBookmarked ? '已收藏' : '收藏'}
                    </motion.button>
                  </div>
                </div>

                {/* Question Stem & Optional Code Block */}
                <div className="space-y-3.5">
                  <h2 className="text-lg md:text-xl font-bold leading-relaxed tracking-tight">
                    <RichText text={currentQ.stem} />
                  </h2>
                  {currentQ.code && <PythonCodeBlock code={currentQ.code} />}
                </div>

                {/* Options A / B / C / D */}
                <div className="grid grid-cols-1 gap-3">
                  {OPTION_KEYS.map((key, idx) => {
                    const isCorrectOpt = key === currentQ.answer;
                    const isPicked = selectedOption === key;

                    let cardStyle =
                      'border-zinc-500/18 bg-zinc-500/[0.04] hover:bg-zinc-500/[0.09] hover:border-zinc-400/50 dark:hover:border-white/25';
                    let badgeStyle = 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300';

                    if (revealed) {
                      if (isCorrectOpt) {
                        cardStyle =
                          'border-emerald-500/70 bg-emerald-500/14 shadow-lg shadow-emerald-500/10';
                        badgeStyle = 'bg-emerald-500 text-slate-950';
                      } else if (isPicked && !isCorrectOpt) {
                        cardStyle = 'border-rose-500/70 bg-rose-500/14';
                        badgeStyle = 'bg-rose-500 text-white';
                      } else {
                        cardStyle = 'border-slate-500/10 bg-slate-500/[0.02] opacity-60';
                      }
                    }

                    return (
                      <motion.button
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={!revealed ? { scale: 1.01, x: 4 } : undefined}
                        whileTap={!revealed ? { scale: 0.99 } : undefined}
                        onClick={() => handleSelect(key)}
                        disabled={revealed && !studyMode}
                        className={`w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                          !revealed ? 'cursor-pointer' : 'cursor-default'
                        } ${cardStyle}`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl font-mono font-extrabold text-sm flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                        >
                          {key}
                        </span>
                        <span className="flex-1 text-sm md:text-[15px] leading-relaxed font-medium">
                          <RichText text={currentQ.options[key]} />
                        </span>
                        {revealed && isCorrectOpt && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {revealed && isPicked && !isCorrectOpt && (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation Accordion */}
                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`rounded-2xl p-4.5 border space-y-2.5 ${
                          selectedOption && selectedOption !== currentQ.answer
                            ? 'bg-rose-500/8 border-rose-500/25'
                            : 'bg-emerald-500/8 border-emerald-500/25'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-mono text-xs">
                              正确答案：{currentQ.answer}
                            </span>
                            {selectedOption && selectedOption === currentQ.answer && (
                              <span className="text-emerald-500 dark:text-emerald-300">
                                回答正确，稳稳拿分！
                              </span>
                            )}
                            {selectedOption && selectedOption !== currentQ.answer && (
                              <span className="text-rose-500 dark:text-rose-300">
                                你选了 {selectedOption} · 已自动收入错题本
                              </span>
                            )}
                          </div>
                          {isInMistake && (
                            <button
                              onClick={() => {
                                onRemoveMistake(currentQ.id);
                                soundEngine.correct(2);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> 移出错题本（已掌握）
                            </button>
                          )}
                        </div>
                        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line">
                          <RichText text={currentQ.explanation} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Personal Note Box */}
                <AnimatePresence>
                  {(editingNote || progress.notes[currentQ.id]) && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl bg-amber-500/[0.07] border border-amber-500/25 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <span>我的速记笔记（自动本地保存）</span>
                        {!editingNote && (
                          <button
                            onClick={() => setEditingNote(true)}
                            className="hover:underline cursor-pointer"
                          >
                            编辑
                          </button>
                        )}
                      </div>
                      {editingNote ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            rows={2}
                            placeholder="写下你的口诀、易混对比或老师强调的考点..."
                            className="w-full rounded-xl bg-white dark:bg-[#111114] border border-zinc-300 dark:border-white/[0.12] p-2.5 text-xs outline-none focus:border-amber-500/60"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNote(false)}
                              className="px-3 py-1 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/15 cursor-pointer"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => {
                                onSaveNote(currentQ.id, noteDraft.trim());
                                setEditingNote(false);
                                soundEngine.click();
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer"
                            >
                              保存笔记
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                          {progress.notes[currentQ.id]}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prev / Next Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-500/12">
                  <button
                    onClick={() => goTo(safeIndex - 1)}
                    disabled={safeIndex === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-35 text-sm font-semibold transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> 上一题
                  </button>

                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-500/15">A-D / 1-4</kbd>
                    <span>作答</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-500/15">← →</kbd>
                    <span>切题</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-500/15">F</kbd>
                    <span>收藏</span>
                  </div>

                  <button
                    onClick={() => goTo(safeIndex + 1)}
                    disabled={safeIndex >= deck.length - 1}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 disabled:opacity-35 text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    下一题 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Answer Sheet Navigator */}
          {showNavGrid && (
            <div className="xl:col-span-4 glass-panel rounded-3xl p-5 space-y-4 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">答题卡快速导航</h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> 对
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> 错
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500/25" /> 未做
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-9 xl:grid-cols-6 gap-1.5 max-h-[440px] overflow-y-auto pr-1">
                {deck.map((q, idx) => {
                  const rec = progress.records[q.id];
                  const sess = sessionSelected[q.id];
                  const isCurrent = idx === safeIndex;

                  let cls = 'bg-slate-500/10 text-slate-500 dark:text-slate-400 hover:bg-slate-500/20';
                  if (sess) {
                    cls =
                      sess === q.answer
                        ? 'bg-emerald-500/25 text-emerald-500 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/25 text-rose-500 dark:text-rose-300 border-rose-500/40';
                  } else if (rec) {
                    cls = rec.lastCorrect
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-500 dark:text-rose-400';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => goTo(idx)}
                      className={`relative h-9 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-amber-400 border-amber-400 scale-105 z-10'
                          : 'border-transparent'
                      } ${cls}`}
                    >
                      {q.id}
                      {progress.bookmarks.includes(q.id) && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
