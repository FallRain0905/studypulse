import { createReadStream, existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';

type CetLevel = 'cet4' | 'cet6';

const DEFAULT_QBANK_ROOT = process.env.QBANK_DIR || 'D:\\question-bank';

const LEVEL_CONFIG: Record<
  CetLevel,
  {
    rootDir: string;
    rawHtmlDir: string;
    rawIndexPath: string;
    labelCn: string;
  }
> = {
  cet6: {
    rootDir: process.env.CET6_DIR || path.join(DEFAULT_QBANK_ROOT, '六级真题整理'),
    rawHtmlDir: path.join(DEFAULT_QBANK_ROOT, '.data', 'yfzxmn-raw'),
    rawIndexPath: path.join(DEFAULT_QBANK_ROOT, 'quiz', 'data', 'index.json'),
    labelCn: '六级',
  },
  cet4: {
    rootDir: process.env.CET4_DIR || path.join(DEFAULT_QBANK_ROOT, '四级真题整理'),
    rawHtmlDir: path.join(DEFAULT_QBANK_ROOT, '.data', 'cet4-raw'),
    rawIndexPath: path.join(DEFAULT_QBANK_ROOT, '.data', 'cet4-zhenti.json'),
    labelCn: '四级',
  },
};

interface RawQuestion {
  p: number;
  t: string;
  q: string;
  a: string;
  o?: Array<{ key: string; text: string }>;
  e?: string;
  chapter?: string;
}

interface AudioManifestItem {
  order: number;
  file: string;
  source?: string;
}

interface InternalPaperEntry {
  id: string;
  examId: string | null;
  yearMonth: string;
  year: number;
  folder: string;
  title: string;
  dirPath: string;
  questionCount: number;
  audioCount: number;
  kind: 'full' | 'no-listening' | 'partial' | 'translation' | 'reading-pack';
  hasListening: boolean;
  hasWriting: boolean;
  hasBankedCloze: boolean;
  hasLongReading: boolean;
  hasCarefulReading: boolean;
  hasTranslation: boolean;
}

const catalogCache: Record<CetLevel, InternalPaperEntry[] | null> = { cet4: null, cet6: null };
const catalogMap: Record<CetLevel, Map<string, InternalPaperEntry> | null> = { cet4: null, cet6: null };
const parsedPaperCache = new Map<string, unknown>();

function parseIndexTitle(title: string, level: CetLevel): { yearMonth: string; folder: string } {
  const m = title.match(/真题(\d{4})年(\d{1,2})月/);
  const seq = title.match(/-\((\d+)\)/);
  const combo = /组合卷/.test(title);
  if (m) {
    const ym = `${m[1]}年${String(m[2]).padStart(2, '0')}月`;
    let suffix = seq ? `-(${seq[1]})` : '';
    if (combo) suffix = `组合卷${suffix}`;
    return { yearMonth: ym, folder: `${ym}${suffix}` };
  }
  if (level === 'cet6') {
    const n = title.match(/汇编(\d+)/);
    return {
      yearMonth: '其它',
      folder: n
        ? `翻译真题汇编${n[1]}`
        : title.replace(/^大学英语六级/, '').replace(/[\\/:*?"<>|]/g, '_').trim(),
    };
  }
  const label = title.replace(/^大学英语四级/, '').replace(/[\\/:*?"<>|]/g, '_').trim();
  return { yearMonth: '其它', folder: label || '未命名' };
}

function formatFriendlyTitle(yearMonth: string, folder: string, level: CetLevel): string {
  const cn = LEVEL_CONFIG[level].labelCn;
  if (yearMonth === '其它') {
    if (folder.includes('阅读分类')) return `${cn}${folder}`;
    const n = folder.match(/(\d+)$/);
    if (folder.includes('翻译') && n) return `${cn}翻译真题汇编 ${n[1]}`;
    return `${cn}${folder}`;
  }
  const seq = folder.match(/-\((\d+)\)$/);
  const combo = folder.includes('组合卷');
  if (seq) {
    return `${yearMonth} ${cn}${combo ? '组合卷' : '真题'}（第${seq[1]}套）`;
  }
  return `${yearMonth} ${cn}真题`;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&ldquo;/gi, '“')
    .replace(/&rdquo;/gi, '”')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&rsquo;/gi, '’')
    .replace(/&hellip;/gi, '…')
    .replace(/&#(\d+);/g, (_, num) => {
      const code = Number(num);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

function htmlToLines(html: string): string[] {
  const s = decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '');
  return s
    .split('\n')
    .map((ln) => ln.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Extract raw HTML <font name='questionFont'> passage blocks paired with the question numbers (quid) that follow each block.
 */
function extractHtmlPassageGroups(rawHtml: string): Array<{
  lines: string[];
  joined: string;
  qnums: number[];
  rawOffset: number;
}> {
  const events: Array<{ pos: number; kind: 'passage' | 'q'; text?: string; qnum?: number }> = [];

  const pRe = /<font\s+name=['"]questionFont['"][^>]*>([\s\S]*?)(?=<div\b[^>]*name=['"]question['"]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(rawHtml)) !== null) {
    events.push({ pos: m.index, kind: 'passage', text: m[1] });
  }

  const qRe = /<div\b[^>]*name=['"]question['"][^>]*>([\s\S]*?)(?=<div\b[^>]*name=['"]question['"]|<font\s+name=['"]questionFont['"]|$)/gi;
  while ((m = qRe.exec(rawHtml)) !== null) {
    const body = m[1];
    const quid = body.match(/quid=['"](\d+)['"]/i);
    let qnum = quid ? Number(quid[1]) : 0;
    if (!qnum) {
      const plain = body.replace(/<[^>]+>/g, '').trim();
      const lead = plain.match(/^(\d+)\s*[.．]/);
      if (lead) qnum = Number(lead[1]);
    }
    if (qnum > 0) {
      events.push({ pos: m.index, kind: 'q', qnum });
    }
  }

  events.sort((a, b) => a.pos - b.pos);

  const groups: Array<{ lines: string[]; joined: string; qnums: number[]; rawOffset: number }> = [];
  let curText: string | null = null;
  let curPos = 0;
  let curQs: number[] = [];

  const flush = () => {
    if (curText !== null && curQs.length > 0) {
      const lines = htmlToLines(curText);
      const joined = lines.join('\n');
      if (joined.length >= 200) {
        groups.push({ lines, joined, qnums: curQs, rawOffset: curPos });
      }
    }
  };

  for (const ev of events) {
    if (ev.kind === 'passage') {
      flush();
      curText = ev.text ?? '';
      curPos = ev.pos;
      curQs = [];
    } else if (ev.qnum) {
      curQs.push(ev.qnum);
    }
  }
  flush();

  return groups;
}

function parseLongReadingParagraphs(lines: string[]): {
  title: string;
  paragraphs: Array<{ letter: string; text: string }>;
} {
  const titleParts: string[] = [];
  const paragraphs: Array<{ letter: string; text: string }> = [];

  for (const ln of lines) {
    const m = ln.match(/^(?:[\[\(【]\s*([A-Z])\s*[\]\)】]|([A-Z])\s*[.．、\)\]])\s*(.*)$/);
    if (m) {
      const letter = (m[1] || m[2]).toUpperCase();
      const body = (m[3] || '').trim();
      paragraphs.push({ letter, text: body });
    } else if (paragraphs.length > 0) {
      paragraphs[paragraphs.length - 1].text = `${paragraphs[paragraphs.length - 1].text} ${ln}`.trim();
    } else {
      titleParts.push(ln);
    }
  }

  // Repair rare source typos where a letter is duplicated and the preceding letter skipped (e.g. H, J, J, K -> H, I, J, K)
  for (let i = 1; i < paragraphs.length - 1; i += 1) {
    const prevCode = paragraphs[i - 1].letter.charCodeAt(0);
    const curCode = paragraphs[i].letter.charCodeAt(0);
    const nextCode = paragraphs[i + 1].letter.charCodeAt(0);
    if (curCode === nextCode && curCode === prevCode + 2) {
      paragraphs[i].letter = String.fromCharCode(prevCode + 1);
    }
  }

  return { title: titleParts.join(' ').trim(), paragraphs };
}

function splitTranslation(explanation: string): { cleanExplanation: string; translation: string } {
  const markerIdx = explanation.indexOf('[参考译文]');
  if (markerIdx === -1) {
    return { cleanExplanation: explanation.trim(), translation: '' };
  }
  const before = explanation
    .slice(0, markerIdx)
    .replace(/结构框图[：:]?\s*$/, '')
    .trim();
  const trans = explanation.slice(markerIdx + '[参考译文]'.length).trim();
  return { cleanExplanation: before, translation: trans };
}

async function buildCatalog(level: CetLevel): Promise<InternalPaperEntry[]> {
  if (catalogCache[level] && catalogMap[level]) return catalogCache[level]!;

  const cfg = LEVEL_CONFIG[level];
  const examIdByKey = new Map<string, string>();
  if (existsSync(cfg.rawIndexPath)) {
    try {
      const idxRaw = await fs.readFile(cfg.rawIndexPath, 'utf-8');
      const idxList = JSON.parse(idxRaw) as Array<{ id?: string; ex_id?: string; title?: string; name?: string }>;
      for (const p of idxList) {
        const title = p.title || p.name || '';
        const idVal = p.id || p.ex_id || '';
        if (!title || !idVal) continue;
        if (level === 'cet6' && (!title.includes('真题') || !title.includes('六级'))) continue;
        const { yearMonth, folder } = parseIndexTitle(title, level);
        examIdByKey.set(`${yearMonth}/${folder}`, String(idVal));
      }
    } catch {
      // optional raw index
    }
  }

  const entries: InternalPaperEntry[] = [];
  if (!existsSync(cfg.rootDir)) {
    catalogCache[level] = [];
    catalogMap[level] = new Map();
    return [];
  }

  const topDirs = await fs.readdir(cfg.rootDir, { withFileTypes: true });
  for (const ymDir of topDirs) {
    if (!ymDir.isDirectory()) continue;
    const yearMonth = ymDir.name;
    const ymPath = path.join(cfg.rootDir, yearMonth);
    const subDirs = await fs.readdir(ymPath, { withFileTypes: true });

    for (const paperDir of subDirs) {
      if (!paperDir.isDirectory()) continue;
      const folder = paperDir.name;
      const dirPath = path.join(ymPath, folder);
      const qPath = path.join(dirPath, '题目.json');
      if (!existsSync(qPath)) continue;

      try {
        const rawText = await fs.readFile(qPath, 'utf-8');
        const qs = JSON.parse(rawText) as RawQuestion[];
        const audioDir = path.join(dirPath, '音频');
        let audioCount = 0;
        if (existsSync(audioDir)) {
          const aFiles = await fs.readdir(audioDir);
          audioCount = aFiles.filter((f) => f.toLowerCase().endsWith('.mp3')).length;
        }

        const yearMatch = yearMonth.match(/^(\d{4})年/);
        const year = yearMatch ? Number(yearMatch[1]) : 0;
        const id = `${yearMonth}/${folder}`;
        const hasListening = audioCount > 0 || qs.some((q) => (q.e || '').includes('[听力原文]'));
        const hasWriting = qs.some(
          (q) => q.t === 'short_answer' && q.p === 1 && /Directions:|essay|write/i.test(q.q)
        );
        const hasBankedCloze = qs.some(
          (q) =>
            q.t === 'fill_blank' &&
            (/第\s*\d+\s*题\s*$/.test(q.q.trim()) || /\nA\.[a-z]/i.test(q.q))
        );
        const hasLongReading = qs.some(
          (q) =>
            q.t === 'fill_blank' &&
            !/第\s*\d+\s*题\s*$/.test(q.q.trim()) &&
            !/\nA\.[a-z]/i.test(q.q)
        );
        const hasCarefulReading = qs.some(
          (q) =>
            q.t === 'single_choice' &&
            !(q.e || '').includes('[听力原文]') &&
            !/^A\./.test(q.q.trim())
        );
        const hasTranslation = qs.some(
          (q) => q.t === 'short_answer' && !(q.p === 1 && /Directions:|essay|write/i.test(q.q))
        );

        let kind: InternalPaperEntry['kind'] = 'full';
        if (folder.includes('阅读分类')) {
          kind = 'reading-pack';
        } else if (yearMonth === '其它' || (!hasWriting && !hasListening && hasTranslation)) {
          kind = 'translation';
        } else if (hasListening) {
          kind = 'full';
        } else if (qs.length >= 30) {
          kind = 'no-listening';
        } else {
          kind = 'partial';
        }

        entries.push({
          id,
          examId: examIdByKey.get(id) ?? null,
          yearMonth,
          year,
          folder,
          title: formatFriendlyTitle(yearMonth, folder, level),
          dirPath,
          questionCount: qs.length,
          audioCount,
          kind,
          hasListening,
          hasWriting,
          hasBankedCloze,
          hasLongReading,
          hasCarefulReading,
          hasTranslation,
        });
      } catch {
        // skip unreadable paper
      }
    }
  }

  entries.sort((a, b) => {
    if (a.year === 0 && b.year !== 0) return 1;
    if (a.year !== 0 && b.year === 0) return -1;
    if (a.yearMonth !== b.yearMonth) return b.yearMonth.localeCompare(a.yearMonth, 'zh-CN');
    return a.folder.localeCompare(b.folder, 'zh-CN');
  });

  catalogCache[level] = entries;
  catalogMap[level] = new Map(entries.map((e) => [e.id, e]));
  return entries;
}

function parseSingleBankedCloze(qs: RawQuestion[], htmlPassageText: string | null) {
  if (qs.length === 0) return null;
  const rawSource =
    htmlPassageText && htmlPassageText.length > qs[0].q.length ? htmlPassageText : qs[0].q;

  const bodyWithoutTail = rawSource.replace(/\n*第\s*\d+\s*题\s*$/, '').trim();
  const bankStartMatch = bodyWithoutTail.match(/\nA\s*[.．\)\]]+\s*[A-Za-z]/);
  let passage = bodyWithoutTail;
  const wordBank: Array<{ key: string; word: string }> = [];

  if (bankStartMatch && bankStartMatch.index !== undefined) {
    passage = bodyWithoutTail.slice(0, bankStartMatch.index).trim();
    const bankText = bodyWithoutTail.slice(bankStartMatch.index).trim();
    const seenKeys = new Set<string>();
    const itemRe =
      /(?:^|\s)([A-O])\s*[.．\)\]）]+\s*([A-Za-z][A-Za-z'\-\s]*?)(?=\s+[A-O]\s*[.．\)\]）]+\s*[A-Za-z]|$)/g;
    for (const ln of bankText.split('\n')) {
      const trimmed = ln.trim();
      if (!trimmed) continue;
      let match: RegExpExecArray | null;
      let matchedLine = false;
      itemRe.lastIndex = 0;
      while ((match = itemRe.exec(trimmed)) !== null) {
        const key = match[1].toUpperCase();
        const word = match[2].trim();
        if (!seenKeys.has(key) && word) {
          seenKeys.add(key);
          wordBank.push({ key, word });
          matchedLine = true;
        }
      }
      if (!matchedLine) {
        const m = trimmed.match(/^([A-O])\s*[.．\)\]）]?\s*(.+)$/);
        if (m && !seenKeys.has(m[1].toUpperCase())) {
          seenKeys.add(m[1].toUpperCase());
          wordBank.push({ key: m[1].toUpperCase(), word: m[2].trim() });
        }
      }
    }
    wordBank.sort((a, b) => a.key.localeCompare(b.key));
  }

  const wordMap = new Map(wordBank.map((w) => [w.key, w.word]));
  const firstSplit = splitTranslation(qs[0].e || '');

  const blanks = qs.map((q) => {
    const rawAns = (q.a || '').trim();
    const ansMatch = rawAns.match(/^([A-O])(?:\s+(.+))?$/i);
    const answerKey = ansMatch ? ansMatch[1].toUpperCase() : rawAns.slice(0, 1).toUpperCase();
    const answerWord = (ansMatch?.[2] || wordMap.get(answerKey) || '').trim();
    const { cleanExplanation } = splitTranslation(q.e || '');
    return {
      p: q.p,
      displayNumber: q.p,
      answerKey,
      answerWord,
      explanation: cleanExplanation,
    };
  });

  return {
    passage,
    wordBank,
    blanks,
    translation: firstSplit.translation,
  };
}

function parseBankedClozes(
  qs: RawQuestion[],
  htmlGroups: Array<{ lines: string[]; joined: string; qnums: number[]; rawOffset: number }>
) {
  if (qs.length === 0) return [];
  const qByP = new Map(qs.map((q) => [q.p, q]));
  const matchedGroups: Array<{ qs: RawQuestion[]; text: string }> = [];
  const assignedPs = new Set<number>();

  for (const g of htmlGroups) {
    const groupQs = g.qnums.map((n) => qByP.get(n)).filter((x): x is RawQuestion => Boolean(x));
    if (groupQs.length >= 5) {
      matchedGroups.push({ qs: groupQs, text: g.joined });
      for (const q of groupQs) assignedPs.add(q.p);
    }
  }

  if (matchedGroups.length > 0) {
    return matchedGroups
      .map((g) => parseSingleBankedCloze(g.qs, g.text))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }

  const single = parseSingleBankedCloze(qs, null);
  return single ? [single] : [];
}

function parseSingleLongReading(
  qs: RawQuestion[],
  htmlGroup: { lines: string[]; joined: string; rawOffset: number } | null,
  rawHtml: string | null
) {
  if (qs.length === 0) return null;

  let title = '';
  let paragraphs: Array<{ letter: string; text: string }> = [];
  let restoredFromRawHtml = false;
  let translation = '';

  if (htmlGroup) {
    const parsed = parseLongReadingParagraphs(htmlGroup.lines);
    if (parsed.paragraphs.length >= 6) {
      title = parsed.title;
      paragraphs = parsed.paragraphs;
      restoredFromRawHtml = true;
      if (rawHtml) {
        const afterSlice = rawHtml.slice(htmlGroup.rawOffset, htmlGroup.rawOffset + 55000);
        const transMatch = afterSlice.match(
          /\[参考译文\]([\s\S]*?)(?=<\/div>\s*<\/div>\s*<div|<div\s+id=['"]question)/i
        );
        if (transMatch) {
          translation = htmlToLines(transMatch[1]).join('\n');
        }
      }
    }
  }

  if (paragraphs.length === 0) {
    const splitIdx = qs[0].q.lastIndexOf('\n\n');
    const passagePart = splitIdx !== -1 ? qs[0].q.slice(0, splitIdx) : qs[0].q;
    const parsed = parseLongReadingParagraphs(
      passagePart.split('\n').map((s) => s.trim()).filter(Boolean)
    );
    title = parsed.title;
    paragraphs = parsed.paragraphs;
  }

  const firstSplit = splitTranslation(qs[0].e || '');
  if (!translation || firstSplit.translation.length > translation.length) {
    translation = firstSplit.translation;
  }

  const statements = qs.map((q) => {
    const splitIdx = q.q.lastIndexOf('\n\n');
    const statement = (splitIdx !== -1 ? q.q.slice(splitIdx + 2) : q.q).trim();
    const { cleanExplanation } = splitTranslation(q.e || '');
    return {
      p: q.p,
      displayNumber: q.p,
      statement,
      answer: (q.a || '').trim().slice(0, 1).toUpperCase(),
      explanation: cleanExplanation,
    };
  });

  return {
    title,
    paragraphs,
    statements,
    restoredFromRawHtml,
    translation,
  };
}

function parseLongReadings(
  qs: RawQuestion[],
  htmlGroups: Array<{ lines: string[]; joined: string; qnums: number[]; rawOffset: number }>,
  rawHtml: string | null
) {
  if (qs.length === 0) return [];
  const qByP = new Map(qs.map((q) => [q.p, q]));
  const matched: Array<{ qs: RawQuestion[]; g: (typeof htmlGroups)[number] }> = [];

  for (const g of htmlGroups) {
    const groupQs = g.qnums.map((n) => qByP.get(n)).filter((x): x is RawQuestion => Boolean(x));
    if (groupQs.length >= 5 && g.joined.length >= 1800) {
      matched.push({ qs: groupQs, g });
    }
  }

  if (matched.length > 0) {
    return matched
      .map((m) => parseSingleLongReading(m.qs, m.g, rawHtml))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }

  // Fallback for CET-6 where qnums may differ slightly: pick first html group with >=8 paragraphs
  let fallbackGroup: (typeof htmlGroups)[number] | null = null;
  for (const g of htmlGroups) {
    if (g.joined.length >= 2000 && parseLongReadingParagraphs(g.lines).paragraphs.length >= 8) {
      fallbackGroup = g;
      break;
    }
  }
  const single = parseSingleLongReading(qs, fallbackGroup, rawHtml);
  return single ? [single] : [];
}

function parseListening(
  qs: RawQuestion[],
  paperId: string,
  level: CetLevel,
  audioManifest: AudioManifestItem[]
) {
  if (qs.length === 0) return [];

  const startIndices: number[] = [];
  const threshold = level === 'cet4' ? 220 : 350;
  qs.forEach((q, idx) => {
    const e = q.e || '';
    const before = e.split('[解析]')[0] || '';
    if (before.length > threshold) {
      startIndices.push(idx);
    }
  });

  if (startIndices.length === 0) {
    startIndices.push(0);
  } else if (startIndices[0] !== 0) {
    startIndices.unshift(0);
  }

  const sectionLabels =
    level === 'cet4'
      ? [
          'Section A · 短篇新闻 1',
          'Section A · 短篇新闻 2',
          'Section A · 短篇新闻 3',
          'Section B · 长对话 1',
          'Section B · 长对话 2',
          'Section C · 听力篇章 1',
          'Section C · 听力篇章 2',
          'Section C · 听力篇章 3',
        ]
      : [
          'Section A · 长对话 1',
          'Section A · 长对话 2',
          'Section B · 听力短文 1',
          'Section B · 听力短文 2',
          'Section C · 讲话 / 讲座 1',
          'Section C · 讲话 / 讲座 2',
          'Section C · 讲话 / 讲座 3',
        ];

  const segments = [];
  for (let s = 0; s < startIndices.length; s += 1) {
    const from = startIndices[s];
    const to = s + 1 < startIndices.length ? startIndices[s + 1] : qs.length;
    const slice = qs.slice(from, to);

    const firstE = slice[0]?.e || '';
    const firstBeforeParse = firstE.split('[解析]')[0].replace(/^\[听力原文\]\s*/, '').trim();
    const firstLines = firstBeforeParse.split('\n').map((l) => l.trim()).filter(Boolean);
    let transcript = firstBeforeParse;
    let firstQuestionPrompt = '';
    if (firstLines.length >= 2 && /\?$|[:：]$/.test(firstLines[firstLines.length - 1])) {
      firstQuestionPrompt = firstLines[firstLines.length - 1];
      transcript = firstLines.slice(0, -1).join('\n');
    }

    const audioItem = audioManifest[s] ?? null;
    const audioFile = audioItem?.file ?? null;
    const audioUrl = audioFile
      ? `/api/${level}/audio?id=${encodeURIComponent(paperId)}&file=${encodeURIComponent(audioFile)}`
      : null;

    const parsedQuestions = slice.map((q, qIdx) => {
      const e = q.e || '';
      const parseIdx = e.indexOf('[解析]');
      const before =
        parseIdx !== -1 ? e.slice(0, parseIdx).replace(/^\[听力原文\]\s*/, '').trim() : '';
      const explanation = parseIdx !== -1 ? e.slice(parseIdx + '[解析]'.length).trim() : e.trim();
      let questionPrompt = qIdx === 0 ? firstQuestionPrompt : before;
      if (questionPrompt.length > 260) {
        const lns = questionPrompt.split('\n').map((l) => l.trim()).filter(Boolean);
        questionPrompt = lns[lns.length - 1] || '';
      }

      return {
        p: q.p,
        displayNumber: from + qIdx + 1,
        options: (q.o ?? []).map((o) => ({ key: o.key.trim().toUpperCase(), text: o.text.trim() })),
        answer: (q.a || '').trim().slice(0, 1).toUpperCase(),
        questionPrompt,
        explanation,
      };
    });

    segments.push({
      index: s + 1,
      sectionLabel: sectionLabels[s] ?? `听力段落 ${s + 1}`,
      audioFile,
      audioUrl,
      transcript,
      questions: parsedQuestions,
    });
  }

  return segments;
}

function parseCarefulReading(
  qs: RawQuestion[],
  htmlGroups: Array<{ lines: string[]; joined: string; qnums: number[]; rawOffset: number }>
) {
  if (qs.length === 0) return [];

  // First try grouping directly by HTML passage blocks (exact for CET-4 & 阅读分类真题1!)
  const qByP = new Map(qs.map((q) => [q.p, q]));
  const htmlMatched: Array<{ qs: RawQuestion[]; lines: string[] }> = [];

  for (const g of htmlGroups) {
    const groupQs = g.qnums.map((n) => qByP.get(n)).filter((x): x is RawQuestion => Boolean(x));
    if (groupQs.length >= 3 && g.joined.length >= 400) {
      htmlMatched.push({ qs: groupQs, lines: g.lines });
    }
  }

  if (htmlMatched.length > 0 && htmlMatched.reduce((s, x) => s + x.qs.length, 0) >= qs.length * 0.7) {
    return htmlMatched.map((item, gIdx) => {
      let label = `Passage ${gIdx === 0 ? 'One' : gIdx === 1 ? 'Two' : gIdx + 1}`;
      let paragraphs = item.lines;
      if (paragraphs[0] && /^Passage\s+(One|Two|Three|\d+)/i.test(paragraphs[0])) {
        label = paragraphs[0];
        paragraphs = paragraphs.slice(1);
      }
      const firstSplit = splitTranslation(item.qs[0].e || '');
      const questions = item.qs.map((q) => {
        const idx = q.q.lastIndexOf('\n\n');
        const tail = (idx !== -1 ? q.q.slice(idx + 2) : q.q).trim();
        const stem = tail
          .replace(/_{2,}\s*A\.[\s\S]*$/m, '')
          .replace(/\s*A\.[\s\S]*$/m, '')
          .trim();
        const { cleanExplanation } = splitTranslation(q.e || '');
        return {
          p: q.p,
          displayNumber: q.p,
          stem: stem || `第 ${q.p} 题`,
          options: (q.o ?? []).map((o) => ({ key: o.key.trim().toUpperCase(), text: o.text.trim() })),
          answer: (q.a || '').trim().slice(0, 1).toUpperCase(),
          explanation: cleanExplanation,
        };
      });
      return {
        index: gIdx + 1,
        label,
        paragraphs,
        questions,
        translation: firstSplit.translation,
      };
    });
  }

  // Standard CET-6 path: passage embedded in q before last "\n\n"
  const groups: RawQuestion[][] = [];
  let currentKey = '';
  for (const q of qs) {
    const splitIdx = q.q.lastIndexOf('\n\n');
    const prefix = splitIdx !== -1 ? q.q.slice(0, splitIdx).trim() : q.q.slice(0, 180);
    const key = prefix.slice(0, 120);
    if (groups.length === 0 || key !== currentKey) {
      groups.push([q]);
      currentKey = key;
    } else {
      groups[groups.length - 1].push(q);
    }
  }

  return groups.map((group, gIdx) => {
    const firstQ = group[0].q;
    const splitIdx = firstQ.lastIndexOf('\n\n');
    const rawPassage = splitIdx !== -1 ? firstQ.slice(0, splitIdx).trim() : '';
    const cleanedLines = rawPassage
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let label = `Passage ${gIdx === 0 ? 'One' : gIdx === 1 ? 'Two' : gIdx + 1}`;
    let paragraphs = cleanedLines;
    if (cleanedLines[0] && /^Passage\s+(One|Two|Three|\d+)/i.test(cleanedLines[0])) {
      label = cleanedLines[0];
      paragraphs = cleanedLines.slice(1);
    }

    const firstSplit = splitTranslation(group[0].e || '');

    const questions = group.map((q) => {
      const idx = q.q.lastIndexOf('\n\n');
      const tail = (idx !== -1 ? q.q.slice(idx + 2) : q.q).trim();
      const stem = tail
        .replace(/_{2,}\s*A\.[\s\S]*$/m, '')
        .replace(/\nA\.[\s\S]*$/m, '')
        .trim();
      const { cleanExplanation } = splitTranslation(q.e || '');
      return {
        p: q.p,
        displayNumber: q.p,
        stem: stem || `第 ${q.p} 题`,
        options: (q.o ?? []).map((o) => ({ key: o.key.trim().toUpperCase(), text: o.text.trim() })),
        answer: (q.a || '').trim().slice(0, 1).toUpperCase(),
        explanation: cleanExplanation,
      };
    });

    return {
      index: gIdx + 1,
      label,
      paragraphs,
      questions,
      translation: firstSplit.translation,
    };
  });
}

async function loadParsedPaper(level: CetLevel, paperId: string) {
  const cacheKey = `${level}:${paperId}`;
  if (parsedPaperCache.has(cacheKey)) {
    return parsedPaperCache.get(cacheKey);
  }
  await buildCatalog(level);
  const entry = catalogMap[level]?.get(paperId);
  if (!entry) return null;

  const rawText = await fs.readFile(path.join(entry.dirPath, '题目.json'), 'utf-8');
  const qs = JSON.parse(rawText) as RawQuestion[];

  let audioManifest: AudioManifestItem[] = [];
  const manifestPath = path.join(entry.dirPath, '音频', '音频清单.json');
  if (existsSync(manifestPath)) {
    try {
      audioManifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8')) as AudioManifestItem[];
    } catch {
      audioManifest = [];
    }
  }

  let rawHtml: string | null = null;
  if (entry.examId) {
    const htmlPath = path.join(LEVEL_CONFIG[level].rawHtmlDir, `exam-${entry.examId}.html`);
    if (existsSync(htmlPath)) {
      try {
        rawHtml = await fs.readFile(htmlPath, 'utf-8');
      } catch {
        rawHtml = null;
      }
    }
  }

  const htmlGroups = rawHtml ? extractHtmlPassageGroups(rawHtml) : [];

  let writing: { p: number; prompt: string; modelEssay: string; explanation: string } | null = null;
  const listeningRaw: RawQuestion[] = [];
  const bankedRaw: RawQuestion[] = [];
  const longReadingRaw: RawQuestion[] = [];
  const carefulRaw: RawQuestion[] = [];
  const translations: Array<{ p: number; prompt: string; reference: string; explanation: string }> = [];

  for (const q of qs) {
    if (q.t === 'short_answer') {
      if (q.p === 1 && /Directions:|essay|write/i.test(q.q)) {
        writing = {
          p: q.p,
          prompt: q.q.trim(),
          modelEssay: (q.a || '').replace(/^\[范文\]\s*/, '').trim(),
          explanation: (q.e || '')
            .replace(/^\[解析\]\s*/, '')
            .replace(/结构框图[：:]?\s*$/, '')
            .trim(),
        };
      } else {
        translations.push({
          p: q.p,
          prompt: q.q.trim(),
          reference: (q.a || '').replace(/^\[参考译文\]\s*/, '').trim(),
          explanation: (q.e || '').replace(/^\[解析\]\s*/, '').trim(),
        });
      }
    } else if (q.t === 'single_choice') {
      const isListening =
        (q.e || '').includes('[听力原文]') || (q.q.length < 400 && /^A\./.test(q.q.trim()));
      if (isListening) {
        listeningRaw.push(q);
      } else {
        carefulRaw.push(q);
      }
    } else if (q.t === 'fill_blank') {
      const isBanked = /第\s*\d+\s*题\s*$/.test(q.q.trim()) || /\nA\.[a-z]/i.test(q.q);
      if (isBanked) {
        bankedRaw.push(q);
      } else {
        longReadingRaw.push(q);
      }
    }
  }

  const { dirPath: _omit, ...meta } = entry;
  void _omit;

  const bankedClozes = parseBankedClozes(bankedRaw, htmlGroups);
  const longReadings = parseLongReadings(longReadingRaw, htmlGroups, rawHtml);

  const parsed = {
    meta,
    writing,
    listening: parseListening(listeningRaw, entry.id, level, audioManifest),
    bankedCloze: bankedClozes[0] ?? null,
    bankedClozes,
    longReading: longReadings[0] ?? null,
    longReadings,
    carefulReading: parseCarefulReading(carefulRaw, htmlGroups),
    translations,
  };

  parsedPaperCache.set(cacheKey, parsed);
  return parsed;
}

function registerLevelRoutes(
  middlewares: {
    use: (
      path: string,
      handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
    ) => void;
  },
  level: CetLevel
) {
  const cfg = LEVEL_CONFIG[level];

  middlewares.use(`/api/${level}/index`, (_req, res) => {
    buildCatalog(level)
      .then((list) => {
        const publicList = list.map(({ dirPath: _d, ...rest }) => {
          void _d;
          return rest;
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            ok: true,
            sourceDir: cfg.rootDir,
            rawHtmlAvailable: existsSync(cfg.rawHtmlDir),
            totalPapers: publicList.length,
            papers: publicList,
          })
        );
      })
      .catch((err: unknown) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
      });
  });

  middlewares.use(`/api/${level}/paper`, (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const paperId = url.searchParams.get('id') || '';
    if (!paperId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Missing id parameter' }));
      return;
    }

    loadParsedPaper(level, paperId)
      .then((paper) => {
        if (!paper) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Paper not found' }));
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, paper }));
      })
      .catch((err: unknown) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
      });
  });

  middlewares.use(`/api/${level}/audio`, (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const paperId = url.searchParams.get('id') || '';
    const file = url.searchParams.get('file') || '';

    const safeFile = path.basename(file);
    if (!paperId || !safeFile || safeFile !== file || !safeFile.toLowerCase().endsWith('.mp3')) {
      res.statusCode = 400;
      res.end('Invalid audio request');
      return;
    }

    buildCatalog(level)
      .then(async () => {
        const entry = catalogMap[level]?.get(paperId);
        if (!entry) {
          res.statusCode = 404;
          res.end('Paper not found');
          return;
        }
        const audioPath = path.join(entry.dirPath, '音频', safeFile);
        if (!existsSync(audioPath)) {
          res.statusCode = 404;
          res.end('Audio file not found');
          return;
        }

        const stat = await fs.stat(audioPath);
        const total = stat.size;
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        if (range) {
          const match = range.match(/bytes=(\d*)-(\d*)/);
          const start = match && match[1] ? Number(match[1]) : 0;
          const end = match && match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
          if (start >= total || start > end) {
            res.statusCode = 416;
            res.setHeader('Content-Range', `bytes */${total}`);
            res.end();
            return;
          }
          res.statusCode = 206;
          res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
          res.setHeader('Content-Length', String(end - start + 1));
          createReadStream(audioPath, { start, end }).pipe(res);
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Length', String(total));
          createReadStream(audioPath).pipe(res);
        }
      })
      .catch(() => {
        res.statusCode = 500;
        res.end('Internal audio streaming error');
      });
  });
}

export function cet6LocalServerPlugin(): Plugin {
  return {
    name: 'studypulse-cet-server',
    configureServer(server) {
      registerLevelRoutes(server.middlewares, 'cet6');
      registerLevelRoutes(server.middlewares, 'cet4');
    },
    configurePreviewServer(server) {
      registerLevelRoutes(server.middlewares, 'cet6');
      registerLevelRoutes(server.middlewares, 'cet4');
    },
  };
}
