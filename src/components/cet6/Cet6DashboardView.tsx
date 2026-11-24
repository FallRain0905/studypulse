import { motion } from 'framer-motion';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import type { Cet6PaperSummary, Cet6Progress, Cet6Tab, CetLevel } from '../../types/cet6';
import { AnimatedNumber, ProgressRing, SpotlightCard } from '../MotionPrimitives';

export function Cet6DashboardView({
  level = 'cet6',
  papers,
  progress,
  loading,
  error,
  rawHtmlAvailable,
  onOpenPaper,
  onNavigateTab,
}: {
  level?: CetLevel;
  papers: Cet6PaperSummary[];
  progress: Cet6Progress;
  loading: boolean;
  error: string | null;
  rawHtmlAvailable: boolean;
  onOpenPaper: (paperId: string, mode: 'practice' | 'mock') => void;
  onNavigateTab: (tab: Cet6Tab) => void;
}) {
  const isCet4 = level === 'cet4';
  const codeLabel = isCet4 ? 'CET-4' : 'CET-6';
  const cnName = isCet4 ? '四级' : '六级';
  const segPerPaper = isCet4 ? 8 : 7;
  const fullPapers = useMemo(() => papers.filter((p) => p.kind === 'full'), [papers]);
  const totalAudios = useMemo(() => papers.reduce((sum, p) => sum + p.audioCount, 0), [papers]);
  const totalQuestions = useMemo(() => papers.reduce((sum, p) => sum + p.questionCount, 0), [papers]);

  const submittedIds = useMemo(
    () => new Set(Object.values(progress.attempts).filter((a) => a.submitted).map((a) => a.paperId)),
    [progress.attempts]
  );

  const inProgressCount = useMemo(
    () =>
      Object.values(progress.attempts).filter(
        (a) => !a.submitted && Object.keys(a.answers).length > 0
      ).length,
    [progress.attempts]
  );

  const bestScore = useMemo(
    () =>
      progress.examHistory.reduce(
        (max, r) => Math.max(max, r.breakdown.totalEstimated710),
        0
      ),
    [progress.examHistory]
  );

  const avgObjAccuracy = useMemo(() => {
    const valid = progress.examHistory.filter((r) => r.breakdown.objectiveTotal > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce(
      (acc, r) => acc + (r.breakdown.objectiveCorrect / r.breakdown.objectiveTotal) * 100,
      0
    );
    return Math.round(sum / valid.length);
  }, [progress.examHistory]);

  const completionPct = Math.round((submittedIds.size / Math.max(1, papers.length)) * 100);

  const lastPaper = progress.lastOpenedPaperId
    ? papers.find((p) => p.id === progress.lastOpenedPaperId) ?? null
    : null;
  const recommendedPaper = useMemo(() => {
    const unsubmitted = fullPapers.find((p) => !submittedIds.has(p.id));
    return unsubmitted ?? fullPapers[0] ?? papers[0] ?? null;
  }, [fullPapers, papers, submittedIds]);

  // Group papers by exam session (yearMonth) for compact timeline matrix
  const sessionGroups = useMemo(() => {
    const map = new Map<string, Cet6PaperSummary[]>();
    for (const p of papers) {
      if (p.kind === 'translation' || p.kind === 'reading-pack') continue;
      if (!map.has(p.yearMonth)) map.set(p.yearMonth, []);
      map.get(p.yearMonth)!.push(p);
    }
    return [...map.entries()];
  }, [papers]);

  const specialPapers = useMemo(
    () => papers.filter((p) => p.kind === 'translation' || p.kind === 'reading-pack'),
    [papers]
  );

  if (error) {
    return (
      <div className="glass-panel-strong rounded-3xl p-8 text-center space-y-3 border border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-extrabold">未能读取{cnName}真题数据</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
          {error}。请确认服务端 {codeLabel} 数据源可用。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] bg-gradient-to-br from-white via-zinc-50/90 to-amber-50/45 dark:from-[#16161a] dark:via-[#141418] dark:to-[#191714] text-zinc-900 dark:text-zinc-100 p-6 md:p-8 shadow-lg shadow-zinc-950/[0.04] dark:shadow-2xl">
        <div className="pointer-events-none absolute -right-14 -top-14 h-60 w-60 rounded-full bg-amber-300/18 dark:bg-amber-300/[0.05] blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/[0.05] dark:bg-white/[0.06] border border-zinc-900/10 dark:border-white/[0.09] text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                2016–2026 十年真题 · {papers.length} 套卷 · {totalQuestions.toLocaleString()} 题 · {totalAudios} 段 MP3
              </span>
              {rawHtmlAvailable && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> 阅读全文无损补全已启用
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {codeLabel} 大学英语{cnName}
              <span className="text-amber-600 dark:text-amber-300"> 真题套卷与 710 分模考</span>
            </h1>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              内置 {segPerPaper} 段原生听力流式精听（{isCet4 ? '短篇新闻 + 长对话 + 听力篇章' : '长对话 + 听力短文 + 讲话讲座'}）、15 选 10 交互词库、左右分栏长篇阅读与仔细阅读、作文/翻译实时计字与 710 分制权重换算评分。
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {recommendedPaper && (
                <button
                  onClick={() => onOpenPaper(recommendedPaper.id, 'mock')}
                  className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm shadow-sm cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-current text-amber-400 dark:text-amber-600" />
                  开考 710 分模考：{recommendedPaper.folder}
                </button>
              )}

              {lastPaper && (
                <button
                  onClick={() =>
                    onOpenPaper(lastPaper.id, progress.attempts[lastPaper.id]?.mode ?? 'practice')
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/25 text-amber-800 dark:text-amber-200 font-semibold text-sm cursor-pointer transition-all"
                >
                  <Clock className="w-4 h-4" />
                  继续上次：{lastPaper.folder}
                </button>
              )}

              <button
                onClick={() => onNavigateTab('papers')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-zinc-200 dark:border-white/[0.1] text-zinc-700 dark:text-zinc-200 font-semibold text-sm cursor-pointer transition-all"
              >
                <BookOpen className="w-4 h-4" />
                浏览全部 {papers.length} 份试卷
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/85 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shrink-0">
            <ProgressRing
              percent={completionPct}
              size={84}
              strokeWidth={7}
              color="#d99b26"
              label={`${completionPct}%`}
            />
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-300">★ 套卷通关进度</div>
              <div className="text-sm font-semibold">
                <span className="font-mono text-xl font-extrabold">{submittedIds.size}</span>
                <span className="text-zinc-500 text-xs"> / {papers.length} 份已交卷</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                另有 {inProgressCount} 份套卷进行中
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard glowColor="rgba(217, 155, 38, 0.14)" className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>历史最高 710 折算分</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono">
            {bestScore > 0 ? <AnimatedNumber value={bestScore} /> : '--'}
            <span className="text-xs font-normal text-zinc-500 ml-1">/ 710</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            {bestScore >= 550
              ? '高分水准，稳步保持'
              : bestScore >= 425
                ? '已过 425 及格线'
                : '完成首场模考解锁分值'}
          </div>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(16, 185, 129, 0.12)" className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>客观题平均正确率</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono">
            {avgObjAccuracy > 0 ? (
              <>
                <AnimatedNumber value={avgObjAccuracy} />%
              </>
            ) : (
              '--'
            )}
          </div>
          <div className="text-[11px] text-zinc-500">统计听力 + 三大阅读题型</div>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(255, 255, 255, 0.08)" className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>原生真题听力卷</span>
            <Headphones className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono">
            <AnimatedNumber value={fullPapers.length} />
            <span className="text-xs font-normal text-zinc-500 ml-1">套完整卷</span>
          </div>
          <div className="text-[11px] text-zinc-500">每套含 {segPerPaper} 段分段 MP3 音频</div>
        </SpotlightCard>

        <SpotlightCard glowColor="rgba(255, 255, 255, 0.08)" className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>累计交卷次数</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono">
            <AnimatedNumber value={progress.examHistory.length} />
            <span className="text-xs font-normal text-zinc-500 ml-1">次</span>
          </div>
          <div className="text-[11px] text-zinc-500">含练习交卷与限时模考</div>
        </SpotlightCard>
      </section>

      {/* 2016–2026 Exam Session Quick Matrix */}
      <section className="glass-panel rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold">2016–2026 历年{cnName}真题速选矩阵</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              点击任意套卷胶囊直接进入沉浸式做题（含耳机图标为 57 题完整听力卷）
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('papers')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-300 hover:underline cursor-pointer"
          >
            打开筛选库 / 选模考模式 →
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">正在加载{cnName}真题索引...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sessionGroups.map(([ym, list]) => (
              <div
                key={ym}
                className="rounded-2xl bg-zinc-500/[0.05] border border-zinc-500/12 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-zinc-700 dark:text-zinc-200">
                    {ym}
                  </span>
                  <span className="text-[11px] text-zinc-500">{list.length} 套</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((p) => {
                    const attempt = progress.attempts[p.id];
                    const latestRec = progress.examHistory.find((r) => r.paperId === p.id);
                    const isDone = Boolean(attempt?.submitted);
                    const answeredCnt = attempt ? Object.keys(attempt.answers).length : 0;
                    const shortSet = p.folder.replace(ym, '') || '全卷';

                    return (
                      <motion.button
                        key={p.id}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onOpenPaper(p.id, attempt?.mode ?? 'practice')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            : answeredCnt > 0
                              ? 'bg-amber-500/12 border-amber-500/30 text-amber-700 dark:text-amber-300'
                              : 'bg-white/70 dark:bg-white/[0.04] border-zinc-200/80 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-amber-400/50'
                        }`}
                        title={`${p.title}（${p.questionCount}题${p.audioCount > 0 ? ` · ${p.audioCount}段音频` : ''}）`}
                      >
                        {p.hasListening ? (
                          <Headphones className="w-3 h-3 shrink-0 opacity-80" />
                        ) : (
                          <FileText className="w-3 h-3 shrink-0 opacity-60" />
                        )}
                        <span className="font-mono">{shortSet.replace(/^-/, '')}</span>
                        {latestRec && (
                          <span className="font-mono text-[10px] px-1 rounded bg-emerald-500/15">
                            {latestRec.breakdown.totalEstimated710}
                          </span>
                        )}
                        {!latestRec && answeredCnt > 0 && (
                          <span className="font-mono text-[10px] opacity-80">
                            {answeredCnt}/{p.questionCount}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Special Reading Packs & Translation Compilations Strip */}
        {specialPapers.length > 0 && (
          <div className="pt-3 border-t border-zinc-500/12 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mr-1">
              分类专项汇编（{specialPapers.length} 份）：
            </span>
            {specialPapers.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenPaper(p.id, 'practice')}
                className="px-3 py-1 rounded-xl bg-zinc-500/10 hover:bg-amber-500/15 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                {p.folder} ({p.questionCount}题)
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
