import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const CET_DATA_DIRS = {
  cet6: process.env.CET6_DATA_DIR || path.join(__dirname, 'cet6-data'),
  cet4: process.env.CET4_DATA_DIR || path.join(__dirname, 'cet4-data'),
};
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3456);
const BASE_PREFIX = (process.env.BASE_PREFIX ?? '').replace(/\/+$/, '');
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

let activeExecutions = 0;
const MAX_CONCURRENT = 6;

// Cached CET-4 & CET-6 catalogs & pre-parsed papers (strictly read-only)
const cetCatalogCache = { cet4: null, cet6: null };
const cetSlugById = { cet4: null, cet6: null };
const cetPaperCache = new Map();

async function loadCetCatalog(level) {
  if (cetCatalogCache[level] && cetSlugById[level]) {
    return { catalog: cetCatalogCache[level], slugById: cetSlugById[level] };
  }
  const dir = CET_DATA_DIRS[level];
  const indexPath = path.join(dir, 'index.json');
  if (!existsSync(indexPath)) {
    return { catalog: null, slugById: new Map() };
  }
  const raw = await fs.readFile(indexPath, 'utf-8');
  const parsed = JSON.parse(raw);
  cetCatalogCache[level] = parsed;
  cetSlugById[level] = new Map(Object.entries(parsed.slugById || {}));
  return { catalog: cetCatalogCache[level], slugById: cetSlugById[level] };
}

async function loadCetPaper(level, paperId) {
  const key = `${level}:${paperId}`;
  if (cetPaperCache.has(key)) return cetPaperCache.get(key);
  const { slugById } = await loadCetCatalog(level);
  const slug = slugById.get(paperId);
  if (!slug) return null;
  const pPath = path.join(CET_DATA_DIRS[level], 'papers', `${slug}.json`);
  if (!existsSync(pPath)) return null;
  const paper = JSON.parse(await fs.readFile(pPath, 'utf-8'));
  cetPaperCache.set(key, paper);
  return paper;
}

function safeFileName(name) {
  if (typeof name !== 'string') return null;
  const base = path.basename(name).trim();
  if (!base || base !== name || base.includes('..') || /[<>:"|?*\\/]/.test(base)) {
    return null;
  }
  return base;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 512 * 1024) {
        reject(new Error('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function executePython(body) {
  if (activeExecutions >= MAX_CONCURRENT) {
    return {
      ok: false,
      stdout: '',
      stderr: '服务器当前并发运行任务较多，请 1 秒后重试。',
      exitCode: -1,
      durationMs: 0,
    };
  }
  activeExecutions += 1;

  const entry = safeFileName(body.entryFile || 'main.py') || 'main.py';
  const code = typeof body.code === 'string' ? body.code : '';
  const stdin = typeof body.stdin === 'string' ? body.stdin : '';
  const files = body.files && typeof body.files === 'object' ? body.files : {};
  const readOutputFile =
    typeof body.readOutputFile === 'string' ? safeFileName(body.readOutputFile) : null;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pypulse-prod-'));
  const start = Date.now();

  try {
    const initialSnapshots = new Map();
    for (const [fname, content] of Object.entries(files)) {
      const safe = safeFileName(fname);
      if (safe && typeof content === 'string') {
        await fs.writeFile(path.join(tmpDir, safe), content, 'utf-8');
        initialSnapshots.set(safe, content.replace(/\r\n/g, '\n'));
      }
    }

    if (code || !initialSnapshots.has(entry)) {
      await fs.writeFile(path.join(tmpDir, entry), code, 'utf-8');
      initialSnapshots.set(entry, code.replace(/\r\n/g, '\n'));
    }

    // Apply POSIX resource limits on Linux via a lightweight bootstrapper
    const runnerBootstrap = `
import os, runpy, sys
try:
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
    resource.setrlimit(resource.RLIMIT_FSIZE, (2 * 1024 * 1024, 2 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
except Exception:
    pass
sys.path.insert(0, os.getcwd())
runpy.run_path(${JSON.stringify(entry)}, run_name="__main__")
`;

    const result = await new Promise((resolve) => {
      const proc = spawn(PYTHON_BIN, ['-I', '-X', 'utf8', '-c', runnerBootstrap], {
        cwd: tmpDir,
        env: {
          PATH: process.env.PATH || '/usr/bin:/bin',
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          LANG: 'C.UTF-8',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGKILL');
      }, 6000);

      proc.stdout.on('data', (d) => {
        if (stdout.length < 120_000) stdout += d.toString('utf-8');
      });
      proc.stderr.on('data', (d) => {
        if (stderr.length < 120_000) stderr += d.toString('utf-8');
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({ stdout, stderr: err.message, exitCode: -1, timedOut: false });
      });

      proc.on('close', (exitCode) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode, timedOut });
      });

      if (stdin) {
        proc.stdin.write(stdin, 'utf-8');
      }
      proc.stdin.end();
    });

    let outputFileContent = null;
    if (readOutputFile) {
      try {
        const raw = await fs.readFile(path.join(tmpDir, readOutputFile), 'utf-8');
        outputFileContent = raw.replace(/^\uFEFF/, '');
      } catch {
        outputFileContent = null;
      }
    }

    const createdFiles = {};
    const changedFiles = {};
    try {
      const entries = await fs.readdir(tmpDir);
      for (const name of entries) {
        if (name === '__pycache__') continue;
        const full = path.join(tmpDir, name);
        const stat = await fs.stat(full);
        if (stat.isFile() && stat.size <= 150_000) {
          const raw = (await fs.readFile(full, 'utf-8'))
            .replace(/^\uFEFF/, '')
            .replace(/\r\n/g, '\n');
          if (!initialSnapshots.has(name)) {
            createdFiles[name] = raw;
            changedFiles[name] = raw;
          } else if (initialSnapshots.get(name) !== raw) {
            changedFiles[name] = raw;
          }
        }
      }
    } catch {
      // ignore
    }

    const durationMs = Date.now() - start;
    const finalStderr = result.timedOut
      ? `${result.stderr}\n[TimeoutError] 代码运行超过 6 秒已自动中止，请检查是否存在死循环或缺少 stdin 输入！`.trim()
      : result.stderr;

    return {
      ok: !result.timedOut && result.exitCode === 0,
      stdout: result.stdout.replace(/\r\n/g, '\n'),
      stderr: finalStderr.replace(/\r\n/g, '\n'),
      exitCode: result.exitCode,
      durationMs,
      outputFileContent: outputFileContent?.replace(/\r\n/g, '\n') ?? null,
      createdFiles,
      changedFiles,
    };
  } finally {
    activeExecutions -= 1;
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function checkPythonSyntax(body) {
  const code = typeof body.code === 'string' ? body.code : '';
  const filename = safeFileName(body.filename || 'main.py') || 'main.py';

  const checkerScript = `
import ast, json, sys
src = sys.stdin.read()
try:
    ast.parse(src, filename=${JSON.stringify(filename)})
    print(json.dumps({"ok": True, "diagnostics": []}))
except SyntaxError as e:
    print(json.dumps({
        "ok": False,
        "diagnostics": [{
            "line": e.lineno or 1,
            "col": e.offset or 1,
            "endLine": getattr(e, "end_lineno", None) or (e.lineno or 1),
            "endCol": getattr(e, "end_offset", None) or ((e.offset or 1) + 1),
            "message": f"{e.__class__.__name__}: {e.msg}",
            "severity": "error"
        }]
    }, ensure_ascii=False))
`;

  return new Promise((resolve) => {
    const proc = spawn(PYTHON_BIN, ['-I', '-X', 'utf8', '-c', checkerScript], {
      env: { PATH: process.env.PATH || '/usr/bin:/bin', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve({ ok: true, diagnostics: [] });
    }, 2500);

    proc.stdout.on('data', (d) => {
      out += d.toString('utf-8');
    });
    proc.on('error', () => {
      clearTimeout(timer);
      resolve({ ok: true, diagnostics: [] });
    });
    proc.on('close', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve({ ok: true, diagnostics: [] });
      }
    });
    proc.stdin.write(code, 'utf-8');
    proc.stdin.end();
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function stripBasePrefix(urlPath) {
  if (BASE_PREFIX && (urlPath === BASE_PREFIX || urlPath.startsWith(`${BASE_PREFIX}/`))) {
    const rest = urlPath.slice(BASE_PREFIX.length);
    return rest || '/';
  }
  return urlPath;
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const cleanPath = stripBasePrefix(decodeURIComponent(parsedUrl.pathname));

    if (cleanPath === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, { status: 'ok', service: 'pypulse', python: PYTHON_BIN });
      return;
    }

    if (cleanPath === '/api/run-python') {
      if (req.method === 'GET') {
        sendJson(res, 200, { status: 'ready', runtime: 'server-python3' });
        return;
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = await executePython(body);
        sendJson(res, 200, result);
        return;
      }
    }

    if (cleanPath === '/api/check-python' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await checkPythonSyntax(body);
      sendJson(res, 200, result);
      return;
    }

    // ===== CET-4 & CET-6 Read-Only Pre-Parsed Catalog, Papers & Range Audio Streaming =====
    const cetRouteMatch = cleanPath.match(/^\/api\/(cet4|cet6)\/(index|paper|audio)$/);
    if (cetRouteMatch) {
      const level = cetRouteMatch[1];
      const action = cetRouteMatch[2];

      if (action === 'index' && req.method === 'GET') {
        const { catalog } = await loadCetCatalog(level);
        if (!catalog) {
          sendJson(res, 503, {
            ok: false,
            totalPapers: 0,
            papers: [],
            error: `${level.toUpperCase()} 数据目录尚未部署`,
          });
          return;
        }
        sendJson(res, 200, {
          ok: true,
          rawHtmlAvailable: Boolean(catalog.rawHtmlAvailable),
          totalPapers: catalog.papers.length,
          papers: catalog.papers,
        });
        return;
      }

      if (action === 'paper' && req.method === 'GET') {
        const paperId = parsedUrl.searchParams.get('id') || '';
        if (!paperId) {
          sendJson(res, 400, { ok: false, error: 'Missing id parameter' });
          return;
        }
        const paper = await loadCetPaper(level, paperId);
        if (!paper) {
          sendJson(res, 404, { ok: false, error: 'Paper not found' });
          return;
        }
        sendJson(res, 200, { ok: true, paper });
        return;
      }

      if (action === 'audio' && (req.method === 'GET' || req.method === 'HEAD')) {
        const paperId = parsedUrl.searchParams.get('id') || '';
        const file = parsedUrl.searchParams.get('file') || '';
        const safeFile = safeFileName(file);
        if (!paperId || !safeFile || !safeFile.toLowerCase().endsWith('.mp3')) {
          res.statusCode = 400;
          res.end('Invalid audio request');
          return;
        }
        const { slugById } = await loadCetCatalog(level);
        const slug = slugById.get(paperId);
        if (!slug) {
          res.statusCode = 404;
          res.end('Paper not found');
          return;
        }
        const audioPath = path.join(CET_DATA_DIRS[level], 'audio', slug, safeFile);
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
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');

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
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          createReadStream(audioPath, { start, end }).pipe(res);
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Length', String(total));
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        createReadStream(audioPath).pipe(res);
        return;
      }
    }

    // Static file serving from dist/
    let relPath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
    let filePath = path.resolve(DIST_DIR, relPath);
    if (!filePath.startsWith(DIST_DIR)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    let stat = null;
    try {
      stat = await fs.stat(filePath);
    } catch {
      stat = null;
    }

    if (!stat || !stat.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    if (relPath.startsWith('assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
    res.end(content);
  } catch (err) {
    sendJson(res, 500, {
      ok: false,
      stderr: err instanceof Error ? err.message : String(err),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[PyPulse] Production server listening on http://${HOST}:${PORT} (base=${BASE_PREFIX})`);
});
