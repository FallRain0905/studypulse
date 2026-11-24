import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Download,
  NotebookPen,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { MCQ_QUESTIONS } from '../data/questions';
import type { UserProgress } from '../types';
import { PythonCodeBlock, RichText } from '../utils/highlight';
import { soundEngine } from '../utils/sound';

export function MistakeBookView({
  progress,
  onStartMistakeQuiz,
  onJumpQuestion,
  onRemoveMistake,
  onToggleBookmark,
  onImportProgress,
  onResetProgress,
}: {
  progress: UserProgress;
  onStartMistakeQuiz: () => void;
  onJumpQuestion: (id: number) => void;
  onRemoveMistake: (id: number) => void;
  onToggleBookmark: (id: number) => void;
  onImportProgress: (data: UserProgress) => void;
  onResetProgress: () => void;
}) {
  const [tab, setTab] = useState<'mistakes' | 'bookmarks' | 'notes'>('mistakes');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const mistakeList = useMemo(
    () =>
      MCQ_QUESTIONS.filter((q) => progress.records[q.id]?.inMistakeBook).sort(
        (a, b) => (progress.records[b.id]?.wrongCount ?? 0) - (progress.records[a.id]?.wrongCount ?? 0)
      ),
    [progress.records]
  );

  const bookmarkList = useMemo(
    () => MCQ_QUESTIONS.filter((q) => progress.bookmarks.includes(q.id)),
    [progress.bookmarks]
  );

  const noteList = useMemo(
    () => MCQ_QUESTIONS.filter((q) => Boolean(progress.notes[q.id]?.trim())),
    [progress.notes]
  );

  const activeList = tab === 'mistakes' ? mistakeList : tab === 'bookmarks' ? bookmarkList : noteList;

  function handleExport() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pypulse-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as UserProgress;
        if (parsed && typeof parsed === 'object' && parsed.records) {
          onImportProgress(parsed);
          soundEngine.fanfare();
        }
      } catch {
        // invalid json
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner + Controls */}
      <div className="glass-panel-strong rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'mistakes' as const, label: `错题本 (${mistakeList.length})`, icon: AlertTriangle },
              { id: 'bookmarks' as const, label: `收藏夹 (${bookmarkList.length})`, icon: Bookmark },
              { id: 'notes' as const, label: `我的笔记 (${noteList.length})`, icon: NotebookPen },
            ]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  active ? 'text-white dark:text-zinc-950' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/10'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mistake-subtab-pill"
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

        <div className="flex flex-wrap items-center gap-2">
          {mistakeList.length > 0 && (
            <button
              onClick={onStartMistakeQuiz}
              className="btn-shimmer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> 错题一键重练
            </button>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-500/12 hover:bg-slate-500/20 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> 导出进度
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-500/12 hover:bg-slate-500/20 text-xs font-semibold cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> 导入恢复
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 重置记录
            </button>
          ) : (
            <button
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              确认清空全部进度？
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {activeList.length === 0 ? (
        <div className="glass-panel rounded-3xl p-14 text-center space-y-2.5">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold">
            {tab === 'mistakes'
              ? '错题本空空如也！'
              : tab === 'bookmarks'
                ? '暂无收藏题目'
                : '暂无个人笔记'}
          </h3>
          <p className="text-sm text-slate-400">
            {tab === 'mistakes'
              ? '刷题或模拟考答错的题目会自动归档到这里，方便考前集中消灭。'
              : '在刷题界面点击「收藏」或「记笔记」即可随时归档重要题目。'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeList.map((q) => {
              const rec = progress.records[q.id];
              return (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, x: 40 }}
                  className="glass-panel-strong rounded-3xl p-5 md:p-6 space-y-3.5 border border-slate-500/18"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-500/15">
                        #{q.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        第 {q.chapter} 章 · {q.chapterTitle}
                      </span>
                      {q.isExamScope && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                          ★ 考试范围
                        </span>
                      )}
                      {rec && rec.wrongCount > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                          历史错 {rec.wrongCount} 次
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onJumpQuestion(q.id)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900/[0.08] hover:bg-zinc-900/15 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-zinc-800 dark:text-zinc-100 text-xs font-bold cursor-pointer"
                      >
                        重做此题
                      </button>
                      {tab === 'mistakes' && (
                        <button
                          onClick={() => {
                            onRemoveMistake(q.id);
                            soundEngine.correct(2);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 dark:text-emerald-300 text-xs font-bold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> 斩题移出
                        </button>
                      )}
                      {tab === 'bookmarks' && (
                        <button
                          onClick={() => onToggleBookmark(q.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/12 text-rose-400 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 取消收藏
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="font-bold text-sm md:text-base leading-relaxed">
                    <RichText text={q.stem} />
                  </div>
                  {q.code && <PythonCodeBlock code={q.code} compact />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(['A', 'B', 'C', 'D'] as const).map((k) => {
                      const isAns = k === q.answer;
                      return (
                        <div
                          key={k}
                          className={`p-2.5 rounded-xl border ${
                            isAns
                              ? 'bg-emerald-500/12 border-emerald-500/40 font-semibold'
                              : 'bg-slate-500/[0.04] border-transparent text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span className="font-mono font-bold mr-1.5">{k}.</span>
                          <RichText text={q.options[k]} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-emerald-500 dark:text-emerald-300">解析（答案 {q.answer}）：</strong>
                    <RichText text={q.explanation} />
                  </div>

                  {progress.notes[q.id] && (
                    <div className="rounded-xl bg-amber-500/[0.08] border border-amber-500/25 p-3 text-xs text-amber-800 dark:text-amber-200">
                      <strong>我的笔记：</strong>
                      {progress.notes[q.id]}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
