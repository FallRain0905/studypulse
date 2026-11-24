import type { Cet6PaperSummary, Cet6ParsedPaper, CetLevel } from '../types/cet6';

export interface Cet6CatalogResponse {
  ok: boolean;
  sourceDir?: string;
  rawHtmlAvailable?: boolean;
  totalPapers: number;
  papers: Cet6PaperSummary[];
  error?: string;
}

const memoryPaperCache = new Map<string, Cet6ParsedPaper>();

function apiBase(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export async function fetchCetCatalog(level: CetLevel): Promise<Cet6CatalogResponse> {
  try {
    const res = await fetch(`${apiBase()}/api/${level}/index`);
    if (!res.ok) {
      return { ok: false, totalPapers: 0, papers: [], error: `HTTP ${res.status}` };
    }
    return (await res.json()) as Cet6CatalogResponse;
  } catch (err) {
    return {
      ok: false,
      totalPapers: 0,
      papers: [],
      error: err instanceof Error ? err.message : `无法连接 ${level.toUpperCase()} 题库接口`,
    };
  }
}

export async function fetchCetPaper(level: CetLevel, paperId: string): Promise<Cet6ParsedPaper> {
  const cacheKey = `${level}:${paperId}`;
  const cached = memoryPaperCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${apiBase()}/api/${level}/paper?id=${encodeURIComponent(paperId)}`);
  if (!res.ok) {
    throw new Error(`加载试卷失败 (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { ok: boolean; paper?: Cet6ParsedPaper; error?: string };
  if (!data.ok || !data.paper) {
    throw new Error(data.error || '试卷解析失败');
  }
  const base = apiBase();
  const normalizedPaper: Cet6ParsedPaper = {
    ...data.paper,
    listening: data.paper.listening.map((seg) => ({
      ...seg,
      audioUrl:
        seg.audioUrl && seg.audioUrl.startsWith('/api/') && base
          ? `${base}${seg.audioUrl}`
          : seg.audioUrl,
    })),
  };
  memoryPaperCache.set(cacheKey, normalizedPaper);
  return normalizedPaper;
}

// Backward-compatible aliases
export const fetchCet6Catalog = () => fetchCetCatalog('cet6');
export const fetchCet6Paper = (paperId: string) => fetchCetPaper('cet6', paperId);
