import type { PythonDiagnostic, PythonRunRequest, PythonRunResponse } from '../types';

interface PyodideInstance {
  FS: {
    writeFile: (path: string, data: string, opts?: { encoding?: string }) => void;
    readFile: (path: string, opts?: { encoding?: string }) => string;
    analyzePath: (path: string) => { exists: boolean };
    readdir: (path: string) => string[];
    unlink: (path: string) => void;
    stat: (path: string) => { mode: number; size: number };
    isFile: (mode: number) => boolean;
  };
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (k: string, v: unknown) => void;
    get: (k: string) => unknown;
  };
}

let pyodidePromise: Promise<PyodideInstance> | null = null;

async function getBrowserPyodide(): Promise<PyodideInstance> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise<PyodideInstance>((resolve, reject) => {
    const win = window as unknown as {
      loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInstance>;
    };

    const boot = () => {
      if (!win.loadPyodide) {
        reject(new Error('Pyodide 加载失败'));
        return;
      }
      win
        .loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/' })
        .then(resolve)
        .catch(reject);
    };

    if (win.loadPyodide) {
      boot();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.js';
    script.async = true;
    script.onload = boot;
    script.onerror = () =>
      reject(
        new Error(
          '当前处于离线单文件模式，无法加载浏览器 Python 引擎（Pyodide）。联网后可直接在单文件 HTML 内运行，或运行本地 启动复习平台.bat 使用本机 Python 3。'
        )
      );
    document.head.appendChild(script);
  }).catch((err) => {
    pyodidePromise = null;
    throw err;
  });
  return pyodidePromise;
}

async function runWithPyodide(req: PythonRunRequest): Promise<PythonRunResponse> {
  const start = Date.now();
  try {
    const py = await getBrowserPyodide();
    const entry = req.entryFile || 'main.py';
    const workFiles = { ...(req.files ?? {}), [entry]: req.code };
    const beforeMap = new Map<string, string>();

    for (const [name, content] of Object.entries(workFiles)) {
      py.FS.writeFile(name, content, { encoding: 'utf8' });
      beforeMap.set(name, content.replace(/\r\n/g, '\n'));
    }

    if (req.readOutputFile && !workFiles[req.readOutputFile] && py.FS.analyzePath(req.readOutputFile).exists) {
      try {
        py.FS.unlink(req.readOutputFile);
      } catch {
        // ignore
      }
    }

    py.globals.set('__pypulse_code__', req.code);
    py.globals.set('__pypulse_entry__', entry);
    py.globals.set('__pypulse_stdin__', req.stdin ?? '');

    await py.runPythonAsync(`
import sys, io, os, importlib, traceback
if '.' not in sys.path:
    sys.path.insert(0, '.')
importlib.invalidate_caches()
for _mod in list(sys.modules.keys()):
    if os.path.exists(_mod + '.py'):
        del sys.modules[_mod]
_out_buf = io.StringIO()
_err_buf = io.StringIO()
_old_out, _old_err, _old_in = sys.stdout, sys.stderr, sys.stdin
sys.stdout, sys.stderr, sys.stdin = _out_buf, _err_buf, io.StringIO(__pypulse_stdin__)
__pypulse_ok__ = True
try:
    _ns = {"__name__": "__main__", "__file__": __pypulse_entry__}
    exec(compile(__pypulse_code__, __pypulse_entry__, "exec"), _ns)
except BaseException:
    __pypulse_ok__ = False
    traceback.print_exc()
finally:
    sys.stdout, sys.stderr, sys.stdin = _old_out, _old_err, _old_in
__pypulse_stdout__ = _out_buf.getvalue()
__pypulse_stderr__ = _err_buf.getvalue()
`);

    const ok = Boolean(py.globals.get('__pypulse_ok__'));
    const stdout = String(py.globals.get('__pypulse_stdout__') ?? '').replace(/\r\n/g, '\n');
    const stderr = String(py.globals.get('__pypulse_stderr__') ?? '').replace(/\r\n/g, '\n');

    let outputFileContent: string | null = null;
    if (req.readOutputFile && py.FS.analyzePath(req.readOutputFile).exists) {
      outputFileContent = py.FS.readFile(req.readOutputFile, { encoding: 'utf8' })
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n');
    }

    const createdFiles: Record<string, string> = {};
    const changedFiles: Record<string, string> = {};
    try {
      for (const name of py.FS.readdir('.')) {
        if (name === '.' || name === '..' || name === '__pycache__') continue;
        const st = py.FS.stat(name);
        if (!py.FS.isFile(st.mode) || st.size > 150_000) continue;
        const content = py.FS.readFile(name, { encoding: 'utf8' })
          .replace(/^\uFEFF/, '')
          .replace(/\r\n/g, '\n');
        if (!beforeMap.has(name)) {
          createdFiles[name] = content;
          changedFiles[name] = content;
        } else if (beforeMap.get(name) !== content) {
          changedFiles[name] = content;
        }
      }
    } catch {
      // ignore
    }

    return {
      ok,
      stdout,
      stderr,
      exitCode: ok ? 0 : 1,
      durationMs: Date.now() - start,
      outputFileContent,
      createdFiles,
      changedFiles,
      runtime: 'pyodide',
    };
  } catch (err) {
    return {
      ok: false,
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      exitCode: -1,
      durationMs: Date.now() - start,
      runtime: 'pyodide',
    };
  }
}

function apiUrl(endpoint: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}${endpoint.replace(/^\/+/, '')}`;
}

export async function runPythonCode(req: PythonRunRequest): Promise<PythonRunResponse> {
  const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
  if (isFileProtocol) {
    return runWithPyodide(req);
  }

  try {
    const res = await fetch(apiUrl('api/run-python'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (res.ok) {
      const data = (await res.json()) as PythonRunResponse;
      return { ...data, runtime: 'local-python' };
    }
    return runWithPyodide(req);
  } catch {
    return runWithPyodide(req);
  }
}

export async function checkPythonSyntax(
  code: string,
  filename = 'main.py'
): Promise<PythonDiagnostic[]> {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return [];
  }
  try {
    const res = await fetch(apiUrl('api/check-python'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, filename }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { diagnostics?: PythonDiagnostic[] };
    return data.diagnostics ?? [];
  } catch {
    return [];
  }
}

export function normalizeOutput(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
}
