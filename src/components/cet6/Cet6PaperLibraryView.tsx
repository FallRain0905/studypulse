import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Play,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Cet6PaperSummary, Cet6Progress, CetLevel } from '../../types/cet6';
import { soundEngine } from '../../utils/sound';

type KindFilter = 'all' | 'full' | 'no-listening' | 'reading-pack' | 'translation' | 'active';

export function Cet6PaperLibraryView({
  level = 'cet6',
  papers,
  progress,
  onOpenPaper,
}: {
  level?: CetLevel;
  papers: Cet6PaperSummary[];
  progress: Cet6Progress;
  onOpenPaper: (paperId: string, mode: 'practice' | 'mock') => void;
}) {
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [query, setQuery] = useState('');
  const readingPackCount = useMemo(
    () => papers.filter((p) => p.kind === 'reading-pack').length,
    [papers]
  );
  const segCountLabel = level === 'cet4' ? '8' : '7';

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const p of papers) {
      if (p.year > 0) set.add(p.year);
    }
    return [...set].sort((a, b) => b - a);
  }, [papers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (kindFilter === 'full' && p.kind !== 'full') return false;
      if (kindFilter === 'no-listening' && p.kind !== 'no-listening' && p.kind !== 'partial') {
        return false;
      }
      if (kindFilter === 'reading-pack' && p.kind !== 'reading-pack') return false;
      if (kindFilter === 'translation' && p.kind !== 'translation') return false;
      if (kindFilter === 'active') {
        const a = progress.attempts[p.id];
        if (!a || (!a.submitted && Object.keys(a.answers).length === 0)) return false;
      }
      if (yearFilter !== 'all' && p.year !== yearFilter) return false;
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.folder.toLowerCase().includes(q) &&
        !p.yearMonth.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [papers, kindFilter, yearFilter, query, progress.attempts]);

  return (
    <div className="space-y-5 pb-12">
      {/* Filter & Search Toolbar */}
      <div className="glass-panel rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', `全部试卷 (${papers.length})`],
                ['full', `★ 完整听力卷 · ${segCountLabel}段音频 (${papers.filter((p) => p.kind === 'full').length})`],
                [
                  'no-listening',
                  `无听力卷 (${papers.filter((p) => p.kind === 'no-listening' || p.kind === 'partial').length})`,
                ],
                ...(readingPackCount > 0
                  ? ([['reading-pack', `阅读分类专项 (${readingPackCount})`]] as const)
                  : []),
                [
                  'translation',
                  `翻译汇编 (${papers.filter((p) => p.kind === 'translation').length})`,
                ],
                ['active', '已作答 / 进行中'],
              ] as ReadonlyArray<readonly [KindFilter, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setKindFilter(id);
                  soundEngine.click();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  kindFilter === id
                    ? id === 'full'
                      ? 'bg-amber-500 dark:bg-amber-400 text-zinc-950 shadow-sm'
                      : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                    : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/18'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索年份或卷名（如 2025、组合卷）..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#111114] border border-zinc-300 dark:border-white/[0.1] text-xs outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Year Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-zinc-500/12">
          <button
            onClick={() => setYearFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
              yearFilter === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/10'
            }`}
          >
            全部年份
          </button>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYearFilter(y)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                yearFilter === y
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/10'
              }`}
            >
              {y}
            </button>
          ))}
          <button
            onClick={() => setYearFilter(0)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              yearFilter === 0
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/10'
            }`}
          >
            翻译汇编
          </button>
          <span className="ml-auto text-xs text-zinc-500 font-mono">
            共匹配 {filtered.length} 份
          </span>
        </div>
      </div>

      {/* Paper Cards Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-sm font-bold">当前筛选下没有试卷</p>
          <button
            onClick={() => {
              setKindFilter('all');
              setYearFilter('all');
              setQuery('');
            }}
            className="mt-2 px-4 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold cursor-pointer"
          >
            重置筛选条件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, idx) => {
            const attempt = progress.attempts[p.id];
            const answered = attempt ? Object.keys(attempt.answers).length : 0;
            const latestExam = progress.examHistory.find((r) => r.paperId === p.id);
            const pct = Math.min(100, Math.round((answered / Math.max(1, p.questionCount)) * 100));

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.25) }}
                className="glass-panel-strong rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-zinc-200/80 dark:border-white/[0.08] hover:border-amber-500/35 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-900/[0.06] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200">
                        {p.yearMonth}
                      </span>
                      {p.hasListening ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          <Headphones className="w-3 h-3" /> {p.audioCount} 段音频
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-500/12 text-zinc-500 dark:text-zinc-400">
                          <FileText className="w-3 h-3" />{' '}
                          {p.kind === 'translation'
                            ? '翻译专项'
                            : p.kind === 'reading-pack'
                              ? '阅读分类专项'
                              : '无听力卷'}
                        </span>
                      )}
                    </div>

                    {latestExam ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {latestExam.breakdown.totalEstimated710}分
                      </span>
                    ) : answered > 0 ? (
                      <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                        已答 {answered}/{p.questionCount}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base leading-snug">{p.title}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>{p.questionCount} 题</span>
                      {p.hasWriting && <span>· 写作</span>}
                      {p.hasListening && <span>· 听力</span>}
                      {p.hasBankedCloze && <span>· 选词</span>}
                      {p.hasLongReading && <span>· 长篇匹配</span>}
                      {p.hasCarefulReading && <span>· 仔细阅读</span>}
                      {p.hasTranslation && <span>· 翻译</span>}
                    </div>
                  </div>

                  {answered > 0 && (
                    <div className="h-1.5 rounded-full bg-zinc-500/15 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${
                          attempt?.submitted ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-500/10">
                  <button
                    onClick={() => {
                      soundEngine.click();
                      onOpenPaper(p.id, 'practice');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {attempt?.submitted ? '复盘解析' : answered > 0 ? '继续练习' : '沉浸练习'}
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.click();
                      onOpenPaper(p.id, 'mock');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-sm cursor-pointer transition-colors"
                  >
                    {p.kind === 'full' ? (
                      <>
                        <Award className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" /> 710分模考
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" /> 限时测验
                      </>
                    )}
                    <Play className="w-3 h-3 fill-current hidden sm:inline" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
