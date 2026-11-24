import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  GraduationCap,
  Headphones,
  HelpCircle,
  Home,
  Languages,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sun,
  Terminal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CodingLabView } from './components/CodingLabView';
import { DashboardView } from './components/DashboardView';
import { FlashcardsView } from './components/FlashcardsView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { KnowledgeHubView, type KnowledgeSubTab } from './components/KnowledgeHubView';
import { MistakeBookView } from './components/MistakeBookView';
import { MockExamView } from './components/MockExamView';
import { AmbientBackground } from './components/MotionPrimitives';
import { PersonalHubView } from './components/PersonalHubView';
import { type IdeExternalPayload, PythonIdeView } from './components/PythonIdeView';
import { QuickPythonDrawer } from './components/QuickPythonDrawer';
import { type QuizFilterPreset, QuizView } from './components/QuizView';
import { TutorialReaderView } from './components/TutorialReaderView';
import { Cet6DashboardView } from './components/cet6/Cet6DashboardView';
import { Cet6HistoryView } from './components/cet6/Cet6HistoryView';
import { Cet6PaperLibraryView } from './components/cet6/Cet6PaperLibraryView';
import { Cet6PaperRunnerView } from './components/cet6/Cet6PaperRunnerView';
import { CHAPTER_TUTORIALS } from './data/tutorials';
import type { AppTab, ExamHistoryItem, OptionKey, SubjectId, UserProgress } from './types';
import type {
  Cet6ExamRecord,
  Cet6PaperAttemptState,
  Cet6PaperSummary,
  Cet6Progress,
  Cet6Tab,
  CetLevel,
} from './types/cet6';
import { fetchCetCatalog } from './utils/cet6Api';
import {
  appendCet6ExamRecord,
  createInitialCet6Progress,
  loadCetProgress,
  recordCet6Activity,
  saveCetProgress,
} from './utils/cet6Storage';
import { soundEngine } from './utils/sound';
import {
  createInitialProgress,
  loadProgress,
  recordMcqAnswer,
  saveProgress,
} from './utils/storage';

const DEFAULT_SANDBOX_CODE = `# 欢迎使用 StudyPulse 本地 Python 3 沙盒！
# 随时验证易错表达式或考前小代码：

print("4 / 2 =", 4 / 2, "| 7 // 2 =", 7 // 2, "| -7 // 2 =", -7 // 2)
print("2 ** 3 =", 2 ** 3, "| 2 ^ 3 =", 2 ^ 3)
print("反转字符串:", "Python"[::-1])
`;

const PYTHON_NAV_ITEMS: Array<{ id: AppTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Python 总览', icon: LayoutDashboard },
  { id: 'tutorials', label: '详细教案', icon: GraduationCap },
  { id: 'quiz', label: '智能刷题', icon: HelpCircle },
  { id: 'exam', label: '模拟考场', icon: Award },
  { id: 'labs', label: '编程实验', icon: Code2 },
  { id: 'knowledge', label: '考点速查', icon: BookOpen },
  { id: 'flashcards', label: '3D 闪卡', icon: Layers },
  { id: 'mistakes', label: '错题收藏', icon: AlertTriangle },
  { id: 'ide', label: 'Python IDE', icon: Terminal },
];

export default function App() {
  // Multi-subject navigation state
  const [subject, setSubject] = useState<SubjectId>('hub');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [cetTabs, setCetTabs] = useState<Record<CetLevel, Cet6Tab>>({
    cet4: 'overview',
    cet6: 'overview',
  });
  const [activeCetPapers, setActiveCetPapers] = useState<
    Record<CetLevel, { id: string; mode: 'practice' | 'mock' } | null>
  >({
    cet4: null,
    cet6: null,
  });

  // Sidebar layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('studypulse_sidebar_collapsed') === '1';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cet4GroupOpen, setCet4GroupOpen] = useState(true);
  const [cet6GroupOpen, setCet6GroupOpen] = useState(true);
  const [pythonGroupOpen, setPythonGroupOpen] = useState(true);

  // Theme & audio
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pypulse_theme');
    return saved ? saved === 'dark' : true;
  });
  const [soundOn, setSoundOn] = useState(true);

  // Subject progress stores
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [cet4Progress, setCet4Progress] = useState<Cet6Progress>(() => loadCetProgress('cet4'));
  const [cet6Progress, setCet6Progress] = useState<Cet6Progress>(() => loadCetProgress('cet6'));

  // CET-4 & CET-6 catalogs loaded from server
  const [cet4Papers, setCet4Papers] = useState<Cet6PaperSummary[]>([]);
  const [cet4Loading, setCet4Loading] = useState(true);
  const [cet4Error, setCet4Error] = useState<string | null>(null);
  const [cet4RawHtmlAvailable, setCet4RawHtmlAvailable] = useState(false);

  const [cet6Papers, setCet6Papers] = useState<Cet6PaperSummary[]>([]);
  const [cet6Loading, setCet6Loading] = useState(true);
  const [cet6Error, setCet6Error] = useState<string | null>(null);
  const [cet6RawHtmlAvailable, setCet6RawHtmlAvailable] = useState(false);

  // Python cross-tab jump states
  const [quizPreset, setQuizPreset] = useState<QuizFilterPreset>({
    chapter: 'all',
    status: 'all',
  });
  const [labJumpId, setLabJumpId] = useState<string | null>(null);
  const [tutorialChapter, setTutorialChapter] = useState<number>(4);
  const [idePayload, setIdePayload] = useState<IdeExternalPayload | null>(null);
  const [knowledgeJump, setKnowledgeJump] = useState<{
    chapter?: number | 'all' | 'exam';
    subTab?: KnowledgeSubTab;
  }>({});

  // Global modals / drawers
  const [searchOpen, setSearchOpen] = useState(false);
  const [sandboxState, setSandboxState] = useState<{
    open: boolean;
    title: string;
    code: string;
    stdin?: string;
  }>({
    open: false,
    title: 'Python 3 实时演练沙盒',
    code: DEFAULT_SANDBOX_CODE,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('pypulse_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('studypulse_sidebar_collapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    soundEngine.enabled = soundOn;
  }, [soundOn]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveCetProgress('cet4', cet4Progress);
  }, [cet4Progress]);

  useEffect(() => {
    saveCetProgress('cet6', cet6Progress);
  }, [cet6Progress]);

  // Fetch CET-4 & CET-6 catalogs in parallel on boot
  useEffect(() => {
    fetchCetCatalog('cet4').then((res) => {
      if (res.ok) {
        setCet4Papers(res.papers);
        setCet4RawHtmlAvailable(Boolean(res.rawHtmlAvailable));
        setCet4Error(null);
      } else {
        setCet4Error(res.error || '加载失败');
      }
      setCet4Loading(false);
    });

    fetchCetCatalog('cet6').then((res) => {
      if (res.ok) {
        setCet6Papers(res.papers);
        setCet6RawHtmlAvailable(Boolean(res.rawHtmlAvailable));
        setCet6Error(null);
      } else {
        setCet6Error(res.error || '加载失败');
      }
      setCet6Loading(false);
    });
  }, []);

  // Global Ctrl+K / Escape handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setSandboxState((s) => ({ ...s, open: false }));
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const mistakeCount = useMemo(
    () => Object.values(progress.records).filter((r) => r.inMistakeBook).length,
    [progress.records]
  );

  // Navigation helpers
  function navigatePython(tab: AppTab = 'dashboard') {
    setSubject('python');
    setActiveTab(tab);
    setPythonGroupOpen(true);
    setMobileMenuOpen(false);
    soundEngine.click();
  }

  function navigateCet(level: CetLevel, tab: Cet6Tab = 'overview') {
    setSubject(level);
    setCetTabs((prev) => ({ ...prev, [level]: tab }));
    if (level === 'cet4') setCet4GroupOpen(true);
    else setCet6GroupOpen(true);
    setMobileMenuOpen(false);
    soundEngine.click();
  }

  function openCetPaper(level: CetLevel, paperId: string, mode: 'practice' | 'mock') {
    setSubject(level);
    setActiveCetPapers((prev) => ({ ...prev, [level]: { id: paperId, mode } }));
    setCetTabs((prev) => ({ ...prev, [level]: 'runner' }));
    if (level === 'cet4') {
      setCet4GroupOpen(true);
      setCet4Progress((prev) => ({ ...prev, lastOpenedPaperId: paperId }));
    } else {
      setCet6GroupOpen(true);
      setCet6Progress((prev) => ({ ...prev, lastOpenedPaperId: paperId }));
    }
    setMobileMenuOpen(false);
    soundEngine.click();
  }

  // Python Handlers
  function handleAnswer(questionId: number, selected: OptionKey, isCorrect: boolean) {
    setProgress((prev) => recordMcqAnswer(prev, questionId, selected, isCorrect));
  }

  function handleToggleBookmark(questionId: number) {
    setProgress((prev) => {
      const exists = prev.bookmarks.includes(questionId);
      return {
        ...prev,
        bookmarks: exists
          ? prev.bookmarks.filter((id) => id !== questionId)
          : [...prev.bookmarks, questionId],
      };
    });
  }

  function handleSaveNote(questionId: number, note: string) {
    setProgress((prev) => {
      const next = { ...prev.notes };
      if (!note) delete next[questionId];
      else next[questionId] = note;
      return { ...prev, notes: next };
    });
  }

  function handleRemoveMistake(questionId: number) {
    setProgress((prev) => {
      const rec = prev.records[questionId];
      if (!rec) return prev;
      return {
        ...prev,
        records: {
          ...prev.records,
          [questionId]: { ...rec, inMistakeBook: false },
        },
      };
    });
  }

  function handleCompleteExam(
    item: ExamHistoryItem,
    answers: Array<{ questionId: number; selected: OptionKey; isCorrect: boolean }>
  ) {
    setProgress((prev) => {
      let next = prev;
      for (const a of answers) {
        next = recordMcqAnswer(next, a.questionId, a.selected, a.isCorrect);
      }
      return {
        ...next,
        examHistory: [item, ...next.examHistory].slice(0, 20),
      };
    });
  }

  function handleMarkLabSolved(labId: string) {
    setProgress((prev) =>
      prev.solvedLabs.includes(labId) ? prev : { ...prev, solvedLabs: [...prev.solvedLabs, labId] }
    );
  }

  function handleToggleKnowledgeMastered(kpId: string) {
    setProgress((prev) => {
      const exists = prev.masteredKnowledge.includes(kpId);
      return {
        ...prev,
        masteredKnowledge: exists
          ? prev.masteredKnowledge.filter((id) => id !== kpId)
          : [...prev.masteredKnowledge, kpId],
      };
    });
  }

  function handleToggleReadTutorialSection(secId: string) {
    setProgress((prev) => {
      const list = prev.readTutorialSections ?? [];
      const exists = list.includes(secId);
      return {
        ...prev,
        readTutorialSections: exists ? list.filter((id) => id !== secId) : [...list, secId],
      };
    });
  }

  function handleRateFlashcard(cardId: string, level: 0 | 1 | 2 | 3) {
    setProgress((prev) => {
      const cur = prev.flashcards[cardId];
      return {
        ...prev,
        flashcards: {
          ...prev.flashcards,
          [cardId]: {
            level,
            reviews: (cur?.reviews ?? 0) + 1,
            lastReviewed: Date.now(),
          },
        },
      };
    });
  }

  // Unified CET-4 / CET-6 Attempt & Exam Handlers
  function handleSaveCetAttempt(level: CetLevel, nextAttempt: Cet6PaperAttemptState) {
    const setter = level === 'cet4' ? setCet4Progress : setCet6Progress;
    setter((prev) => {
      const oldCount = Object.keys(prev.attempts[nextAttempt.paperId]?.answers ?? {}).length;
      const newCount = Object.keys(nextAttempt.answers).length;
      const base = newCount > oldCount ? recordCet6Activity(prev, newCount - oldCount) : prev;
      return {
        ...base,
        attempts: {
          ...base.attempts,
          [nextAttempt.paperId]: nextAttempt,
        },
      };
    });
  }

  function handleSubmitCetExam(
    level: CetLevel,
    record: Cet6ExamRecord,
    finalAttempt: Cet6PaperAttemptState
  ) {
    const setter = level === 'cet4' ? setCet4Progress : setCet6Progress;
    setter((prev) => {
      const withRecord = appendCet6ExamRecord(prev, record);
      return {
        ...withRecord,
        attempts: {
          ...withRecord.attempts,
          [finalAttempt.paperId]: finalAttempt,
        },
      };
    });
  }

  // Breadcrumb label for compact top header
  const breadcrumb = useMemo(() => {
    if (subject === 'hub') return { group: '个人工作台', page: '全科总览' };
    if (subject === 'python') {
      const item = PYTHON_NAV_ITEMS.find((i) => i.id === activeTab);
      return { group: 'Python 课程', page: item?.label ?? '总览' };
    }
    const lv = subject;
    const grp = lv === 'cet4' ? 'CET-4 四级' : 'CET-6 六级';
    const cn = lv === 'cet4' ? '四级' : '六级';
    const papers = lv === 'cet4' ? cet4Papers : cet6Papers;
    const curTab = cetTabs[lv];
    const activeP = activeCetPapers[lv];
    if (curTab === 'runner' && activeP) {
      const p = papers.find((x) => x.id === activeP.id);
      return { group: grp, page: p?.folder ?? '真题作答' };
    }
    if (curTab === 'papers') return { group: grp, page: `${papers.length} 份真题库` };
    if (curTab === 'history') return { group: grp, page: '710分成绩单' };
    return { group: grp, page: `${cn}总览` };
  }, [subject, activeTab, cetTabs, activeCetPapers, cet4Papers, cet6Papers]);

  const activeViewKey =
    subject === 'hub'
      ? 'hub'
      : subject === 'python'
        ? `py-${activeTab}`
        : `${subject}-${cetTabs[subject]}-${activeCetPapers[subject]?.id ?? ''}`;

  const renderCetSidebarGroup = (level: CetLevel, compact: boolean) => {
    const isCet4 = level === 'cet4';
    const groupOpen = isCet4 ? cet4GroupOpen : cet6GroupOpen;
    const setGroupOpen = isCet4 ? setCet4GroupOpen : setCet6GroupOpen;
    const papers = isCet4 ? cet4Papers : cet6Papers;
    const activePaper = activeCetPapers[level];
    const curTab = cetTabs[level];
    const count = papers.length || (isCet4 ? 79 : 75);
    const cn = isCet4 ? '四级' : '六级';
    const code = isCet4 ? 'CET-4' : 'CET-6';

    const items: Array<{ id: Cet6Tab; label: string; icon: typeof LayoutDashboard }> = [
      { id: 'overview', label: `${cn}总览`, icon: LayoutDashboard },
      { id: 'papers', label: `${count} 份真题库`, icon: Headphones },
      { id: 'history', label: '710分成绩单', icon: Award },
    ];

    return (
      <div className="space-y-1">
        {!compact ? (
          <button
            onClick={() => setGroupOpen((v) => !v)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Languages className={`w-3.5 h-3.5 ${isCet4 ? 'text-sky-500' : 'text-amber-500'}`} />
              {code} {cn}真题
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                  isCet4
                    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                }`}
              >
                {count}
              </span>
              {groupOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          </button>
        ) : (
          <div className="h-px bg-zinc-500/15 my-2 mx-2" />
        )}

        {(groupOpen || compact) && (
          <div className="space-y-0.5">
            {items.map((item) => {
              const active = subject === level && curTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateCet(level, item.id)}
                  title={`${code} · ${item.label}`}
                  className={`w-full flex items-center ${
                    compact ? 'justify-center px-0' : 'gap-2.5 px-3'
                  } py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-500/10'
                  }`}
                >
                  <item.icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      active
                        ? ''
                        : isCet4
                          ? 'text-sky-600/80 dark:text-sky-400/80'
                          : 'text-amber-600/80 dark:text-amber-400/80'
                    }`}
                  />
                  {!compact && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}

            {activePaper && (
              <button
                onClick={() => navigateCet(level, 'runner')}
                title={`返回正在作答的${cn}试卷`}
                className={`w-full flex items-center ${
                  compact ? 'justify-center px-0' : 'gap-2.5 px-3'
                } py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subject === level && curTab === 'runner'
                    ? isCet4
                      ? 'bg-sky-500 text-zinc-950 shadow-sm'
                      : 'bg-amber-500 text-zinc-950 shadow-sm'
                    : isCet4
                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/18'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/18'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                {!compact && (
                  <span className="truncate">正在作答：{activePaper.id.split('/')[1]}</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSidebarContent = (isMobile = false) => {
    const compact = !isMobile && sidebarCollapsed;
    return (
      <div className="flex flex-col h-full">
        {/* Sidebar Brand */}
        <div
          className={`h-14 flex items-center border-b border-zinc-200/80 dark:border-white/[0.07] shrink-0 ${
            compact ? 'justify-center px-2' : 'justify-between px-3.5'
          }`}
        >
          {compact ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-9 h-9 rounded-xl hover:bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
              title="展开学科侧边栏"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setSubject('hub');
                  setMobileMenuOpen(false);
                  soundEngine.click();
                }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
              >
                <div className="relative w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-mono font-black text-xs shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                  SP
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#121216]" />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-extrabold text-sm tracking-tight leading-none truncate">
                    StudyPulse
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 truncate">个人全科复习平台</div>
                </div>
              </button>

              {isMobile ? (
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-500/15 text-zinc-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 cursor-pointer"
                  title="折叠学科侧边栏"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Scrollable Subject Tree */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5">
          {/* Home Hub Entry */}
          <div>
            <button
              onClick={() => {
                setSubject('hub');
                setMobileMenuOpen(false);
                soundEngine.click();
              }}
              title="个人工作台总览"
              className={`w-full flex items-center ${
                compact ? 'justify-center px-0' : 'gap-2.5 px-3'
              } py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subject === 'hub'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/10'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              {!compact && <span className="truncate">个人工作台总览</span>}
            </button>
          </div>

          {/* Subject Group 1: CET-4 */}
          {renderCetSidebarGroup('cet4', compact)}

          {/* Subject Group 2: CET-6 */}
          {renderCetSidebarGroup('cet6', compact)}

          {/* Subject Group 3: Python */}
          <div className="space-y-1">
            {!compact ? (
              <button
                onClick={() => setPythonGroupOpen((v) => !v)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                  Python 课程
                </span>
                {pythonGroupOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="h-px bg-zinc-500/15 my-2 mx-2" />
            )}

            {(pythonGroupOpen || compact) && (
              <div className="space-y-0.5">
                {PYTHON_NAV_ITEMS.map((item) => {
                  const active = subject === 'python' && activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigatePython(item.id)}
                      title={`Python · ${item.label}`}
                      className={`w-full flex items-center ${
                        compact ? 'justify-center px-0' : 'justify-between px-3'
                      } py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {!compact && <span className="truncate">{item.label}</span>}
                      </span>
                      {!compact && item.id === 'mistakes' && mistakeCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                          {mistakeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!compact && (
            <div className="pt-1 px-2">
              <div className="rounded-xl border border-dashed border-zinc-300 dark:border-white/[0.1] p-2.5 text-[11px] text-zinc-500 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>支持持续扩展更多复习学科</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer Controls */}
        <div
          className={`p-2.5 border-t border-zinc-200/80 dark:border-white/[0.07] flex ${
            compact ? 'flex-col gap-1.5 items-center' : 'items-center justify-between'
          } shrink-0`}
        >
          {!compact && (
            <span className="text-[11px] font-mono text-zinc-500 px-1.5">
              {darkMode ? '炭黑主题' : '陶瓷浅色'}
            </span>
          )}
          <div className={`flex ${compact ? 'flex-col' : 'flex-row'} items-center gap-1`}>
            <button
              onClick={() => setSoundOn((v) => !v)}
              className="p-2 rounded-lg hover:bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 cursor-pointer"
              title={soundOn ? '关闭交互音效' : '开启交互音效'}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className="p-2 rounded-lg hover:bg-zinc-500/15 text-amber-600 dark:text-amber-300 cursor-pointer"
              title={darkMode ? '切换浅色陶瓷主题' : '切换炭黑石墨主题'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCetWorkspace = (level: CetLevel) => {
    const curTab = cetTabs[level];
    const papers = level === 'cet4' ? cet4Papers : cet6Papers;
    const prog = level === 'cet4' ? cet4Progress : cet6Progress;
    const setProg = level === 'cet4' ? setCet4Progress : setCet6Progress;
    const loading = level === 'cet4' ? cet4Loading : cet6Loading;
    const error = level === 'cet4' ? cet4Error : cet6Error;
    const rawOk = level === 'cet4' ? cet4RawHtmlAvailable : cet6RawHtmlAvailable;
    const activePaper = activeCetPapers[level];

    if (curTab === 'overview') {
      return (
        <Cet6DashboardView
          level={level}
          papers={papers}
          progress={prog}
          loading={loading}
          error={error}
          rawHtmlAvailable={rawOk}
          onOpenPaper={(pid, mode) => openCetPaper(level, pid, mode)}
          onNavigateTab={(t) => navigateCet(level, t)}
        />
      );
    }
    if (curTab === 'papers') {
      return (
        <Cet6PaperLibraryView
          level={level}
          papers={papers}
          progress={prog}
          onOpenPaper={(pid, mode) => openCetPaper(level, pid, mode)}
        />
      );
    }
    if (curTab === 'runner' && activePaper) {
      return (
        <Cet6PaperRunnerView
          level={level}
          paperId={activePaper.id}
          initialMode={activePaper.mode}
          savedAttempt={prog.attempts[activePaper.id]}
          onSaveAttempt={(att) => handleSaveCetAttempt(level, att)}
          onSubmitExam={(rec, att) => handleSubmitCetExam(level, rec, att)}
          onBackToLibrary={() => navigateCet(level, 'papers')}
        />
      );
    }
    return (
      <Cet6HistoryView
        level={level}
        progress={prog}
        onOpenPaper={(pid, mode) => openCetPaper(level, pid, mode)}
        onImportProgress={(data) => setProg(data)}
        onResetProgress={() => setProg(createInitialCet6Progress())}
      />
    );
  };

  return (
    <div className="min-h-screen relative">
      <AmbientBackground />

      {/* Desktop Viewport-Fixed Left Global Subject Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-zinc-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#111114]/94 backdrop-blur-xl transition-all duration-200 ${
          sidebarCollapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Subject Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex"
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="w-64 h-full bg-white dark:bg-[#111114] border-r border-zinc-200 dark:border-white/[0.08] shadow-2xl"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Main Workspace Column */}
      <div
        className={`min-w-0 flex flex-col min-h-screen transition-[padding] duration-200 ${
          sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
        }`}
      >
        {/* Compact Top Workspace Header */}
        <header className="sticky top-0 z-20 h-14 border-b border-zinc-200/80 dark:border-white/[0.08] glass-panel-strong px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/18 cursor-pointer"
              title="打开学科侧边栏"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                {breadcrumb.group}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                {breadcrumb.page}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Subject Switcher Pills */}
            <div className="hidden md:flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900/[0.05] dark:bg-white/[0.05] border border-zinc-900/[0.07] dark:border-white/[0.07]">
              {(
                [
                  ['hub', '总览'],
                  ['cet4', 'CET-4 四级'],
                  ['cet6', 'CET-6 六级'],
                  ['python', 'Python'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    setSubject(id);
                    soundEngine.click();
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    subject === id
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-900/[0.08] dark:border-white/[0.08] text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="搜索 Python 知识点与题库 (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">搜索</span>
              <kbd className="hidden xl:inline px-1.5 py-0.5 rounded bg-zinc-900/[0.07] dark:bg-white/[0.08] font-mono text-[10px] text-zinc-500">
                Ctrl K
              </kbd>
            </button>

            <motion.button
              whileTap={{ rotate: 180, scale: 0.9 }}
              onClick={() => setDarkMode((v) => !v)}
              className="p-2 rounded-lg bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-amber-600 dark:text-amber-300 cursor-pointer"
              title={darkMode ? '切换浅色陶瓷主题' : '切换炭黑石墨主题'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
          </div>
        </header>

        {/* Main Active View Container */}
        <main
          className={
            subject === 'python' && activeTab === 'ide'
              ? 'w-full max-w-[1640px] mx-auto px-3 sm:px-5 pt-4 flex-1'
              : 'w-full max-w-[1320px] mx-auto px-4 sm:px-6 pt-5 flex-1'
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeViewKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* 1. UNIFIED PERSONAL HUB */}
              {subject === 'hub' && (
                <PersonalHubView
                  pythonProgress={progress}
                  cet4Progress={cet4Progress}
                  cet4Papers={cet4Papers}
                  cet4Ready={!cet4Loading && !cet4Error && cet4Papers.length > 0}
                  cet6Progress={cet6Progress}
                  cet6Papers={cet6Papers}
                  cet6Ready={!cet6Loading && !cet6Error && cet6Papers.length > 0}
                  onEnterPython={navigatePython}
                  onEnterCet={navigateCet}
                  onOpenCetPaper={openCetPaper}
                />
              )}

              {/* 2. CET-4 MODULE */}
              {subject === 'cet4' && renderCetWorkspace('cet4')}

              {/* 3. CET-6 MODULE */}
              {subject === 'cet6' && renderCetWorkspace('cet6')}

              {/* 4. PYTHON COURSE MODULE */}
              {subject === 'python' && activeTab === 'dashboard' && (
                <DashboardView
                  progress={progress}
                  onNavigate={navigatePython}
                  onStartChapterQuiz={(chapter) => {
                    setQuizPreset({ chapter, status: 'all', nonce: Date.now() });
                    navigatePython('quiz');
                  }}
                  onStartExamScopeSprint={() => {
                    setQuizPreset({ chapter: 'exam', status: 'all', nonce: Date.now() });
                    navigatePython('quiz');
                  }}
                  onJumpKnowledgeChapter={(chapter) => {
                    setTutorialChapter(chapter);
                    navigatePython('tutorials');
                  }}
                  onOpenLessonPlan={() => {
                    setTutorialChapter(4);
                    navigatePython('tutorials');
                  }}
                />
              )}

              {subject === 'python' && activeTab === 'tutorials' && (
                <TutorialReaderView
                  key={`tut-${tutorialChapter}`}
                  tutorials={CHAPTER_TUTORIALS}
                  readSections={progress.readTutorialSections ?? []}
                  initialChapter={tutorialChapter}
                  onToggleReadSection={handleToggleReadTutorialSection}
                  onRunCode={(title, code, stdin) =>
                    setSandboxState({ open: true, title: `教案实跑：${title}`, code, stdin })
                  }
                  onJumpChapterQuiz={(chapter) => {
                    setQuizPreset({ chapter, status: 'all', nonce: Date.now() });
                    navigatePython('quiz');
                  }}
                  onJumpFlashcards={() => navigatePython('flashcards')}
                />
              )}

              {subject === 'python' && activeTab === 'quiz' && (
                <QuizView
                  progress={progress}
                  preset={quizPreset}
                  onAnswer={handleAnswer}
                  onToggleBookmark={handleToggleBookmark}
                  onSaveNote={handleSaveNote}
                  onRemoveMistake={handleRemoveMistake}
                />
              )}

              {subject === 'python' && activeTab === 'exam' && (
                <MockExamView
                  examHistory={progress.examHistory}
                  onCompleteExam={handleCompleteExam}
                />
              )}

              {subject === 'python' && activeTab === 'labs' && (
                <CodingLabView
                  progress={progress}
                  initialLabId={labJumpId}
                  onMarkSolved={handleMarkLabSolved}
                  onSaveDraft={(id, code) =>
                    setProgress((p) => ({ ...p, labDrafts: { ...p.labDrafts, [id]: code } }))
                  }
                  onSaveBlankDraft={(id, blanks) =>
                    setProgress((p) => ({
                      ...p,
                      labBlankDrafts: { ...p.labBlankDrafts, [id]: blanks },
                    }))
                  }
                  onOpenInIde={(payload) => {
                    setIdePayload({ ...payload, nonce: Date.now() });
                    navigatePython('ide');
                  }}
                />
              )}

              {subject === 'python' && activeTab === 'ide' && (
                <PythonIdeView externalPayload={idePayload} appDarkMode={darkMode} />
              )}

              {subject === 'python' && activeTab === 'knowledge' && (
                <KnowledgeHubView
                  progress={progress}
                  initialChapter={knowledgeJump.chapter}
                  initialSubTab={knowledgeJump.subTab}
                  onToggleMastered={handleToggleKnowledgeMastered}
                  onRunSnippet={(title, code, stdin) =>
                    setSandboxState({ open: true, title: `试跑示例：${title}`, code, stdin })
                  }
                  onJumpLab={(labId) => {
                    setLabJumpId(labId);
                    navigatePython('labs');
                  }}
                />
              )}

              {subject === 'python' && activeTab === 'flashcards' && (
                <FlashcardsView progress={progress} onRateCard={handleRateFlashcard} />
              )}

              {subject === 'python' && activeTab === 'mistakes' && (
                <MistakeBookView
                  progress={progress}
                  onStartMistakeQuiz={() => {
                    setQuizPreset({ chapter: 'all', status: 'mistakes', nonce: Date.now() });
                    navigatePython('quiz');
                  }}
                  onJumpQuestion={(id) => {
                    setQuizPreset({ chapter: 'all', status: 'all', jumpQuestionId: id, nonce: Date.now() });
                    navigatePython('quiz');
                  }}
                  onRemoveMistake={handleRemoveMistake}
                  onToggleBookmark={handleToggleBookmark}
                  onImportProgress={(data) => setProgress(data)}
                  onResetProgress={() => setProgress(createInitialProgress())}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Search Palette */}
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onJumpMcq={(questionId) => {
          setQuizPreset({ chapter: 'all', status: 'all', jumpQuestionId: questionId, nonce: Date.now() });
          navigatePython('quiz');
        }}
        onJumpKnowledge={(chapter, showPitfalls) => {
          setKnowledgeJump({
            chapter: chapter ?? 'all',
            subTab: showPitfalls ? 'pitfalls' : 'notes',
          });
          navigatePython('knowledge');
        }}
        onJumpLab={(labId) => {
          setLabJumpId(labId);
          navigatePython('labs');
        }}
        onJumpTutorial={(chapter) => {
          setTutorialChapter(chapter);
          navigatePython('tutorials');
        }}
      />

      {/* Quick Python Runner Drawer */}
      <QuickPythonDrawer
        open={sandboxState.open}
        title={sandboxState.title}
        initialCode={sandboxState.code}
        initialStdin={sandboxState.stdin}
        onClose={() => setSandboxState((s) => ({ ...s, open: false }))}
        onOpenInIde={(code, stdin, title) => {
          setIdePayload({ nonce: Date.now(), title, filename: 'demo.py', code, stdin });
          navigatePython('ide');
        }}
      />
    </div>
  );
}
