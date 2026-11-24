import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Code2,
  Flame,
  GraduationCap,
  Headphones,
  Languages,
  Plus,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { CODING_LABS } from '../data/codingLabs';
import { MCQ_QUESTIONS } from '../data/questions';
import { CHAPTER_TUTORIALS } from '../data/tutorials';
import type { AppTab, UserProgress } from '../types';
import type { Cet6PaperSummary, Cet6Progress, Cet6Tab, CetLevel } from '../types/cet6';
import { getTodayKey } from '../utils/storage';
import { AnimatedNumber, ProgressRing, SpotlightCard } from './MotionPrimitives';

export function PersonalHubView({
  pythonProgress,
  cet4Progress,
  cet4Papers,
  cet4Ready,
  cet6Progress,
  cet6Papers,
  cet6Ready,
  onEnterPython,
  onEnterCet,
  onOpenCetPaper,
}: {
  pythonProgress: UserProgress;
  cet4Progress: Cet6Progress;
  cet4Papers: Cet6PaperSummary[];
  cet4Ready: boolean;
  cet6Progress: Cet6Progress;
  cet6Papers: Cet6PaperSummary[];
  cet6Ready: boolean;
  onEnterPython: (tab?: AppTab) => void;
  onEnterCet: (level: CetLevel, tab?: Cet6Tab) => void;
  onOpenCetPaper: (level: CetLevel, paperId: string, mode: 'practice' | 'mock') => void;
}) {
  const today = getTodayKey();
  const todayPy = pythonProgress.dailyActivity[today] ?? 0;
  const todayCet4 = cet4Progress.dailyActivity[today] ?? 0;
  const todayCet6 = cet6Progress.dailyActivity[today] ?? 0;
  const todayTotal = todayPy + todayCet4 + todayCet6;

  // Python metrics
  const pyExamQs = MCQ_QUESTIONS.filter((q) => q.isExamScope);
  const pyExamMastered = pyExamQs.filter((q) => pythonProgress.records[q.id]?.lastCorrect).length;
  const pyExamPct = Math.round((pyExamMastered / Math.max(1, pyExamQs.length)) * 100);
  const pyTotalAnswered = Object.keys(pythonProgress.records).length;
  const pyTotalSections = CHAPTER_TUTORIALS.reduce((acc, c) => acc + c.sections.length, 0);
  const pyReadSections = (pythonProgress.readTutorialSections ?? []).length;

  // Helper to compute CET stats
  const getCetStats = (papers: Cet6PaperSummary[], prog: Cet6Progress) => {
    const totalPapers = papers.length;
    const audioCount = papers.reduce((acc, p) => acc + p.audioCount, 0);
    const fullCount = papers.filter((p) => p.kind === 'full').length;
    const submittedCount = Object.values(prog.attempts).filter((a) => a.submitted).length;
    const inProgressCount = Object.values(prog.attempts).filter(
      (a) => !a.submitted && Object.keys(a.answers).length > 0
    ).length;
    const bestScore = prog.examHistory.reduce(
      (best, r) => Math.max(best, r.breakdown.totalEstimated710),
      0
    );
    const pct = Math.round((submittedCount / Math.max(1, totalPapers)) * 100);
    const lastPaper = prog.lastOpenedPaperId
      ? papers.find((p) => p.id === prog.lastOpenedPaperId) ?? null
      : null;
    const newestFullPaper = papers.find((p) => p.kind === 'full') ?? papers[0] ?? null;
    return {
      totalPapers,
      audioCount,
      fullCount,
      submittedCount,
      inProgressCount,
      bestScore,
      pct,
      lastPaper,
      newestFullPaper,
    };
  };

  const cet4 = getCetStats(cet4Papers, cet4Progress);
  const cet6 = getCetStats(cet6Papers, cet6Progress);

  // Unified recent exam timeline across all 3 subjects
  const recentTimeline = [
    ...pythonProgress.examHistory.map((h) => ({
      id: `py-${h.id}`,
      subject: 'Python' as const,
      title: h.title,
      scoreText: `${h.scorePercent} 分`,
      detail: `答对 ${h.correct}/${h.total} · ${Math.floor(h.durationSec / 60)}分${h.durationSec % 60}秒`,
      timestamp: h.timestamp,
      pass: h.scorePercent >= 60,
      action: () => onEnterPython('exam'),
    })),
    ...cet4Progress.examHistory.map((h) => ({
      id: `cet4-${h.id}`,
      subject: 'CET-4' as const,
      title: h.paperTitle,
      scoreText: `${h.breakdown.totalEstimated710} / 710`,
      detail: `客观题 ${h.breakdown.objectiveCorrect}/${h.breakdown.objectiveTotal} · 听力 ${h.breakdown.listeningScore} · 阅读 ${h.breakdown.readingScore}`,
      timestamp: h.timestamp,
      pass: h.breakdown.totalEstimated710 >= 425,
      action: () => onOpenCetPaper('cet4', h.paperId, h.mode),
    })),
    ...cet6Progress.examHistory.map((h) => ({
      id: `cet6-${h.id}`,
      subject: 'CET-6' as const,
      title: h.paperTitle,
      scoreText: `${h.breakdown.totalEstimated710} / 710`,
      detail: `客观题 ${h.breakdown.objectiveCorrect}/${h.breakdown.objectiveTotal} · 听力 ${h.breakdown.listeningScore} · 阅读 ${h.breakdown.readingScore}`,
      timestamp: h.timestamp,
      pass: h.breakdown.totalEstimated710 >= 425,
      action: () => onOpenCetPaper('cet6', h.paperId, h.mode),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Welcome Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] bg-gradient-to-br from-white via-zinc-50/90 to-amber-50/40 dark:from-[#16161a] dark:via-[#141418] dark:to-[#191714] text-zinc-900 dark:text-zinc-100 p-6 md:p-8 shadow-lg shadow-zinc-950/[0.04] dark:shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-300/18 dark:bg-amber-300/[0.05] blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/[0.05] dark:bg-white/[0.06] border border-zinc-900/10 dark:border-white/[0.09] text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              StudyPulse 个人全科复习工作台 · 3 大学科已就绪
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl md:text-[34px] leading-[1.22]">
              把所有备考资料，收进一个
              <span className="text-amber-600 dark:text-amber-300">专注且顺手的桌面工作台</span>
            </h1>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              已同步接入 <strong className="text-zinc-900 dark:text-zinc-100">CET-4 四级</strong>（{cet4.totalPapers || 79} 份真题 · {cet4.audioCount || 472} 段原声听力）、
              <strong className="text-zinc-900 dark:text-zinc-100">CET-6 六级</strong>（{cet6.totalPapers || 75} 份真题 · {cet6.audioCount || 399} 段原声听力）与{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">Python 课程</strong>（9 章教案 · 146 单选 · 22 实验 · Web IDE）。
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() =>
                  cet4.lastPaper
                    ? onOpenCetPaper('cet4', cet4.lastPaper.id, cet4Progress.attempts[cet4.lastPaper.id]?.mode ?? 'practice')
                    : cet4.newestFullPaper
                      ? onOpenCetPaper('cet4', cet4.newestFullPaper.id, 'mock')
                      : onEnterCet('cet4', 'papers')
                }
                className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs sm:text-sm shadow-sm cursor-pointer transition-all"
              >
                <Languages className="w-4 h-4 text-sky-400 dark:text-sky-600" />
                {cet4.lastPaper ? `继续四级：${cet4.lastPaper.folder}` : '开启四级 710 分模考'}
              </button>

              <button
                onClick={() =>
                  cet6.lastPaper
                    ? onOpenCetPaper('cet6', cet6.lastPaper.id, cet6Progress.attempts[cet6.lastPaper.id]?.mode ?? 'practice')
                    : cet6.newestFullPaper
                      ? onOpenCetPaper('cet6', cet6.newestFullPaper.id, 'mock')
                      : onEnterCet('cet6', 'papers')
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 dark:bg-amber-400/[0.12] dark:hover:bg-amber-400/[0.2] border border-amber-500/25 text-amber-800 dark:text-amber-200 font-semibold text-xs sm:text-sm cursor-pointer transition-all"
              >
                <Languages className="w-4 h-4" />
                {cet6.lastPaper ? `继续六级：${cet6.lastPaper.folder}` : '开启六级 710 分模考'}
              </button>

              <button
                onClick={() => onEnterPython('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-zinc-200 dark:border-white/[0.1] text-zinc-700 dark:text-zinc-200 font-semibold text-xs sm:text-sm cursor-pointer transition-all"
              >
                <Code2 className="w-4 h-4 text-emerald-500" />
                Python 课程
              </button>
            </div>
          </div>

          {/* Right Quick Daily Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0 min-w-[260px]">
            <div className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] p-4 space-y-1">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> 今日学习活跃
              </div>
              <div className="text-2xl font-extrabold font-mono">
                <AnimatedNumber value={todayTotal} />
                <span className="text-xs font-normal text-zinc-500 ml-1">题/次</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                四级 {todayCet4} · 六级 {todayCet6} · Py {todayPy}
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] p-4 space-y-1">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> 累计模考场次
              </div>
              <div className="text-2xl font-extrabold font-mono">
                <AnimatedNumber
                  value={
                    pythonProgress.examHistory.length +
                    cet4Progress.examHistory.length +
                    cet6Progress.examHistory.length
                  }
                />
                <span className="text-xs font-normal text-zinc-500 ml-1">场</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                四级 {cet4.bestScore || '--'} · 六级 {cet6.bestScore || '--'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Subject Workspace Cards (3 Columns) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">我的复习科目</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              左侧全局学科边栏可随时一键切换科目，各学科进度独立持久化保存
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Subject 1: CET-4 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <SpotlightCard
              glowColor="rgba(56, 189, 248, 0.14)"
              className="p-5 h-full flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25 text-[11px] font-bold">
                        CET-4 · 大学英语四级
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {cet4Ready ? '已直连' : '加载中'}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight">四级真题 & 710 分模考</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      2016–2026 共 {cet4.totalPapers || 79} 份真题与分类专项 · {cet4.audioCount || 472} 段 8 节原声听力 · 全部阅读原文无损补全。
                    </p>
                  </div>
                  <ProgressRing
                    percent={cet4.pct}
                    size={64}
                    strokeWidth={6}
                    color="#0ea5e9"
                    label={`${cet4.submittedCount}/${cet4.totalPapers || 79}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">完整听力卷</div>
                    <div className="font-mono font-bold text-sm mt-0.5">{cet4.fullCount || 59} 份</div>
                  </div>
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">进行/已完</div>
                    <div className="font-mono font-bold text-sm mt-0.5">
                      {cet4.inProgressCount}/{cet4.submittedCount}
                    </div>
                  </div>
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">最高折算</div>
                    <div className="font-mono font-bold text-sm mt-0.5 text-sky-600 dark:text-sky-300">
                      {cet4.bestScore > 0 ? cet4.bestScore : '--'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-500/12">
                <button
                  onClick={() => onEnterCet('cet4', 'overview')}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer transition-colors"
                >
                  四级总览 <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEnterCet('cet4', 'papers')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-xs font-semibold cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-sky-500" /> {cet4.totalPapers || 79}套卷
                </button>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Subject 2: CET-6 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <SpotlightCard
              glowColor="rgba(217, 155, 38, 0.14)"
              className="p-5 h-full flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[11px] font-bold">
                        CET-6 · 大学英语六级
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {cet6Ready ? '已直连' : '加载中'}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight">六级真题 & 710 分模考</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      2016–2026 共 {cet6.totalPapers || 75} 份真题与翻译汇编 · {cet6.audioCount || 399} 段 7 节原声听力 · 长篇阅读 A–O 完整补全。
                    </p>
                  </div>
                  <ProgressRing
                    percent={cet6.pct}
                    size={64}
                    strokeWidth={6}
                    color="#d99b26"
                    label={`${cet6.submittedCount}/${cet6.totalPapers || 75}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">完整听力卷</div>
                    <div className="font-mono font-bold text-sm mt-0.5">{cet6.fullCount || 57} 份</div>
                  </div>
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">进行/已完</div>
                    <div className="font-mono font-bold text-sm mt-0.5">
                      {cet6.inProgressCount}/{cet6.submittedCount}
                    </div>
                  </div>
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">最高折算</div>
                    <div className="font-mono font-bold text-sm mt-0.5 text-amber-600 dark:text-amber-300">
                      {cet6.bestScore > 0 ? cet6.bestScore : '--'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-500/12">
                <button
                  onClick={() => onEnterCet('cet6', 'overview')}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer transition-colors"
                >
                  六级总览 <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEnterCet('cet6', 'papers')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-xs font-semibold cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-amber-500" /> {cet6.totalPapers || 75}套卷
                </button>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Subject 3: Python Course */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SpotlightCard
              glowColor="rgba(16, 185, 129, 0.12)"
              className="p-5 h-full flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-[11px] font-bold">
                        Python · 考纲 4~8 章
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">含 Web IDE</span>
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight">Python 精讲与刷题</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      9 章教科书级详细教案 · {MCQ_QUESTIONS.length} 道单选 · {CODING_LABS.length} 道自动判题实验 · 40 张 3D 闪卡。
                    </p>
                  </div>
                  <ProgressRing
                    percent={pyExamPct}
                    size={64}
                    strokeWidth={6}
                    color="#10b981"
                    label={`${pyExamPct}%`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">单选已刷</div>
                    <div className="font-mono font-bold text-sm mt-0.5">
                      {pyTotalAnswered}/{MCQ_QUESTIONS.length}
                    </div>
                  </div>
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">实验已过</div>
                    <div className="font-mono font-bold text-sm mt-0.5">
                      {pythonProgress.solvedLabs.length}/{CODING_LABS.length}
                    </div>
                  </div>
                  <div className="rounded-xl bg-zinc-500/[0.07] p-2.5">
                    <div className="text-zinc-500 text-[10px]">教案精读</div>
                    <div className="font-mono font-bold text-sm mt-0.5">
                      {pyReadSections}/{pyTotalSections}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-500/12">
                <button
                  onClick={() => onEnterPython('dashboard')}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer transition-colors"
                >
                  Python 总览 <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEnterPython('tutorials')}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-xs font-semibold cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" /> 教案
                </button>
                <button
                  onClick={() => onEnterPython('ide')}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-xs font-semibold cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-500" /> IDE
                </button>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </section>

      {/* Bottom Row: Recent Exam Timeline + Future Subject Slot */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 glass-panel rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              全科最近模考与套卷记录
            </h3>
            <span className="text-[11px] text-zinc-500">跨学科统一归档</span>
          </div>

          {recentTimeline.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-semibold">还没有模考提交记录</p>
              <p className="text-xs text-zinc-500">
                点击上方任意学科完成一次限时模拟考或真题套卷，这里会自动汇总你的成长曲线。
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTimeline.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full text-left p-3.5 rounded-2xl bg-zinc-500/[0.06] hover:bg-zinc-500/[0.11] border border-zinc-500/10 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.subject === 'CET-4'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                            : item.subject === 'CET-6'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {item.subject}
                      </span>
                      <span className="font-semibold text-sm truncate">{item.title}</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.detail}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-extrabold text-base ${
                        item.pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {item.scoreText}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {new Date(item.timestamp).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Future Subject Expansion Card */}
        <div className="lg:col-span-4 rounded-3xl border border-dashed border-zinc-300 dark:border-white/[0.12] bg-zinc-500/[0.02] p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">持续扩展更多个人学科</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              目前已无缝接入 CET-4、CET-6 与 Python 三大学科。后续只要你有新的题库资料（如高数、数据结构 / 408、考研政治英语等），随时继续接入。
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-500">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-500/10">高等数学</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-500/10">数据结构</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-500/10">408 专业课</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-500/10">考研英语</span>
          </div>
        </div>
      </section>
    </div>
  );
}
