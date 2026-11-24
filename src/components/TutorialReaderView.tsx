import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Compass,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  ListChecks,
  Play,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import type { ChapterTutorial } from '../types/tutorial';
import { PythonCodeBlock, RichText } from '../utils/highlight';
import { soundEngine } from '../utils/sound';
import { SpotlightCard } from './MotionPrimitives';

export function TutorialReaderView({
  tutorials,
  readSections,
  initialChapter,
  onToggleReadSection,
  onRunCode,
  onJumpChapterQuiz,
  onJumpFlashcards,
}: {
  tutorials: ChapterTutorial[];
  readSections: string[];
  initialChapter?: number;
  onToggleReadSection: (sectionId: string) => void;
  onRunCode: (title: string, code: string, stdin?: string) => void;
  onJumpChapterQuiz: (chapter: number) => void;
  onJumpFlashcards: () => void;
}) {
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter ?? 4);
  const [openWalkthroughs, setOpenWalkthroughs] = useState<Record<string, boolean>>({});
  const [openExampleSolutions, setOpenExampleSolutions] = useState<Record<string, boolean>>({});

  const active =
    tutorials.find((t) => t.chapter === selectedChapter) ??
    tutorials.find((t) => t.chapter === 4) ??
    tutorials[0];

  if (!active) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center text-slate-400">
        教案数据加载中...
      </div>
    );
  }

  const examTutorials = tutorials.filter((t) => t.isExamScope);
  const baseTutorials = tutorials.filter((t) => t.chapter <= 3);
  const extraTutorials = tutorials.filter((t) => t.chapter >= 9);

  const chapterReadCount = active.sections.filter((s) => readSections.includes(s.id)).length;
  const chapterPct =
    active.sections.length > 0 ? Math.round((chapterReadCount / active.sections.length) * 100) : 0;

  const activeIndex = tutorials.findIndex((t) => t.chapter === active.chapter);

  function selectChapter(ch: number) {
    setSelectedChapter(ch);
    soundEngine.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-14">
      {/* Left Sticky Chapter & Outline Rail */}
      <aside className="xl:col-span-3 space-y-4 xl:sticky xl:top-20">
        <div className="glass-panel-strong rounded-3xl p-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 dark:text-emerald-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" /> 全章精讲目录
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {tutorials.length} 章详解
            </span>
          </div>

          {/* Group 1: ★ Exam Scope 4~8 */}
          <div className="space-y-1.5">
            <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
              ★ 最新考试核心（第 4~8 章）
            </div>
            {examTutorials.map((t) => {
              const isCur = t.chapter === active.chapter;
              const done = t.sections.filter((s) => readSections.includes(s.id)).length;
              return (
                <button
                  key={t.chapter}
                  onClick={() => selectChapter(t.chapter)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isCur
                      ? 'bg-gradient-to-r from-amber-500/20 to-emerald-500/18 border border-amber-400/45 font-bold text-slate-900 dark:text-white shadow-sm'
                      : 'hover:bg-slate-500/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate">
                    第 {t.chapter} 章 · {t.title.replace(/^第\s*\d+\s*章[·\s：:]*/, '')}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-500/12 text-slate-400">
                    {done}/{t.sections.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Group 2: Foundation 1~3 */}
          {baseTutorials.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-500/12">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                零基础起步（第 1~3 章）
              </div>
              {baseTutorials.map((t) => {
                const isCur = t.chapter === active.chapter;
                const done = t.sections.filter((s) => readSections.includes(s.id)).length;
                return (
                  <button
                    key={t.chapter}
                    onClick={() => selectChapter(t.chapter)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isCur
                        ? 'bg-emerald-500/18 border border-emerald-400/45 font-bold text-slate-900 dark:text-white'
                        : 'hover:bg-slate-500/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">
                      第 {t.chapter} 章 · {t.title.replace(/^第\s*\d+\s*章[·\s：:]*/, '')}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">
                      {done}/{t.sections.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Group 3: OOP Ch 10 */}
          {extraTutorials.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-500/12">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                面向对象进阶（51603 + 51601）
              </div>
              {extraTutorials.map((t) => {
                const isCur = t.chapter === active.chapter;
                const done = t.sections.filter((s) => readSections.includes(s.id)).length;
                return (
                  <button
                    key={t.chapter}
                    onClick={() => selectChapter(t.chapter)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isCur
                        ? 'bg-violet-500/20 border border-violet-400/45 font-bold text-slate-900 dark:text-white'
                        : 'hover:bg-slate-500/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">
                      第 {t.chapter} 章 · {t.title.replace(/^第\s*\d+\s*章[·\s：:]*/, '')}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">
                      {done}/{t.sections.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* In-chapter Anchor Outline */}
        <div className="hidden xl:block glass-panel rounded-3xl p-4 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 px-1 flex items-center justify-between">
            <span>本章小节导航</span>
            <span className="text-emerald-400 font-mono">{chapterPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-500/15 overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 dark:bg-amber-400"
              animate={{ width: `${chapterPct}%` }}
            />
          </div>
          <div className="space-y-1 max-h-[290px] overflow-y-auto pr-1 text-xs">
            {active.sections.map((s, idx) => {
              const isRead = readSections.includes(s.id);
              return (
                <a
                  key={s.id}
                  href={`#sec-${s.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-500/10 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isRead ? 'bg-emerald-400' : 'bg-slate-500/35'
                    }`}
                  />
                  <span className="truncate">
                    {idx + 1}. {s.title.replace(/^\d+[.、\s]+/, '')}
                  </span>
                </a>
              );
            })}
            <a
              href="#worked-examples-anchor"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500 dark:text-amber-300 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>典型例题精解 ({active.workedExamples.length} 题)</span>
            </a>
            <a
              href="#cheatsheet-anchor"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-500/10 text-cyan-500 dark:text-cyan-300 font-semibold"
            >
              <ListChecks className="w-3.5 h-3.5 shrink-0" />
              <span>本章速查小抄</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Detailed Tutorial Body */}
      <div className="xl:col-span-9 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.chapter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24 }}
            className="space-y-6"
          >
            {/* Chapter Hero Header */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-white/[0.09] bg-gradient-to-br from-white via-zinc-50/90 to-amber-50/40 dark:from-[#16161a] dark:via-[#141418] dark:to-[#191714] text-zinc-900 dark:text-zinc-100 p-6 md:p-8 shadow-lg shadow-zinc-950/[0.04] dark:shadow-xl space-y-5">
              <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-amber-300/15 dark:bg-amber-300/[0.045] blur-3xl" />

              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-zinc-900/[0.06] dark:bg-white/[0.07] border border-zinc-900/10 dark:border-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold">
                    第 {active.chapter} 章 · 详细教案详解
                  </span>
                  {active.isExamScope && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/12 dark:bg-amber-400/15 border border-amber-500/30 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                      ★ 最新考试核心范围
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/[0.05] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 text-xs">
                    <Clock className="w-3.5 h-3.5" /> 预计精读 {active.estimatedMinutes} 分钟
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {active.title}
                </h1>
                <p className="text-sm text-amber-700 dark:text-amber-200/90 font-medium">{active.subtitle}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line pt-1">
                  <RichText text={active.intro} />
                </p>
              </div>

              {/* Learning Goals */}
              <div className="relative z-10 rounded-2xl bg-white/85 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] p-4 space-y-2">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-500 dark:text-amber-300" /> 学完本章你将彻底掌握：
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                  {active.learningGoals.map((g, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Strip */}
              <div className="relative z-10 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onJumpChapterQuiz(active.chapter)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> 刷本章配套单选题
                </button>
                <button
                  onClick={onJumpFlashcards}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/85 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 font-semibold text-xs cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" /> 配合 3D 闪卡记忆
                </button>
              </div>
            </div>

            {/* Progressive Tutorial Sections */}
            <div className="space-y-6">
              {active.sections.map((sec, idx) => {
                const isRead = readSections.includes(sec.id);
                const showLineByLine = openWalkthroughs[sec.id] ?? true;

                return (
                  <section
                    key={sec.id}
                    id={`sec-${sec.id}`}
                    className="glass-panel-strong rounded-3xl p-6 md:p-7 space-y-5 scroll-mt-24 border border-slate-500/18"
                  >
                    {/* Section Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-500/12">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-zinc-900/[0.06] dark:bg-white/[0.07] border border-zinc-900/10 dark:border-white/[0.1] text-zinc-800 dark:text-amber-300 font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <h2 className="text-lg md:text-xl font-extrabold leading-snug">
                          {sec.title.replace(/^\d+[.、\s]+/, '')}
                        </h2>
                      </div>

                      <button
                        onClick={() => {
                          onToggleReadSection(sec.id);
                          soundEngine.click();
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isRead
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-500/10 border-slate-500/20 text-slate-400 hover:border-emerald-400/40'
                        }`}
                      >
                        <BookOpenCheck className="w-3.5 h-3.5" />
                        {isRead ? '已学完' : '标为已读'}
                      </button>
                    </div>

                    {/* Narrative Concept Explanation */}
                    <div className="space-y-3 text-sm md:text-[15px] leading-7 text-slate-700 dark:text-slate-200">
                      {sec.concept.split(/\n{2,}/).map((para, pIdx) => (
                        <p key={pIdx} className="whitespace-pre-line">
                          <RichText text={para.trim()} />
                        </p>
                      ))}
                    </div>

                    {/* Syntax Anatomy Card */}
                    {sec.syntaxCard && (
                      <div className="rounded-2xl bg-zinc-50/90 dark:bg-[#141418] text-zinc-800 dark:text-zinc-100 border border-zinc-200/90 dark:border-white/[0.09] p-4.5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                          <Wrench className="w-3.5 h-3.5" /> 语法结构解剖 · {sec.syntaxCard.title}
                        </div>
                        <pre className="p-3 rounded-xl bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-white/[0.07] font-mono text-xs md:text-[13px] text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                          {sec.syntaxCard.syntax}
                        </pre>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sec.syntaxCard.breakdown.map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] text-xs"
                            >
                              <code className="px-1.5 py-0.5 rounded bg-amber-500/12 dark:bg-amber-400/12 text-amber-800 dark:text-amber-200 font-mono font-bold shrink-0">
                                {b.part}
                              </code>
                              <span className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{b.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Rules */}
                    {sec.keyRules.length > 0 && (
                      <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-4 space-y-2">
                        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4" /> 本节核心注意事项
                        </div>
                        <ul className="space-y-1.5 text-xs md:text-[13px] text-slate-700 dark:text-slate-200">
                          {sec.keyRules.map((rule, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-2 leading-relaxed">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span>
                                <RichText text={rule} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Runnable Code Demo + Line-by-line Explanation */}
                    {sec.codeDemo && (
                      <div className="rounded-2xl border border-sky-400/20 bg-slate-500/[0.04] p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Code2 className="w-4 h-4 text-sky-400" />
                            示例演示：{sec.codeDemo.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setOpenWalkthroughs((prev) => ({
                                  ...prev,
                                  [sec.id]: !showLineByLine,
                                }))
                              }
                              className="px-2.5 py-1 rounded-lg bg-slate-500/12 text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                              {showLineByLine ? '收起逐行拆解' : '展开逐行拆解'}
                            </button>
                            <button
                              onClick={() =>
                                onRunCode(
                                  sec.codeDemo.title,
                                  sec.codeDemo.code,
                                  sec.codeDemo.stdin
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-[11px] font-bold shadow-sm cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" /> 一键沙盒试跑
                            </button>
                          </div>
                        </div>

                        <PythonCodeBlock code={sec.codeDemo.code} compact />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl bg-zinc-50 dark:bg-[#101014] border border-zinc-200 dark:border-white/[0.08] p-3 space-y-1">
                            <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                              运行输出参考
                            </div>
                            <pre className="font-mono text-zinc-800 dark:text-emerald-300/90 whitespace-pre-wrap leading-5">
                              {sec.codeDemo.expectedOutput}
                            </pre>
                          </div>

                          {showLineByLine && sec.codeDemo.lineByLine.length > 0 && (
                            <div className="rounded-xl bg-slate-500/10 p-3 space-y-1.5">
                              <div className="text-[10px] font-bold uppercase text-cyan-500 dark:text-cyan-300">
                                逐行执行轨迹
                              </div>
                              <ul className="space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                                {sec.codeDemo.lineByLine.map((line, lIdx) => (
                                  <li key={lIdx}>
                                    • <RichText text={line} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Caution Box (Wrong vs Right) */}
                    {sec.cautionBox && (
                      <div className="rounded-2xl bg-rose-500/[0.07] border border-rose-500/25 p-4 space-y-3">
                        <div className="text-xs font-extrabold text-rose-500 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> 初学者避坑对比 · {sec.cautionBox.title}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">✗ 易错写法</div>
                            <pre className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-500/25 font-mono text-xs text-rose-900 dark:text-rose-200 overflow-x-auto whitespace-pre-wrap">
                              {sec.cautionBox.wrongCode}
                            </pre>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">✓ 正确写法</div>
                            <pre className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-500/25 font-mono text-xs text-emerald-900 dark:text-emerald-200 overflow-x-auto whitespace-pre-wrap">
                              {sec.cautionBox.rightCode}
                            </pre>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong>根因剖析：</strong>
                          <RichText text={sec.cautionBox.why} />
                        </p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Worked Examples Section */}
            <div id="worked-examples-anchor" className="space-y-4 scroll-mt-24 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    本章典型例题逐行详解（{active.workedExamples.length} 题）
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    先顺着「审题思路」自己思考，再展开参考代码对照逐行精解与举一反三
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {active.workedExamples.map((ex, eIdx) => {
                  const showSol = openExampleSolutions[ex.id] ?? true;
                  const diffBadge =
                    ex.difficulty === '综合压轴'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : ex.difficulty === '常考'
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';

                  return (
                    <SpotlightCard
                      key={ex.id}
                      glowColor="rgba(245, 158, 11, 0.14)"
                      className="p-6 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-500">
                            例题 {eIdx + 1}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${diffBadge}`}>
                            {ex.difficulty}
                          </span>
                          <span className="text-xs text-slate-400">{ex.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setOpenExampleSolutions((prev) => ({ ...prev, [ex.id]: !showSol }))
                            }
                            className="px-3 py-1 rounded-xl bg-slate-500/12 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            {showSol ? '折叠详解（先自己想）' : '展开代码详解'}
                          </button>
                          <button
                            onClick={() => onRunCode(ex.title, ex.code, ex.stdin)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-sm cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> 沙盒实跑例题
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-extrabold">{ex.title}</h3>

                      <div className="rounded-2xl bg-slate-500/[0.07] border border-slate-500/15 p-4 text-sm leading-relaxed whitespace-pre-line">
                        <strong className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                          题目描述
                        </strong>
                        <RichText text={ex.problemStatement} />
                      </div>

                      {/* Thinking Steps */}
                      <div className="rounded-2xl bg-cyan-500/[0.06] border border-cyan-500/20 p-4 space-y-2">
                        <div className="text-xs font-extrabold text-cyan-600 dark:text-cyan-300">
                          拿到这道题怎么一步步思考？
                        </div>
                        <ol className="space-y-1.5 text-xs md:text-[13px] text-slate-700 dark:text-slate-200">
                          {ex.thinkingSteps.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2.5 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span>
                                <RichText text={step} />
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {showSol && (
                        <div className="space-y-4 pt-1">
                          <PythonCodeBlock code={ex.code} />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {ex.stdin && (
                              <div className="rounded-xl bg-slate-500/10 p-3 space-y-1">
                                <div className="text-[10px] font-bold uppercase text-slate-400">
                                  样例输入 stdin
                                </div>
                                <pre className="font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                  {ex.stdin}
                                </pre>
                              </div>
                            )}
                            <div
                              className={`rounded-xl bg-zinc-50 dark:bg-[#101014] border border-zinc-200 dark:border-white/[0.08] p-3 space-y-1 ${
                                !ex.stdin ? 'md:col-span-2' : ''
                              }`}
                            >
                              <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                                样例输出
                              </div>
                              <pre className="font-mono text-zinc-800 dark:text-emerald-300/90 whitespace-pre-wrap">
                                {ex.sampleOutput}
                              </pre>
                            </div>
                          </div>

                          {/* Code Walkthrough */}
                          <div className="rounded-2xl bg-slate-500/[0.06] p-4 space-y-2.5">
                            <div className="text-xs font-extrabold text-slate-500 dark:text-slate-300">
                              逐段代码精解
                            </div>
                            <div className="space-y-2">
                              {ex.codeWalkthrough.map((w, wIdx) => (
                                <div key={wIdx} className="flex items-start gap-2.5 text-xs">
                                  <span className="shrink-0 font-mono font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-500 dark:text-violet-300">
                                    {w.lines}
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    <RichText text={w.explanation} />
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Common Mistakes + Variation Tip */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3.5 space-y-1.5">
                              <div className="font-bold text-rose-500 dark:text-rose-300">
                                常见丢分点
                              </div>
                              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                                {ex.commonMistakes.map((cm, cIdx) => (
                                  <li key={cIdx}>
                                    • <RichText text={cm} />
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 space-y-1.5">
                              <div className="font-bold text-amber-600 dark:text-amber-300">
                                举一反三 · 考场变形
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                <RichText text={ex.variationTip} />
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </SpotlightCard>
                  );
                })}
              </div>
            </div>

            {/* Chapter Cheatsheet */}
            <div
              id="cheatsheet-anchor"
              className="glass-panel-strong rounded-3xl p-6 space-y-4 scroll-mt-24"
            >
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-cyan-400" />
                第 {active.chapter} 章 · 考前速查小抄
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.summaryCheatsheet.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-500/[0.07] border border-slate-500/15 space-y-1.5 text-xs"
                  >
                    <div className="font-bold text-emerald-600 dark:text-emerald-300">
                      {item.label}
                    </div>
                    <code className="block px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#101014] border border-zinc-200/80 dark:border-white/[0.07] text-zinc-800 dark:text-amber-200 font-mono text-[11px] overflow-x-auto">
                      {item.snippet}
                    </code>
                    <div className="text-slate-500 dark:text-slate-400">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prev / Next Chapter Footer */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {activeIndex > 0 ? (
                <button
                  onClick={() => selectChapter(tutorials[activeIndex - 1].chapter)}
                  className="px-4 py-2.5 rounded-xl bg-slate-500/12 hover:bg-slate-500/20 text-xs font-bold cursor-pointer"
                >
                  ← 上一章：{tutorials[activeIndex - 1].title}
                </button>
              ) : (
                <div />
              )}

              {activeIndex < tutorials.length - 1 && (
                <button
                  onClick={() => selectChapter(tutorials[activeIndex + 1].chapter)}
                  className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  下一章：{tutorials[activeIndex + 1].title}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
