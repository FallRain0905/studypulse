import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Code2, HelpCircle, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CODING_LABS } from '../data/codingLabs';
import { KNOWLEDGE_POINTS, PITFALL_VAULT } from '../data/knowledgeData';
import { MCQ_QUESTIONS } from '../data/questions';
import { CHAPTER_TUTORIALS } from '../data/tutorials';

interface SearchResult {
  kind: 'mcq' | 'knowledge' | 'lab' | 'pitfall' | 'tutorial';
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  chapter?: number;
  questionId?: number;
  labId?: string;
}

export function GlobalSearchModal({
  open,
  onClose,
  onJumpMcq,
  onJumpKnowledge,
  onJumpLab,
  onJumpTutorial,
}: {
  open: boolean;
  onClose: () => void;
  onJumpMcq: (questionId: number) => void;
  onJumpKnowledge: (chapter?: number, showPitfalls?: boolean) => void;
  onJumpLab: (labId: string) => void;
  onJumpTutorial: (chapter: number) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        ...PITFALL_VAULT.slice(0, 3).map((p) => ({
          kind: 'pitfall' as const,
          id: p.id,
          title: p.title,
          subtitle: p.lesson,
          badge: p.category,
        })),
        ...CODING_LABS.slice(0, 3).map((l) => ({
          kind: 'lab' as const,
          id: l.id,
          title: l.title,
          subtitle: l.description,
          badge: l.source,
          labId: l.id,
        })),
      ];
    }

    const out: SearchResult[] = [];

    for (const tut of CHAPTER_TUTORIALS) {
      for (const sec of tut.sections) {
        if (
          sec.title.toLowerCase().includes(q) ||
          sec.concept.toLowerCase().includes(q)
        ) {
          out.push({
            kind: 'tutorial',
            id: `tut-${tut.chapter}-${sec.id}`,
            title: sec.title,
            subtitle: sec.concept.slice(0, 100),
            badge: `第 ${tut.chapter} 章 详细教案`,
            chapter: tut.chapter,
          });
        }
      }
      for (const ex of tut.workedExamples) {
        if (
          ex.title.toLowerCase().includes(q) ||
          ex.problemStatement.toLowerCase().includes(q)
        ) {
          out.push({
            kind: 'tutorial',
            id: `tut-ex-${tut.chapter}-${ex.id}`,
            title: ex.title,
            subtitle: ex.problemStatement.slice(0, 100),
            badge: `第 ${tut.chapter} 章 例题详解`,
            chapter: tut.chapter,
          });
        }
      }
    }

    for (const kp of KNOWLEDGE_POINTS) {
      if (
        kp.title.toLowerCase().includes(q) ||
        kp.summary.toLowerCase().includes(q) ||
        kp.bullets.some((b) => b.toLowerCase().includes(q))
      ) {
        out.push({
          kind: 'knowledge',
          id: kp.id,
          title: kp.title,
          subtitle: kp.summary,
          badge: `第 ${kp.chapter} 章 知识点`,
          chapter: kp.chapter,
        });
      }
    }

    for (const pf of PITFALL_VAULT) {
      if (
        pf.title.toLowerCase().includes(q) ||
        pf.lesson.toLowerCase().includes(q) ||
        pf.category.toLowerCase().includes(q)
      ) {
        out.push({
          kind: 'pitfall',
          id: pf.id,
          title: pf.title,
          subtitle: pf.lesson,
          badge: `踩坑 · ${pf.category}`,
        });
      }
    }

    for (const lab of CODING_LABS) {
      if (
        lab.title.toLowerCase().includes(q) ||
        lab.description.toLowerCase().includes(q) ||
        lab.source.toLowerCase().includes(q)
      ) {
        out.push({
          kind: 'lab',
          id: lab.id,
          title: lab.title,
          subtitle: lab.description,
          badge: `编程实验 · 第 ${lab.chapter} 章`,
          labId: lab.id,
        });
      }
    }

    for (const m of MCQ_QUESTIONS) {
      if (
        m.stem.toLowerCase().includes(q) ||
        m.explanation.toLowerCase().includes(q) ||
        m.chapterTitle.toLowerCase().includes(q) ||
        Object.values(m.options).some((v) => v.toLowerCase().includes(q)) ||
        String(m.id) === q
      ) {
        out.push({
          kind: 'mcq',
          id: `mcq-${m.id}`,
          title: `#${m.id} ${m.stem}`,
          subtitle: m.explanation,
          badge: `第 ${m.chapter} 章 单选`,
          questionId: m.id,
        });
      }
      if (out.length >= 28) break;
    }

    return out.slice(0, 28);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-md pt-[10vh] px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-2xl glass-panel-strong shadow-2xl border border-zinc-500/25"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-500/15">
              <Search className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="全局搜索 146 道题、4~8 章教案、知识点、踩坑记录、22 道编程题（如：super、Ring、csv、素数）..."
                className="w-full bg-transparent text-sm md:text-base outline-none placeholder:text-slate-400"
              />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-500/15 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2.5 space-y-1">
              {!query.trim() && (
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  高频推荐入口
                </div>
              )}
              {results.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  没有找到与 “{query}” 匹配的内容，试试搜索 “csv”、“素数”、“切片” 或题号
                </div>
              ) : (
                results.map((item) => {
                  const Icon =
                    item.kind === 'mcq'
                      ? HelpCircle
                      : item.kind === 'knowledge' || item.kind === 'tutorial'
                        ? BookOpen
                        : item.kind === 'lab'
                          ? Code2
                          : AlertTriangle;
                  const color =
                    item.kind === 'mcq'
                      ? 'text-cyan-400 bg-cyan-500/12'
                      : item.kind === 'tutorial'
                        ? 'text-emerald-400 bg-emerald-500/18'
                        : item.kind === 'knowledge'
                          ? 'text-teal-400 bg-teal-500/12'
                          : item.kind === 'lab'
                            ? 'text-violet-400 bg-violet-500/12'
                            : 'text-amber-400 bg-amber-500/12';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.kind === 'mcq' && item.questionId) {
                          onJumpMcq(item.questionId);
                        } else if (item.kind === 'tutorial' && item.chapter) {
                          onJumpTutorial(item.chapter);
                        } else if (item.kind === 'knowledge') {
                          onJumpKnowledge(item.chapter, false);
                        } else if (item.kind === 'pitfall') {
                          onJumpKnowledge(undefined, true);
                        } else if (item.kind === 'lab' && item.labId) {
                          onJumpLab(item.labId);
                        }
                        onClose();
                      }}
                      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-500/10 transition-colors group cursor-pointer"
                    >
                      <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-300">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-500/15 text-[11px] text-slate-400">
              <span>共检索 {MCQ_QUESTIONS.length} 道单选 · {KNOWLEDGE_POINTS.length} 大专题 · {CODING_LABS.length} 道编程实验 · {PITFALL_VAULT.length} 大踩坑警示</span>
              <span>ESC 关闭</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
