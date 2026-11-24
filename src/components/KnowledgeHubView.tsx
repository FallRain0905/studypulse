import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Code2,
  Compass,
  Eye,
  Flame,
  Play,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CHAPTERS,
  HOMEWORK_CATALOG,
  KNOWLEDGE_POINTS,
  PITFALL_VAULT,
} from '../data/knowledgeData';
import {
  CRAM_30_MIN_CHECKLIST,
  FIFTEEN_MIN_SELF_TEST,
  LESSON_PLANS_4_TO_8,
  PLATFORM_FORMAT_RULES,
} from '../data/lessonPlanData';
import type { UserProgress } from '../types';
import { PythonCodeBlock } from '../utils/highlight';
import { soundEngine } from '../utils/sound';
import { SpotlightCard } from './MotionPrimitives';

export type KnowledgeSubTab = 'lesson' | 'notes' | 'pitfalls' | 'homework';

export function KnowledgeHubView({
  progress,
  initialChapter,
  initialSubTab,
  onToggleMastered,
  onRunSnippet,
  onJumpLab,
}: {
  progress: UserProgress;
  initialChapter?: number | 'all' | 'exam';
  initialSubTab?: KnowledgeSubTab;
  onToggleMastered: (kpId: string) => void;
  onRunSnippet: (title: string, code: string, stdin?: string) => void;
  onJumpLab: (labId: string) => void;
}) {
  const [subTab, setSubTab] = useState<KnowledgeSubTab>(initialSubTab ?? 'lesson');
  const [chapterFilter, setChapterFilter] = useState<number | 'all' | 'exam'>(
    initialChapter ?? 'exam'
  );
  const [lessonChapter, setLessonChapter] = useState<number | 'cram'>(4);
  const [checkedMistakes, setCheckedMistakes] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
    if (initialChapter !== undefined) {
      setChapterFilter(initialChapter);
      if (typeof initialChapter === 'number' && initialChapter >= 4 && initialChapter <= 8) {
        setLessonChapter(initialChapter);
      }
    }
  }, [initialChapter, initialSubTab]);

  const filteredNotes = KNOWLEDGE_POINTS.filter((kp) => {
    if (chapterFilter === 'exam') return kp.isExamScope;
    if (typeof chapterFilter === 'number') return kp.chapter === chapterFilter;
    return true;
  });

  const activeLesson =
    typeof lessonChapter === 'number'
      ? LESSON_PLANS_4_TO_8.find((l) => l.chapter === lessonChapter) ?? LESSON_PLANS_4_TO_8[0]
      : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Sub-tab switcher with shared layoutId pill */}
      <div className="glass-panel rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'lesson' as const, label: '★ 4~8 章教案与考点地图', icon: Compass },
              { id: 'notes' as const, label: '全章知识精讲（可运行）', icon: BookOpen },
              { id: 'pitfalls' as const, label: '高危踩坑 & 平台格式规则', icon: ShieldAlert },
              { id: 'homework' as const, label: '21 份作业归档总览', icon: ClipboardList },
            ]
          ).map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSubTab(t.id);
                  soundEngine.click();
                }}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'text-white dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="knowledge-subtab-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-zinc-900 dark:bg-zinc-100 shadow-sm"
                  />
                )}
                <t.icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 px-2">
          已掌握精讲专题：
          <strong className="text-emerald-400 ml-1">
            {progress.masteredKnowledge.length} / {KNOWLEDGE_POINTS.length}
          </strong>
        </div>
      </div>

      {/* Sub-tab 1: NEW Interactive 4~8 Lesson Plan & Exam Blueprint */}
      {subTab === 'lesson' && (
        <div className="space-y-5">
          {/* Chapter Pill Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {LESSON_PLANS_4_TO_8.map((lp) => {
              const active = lessonChapter === lp.chapter;
              return (
                <button
                  key={lp.chapter}
                  onClick={() => {
                    setLessonChapter(lp.chapter);
                    soundEngine.click();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500 dark:bg-amber-400 text-zinc-950 shadow-sm'
                      : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                  }`}
                >
                  {lp.title}
                </button>
              );
            })}
            <button
              onClick={() => {
                setLessonChapter('cram');
                soundEngine.click();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                lessonChapter === 'cram'
                  ? 'bg-rose-600 dark:bg-rose-500 text-white shadow-sm'
                  : 'bg-rose-500/12 text-rose-500 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/25'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              考前 30 分钟速览 + 15 分钟自测 (10 题)
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeLesson ? (
              <motion.div
                key={activeLesson.chapter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-5"
              >
                {/* Chapter Header */}
                <div className="glass-panel-strong rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-500/25">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> 复习教案 · 考试范围（第 4~8 章）
                    </div>
                    <h2 className="text-xl font-extrabold">{activeLesson.title}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {activeLesson.tagline}
                    </p>
                  </div>
                  {activeLesson.highlightCode && (
                    <button
                      onClick={() =>
                        onRunSnippet(
                          activeLesson.highlightCode!.title,
                          activeLesson.highlightCode!.code,
                          activeLesson.highlightCode!.stdin
                        )
                      }
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-emerald-400 dark:text-emerald-600" /> 沙盒试跑本章精讲代码
                    </button>
                  )}
                </div>

                {/* Blueprint Map + Pattern Cheat Sheet */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {/* Blueprint Table */}
                  <div className="glass-panel rounded-3xl p-5 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-400" />
                      考点地图（重要度定位）
                    </h3>
                    <div className="space-y-2">
                      {activeLesson.blueprint.map((row, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-500/[0.07] text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">
                              {row.topic}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              对应题目：{row.problems}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 text-amber-400">
                            {Array.from({ length: row.stars }).map((_, s) => (
                              <Star key={s} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pattern Cheat Sheet */}
                  <div className="glass-panel rounded-3xl p-5 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      题型套路速查（看到特征直接套代码）
                    </h3>
                    <div className="space-y-2.5">
                      {activeLesson.patterns.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-zinc-500/[0.06] border border-zinc-500/12 space-y-1.5 text-xs"
                        >
                          <div className="font-bold text-zinc-800 dark:text-zinc-100">
                            {p.clue}
                          </div>
                          <code className="block px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111114] border border-slate-200/80 dark:border-white/[0.08] text-amber-800 dark:text-amber-200 font-mono text-[11px] overflow-x-auto">
                            {p.template}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Highlight Code + Interactive Mistake Checklist */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {activeLesson.highlightCode && (
                    <div className="glass-panel rounded-3xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm">{activeLesson.highlightCode.title}</h3>
                        <button
                          onClick={() =>
                            onRunSnippet(
                              activeLesson.highlightCode!.title,
                              activeLesson.highlightCode!.code,
                              activeLesson.highlightCode!.stdin
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 dark:text-emerald-300 text-xs font-bold cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" /> 运行验证
                        </button>
                      </div>
                      <PythonCodeBlock code={activeLesson.highlightCode.code} compact />
                    </div>
                  )}

                  <div className="glass-panel rounded-3xl p-5 space-y-3 border border-rose-500/20">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-rose-500 dark:text-rose-300">
                      <AlertTriangle className="w-4 h-4" />
                      本章考前易错自检清单（点击勾选已避坑）
                    </h3>
                    <div className="space-y-2">
                      {activeLesson.mistakes.map((m, idx) => {
                        const key = `${activeLesson.chapter}-${idx}`;
                        const done = Boolean(checkedMistakes[key]);
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setCheckedMistakes((prev) => ({ ...prev, [key]: !prev[key] }));
                              soundEngine.click();
                            }}
                            className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                              done
                                ? 'bg-emerald-500/12 text-slate-400 line-through'
                                : 'bg-rose-500/[0.06] hover:bg-rose-500/12 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                done ? 'text-emerald-400' : 'text-rose-400/60'
                              }`}
                            />
                            <span className="leading-relaxed">{m}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Cram 30 Min + 15 Min 10-Question Self Test */
              <motion.div
                key="cram"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* 30 Min Cram Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {CRAM_30_MIN_CHECKLIST.map((card) => (
                    <div
                      key={card.title}
                      className="glass-panel-strong rounded-3xl p-5 space-y-3 border border-slate-500/20"
                    >
                      <h3 className="font-extrabold text-sm">{card.title}</h3>
                      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        {card.items.map((it, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400/80 shrink-0" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* 15 Min Self-Test 10 Problems */}
                <div className="glass-panel-strong rounded-3xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base">教案附录 B · 15 分钟考前自测（10 题）</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        先在脑中构思代码，再点击「看参考骨架」核对，带「去实验室写码」标记的题目可直接在线运行判题！
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {FIFTEEN_MIN_SELF_TEST.map((item) => {
                      const shown = Boolean(revealedHints[item.id]);
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-slate-500/[0.07] border border-slate-500/15 space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-extrabold text-amber-500">
                                自测 #{item.id} · 第 {item.chapter} 章
                              </span>
                              <div className="flex items-center gap-1.5">
                                {item.labId && (
                                  <button
                                    onClick={() => onJumpLab(item.labId!)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                                  >
                                    <Play className="w-3 h-3 fill-current" /> 去实验室写码
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    setRevealedHints((prev) => ({
                                      ...prev,
                                      [item.id]: !prev[item.id],
                                    }))
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-500/15 text-slate-400 hover:text-slate-200 text-[11px] font-semibold cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> {shown ? '收起' : '看骨架'}
                                </button>
                              </div>
                            </div>
                            <p className="text-xs md:text-sm font-semibold leading-relaxed">
                              {item.prompt}
                            </p>
                          </div>
                          {shown && (
                            <div className="text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-500/[0.07] dark:bg-white/[0.04] border border-zinc-500/15 dark:border-white/[0.09] rounded-xl p-2.5 leading-relaxed">
                              <strong className="text-amber-700 dark:text-amber-300">参考骨架：</strong>
                              {item.hint}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Sub-tab 2: Full Chapter Notes */}
      {subTab === 'notes' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'exam' as const, label: '★ 考纲 4~8 章' },
              { id: 'all' as const, label: '全部章节' },
              ...CHAPTERS.map((c) => ({ id: c.chapter, label: `第${c.chapter}章 ${c.title}` })),
            ].map((item) => (
              <button
                key={String(item.id)}
                onClick={() => setChapterFilter(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  chapterFilter === item.id
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredNotes.map((kp, idx) => {
              const mastered = progress.masteredKnowledge.includes(kp.id);
              return (
                <motion.div
                  key={kp.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <SpotlightCard
                    glowColor={kp.isExamScope ? 'rgba(217, 155, 38, 0.14)' : 'rgba(255, 255, 255, 0.08)'}
                    className="p-5 md:p-6 space-y-4 h-full flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900/[0.06] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200">
                              第 {kp.chapter} 章
                            </span>
                            {kp.isExamScope && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                ★ 考纲 4~8 章
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-extrabold leading-snug">{kp.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {kp.summary}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onToggleMastered(kp.id);
                            soundEngine.click();
                          }}
                          className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            mastered
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-slate-500/10 border-slate-500/20 text-slate-400 hover:border-emerald-500/40'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {mastered ? '已掌握' : '标记掌握'}
                        </button>
                      </div>

                      <ul className="space-y-1.5 text-xs md:text-[13px] text-slate-600 dark:text-slate-300">
                        {kp.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400/80 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      {kp.examples.map((ex, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400">{ex.title}</span>
                            <button
                              onClick={() => onRunSnippet(ex.title, ex.code, ex.stdin)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" /> 沙盒试跑这段代码
                            </button>
                          </div>
                          <PythonCodeBlock code={ex.code} compact />
                        </div>
                      ))}
                    </div>

                    {kp.pitfall && (
                      <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        <span>
                          <strong>考场易错点：</strong>
                          {kp.pitfall}
                        </span>
                      </div>
                    )}
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-tab 3: Pitfall Vault + Format Rules */}
      {subTab === 'pitfalls' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {PITFALL_VAULT.map((pf, idx) => (
              <motion.div
                key={pf.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-panel-strong rounded-3xl p-5 space-y-3.5 border border-rose-500/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        pf.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {pf.severity === 'critical' ? '高危丢分点' : '高频易错'}
                    </span>
                    <span className="text-xs text-slate-400">{pf.category}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{pf.source}</span>
                </div>

                <h3 className="text-base font-extrabold">{pf.title}</h3>

                {pf.wrongExample && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">✗ 常见错误写法</div>
                    <pre className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-500/25 font-mono text-xs text-rose-900 dark:text-rose-200 overflow-x-auto whitespace-pre-wrap">
                      {pf.wrongExample}
                    </pre>
                  </div>
                )}

                {pf.rightExample && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">✓ 正确 / 满分避坑姿势</div>
                    <pre className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-500/25 font-mono text-xs text-emerald-900 dark:text-emerald-200 overflow-x-auto whitespace-pre-wrap">
                      {pf.rightExample}
                    </pre>
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-500/10 p-3 rounded-xl">
                  <strong>核心教训：</strong>
                  {pf.lesson}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Appendix A: 9 Format Rules + Appendix B Pending Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 glass-panel rounded-3xl p-6 space-y-3">
              <h3 className="font-bold text-base">教案附录 A · 平台判题格式 9 大铁律（丢分重灾区）</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {PLATFORM_FORMAT_RULES.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-zinc-500/[0.07] space-y-1">
                    <div className="font-bold text-amber-700 dark:text-amber-300">
                      0{i + 1}. {r.rule}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {r.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-3 border border-amber-500/25">
              <h3 className="font-bold text-base text-amber-500 dark:text-amber-300">
                附 B · 课程遗留问题备忘
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-500/10 space-y-1">
                  <div className="font-bold">51073 函数课堂作业 1</div>
                  <p className="text-slate-500 dark:text-slate-300">
                    老师中途加题「函数实现素数问题」，提交时缩进错误 0/50 已过期。
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                    状态：需联系老师重开
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 space-y-1">
                  <div className="font-bold">51343 函数课堂练习 2-模块化</div>
                  <p className="text-slate-500 dark:text-slate-300">
                    forGCD / whileGCD 文件上传题，截止后平台无上传入口。
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                    状态：需联系老师重开
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 4: 21 Homeworks Table */}
      {subTab === 'homework' && (
        <div className="glass-panel-strong rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-slate-500/15 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base">课程 20047 全部 21 份作业归档清单</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                已收录最新 51601 继承与多态归档 · ★ 标记为最新第 4~8 章考试范围
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-500/10 text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold">章节</th>
                  <th className="px-4 py-3 font-bold">作业 ID</th>
                  <th className="px-4 py-3 font-bold">作业名称</th>
                  <th className="px-4 py-3 font-bold">涵盖题目 / 核心任务</th>
                  <th className="px-4 py-3 font-bold">关键技术</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/12">
                {HOMEWORK_CATALOG.map((hw) => (
                  <tr key={hw.assignId} className="hover:bg-zinc-500/[0.06] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                      第 {hw.chapter} 章
                      {hw.chapter >= 4 && hw.chapter <= 8 && (
                        <span className="ml-1.5 text-[10px] text-amber-400">★</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-700 dark:text-amber-300">
                      {hw.assignId}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {hw.title}
                      {hw.note && (
                        <span
                          className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                            hw.note.includes('新更')
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {hw.note}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-md">
                      {hw.coreTask}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {hw.keyTech}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
