import {
  Award,
  CheckCircle2,
  Download,
  ExternalLink,
  RotateCcw,
  Upload,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { Cet6Progress, CetLevel } from '../../types/cet6';
import { soundEngine } from '../../utils/sound';
import { ProgressRing } from '../MotionPrimitives';

export function Cet6HistoryView({
  level = 'cet6',
  progress,
  onOpenPaper,
  onImportProgress,
  onResetProgress,
}: {
  level?: CetLevel;
  progress: Cet6Progress;
  onOpenPaper: (paperId: string, mode: 'practice' | 'mock') => void;
  onImportProgress: (data: Cet6Progress) => void;
  onResetProgress: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const codeLabel = level === 'cet4' ? 'CET-4' : 'CET-6';
  const cnName = level === 'cet4' ? '四级' : '六级';

  function handleExport() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studypulse-${level}-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.click();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Cet6Progress;
        if (parsed && typeof parsed === 'object' && parsed.attempts) {
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
    <div className="space-y-5 pb-12">
      <div className="glass-panel-strong rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
            <Award className="w-4 h-4" /> {codeLabel} 710 分制历次成绩与进度备份
          </div>
          <h2 className="text-xl font-extrabold mt-1">{cnName}模考成绩单</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            点击任意历史记录可立即回到原卷复盘错题、重听音频与核对解析
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-500/12 hover:bg-zinc-500/20 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> 导出{cnName}进度
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-500/12 hover:bg-zinc-500/20 text-xs font-semibold cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> 导入恢复
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 清空记录
            </button>
          ) : (
            <button
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
            >
              确认清空全部六级记录？
            </button>
          )}
        </div>
      </div>

      {progress.examHistory.length === 0 ? (
        <div className="glass-panel rounded-3xl p-14 text-center space-y-2.5">
          <CheckCircle2 className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-lg font-bold">暂无已提交的{cnName}成绩单</h3>
          <p className="text-sm text-zinc-500">
            前往「真题库」任选一套卷完成作答并交卷，系统会自动按{cnName} 710 分权重折算并归档在这里。
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {progress.examHistory.map((rec) => {
            const b = rec.breakdown;
            const pct710 = Math.round((b.totalEstimated710 / 710) * 100);
            const passed = b.totalEstimated710 >= 425;
            return (
              <div
                key={rec.id}
                className="glass-panel-strong rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-zinc-200/80 dark:border-white/[0.08]"
              >
                <div className="flex items-center gap-5">
                  <ProgressRing
                    percent={pct710}
                    size={78}
                    strokeWidth={7}
                    color={b.totalEstimated710 >= 550 ? '#10b981' : passed ? '#d99b26' : '#f43f5e'}
                    label={`${b.totalEstimated710}`}
                  />
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.mode === 'mock'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {rec.mode === 'mock' ? '限时模考' : '练习交卷'}
                      </span>
                      <span className="font-bold text-base">{rec.paperTitle}</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-3 font-mono">
                      <span>{new Date(rec.timestamp).toLocaleString('zh-CN')}</span>
                      <span>
                        用时 {Math.floor(rec.durationSec / 60)}分{rec.durationSec % 60}秒
                      </span>
                      <span>
                        客观题 {b.objectiveCorrect}/{b.objectiveTotal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                  <div className="px-3 py-2 rounded-xl bg-zinc-500/[0.07]">
                    <div className="text-[10px] text-zinc-500">听力 /248.5</div>
                    <div className="font-bold mt-0.5">{b.listeningScore}</div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-zinc-500/[0.07]">
                    <div className="text-[10px] text-zinc-500">阅读 /248.5</div>
                    <div className="font-bold mt-0.5">{b.readingScore}</div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-zinc-500/[0.07]">
                    <div className="text-[10px] text-zinc-500">写译自评 /213</div>
                    <div className="font-bold mt-0.5">
                      {(b.writingSelfScore + b.translationSelfScore).toFixed(1)}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenPaper(rec.paperId, rec.mode)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-sans font-bold text-xs cursor-pointer"
                  >
                    原卷复盘 <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
