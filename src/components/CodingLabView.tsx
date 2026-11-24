import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Eye,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Wand2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CODING_LABS } from '../data/codingLabs';
import type { CodingLab, PythonRunResponse, UserProgress } from '../types';
import { PythonCodeBlock } from '../utils/highlight';
import { normalizeOutput, runPythonCode } from '../utils/pythonRunner';
import { soundEngine } from '../utils/sound';

function stitchTemplate(lab: CodingLab, blankValues: Record<string, string>): string {
  if (lab.type !== 'fill-blank' || !lab.templateCode) return '';
  let result = lab.templateCode;
  for (const slot of lab.blanks ?? []) {
    const val = blankValues[slot.id] ?? '';
    result = result.replace(`{{${slot.id}}}`, val);
  }
  return result;
}

export function CodingLabView({
  progress,
  initialLabId,
  onMarkSolved,
  onSaveDraft,
  onSaveBlankDraft,
  onOpenInIde,
}: {
  progress: UserProgress;
  initialLabId?: string | null;
  onMarkSolved: (labId: string) => void;
  onSaveDraft: (labId: string, code: string) => void;
  onSaveBlankDraft: (labId: string, blanks: Record<string, string>) => void;
  onOpenInIde?: (payload: { title: string; filename: string; code: string; stdin?: string; files?: Record<string, string> }) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'exam' | '51600' | '51601' | '51603'>('all');
  const [activeId, setActiveId] = useState<string>(initialLabId || CODING_LABS[0].id);

  useEffect(() => {
    if (initialLabId) {
      setActiveId(initialLabId);
      setFilter('all');
    }
  }, [initialLabId]);

  const filteredLabs = useMemo(() => {
    return CODING_LABS.filter((l) => {
      if (filter === 'exam') return l.isExamScope;
      if (filter === '51600') return l.source.includes('51600');
      if (filter === '51601') return l.source.includes('51601');
      if (filter === '51603') return l.source.includes('51603');
      return true;
    });
  }, [filter]);

  const lab = useMemo(
    () => CODING_LABS.find((l) => l.id === activeId) ?? filteredLabs[0] ?? CODING_LABS[0],
    [activeId, filteredLabs]
  );

  const [code, setCode] = useState('');
  const [blankVals, setBlankVals] = useState<Record<string, string>>({});
  const [stdinVal, setStdinVal] = useState('');
  const [virtualFiles, setVirtualFiles] = useState<Record<string, string>>({});
  const [activeFileTab, setActiveFileTab] = useState<string>('__stdin__');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showStitched, setShowStitched] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<PythonRunResponse | null>(null);
  const [judgeMatch, setJudgeMatch] = useState<boolean | null>(null);

  // Sync editor state when switching lab
  useEffect(() => {
    setCode(progress.labDrafts[lab.id] ?? lab.starterCode);
    const savedBlanks = progress.labBlankDrafts[lab.id] ?? {};
    const initBlanks: Record<string, string> = {};
    for (const slot of lab.blanks ?? []) {
      initBlanks[slot.id] = savedBlanks[slot.id] ?? '';
    }
    setBlankVals(initBlanks);
    setStdinVal(lab.defaultStdin ?? '');
    setVirtualFiles(lab.virtualFiles ? { ...lab.virtualFiles } : {});
    const vNames = Object.keys(lab.virtualFiles ?? {});
    setActiveFileTab(vNames.length > 0 ? vNames[0] : '__stdin__');
    setShowAnswer(false);
    setRunResult(null);
    setJudgeMatch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lab.id]);

  const executableCode = lab.type === 'fill-blank' ? stitchTemplate(lab, blankVals) : code;

  async function handleRunAndJudge() {
    setRunning(true);
    soundEngine.click();
    const res = await runPythonCode({
      code: executableCode,
      stdin: stdinVal,
      files: virtualFiles,
      readOutputFile: lab.expectedOutputFile,
    });
    setRunResult(res);
    setRunning(false);

    if (!res.ok) {
      setJudgeMatch(false);
      soundEngine.wrong();
      return;
    }

    const actualRaw = lab.expectedOutputFile ? (res.outputFileContent ?? '') : res.stdout;
    const isMatch = normalizeOutput(actualRaw) === normalizeOutput(lab.expectedOutput);
    setJudgeMatch(isMatch);

    if (isMatch) {
      onMarkSolved(lab.id);
      soundEngine.fanfare();
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    } else {
      soundEngine.wrong();
    }
  }

  function handleFillReference() {
    if (lab.type === 'fill-blank' && lab.blanks) {
      const filled: Record<string, string> = {};
      for (const s of lab.blanks) filled[s.id] = s.answer;
      setBlankVals(filled);
      onSaveBlankDraft(lab.id, filled);
    } else {
      setCode(lab.referenceAnswer);
      onSaveDraft(lab.id, lab.referenceAnswer);
    }
    soundEngine.click();
  }

  function handleReset() {
    if (lab.type === 'fill-blank' && lab.blanks) {
      const cleared: Record<string, string> = {};
      for (const s of lab.blanks) cleared[s.id] = '';
      setBlankVals(cleared);
      onSaveBlankDraft(lab.id, cleared);
    } else {
      setCode(lab.starterCode);
      onSaveDraft(lab.id, lab.starterCode);
    }
    setRunResult(null);
    setJudgeMatch(null);
  }

  const actualDisplay = runResult
    ? lab.expectedOutputFile
      ? runResult.outputFileContent ?? '(未生成目标输出文件 ' + lab.expectedOutputFile + ')'
      : runResult.stdout
    : '';

  return (
    <div className="space-y-5 pb-12">
      {/* Lab Filter + Horizontal Selector */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', `全部实验 (${CODING_LABS.length})`],
                ['exam', `★ 考纲 4~8 章 (${CODING_LABS.filter((l) => l.isExamScope).length})`],
                ['51600', '作业 51600 · CSV'],
                ['51601', '作业 51601 · 继承多态（新更）'],
                ['51603', '作业 51603 · 类与封装'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          <span className="text-xs text-slate-400">
            本地 Python 3 实时判题 · 已通过{' '}
            <strong className="text-emerald-400">
              {progress.solvedLabs.length}/{CODING_LABS.length}
            </strong>
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filteredLabs.map((item) => {
            const solved = progress.solvedLabs.includes(item.id);
            const active = item.id === lab.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveId(item.id);
                  soundEngine.click();
                }}
                className={`shrink-0 px-3.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  active
                    ? 'bg-zinc-900/[0.06] dark:bg-white/[0.08] border-zinc-900/35 dark:border-amber-400/50 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'bg-zinc-500/[0.05] border-zinc-500/15 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400/40'
                }`}
              >
                {solved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Code2 className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold whitespace-nowrap">{item.title}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.source} · {item.type === 'fill-blank' ? '程序填空' : '编程题'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split IDE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Problem Statement & Reference */}
        <div className="xl:col-span-5 space-y-4">
          <div className="glass-panel-strong rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                {lab.source}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-500/15 text-zinc-600 dark:text-zinc-300">
                {lab.scoreLabel}
              </span>
              {progress.solvedLabs.includes(lab.id) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> 已验证通过
                </span>
              )}
            </div>

            <h2 className="text-xl font-extrabold leading-snug">{lab.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{lab.description}</p>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">核心要求</div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {lab.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400/80 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {lab.pitfallNote && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{lab.pitfallNote}</span>
              </div>
            )}

            <div className="rounded-2xl bg-zinc-500/[0.07] p-3.5 space-y-2 text-xs">
              <div className="font-bold text-zinc-600 dark:text-zinc-300">
                期望输出{lab.expectedOutputFile ? `（文件 ${lab.expectedOutputFile}）` : '（标准输出 stdout）'}
              </div>
              <pre className="font-mono text-[11px] leading-5 bg-slate-50 dark:bg-[#111114] text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-white/[0.08] p-3 rounded-xl overflow-x-auto">
                {lab.expectedOutput}
              </pre>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => setShowAnswer((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-500/12 hover:bg-zinc-500/20 text-xs font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> {showAnswer ? '隐藏参考答案与解析' : '查看参考答案与解析'}
              </button>
              <button
                onClick={handleFillReference}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" /> 一键填入参考代码并试跑
              </button>
            </div>

            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-2 border-t border-slate-500/15"
              >
                <PythonCodeBlock code={lab.referenceAnswer} compact />
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {lab.explanation.map((line, idx) => (
                    <p key={idx}>• {line}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Code / Fill-Blank Editor + Virtual Files + Console */}
        <div className="xl:col-span-7 space-y-4">
          <div className="glass-panel-strong rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="font-bold text-sm">
                  {lab.type === 'fill-blank' ? '程序片段填空区（自动拼接模板运行）' : 'Python 代码编辑器'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onOpenInIde && (
                  <button
                    onClick={() =>
                      onOpenInIde({
                        title: lab.title,
                        filename: `${lab.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.py`,
                        code: executableCode || lab.starterCode,
                        stdin: stdinVal,
                        files: virtualFiles,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    在 IDE 中调试 ↗
                  </button>
                )}
                {lab.type === 'fill-blank' && (
                  <button
                    onClick={() => setShowStitched((v) => !v)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-500/12 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    {showStitched ? '隐藏完整代码' : '预览拼接代码'}
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-500/12 hover:bg-zinc-500/20 text-xs font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 重置
                </button>
                <button
                  onClick={handleRunAndJudge}
                  disabled={running}
                  className="btn-shimmer inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {running ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-emerald-400 dark:text-emerald-600" />
                  )}
                  运行并校验样例
                </button>
              </div>
            </div>

            {lab.type === 'fill-blank' && lab.blanks ? (
              <div className="space-y-4">
                {lab.blanks.map((slot) => (
                  <div key={slot.id} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-emerald-500 dark:text-emerald-300">
                        {slot.label}
                      </label>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/12 text-amber-500 dark:text-amber-300">
                        {slot.indentHint}
                      </span>
                    </div>
                    {slot.multiline ? (
                      <textarea
                        value={blankVals[slot.id] ?? ''}
                        onChange={(e) => {
                          const next = { ...blankVals, [slot.id]: e.target.value };
                          setBlankVals(next);
                          onSaveBlankDraft(lab.id, next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const el = e.currentTarget;
                            const s = el.selectionStart;
                            const end = el.selectionEnd;
                            const val = blankVals[slot.id] ?? '';
                            const updated = val.substring(0, s) + '    ' + val.substring(end);
                            const next = { ...blankVals, [slot.id]: updated };
                            setBlankVals(next);
                            onSaveBlankDraft(lab.id, next);
                            requestAnimationFrame(() => {
                              el.selectionStart = el.selectionEnd = s + 4;
                            });
                          }
                        }}
                        rows={6}
                        spellCheck={false}
                        placeholder={slot.placeholder}
                        className="w-full rounded-xl bg-white dark:bg-[#111114] text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-white/[0.1] p-3.5 font-mono text-xs leading-6 outline-none focus:border-zinc-500 dark:focus:border-amber-400/60"
                      />
                    ) : (
                      <input
                        value={blankVals[slot.id] ?? ''}
                        onChange={(e) => {
                          const next = { ...blankVals, [slot.id]: e.target.value };
                          setBlankVals(next);
                          onSaveBlankDraft(lab.id, next);
                        }}
                        spellCheck={false}
                        placeholder={slot.placeholder}
                        className="w-full rounded-xl bg-white dark:bg-[#111114] text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-white/[0.1] px-3.5 py-2.5 font-mono text-xs outline-none focus:border-zinc-500 dark:focus:border-amber-400/60"
                      />
                    )}
                  </div>
                ))}

                {showStitched && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-400">实际送入 Python 解释器的完整代码：</div>
                    <PythonCodeBlock code={executableCode} compact />
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  onSaveDraft(lab.id, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const s = el.selectionStart;
                    const end = el.selectionEnd;
                    const updated = code.substring(0, s) + '    ' + code.substring(end);
                    setCode(updated);
                    onSaveDraft(lab.id, updated);
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = s + 4;
                    });
                  }
                }}
                rows={15}
                spellCheck={false}
                className="w-full rounded-2xl bg-white dark:bg-[#111114] text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-white/[0.1] p-4 font-mono text-[13px] leading-6 outline-none focus:border-zinc-500 dark:focus:border-amber-400/60 resize-y"
              />
            )}

            {/* Virtual Input Files & Stdin */}
            <div className="rounded-2xl border border-zinc-500/18 bg-zinc-500/[0.04] p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.keys(virtualFiles).map((fname) => (
                  <button
                    key={fname}
                    onClick={() => setActiveFileTab(fname)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                      activeFileTab === fname
                        ? 'bg-zinc-900/10 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border border-zinc-400/35 dark:border-white/20'
                        : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <FileText className="w-3 h-3" /> {fname}
                  </button>
                ))}
                <button
                  onClick={() => setActiveFileTab('__stdin__')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                    activeFileTab === '__stdin__'
                      ? 'bg-zinc-900/10 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border border-zinc-400/35 dark:border-white/20'
                      : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  stdin 标准输入
                </button>
              </div>

              {activeFileTab === '__stdin__' ? (
                <textarea
                  value={stdinVal}
                  onChange={(e) => setStdinVal(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  placeholder="标准输入内容（可自由修改测试边界用例）..."
                  className="w-full rounded-xl bg-white dark:bg-[#0e0e11] text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-white/[0.09] p-2.5 font-mono text-xs outline-none"
                />
              ) : (
                <textarea
                  value={virtualFiles[activeFileTab] ?? ''}
                  onChange={(e) =>
                    setVirtualFiles((prev) => ({ ...prev, [activeFileTab]: e.target.value }))
                  }
                  rows={5}
                  spellCheck={false}
                  className="w-full rounded-xl bg-white dark:bg-[#0e0e11] text-zinc-800 dark:text-amber-100 border border-zinc-300 dark:border-white/[0.09] p-2.5 font-mono text-xs outline-none"
                />
              )}
            </div>

            {/* Output & Judge Result */}
            <div className="rounded-2xl bg-slate-50 dark:bg-[#0d0d10] border border-slate-200 dark:border-white/[0.09] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  运行结果与自动比对{lab.expectedOutputFile ? `（读取 ${lab.expectedOutputFile}）` : ''}
                </span>
                {runResult && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{runResult.durationMs}ms</span>
                    {judgeMatch === true && (
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> MATCH ✓ 样例完全匹配！
                      </motion.span>
                    )}
                    {judgeMatch === false && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> 未匹配（请核对下方输出或报错）
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!runResult ? (
                <div className="text-xs font-mono text-slate-500 py-4">
                  点击右上角「运行并校验样例」，将调用本机 Python 3 在隔离沙盒中真实执行代码并逐行比对输出...
                </div>
              ) : (
                <div className="space-y-2.5 font-mono text-xs">
                  {actualDisplay && (
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 mb-1">
                        {lab.expectedOutputFile ? `生成文件内容：${lab.expectedOutputFile}` : '实际 stdout：'}
                      </div>
                      <pre className="text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.07] p-3 rounded-xl max-h-56 overflow-auto">
                        {actualDisplay}
                      </pre>
                    </div>
                  )}
                  {lab.expectedOutputFile && runResult.stdout && (
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 mb-1">控制台 stdout：</div>
                      <pre className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.07] p-2.5 rounded-xl">
                        {runResult.stdout}
                      </pre>
                    </div>
                  )}
                  {runResult.stderr && (
                    <div>
                      <div className="text-[10px] uppercase text-rose-600 dark:text-rose-400 mb-1">错误信息 stderr：</div>
                      <pre className="text-rose-800 dark:text-rose-400 whitespace-pre-wrap bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-500/25 p-3 rounded-xl">
                        {runResult.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
