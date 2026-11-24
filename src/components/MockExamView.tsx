import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Clock,
  Flag,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CHAPTERS } from '../data/knowledgeData';
import { MCQ_QUESTIONS } from '../data/questions';
import type { ExamHistoryItem, McqQuestion, OptionKey } from '../types';
import { PythonCodeBlock, RichText } from '../utils/highlight';
import { soundEngine } from '../utils/sound';
import { ProgressRing, SpotlightCard } from './MotionPrimitives';

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

interface ExamPreset {
  id: string;
  title: string;
  desc: string;
  count: number;
  minutes: number;
  scope: 'exam' | 'all';
  badge: string;
}

const PRESETS: ExamPreset[] = [
  {
    id: 'exam-sprint',
    title: '★ 最新考纲冲刺卷（4~8 章）',
    desc: '精准抽取循环、函数、列表、字典集合、文件 CSV 高频题，20 分钟快速摸底。',
    count: 25,
    minutes: 20,
    scope: 'exam',
    badge: '强烈推荐',
  },
  {
    id: 'exam-full',
    title: '★ 最新考纲全真模拟卷（4~8 章）',
    desc: '50 题高强度仿真考场，全覆盖第 4~8 章考纲易错陷阱与核心语法。',
    count: 50,
    minutes: 40,
    scope: 'exam',
    badge: '仿真考场',
  },
  {
    id: 'all-comprehensive',
    title: '全课程综合通关卷（1~10 章含继承多态）',
    desc: '打通基础语法、4~8 章核心考纲与 51603/51601 面向对象全章大练兵。',
    count: 40,
    minutes: 35,
    scope: 'all',
    badge: '全章综合',
  },
];

function sampleQuestions(pool: McqQuestion[], count: number): McqQuestion[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export function MockExamView({
  examHistory,
  onCompleteExam,
}: {
  examHistory: ExamHistoryItem[];
  onCompleteExam: (
    item: ExamHistoryItem,
    answers: Array<{ questionId: number; selected: OptionKey; isCorrect: boolean }>
  ) => void;
}) {
  const [stage, setStage] = useState<'setup' | 'running' | 'result'>('setup');
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, OptionKey>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalSec, setTotalSec] = useState(1200);
  const [remainingSec, setRemainingSec] = useState(1200);
  const [reviewOnlyWrong, setReviewOnlyWrong] = useState(true);

  function startPreset(p: ExamPreset) {
    const pool = p.scope === 'exam' ? MCQ_QUESTIONS.filter((q) => q.isExamScope) : MCQ_QUESTIONS;
    const picked = sampleQuestions(pool, p.count);
    setExamTitle(p.title);
    setQuestions(picked);
    setAnswers({});
    setFlagged({});
    setCurrentIdx(0);
    setTotalSec(p.minutes * 60);
    setRemainingSec(p.minutes * 60);
    setStage('running');
    soundEngine.click();
  }

  function submitExam() {
    const durationSec = Math.max(1, totalSec - remainingSec);
    let correct = 0;
    const chapterBreakdown: Record<number, { total: number; correct: number }> = {};
    const recorded: Array<{ questionId: number; selected: OptionKey; isCorrect: boolean }> = [];

    for (const q of questions) {
      const sel = answers[q.id];
      const ok = sel === q.answer;
      if (ok) correct += 1;
      if (!chapterBreakdown[q.chapter]) {
        chapterBreakdown[q.chapter] = { total: 0, correct: 0 };
      }
      chapterBreakdown[q.chapter].total += 1;
      if (ok) chapterBreakdown[q.chapter].correct += 1;
      if (sel) {
        recorded.push({ questionId: q.id, selected: sel, isCorrect: ok });
      }
    }

    const scorePercent = Math.round((correct / Math.max(1, questions.length)) * 100);
    const historyItem: ExamHistoryItem = {
      id: `exam-${Date.now()}`,
      timestamp: Date.now(),
      title: examTitle,
      total: questions.length,
      correct,
      scorePercent,
      durationSec,
      chapterBreakdown,
    };

    onCompleteExam(historyItem, recorded);
    setStage('result');

    if (scorePercent >= 80) {
      soundEngine.fanfare();
      confetti({
        particleCount: 95,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#a855f7'],
      });
    } else {
      soundEngine.click();
    }
  }

  // Countdown tick
  useEffect(() => {
    if (stage !== 'running') return;
    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  // Auto submit when timer hits 0
  useEffect(() => {
    if (stage === 'running' && remainingSec === 0) {
      submitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, remainingSec]);

  const resultStats = useMemo(() => {
    if (stage !== 'result') return null;
    const correct = questions.filter((q) => answers[q.id] === q.answer).length;
    const pct = Math.round((correct / Math.max(1, questions.length)) * 100);
    const byChapter: Record<number, { total: number; correct: number }> = {};
    for (const q of questions) {
      if (!byChapter[q.chapter]) byChapter[q.chapter] = { total: 0, correct: 0 };
      byChapter[q.chapter].total += 1;
      if (answers[q.id] === q.answer) byChapter[q.chapter].correct += 1;
    }
    return { correct, total: questions.length, pct, byChapter };
  }, [stage, questions, answers]);

  if (stage === 'setup') {
    return (
      <div className="space-y-6 pb-10">
        <div className="glass-panel-strong rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
              <Award className="w-4 h-4" /> 全真考场环境 · 交卷前隐藏答案 · 错题自动归档
            </div>
            <h1 className="text-2xl font-extrabold">限时模拟考试中心</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              选择一份试卷开始计时测验，交卷后立即生成分章节诊断报告并同步错题到错题本。
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono bg-slate-500/10 px-4 py-2.5 rounded-xl">
            已完成模考：<strong className="text-emerald-400 text-base">{examHistory.length}</strong> 场
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRESETS.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <SpotlightCard
                glowColor={idx === 0 ? 'rgba(217, 155, 38, 0.14)' : 'rgba(255, 255, 255, 0.08)'}
                className="p-6 h-full flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    {p.badge}
                  </span>
                  <h2 className="text-lg font-extrabold leading-snug">{p.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono py-2.5 px-3 rounded-xl bg-slate-500/10">
                    <span>题量：{p.count} 题</span>
                    <span>时长：{p.minutes} 分钟</span>
                  </div>
                  <button
                    onClick={() => startPreset(p)}
                    className="btn-shimmer w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm shadow-sm cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" /> 立即开考
                  </button>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {examHistory.length > 0 && (
          <div className="glass-panel rounded-3xl p-6 space-y-3">
            <h3 className="font-bold text-sm">历史模考成绩单</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {examHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-slate-500/8 border border-slate-500/12 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-sm">{h.title}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      答对 {h.correct}/{h.total} · 用时 {Math.floor(h.durationSec / 60)}分{h.durationSec % 60}秒
                    </div>
                  </div>
                  <div
                    className={`font-mono text-2xl font-extrabold ${
                      h.scorePercent >= 80
                        ? 'text-emerald-400'
                        : h.scorePercent >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                    }`}
                  >
                    {h.scorePercent}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'running') {
    const q = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    const urgent = remainingSec <= 180;

    return (
      <div className="space-y-5 pb-12">
        {/* Top Exam Status Bar */}
        <div className="glass-panel-strong rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-20 z-20">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">{examTitle}</span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-500/12 text-slate-400">
              已作答 {answeredCount} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-1.5 font-mono text-sm font-extrabold px-3.5 py-1.5 rounded-xl border ${
                urgent
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 dark:text-rose-400 animate-pulse'
                  : 'bg-zinc-900/[0.06] dark:bg-white/[0.07] border-zinc-300 dark:border-white/[0.12] text-zinc-800 dark:text-zinc-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>

            <button
              onClick={submitExam}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> 提前交卷评分
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div className="xl:col-span-8 glass-panel-strong rounded-3xl p-6 md:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-900/[0.06] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200">
                第 {currentIdx + 1} / {questions.length} 题 · 第 {q.chapter} 章
              </span>
              <button
                onClick={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))}
                className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-xl border cursor-pointer ${
                  flagged[q.id]
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                    : 'bg-slate-500/10 border-transparent text-slate-400'
                }`}
              >
                <Flag className="w-3.5 h-3.5" /> {flagged[q.id] ? '已标记疑问' : '标记疑问'}
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold leading-relaxed">
                <RichText text={q.stem} />
              </h2>
              {q.code && <PythonCodeBlock code={q.code} />}
            </div>

            <div className="space-y-3">
              {OPTION_KEYS.map((key) => {
                const selected = answers[q.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [q.id]: key }));
                      soundEngine.click();
                    }}
                    className={`w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      selected
                        ? 'border-amber-500/70 bg-amber-500/10 shadow-sm'
                        : 'border-zinc-500/18 bg-zinc-500/[0.04] hover:border-zinc-400/50 dark:hover:border-white/25'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl font-mono font-bold text-sm flex items-center justify-center shrink-0 ${
                        selected ? 'bg-amber-500 dark:bg-amber-400 text-zinc-950' : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {key}
                    </span>
                    <span className="text-sm md:text-[15px] font-medium">
                      <RichText text={q.options[key]} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-500/15">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-xl bg-slate-500/12 disabled:opacity-35 text-sm font-semibold cursor-pointer"
              >
                ← 上一题
              </button>
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-sm font-bold cursor-pointer"
                >
                  下一题 →
                </button>
              ) : (
                <button
                  onClick={submitExam}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold cursor-pointer"
                >
                  完成并交卷
                </button>
              )}
            </div>
          </div>

          <div className="xl:col-span-4 glass-panel rounded-3xl p-5 space-y-3">
            <h3 className="font-bold text-sm">考场答题卡</h3>
            <div className="grid grid-cols-6 gap-2">
              {questions.map((item, idx) => {
                const done = Boolean(answers[item.id]);
                const isFlag = Boolean(flagged[item.id]);
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`relative h-9 rounded-xl font-mono text-xs font-bold border cursor-pointer transition-all ${
                      idx === currentIdx ? 'ring-2 ring-amber-400 scale-105' : ''
                    } ${
                      done
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-500/10 border-transparent text-slate-400'
                    }`}
                  >
                    {idx + 1}
                    {isFlag && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result stage
  const visibleReview = reviewOnlyWrong
    ? questions.filter((q) => answers[q.id] !== q.answer)
    : questions;

  return (
    <div className="space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel-strong rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <ProgressRing
            percent={resultStats?.pct ?? 0}
            size={112}
            strokeWidth={10}
            color={(resultStats?.pct ?? 0) >= 80 ? '#10b981' : (resultStats?.pct ?? 0) >= 60 ? '#d99b26' : '#f43f5e'}
            label={`${resultStats?.pct ?? 0}分`}
          />
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> 模拟考评分报告 · 错题已自动同步至错题本
            </div>
            <h2 className="text-2xl font-extrabold">{examTitle}</h2>
            <p className="text-sm text-slate-400">
              共 {resultStats?.total} 题，答对 <strong className="text-emerald-400">{resultStats?.correct}</strong> 题，错/未答{' '}
              <strong className="text-rose-400">
                {(resultStats?.total ?? 0) - (resultStats?.correct ?? 0)}
              </strong>{' '}
              题
            </p>
          </div>
        </div>

        <button
          onClick={() => setStage('setup')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> 再考一场
        </button>
      </motion.div>

      {/* Per-Chapter Diagnostic */}
      {resultStats && (
        <div className="glass-panel rounded-3xl p-6 space-y-3">
          <h3 className="font-bold text-sm">各章节得分率诊断</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(resultStats.byChapter).map(([chStr, val]) => {
              const ch = Number(chStr);
              const meta = CHAPTERS.find((c) => c.chapter === ch);
              const pct = Math.round((val.correct / val.total) * 100);
              return (
                <div key={ch} className="p-3.5 rounded-2xl bg-slate-500/8 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>
                      第 {ch} 章 {meta?.title}
                    </span>
                    <span className={pct >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-500/20 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    对 {val.correct} / {val.total} 题
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Answer Review */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">逐题解析复盘</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewOnlyWrong(true)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                reviewOnlyWrong ? 'bg-rose-500 text-white' : 'bg-slate-500/12 text-slate-400'
              }`}
            >
              仅看错题
            </button>
            <button
              onClick={() => setReviewOnlyWrong(false)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                !reviewOnlyWrong ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950' : 'bg-zinc-500/12 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              查看全部 ({questions.length})
            </button>
          </div>
        </div>

        {visibleReview.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center text-emerald-400 font-bold">
            满分通关！没有任何错题！
          </div>
        ) : (
          visibleReview.map((q) => {
            const picked = answers[q.id];
            const ok = picked === q.answer;
            return (
              <div
                key={q.id}
                className={`glass-panel rounded-2xl p-5 border space-y-3 ${
                  ok ? 'border-emerald-500/25' : 'border-rose-500/35'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-400">
                    题库 #{q.id} · 第 {q.chapter} 章
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      ok ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {ok ? '回答正确' : `你的答案：${picked ?? '未作答'} ｜ 正确答案：${q.answer}`}
                  </span>
                </div>
                <div className="font-semibold text-sm">
                  <RichText text={q.stem} />
                </div>
                {q.code && <PythonCodeBlock code={q.code} compact />}
                <div className="text-xs text-slate-500 dark:text-slate-300 bg-slate-500/10 rounded-xl p-3">
                  <strong className="text-emerald-500 dark:text-emerald-300">解析：</strong>
                  <RichText text={q.explanation} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
