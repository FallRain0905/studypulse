import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
  RotateCw,
  Shuffle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FLASHCARDS } from '../data/flashcards';
import type { UserProgress } from '../types';
import { PythonCodeBlock } from '../utils/highlight';
import { soundEngine } from '../utils/sound';

export function FlashcardsView({
  progress,
  onRateCard,
}: {
  progress: UserProgress;
  onRateCard: (cardId: string, level: 0 | 1 | 2 | 3) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'exam' | 'unmastered'>('exam');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = useMemo(() => {
    let list = FLASHCARDS.filter((c) => {
      if (filter === 'exam') return c.isExamScope;
      if (filter === 'unmastered') return (progress.flashcards[c.id]?.level ?? 0) < 2;
      return true;
    });
    if (shuffleSeed > 0) {
      list = [...list];
      let seed = shuffleSeed;
      for (let i = list.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = seed % (i + 1);
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }, [filter, shuffleSeed, progress.flashcards]);

  const safeIdx = Math.min(idx, Math.max(0, deck.length - 1));
  const card = deck[safeIdx] ?? null;

  const masteredTotal = useMemo(
    () => FLASHCARDS.filter((c) => (progress.flashcards[c.id]?.level ?? 0) >= 2).length,
    [progress.flashcards]
  );

  const handleFlip = useCallback(() => {
    setFlipped((v) => !v);
    soundEngine.flip();
  }, []);

  const handleRate = useCallback(
    (level: 0 | 1 | 3) => {
      if (!card) return;
      onRateCard(card.id, level);
      if (level === 3) {
        soundEngine.correct(2);
      } else if (level === 1) {
        soundEngine.click();
      } else {
        soundEngine.wrong();
      }
      setFlipped(false);

      if (safeIdx < deck.length - 1) {
        setTimeout(() => setIdx((i) => Math.min(deck.length - 1, i + 1)), 160);
      } else {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b'],
        });
        soundEngine.fanfare();
      }
    },
    [card, onRateCard, safeIdx, deck.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1' && flipped) {
        handleRate(0);
      } else if (e.key === '2' && flipped) {
        handleRate(1);
      } else if (e.key === '3' && flipped) {
        handleRate(3);
      } else if (e.key === 'ArrowRight') {
        setFlipped(false);
        setIdx((i) => Math.min(deck.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setFlipped(false);
        setIdx((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleFlip, handleRate, flipped, deck.length]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['exam', `★ 考纲 4~8 章高频卡 (${FLASHCARDS.filter((c) => c.isExamScope).length})`],
              ['all', `全部核心闪卡 (${FLASHCARDS.length})`],
              ['unmastered', '仅未掌握'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => {
                setFilter(k);
                setIdx(0);
                setFlipped(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === k
                  ? k === 'exam'
                    ? 'bg-amber-500 dark:bg-amber-400 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            总掌握：<strong className="text-emerald-400">{masteredTotal}</strong> / {FLASHCARDS.length}
          </span>
          <button
            onClick={() => {
              setShuffleSeed((s) => (s === 0 ? Date.now() % 100000 : 0));
              setIdx(0);
              setFlipped(false);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              shuffleSeed > 0
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/18'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" /> 洗牌
          </button>
        </div>
      </div>

      {!card ? (
        <div className="glass-panel rounded-3xl p-14 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-extrabold">当前卡组已全部掌握！</h3>
          <p className="text-sm text-slate-400">太强了！所有高频考点都已经烂熟于心。</p>
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm cursor-pointer"
          >
            切换查看全部闪卡
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              卡片 {safeIdx + 1} / {deck.length}
            </span>
            <span>点击卡片或按 Space 空格键翻转查看解析</span>
          </div>

          {/* 3D Flip Card with Layered Deck Depth */}
          <div className="relative perspective-1200 mx-auto">
            {/* Layered back cards for tactile deck depth */}
            <div className="pointer-events-none absolute inset-x-6 -bottom-3 h-full rounded-3xl bg-slate-500/10 border border-slate-500/15 -z-20 scale-[0.95]" />
            <div className="pointer-events-none absolute inset-x-3 -bottom-1.5 h-full rounded-3xl bg-slate-500/12 border border-slate-500/20 -z-10 scale-[0.98]" />

            <AnimatePresence mode="wait">
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 30, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                onClick={handleFlip}
                className="cursor-pointer select-none"
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="relative h-[390px] md:h-[410px] w-full preserve-3d"
                >
                  {/* FRONT FACE */}
                  <div
                    style={{ transform: 'translateZ(1px)' }}
                    className="absolute inset-0 backface-hidden glass-panel-strong rounded-3xl p-7 md:p-10 flex flex-col justify-between shadow-2xl border border-zinc-200/90 dark:border-white/[0.1] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900/[0.06] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200 font-mono text-xs font-bold">
                          第 {card.chapter} 章 · {card.tag}
                        </span>
                        {card.isExamScope && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                            ★ 考试必背
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {(progress.flashcards[card.id]?.level ?? 0) >= 2 ? '✓ 已掌握' : '待巩固'}
                      </span>
                    </div>

                    <div className="my-auto py-6 space-y-4">
                      <h2 className="text-xl md:text-2xl font-extrabold leading-relaxed text-center">
                        {card.front}
                      </h2>
                      {card.frontCode && (
                        <div className="max-w-lg mx-auto">
                          <PythonCodeBlock code={card.frontCode} showLineNumbers={false} compact />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <RotateCw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      点击翻面看答案
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div
                    style={{ transform: 'rotateY(180deg) translateZ(1px)' }}
                    className="absolute inset-0 backface-hidden rounded-3xl p-7 md:p-10 flex flex-col justify-between shadow-2xl bg-gradient-to-br from-amber-50/90 via-stone-50 to-white dark:from-[#1a1a1f] dark:via-[#16161a] dark:to-[#1b1814] text-zinc-900 dark:text-zinc-100 border border-amber-500/35 dark:border-amber-400/25 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 font-bold text-xs">
                        核心答案与解析
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">第 {card.chapter} 章</span>
                    </div>

                    <div className="my-auto py-4 space-y-4">
                      <p className="text-base md:text-lg font-semibold leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-100">
                        {card.back}
                      </p>
                      {card.backCode && (
                        <PythonCodeBlock code={card.backCode} showLineNumbers={false} compact />
                      )}
                      {card.tip && (
                        <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/12 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-400/30 rounded-xl px-3.5 py-2.5">
                          💡 提示：{card.tip}
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                      请根据记忆熟练度在下方打分（或点击翻回正面）
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Confidence Rating Buttons & Nav */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                setFlipped(false);
                setIdx((i) => Math.max(0, i - 1));
              }}
              disabled={safeIdx === 0}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-500/12 disabled:opacity-35 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> 上一张
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => handleRate(0)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-500 dark:text-rose-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <XCircle className="w-4 h-4" /> [1] 没记住
              </button>
              <button
                onClick={() => handleRate(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-600 dark:text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" /> [2] 有点模糊
              </button>
              <button
                onClick={() => handleRate(3)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> [3] 秒懂掌握
              </button>
            </div>

            <button
              onClick={() => {
                setFlipped(false);
                setIdx((i) => Math.min(deck.length - 1, i + 1));
              }}
              disabled={safeIdx >= deck.length - 1}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-500/12 disabled:opacity-35 text-xs font-bold cursor-pointer"
            >
              下一张 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
