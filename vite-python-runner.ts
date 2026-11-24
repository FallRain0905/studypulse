import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { Plugin } from 'vite';

interface RunBody {
  code?: string;
  entryFile?: string;
  stdin?: string;
  files?: Record<string, string>;
  readOutputFile?: string;
}

interface CheckBody {
  code?: string;
  filename?: string;
}

function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? (JSON.parse(raw) as T) : ({} as T));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function safeFileName(name: string): string | null {
  const base = path.basename(name).trim();
  if (!base || base !== name || base.includes('..') || /[<>:"|?*\\/]/.test(base)) {
    return null;
  }
  return base;
}

async function executePython(body: RunBody) {
  const entry = safeFileName(body.entryFile || 'main.py') || 'main.py';
  const code = typeof body.code === 'string' ? body.code : '';
  const stdin = typeof body.stdin === 'string' ? body.stdin : '';
  const files = body.files && typeof body.files === 'object' ? body.files : {};
  const readOutputFile =
    typeof body.readOutputFile === 'string' ? safeFileName(body.readOutputFile) : null;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pypulse-run-'));
  const start = Date.now();

  try {
    const initialSnapshots = new Map<string, string>();
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

    const result = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
      timedOut: boolean;
    }>((resolve) => {
      const proc = spawn('python', ['-X', 'utf8', entry], {
        cwd: tmpDir,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill();
      }, 6000);

      proc.stdout.on('data', (d: Buffer) => {
        if (stdout.length < 120_000) stdout += d.toString('utf-8');
      });
      proc.stderr.on('data', (d: Buffer) => {
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

    let outputFileContent: string | null = null;
    if (readOutputFile) {
      try {
        const raw = await fs.readFile(path.join(tmpDir, readOutputFile), 'utf-8');
        outputFileContent = raw.replace(/^\uFEFF/, '');
      } catch {
        outputFileContent = null;
      }
    }

    const createdFiles: Record<string, string> = {};
    const changedFiles: Record<string, string> = {};
    try {
      const entries = await fs.readdir(tmpDir);
      for (const name of entries) {
        if (name === '__pycache__') continue;
        const full = path.join(tmpDir, name);
        const stat = await fs.stat(full);
        if (stat.isFile() && stat.size <= 150_000) {
          const raw = (await fs.readFile(full, 'utf-8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
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
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function checkPythonSyntax(body: CheckBody) {
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

  return new Promise<{ ok: boolean; diagnostics: unknown[] }>((resolve) => {
    const proc = spawn('python', ['-X', 'utf8', '-c', checkerScript], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ ok: true, diagnostics: [] });
    }, 2500);

    proc.stdout.on('data', (d: Buffer) => {
      out += d.toString('utf-8');
    });
    proc.on('error', () => {
      clearTimeout(timer);
      resolve({ ok: true, diagnostics: [] });
    });
    proc.on('close', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(out) as { ok: boolean; diagnostics: unknown[] });
      } catch {
        resolve({ ok: true, diagnostics: [] });
      }
    });
    proc.stdin.write(code, 'utf-8');
    proc.stdin.end();
  });
}

function attachMiddleware(middlewares: {
  use: (
    path: string,
    handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
  ) => void;
}) {
  middlewares.use('/api/run-python', (req, res, next) => {
    if (req.method !== 'POST') {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ status: 'ready', runtime: 'local-python' }));
        return;
      }
      next();
      return;
    }

    readJsonBody<RunBody>(req)
      .then((body) => executePython(body))
      .then((payload) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(payload));
      })
      .catch((err: unknown) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            ok: false,
            stdout: '',
            stderr: err instanceof Error ? err.message : String(err),
            exitCode: -1,
            durationMs: 0,
          })
        );
      });
  });

  middlewares.use('/api/check-python', (req, res, next) => {
    if (req.method !== 'POST') {
      next();
      return;
    }
    readJsonBody<CheckBody>(req)
      .then((body) => checkPythonSyntax(body))
      .then((payload) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(payload));
      })
      .catch(() => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, diagnostics: [] }));
      });
  });
}

export function pythonRunnerPlugin(): Plugin {
  return {
    name: 'pypulse-python-runner',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}
