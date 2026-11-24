import {
  AlertCircle,
  BookTemplate,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileCode2,
  FilePlus,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CODING_LABS } from '../data/codingLabs';
import type { PythonDiagnostic, PythonRunResponse } from '../types';
import { checkPythonSyntax, runPythonCode } from '../utils/pythonRunner';
import { soundEngine } from '../utils/sound';
import {
  type CodeMirrorEditorHandle,
  CodeMirrorPythonEditor,
  type IdeThemeMode,
} from './CodeMirrorPythonEditor';

const IDE_STORAGE_KEY = 'pypulse_vscode_ide_workspace_v1';

export interface IdeExternalPayload {
  nonce: number;
  title?: string;
  filename?: string;
  code: string;
  stdin?: string;
  files?: Record<string, string>;
}

const DEFAULT_WORKSPACE_FILES: Record<string, string> = {
  'main.py': `# ====================================================
# PyPulse Web Python IDE (VS Code 风格体验)
# 快捷键：Ctrl+Enter / F5 运行 | Ctrl+F 查找 | Ctrl+/ 注释 | Ctrl+Space 智能补全
# 支持多文件 import（试试导入左侧 utils.py）与真实文件/CSV 读写！
# ====================================================
import csv
from utils import is_prime, format_banner

print(format_banner("欢迎使用 PyPulse Python IDE"))

# 1. 演示跨文件模块导入：筛选 30 以内素数
primes = [x for x in range(1, 31) if is_prime(x)]
print("30 以内素数:", primes)

# 2. 演示真实 CSV 读取与按总分降序排序（读取左侧 sdjw-in.csv）
with open("sdjw-in.csv", "r", encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))

header = rows[0] + ["总分"]
data = rows[1:]
data.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)

with open("sdjw-out.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for r in data:
        writer.writerow(r + [sum(map(float, r[4:]))])

print("\\n已生成排序文件 sdjw-out.csv（请在下方「生成文件」标签查看）！")
print("第一名:", data[0][2], "总分:", sum(map(float, data[0][4:])))
`,
  'utils.py': `# 工具模块：可在 main.py 中直接 import utils 使用！

def is_prime(n: int) -> bool:
    """判断正整数 n 是否为素数（√n 试除法）"""
    if n < 2:
        return False
    i = 2
    while i * i <= n:
        if n % i == 0:
            return False
        i += 1
    return True


def gcd(a: int, b: int) -> int:
    """辗转相除法求最大公约数"""
    while b != 0:
        a, b = b, a % b
    return a


def format_banner(title: str) -> str:
    line = "=" * (len(title) + 8)
    return f"{line}\\n  ★ {title} ★\\n{line}"
`,
  'src.txt': `This is a Book.
WE like reading Python!
`,
  'sdjw-in.csv': `序号,学号,姓名,班级,高数,英语,政治,体育,历史
1,2019010027,杨东,资源19-1班,92,68,85,51,70
2,2018011928,苏斌,材料18-3班,51,64,59,79,66
3,2019010088,陈晓,软件19-2班,95,88,91,84,88
4,2019010105,林悦,计科19-1班,80,82,78,86,84
`,
};

const QUICK_SNIPPETS = [
  {
    name: 'with open 安全读文件',
    code: `with open("src.txt", "r", encoding="utf-8") as f:\n    text = f.read()\n`,
  },
  {
    name: '文件不存在回退 stdin',
    code: `import sys\ntry:\n    with open("data.txt", "r", encoding="utf-8") as f:\n        content = f.read()\nexcept FileNotFoundError:\n    content = sys.stdin.read()\n`,
  },
  {
    name: 'CSV 总分降序模板',
    code: `import csv\nwith open("sdjw-in.csv", "r", encoding="utf-8", newline="") as f:\n    rows = list(csv.reader(f))\nheader, data = rows[0], rows[1:]\ndata.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)\n`,
  },
  {
    name: '字典计数 + TopN 排序',
    code: `cnt = {}\nfor item in seq:\n    cnt[item] = cnt.get(item, 0) + 1\nranked = sorted(cnt.items(), key=lambda kv: -kv[1])[:10]\n`,
  },
  {
    name: '素数判定 √n 模板',
    code: `def is_prime(n):\n    if n < 2:\n        return False\n    i = 2\n    while i * i <= n:\n        if n % i == 0:\n            return False\n        i += 1\n    return True\n`,
  },
  {
    name: '哨兵循环标准模板',
    code: `while True:\n    x = int(input())\n    if x == 0:\n        break\n`,
  },
];

function getFileIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.py')) return <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  if (lower.endsWith('.csv')) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
}

function parseTracebackErrors(stderr: string): Array<{ file: string; line: number; message: string }> {
  const results: Array<{ file: string; line: number; message: string }> = [];
  const lines = stderr.split('\n');
  const lastMsg = [...lines].reverse().find((l) => l.trim().length > 0) ?? 'Runtime Error';
  const re = /File "([^"]+)", line (\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stderr)) !== null) {
    const file = m[1].split(/[\\/]/).pop() ?? m[1];
    results.push({ file, line: Number(m[2]), message: lastMsg });
  }
  return results;
}

function visualizeWhitespace(text: string): React.ReactNode {
  return text.split('\n').map((line, i, arr) => (
    <div key={i} className="leading-6">
      {line.split('').map((ch, j) => {
        if (ch === ' ') {
          return (
            <span key={j} className="text-amber-400/70 select-none">
              ·
            </span>
          );
        }
        if (ch === '\t') {
          return (
            <span key={j} className="text-cyan-400/70 select-none">
              →   
            </span>
          );
        }
        return <React.Fragment key={j}>{ch}</React.Fragment>;
      })}
      {i < arr.length - 1 && <span className="text-sky-400/60 select-none">↵</span>}
    </div>
  ));
}

export function PythonIdeView({
  externalPayload,
  appDarkMode = true,
}: {
  externalPayload?: IdeExternalPayload | null;
  appDarkMode?: boolean;
}) {
  const [files, setFiles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(IDE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>;
        if (parsed && Object.keys(parsed).length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_WORKSPACE_FILES };
  });

  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const keys = Object.keys(files);
    return keys.includes('main.py') ? ['main.py', ...keys.filter((k) => k !== 'main.py').slice(0, 2)] : keys.slice(0, 3);
  });
  const [activeFile, setActiveFile] = useState<string>(() =>
    files['main.py'] !== undefined ? 'main.py' : Object.keys(files)[0] ?? 'main.py'
  );

  // Workbench UI state
  const [sidebarMode, setSidebarMode] = useState<'explorer' | 'templates' | 'search' | 'settings' | null>(
    'explorer'
  );
  const [bottomTab, setBottomTab] = useState<'terminal' | 'stdin' | 'problems' | 'outputs'>('terminal');
  const [bottomHeight, setBottomHeight] = useState<number>(230);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Editor settings (syncs automatically with global Light/Dark toggle!)
  const [ideTheme, setIdeTheme] = useState<IdeThemeMode>(appDarkMode ? 'vscode-dark' : 'vscode-light');
  useEffect(() => {
    setIdeTheme((prev) => {
      if (!appDarkMode) return 'vscode-light';
      return prev === 'vscode-light' ? 'vscode-dark' : prev;
    });
  }, [appDarkMode]);
  const [fontSize, setFontSize] = useState<number>(14);
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [showWhitespace, setShowWhitespace] = useState<boolean>(false);

  // File creation / search / status
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<PythonRunResponse | null>(null);
  const [syntaxDiags, setSyntaxDiags] = useState<PythonDiagnostic[]>([]);
  const [cursor, setCursor] = useState({ line: 1, col: 1, selected: 0 });
  const [toast, setToast] = useState<string | null>(null);

  const editorRef = useRef<CodeMirrorEditorHandle>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const resizingRef = useRef(false);

  // Persist workspace to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(IDE_STORAGE_KEY, JSON.stringify(files));
    } catch {
      // ignore quota
    }
  }, [files]);

  // Receive code pushed from Tutorial / Knowledge / Coding Lab / Quick Drawer
  useEffect(() => {
    if (!externalPayload) return;
    const targetName = externalPayload.filename || 'scratch.py';
    setFiles((prev) => ({
      ...prev,
      ...(externalPayload.files ?? {}),
      [targetName]: externalPayload.code,
    }));
    setOpenTabs((prev) => (prev.includes(targetName) ? prev : [...prev, targetName]));
    setActiveFile(targetName);
    if (externalPayload.stdin !== undefined) {
      setStdin(externalPayload.stdin);
    }
    setToast(`已载入「${externalPayload.title || targetName}」到 IDE 工作区`);
    setTimeout(() => setToast(null), 2600);
  }, [externalPayload]);

  const activeContent = files[activeFile] ?? '';
  const isActivePy = activeFile.toLowerCase().endsWith('.py');

  // Debounced live AST syntax checking for active .py file
  useEffect(() => {
    if (!isActivePy) {
      setSyntaxDiags([]);
      return;
    }
    const timer = setTimeout(() => {
      checkPythonSyntax(activeContent, activeFile).then((diags) => {
        setSyntaxDiags(diags);
      });
    }, 480);
    return () => clearTimeout(timer);
  }, [activeContent, activeFile, isActivePy]);

  // Determine which .py file to execute (active file if .py, else main.py or first .py)
  const entryPyFile = useMemo(() => {
    if (activeFile.toLowerCase().endsWith('.py')) return activeFile;
    if (files['main.py'] !== undefined) return 'main.py';
    return Object.keys(files).find((f) => f.toLowerCase().endsWith('.py')) ?? 'main.py';
  }, [activeFile, files]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setBottomTab('terminal');
    soundEngine.click();
    const res = await runPythonCode({
      code: files[entryPyFile] ?? '',
      entryFile: entryPyFile,
      stdin,
      files,
    });
    setRunResult(res);
    setRunning(false);
    if (res.ok) {
      soundEngine.correct(1);
    } else {
      soundEngine.wrong();
    }
  }, [files, entryPyFile, stdin]);

  const handleSaveToast = useCallback(() => {
    setToast(`已自动保存 ${activeFile} 到本地工作区`);
    soundEngine.click();
    setTimeout(() => setToast(null), 1800);
  }, [activeFile]);

  function openFile(name: string) {
    setActiveFile(name);
    setOpenTabs((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }

  function closeTab(name: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = openTabs.filter((t) => t !== name);
    setOpenTabs(next);
    if (activeFile === name) {
      setActiveFile(next[next.length - 1] ?? Object.keys(files)[0] ?? '');
    }
  }

  function handleCreateFile(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = newFileName.trim().replace(/[<>:"/\\|?*]/g, '');
    if (!cleaned) return;
    const finalName = cleaned.includes('.') ? cleaned : `${cleaned}.py`;
    if (files[finalName] === undefined) {
      setFiles((prev) => ({
        ...prev,
        [finalName]: finalName.endsWith('.py') ? `# ${finalName}\n` : '',
      }));
    }
    openFile(finalName);
    setNewFileName('');
    setCreatingFile(false);
    soundEngine.click();
  }

  function handleDeleteFile(name: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (Object.keys(files).length <= 1) return;
    const nextFiles = { ...files };
    delete nextFiles[name];
    setFiles(nextFiles);
    const nextTabs = openTabs.filter((t) => t !== name);
    setOpenTabs(nextTabs);
    if (activeFile === name) {
      const fallback = nextTabs[0] ?? Object.keys(nextFiles)[0];
      setActiveFile(fallback);
      if (!nextTabs.includes(fallback)) setOpenTabs([fallback]);
    }
  }

  function handleDownloadFile() {
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleUploadLocalFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    Array.from(list).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        setFiles((prev) => ({ ...prev, [file.name]: text }));
        openFile(file.name);
      };
      reader.readAsText(file, 'utf-8');
    });
    e.target.value = '';
  }

  function handleLoadLab(labId: string) {
    const lab = CODING_LABS.find((l) => l.id === labId);
    if (!lab) return;
    const starter =
      lab.type === 'fill-blank' && lab.templateCode ? lab.templateCode : lab.starterCode || lab.referenceAnswer;
    const fname = `${lab.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.py`;
    setFiles((prev) => ({
      ...prev,
      ...(lab.virtualFiles ?? {}),
      [fname]: `# ${lab.title}\n# ${lab.source}\n\n${starter}`,
    }));
    openFile(fname);
    setStdin(lab.defaultStdin ?? '');
    setToast(`已载入实验「${lab.title}」及其测试文件`);
    soundEngine.click();
    setTimeout(() => setToast(null), 2500);
  }

  // Drag resize bottom terminal panel
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const next = window.innerHeight - e.clientY - 36;
      setBottomHeight(Math.max(120, Math.min(480, next)));
    }
    function onMouseUp() {
      resizingRef.current = false;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const tracebackEntries = useMemo(
    () => (runResult?.stderr ? parseTracebackErrors(runResult.stderr) : []),
    [runResult?.stderr]
  );

  const allProblems = useMemo(() => {
    const list: Array<{ file: string; line: number; col: number; message: string; source: string }> =
      syntaxDiags.map((d) => ({
        file: activeFile,
        line: d.line,
        col: d.col,
        message: d.message,
        source: 'AST 实时语法检查',
      }));
    for (const tb of tracebackEntries) {
      if (!list.some((p) => p.file === tb.file && p.line === tb.line)) {
        list.push({
          file: tb.file,
          line: tb.line,
          col: 1,
          message: tb.message,
          source: '运行时 Traceback',
        });
      }
    }
    return list;
  }, [syntaxDiags, activeFile, tracebackEntries]);

  const changedFileEntries = useMemo(
    () => Object.entries(runResult?.changedFiles ?? runResult?.createdFiles ?? {}),
    [runResult]
  );

  const searchMatches = useMemo(() => {
    const q = workspaceQuery.trim().toLowerCase();
    if (!q) return [];
    const hits: Array<{ file: string; line: number; preview: string }> = [];
    for (const [fname, content] of Object.entries(files)) {
      const lines = content.split('\n');
      lines.forEach((txt, idx) => {
        if (txt.toLowerCase().includes(q)) {
          hits.push({ file: fname, line: idx + 1, preview: txt.trim() });
        }
      });
    }
    return hits.slice(0, 50);
  }, [files, workspaceQuery]);

  function jumpToFileLine(file: string, line: number, col = 1) {
    if (files[file] !== undefined) {
      openFile(file);
      setTimeout(() => editorRef.current?.jumpToLine(line, col), 40);
    }
  }

  const isLightTheme = ideTheme === 'vscode-light';
  const shellBg = isLightTheme
    ? 'bg-[#f3f3f3] text-zinc-800 border-zinc-300'
    : ideTheme === 'aurora-dark'
      ? 'bg-[#111114] text-zinc-200 border-white/[0.09]'
      : 'bg-[#181818] text-zinc-200 border-[#2d2d2d]';
  const sideBg = isLightTheme
    ? 'bg-[#f8f8f8] border-zinc-200'
    : ideTheme === 'aurora-dark'
      ? 'bg-[#141418] border-white/[0.07]'
      : 'bg-[#252526] border-[#2d2d2d]';
  const activityBg = isLightTheme
    ? 'bg-[#e8e8e8] border-zinc-300'
    : ideTheme === 'aurora-dark'
      ? 'bg-[#0d0d10] border-white/[0.07]'
      : 'bg-[#333333] border-[#252526]';
  const tabBarBg = isLightTheme
    ? 'bg-[#ececec] border-zinc-200'
    : ideTheme === 'aurora-dark'
      ? 'bg-[#16161a] border-white/[0.07]'
      : 'bg-[#252526] border-[#2d2d2d]';

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none'
          : 'h-[calc(100vh-6.2rem)] min-h-[620px] rounded-2xl shadow-2xl mb-6'
      } flex flex-col overflow-hidden border select-none ${shellBg}`}
    >
      {/* Top IDE Mini Title/Command Strip */}
      <div
        className={`h-10 px-3 flex items-center justify-between border-b text-xs shrink-0 ${tabBarBg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="font-mono font-bold tracking-tight truncate">
            PyPulse Code Studio — {activeFile}
          </span>
          {toast && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" /> {toast}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRun}
            disabled={running}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg font-extrabold text-xs shadow-sm disabled:opacity-60 cursor-pointer transition-colors ${
              isLightTheme
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                : 'bg-zinc-100 hover:bg-white text-zinc-950'
            }`}
            title="运行 Python 代码 (Ctrl+Enter 或 F5)"
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-emerald-500 dark:text-emerald-600" />
            )}
            运行 {entryPyFile}
          </button>

          <button
            onClick={handleDownloadFile}
            className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-slate-100 cursor-pointer"
            title={`下载当前文件 ${activeFile}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-slate-100 cursor-pointer"
            title="导入本地 .py / .txt / .csv 文件"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={uploadRef}
            type="file"
            multiple
            accept=".py,.txt,.csv,.json,.md"
            onChange={handleUploadLocalFiles}
            className="hidden"
          />
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-slate-100 cursor-pointer"
            title={isFullscreen ? '退出全屏' : '全屏专注编码'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Middle Workbench Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Far-Left VS Code Activity Bar */}
        <div className={`w-11 shrink-0 border-r flex flex-col items-center py-2 gap-1 ${activityBg}`}>
          {(
            [
              { id: 'explorer' as const, icon: FolderOpen, label: '资源管理器（多文件）' },
              { id: 'search' as const, icon: Search, label: '跨文件搜索' },
              { id: 'templates' as const, icon: BookTemplate, label: '课程模板与代码片段' },
              { id: 'settings' as const, icon: Settings, label: '编辑器外观与设置' },
            ]
          ).map((item) => {
            const active = sidebarMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSidebarMode(active ? null : item.id)}
                title={item.label}
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  active
                    ? isLightTheme
                      ? 'text-zinc-900 bg-black/[0.06]'
                      : 'text-zinc-100 bg-white/[0.08]'
                    : isLightTheme
                      ? 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-amber-400" />
                )}
                <item.icon className="w-4.5 h-4.5" />
              </button>
            );
          })}
        </div>

        {/* Collapsible Side Panel */}
        {sidebarMode && (
          <div className={`w-60 shrink-0 border-r flex flex-col min-h-0 overflow-hidden ${sideBg}`}>
            {sidebarMode === 'explorer' && (
              <>
                <div className="px-3 py-2.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-500/15">
                  <span>资源管理器</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCreatingFile(true)}
                      className={`p-1 rounded hover:bg-slate-500/20 cursor-pointer ${
                        isLightTheme ? 'text-slate-600' : 'text-slate-300'
                      }`}
                      title="新建文件"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setFiles({ ...DEFAULT_WORKSPACE_FILES });
                        setOpenTabs(['main.py', 'utils.py', 'sdjw-in.csv']);
                        setActiveFile('main.py');
                        setToast('工作区已重置为默认示例项目');
                        setTimeout(() => setToast(null), 2000);
                      }}
                      className="p-1 rounded hover:bg-slate-500/20 text-slate-400 cursor-pointer"
                      title="恢复默认示例工作区"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5 text-xs">
                  <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>PYPULSE-WORKSPACE</span>
                  </div>

                  {creatingFile && (
                    <form onSubmit={handleCreateFile} className="px-2 py-1">
                      <input
                        autoFocus
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onBlur={() => setCreatingFile(false)}
                        placeholder="如 test.py 或 data.csv"
                        className="w-full px-2 py-1 rounded bg-[#111114] text-zinc-100 border border-amber-400/70 text-xs outline-none font-mono"
                      />
                    </form>
                  )}

                  {Object.keys(files)
                    .sort((a, b) => (a === 'main.py' ? -1 : b === 'main.py' ? 1 : a.localeCompare(b)))
                    .map((fname) => {
                      const isCur = fname === activeFile;
                      return (
                        <div
                          key={fname}
                          onClick={() => openFile(fname)}
                          className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isCur
                              ? isLightTheme
                                ? 'bg-amber-500/15 text-amber-800 font-semibold'
                                : 'bg-white/[0.09] text-amber-300 font-semibold'
                              : isLightTheme
                                ? 'hover:bg-zinc-500/10 text-zinc-700 hover:text-zinc-950'
                                : 'hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(fname)}
                            <span className="truncate font-mono text-xs">{fname}</span>
                          </div>
                          {Object.keys(files).length > 1 && (
                            <button
                              onClick={(e) => handleDeleteFile(fname, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/25 text-slate-400 hover:text-rose-400 cursor-pointer"
                              title="删除文件"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {sidebarMode === 'search' && (
              <div className="flex flex-col h-full">
                <div className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-500/15">
                  跨文件搜索
                </div>
                <div className="p-2.5">
                  <input
                    value={workspaceQuery}
                    onChange={(e) => setWorkspaceQuery(e.target.value)}
                    placeholder="搜索工作区所有代码/数据..."
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:border-amber-400/70 ${
                      isLightTheme
                        ? 'bg-white border-zinc-300 text-zinc-800'
                        : 'bg-[#111114] border-white/[0.1] text-zinc-100'
                    }`}
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1 text-xs">
                  {workspaceQuery.trim() && searchMatches.length === 0 && (
                    <div className="text-center text-slate-500 py-6">无匹配结果</div>
                  )}
                  {searchMatches.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => jumpToFileLine(m.file, m.line)}
                      className="w-full text-left p-2 rounded-lg hover:bg-emerald-500/15 space-y-0.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        <span>{m.file}</span>
                        <span>行 {m.line}</span>
                      </div>
                      <div className={`font-mono text-[11px] truncate ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>{m.preview}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sidebarMode === 'templates' && (
              <div className="flex flex-col h-full">
                <div className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-500/15">
                  代码片段 & 课程实验模板
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400 px-1">
                      点击在光标处插入考纲片段
                    </div>
                    {QUICK_SNIPPETS.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => {
                          editorRef.current?.insertSnippet(s.code);
                          soundEngine.click();
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-500/10 hover:bg-emerald-500/18 transition-colors cursor-pointer ${
                          isLightTheme ? 'text-slate-700 hover:text-emerald-700' : 'text-slate-300 hover:text-emerald-300'
                        }`}
                      >
                        + {s.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 px-1">
                      一键载入 22 道课程实验调试
                    </div>
                    {CODING_LABS.map((lab) => (
                      <button
                        key={lab.id}
                        onClick={() => handleLoadLab(lab.id)}
                        className="w-full text-left p-2 rounded-lg bg-slate-500/10 hover:bg-cyan-500/15 transition-colors cursor-pointer"
                      >
                        <div className={`font-semibold text-[11px] truncate ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>
                          {lab.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{lab.source}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sidebarMode === 'settings' && (
              <div className="p-3.5 space-y-4 text-xs overflow-y-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  编辑器设置
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">配色主题</label>
                  <div className="space-y-1">
                    {(
                      [
                        ['vscode-dark', 'VS Code Dark+ (经典)'],
                        ['aurora-dark', 'Graphite Studio (炭黑)'],
                        ['vscode-light', 'VS Code Light+ (浅色)'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setIdeTheme(id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          ideTheme === id
                            ? isLightTheme
                              ? 'bg-amber-500/12 border-amber-500/40 text-amber-800 font-bold'
                              : 'bg-white/[0.08] border-amber-400/50 text-amber-300 font-bold'
                            : 'border-zinc-500/20 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">字体大小</span>
                    <span className="font-mono text-emerald-400">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={18}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-slate-400">自动换行 (Word Wrap)</span>
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                    className="accent-emerald-400"
                  />
                </label>

                <div className="rounded-xl bg-slate-500/10 p-3 space-y-1 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-300 mb-1">内置 VS Code 快捷键</div>
                  <div>• <code className="text-cyan-400">Ctrl+Enter / F5</code> 运行代码</div>
                  <div>• <code className="text-cyan-400">Ctrl+F / Ctrl+H</code> 查找替换</div>
                  <div>• <code className="text-cyan-400">Ctrl+/</code> 切换注释</div>
                  <div>• <code className="text-cyan-400">Ctrl+Space</code> 触发智能补全</div>
                  <div>• <code className="text-cyan-400">Alt+↑/↓</code> 上下移动当前行</div>
                  <div>• <code className="text-cyan-400">Ctrl+D</code> 多光标选中同词</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Main Editor + Resizable Bottom Terminal Panel */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Multi-Tab Bar */}
          <div className={`h-9 flex items-center overflow-x-auto border-b shrink-0 ${tabBarBg}`}>
            {openTabs.map((tabName) => {
              const active = tabName === activeFile;
              return (
                <div
                  key={tabName}
                  onClick={() => setActiveFile(tabName)}
                  className={`group relative h-full px-3 flex items-center gap-2 text-xs font-mono border-r border-zinc-500/15 cursor-pointer shrink-0 transition-colors ${
                    active
                      ? isLightTheme
                        ? 'bg-white text-zinc-900 font-bold'
                        : ideTheme === 'aurora-dark'
                          ? 'bg-[#111114] text-zinc-100 font-bold'
                          : 'bg-[#1e1e1e] text-white font-bold'
                      : 'text-zinc-400 hover:bg-zinc-500/10'
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400" />
                  )}
                  {getFileIcon(tabName)}
                  <span>{tabName}</span>
                  <button
                    onClick={(e) => closeTab(tabName, e)}
                    className="p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-zinc-500/25 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Breadcrumb Bar */}
          <div
            className={`h-7 px-3 flex items-center justify-between text-[11px] border-b shrink-0 ${
              isLightTheme
                ? 'bg-white border-zinc-200 text-zinc-500'
                : ideTheme === 'aurora-dark'
                  ? 'bg-[#111114] border-white/[0.07] text-zinc-400'
                  : 'bg-[#1e1e1e] border-[#2d2d2d] text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-1 font-mono">
              <span>pypulse-workspace</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-amber-600 dark:text-amber-300 font-semibold">{activeFile}</span>
            </div>
            <div className="flex items-center gap-3">
              {isActivePy && (
                <span
                  className={`inline-flex items-center gap-1 ${
                    syntaxDiags.length === 0 ? 'text-emerald-400' : 'text-rose-400 font-semibold'
                  }`}
                >
                  {syntaxDiags.length === 0 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> AST 语法无误
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" /> {syntaxDiags.length} 处语法错误
                    </>
                  )}
                </span>
              )}
              <span className="hidden sm:inline text-slate-500">
                输入 withopen / csvsort / prime / dictcount 体验代码片段
              </span>
            </div>
          </div>

          {/* CodeMirror 6 Editor Surface */}
          <div className="flex-1 min-h-0 overflow-hidden select-text">
            <CodeMirrorPythonEditor
              ref={editorRef}
              value={activeContent}
              filename={activeFile}
              themeMode={ideTheme}
              fontSize={fontSize}
              wordWrap={wordWrap}
              diagnostics={syntaxDiags}
              onChange={(next) => setFiles((prev) => ({ ...prev, [activeFile]: next }))}
              onRunShortcut={handleRun}
              onSaveShortcut={handleSaveToast}
              onCursorChange={setCursor}
            />
          </div>

          {/* Drag Handle for Resizing Bottom Terminal Panel */}
          <div
            onMouseDown={() => {
              resizingRef.current = true;
            }}
            className="h-1.5 cursor-row-resize bg-zinc-500/15 hover:bg-amber-400/60 transition-colors shrink-0"
            title="上下拖拽调整终端面板高度"
          />

          {/* Integrated VS Code Bottom Panel */}
          <div
            style={{ height: bottomHeight }}
            className={`shrink-0 flex flex-col border-t ${
              isLightTheme
                ? 'bg-[#fafafa] border-zinc-300'
                : ideTheme === 'aurora-dark'
                  ? 'bg-[#0d0d10] border-white/[0.08]'
                  : 'bg-[#181818] border-[#2d2d2d]'
            }`}
          >
            {/* Panel Tabs */}
            <div className="h-9 px-3 flex items-center justify-between border-b border-zinc-500/15 shrink-0 text-xs">
              <div className="flex items-center gap-4">
                {(
                  [
                    { id: 'terminal' as const, label: '终端 OUTPUT' },
                    { id: 'stdin' as const, label: `标准输入 STDIN${stdin.trim() ? ' ●' : ''}` },
                    {
                      id: 'problems' as const,
                      label: `问题 PROBLEMS (${allProblems.length})`,
                    },
                    {
                      id: 'outputs' as const,
                      label: `生成文件 (${changedFileEntries.length})`,
                    },
                  ]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setBottomTab(t.id)}
                    className={`h-9 relative font-semibold text-[11px] tracking-wide cursor-pointer transition-colors ${
                      bottomTab === t.id
                        ? isLightTheme
                          ? 'text-zinc-900'
                          : 'text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t.label}
                    {bottomTab === t.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {bottomTab === 'terminal' && (
                  <>
                    <button
                      onClick={() => setShowWhitespace((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                        showWhitespace
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                          : 'bg-slate-500/15 text-slate-400 hover:text-slate-200'
                      }`}
                      title="显示隐藏空格(·)与换行(↵)，上机抠格式神器！"
                    >
                      <Eye className="w-3 h-3" /> repr() 空格透视
                    </button>
                    {runResult && (
                      <button
                        onClick={() => setRunResult(null)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        清空
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-auto p-3 font-mono text-xs select-text">
              {bottomTab === 'terminal' && (
                <div className="space-y-2">
                  {!runResult ? (
                    <div className="text-slate-500 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <span>
                        按 <kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300">Ctrl+Enter</kbd> 或点击右上角「运行 {entryPyFile}」在真实 Python 3 环境中执行...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pb-1.5 border-b border-slate-500/15">
                        <span className="text-cyan-400">$ python -X utf8 {entryPyFile}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            runResult.ok
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {runResult.ok ? 'EXIT 0' : `EXIT ${runResult.exitCode}`}
                        </span>
                        <span>{runResult.durationMs}ms</span>
                        <span className="text-slate-500">
                          [{runResult.runtime === 'pyodide' ? 'Pyodide 浏览器引擎' : '本机 Python 3'}]
                        </span>
                      </div>

                      {runResult.stdout && (
                        <div className={`${isLightTheme ? 'text-emerald-800' : 'text-emerald-300'} whitespace-pre-wrap leading-6`}>
                          {showWhitespace ? visualizeWhitespace(runResult.stdout) : runResult.stdout}
                        </div>
                      )}

                      {runResult.stderr && (
                        <div className="space-y-1.5 pt-1">
                          <pre
                            className={`whitespace-pre-wrap leading-5 p-2.5 rounded-xl border ${
                              isLightTheme
                                ? 'text-rose-800 bg-rose-50 border-rose-200'
                                : 'text-rose-400 bg-rose-950/30 border-rose-500/25'
                            }`}
                          >
                            {runResult.stderr}
                          </pre>
                          {tracebackEntries.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">快速跳转报错行：</span>
                              {tracebackEntries.map((tb, i) => (
                                <button
                                  key={i}
                                  onClick={() => jumpToFileLine(tb.file, tb.line)}
                                  className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 text-[11px] underline cursor-pointer"
                                >
                                  {tb.file}:{tb.line}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!runResult.stdout && !runResult.stderr && (
                        <div className="text-slate-500">(程序正常结束，无控制台输出)</div>
                      )}
                    </>
                  )}
                </div>
              )}

              {bottomTab === 'stdin' && (
                <div className="h-full flex flex-col gap-2">
                  <div className="text-[11px] text-slate-400">
                    如果代码含 <code className="text-cyan-400">input()</code> 或{' '}
                    <code className="text-cyan-400">sys.stdin.read()</code>，请在此预先填入多行测试输入：
                  </div>
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="例如：\n3,4,5\n或\n10,20,20200101111\nblue\n1"
                    className={`flex-1 w-full rounded-xl border p-3 font-mono text-xs outline-none focus:border-amber-400/70 resize-none ${
                      isLightTheme
                        ? 'bg-white text-zinc-800 border-zinc-300'
                        : 'bg-[#141418] text-zinc-100 border-white/[0.09]'
                    }`}
                  />
                </div>
              )}

              {bottomTab === 'problems' && (
                <div className="space-y-1.5">
                  {allProblems.length === 0 ? (
                    <div className="text-emerald-400 flex items-center gap-2 py-4">
                      <CheckCircle2 className="w-4 h-4" /> 当前未检测到任何语法或运行时错误！
                    </div>
                  ) : (
                    allProblems.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => jumpToFileLine(p.file, p.line, p.col)}
                        className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300 truncate">{p.message}</span>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {p.file} [{p.line}, {p.col}] · {p.source}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {bottomTab === 'outputs' && (
                <div className="space-y-3">
                  {changedFileEntries.length === 0 ? (
                    <div className="text-slate-500 py-4">
                      运行写文件的 Python 代码（如生成 sdjw-out.csv / rank.txt）后，产物会自动出现在这里。
                    </div>
                  ) : (
                    changedFileEntries.map(([fname, content]) => (
                      <div
                        key={fname}
                        className={`rounded-xl border border-emerald-500/25 p-3 space-y-2 ${
                          isLightTheme ? 'bg-white' : 'bg-[#141418]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold flex items-center gap-1.5 ${isLightTheme ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            {getFileIcon(fname)} {fname}
                          </span>
                          <button
                            onClick={() => {
                              setFiles((prev) => ({ ...prev, [fname]: content }));
                              openFile(fname);
                              setToast(`已将 ${fname} 同步到左侧工作区并打开`);
                              setTimeout(() => setToast(null), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold cursor-pointer"
                          >
                            同步到左侧文件树打开
                          </button>
                        </div>
                        <pre
                          className={`whitespace-pre-wrap max-h-36 overflow-auto p-2.5 rounded-lg ${
                            isLightTheme ? 'bg-slate-50 text-zinc-800 border border-zinc-200' : 'bg-[#0d0d10] text-zinc-200'
                          }`}
                        >
                          {content}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Studio Bottom Status Bar */}
      <div
        className={`h-6 px-3 text-[11px] flex items-center justify-between shrink-0 font-mono border-t ${
          isLightTheme
            ? 'bg-zinc-900 text-zinc-200 border-zinc-800'
            : 'bg-[#1a1a1f] text-zinc-300 border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            {typeof window !== 'undefined' && window.location.protocol === 'file:'
              ? 'Pyodide 浏览器 Python'
              : 'Python 3 本地引擎'}
          </span>
          <button
            onClick={() => setBottomTab('problems')}
            className="hover:underline cursor-pointer"
          >
            ⊗ {allProblems.length} 问题
          </button>
          <span className="hidden md:inline opacity-85">入口: {entryPyFile}</span>
        </div>

        <div className="flex items-center gap-3.5">
          <span>
            行 {cursor.line}, 列 {cursor.col}
            {cursor.selected > 0 ? ` (已选 ${cursor.selected})` : ''}
          </span>
          <span className="hidden sm:inline">Spaces: 4</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="font-bold">{isActivePy ? 'Python' : activeFile.split('.').pop()?.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
