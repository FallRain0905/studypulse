import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Play, RotateCcw, Terminal, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PythonRunResponse } from '../types';
import { runPythonCode } from '../utils/pythonRunner';
import { soundEngine } from '../utils/sound';

export function QuickPythonDrawer({
  open,
  initialCode,
  initialStdin = '',
  title = 'Python 3 实时演练沙盒',
  onClose,
  onOpenInIde,
}: {
  open: boolean;
  initialCode: string;
  initialStdin?: string;
  title?: string;
  onClose: () => void;
  onOpenInIde?: (code: string, stdin: string, title: string) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [stdin, setStdin] = useState(initialStdin);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PythonRunResponse | null>(null);

  useEffect(() => {
    if (open) {
      setCode(initialCode);
      setStdin(initialStdin);
      setResult(null);
    }
  }, [open, initialCode, initialStdin]);

  async function handleRun() {
    setRunning(true);
    soundEngine.click();
    const res = await runPythonCode({ code, stdin });
    setResult(res);
    setRunning(false);
    if (res.ok) {
      soundEngine.correct(1);
    } else {
      soundEngine.wrong();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl h-full glass-panel-strong border-l border-zinc-500/20 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-500/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{title}</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">直连本机 Python 3 解释器 · 支持自由修改验证</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {onOpenInIde && (
                  <button
                    onClick={() => {
                      onOpenInIde(code, stdin, title);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    在 IDE 中打开 ↗
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-500/15 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">main.py</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCode(initialCode)}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> 重置代码
                    </button>
                    <button
                      onClick={handleRun}
                      disabled={running}
                      className="text-xs flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current text-emerald-400 dark:text-emerald-600" />}
                      运行代码
                    </button>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const el = e.currentTarget;
                      const start = el.selectionStart;
                      const end = el.selectionEnd;
                      setCode(code.substring(0, start) + '    ' + code.substring(end));
                      requestAnimationFrame(() => {
                        el.selectionStart = el.selectionEnd = start + 4;
                      });
                    }
                  }}
                  spellCheck={false}
                  rows={14}
                  className="w-full rounded-xl bg-white dark:bg-[#111114] text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-white/[0.1] p-4 font-mono text-[13px] leading-6 outline-none focus:border-zinc-500 dark:focus:border-amber-400/60 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                  标准输入 stdin（如果代码含 input() 可在此填入）
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  rows={2}
                  placeholder="可选输入..."
                  className="w-full rounded-xl bg-white dark:bg-[#0e0e11] border border-zinc-300 dark:border-white/[0.09] p-3 font-mono text-xs outline-none focus:border-zinc-500 dark:focus:border-amber-400/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">运行控制台输出</span>
                  {result && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        result.ok
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {result.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {result.ok ? `运行成功 · ${result.durationMs}ms` : `退出码 ${result.exitCode}`}
                    </span>
                  )}
                </div>
                <div className="min-h-[120px] rounded-xl bg-slate-50 dark:bg-[#0d0d10] border border-slate-200 dark:border-white/[0.09] p-4 font-mono text-xs leading-6">
                  {!result ? (
                    <span className="text-slate-500">点击上方「运行代码」即可立即查看实时执行输出...</span>
                  ) : (
                    <>
                      {result.stdout && <pre className="text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap">{result.stdout}</pre>}
                      {result.stderr && <pre className="text-rose-700 dark:text-rose-400 whitespace-pre-wrap mt-2">{result.stderr}</pre>}
                      {!result.stdout && !result.stderr && (
                        <span className="text-slate-500">(程序正常结束，无控制台输出)</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
