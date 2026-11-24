import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Code2,
  Flame,
  Layers,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { CODING_LABS } from '../data/codingLabs';
import { FLASHCARDS } from '../data/flashcards';
import { CHAPTERS, KNOWLEDGE_POINTS } from '../data/knowledgeData';
import { MCQ_QUESTIONS } from '../data/questions';
import type { AppTab, UserProgress } from '../types';
import { ACCENT_STYLES, AnimatedNumber, ProgressRing, SpotlightCard } from './MotionPrimitives';

export function DashboardView({
  progress,
  onNavigate,
  onStartChapterQuiz,
  onStartExamScopeSprint,
  onJumpKnowledgeChapter,
  onOpenLessonPlan,
}: {
  progress: UserProgress;
  onNavigate: (tab: AppTab) => void;
  onStartChapterQuiz: (chapter: number) => void;
  onStartExamScopeSprint: () => void;
  onJumpKnowledgeChapter: (chapter: number) => void;
  onOpenLessonPlan: () => void;
}) {
  const stats = useMemo(() => {
    const totalMcq = MCQ_QUESTIONS.length;
    const examQuestions = MCQ_QUESTIONS.filter((q) => q.isExamScope);
    const attemptedIds = Object.keys(progress.records).map(Number);
    const answeredCount = attemptedIds.length;

    let totalCorrect = 0;
    let totalAttempts = 0;
    let mistakeCount = 0;

    for (const rec of Object.values(progress.records)) {
      totalCorrect += rec.correctCount;
      totalAttempts += rec.attempts;
      if (rec.inMistakeBook) mistakeCount += 1;
    }

    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    const examCorrectUnique = examQuestions.filter(
      (q) => progress.records[q.id]?.lastCorrect === true
    ).length;
    const examProgressPct = Math.round((examCorrectUnique / examQuestions.length) * 100);

    const chapterStats = CHAPTERS.map((ch) => {
      const qs = MCQ_QUESTIONS.filter((q) => q.chapter === ch.chapter);
      const answered = qs.filter((q) => progress.records[q.id]).length;
      const mastered = qs.filter((q) => progress.records[q.id]?.lastCorrect === true).length;
      const mistakes = qs.filter((q) => progress.records[q.id]?.inMistakeBook).length;
      const pct = qs.length > 0 ? Math.round((mastered / qs.length) * 100) : 0;
      return { ...ch, total: qs.length, answered, mastered, mistakes, pct };
    });

    const masteredCards = Object.values(progress.flashcards).filter((f) => f.level >= 2).length;

    // Last 7 days activity
    const days: { label: string; key: string; count: number }[] = [];
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        label: offset === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
        key,
        count: progress.dailyActivity[key] ?? 0,
      });
    }

    // Recommend weakest exam-scope chapter
    const weakest = [...chapterStats]
      .filter((c) => c.isExamScope)
      .sort((a, b) => a.pct - b.pct || b.mistakes - a.mistakes)[0];

    return {
      totalMcq,
      answeredCount,
      accuracy,
      mistakeCount,
      examTotal: examQuestions.length,
      examCorrectUnique,
      examProgressPct,
      chapterStats,
      masteredCards,
      days,
      weakest,
    };
  }, [progress]);

  const maxDayCount = Math.max(5, ...stats.days.map((d) => d.count));

  return (
    <div className="space-y-7 pb-10">
      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-white/[0.09] bg-gradient-to-br from-white via-zinc-50/90 to-amber-50/45 dark:from-[#16161a] dark:via-[#141418] dark:to-[#191714] text-zinc-900 dark:text-zinc-100 p-6 md:p-8 shadow-lg shadow-zinc-950/[0.04] dark:shadow-2xl"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-300/15 dark:bg-amber-300/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-24 h-56 w-56 rounded-full bg-zinc-300/20 dark:bg-white/[0.025] blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/[0.05] dark:bg-white/[0.06] border border-zinc-900/10 dark:border-white/10 px-3.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              全套 9 章详细教案详解（47 节 + 33 例题）· 146 单选 · 22 实验 · 40 闪卡
            </div>
            <h1 className="font-editorial text-2xl md:text-[34px] leading-[1.22]">
              冲刺 Python 期末高分，
              <span className="text-amber-600 dark:text-amber-300">
                系统精讲与实战刷题工作台
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              已切换至最新考纲 <strong className="text-zinc-900 dark:text-zinc-100">★ 第 4~8 章（循环结构 → 函数 → 列表 → 字典集合元组 → 数据文件与 CSV）</strong>
              ，同步收录 4~8 章教案（考点地图/套路/15分钟自测）与作业 51601 继承多态全部原题。
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={onStartExamScopeSprint}
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white px-5 py-2.5 text-sm font-bold text-white dark:text-zinc-950 shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current text-amber-400 dark:text-amber-600" />
                冲刺 ★ 考纲 4~8 章（{stats.examTotal} 题）
              </button>
              <button
                onClick={onOpenLessonPlan}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 dark:bg-amber-400/[0.1] dark:hover:bg-amber-400/[0.16] border border-amber-500/25 dark:border-amber-400/25 px-4 py-2.5 text-sm font-semibold text-amber-800 dark:text-amber-200 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                从零精读详细教案
              </button>
              <button
                onClick={() => onNavigate('exam')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/85 hover:bg-white dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-500 dark:text-amber-300" />
                全真限时模拟考
              </button>
              <button
                onClick={() => onNavigate('ide')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/85 hover:bg-white dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                Web Python IDE
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 self-start lg:self-center rounded-2xl bg-white/85 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] p-5 backdrop-blur-md">
            <ProgressRing
              percent={stats.examProgressPct}
              size={92}
              strokeWidth={7}
              color="#d99b26"
              trackColor="rgba(161,161,170,0.2)"
              label={`${stats.examProgressPct}%`}
            />
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                ★ 考试范围达成度
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {stats.examCorrectUnique}
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400"> / {stats.examTotal} 题已掌握</span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {stats.weakest
                  ? `建议优先强化：第 ${stats.weakest.chapter} 章 ${stats.weakest.title}`
                  : '保持节奏，稳步通关！'}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: '累计已刷题量',
            value: stats.answeredCount,
            suffix: ` / ${stats.totalMcq}`,
            sub: `今日刷题 ${stats.days[stats.days.length - 1]?.count ?? 0} 次`,
            icon: Target,
            accent: 'text-emerald-500 bg-emerald-500/12',
            glow: 'rgba(16, 185, 129, 0.16)',
            onClick: () => onNavigate('quiz'),
          },
          {
            label: '历史综合正确率',
            value: stats.accuracy,
            suffix: '%',
            sub: `当前连击 ${progress.streak} · 最高 ${progress.bestStreak}`,
            icon: Flame,
            accent: 'text-amber-500 bg-amber-500/12',
            glow: 'rgba(245, 158, 11, 0.16)',
            onClick: () => onNavigate('quiz'),
          },
          {
            label: '错题本待消灭',
            value: stats.mistakeCount,
            suffix: ' 题',
            sub: stats.mistakeCount > 0 ? '点击立即重练斩题' : '当前无遗留错题，太棒了！',
            icon: AlertTriangle,
            accent: 'text-rose-500 bg-rose-500/12',
            glow: 'rgba(244, 63, 94, 0.16)',
            onClick: () => onNavigate('mistakes'),
          },
          {
            label: '知识 & 实验 & 闪卡',
            value:
              progress.masteredKnowledge.length + progress.solvedLabs.length + stats.masteredCards,
            suffix: ` / ${KNOWLEDGE_POINTS.length + CODING_LABS.length + FLASHCARDS.length}`,
            sub: `已过实验 ${progress.solvedLabs.length}/${CODING_LABS.length} · 闪卡 ${stats.masteredCards}/${FLASHCARDS.length}`,
            icon: Layers,
            accent: 'text-cyan-500 bg-cyan-500/12',
            glow: 'rgba(6, 182, 212, 0.16)',
            onClick: () => onNavigate('flashcards'),
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * idx, duration: 0.45 }}
          >
            <SpotlightCard
              glowColor={kpi.glow}
              onClick={kpi.onClick}
              className="p-5 cursor-pointer h-full"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-xl ${kpi.accent}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">
                <AnimatedNumber value={kpi.value} />
                <span className="text-sm font-semibold text-slate-400">{kpi.suffix}</span>
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{kpi.sub}</div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid: Chapter Mastery + Activity & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chapter Mastery Cards */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                按章节掌握度全景
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">
                  ★ 第 4~8 章最新考试范围
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                点击任意章节直接进入专项刷题或对应精讲笔记
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.chapterStats.map((ch, idx) => {
              const style = ACCENT_STYLES[ch.accent];
              return (
                <motion.div
                  key={ch.chapter}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * idx }}
                >
                  <SpotlightCard glowColor={style.glow} className="p-4.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${style.badge}`}
                          >
                            第 {ch.chapter} 章
                          </span>
                          {ch.isExamScope && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                              ★ 考试范围
                            </span>
                          )}
                          {ch.mistakes > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                              {ch.mistakes} 错题
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 font-bold text-base truncate">{ch.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {ch.subtitle}
                        </p>
                      </div>
                      <ProgressRing
                        percent={ch.pct}
                        size={52}
                        strokeWidth={5}
                        color={style.ring}
                        label={`${ch.pct}%`}
                      />
                    </div>

                    <div className="mt-3.5 h-1.5 w-full rounded-full bg-slate-500/15 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ch.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + idx * 0.03 }}
                        className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
                      />
                    </div>

                    <div className="mt-3.5 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        已掌握 <strong className="text-slate-800 dark:text-slate-100">{ch.mastered}</strong> / {ch.total} 题
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onJumpKnowledgeChapter(ch.chapter)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" /> 笔记
                        </button>
                        <button
                          onClick={() => onStartChapterQuiz(ch.chapter)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 font-semibold transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" /> 刷题
                        </button>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Rail: 7-Day Activity + Quick Launch + Mock Exam History */}
        <div className="space-y-5">
          {/* 7-Day Activity */}
          <SpotlightCard glowColor="rgba(56, 189, 248, 0.16)" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  近 7 天刷题热力柱
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">每日坚持刷题，考前保持手感</p>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                共 {stats.days.reduce((a, b) => a + b.count, 0)} 次
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 h-32 pt-4">
              {stats.days.map((d, i) => {
                const heightPct = d.count === 0 ? 8 : Math.max(18, Math.round((d.count / maxDayCount) * 100));
                return (
                  <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400">
                      {d.count > 0 ? d.count : ''}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className={`w-full max-w-[28px] rounded-t-lg ${
                        d.count > 0
                          ? 'bg-gradient-to-t from-amber-500 to-amber-300 dark:from-amber-500/90 dark:to-amber-300/90'
                          : 'bg-zinc-500/15'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>

          {/* Study Roadmap Card (from 使用建议) */}
          <SpotlightCard glowColor="rgba(245, 158, 11, 0.16)" className="p-5 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              三轮高效考前复习路线
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                {
                  step: '第 1 轮',
                  title: '读透 4~8 章教案考点地图与套路',
                  desc: '循环/函数/列表/字典集合/文件逐章定位，再刷 68 道核心单选。',
                  action: onOpenLessonPlan,
                },
                {
                  step: '第 2 轮',
                  title: '3D 闪卡速背 + 错题本集中斩题',
                  desc: '专攻高危坑点（s2=s1、{} vs set()、CSV 引号、弯引号）。',
                  action: () => onNavigate('flashcards'),
                },
                {
                  step: '考前冲刺',
                  title: '15 分钟自测写码 + 30 分钟速览',
                  desc: '在实验室实跑教案 10 题与 51600/51601 真题，抠死格式细节！',
                  action: () => onNavigate('labs'),
                },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={item.action}
                  className="w-full text-left p-3 rounded-xl bg-slate-500/8 hover:bg-emerald-500/10 border border-slate-500/10 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 dark:text-emerald-300">
                        {item.step}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </SpotlightCard>

          {/* Recent Mock Exams */}
          <SpotlightCard glowColor="rgba(139, 92, 246, 0.16)" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-400" />
                最近模拟考成绩
              </h3>
              <button
                onClick={() => onNavigate('exam')}
                className="text-xs text-violet-400 hover:underline cursor-pointer"
              >
                去模考 →
              </button>
            </div>
            {progress.examHistory.length === 0 ? (
              <div className="text-xs text-slate-400 py-5 text-center rounded-xl bg-slate-500/8 border border-dashed border-slate-500/20">
                还没有模拟考记录，随时来一场 30 题限时测验检验成果！
              </div>
            ) : (
              <div className="space-y-2">
                {progress.examHistory.slice(0, 4).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-500/8 text-xs"
                  >
                    <div>
                      <div className="font-semibold">{h.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(h.timestamp).toLocaleDateString()} · 用时 {Math.floor(h.durationSec / 60)}分
                        {h.durationSec % 60}秒
                      </div>
                    </div>
                    <div
                      className={`font-mono font-extrabold text-base ${
                        h.scorePercent >= 85
                          ? 'text-emerald-400'
                          : h.scorePercent >= 60
                            ? 'text-amber-400'
                            : 'text-rose-400'
                      }`}
                    >
                      {h.scorePercent}分
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
